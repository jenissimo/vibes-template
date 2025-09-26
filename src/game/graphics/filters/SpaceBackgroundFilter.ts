// SpaceBackgroundFilter.ts — Pixi v8
import { Filter, GlProgram, Renderer, Application } from 'pixi.js';
import { logger } from '@/engine/logging';

export class SpaceBackgroundFilter extends Filter {
  private _time = 0;
  private _starCount = 50;
  private _starBrightness = 1.2;
  private _nebulaIntensity = 0.4;
  private _twinkleSpeed = 0.8;
  private _scanlineIntensity = 0.0;
  private _scanlineSpeed = 2.0;
  private _aspectRatio = 16 / 9;
  
  // Nebula colors
  private _nebulaColor1: [number, number, number] = [0.05, 0.02, 0.15];
  private _nebulaColor2: [number, number, number] = [0.2, 0.1, 0.4];
  private _nebulaColor3: [number, number, number] = [0.6, 0.3, 0.8];
  private _nebulaColor4: [number, number, number] = [0.9, 0.7, 1.0];

  constructor() {
    // WebGL 1.0 вершинник для фильтров
    const vertex = `
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

    // WebGL 1.0 фрагментный шейдер
    const fragment = `
      precision mediump float;

      varying vec2 vTextureCoord;
      uniform sampler2D uTexture;

      uniform float uTime;
      uniform float uAspectRatio;
      uniform float uStarCount;
      uniform float uStarBrightness;
      uniform float uNebulaIntensity;
      uniform float uTwinkleSpeed;
      uniform float uScanlineIntensity;
      uniform float uScanlineSpeed;
      
      // Nebula colors
      uniform vec3 uNebulaColor1;
      uniform vec3 uNebulaColor2;
      uniform vec3 uNebulaColor3;
      uniform vec3 uNebulaColor4;

      // --- noise / fbm ---
      float random(vec2 st) {
        return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
      }
      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return a + (b - a) * u.x + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      float fbm(vec2 st) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 3; i++) {
          value += amplitude * noise(st);
          st *= 2.1;
          amplitude *= 0.45;
        }
        return value;
      }

      vec2 aspectUV(vec2 uv, float ar) {
        if (ar > 1.0) {
          uv.x = (uv.x - 0.5) * ar + 0.5;
        } else {
          uv.y = (uv.y - 0.5) / ar + 0.5;
        }
        return uv;
      }

      vec3 generateStars(vec2 uv, float starCount, float starBrightness, float twinkleSpeed) {
        vec3 color = vec3(0.0);
        vec2 starUV = uv * (starCount * 1.5);
        vec2 gridIndex = floor(starUV);
        vec2 gridFract = fract(starUV);

        for (int yi = -1; yi <= 1; yi++) {
          for (int xi = -1; xi <= 1; xi++) {
            vec2 ng = gridIndex + vec2(float(xi), float(yi));
            float seed = random(ng);

            // Обычные звезды с пульсацией
            if (seed > 0.96) {
              vec2 starPos = vec2(random(ng.xy), random(ng.yx));
              float dist = distance(gridFract, starPos + vec2(float(xi), float(yi)));
              
              // Многослойная пульсация для реалистичности
              float timeVal = uTime * twinkleSpeed + seed * 15.0;
              float pulse1 = sin(timeVal) * 0.3 + 0.7;
              float pulse2 = sin(timeVal * 1.7 + 2.0) * 0.2 + 0.8;
              float pulse3 = sin(timeVal * 0.3 + 5.0) * 0.1 + 0.9;
              float combinedPulse = pulse1 * pulse2 * pulse3;
              
              // Разные размеры звезд
              float starSize = 0.008 + random(ng.xx) * 0.012;
              float glow = smoothstep(starSize, starSize * 0.3, dist);
              
              // Цвета звезд с вариациями
              vec3 baseColor = vec3(0.8, 0.85, 1.0);
              vec3 warmColor = vec3(1.0, 0.9, 0.7);
              vec3 coolColor = vec3(0.7, 0.9, 1.0);
              
              float colorSeed = random(ng.yx);
              vec3 starColor = mix(baseColor, mix(warmColor, coolColor, colorSeed), 0.6);
              
              color += starColor * glow * starBrightness * combinedPulse;
            }

            // Яркие звезды с сильным пульсированием
            if (seed > 0.998) {
              vec2 starPos = vec2(random(ng.yx), random(ng.xy));
              float timeVal = uTime * twinkleSpeed + seed * 20.0;
              
              // Сложная пульсация с несколькими частотами
              float mainPulse = pow(sin(timeVal) * 0.5 + 0.5, 3.0);
              float subPulse = pow(sin(timeVal * 2.3 + 1.0) * 0.5 + 0.5, 2.0);
              float microPulse = pow(sin(timeVal * 7.0 + 3.0) * 0.5 + 0.5, 4.0);
              float combinedPulse = mainPulse * (0.6 + 0.4 * subPulse) * (0.8 + 0.2 * microPulse);
              
              float dist = distance(gridFract, starPos + vec2(float(xi), float(yi)));
              float glow = smoothstep(0.06, 0.0, dist) * combinedPulse;
              
              // Более яркие цвета для крупных звезд
              vec3 starColor = vec3(1.0, 0.95, 0.8) + 
                             (vec3(0.8, 0.9, 1.0) - vec3(1.0, 0.95, 0.8)) * random(ng);
              
              // Добавляем ореол вокруг ярких звезд
              float halo = smoothstep(0.15, 0.05, dist) * 0.3;
              color += starColor * glow * (2.0 * starBrightness);
              color += starColor * halo * starBrightness * combinedPulse * 0.4;
            }
          }
        }
        return color;
      }

      vec3 generateNebula(vec2 uv, float nebulaIntensity) {
        float time = uTime * 0.02;
        
        // Создаем несколько слоев для более сложной структуры
        vec2 uv_distort1 = uv * 4.0 + vec2(time * 0.3, -time * 0.2);
        vec2 uv_distort2 = uv * 2.5 + vec2(time * 0.15, time * 0.1);
        float distortion1 = fbm(uv_distort1) * 0.6;
        float distortion2 = fbm(uv_distort2) * 0.3;

        // Основной слой туманности
        vec2 uv_main = uv * 1.5 + vec2(-time * 0.1, time * 0.05) + distortion1;
        float nebula_main = fbm(uv_main);

        // Детальный слой
        vec2 uv_detail = uv * 8.0 + time * 0.5 + distortion2;
        float nebula_detail = fbm(uv_detail);

        // Дополнительный слой для глубины
        vec2 uv_depth = uv * 0.8 + time * 0.02;
        float nebula_depth = fbm(uv_depth);

        // Смешиваем слои
        float nebula = nebula_main * 0.6 + nebula_detail * 0.25 + nebula_depth * 0.15;

        // Улучшенное смешивание цветов с более плавными переходами
        float t1 = smoothstep(0.2, 0.4, nebula);
        float t2 = smoothstep(0.4, 0.65, nebula);
        float t3 = smoothstep(0.65, 0.85, nebula);
        
        // Смешиваем цвета с использованием более сложной интерполяции
        vec3 nebulaCol = mix(uNebulaColor1, uNebulaColor2, t1);
        nebulaCol = mix(nebulaCol, uNebulaColor3, t2);
        nebulaCol = mix(nebulaCol, uNebulaColor4, t3);
        
        // Добавляем дополнительное смешивание для более естественного вида
        float depth = smoothstep(0.1, 0.9, nebula_depth);
        nebulaCol = mix(nebulaCol, nebulaCol * 1.2, depth * 0.3);

        // Улучшенное мерцание для более живого эффекта
        float sparkle1 = sin(uv.x * 20.0 + time * 2.0) * sin(uv.y * 15.0 + time * 1.5);
        float sparkle2 = sin(uv.x * 35.0 + time * 3.0) * sin(uv.y * 25.0 + time * 2.5);
        float sparkle3 = sin(uv.x * 50.0 + time * 4.0) * sin(uv.y * 40.0 + time * 3.5);
        
        float combinedSparkle = (sparkle1 * 0.5 + sparkle2 * 0.3 + sparkle3 * 0.2) * 0.08;
        
        // Добавляем цветное мерцание в зависимости от основного цвета туманности
        vec3 sparkleColor = vec3(
            combinedSparkle * (uNebulaColor4.r + 0.2),
            combinedSparkle * (uNebulaColor4.g + 0.2), 
            combinedSparkle * (uNebulaColor4.b + 0.2)
        );
        nebulaCol += sparkleColor;

        // Создаем более естественные края
        float edge = smoothstep(0.2, 0.6, nebula) * smoothstep(0.9, 0.4, nebula);
        return nebulaCol * edge * nebulaIntensity;
      }

      // Убрали кометы - они отвлекали от красивых звезд

      vec3 acesTonemap(vec3 color) {
        color *= 0.8;
        color = (color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14);
        return pow(color, vec3(1.0 / 2.2));
      }

      void main(void) {
        // читаем базовый цвет, если вдруг фильтр сверху картинки
        vec4 base = texture2D(uTexture, vTextureCoord);
        vec2 uv = aspectUV(vTextureCoord, uAspectRatio);

        vec3 color = vec3(0.01, 0.0, 0.02);
        color += generateNebula(uv, uNebulaIntensity);
        color += generateStars(uv, uStarCount, uStarBrightness, uTwinkleSpeed);

        color = acesTonemap(color);

        float vignette = 1.0 - distance(vTextureCoord, vec2(0.5)) * 1.0;
        color *= smoothstep(0.2, 0.7, vignette);

        if (uScanlineIntensity > 0.0) {
          float lineFrequency = 800.0 * 0.8;
          float scanLine = sin((vTextureCoord.y * lineFrequency + uTime * uScanlineSpeed * 100.0)) * 0.5 + 0.5;
          scanLine = pow(scanLine, 2.0);
          float scanEffect = 1.0 - uScanlineIntensity * scanLine;
          color *= scanEffect;
        }

        gl_FragColor = vec4(color, base.a); // сохраняем альфу источника
      }
    `;

    super({
      glProgram: new GlProgram({ vertex, fragment }),
      resources: {
        space: {
          uTime:              { value: 0.0,          type: 'f32' },
          uAspectRatio:       { value: 16 / 9,       type: 'f32' },
          uStarCount:         { value: 50.0,         type: 'f32' },
          uStarBrightness:    { value: 1.2,          type: 'f32' },
          uNebulaIntensity:   { value: 0.4,          type: 'f32' },
          uTwinkleSpeed:      { value: 0.8,          type: 'f32' },
          uScanlineIntensity: { value: 0.0,          type: 'f32' },
          uScanlineSpeed:     { value: 2.0,          type: 'f32' },
          uNebulaColor1:      { value: [0.05, 0.02, 0.15], type: 'vec3<f32>' },
          uNebulaColor2:      { value: [0.2, 0.1, 0.4], type: 'vec3<f32>' },
          uNebulaColor3:      { value: [0.6, 0.3, 0.8], type: 'vec3<f32>' },
          uNebulaColor4:      { value: [0.9, 0.7, 1.0], type: 'vec3<f32>' },
        },
      },
    });
    logger.debug('✅ SpaceBackgroundFilter(v8) создан', { source: 'space-filter' });
  }

  // ——— Ticker ———
  public update(deltaSeconds: number): void {
    this._time += deltaSeconds;
    this.resources.space.uniforms.uTime = this._time;
  }

  // ——— API ———
  public setResolution(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this._aspectRatio = width / height;
    this.resources.space.uniforms.uAspectRatio = this._aspectRatio;
    logger.info(`🎨 SpaceBackgroundFilter: ${width}x${height} (AR=${this._aspectRatio.toFixed(3)})`, { source: 'game' });
  }
  public updateResolution(width: number, height: number) { this.setResolution(width, height); }

  public setStarCount(v: number) {
    const n = Math.max(0, Math.min(80, Math.round(v)));
    if (n === this._starCount) return;
    this._starCount = n;
    this.resources.space.uniforms.uStarCount = n;
  }
  public getStarCount() { return this._starCount; }

  public setStarBrightness(v: number) {
    const n = Math.max(0, Math.min(2, v));
    if (n === this._starBrightness) return;
    this._starBrightness = n;
    this.resources.space.uniforms.uStarBrightness = n;
  }
  public getStarBrightness() { return this._starBrightness; }

  public setNebulaIntensity(v: number) {
    const n = Math.max(0, Math.min(1, v));
    if (n === this._nebulaIntensity) return;
    this._nebulaIntensity = n;
    this.resources.space.uniforms.uNebulaIntensity = n;
  }
  public getNebulaIntensity() { return this._nebulaIntensity; }

  public setTwinkleSpeed(v: number) {
    const n = Math.max(0, Math.min(3, v));
    if (n === this._twinkleSpeed) return;
    this._twinkleSpeed = n;
    this.resources.space.uniforms.uTwinkleSpeed = n;
  }
  public getTwinkleSpeed() { return this._twinkleSpeed; }

  public setScanlineIntensity(v: number) {
    const n = Math.max(0, Math.min(1, v));
    if (n === this._scanlineIntensity) return;
    this._scanlineIntensity = n;
    this.resources.space.uniforms.uScanlineIntensity = n;
  }
  public getScanlineIntensity() { return this._scanlineIntensity; }

  public setScanlineSpeed(v: number) {
    const n = Math.max(0, Math.min(5, v));
    if (n === this._scanlineSpeed) return;
    this._scanlineSpeed = n;
    this.resources.space.uniforms.uScanlineSpeed = n;
  }
  public getScanlineSpeed() { return this._scanlineSpeed; }

  public toggleScanline(): void {
    this.setScanlineIntensity(this._scanlineIntensity > 0 ? 0 : 0.3);
  }

  // --- Nebula Colors API ---
  public setNebulaColors(color1: string, color2: string, color3: string, color4?: string) {
    this._nebulaColor1 = this.hexToRgb(color1);
    this._nebulaColor2 = this.hexToRgb(color2);
    this._nebulaColor3 = this.hexToRgb(color3);
    this._nebulaColor4 = color4 ? this.hexToRgb(color4) : this._nebulaColor4;
    
    this.resources.space.uniforms.uNebulaColor1 = this._nebulaColor1;
    this.resources.space.uniforms.uNebulaColor2 = this._nebulaColor2;
    this.resources.space.uniforms.uNebulaColor3 = this._nebulaColor3;
    this.resources.space.uniforms.uNebulaColor4 = this._nebulaColor4;
  }

  public getNebulaColors() {
    return {
      color1: this.rgbToHex(this._nebulaColor1),
      color2: this.rgbToHex(this._nebulaColor2),
      color3: this.rgbToHex(this._nebulaColor3),
      color4: this.rgbToHex(this._nebulaColor4)
    };
  }

  // --- Color conversion helpers ---
  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [0, 0, 0];
    return [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ];
  }

  private rgbToHex(rgb: [number, number, number]): string {
    const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
    return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
  }

  public enableDebugMode(): void {
    this.setNebulaIntensity(0.8);
    this.setStarCount(40);
    this.setStarBrightness(1.4);
    logger.info('🔧 SpaceBackgroundFilter: debug mode ON', { source: 'game' });
  }
  public disableDebugMode(): void {
    this.setNebulaIntensity(0.4);
    this.setStarCount(50);
    this.setStarBrightness(1.2);
    logger.info('🔧 SpaceBackgroundFilter: debug mode OFF', { source: 'game' });
  }

  // Удобный хелпер — синхронизируем AR с рендерером (дернуть на старте/ресайзе)
  public syncToRenderer(renderer: Renderer) {
    this.setResolution(renderer.width, renderer.height);
  }

  // Фабрика под приложение
  public static createForApp(app: Application): SpaceBackgroundFilter {
    const filter = new SpaceBackgroundFilter();
    filter.setResolution(app.screen.width, app.screen.height);
    (app.renderer as any).on?.('resize', (w: number, h: number) => filter.setResolution(w, h));
    return filter;
  }
}
