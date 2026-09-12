import { useState, useEffect } from 'react';

export type PlatformMode = 'auto' | 'mobile' | 'desktop';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface PlatformState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  detectedType: DeviceType;
  effectiveMode: 'mobile' | 'desktop';
  platformMode: PlatformMode;
  screenWidth: number;
  screenHeight: number;
  setPlatformMode: (mode: PlatformMode) => void;
}

const STORAGE_KEY = 'hospital_platform_preference_v1';

export function usePlatform(): PlatformState {
  const [screenWidth, setScreenWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const [screenHeight, setScreenHeight] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? 'ontouchstart' in window || navigator.maxTouchPoints > 0
      : false
  );
  const [platformMode, setPlatformModeState] = useState<PlatformMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'mobile' || saved === 'desktop' || saved === 'auto') {
        return saved;
      }
    }
    return 'auto';
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const setPlatformMode = (mode: PlatformMode) => {
    setPlatformModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  };

  // Detected device type by viewport
  const detectedType: DeviceType =
    screenWidth < 768 ? 'mobile' : screenWidth < 1024 ? 'tablet' : 'desktop';

  // Effective mode considers user manual override
  const effectiveMode: 'mobile' | 'desktop' =
    platformMode === 'auto'
      ? detectedType === 'mobile'
        ? 'mobile'
        : 'desktop'
      : platformMode;

  const isMobile = effectiveMode === 'mobile';
  const isTablet = platformMode === 'auto' && detectedType === 'tablet';
  const isDesktop = effectiveMode === 'desktop' && !isTablet;

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    detectedType,
    effectiveMode,
    platformMode,
    screenWidth,
    screenHeight,
    setPlatformMode,
  };
}
