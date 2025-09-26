# Система настроек игры

Простая система для сохранения настроек игрока с использованием Nanostores.

## Структура

- `profile.ts` - основной store для настроек
- `persistence.ts` - сервис для сохранения/загрузки в localStorage
- `initialization.ts` - сервис инициализации настроек

## Использование

### В компонентах Svelte

```svelte
<script>
  import { settingsActions, settingsSelectors } from '@/stores/game';
  
  // Получить текущие настройки
  let audioSettings = settingsSelectors.audio();
  
  // Подписаться на изменения
  const unsubscribe = settingsStore.subscribe(settings => {
    audioSettings = settings.audio;
  });
  
  // Обновить настройки
  function toggleMusic() {
    settingsActions.updateAudioSettings({ 
      musicEnabled: !audioSettings.musicEnabled 
    });
  }
</script>
```

### В игровой логике

```typescript
import { settingsActions, settingsSelectors } from '@/stores/game';

// Получить настройки
const audioSettings = settingsSelectors.audio();

// Обновить настройки
settingsActions.updateAudioSettings({ 
  musicEnabled: false,
  sfxEnabled: true 
});

// Сбросить все настройки
settingsActions.resetSettings();
```

## Автоматическое сохранение

Настройки автоматически сохраняются в localStorage при изменении с задержкой 1 секунда (debouncing).

## Инициализация

Настройки инициализируются автоматически в `main.ts`:

```typescript
import { settingsInitService } from '@/stores/game';

await settingsInitService.initialize();
```

## Структура данных

```typescript
interface PlayerSettings {
  audio: {
    musicEnabled: boolean;
    sfxEnabled: boolean;
  };
  version: string;
}
```

## События

- `profile-changed` - настройки изменились
- `profile-reset` - настройки сброшены
- `audio-config-changed` - аудио настройки изменились
