/**
 * CCIT CONNECT Design System
 * 
 * This file defines the official color theme based on the landing page design.
 * All pages and components should use these color values for consistency.
 */

export const theme = {
  // Primary Brand Colors
  colors: {
    // Main gradient colors (used for brand, buttons, accents)
    primary: {
      indigo: "#4F46E5", // indigo-600
      purple: "#9333EA", // purple-600
      violet: "#7C3AED", // violet-600
    },
    
    // Background gradients
    background: {
      light: {
        from: "#EFF6FF", // blue-50
        via: "#EEF2FF", // indigo-50
        to: "#FAF5FF", // purple-50
      },
      dark: {
        from: "#030712", // gray-950
        via: "#1E1B4B", // indigo-950
        to: "#3B0764", // purple-950
      },
    },
    
    // Feature card gradients
    feature: {
      network: {
        from: "#3B82F6", // blue-500
        to: "#4F46E5", // indigo-600
      },
      events: {
        from: "#A855F7", // purple-500
        to: "#7C3AED", // violet-600
      },
      opportunities: {
        from: "#6366F1", // indigo-500
        to: "#9333EA", // purple-600
      },
    },
    
    // Text colors
    text: {
      primary: {
        light: "#111827", // gray-900
        dark: "#F9FAFB", // gray-100
      },
      secondary: {
        light: "#4B5563", // gray-600
        dark: "#D1D5DB", // gray-300
      },
      muted: {
        light: "#6B7280", // gray-500
        dark: "#9CA3AF", // gray-400
      },
    },
    
    // Border colors
    border: {
      light: "#E5E7EB", // gray-200
      dark: "#1F2937", // gray-800
    },
    
    // Card backgrounds
    card: {
      light: "rgba(255, 255, 255, 0.8)", // white/80
      dark: "rgba(17, 24, 39, 0.8)", // gray-900/80
    },
  },
  
  // Gradient definitions (for Tailwind classes)
  gradients: {
    // Primary brand gradient
    primary: "from-indigo-600 via-purple-600 to-violet-600",
    primaryDark: "from-indigo-800 via-purple-800 to-violet-800",
    
    // Background gradients
    backgroundLight: "from-blue-50 via-indigo-50 to-purple-50",
    backgroundDark: "from-gray-950 via-indigo-950 to-purple-950",
    
    // Feature gradients
    network: "from-blue-500 to-indigo-600",
    events: "from-purple-500 to-violet-600",
    opportunities: "from-indigo-500 to-purple-600",
    
    // Dashboard gradient
    dashboard: "from-blue-600 via-indigo-700 to-purple-800",
    dashboardDark: "from-gray-950 via-indigo-950 to-purple-950",
  },
  
  // Typography
  typography: {
    fontFamily: {
      primary: "Poppins",
      secondary: "Inter",
    },
    sizes: {
      hero: "text-5xl sm:text-6xl lg:text-7xl",
      h1: "text-4xl sm:text-5xl",
      h2: "text-3xl sm:text-4xl",
      h3: "text-2xl sm:text-3xl",
      body: "text-base",
      small: "text-sm",
    },
  },
  
  // Spacing
  spacing: {
    section: "py-20",
    container: "px-4 sm:px-6 lg:px-8",
    card: "p-6",
  },
  
  // Shadows
  shadows: {
    card: "shadow-xl",
    cardHover: "shadow-2xl",
    button: "shadow-lg",
    buttonHover: "shadow-xl",
  },
  
  // Transitions
  transitions: {
    default: "transition-all duration-300",
    fast: "transition-all duration-200",
    slow: "transition-all duration-500",
  },
} as const

/**
 * Helper function to get gradient classes
 */
export function getGradient(type: keyof typeof theme.gradients): string {
  return theme.gradients[type]
}

/**
 * Helper function to get color values
 */
export function getColor(path: string): string {
  const keys = path.split(".")
  let value: any = theme.colors
  for (const key of keys) {
    value = value[key]
  }
  return value as string
}


