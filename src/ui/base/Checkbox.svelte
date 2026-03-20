<!-- Checkbox Component -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    checked?: boolean;
    disabled?: boolean;
    id?: string;
    extraClass?: string;
    onChange?: (checked: boolean) => void;
    children?: Snippet;
  }

  let {
    checked = $bindable(false),
    disabled = false,
    id = undefined,
    extraClass = '',
    onChange = () => undefined,
    children
  }: Props = $props();

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    checked = target.checked;
    onChange(checked);
  }
</script>

<label class={`checkbox-container flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${extraClass}`} for={id}>
  <input
    type="checkbox"
    {id}
    {checked}
    {disabled}
    onchange={handleChange}
    class="w-4 h-4 text-neon-purple bg-gray-700 border-gray-600 rounded focus:ring-neon-purple/50 focus:ring-2"
  />
  <span class="text-sm text-gray-300">
    {#if children}
      {@render children()}
    {/if}
  </span>
</label>
