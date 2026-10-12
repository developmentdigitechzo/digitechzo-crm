import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SidebarTheme {
  bgColor: string;       // Sidebar Background
  textColor: string;     // Sidebar Inactive Text & Icons
  accentColor: string;   // Active Item Highlight & Primary Action Buttons (e.g. + Log Interaction, + Add Lead)
}

export const DEFAULT_SIDEBAR_THEME: SidebarTheme = {
  bgColor: '#16181B',
  textColor: '#CBD5E1',
  accentColor: '#57B71B',
};

export const SIDEBAR_THEME_STORAGE_KEY = 'digitechzo_sidebar_theme';

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
  if (clean.length !== 6) return null;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b };
}

export function isColorDark(hex: string): boolean {
  if (!hex) return true;
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) return true;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return true;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < 140;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  function getLuminance(hex: string) {
    let clean = hex.replace('#', '').trim();
    if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
    if (clean.length !== 6) return 0;
    const rgb = [0, 2, 4].map((idx) => {
      const c = parseInt(clean.substring(idx, idx + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export function isValidHex(hex: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex.trim());
}

interface SidebarThemeContextType {
  appliedTheme: SidebarTheme;
  previewTheme: SidebarTheme;
  setPreviewBgColor: (color: string) => void;
  setPreviewTextColor: (color: string) => void;
  setPreviewAccentColor: (color: string) => void;
  syncAccentWithTextColor: () => void;
  applyTheme: () => void;
  resetTheme: () => void;
  hasUnappliedChanges: boolean;
  isAppliedBgDark: boolean;
  isAppliedDefault: boolean;
}

const SidebarThemeContext = createContext<SidebarThemeContextType | undefined>(undefined);

export const SidebarThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appliedTheme, setAppliedTheme] = useState<SidebarTheme>(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_THEME_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (isValidHex(parsed.bgColor) && isValidHex(parsed.textColor)) {
          return {
            bgColor: parsed.bgColor,
            textColor: parsed.textColor,
            accentColor: isValidHex(parsed.accentColor) ? parsed.accentColor : DEFAULT_SIDEBAR_THEME.accentColor,
          };
        }
      }
    } catch {
      // Fallback on error
    }
    return DEFAULT_SIDEBAR_THEME;
  });

  const [previewTheme, setPreviewTheme] = useState<SidebarTheme>(appliedTheme);

  // Sync preview theme if applied theme changes externally
  useEffect(() => {
    setPreviewTheme(appliedTheme);
  }, [appliedTheme]);

  // Inject dynamic styles & CSS variables whenever applied theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--sidebar-custom-bg', appliedTheme.bgColor);
    root.style.setProperty('--sidebar-custom-text', appliedTheme.textColor);
    root.style.setProperty('--app-accent', appliedTheme.accentColor);

    const rgb = hexToRgb(appliedTheme.accentColor) || { r: 87, g: 183, b: 27 };
    root.style.setProperty('--app-accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);

    const isAccentDark = isColorDark(appliedTheme.accentColor);
    const accentTextColor = isAccentDark ? '#FFFFFF' : '#1E242B';
    root.style.setProperty('--app-accent-text', accentTextColor);

    // Dynamic style block for overriding action buttons (+ Log Interaction, etc.) and active items
    let styleEl = document.getElementById('digitechzo-dynamic-theme-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'digitechzo-dynamic-theme-style';
      document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
      :root {
        --app-accent: ${appliedTheme.accentColor};
        --app-accent-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};
        --app-accent-text: ${accentTextColor};
      }

      /* Primary buttons (+ Log Interaction, + Add Lead, + New Task, Save, etc.) & active sidebar item */
      .bg-\\[\\#57B71B\\],
      .bg-\\[\\#55C514\\],
      .bg-brand-green,
      .bg-primary {
        background-color: var(--app-accent) !important;
        color: var(--app-accent-text) !important;
      }

      .bg-\\[\\#57B71B\\] svg,
      .bg-\\[\\#55C514\\] svg,
      .bg-brand-green svg,
      .bg-primary svg {
        color: var(--app-accent-text) !important;
        stroke: var(--app-accent-text) !important;
      }

      /* Hover states */
      .hover\\:bg-\\[\\#469815\\]:hover,
      .hover\\:bg-brand-green-hover:hover {
        filter: brightness(0.92) !important;
      }

      /* Brand highlights and text badges */
      .text-\\[\\#57B71B\\],
      .text-\\[\\#55C514\\],
      .text-brand-green,
      .text-primary {
        color: var(--app-accent) !important;
      }

      /* Active metric card borders (Total Logged, etc.) and active tab borders */
      .border-\\[\\#57B71B\\],
      .border-\\[\\#55C514\\],
      .border-brand-green,
      .border-primary {
        border-color: var(--app-accent) !important;
      }

      /* Active halos and focus rings */
      .ring-\\[\\#57B71B\\],
      .ring-\\[\\#55C514\\],
      .ring-primary,
      .ring-\\[\\#57B71B\\]\\/30,
      .ring-\\[\\#55C514\\]\\/30 {
        --tw-ring-color: rgba(var(--app-accent-rgb), 0.35) !important;
      }
    `;
  }, [appliedTheme]);

  const setPreviewBgColor = (color: string) => {
    setPreviewTheme((prev) => ({ ...prev, bgColor: color }));
  };

  const setPreviewTextColor = (color: string) => {
    setPreviewTheme((prev) => ({ ...prev, textColor: color }));
  };

  const setPreviewAccentColor = (color: string) => {
    setPreviewTheme((prev) => ({ ...prev, accentColor: color }));
  };

  const syncAccentWithTextColor = () => {
    setPreviewTheme((prev) => ({ ...prev, accentColor: prev.textColor }));
  };

  const applyTheme = () => {
    if (
      !isValidHex(previewTheme.bgColor) ||
      !isValidHex(previewTheme.textColor) ||
      !isValidHex(previewTheme.accentColor)
    ) {
      return;
    }
    setAppliedTheme(previewTheme);
    try {
      localStorage.setItem(SIDEBAR_THEME_STORAGE_KEY, JSON.stringify(previewTheme));
    } catch (e) {
      console.error('Failed to save sidebar theme in localStorage', e);
    }
  };

  const resetTheme = () => {
    setAppliedTheme(DEFAULT_SIDEBAR_THEME);
    setPreviewTheme(DEFAULT_SIDEBAR_THEME);
    try {
      localStorage.removeItem(SIDEBAR_THEME_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to remove sidebar theme from localStorage', e);
    }
  };

  const hasUnappliedChanges =
    previewTheme.bgColor.toUpperCase() !== appliedTheme.bgColor.toUpperCase() ||
    previewTheme.textColor.toUpperCase() !== appliedTheme.textColor.toUpperCase() ||
    previewTheme.accentColor.toUpperCase() !== appliedTheme.accentColor.toUpperCase();

  const isAppliedBgDark = isColorDark(appliedTheme.bgColor);
  const isAppliedDefault =
    appliedTheme.bgColor.toUpperCase() === DEFAULT_SIDEBAR_THEME.bgColor.toUpperCase() &&
    appliedTheme.textColor.toUpperCase() === DEFAULT_SIDEBAR_THEME.textColor.toUpperCase() &&
    appliedTheme.accentColor.toUpperCase() === DEFAULT_SIDEBAR_THEME.accentColor.toUpperCase();

  return (
    <SidebarThemeContext.Provider
      value={{
        appliedTheme,
        previewTheme,
        setPreviewBgColor,
        setPreviewTextColor,
        setPreviewAccentColor,
        syncAccentWithTextColor,
        applyTheme,
        resetTheme,
        hasUnappliedChanges,
        isAppliedBgDark,
        isAppliedDefault,
      }}
    >
      {children}
    </SidebarThemeContext.Provider>
  );
};

export function useSidebarTheme() {
  const context = useContext(SidebarThemeContext);
  if (!context) {
    throw new Error('useSidebarTheme must be used within a SidebarThemeProvider');
  }
  return context;
}
