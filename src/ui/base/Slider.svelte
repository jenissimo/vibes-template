<!-- Slider Component -->
<script lang="ts">
  interface Props {
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    id?: string;
    extraClass?: string;
    onChange?: (value: number) => void;
    showInput?: boolean;
    inputWidth?: string;
  }

  let {
    value = $bindable(0),
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    id = undefined,
    extraClass = '',
    onChange = () => undefined,
    showInput = false,
    inputWidth = 'w-16'
  }: Props = $props();

  function handleSliderInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = parseFloat(target.value);
    value = newValue;
    onChange(newValue);
  }

  function handleTextInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = parseFloat(target.value);

    const clampedValue = Math.max(min, Math.min(max, newValue));

    if (!isNaN(clampedValue)) {
      value = clampedValue;
      onChange(clampedValue);
    } else {
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

  const percentage = $derived(((value - min) / (max - min)) * 100);
</script>

<div class={`slider-container ${extraClass}`}>
  {#if showInput}
    <div class="flex items-center gap-2">
      <input
        {id}
        type="range"
        {min}
        {max}
        {step}
        {disabled}
        bind:value
        oninput={handleSliderInput}
        class="slider flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
               {disabled ? 'opacity-50 cursor-not-allowed' : ''}
               focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
        style="background: linear-gradient(to right, #8b5cf6 0%, #8b5cf6 {percentage}%, #374151 {percentage}%, #374151 100%)"
      />
      <input
        type="number"
        bind:value
        oninput={handleTextInput}
        onblur={handleTextBlur}
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
      {id}
      type="range"
      {min}
      {max}
      {step}
      {disabled}
      bind:value
      oninput={handleSliderInput}
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
