# Debug Console Service

Консольная система отладки для инспекции ECS и PixiJS сцены в реальном времени.

## Использование

После запуска игры, откройте консоль браузера (F12) и используйте команды:

```javascript
// Показать справку
debug.help()

// ECS команды
debug.entities()           // Список всех entities
debug.entity(123)          // Детали конкретного entity
debug.components()         // Статистика компонентов
debug.systems()            // Список активных систем

// PixiJS команды  
debug.pixi()               // Общая информация о сцене
debug.containers()         // Структура контейнеров
debug.sprites()            // Список всех спрайтов
debug.filters()            // Список фильтров

// Игровые команды
debug.game()               // Состояние игровой логики
debug.resources()          // Текущие ресурсы
debug.upgrades()           // Текущие апгрейды

// Утилиты
debug.clear()              // Очистить консоль
debug.fps()                // Показать FPS
```

## Примеры

### Инспекция астероидов
```javascript
// Найти все астероиды
debug.entities()

// Посмотреть детали конкретного астероида
debug.entity(42)

// Посмотреть все спрайты в сцене
debug.sprites()
```

### Отладка производительности
```javascript
// Проверить FPS
debug.fps()

// Посмотреть количество entities
debug.entities()

// Посмотреть структуру PixiJS
debug.containers()
```

### Игровое состояние
```javascript
// Проверить ресурсы
debug.resources()

// Проверить апгрейды
debug.upgrades()

// Проверить игровую логику
debug.game()
```

## Архитектура

DebugConsoleService интегрирован в GameApp и автоматически инициализируется при запуске игры. Он получает доступ к:

- **ECS**: Через GameScene.getEntities() и GameScene.getSystems()
- **PixiJS**: Через ServiceRegistry (PixiApp, контейнеры, RenderSystem)
- **Игровая логика**: Через GameLogicService
- **Состояние игры**: Через Nanostores (resources, upgrades)

Все команды безопасны и не влияют на игровой процесс.
