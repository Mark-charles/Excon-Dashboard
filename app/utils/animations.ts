// Animation utilities for the EXCON Dashboard
// Professional micro-interactions and transitions

export const animations = {
  // Fade animations
  fadeIn: 'animate-in fade-in duration-300',
  fadeOut: 'animate-out fade-out duration-300',
  
  // Slide animations
  slideInFromLeft: 'animate-in slide-in-from-left duration-300',
  slideInFromRight: 'animate-in slide-in-from-right duration-300',
  slideInFromTop: 'animate-in slide-in-from-top duration-300',
  slideInFromBottom: 'animate-in slide-in-from-bottom duration-300',
  
  // Scale animations
  scaleIn: 'animate-in zoom-in duration-200',
  scaleOut: 'animate-out zoom-out duration-200',
  
  // Bounce for attention
  bounce: 'animate-bounce',
  pulse: 'animate-pulse',
  
  // Professional transitions
  smooth: 'transition-all duration-300 ease-in-out',
  fast: 'transition-all duration-150 ease-in-out',
  
  // Hover effects
  hoverLift: 'hover:scale-105 hover:shadow-xl transition-all duration-200',
  hoverGlow: 'hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200',
  
  // Focus rings for accessibility
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900',
} as const

export const getStatusAnimation = (status: string): string => {
  switch (status) {
    case 'critical':
    case 'missed':
      return 'animate-pulse border-red-400'
    case 'enroute':
    case 'tasked':
      return 'animate-pulse border-amber-400'
    case 'completed':
    case 'arrived':
      return 'border-green-400'
    default:
      return 'border-gray-400'
  }
}

export const getEmergencyAnimation = (isEmergency: boolean): string => {
  return isEmergency ? 'animate-pulse ring-2 ring-red-400 ring-opacity-75' : ''
}

// Stagger children animations for lists
export const staggerChildren = (index: number, delay = 50): React.CSSProperties => ({
  animationDelay: `${index * delay}ms`
})

// Progress bar animation
export const progressAnimation = (progress: number): React.CSSProperties => ({
  width: `${progress}%`,
  transition: 'width 0.5s ease-in-out'
})

// Loading states
export const loadingSpinner = 'animate-spin rounded-full h-6 w-6 border-b-2 border-white'
export const loadingDots = 'animate-pulse'

// Professional button animations
export const buttonAnimations = {
  primary: 'transform hover:scale-105 active:scale-95 transition-all duration-150',
  secondary: 'transform hover:scale-102 active:scale-98 transition-all duration-150',
  danger: 'transform hover:scale-105 active:scale-95 transition-all duration-150 hover:shadow-lg hover:shadow-red-500/25',
  success: 'transform hover:scale-105 active:scale-95 transition-all duration-150 hover:shadow-lg hover:shadow-green-500/25',
}

// Timeline item entrance animations
export const timelineItemAnimation = (index: number): string => {
  const delay = index * 100
  return `animate-in slide-in-from-left duration-500 fill-mode-both delay-[${delay}ms]`
}

// Status change animations
export const statusChangeAnimation = 'transition-all duration-500 ease-in-out transform'

// Emergency alert animations
export const emergencyAlert = 'animate-pulse bg-red-500/20 border border-red-400 rounded-lg'