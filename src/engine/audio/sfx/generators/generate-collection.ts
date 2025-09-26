/**
 * Collection sound generators
 */

export function generateCoinSound(context: AudioContext, intensity: number): AudioBuffer {
  const duration = 0.2;
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const frequency = 800 + Math.sin(t * 20 * Math.PI) * 200;
    const wave = Math.sin(t * frequency * 2 * Math.PI) * 0.3;
    const envelope = Math.exp(-t * 8) * (1 - t / duration);
    data[i] = wave * envelope * intensity;
  }
  
  return buffer;
}

export function generateOreSound(context: AudioContext, intensity: number): AudioBuffer {
  const duration = 0.25;
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const frequency = 400 + Math.sin(t * 15 * Math.PI) * 100;
    const wave = Math.sin(t * frequency * 2 * Math.PI) * 0.4;
    const envelope = Math.exp(-t * 6) * (1 - t / duration);
    data[i] = wave * envelope * intensity;
  }
  
  return buffer;
}

export function generateEnergySound(context: AudioContext, intensity: number): AudioBuffer {
  const duration = 0.3;
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const frequency = 1200 + Math.sin(t * 25 * Math.PI) * 300;
    const wave = Math.sin(t * frequency * 2 * Math.PI) * 0.2;
    const envelope = Math.exp(-t * 4) * (1 - t / duration);
    data[i] = wave * envelope * intensity;
  }
  
  return buffer;
}

export function generateRareSound(context: AudioContext, intensity: number): AudioBuffer {
  const duration = 0.4;
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const frequency = 600 + Math.sin(t * 30 * Math.PI) * 400;
    const wave = Math.sin(t * frequency * 2 * Math.PI) * 0.5;
    const envelope = Math.exp(-t * 3) * (1 - t / duration);
    data[i] = wave * envelope * intensity;
  }
  
  return buffer;
}
