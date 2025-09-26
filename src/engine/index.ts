// Core package - основные системы игры
// Unity-подобная архитектура с GameObject/Component

// Core engine classes
export { Component } from './Component';
export { GameObject } from './GameObject';
export { Game } from './Game';

// Render components - компоненты для рендеринга
export * from './components';

// Scene system - управление сценами
export * from './scene';

// Render system - рендеринг и отображение
export * from './render';

// Input system - ввод пользователя
export * from './input';

// Assets system - управление ассетами
export * from './assets';

// Coordinates system - управление координатами
export * from './coordinates';

// UI system - пользовательский интерфейс
export * from './ui';

// Debug system - отладка и диагностика
export * from './debug';

// Registry system - реестр сервисов
export * from './registry';

// Config system - система конфигов
export * from './config';

// Effects system - система эффектов
export * from './effects';

// Prefabs system - система префабов
export * from './prefabs';

// Systems - игровые системы
export * from './systems';