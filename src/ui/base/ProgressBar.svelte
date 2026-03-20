<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<script lang="ts">
    import type { Snippet } from 'svelte';

    // Types
    type Size = "xs" | "sm" | "md" | "lg" | "xl";
    type Color = "default" | "success" | "warning" | "danger" | "info";

    interface Props {
        value?: number | null;
        min?: number;
        max?: number;
        buffer?: number | null;
        label?: string;
        size?: Size;
        color?: Color;
        striped?: boolean;
        animated?: boolean;
        disabled?: boolean;
        interactive?: boolean;
        showPercentage?: boolean;
        showValue?: boolean;
        decimalPlaces?: number;
        format?: ((v: number, min: number, max: number, percent: number) => string) | null;
        onclick?: (data: { value: number | null; min: number; max: number; percent: number }) => void;
        onchange?: (data: { value: number | null; min: number; max: number; percent: number }) => void;
        labelSnippet?: Snippet;
        suffixSnippet?: Snippet;
    }

    const {
        value = 0,
        min = 0,
        max = 100,
        buffer = null,
        label = "",
        size = "md",
        color = "default",
        striped = false,
        animated = true,
        disabled = false,
        interactive = false,
        showPercentage = true,
        showValue = false,
        decimalPlaces = 0,
        format = null,
        onclick,
        onchange,
        labelSnippet,
        suffixSnippet
    }: Props = $props();

    // ----- Утилиты -----
    const clamp = (x: number, a: number, b: number) =>
        Math.min(b, Math.max(a, x));
    const finite = (x: unknown, fb: number) =>
        Number.isFinite(x as number) ? (x as number) : fb;
    const cx = (...parts: Array<string | false | null | undefined>) =>
        parts.filter(Boolean).join(" ");

    // ----- Безопасные числовые значения -----
    const _min = $derived(finite(min, 0));
    const _max = $derived(Math.max(_min, finite(max, 100)));

    const raw = $derived(value === null ? null : finite(value, _min));
    const clamped = $derived(raw === null ? null : clamp(raw, _min, _max));

    const span = $derived(Math.max(1e-9, _max - _min));
    const frac = $derived(clamped === null ? 0 : (clamped - _min) / span);
    const percent = $derived(+(frac * 100).toFixed(decimalPlaces));

    // Буфер распознаём как 0..1 или 0..100
    function normBuffer(b: number | null): number {
        if (b == null || !Number.isFinite(b)) return 0;
        const v = b <= 1 ? b : b / 100;
        return clamp(v, 0, 1);
    }
    const bufferFrac = $derived(normBuffer(buffer));
    const bufferPercent = $derived(+(bufferFrac * 100).toFixed(decimalPlaces));

    const indeterminate = $derived(value === null);

    const valueText = $derived(indeterminate
        ? "Loading"
        : format
          ? format(clamped!, _min, _max, percent)
          : `${clamped?.toFixed(decimalPlaces)}/${_max.toFixed(decimalPlaces)} (${percent.toFixed(decimalPlaces)}%)`);

    let uid = `pg_${Math.random().toString(36).slice(2)}`;
    const labelId = $derived(`${uid}_label`);
    const textId = $derived(`${uid}_text`);

    // Emit change
    $effect(() => {
        onchange?.({ value: clamped, min: _min, max: _max, percent });
    });

    // Клики / клавиатура
    function handleActivate() {
        if (disabled || !interactive) return;
        onclick?.({ value: clamped, min: _min, max: _max, percent });
    }
    function onKeydown(e: KeyboardEvent) {
        if (!interactive || disabled) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleActivate();
        }
    }

    // Размер -> высота
    const sizePx: Record<Size, string> = {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
    };
    const height = $derived(sizePx[size]);

    const styleVars = $derived(
        `--pg-height:${height};` +
        `--pg-percent:${percent}%;` +
        `--pg-buffer:${bufferPercent}%;`);
</script>

<div
    id={uid}
    class={cx(
        "pg-container flex flex-col gap-1 select-none",
        interactive && !disabled && "focus:outline-none",
    )}
    data-size={size}
    data-color={color}
    data-striped={striped}
    data-animated={animated}
    data-disabled={disabled}
    data-indeterminate={indeterminate}
    style={styleVars}
    role={interactive && !disabled ? "button" : "progressbar"}
    aria-labelledby={label ? labelId : undefined}
    aria-describedby={showPercentage || showValue ? textId : undefined}
    aria-valuemin={indeterminate ? undefined : _min}
    aria-valuemax={indeterminate ? undefined : _max}
    aria-valuenow={indeterminate ? undefined : (clamped ?? undefined)}
    aria-valuetext={valueText}
    aria-busy={indeterminate}
    tabindex={interactive && !disabled ? 0 : undefined}
    onclick={interactive && !disabled ? handleActivate : undefined}
    onkeydown={interactive && !disabled ? onKeydown : undefined}
