// NeonGlowScanlineFilter.ts — Pixi v8
import { Filter, GlProgram } from 'pixi.js';

export interface NeonGlowScanlineOptions {
  glowColor?: number;       // 0xRRGGBB
  innerStrength?: number;   // 0..3 — усиление внутри фигуры
  outerStrength?: number;   // 0..6 — яркость ореола
  radius?: number;          // радиус (px) ореола
  samples?: number;         // 4..16 — количество направлений семплирования
  alphaThreshold?: number;  // 0..1 — игнорировать совсем прозрачные
  scanIntensity?: number;   // 0..1 — сила scanline (влияет ТОЛЬКО на glow)
  scanSpeed?: number;       // >=0 — скорость движения scanline
}

const MAX_SAMPLES = 16;

function rgbFromHex(hex: number): [number, number, number] {
  return [
    ((hex >> 16) & 255) / 255,
    ((hex >> 8) & 255) / 255,
    (hex & 255) / 255,
  ];
}

export class NeonGlowScanlineFilter extends Filter {
  private _time = 0;

  private _glowColor: number;
  private _innerStrength: number;
  private _outerStrength: number;
  private _radius: number;
  private _samples: number;
  private _alphaThreshold: number;
  private _scanIntensity: number;
  private _scanSpeed: number;

  constructor(opts: NeonGlowScanlineOptions = {}) {
    const glowColor     = opts.glowColor      ?? 0x8b5cf6; // неоновая фиолетовая база
    const innerStrength = Math.max(0, opts.innerStrength ?? 0.75);
    const outerStrength = Math.max(0, opts.outerStrength ?? 2.5);
    const radius        = Math.max(0.5, opts.radius      ?? 6.0);
    const samples       = Math.max(4, Math.min(16, Math.round(opts.samples ?? 8))); // было 12
    const alphaThreshold= Math.max(0, Math.min(1, opts.alphaThreshold ?? 0.01));
    const scanIntensity = Math.max(0, Math.min(1, opts.scanIntensity ?? 0.25));
    const scanSpeed     = Math.max(0, opts.scanSpeed ?? 1.6);

    // Стандартный WebGL 1.0 вершинник для фильтров
    const vertex = `
      precision mediump float;
      
      attribute vec2 aPosition;
      varying vec2 vTextureCoord;

      uniform vec4 uInputSize;
      uniform vec4 uOutputFrame;
      uniform vec4 uOutputTexture;

      vec4 filterVertexPosition(void) {
        vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
        position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
        position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
        return vec4(position, 0.0, 1.0);
      }
      vec2 filterTextureCoord(void) {
        return aPosition * (uOutputFrame.zw * uInputSize.zw);
      }
      void main(void) {
        gl_Position = filterVertexPosition();
        vTextureCoord = filterTextureCoord();
      }
    `;

    // Встроенный glow + scanline. Семплируем альфу по окружности (один «ринговый» слой),
    // берём две дистанции (0.5R и 1.0R) для мягкости — почти как мини-гаусс без второго прохода.
    const fragment = `
      precision mediump float;

      varying vec2 vTextureCoord;
      uniform sampler2D uTexture;

      uniform vec4  uInputSize;       // .zw = 1/width,1/height
      uniform vec4  uOutputTexture;   // .y = outHeight (для частоты линий)
      uniform float uTime;

      uniform vec3  uGlowColor;
      uniform float uInnerStrength;
      uniform float uOuterStrength;
      uniform float uRadius;          // px
      uniform float uSamples;         // 4..16
      uniform float uAlphaThreshold;  // 0..1

      uniform float uScanIntensity;   // 0..1
      uniform float uScanSpeed;       // >=0

      const float PI = 3.141592653589793;
      const int   MAX_SAMPLES = ${MAX_SAMPLES};

      void main(void) {
        vec4 base = texture2D(uTexture, vTextureCoord);
        float a = base.a;

        // Выходим быстро, если совсем прозрачный (экономим батарейку)
        if (a <= uAlphaThreshold && uOuterStrength <= 0.0) {
          gl_FragColor = base;
        } else {

        // Шаг текстеля (для смещения на пиксели)
        vec2 texel = uInputSize.zw;

        // -------- OUTER GLOW --------
        float enabledSamples = min(max(uSamples, 1.0), float(MAX_SAMPLES));
        float outerAcc = 0.0;

        // Кольцевое семплирование по направлениям
        for (int i = 0; i < MAX_SAMPLES; i++) {
          float fi = float(i);
          // «включатель» семпла без if
          float on = step(fi + 0.5, enabledSamples);

          // равномерные углы
          float ang = (2.0 * PI) * fi / enabledSamples;
          vec2 dir = vec2(cos(ang), sin(ang));

          // две дистанции: 0.5R и 1.0R — мягче без лишних проходов
          vec2 off1 = dir * texel * (uRadius * 0.5);
          vec2 off2 = dir * texel * (uRadius);

          float a1 = texture2D(uTexture, vTextureCoord + off1).a;
          float a2 = texture2D(uTexture, vTextureCoord + off2).a;

          // учитываем только «выход» за грань от текущей альфы
          outerAcc += on * max(a1 - a, 0.0) * 0.6;
          outerAcc += on * max(a2 - a, 0.0) * 1.0;
        }
        // нормализация
        float outerGlow = outerAcc / enabledSamples;

        // -------- INNER GLOW --------
        // завязка на альфу: чем плотнее пиксель, тем сильнее внутреннее свечение
        float innerGlow = pow(a, 0.5);

        // -------- SCANLINES для glow --------
        float lineFreq = uOutputTexture.y * 0.8; // «плотность строк» от высоты буфера
        float scan = sin(vTextureCoord.y * lineFreq + uTime * uScanSpeed * 100.0);
        scan = pow(0.5 + 0.5 * scan, 2.0);          // 0..1 с «софтом»
        float scanFactor = 1.0 - uScanIntensity * scan;

        // Итоговый glow (только RGB; альфа не трогаем)
        vec3 glow = uGlowColor * (innerGlow * uInnerStrength + outerGlow * uOuterStrength);
        glow *= scanFactor;

        gl_FragColor = vec4(base.rgb + glow, a);
        }
      }
    `;

    super({
      glProgram: new GlProgram({ vertex, fragment }),
      resources: {
        neon: {
          uTime:           { value: 0.0,                       type: 'f32' },
          uGlowColor:      { value: rgbFromHex(glowColor),     type: 'vec3<f32>' },
          uInnerStrength:  { value: innerStrength,             type: 'f32' },
          uOuterStrength:  { value: outerStrength,             type: 'f32' },
          uRadius:         { value: radius,                    type: 'f32' },
          uSamples:        { value: samples,                   type: 'f32' },
          uAlphaThreshold: { value: alphaThreshold,            type: 'f32' },
          uScanIntensity:  { value: scanIntensity,             type: 'f32' },
          uScanSpeed:      { value: scanSpeed,                 type: 'f32' },
        },
      },
    });

    this._glowColor = glowColor;
    this._innerStrength = innerStrength;
    this._outerStrength = outerStrength;
    this._radius = radius;
    this._samples = samples;
    this._alphaThreshold = alphaThreshold;
    this._scanIntensity = scanIntensity;
    this._scanSpeed = scanSpeed;
  }

