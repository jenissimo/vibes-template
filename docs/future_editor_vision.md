### Концепция: Data-Driven & Reflection-Based

Главная идея — инспектор должен строиться автоматически на основе данных (компонентов) выбранного объекта. Никакого хардкода. Выбрали объект в сцене -> инспектор "прочитал" его компоненты и их свойства -> сгенерировал UI для редактирования.

Вот пошаговый план, как бы я это реализовывал:

#### 1. Управление состоянием выбора

Всё начинается с того, какой объект выбран. Для этого идеально подходит Nanostores.

Создадим простой стор, который будет хранить ID выбранной сущности (entity).

`src/scene-editor/stores/selection.ts`:
```typescript
import { atom } from 'nanostores';

/**
 * Stores the ID of the currently selected entity in the scene editor.
 * `null` means no entity is selected.
 */
export const $selectedEntityId = atom<number | null>(null);

export function selectEntity(id: number | null) {
  $selectedEntityId.set(id);
}
```

#### 2. Динамический компонент инспектора

Теперь создадим главный Svelte-компонент инспектора, который будет реагировать на изменение выбранного объекта.

`src/scene-editor/ui/Inspector.svelte`:
```svelte
<script lang="ts">
  import { useStore } from '@nanostores/svelte';
  import { $selectedEntityId } from '../stores/selection';
  import { getEntityComponents } from '../-private/ecs-utils'; // Helper to get components
  import ComponentEditor from './ComponentEditor.svelte';

  const selectedEntityId = useStore($selectedEntityId);

  let components = $state([]);

  $effect(() => {
    if (selectedEntityId !== null) {
      // Здесь мы получаем список компонентов для выбранной сущности
      components = getEntityComponents(selectedEntityId);
    } else {
      components = [];
    }
  });
</script>

<div class="inspector-panel">
  {#if components.length > 0}
    <h2>Entity {#selectedEntityId}</h2>
    {#each components as component (component.name)}
      <ComponentEditor {component} entityId={selectedEntityId} />
    {/each}
  {:else}
    <p>No entity selected</p>
  {/if}
</div>
```

#### 3. Метаданные для компонентов (Schema)

Чтобы инспектор знал, какие поля у компонента есть, какого они типа и как их отображать, нам нужна схема или метаданные. Вместо того чтобы вручную писать схемы, мы можем использовать декораторы TypeScript для элегантного описания редактируемых полей прямо в коде компонентов.

Для этого понадобится библиотека `reflect-metadata`.

`package.json` (добавить зависимость):
`bun add reflect-metadata`

`tsconfig.json` (включить опции в `compilerOptions`):
```json
"emitDecoratorMetadata": true,
"experimentalDecorators": true,
```

Создадим декоратор `@editable`:
`src/scene-editor/decorators.ts`:
```typescript
import 'reflect-metadata';

// Определим типы для опций декоратора
export interface EditableOptions {
  label?: string; // Лейбл в инспекторе
  type?: 'number' | 'string' | 'boolean' | 'vector2'; // Тип поля
  step?: number; // Шаг для number инпутов
}

export function editable(options: EditableOptions = {}) {
  return function (target: any, propertyKey: string) {
    // Получаем тип свойства из метаданных TypeScript
    const propertyType = Reflect.getMetadata('design:paramtypes', target, propertyKey);

    // Сохраняем метаданные о редактируемом свойстве
    Reflect.defineMetadata('editable:options', {
      type: options.type || propertyType.name.toLowerCase(),
      ...options,
    }, target, propertyKey);

    // Собираем список всех редактируемых свойств для этого класса
    const properties = Reflect.getMetadata('editable:properties', target) || [];
    if (!properties.includes(propertyKey)) {
      properties.push(propertyKey);
    }
    Reflect.defineMetadata('editable:properties', properties, target);
  };
}
```
*Важно: Я заметил, что у тебя компоненты могут быть не классами. Если это так, подход с декораторами нужно будет адаптировать. Например, хранить схему рядом с определением компонента.*

#### 4. Рендеринг свойств

Теперь самое интересное. Создадим `ComponentEditor.svelte`, который будет использовать метаданные для генерации полей ввода.

`src/scene-editor/ui/ComponentEditor.svelte`:
```svelte
<script lang="ts">
  import 'reflect-metadata'; // Нужен для чтения метаданных
  import { getEditableProperties } from '../-private/ecs-utils'; // Helper
  import PropertyEditor from './PropertyEditor.svelte';

  let { component, entityId } = $props();

  const properties = getEditableProperties(component);
</script>

<div class="component-editor">
  <h3>{component.name}</h3>
  {#each properties as prop}
    <PropertyEditor {entityId} {component} propertyName={prop.name} options={prop.options} />
  {/each}
</div>
```
И, наконец, `PropertyEditor.svelte`, который выбирает нужный инпут на лету:

`src/scene-editor/ui/PropertyEditor.svelte`:
```svelte
<script lang="ts">
  import NumberInput from './inputs/NumberInput.svelte';
  import StringInput from './inputs/StringInput.svelte';
  import BooleanInput from './inputs/BooleanInput.svelte';
  // ... и другие инпуты

  let { entityId, component, propertyName, options } = $props();

  const components = {
    number: NumberInput,
    string: StringInput,
    boolean: BooleanInput,
  };

  const inputComponent = components[options.type] || StringInput; // Fallback
</script>

<div class="property-editor">
  <label>{options.label || propertyName}</label>
  <svelte:component
    this={inputComponent}
    {entityId}
    componentName={component.name}
    {propertyName}
    bind:value={component[propertyName]}
    {options}
  />
</div>
```

### Преимущества этого подхода:

1.  **Расширяемость**: Чтобы добавить поддержку нового типа данных, нужно просто создать новый Svelte-компонент для инпута и добавить его в `PropertyEditor`.
2.  **Data-Driven**: Инспектор всегда синхронизирован с реальными данными компонентов.
3.  **Чистота кода**: Описание UI (лейблы, шаги) находится рядом с данными в компонентах, а не в логике UI.
4.  **Минимум ручной работы**: Добавил новый компонент, пометил поля декоратором `@editable` — и он автоматически появился в инспекторе.

Это архитектурный скелет, но он закладывает правильный, масштабируемый фундамент. Такой инспектор будет служить верой и правдой и не превратится в "костыль" со временем.