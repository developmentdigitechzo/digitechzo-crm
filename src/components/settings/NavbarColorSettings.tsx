import React, { useState } from 'react';
import {
  useSidebarTheme,
  DEFAULT_SIDEBAR_THEME,
  isValidHex,
  getContrastRatio,
  isColorDark,
} from '@/context/SidebarThemeContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Palette,
  Check,
  RotateCcw,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Users,
  KanbanSquare,
  Settings as SettingsIcon,
  PlusCircle,
  Activity,
  Wand2,
} from 'lucide-react';

const PRESET_PALETTES = [
  {
    name: 'Default DigiTechzo',
    bgColor: '#16181B',
    textColor: '#CBD5E1',
    accentColor: '#57B71B',
    description: 'Signature dark sidebar with DigiTechzo green buttons',
  },
  {
    name: 'Midnight Gold',
    bgColor: '#0F172A',
    textColor: '#FDE68A',
    accentColor: '#F59E0B',
    description: 'Deep navy background with elegant warm gold text and buttons',
  },
  {
    name: 'Royal Sapphire',
    bgColor: '#0B1E36',
    textColor: '#E0E7FF',
    accentColor: '#2563EB',
    description: 'Executive navy with vibrant cobalt blue action buttons',
  },
  {
    name: 'Deep Charcoal & Purple',
    bgColor: '#18181B',
    textColor: '#F4F4F5',
    accentColor: '#7C3AED',
    description: 'Modern zinc with electric violet action buttons',
  },
  {
    name: 'Forest Emerald',
    bgColor: '#062B1D',
    textColor: '#D1FAE5',
    accentColor: '#10B981',
    description: 'Earthy emerald green theme throughout sidebar and actions',
  },
  {
    name: 'Clean Light & Blue',
    bgColor: '#FFFFFF',
    textColor: '#1E293B',
    accentColor: '#2563EB',
    description: 'High-contrast bright white sidebar with royal blue buttons',
  },
];

const PRESET_BG_COLORS = [
  '#16181B',
  '#0F172A',
  '#18181B',
  '#0B1E36',
  '#062B1D',
  '#1F1D36',
  '#27272A',
  '#FFFFFF',
];

const PRESET_TEXT_COLORS = [
  '#CBD5E1',
  '#FFFFFF',
  '#94A3B8',
  '#E2E8F0',
  '#A7F3D0',
  '#FDE68A',
  '#BAE6FD',
  '#1E293B',
];

const PRESET_ACCENT_COLORS = [
  '#57B71B',
  '#2563EB',
  '#7C3AED',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#10B981',
  '#EC4899',
];

