// Shared email styling constants and utilities for SenCommerce
export const emailStyles = {
  // Colors
  colors: {
    primary: 'orange-500',
    primaryHover: 'orange-600',
    secondary: 'blue-500',
    accent: 'orange-50',
    secondaryAccent: 'blue-50',
    grayAccent: 'gray-50',
    text: {
      primary: 'gray-900',
      secondary: 'gray-700',
      muted: 'gray-600',
      light: 'gray-500',
      veryLight: 'gray-400'
    }
  },

  // Typography
  typography: {
    fontFamily: 'font-sans',
    sizes: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl'
    },
    weights: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold'
    }
  },

  // Layout
  layout: {
    container: 'mx-auto py-8 px-4 max-w-2xl',
    section: 'mb-8',
    sectionSmall: 'mb-6',
    sectionTight: 'mb-4',
    rounded: 'rounded-lg',
    border: 'border-t border-gray-200',
    padding: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    },
    spacing: {
      xs: 'mb-2',
      sm: 'mb-4',
      md: 'mb-6',
      lg: 'mb-8'
    }
  },

  // Components
  components: {
    button: {
      primary: 'bg-orange-500 text-white px-6 py-3 rounded-lg text-sm font-medium',
      secondary: 'bg-gray-500 text-white px-6 py-3 rounded-lg text-sm font-medium',
      outline: 'border border-orange-500 text-orange-500 px-6 py-3 rounded-lg text-sm font-medium'
    },
    card: {
      primary: 'bg-orange-50 p-6 rounded-lg',
      secondary: 'bg-blue-50 p-6 rounded-lg',
      neutral: 'bg-gray-50 p-4 rounded-lg'
    },
    link: {
      primary: 'text-orange-500',
      underlined: 'text-orange-500 underline'
    }
  }
}

// Utility function to combine classes
export const cn = (...classes: (string | undefined)[]) => {
  return classes.filter(Boolean).join(' ')
}