  // ——— Tick ———
  update(deltaSeconds: number) {
    this._time += deltaSeconds;
    this.resources.neon.uniforms.uTime = this._time;
  }

  public getReloadParams(): NeonGlowScanlineOptions {
    return {
      glowColor: this._glowColor,
      innerStrength: this._innerStrength,
      outerStrength: this._outerStrength,
      radius: this._radius,
      samples: this._samples,
      alphaThreshold: this._alphaThreshold,
      scanIntensity: this._scanIntensity,
      scanSpeed: this._scanSpeed,
    };
  }

  // ——— API ———
  setGlowColor(hex: number) {
    if (this._glowColor === hex) return;
    this._glowColor = hex;
    this.resources.neon.uniforms.uGlowColor = rgbFromHex(hex);
  }
  setInnerStrength(v: number) {
    const x = Math.max(0, v);
    if (x === this._innerStrength) return;
    this._innerStrength = x;
    this.resources.neon.uniforms.uInnerStrength = x;
  }
  setOuterStrength(v: number) {
    const x = Math.max(0, v);
    if (x === this._outerStrength) return;
    this._outerStrength = x;
    this.resources.neon.uniforms.uOuterStrength = x;
  }
  setRadius(px: number) {
    const x = Math.max(0.5, px);
    if (x === this._radius) return;
    this._radius = x;
    this.resources.neon.uniforms.uRadius = x;
  }
  setSamples(n: number) {
    const x = Math.max(4, Math.min(16, Math.round(n)));
    if (x === this._samples) return;
    this._samples = x;
    this.resources.neon.uniforms.uSamples = x;
  }
  setAlphaThreshold(v: number) {
    const x = Math.max(0, Math.min(1, v));
    if (x === this._alphaThreshold) return;
    this._alphaThreshold = x;
    this.resources.neon.uniforms.uAlphaThreshold = x;
  }
  setScanIntensity(v: number) {
    const x = Math.max(0, Math.min(1, v));
    if (x === this._scanIntensity) return;
    this._scanIntensity = x;
    this.resources.neon.uniforms.uScanIntensity = x;
  }
  setScanSpeed(v: number) {
    const x = Math.max(0, v);
    if (x === this._scanSpeed) return;
    this._scanSpeed = x;
    this.resources.neon.uniforms.uScanSpeed = x;
  }
}
