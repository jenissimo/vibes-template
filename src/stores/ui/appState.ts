import { atom } from 'nanostores';

export type AppMode = 'game' | 'scene-editor';

export const appMode = atom<AppMode>('game');

export function setAppMode(mode: AppMode) {
  appMode.set(mode);
}