>
    {#if label}
        <div
            id={labelId}
            class="pg-label text-xs text-gray-400 font-mono min-w-[40px]"
        >
            {#if labelSnippet}
                {@render labelSnippet()}
            {:else}
                {label}
            {/if}
        </div>
    {/if}

    <div
        class="pg-track relative bg-gray-800 rounded-full border border-gray-700 overflow-hidden"
    >
        <!-- Буфер -->
        {#if buffer !== null && !indeterminate}
            <div class="pg-buffer absolute inset-y-0 left-0 z-0"></div>
        {/if}

        <!-- Наполнение -->
        <div class="pg-fill relative z-[1]"></div>

        <!-- Индетерминантный бегунок -->
        {#if indeterminate}
            <div class="pg-indeterminate absolute inset-y-0 left-0"></div>
        {/if}
    </div>

    {#if showPercentage || showValue}
        <div
            id={textId}
            class="pg-text flex items-center justify-between text-xs font-mono font-bold min-w-[35px]"
        >
            {#if showValue && !indeterminate}
                <span class="pg-value text-gray-300">
                    {format
                        ? format(clamped!, _min, _max, percent)
                        : `${clamped?.toFixed(decimalPlaces)}/${_max.toFixed(decimalPlaces)}`}
                </span>
            {/if}
            {#if showPercentage && showValue && !indeterminate}
                <span class="pg-sep text-gray-500">•</span>
            {/if}
            {#if showPercentage}
                <span class="pg-percentage">
                    {indeterminate ? "—" : `${percent.toFixed(decimalPlaces)}%`}
                </span>
            {/if}
            {#if suffixSnippet}
                {@render suffixSnippet()}
            {/if}
        </div>
    {/if}
</div>

<style lang="postcss">
    /* Базовые переменные темы */
    .pg-container {
        --pg-track: var(--color-gray-800);
        --pg-track-border: var(--color-gray-700);
        --pg-fill: linear-gradient(to right, #39ff14, #00e5ff);
        --pg-buffer-color: color-mix(in oklab, white 12%, transparent);
    }

    .pg-track {
        height: var(--pg-height);
        background: var(--pg-track);
        border-color: var(--pg-track-border);
    }

    .pg-fill {
        height: 100%;
        width: var(--pg-percent);
        background: var(--pg-fill);
        min-width: 0;
        max-width: 100%;
        transition: width 240ms ease;
        will-change: width;
    }

    .pg-buffer {
        width: var(--pg-buffer);
        background: var(--pg-buffer-color);
    }

    .pg-container[data-disabled="true"] {
        @apply opacity-60 cursor-not-allowed;
    }
    .pg-container:not([data-disabled="true"])[tabindex="0"] {
        @apply cursor-pointer;
    }
    .pg-container:not([data-disabled="true"])[tabindex="0"]:focus-visible
        .pg-track {
        box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.4);
    }

    .pg-container[data-striped="true"] .pg-fill {
        background-image: linear-gradient(
                45deg,
                rgba(255, 255, 255, 0.18) 25%,
                transparent 25%,
                transparent 50%,
                rgba(255, 255, 255, 0.18) 50%,
                rgba(255, 255, 255, 0.18) 75%,
                transparent 75%,
                transparent
            ),
            var(--pg-fill);
        background-size:
            1rem 1rem,
            auto;
    }
    .pg-container[data-striped="true"][data-animated="true"] .pg-fill {
        animation: stripes 1s linear infinite;
    }
    @keyframes stripes {
        0% {
            background-position:
                1rem 0,
                0 0;
        }
        100% {
            background-position:
                0 0,
                0 0;
        }
    }

    .pg-container[data-indeterminate="true"] .pg-fill {
        width: 0%;
    }
    .pg-indeterminate {
        width: 35%;
        background: var(--pg-fill);
        border-radius: 9999px;
        animation: indet 1.25s ease-in-out infinite;
    }
    @keyframes indet {
        0% {
            left: -35%;
            right: 100%;
        }
        50% {
            left: 25%;
            right: 40%;
        }
        100% {
            left: 100%;
            right: -35%;
        }
    }

    .pg-container[data-color="default"] {
        --pg-fill: linear-gradient(to right, #39ff14, #00e5ff);
    }
    .pg-container[data-color="success"] {
        --pg-fill: linear-gradient(to right, #22c55e, #16a34a);
    }
    .pg-container[data-color="warning"] {
        --pg-fill: linear-gradient(to right, #f59e0b, #fb923c);
    }
    .pg-container[data-color="danger"] {
        --pg-fill: linear-gradient(to right, #f87171, #ef4444);
    }
    .pg-container[data-color="info"] {
        --pg-fill: linear-gradient(to right, #60a5fa, #3b82f6);
    }

    .pg-container[data-color="default"] .pg-percentage {
        color: #00e5ff;
    }
    .pg-container[data-color="success"] .pg-percentage {
        color: var(--color-green-400);
    }
    .pg-container[data-color="warning"] .pg-percentage {
        color: var(--color-yellow-400);
    }
    .pg-container[data-color="danger"] .pg-percentage {
        color: var(--color-red-400);
    }
    .pg-container[data-color="info"] .pg-percentage {
        color: var(--color-blue-400);
    }

    .pg-container:not([data-disabled="true"])[tabindex="0"]:hover {
        transform: translateZ(0) scale(1.01);
        transition: transform 150ms ease;
    }

    @media (prefers-reduced-motion: reduce) {
        .pg-fill,
        .pg-indeterminate {
            animation: none !important;
            transition: none !important;
        }
    }
</style>
