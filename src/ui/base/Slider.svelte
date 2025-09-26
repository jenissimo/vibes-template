<!-- Slider Component -->
<script lang="ts">
  export let value: number = 0;
  export let min: number = 0;
  export let max: number = 100;
  export let step: number = 1;
  export let disabled: boolean = false;
  export let id: string | undefined = undefined;
  export let extraClass: string = '';
  export let onChange: (value: number) => void = () => undefined;
  export let showInput: boolean = false; // Новый проп для показа input поля
  export let inputWidth: string = 'w-16'; // Ширина input поля

  function handleSliderInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = parseFloat(target.value);
    value = newValue;
    onChange(newValue);
  }

  function handleTextInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = parseFloat(target.value);
    
    // Проверяем границы
    const clampedValue = Math.max(min, Math.min(max, newValue));
    
    if (!isNaN(clampedValue)) {
      value = clampedValue;
      onChange(clampedValue);
    } else {
      // Если введено не число, возвращаем текущее значение
      target.value = value.toString();
    }
  }

  function handleTextBlur(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = parseFloat(target.value);
    
    if (isNaN(newValue)) {
      target.value = value.toString();
    }
  }

  $: percentage = ((value - min) / (max - min)) * 100;
</script>

<div class={`slider-container ${extraClass}`}>
  {#if showInput}
    <div class="flex items-center gap-2">
      <input
        id={id}
        type="range"
        {min}
        {max}
        {step}
        {disabled}
        bind:value
        on:input={handleSliderInput}
        class="slider flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
               {disabled ? 'opacity-50 cursor-not-allowed' : ''}
               focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
        style="background: linear-gradient(to right, #8b5cf6 0%, #8b5cf6 {percentage}%, #374151 {percentage}%, #374151 100%)"
      />
      <input
        type="number"
        bind:value
        on:input={handleTextInput}
        on:blur={handleTextBlur}
        {min}
        {max}
        {step}
        {disabled}
        class={`${inputWidth} bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white
                 focus:outline-none focus:ring-1 focus:ring-neon-purple/50 focus:border-neon-purple
                 {disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
  {:else}
    <input
      id={id}
      type="range"
      {min}
      {max}
      {step}
      {disabled}
      bind:value
      on:input={handleSliderInput}
      class="slider w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
             {disabled ? 'opacity-50 cursor-not-allowed' : ''}
             focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
      style="background: linear-gradient(to right, #8b5cf6 0%, #8b5cf6 {percentage}%, #374151 {percentage}%, #374151 100%)"
    />
  {/if}
</div>

<style>
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #8b5cf6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.3);
  }

  .slider::-moz-range-thumb {
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #8b5cf6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.3);
  }
</style>
