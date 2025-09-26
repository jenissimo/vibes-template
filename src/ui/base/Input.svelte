<!-- Input Component -->
<script lang="ts">
  export let value: string | number = '';
  export let type: 'text' | 'number' | 'email' | 'password' = 'text';
  export let placeholder: string = '';
  export let disabled: boolean = false;
  export let step: number | string | undefined = undefined;
  export let id: string | undefined = undefined;
  export let extraClass: string = '';
  export let onChange: (value: number | string) => void = () => undefined;

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = type === 'number' ? parseFloat(target.value) || 0 : target.value;
    value = newValue;
    onChange(newValue);
  }
</script>

<input
  id={id}
  {type}
  {placeholder}
  {disabled}
  {step}
  bind:value
  on:input={handleInput}
  class={`input w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400
         focus:outline-none focus:ring-2 focus:ring-neon-purple/50 focus:border-neon-purple
         disabled:opacity-50 disabled:cursor-not-allowed ${extraClass}`}
/> 
