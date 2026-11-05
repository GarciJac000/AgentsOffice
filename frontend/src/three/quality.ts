/** Progressive rendering quality for desktop vs mobile. */

export type QualityTier = 'high' | 'medium' | 'low';

export interface QualitySettings {
  tier: QualityTier;
  pixelRatio: number;
  shadowMapSize: number;
  shadows: boolean;
  antialias: boolean;
  fxaa: boolean;
  envMapIntensity: number;
  toneMappingExposure: number;
  maxAnisotropy: number;
  agentWander: boolean;
}

export function detectQuality(): QualitySettings {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const mobile = /iPhone|iPad|iPod|Android/i.test(ua);
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  if (mobile || mem <= 2 || cores <= 2) {
    return {
      tier: 'low',
      pixelRatio: Math.min(dpr, 1.25),
      shadowMapSize: 512,
      shadows: true,
      antialias: false,
      fxaa: true,
      envMapIntensity: 0.35,
      toneMappingExposure: 1.0,
      maxAnisotropy: 2,
      agentWander: true,
    };
  }

  if (mem <= 4 || cores <= 4) {
    return {
      tier: 'medium',
      pixelRatio: Math.min(dpr, 1.75),
      shadowMapSize: 1024,
      shadows: true,
      antialias: true,
      fxaa: true,
      envMapIntensity: 0.55,
      toneMappingExposure: 1.05,
      maxAnisotropy: 4,
      agentWander: true,
    };
  }

  return {
    tier: 'high',
    pixelRatio: Math.min(dpr, 2),
    shadowMapSize: 2048,
    shadows: true,
    antialias: true,
    fxaa: true,
    envMapIntensity: 0.7,
    toneMappingExposure: 1.1,
    maxAnisotropy: 8,
    agentWander: true,
  };
}
