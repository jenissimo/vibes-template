<!-- Color Picker Component -->
<script lang="ts">
  interface Props {
    value?: number;
    disabled?: boolean;
    id?: string;
    extraClass?: string;
    onChange?: (value: number) => void;
  }

  let {
    value = $bindable(0xffffff),
    disabled = false,
    id = undefined,
    extraClass = '',
    onChange = () => undefined
  }: Props = $props();

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = parseInt(target.value.replace('#', ''), 16);
    value = newValue;
    onChange(newValue);
  }

  const hexValue = $derived('#' + value.toString(16).padStart(6, '0').toUpperCase());
</script>

<div class={`color-picker-container flex items-center gap-2 ${extraClass}`}>
  <input
    type="color"
    value={hexValue}
    {disabled}
    oninput={handleInput}
    {id}
    class="w-8 h-8 rounded border border-gray-600 cursor-pointer
           {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
  />
  <input
    type="text"
    value={hexValue}
    {disabled}
    oninput={handleInput}
    class="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white
           {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
    placeholder="#FFFFFF"
  />
</div>
