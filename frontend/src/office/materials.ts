import * as THREE from 'three';

type MatOpts = {
  roughness?: number;
  metalness?: number;
  envMapIntensity?: number;
  emissive?: string | number;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
};

/** Smooth PBR surface — video-game studio look (no flat shading). */
export function surface(
  color: string | number,
  opts: MatOpts = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.55,
    metalness: opts.metalness ?? 0.05,
    envMapIntensity: opts.envMapIntensity ?? 1,
    emissive: opts.emissive ?? '#000000',
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    flatShading: false,
  });
}

export const mats = {
  wood: (color = '#6b4a2e') => surface(color, { roughness: 0.62, metalness: 0.02 }),
  paint: (color: string) => surface(color, { roughness: 0.72, metalness: 0.0 }),
  floor: (color = '#3d342c') => surface(color, { roughness: 0.48, metalness: 0.04 }),
  metal: (color = '#8b93a1') => surface(color, { roughness: 0.28, metalness: 0.78 }),
  plastic: (color: string) => surface(color, { roughness: 0.42, metalness: 0.08 }),
  fabric: (color: string) => surface(color, { roughness: 0.88, metalness: 0.0 }),
  skin: (color: string) => surface(color, { roughness: 0.58, metalness: 0.0 }),
  hair: (color: string) => surface(color, { roughness: 0.7, metalness: 0.02 }),
  glass: (color = '#9ec9e8') =>
    surface(color, { roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.32 }),
  screen: (emissive: string) =>
    surface('#0b1220', {
      roughness: 0.35,
      metalness: 0.4,
      emissive,
      emissiveIntensity: 0.85,
    }),
};
