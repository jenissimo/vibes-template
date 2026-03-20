<!-- Input Component -->
<script lang="ts">
  interface Props {
    value?: string | number;
    type?: 'text' | 'number' | 'email' | 'password';
    placeholder?: string;
    disabled?: boolean;
    step?: number | string;
    id?: string;
    extraClass?: string;
    onChange?: (value: number | string) => void;
  }

  let {
    value = $bindable(''),
    type = 'text',
    placeholder = '',
    disabled = false,
    step = undefined,
    id = undefined,
    extraClass = '',
    onChange = () => undefined
  }: Props = $props();

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = type === 'number' ? parseFloat(target.value) || 0 : target.value;
    value = newValue;
    onChange(newValue);
  }
</script>

<input
  {id}
  {type}
  {placeholder}
  {disabled}
  {step}
  bind:value
  oninput={handleInput}
  class={`input w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400
         focus:outline-none focus:ring-2 focus:ring-neon-purple/50 focus:border-neon-purple
         disabled:opacity-50 disabled:cursor-not-allowed ${extraClass}`}
/>