export const NavbarColorSettings: React.FC = () => {
  const {
    appliedTheme,
    previewTheme,
    setPreviewBgColor,
    setPreviewTextColor,
    setPreviewAccentColor,
    syncAccentWithTextColor,
    applyTheme,
    resetTheme,
    hasUnappliedChanges,
    isAppliedDefault,
  } = useSidebarTheme();

  const [bgInput, setBgInput] = useState<string>(previewTheme.bgColor);
  const [textInput, setTextInput] = useState<string>(previewTheme.textColor);
  const [accentInput, setAccentInput] = useState<string>(previewTheme.accentColor);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync inputs with preview theme
  React.useEffect(() => {
    setBgInput(previewTheme.bgColor);
  }, [previewTheme.bgColor]);

  React.useEffect(() => {
    setTextInput(previewTheme.textColor);
  }, [previewTheme.textColor]);

  React.useEffect(() => {
    setAccentInput(previewTheme.accentColor);
  }, [previewTheme.accentColor]);

  const handleBgColorPicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setBgInput(val);
    setPreviewBgColor(val);
  };

  const handleBgTextInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#') && val.length > 0) {
      val = '#' + val;
    }
    setBgInput(val);
    if (isValidHex(val)) {
      setPreviewBgColor(val.toUpperCase());
    }
  };

  const handleTextColorPicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setTextInput(val);
    setPreviewTextColor(val);
  };

  const handleTextTextInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#') && val.length > 0) {
      val = '#' + val;
    }
    setTextInput(val);
    if (isValidHex(val)) {
      setPreviewTextColor(val.toUpperCase());
    }
  };

  const handleAccentColorPicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setAccentInput(val);
    setPreviewAccentColor(val);
  };

  const handleAccentTextInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#') && val.length > 0) {
      val = '#' + val;
    }
    setAccentInput(val);
    if (isValidHex(val)) {
      setPreviewAccentColor(val.toUpperCase());
    }
  };

  const handleApplyPalette = (palette: { bgColor: string; textColor: string; accentColor: string }) => {
    setBgInput(palette.bgColor);
    setTextInput(palette.textColor);
    setAccentInput(palette.accentColor);
    setPreviewBgColor(palette.bgColor);
    setPreviewTextColor(palette.textColor);
    setPreviewAccentColor(palette.accentColor);
  };

  const handleApply = () => {
    if (!isValidHex(bgInput) || !isValidHex(textInput) || !isValidHex(accentInput)) return;
    applyTheme();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    resetTheme();
    setBgInput(DEFAULT_SIDEBAR_THEME.bgColor);
    setTextInput(DEFAULT_SIDEBAR_THEME.textColor);
    setAccentInput(DEFAULT_SIDEBAR_THEME.accentColor);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const contrast = getContrastRatio(previewTheme.bgColor, previewTheme.textColor);
  const isPreviewBgDark = isColorDark(previewTheme.bgColor);
  const isContrastSufficient = contrast >= 4.5;
  const isBgValid = isValidHex(bgInput);
  const isTextValid = isValidHex(textInput);
  const isAccentValid = isValidHex(accentInput);
  const isAccentDark = isColorDark(previewTheme.accentColor);
  const accentTextColor = isAccentDark ? '#FFFFFF' : '#1E242B';

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-card border border-border shadow-card">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#57B71B]/10 text-[#57B71B] flex items-center justify-center shrink-0 border border-[#57B71B]/20">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-txt-primary flex items-center gap-2">
              Sidebar & Unified CRM Color Customization
              {!isAppliedDefault && (
                <Badge variant="success" className="text-[10px]">
                  Custom Palette Active
                </Badge>
              )}
            </h3>
            <p className="text-xs text-txt-muted mt-0.5">
              Customize the sidebar background, text/icon colors, and the action button accent (e.g. "+ Log Interaction", active menus) for a unified look.
              <span className="ml-2 font-mono text-[10px] text-txt-secondary">
                (Live: BG {appliedTheme.bgColor} &bull; Text {appliedTheme.textColor} &bull; Accent {appliedTheme.accentColor})
              </span>
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="h-8 px-3 text-xs font-semibold text-txt-secondary hover:text-txt-primary cursor-pointer"
            title="Reset to default DigiTechzo colors"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset to Default
          </Button>

          <Button
            size="sm"
            onClick={handleApply}
            disabled={!hasUnappliedChanges || !isBgValid || !isTextValid || !isAccentValid}
            className={`h-8 px-4 text-xs font-semibold cursor-pointer transition-all ${
              hasUnappliedChanges
                ? 'bg-[#57B71B] hover:bg-[#469815] text-white shadow-sm'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Apply Changes
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2.5 p-3 rounded-card bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Colors saved successfully! The unified color palette is now active across your sidebar and action buttons.</span>
        </div>
      )}

      {/* Main Grid: Controls on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: 3 Color Pickers + Presets (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card 1: Background Color Setting */}
          <Card className="border-border shadow-card bg-white">
            <CardHeader className="py-3.5 px-4 border-b border-border">
              <CardTitle className="text-xs font-bold text-txt-primary flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div
                    className="h-3.5 w-3.5 rounded-full border border-black/20 shadow-xs"
                    style={{ backgroundColor: isBgValid ? previewTheme.bgColor : '#16181B' }}
                  />
                  1. Sidebar Background Color
                </span>
                <span className="font-mono text-[11px] text-txt-muted uppercase">
                  {previewTheme.bgColor}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative h-10 w-14 rounded-btn border border-border shadow-xs overflow-hidden shrink-0 cursor-pointer">
                    <input
                      type="color"
                      value={isBgValid ? previewTheme.bgColor : '#16181B'}
                      onChange={handleBgColorPicker}
                      className="absolute -top-3 -left-3 h-16 w-20 cursor-pointer border-0 p-0"
                      aria-label="Sidebar background color picker"
                    />
                  </div>
                  <span className="text-xs font-medium text-txt-secondary sm:hidden">
                    Pick color
                  </span>
                </div>

                <div className="flex-1">
                  <Input
                    type="text"
                    value={bgInput}
                    onChange={handleBgTextInput}
                    placeholder="#16181B"
                    maxLength={7}
                    className={`h-9 font-mono text-xs uppercase ${
                      !isBgValid ? 'border-danger focus-visible:ring-danger' : ''
                    }`}
                  />
                  {!isBgValid && (
                    <span className="text-[11px] text-danger font-medium mt-1 block">
                      Invalid HEX format (e.g. #16181B)
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-1">
                <span className="text-[11px] font-semibold text-txt-muted block mb-1.5">
                  Popular Background Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_BG_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setBgInput(color);
                        setPreviewBgColor(color);
                      }}
                      className={`h-6 w-7 rounded-badge border transition-all cursor-pointer flex items-center justify-center ${
                        previewTheme.bgColor.toUpperCase() === color.toUpperCase()
                          ? 'ring-2 ring-[#57B71B] border-transparent scale-105'
                          : 'border-black/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Select ${color}`}
                    >
                      {previewTheme.bgColor.toUpperCase() === color.toUpperCase() && (
                        <Check
                          className="h-3 w-3"
                          style={{ color: isColorDark(color) ? '#FFFFFF' : '#000000' }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Text & Icon Color Setting */}
          <Card className="border-border shadow-card bg-white">
            <CardHeader className="py-3.5 px-4 border-b border-border">
              <CardTitle className="text-xs font-bold text-txt-primary flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div
                    className="h-3.5 w-3.5 rounded-full border border-black/20 shadow-xs"
                    style={{ backgroundColor: isTextValid ? previewTheme.textColor : '#CBD5E1' }}
                  />
                  2. Sidebar Text & Icon Color
                </span>
                <span className="font-mono text-[11px] text-txt-muted uppercase">
                  {previewTheme.textColor}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative h-10 w-14 rounded-btn border border-border shadow-xs overflow-hidden shrink-0 cursor-pointer">
                    <input
                      type="color"
                      value={isTextValid ? previewTheme.textColor : '#CBD5E1'}
                      onChange={handleTextColorPicker}
                      className="absolute -top-3 -left-3 h-16 w-20 cursor-pointer border-0 p-0"
                      aria-label="Sidebar text color picker"
                    />
                  </div>
                  <span className="text-xs font-medium text-txt-secondary sm:hidden">
                    Pick color
                  </span>
                </div>

                <div className="flex-1">
                  <Input
                    type="text"
                    value={textInput}
                    onChange={handleTextTextInput}
                    placeholder="#CBD5E1"
                    maxLength={7}
                    className={`h-9 font-mono text-xs uppercase ${
                      !isTextValid ? 'border-danger focus-visible:ring-danger' : ''
                    }`}
                  />
                  {!isTextValid && (
                    <span className="text-[11px] text-danger font-medium mt-1 block">
                      Invalid HEX format (e.g. #CBD5E1)
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-1">
                <span className="text-[11px] font-semibold text-txt-muted block mb-1.5">
                  Popular Text Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setTextInput(color);
                        setPreviewTextColor(color);
                      }}
                      className={`h-6 w-7 rounded-badge border transition-all cursor-pointer flex items-center justify-center ${
                        previewTheme.textColor.toUpperCase() === color.toUpperCase()
                          ? 'ring-2 ring-[#57B71B] border-transparent scale-105'
                          : 'border-black/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Select ${color}`}
                    >
                      {previewTheme.textColor.toUpperCase() === color.toUpperCase() && (
                        <Check
                          className="h-3 w-3"
                          style={{ color: isColorDark(color) ? '#FFFFFF' : '#000000' }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Action Buttons & Accent Highlight Color */}
          <Card className="border-border shadow-card bg-white">
            <CardHeader className="py-3.5 px-4 border-b border-border">
              <CardTitle className="text-xs font-bold text-txt-primary flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div
                    className="h-3.5 w-3.5 rounded-full border border-black/20 shadow-xs"
                    style={{ backgroundColor: isAccentValid ? previewTheme.accentColor : '#57B71B' }}
                  />
                  3. Action Buttons & Active Menu Highlight
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={syncAccentWithTextColor}
                    className="h-6 px-2 text-[10px] font-semibold text-txt-secondary hover:text-txt-primary cursor-pointer"
                    title="Match action buttons with text color for uniform look"
                  >
                    <Wand2 className="h-3 w-3 mr-1 text-[#57B71B]" />
                    Match with Text
                  </Button>
                  <span className="font-mono text-[11px] text-txt-muted uppercase">
                    {previewTheme.accentColor}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5">
              <p className="text-[11px] text-txt-muted">
                Controls the active sidebar menu highlight (e.g. Settings) and primary action buttons across pages (e.g. <strong>"+ Log Interaction"</strong> on Activities, <strong>"+ Add Lead"</strong>, save buttons, metric card highlights).
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative h-10 w-14 rounded-btn border border-border shadow-xs overflow-hidden shrink-0 cursor-pointer">
                    <input
                      type="color"
                      value={isAccentValid ? previewTheme.accentColor : '#57B71B'}
                      onChange={handleAccentColorPicker}
                      className="absolute -top-3 -left-3 h-16 w-20 cursor-pointer border-0 p-0"
                      aria-label="Action button and active menu accent color picker"
                    />
                  </div>
                  <span className="text-xs font-medium text-txt-secondary sm:hidden">
                    Pick color
                  </span>
                </div>

                <div className="flex-1">
                  <Input
                    type="text"
                    value={accentInput}
                    onChange={handleAccentTextInput}
                    placeholder="#57B71B"
                    maxLength={7}
                    className={`h-9 font-mono text-xs uppercase ${
                      !isAccentValid ? 'border-danger focus-visible:ring-danger' : ''
                    }`}
                  />
                  {!isAccentValid && (
                    <span className="text-[11px] text-danger font-medium mt-1 block">
                      Invalid HEX format (e.g. #57B71B)
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-1">
                <span className="text-[11px] font-semibold text-txt-muted block mb-1.5">
                  Popular Action & Accent Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_ACCENT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setAccentInput(color);
                        setPreviewAccentColor(color);
                      }}
                      className={`h-6 w-7 rounded-badge border transition-all cursor-pointer flex items-center justify-center ${
                        previewTheme.accentColor.toUpperCase() === color.toUpperCase()
                          ? 'ring-2 ring-slate-800 border-transparent scale-105'
                          : 'border-black/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Select ${color}`}
                    >
                      {previewTheme.accentColor.toUpperCase() === color.toUpperCase() && (
                        <Check
                          className="h-3 w-3"
                          style={{ color: isColorDark(color) ? '#FFFFFF' : '#000000' }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: 1-Click Harmonized Palettes */}
          <Card className="border-border shadow-card bg-white">
            <CardHeader className="py-3 px-4 border-b border-border">
              <CardTitle className="text-xs font-bold text-txt-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#57B71B]" />
                Harmonized Palettes (1-Click Uniform Themes)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {PRESET_PALETTES.map((palette) => {
                  const isSelected =
                    previewTheme.bgColor.toUpperCase() === palette.bgColor.toUpperCase() &&
                    previewTheme.textColor.toUpperCase() === palette.textColor.toUpperCase() &&
                    previewTheme.accentColor.toUpperCase() === palette.accentColor.toUpperCase();

                  return (
                    <button
                      key={palette.name}
                      type="button"
                      onClick={() => handleApplyPalette(palette)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#57B71B] ring-2 ring-[#57B71B]/20 bg-emerald-50/30'
                          : 'border-border hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-[11px] text-txt-primary">
                          {palette.name}
                        </span>
                        {isSelected && <Check className="h-3 w-3 text-[#57B71B]" />}
                      </div>

                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span
                          className="h-4 w-5 rounded-sm border border-black/10 inline-block shadow-2xs"
                          style={{ backgroundColor: palette.bgColor }}
                          title={`Sidebar BG: ${palette.bgColor}`}
                        />
                        <span
                          className="h-4 w-5 rounded-sm border border-black/10 inline-block shadow-2xs"
                          style={{ backgroundColor: palette.textColor }}
                          title={`Sidebar Text: ${palette.textColor}`}
                        />
                        <span
                          className="h-4 w-5 rounded-sm border border-black/10 inline-block shadow-2xs"
                          style={{ backgroundColor: palette.accentColor }}
                          title={`Buttons & Accent: ${palette.accentColor}`}
                        />
                      </div>
                      <p className="text-[10px] text-txt-muted line-clamp-1">
                        {palette.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Unified Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border shadow-card bg-white sticky top-20">
            <CardHeader className="py-3.5 px-4 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-txt-primary flex items-center gap-2">
                <Eye className="h-4 w-4 text-[#57B71B]" />
                Live Unified Preview
              </CardTitle>
              <Badge
                variant={isContrastSufficient ? 'success' : 'warning'}
                className="text-[10px] font-mono"
              >
                Contrast: {contrast.toFixed(1)}:1 {isContrastSufficient ? '✓ AA' : '⚠ Low'}
              </Badge>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-txt-primary mb-1.5">
                  1. Sidebar Navigation Preview:
                </p>

                {/* Mockup Sidebar Container */}
                <div
                  className="rounded-xl border shadow-lg overflow-hidden transition-colors duration-200"
                  style={{
                    backgroundColor: previewTheme.bgColor,
                    color: previewTheme.textColor,
                    borderColor: isPreviewBgDark ? '#2D3238' : 'rgba(0,0,0,0.15)',
                  }}
                >
                  {/* Mock Header */}
                  <div
                    className="flex items-center justify-between px-3.5 py-3 border-b"
                    style={{
                      borderColor: isPreviewBgDark ? '#2D3238' : 'rgba(0,0,0,0.1)',
                    }}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="h-8 w-8 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 shadow-xs">
                        <img
                          src="/assets/images/logo.png"
                          alt="DigiTechzo"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <span
                          className="font-extrabold text-xs tracking-tight block leading-tight truncate"
                          style={{ color: previewTheme.textColor }}
                        >
                          DigiTechzo
                        </span>
                        <span
                          className="text-[9px] font-bold tracking-wider block uppercase"
                          style={{ color: previewTheme.accentColor }}
                        >
                          CRM Platform
                        </span>
                      </div>
                    </div>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                      style={{
                        backgroundColor: isPreviewBgDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        color: previewTheme.textColor,
                      }}
                    >
                      Demo
                    </span>
                  </div>

                  {/* Mock Nav Items */}
                  <div className="p-2 space-y-1">
                    {/* Inactive Item: Leads */}
                    <div
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors"
                      style={{ color: previewTheme.textColor }}
                    >
                      <Users className="h-4 w-4 shrink-0" style={{ color: previewTheme.textColor }} />
                      <span className="truncate">Leads</span>
                    </div>

                    {/* Inactive Item: Pipeline */}
                    <div
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors"
                      style={{ color: previewTheme.textColor }}
                    >
                      <KanbanSquare className="h-4 w-4 shrink-0" style={{ color: previewTheme.textColor }} />
                      <span className="truncate">Pipeline</span>
                    </div>

                    {/* Active Item: Styled with previewTheme.accentColor */}
                    <div
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-semibold text-xs shadow-xs transition-colors"
                      style={{
                        backgroundColor: previewTheme.accentColor,
                        color: accentTextColor,
                      }}
                    >
                      <SettingsIcon
                        className="h-4 w-4 shrink-0"
                        style={{ color: accentTextColor }}
                      />
                      <span className="truncate">Settings (Active Menu)</span>
                    </div>
                  </div>

                  {/* Mock Profile Footer */}
                  <div
                    className="p-2.5 border-t"
                    style={{
                      backgroundColor: isPreviewBgDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)',
                      borderColor: isPreviewBgDark ? '#2D3238' : 'rgba(0,0,0,0.1)',
                    }}
                  >
                    <div
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border"
                      style={{
                        backgroundColor: isPreviewBgDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                        borderColor: isPreviewBgDark ? '#2D3238' : 'rgba(0,0,0,0.1)',
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="h-6 w-6 rounded-md font-bold text-[10px] flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: isPreviewBgDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                            color: previewTheme.textColor,
                            borderColor: isPreviewBgDark ? '#2D3238' : 'rgba(0,0,0,0.1)',
                          }}
                        >
                          A
                        </div>
                        <div className="min-w-0">
                          <span
                            className="font-semibold text-[11px] block truncate leading-tight"
                            style={{ color: previewTheme.textColor }}
                          >
                            DigiTechzo Admin
                          </span>
                        </div>
                      </div>
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: previewTheme.accentColor }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Page Action Buttons Preview (e.g. Activities Page + Log Interaction) */}
              <div className="pt-2 border-t border-border">
                <p className="text-[11px] font-semibold text-txt-primary mb-2">
                  2. Page Buttons & Elements Preview (Activities / Leads):
                </p>

                <div className="p-3 rounded-lg border border-border bg-slate-50/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-txt-primary">Activities Page</span>
                    {/* Simulated + Log Interaction Button */}
                    <button
                      type="button"
                      className="inline-flex items-center justify-center h-7 px-3 rounded-btn text-[11px] font-semibold shadow-xs cursor-default transition-colors"
                      style={{
                        backgroundColor: previewTheme.accentColor,
                        color: accentTextColor,
                      }}
                    >
                      <PlusCircle className="mr-1 h-3.5 w-3.5" style={{ color: accentTextColor }} />
                      Log Interaction
                    </button>
                  </div>

                  {/* Simulated Metric Card Highlight */}
                  <div
                    className="p-2.5 rounded-lg border bg-white flex items-center justify-between"
                    style={{
                      borderColor: previewTheme.accentColor,
                      boxShadow: `0 0 0 1px ${previewTheme.accentColor}33`,
                    }}
                  >
                    <div>
                      <span className="text-[10px] text-txt-muted uppercase font-bold block">
                        Total Logged
                      </span>
                      <span className="text-base font-extrabold text-txt-primary leading-tight block">
                        21
                      </span>
                      <span className="text-[10px] text-txt-muted">Chronological events</span>
                    </div>
                    <div
                      className="h-7 w-7 rounded-md flex items-center justify-center"
                      style={{
                        backgroundColor: `${previewTheme.accentColor}18`,
                        color: previewTheme.accentColor,
                      }}
                    >
                      <Activity className="h-4 w-4" style={{ color: previewTheme.accentColor }} />
                    </div>
                  </div>
                </div>
              </div>

              {!isContrastSufficient && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    <strong>Contrast Alert:</strong> Menu text may be difficult to read on this background. A ratio of 4.5:1 or higher is recommended.
                  </span>
                </div>
              )}
            </CardContent>

            <CardFooter className="py-3 px-4 border-t border-border bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <span className="text-[11px] text-txt-muted">
                {hasUnappliedChanges ? '⚠️ Unapplied changes in preview' : '✓ Live CRM matches preview'}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                  className="h-8 px-2.5 text-xs font-medium cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>

                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={!hasUnappliedChanges || !isBgValid || !isTextValid || !isAccentValid}
                  className={`h-8 px-3 text-xs font-semibold cursor-pointer ${
                    hasUnappliedChanges
                      ? 'bg-[#57B71B] hover:bg-[#469815] text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Apply Changes
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};
