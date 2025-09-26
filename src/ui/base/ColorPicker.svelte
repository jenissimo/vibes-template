<!-- Color Picker Component -->
<script lang="ts">
  export let value: number = 0xffffff;
  export let disabled: boolean = false;
  export let id: string | undefined = undefined;
  export let extraClass: string = '';
  export let onChange: (value: number) => void = () => undefined;

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = parseInt(target.value.replace('#', ''), 16);
    value = newValue;
    onChange(newValue);
  }

  $: hexValue = '#' + value.toString(16).padStart(6, '0').toUpperCase();
</script>

<div class={`color-picker-container flex items-center gap-2 ${extraClass}`}>
  <input
    type="color"
    value={hexValue}
    {disabled}
    on:input={handleInput}
    id={id}
    class="w-8 h-8 rounded border border-gray-600 cursor-pointer
           {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
  />
  <input
    type="text"
    value={hexValue}
    {disabled}
    on:input={handleInput}
    class="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white
           {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
    placeholder="#FFFFFF"
  />
</div>
