/**
 * FEEDIN Brand Configuration
 * Centralized brand identity system for consistent UI/UX across all sections
 * 
 * This file contains:
 * - Brand colors and palettes
 * - Typography system
 * - Logo configurations
 * - Design tokens
 * - Brand guidelines enforcement
 */

export const BRAND_CONFIG = {
  // ===========================
  // BRAND IDENTITY
  // ===========================
  identity: {
    name: 'FEEDIN GREEN',
    tagline: 'Smart Agriculture Solutions',
    shortName: 'Feedin',
    version: '2.0.0',
    lastUpdated: '2026-04-18',
  },

  // ===========================
  // LOGO SYSTEM
  // ===========================
  logos: {
    primary: {
      path: 'assets/new-logo/only-f.png',
      alt: 'Feedin Agri Logo',
      width: 40,
      height: 40,
    },
    small: {
      path: 'assets/new-logo/only-f.png',
      alt: 'Feedin Logo',
      width: 34,
      height: 30,
    },
    large: {
      path: 'assets/new-logo/feedin-brnd-removebg-preview.png',
      alt: 'Feedin Agri Brand',
      width: 200,
      height: 80,
    },
    favicon: {
      path: 'assets/new-logo/favicon.ico',
      sizes: '32x32',
    },
    appleTouch: {
      path: 'assets/new-logo/apple-touch-icon.png',
      sizes: '180x180',
    },
  },

  // ===========================
  // BRAND COLORS
  // ===========================
  colors: {
    // Primary Brand Palette - Agriculture Green
    primary: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981', // Main brand color
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22',
    },
    
    // Secondary Brand Palette - Earth Tones
    secondary: {
      50: '#faf8f5',
      100: '#f5f0eb',
      200: '#ebe4dc',
      300: '#ddd1c4',
      400: '#c9b8a8',
      500: '#b39e8b',
      600: '#9c8673',
      700: '#826d5d',
      800: '#6b5a4e',
      900: '#574a41',
    },
    
    // Accent Colors - Tech Blue
    accent: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    
    // Semantic Colors
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    
    // Neutrals
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
  },

  // ===========================
  // TYPOGRAPHY SYSTEM
  // ===========================
  typography: {
    // Font Families
    families: {
      primary: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      secondary: "'DM Sans', 'Roboto', sans-serif",
      mono: "'Fira Code', 'JetBrains Mono', monospace",
      brand: "'Outfit', 'Plus Jakarta Sans', sans-serif",
    },
    
    // Font Sizes (in rem)
    sizes: {
      xs: '0.75rem',      // 12px
      sm: '0.8125rem',   // 13px
      base: '0.9375rem', // 15px
      lg: '1.0625rem',   // 17px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
      '6xl': '3.75rem',  // 60px
    },
    
    // Font Weights
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    
    // Line Heights
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
    
    // Letter Spacing
    letterSpacing: {
      tight: '-0.01em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
    },
  },

  // ===========================
  // SPACING SYSTEM
  // ===========================
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    base: '1rem',     // 16px
    lg: '1.25rem',    // 20px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    '3xl': '2.5rem',  // 40px
    '4xl': '3rem',    // 48px
    '5xl': '4rem',    // 64px
  },

  // ===========================
  // BORDER RADIUS
  // ===========================
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.25rem', // 20px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // ===========================
  // SHADOWS
  // ===========================
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    
    // Brand-specific shadows
    brand: {
      sm: '0 2px 8px rgba(16, 185, 129, 0.08)',
      md: '0 4px 12px rgba(16, 185, 129, 0.15)',
      lg: '0 10px 20px rgba(16, 185, 129, 0.25)',
      glow: '0 0 20px rgba(16, 185, 129, 0.3)',
    },
  },

  // ===========================
  // TRANSITIONS
  // ===========================
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '400ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: '350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // ===========================
  // Z-INDEX SCALE
  // ===========================
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080,
  },

  // ===========================
  // LAYOUT
  // ===========================
  layout: {
    containerMaxWidth: '1280px',
    sectionGutter: {
      desktop: '2rem',
      tablet: '1.5rem',
      mobile: '1.25rem',
      smallMobile: '1rem',
    },
    navHeight: {
      desktop: '80px',
      tablet: '70px',
      mobile: '60px',
    },
  },

  // ===========================
  // GLASSMORPHISM
  // ===========================
  glassmorphism: {
    light: {
      bg: 'rgba(255, 255, 255, 0.7)',
      border: 'rgba(255, 255, 255, 0.4)',
      backdropBlur: 'blur(20px)',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    },
    dark: {
      bg: 'rgba(30, 41, 59, 0.7)',
      border: 'rgba(100, 116, 139, 0.3)',
      backdropBlur: 'blur(20px)',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    },
  },

  // ===========================
  // BRAND GUIDELINES
  // ===========================
  guidelines: {
    // Minimum logo clear space
    logoClearSpace: '0.5em',
    // Minimum logo size
    logoMinSize: '24px',
    // Brand color usage ratios
    colorRatios: {
      primary: '60%', // Main brand color should cover ~60% of branded areas
      secondary: '30%', // Secondary colors ~30%
      accent: '10%', // Accent colors ~10%
    },
    // Accessibility
    minContrastRatio: {
      normal: 4.5, // WCAG AA for normal text
      large: 3, // WCAG AA for large text
    },
  },
} as const;

// Type helper
export type BrandConfig = typeof BRAND_CONFIG;

// Export commonly used values for convenience
export const BRAND_COLORS = BRAND_CONFIG.colors;
export const BRAND_TYPOGRAPHY = BRAND_CONFIG.typography;
export const BRAND_LOGOS = BRAND_CONFIG.logos;
