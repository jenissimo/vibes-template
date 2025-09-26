<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    
    // Types
    type Size = "xs" | "sm" | "md" | "lg" | "xl";
    type Color = "default" | "success" | "warning" | "danger" | "info";

    const dispatch = createEventDispatcher<{
        click: {
            value: number | null;
            min: number;
            max: number;
            percent: number;
        };
        change: {
            value: number | null;
            min: number;
            max: number;
            percent: number;
        };
    }>();

    // ----- Параметры -----
    /** Текущее значение; null = indeterminate */
    export let value: number | null = 0;
    export let min = 0;
    export let max = 100;

    /** Доп. буфер (0..1 или 0..100, распознаём автоматически) */
    export let buffer: number | null = null;

    /** Визуал и поведение */
    export let label = "";
    export let size: Size = "md";
    export let color: Color = "default";
    export let striped = false;
    export let animated = true;
    export let disabled = false;
    /** Делает бар «интерактивным»: фокус, Enter/Space, событие click */
    export let interactive = false;

    /** Отображение значений */
    export let showPercentage = true;
    export let showValue = false;
    export let decimalPlaces = 0;
    /** Пользовательский форматтер значения */
    export let format:
        | ((v: number, min: number, max: number, percent: number) => string)
        | null = null;

    // ----- Утилиты -----
    const clamp = (x: number, a: number, b: number) =>
        Math.min(b, Math.max(a, x));
    const finite = (x: unknown, fb: number) =>
        Number.isFinite(x as number) ? (x as number) : fb;
    const cx = (...parts: Array<string | false | null | undefined>) =>
        parts.filter(Boolean).join(" ");

    // ----- Безопасные числовые значения -----
    $: _min = finite(min, 0);
    $: _max = Math.max(_min, finite(max, 100));

    $: raw = value === null ? null : finite(value, _min);
    $: clamped = raw === null ? null : clamp(raw, _min, _max);

    $: span = Math.max(1e-9, _max - _min); // защита от деления на 0
    $: frac = clamped === null ? 0 : (clamped - _min) / span;
    $: percent = +(frac * 100).toFixed(decimalPlaces);

    // Буфер распознаём как 0..1 или 0..100
    function normBuffer(b: number | null): number {
        if (b == null || !Number.isFinite(b)) return 0;
        const v = b <= 1 ? b : b / 100;
        return clamp(v, 0, 1);
    }
    $: bufferFrac = normBuffer(buffer);
    $: bufferPercent = +(bufferFrac * 100).toFixed(decimalPlaces);

    // Индетерминантный режим: если value === null
    $: indeterminate = value === null;

    // Текст для screen readers
    $: valueText = indeterminate
        ? "Loading"
        : format
          ? format(clamped!, _min, _max, percent)
          : `${clamped?.toFixed(decimalPlaces)}/${_max.toFixed(decimalPlaces)} (${percent.toFixed(decimalPlaces)}%)`;

    // Идентификаторы для a11y
    let uid = `pg_${Math.random().toString(36).slice(2)}`;
    $: labelId = `${uid}_label`;
    $: textId = `${uid}_text`;

    // Событие change при изменении value/max/min
    $: dispatch("change", { value: clamped, min: _min, max: _max, percent });

    // Клики / клавиатура, если интерактивный режим
    function handleActivate() {
        if (disabled || !interactive) return;
        dispatch("click", { value: clamped, min: _min, max: _max, percent });
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
    $: height = sizePx[size];

    // Инлайн CSS-переменные (проценты и высота)
    $: styleVars =
        `--pg-height:${height};` +
        `--pg-percent:${percent}%;` +
        `--pg-buffer:${bufferPercent}%;`;
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
    on:click={interactive && !disabled ? handleActivate : undefined}
    on:keydown={interactive && !disabled ? onKeydown : undefined}
>
    {#if label}
        <div
            id={labelId}
            class="pg-label text-xs text-gray-400 font-mono min-w-[40px]"
        >
            <slot name="label">{label}</slot>
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
            <slot name="suffix" />
        </div>
    {/if}
</div>

<style lang="postcss">
    /* Базовые переменные темы */
    .pg-container {
        /* трек/филл можно переопределять родителем */
        --pg-track: var(--color-gray-800);
        --pg-track-border: var(--color-gray-700);
        --pg-fill: linear-gradient(to right, #39ff14, #00e5ff); /* default */
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

    /* Интерактив/дизэйбл состояния */
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

    /* Полосатость и анимация */
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

    /* Индетерминантная анимация */
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

    /* Цветовые пресеты через data-атрибут (можно переопределить var(--pg-fill)) */
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

    /* Цвет процента под стиль */
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

    /* Ховер-эффект только когда интерактивный и не disabled */
    .pg-container:not([data-disabled="true"])[tabindex="0"]:hover {
        transform: translateZ(0) scale(1.01);
        transition: transform 150ms ease;
    }

    /* Уважение к сниженной анимации */
    @media (prefers-reduced-motion: reduce) {
        .pg-fill,
        .pg-indeterminate {
            animation: none !important;
            transition: none !important;
        }
    }
</style>