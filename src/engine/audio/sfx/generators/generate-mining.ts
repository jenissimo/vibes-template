/**
 * Mining sound generators
 */

export function generateMiningSound(context: AudioContext, intensity: number): AudioBuffer {
  const duration = 0.1 + intensity * 0.2;
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const noise = (Math.random() * 2 - 1) * intensity;
    const envelope = Math.exp(-t * 10) * (1 - t / duration);
    data[i] = noise * envelope * 0.3;
  }
  
  return buffer;
}


export function generateDrillSound(context: AudioContext, intensity: number): AudioBuffer {
  const duration = 0.5;
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const frequency = 300 + Math.sin(t * 100 * Math.PI) * 100;
    const wave = Math.sin(t * frequency * 2 * Math.PI) * 0.2;
    const envelope = Math.exp(-t * 2) * (1 - t / duration);
    data[i] = wave * envelope * intensity;
  }
  
  return buffer;
}


