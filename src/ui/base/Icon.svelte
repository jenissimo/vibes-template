<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // Import commonly used icons
  import { logger } from '@/engine/logging';
  import { 
    Package, 
    Zap, 
    FlaskConical, 
    Gem, 
    Settings, 
    X, 
    ChevronRight,
    ChevronLeft,
    ChevronUp,
    ChevronDown,
    Plus,
    Minus,
    Check,
    AlertCircle,
    Info,
    Star,
    Heart,
    Shield,
    Sword,
    Crown,
    Coins,
    Battery,
    Wrench,
    Lock,
    Unlock,
    Play,
    Pause,
    Square,
    RotateCcw,
    RefreshCw,
    Download,
    Upload,
    Trash2,
    Edit,
    Save,
    Copy,
    Share,
    ExternalLink,
    Menu,
    Search,
    Filter,
    SortAsc,
    SortDesc,
    Eye,
    EyeOff,
    Bell,
    BellOff,
    Volume2,
    VolumeX,
    Sun,
    Moon,
    Monitor,
    Smartphone,
    Tablet,
    Laptop,
    Server,
    Database,
    HardDrive,
    Cpu,
    MemoryStick,
    Wifi,
    WifiOff,
    Signal,
    SignalZero,
    SignalLow,
    SignalMedium,
    SignalHigh,
    MousePointerClick,
    Move3d,
    Expand,
    Rotate3d,
    Undo2,
    Redo2,
    Grid3x3,
    SquareMousePointer,
    Cuboid,
    Sparkle,
    Stars,
    Inbox,
    Scan
  } from 'lucide-svelte';
  
  // Type for icon components
  type LucideIcon = any;

  // Icon mapping for easy access
  const iconMap: Record<string, LucideIcon> = {
    // Game modes
    'warehouse': Package,
    'upgrades': Zap,
    'production': Wrench,
    'research': FlaskConical,
    'market': Gem,
    
    // UI controls
    'settings': Settings,
    'close': X,
    'chevron-right': ChevronRight,
    'chevron-left': ChevronLeft,
    'chevron-up': ChevronUp,
    'chevron-down': ChevronDown,
    'plus': Plus,
    'minus': Minus,
    'check': Check,
    'alert': AlertCircle,
    'info': Info,
    
    // Game elements
    'star': Star,
    'heart': Heart,
    'shield': Shield,
    'sword': Sword,
    'crown': Crown,
    'coins': Coins,
    'battery': Battery,
    'energy': Battery,
    
    // Actions
    'wrench': Wrench,
    'lock': Lock,
    'unlock': Unlock,
    'play': Play,
    'pause': Pause,
    'stop': Square,
    'reset': RotateCcw,
    'refresh': RefreshCw,
    'download': Download,
    'upload': Upload,
    'trash': Trash2,
    'edit': Edit,
    'save': Save,
    'copy': Copy,
    'share': Share,
    'external-link': ExternalLink,
    
    // Navigation
    'menu': Menu,
    'search': Search,
    'filter': Filter,
    'sort-asc': SortAsc,
    'sort-desc': SortDesc,
    
    // Visibility
    'eye': Eye,
    'eye-off': EyeOff,
    'bell': Bell,
    'bell-off': BellOff,
    'volume': Volume2,
    'volume-off': VolumeX,
    
    // Themes
    'sun': Sun,
    'moon': Moon,
    'monitor': Monitor,
    'smartphone': Smartphone,
    'tablet': Tablet,
    'laptop': Laptop,
    
    // Tech
    'server': Server,
    'database': Database,
    'hard-drive': HardDrive,
    'cpu': Cpu,
    'memory': MemoryStick,
    'wifi': Wifi,
    'wifi-off': WifiOff,
    
    // Signal strength
    'signal': Signal,
    'signal-zero': SignalZero,
    'signal-low': SignalLow,
    'signal-medium': SignalMedium,
    'signal-high': SignalHigh,

    // Scene Editor
    'cursor': MousePointerClick,
    'move': Move3d,
    'scale': Expand,
    'rotate': Rotate3d,
    'undo': Undo2,
    'redo': Redo2,
    'grid': Grid3x3,
    'snap': SquareMousePointer,
    'sprite': Cuboid,
    'neon-sprite': Sparkle,
    'space-bg': Stars,
    'empty': Inbox,
    'inspect': Scan,
  };

  interface Props {
    name: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    color?: 'neon-green' | 'neon-blue' | 'neon-purple' | 'neon-pink' | 'neon-orange' | 'gray' | 'white';
    variant?: 'resource' | 'action' | 'danger' | 'success' | 'default';
    hover?: 'glow' | 'scale' | 'pulse' | 'none';
    class?: string;
    disabled?: boolean;
    clickable?: boolean;
  }

  const {
    name,
    size = 'md',
    color = 'neon-green',
    variant = 'default',
    hover = 'glow',
    class: className = '',
    disabled = false,
    clickable = false
  }: Props = $props();

  const dispatch = createEventDispatcher<{
    click: MouseEvent;
  }>();

  // Get the icon component
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    logger.warn(`Icon "${name}" not found in iconMap`)
  }

  // Build CSS classes
  const sizeClass = `icon-${size}`;
  const colorClass = color === 'gray' ? 'text-gray-400' : 
                    color === 'white' ? 'text-white' : 
                    `icon-${color}`;
  const variantClass = variant === 'default' ? '' : `icon-${variant}`;
  const hoverClass = hover === 'none' ? '' : `icon-hover-${hover}`;
  const clickableClass = clickable ? 'icon-button' : '';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const classes = [
    'icon',
    sizeClass,
    colorClass,
    variantClass,
    hoverClass,
    clickableClass,
    disabledClass,
    className
  ].filter(Boolean).join(' ');

  function handleClick(event: MouseEvent) {
    if (!disabled && clickable) {
      dispatch('click', event);
    }
  }
</script>

{#if IconComponent}
  <IconComponent 
    class={classes}
    onclick={handleClick}
    role={clickable ? 'button' : 'img'}
    aria-label={name}
    tabindex={clickable && !disabled ? 0 : -1}
  />
{:else}
  <!-- Fallback for missing icons -->
  <div class={classes} role="img" aria-label={`Missing icon: ${name}`}>
    ?
  </div>
{/if}
