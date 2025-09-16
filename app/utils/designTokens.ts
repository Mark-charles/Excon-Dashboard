// Design tokens for the EXCON Dashboard
// Emergency management professional color palette and design system

export const colors = {
  // Emergency Service Colors
  emergency: {
    critical: '#DC2626',     // red-600 - Critical alerts, urgent injects
    warning: '#D97706',      // amber-600 - Pending actions, warnings
    info: '#1E40AF',         // blue-800 - Information, completed items
    success: '#059669',      // emerald-600 - Completed, arrived resources
    neutral: '#6B7280',      // gray-500 - Inactive states
  },
  
  // Background Layers (Dark Theme)
  background: {
    primary: '#030712',      // gray-950 - Main background
    secondary: '#111827',    // gray-900 - Cards, panels
    tertiary: '#1F2937',     // gray-800 - Elevated elements
    quaternary: '#374151',   // gray-700 - Interactive elements
  },
  
  // Status Colors
  inject: {
    pending: '#6B7280',      // gray-500
    completed: '#059669',    // emerald-600
    missed: '#DC2626',       // red-600
    skipped: '#D97706',      // amber-600
  },
  
  resource: {
    requested: '#6B7280',    // gray-500
    tasked: '#D97706',       // amber-600
    enroute: '#1E40AF',      // blue-800
    arrived: '#059669',      // emerald-600
    cancelled: '#DC2626',    // red-600
  },
  
  // Inject Types
  injectTypes: {
    'in person': '#3B82F6',     // blue-500
    'radio/phone': '#10B981',   // emerald-500
    'electronic': '#8B5CF6',   // violet-500
    'map inject': '#EF4444',    // red-500
    'other': '#F59E0B',         // amber-500
  },
  
  // Text Colors
  text: {
    primary: '#F9FAFB',      // gray-50
    secondary: '#D1D5DB',    // gray-300
    tertiary: '#9CA3AF',     // gray-400
    inverse: '#111827',      // gray-900
  },
  
  // Border Colors
  border: {
    subtle: '#374151',       // gray-700
    default: '#4B5563',      // gray-600
    emphasis: '#6B7280',     // gray-500
  }
} as const

export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.5rem',     // 24px
  '2xl': '2rem',    // 32px
  '3xl': '3rem',    // 48px
} as const

export const borderRadius = {
  sm: '0.25rem',    // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
} as const

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  emergency: '0 0 0 3px rgb(220 38 38 / 0.2)', // Red emergency focus ring
} as const

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const

export const animations = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }
} as const

// Utility functions for design tokens
export const getStatusColor = (status: string, type: 'inject' | 'resource') => {
  if (type === 'inject') {
    return colors.inject[status as keyof typeof colors.inject] || colors.inject.pending
  }
  return colors.resource[status as keyof typeof colors.resource] || colors.resource.requested
}

export const getInjectTypeColor = (injectType: string) => {
  return colors.injectTypes[injectType as keyof typeof colors.injectTypes] || colors.injectTypes.other
}

// CSS custom properties for use in components
export const cssVariables = {
  '--color-emergency-critical': colors.emergency.critical,
  '--color-emergency-warning': colors.emergency.warning,
  '--color-emergency-info': colors.emergency.info,
  '--color-emergency-success': colors.emergency.success,
  '--color-bg-primary': colors.background.primary,
  '--color-bg-secondary': colors.background.secondary,
  '--color-bg-tertiary': colors.background.tertiary,
  '--color-text-primary': colors.text.primary,
  '--color-text-secondary': colors.text.secondary,
  '--shadow-emergency': shadows.emergency,
  '--border-radius-md': borderRadius.md,
  '--animation-duration-normal': animations.duration.normal,
} as const