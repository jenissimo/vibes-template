/**
 * Explosion sound generators
 */

export function generateExplosionSound(context: AudioContext, size: number): AudioBuffer {
  const duration = 0.5 + size * 0.5;
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const noise = (Math.random() * 2 - 1) * size;
    const envelope = Math.exp(-t * 3) * (1 - t / duration);
    data[i] = noise * envelope * 0.5;
  }
  
  return buffer;
}

export function generateCrackSound(context: AudioContext, intensity: number): AudioBuffer {
  const duration = 0.15;
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const noise = (Math.random() * 2 - 1) * 0.3;
    const envelope = Math.exp(-t * 8) * (1 - t / duration);
    data[i] = noise * envelope * intensity;
  }
  
  return buffer;
}

export function generateBreakSound(context: AudioContext, intensity: number): AudioBuffer {
  const duration = 0.2;
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const noise = (Math.random() * 2 - 1) * 0.5;
    const envelope = Math.exp(-t * 6) * (1 - t / duration);
    data[i] = noise * envelope * intensity;
  }
  
  return buffer;
}
