/**
 * UI sound generators
 */

export function generateClickSound(context: AudioContext, intensity: number): AudioBuffer {
  const duration = 0.1;
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const frequency = 1000 + Math.sin(t * 50 * Math.PI) * 200;
    const wave = Math.sin(t * frequency * 2 * Math.PI) * 0.2;
    const envelope = Math.exp(-t * 20) * (1 - t / duration);
    data[i] = wave * envelope * intensity;
  }
  
  return buffer;
}

export function generateHoverSound(context: AudioContext, intensity: number): AudioBuffer {
  const duration = 0.05;
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const frequency = 1500;
    const wave = Math.sin(t * frequency * 2 * Math.PI) * 0.1;
    const envelope = Math.exp(-t * 30) * (1 - t / duration);
    data[i] = wave * envelope * intensity;
  }
  
  return buffer;
}

export function generatePurchaseSound(context: AudioContext, intensity: number): AudioBuffer {
  const duration = 0.3;
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const frequency = 800 + t * 400; // Rising frequency
    const wave = Math.sin(t * frequency * 2 * Math.PI) * 0.3;
    const envelope = Math.exp(-t * 4) * (1 - t / duration);
    data[i] = wave * envelope * intensity;
  }
  
  return buffer;
}

export function generateErrorSound(context: AudioContext, intensity: number): AudioBuffer {
  const duration = 0.4;
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const frequency = 200 + Math.sin(t * 10 * Math.PI) * 100;
    const wave = Math.sin(t * frequency * 2 * Math.PI) * 0.4;
    const envelope = Math.exp(-t * 2) * (1 - t / duration);
    data[i] = wave * envelope * intensity;
  }
  
  return buffer;
}

export function generateNotificationSound(context: AudioContext, intensity: number): AudioBuffer {
  const duration = 0.2;
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const frequency = 1000 + Math.sin(t * 40 * Math.PI) * 500;
    const wave = Math.sin(t * frequency * 2 * Math.PI) * 0.3;
    const envelope = Math.exp(-t * 6) * (1 - t / duration);
    data[i] = wave * envelope * intensity;
  }
  
  return buffer;
}
