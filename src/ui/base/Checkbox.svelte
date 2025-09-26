<!-- Checkbox Component -->
<script lang="ts">
  export let checked: boolean = false;
  export let disabled: boolean = false;
  export let id: string | undefined = undefined;
  export let extraClass: string = '';
  export let onChange: (checked: boolean) => void = () => undefined;

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    checked = target.checked;
    onChange(checked);
  }
</script>

<label class={`checkbox-container flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${extraClass}`} for={id}>
  <input
    type="checkbox"
    id={id}
    {checked}
    {disabled}
    on:change={handleChange}
    class="w-4 h-4 text-neон-purple bg-gray-700 border-gray-600 rounded focus:ring-neon-purple/50 focus:ring-2"
  />
  <span class="text-sm text-gray-300">
    <slot />
  </span>
</label>
