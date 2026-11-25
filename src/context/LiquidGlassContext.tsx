import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

export type GlassPanelId =
  | 'header'
  | 'hdr-neon'
  | 'hdr-theme'
  | 'hdr-search'
  | 'hdr-account'
  | 'capsule'
  | 'pill';

export interface GlassPanelDescriptor {
  /** Center X in CSS px (top-left viewport origin) */
  x: number;
  /** Center Y in CSS px (top-left viewport origin) */
  y: number;
  /** Width in CSS px */
  w: number;
  /** Height in CSS px */
  h: number;
  /** Corner radius in CSS px */
  cornerRadius: number;
  /** Optional zRadius override (defaults to Regular Glass 40) */
  zRadius?: number;
  /** Optional refraction override (defaults to Regular Glass 0.69) */
  refraction?: number;
  /** Optional subtle tint alpha override */
  tintAlpha?: number;
  /** Optional shadow opacity override (default 0) */
  shadowOpacity?: number;
  /** Optional custom tint RGB [0..1, 0..1, 0..1] */
  tintCol?: [number, number, number];
}

export type PanelRectGetter = () => GlassPanelDescriptor | null;

interface LiquidGlassContextValue {
  neonEnabled: boolean;
  toggleNeon: () => void;
  webglActive: boolean;
  setWebglActive: (active: boolean) => void;
  registerPanel: (id: GlassPanelId, getter: PanelRectGetter) => () => void;
  getPanelDescriptors: () => Partial<Record<GlassPanelId, GlassPanelDescriptor>>;
  markSceneDirty: () => void;
  consumeSceneDirty: () => boolean;
}

const NEON_STORAGE_KEY = 'seatease_neon_glass';

const LiquidGlassContext = createContext<LiquidGlassContextValue | undefined>(undefined);

export const LiquidGlassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [neonEnabled, setNeonEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(NEON_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [webglActive, setWebglActive] = useState<boolean>(false);
  const panelGettersRef = useRef<Partial<Record<GlassPanelId, PanelRectGetter>>>({});
  const sceneDirtyRef = useRef<boolean>(true);

  useEffect(() => {
    try {
      localStorage.setItem(NEON_STORAGE_KEY, String(neonEnabled));
    } catch {
      // Ignore storage errors
    }
    document.documentElement.classList.toggle('neon-glass-active', neonEnabled);
  }, [neonEnabled]);

  const toggleNeon = useCallback(() => {
    setNeonEnabled((prev) => !prev);
  }, []);

  const registerPanel = useCallback((id: GlassPanelId, getter: PanelRectGetter) => {
    panelGettersRef.current[id] = getter;
    sceneDirtyRef.current = true;
    return () => {
      if (panelGettersRef.current[id] === getter) {
        delete panelGettersRef.current[id];
      }
    };
  }, []);

  const getPanelDescriptors = useCallback(() => {
    const out: Partial<Record<GlassPanelId, GlassPanelDescriptor>> = {};
    const order: GlassPanelId[] = [
      'header',
      'hdr-neon',
      'hdr-theme',
      'hdr-search',
      'hdr-account',
      'capsule',
      'pill',
    ];
    for (const id of order) {
      const getter = panelGettersRef.current[id];
      if (getter) {
        const desc = getter();
        if (desc && desc.w > 2 && desc.h > 2) {
          out[id] = desc;
        }
      }
    }
    return out;
  }, []);

  const markSceneDirty = useCallback(() => {
    sceneDirtyRef.current = true;
  }, []);

  const consumeSceneDirty = useCallback(() => {
    if (!sceneDirtyRef.current) return false;
    sceneDirtyRef.current = false;
    return true;
  }, []);

  return (
    <LiquidGlassContext.Provider
      value={{
        neonEnabled,
        toggleNeon,
        webglActive,
        setWebglActive,
        registerPanel,
        getPanelDescriptors,
        markSceneDirty,
        consumeSceneDirty,
      }}
    >
      {children}
    </LiquidGlassContext.Provider>
  );
};

export const useLiquidGlass = (): LiquidGlassContextValue => {
  const ctx = useContext(LiquidGlassContext);
  if (!ctx) {
    throw new Error('useLiquidGlass must be used within a LiquidGlassProvider');
  }
  return ctx;
};
