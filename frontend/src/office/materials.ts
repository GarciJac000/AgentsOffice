import * as THREE from 'three';

const texCache = new Map<string, THREE.CanvasTexture>();

function canvasTex(
  key: string,
  size: number,
  paint: (ctx: CanvasRenderingContext2D, size: number) => void,
  opts: { wrap?: boolean; anisotropy?: number } = {},
): THREE.CanvasTexture {
  const cached = texCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  paint(ctx, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = opts.wrap === false ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  tex.anisotropy = opts.anisotropy ?? 8;
  tex.needsUpdate = true;
  texCache.set(key, tex);
  return tex;
}

function noise(ctx: CanvasRenderingContext2D, size: number, alpha: number, scale = 1) {
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() * 255) | 0;
    img.data[i] = n;
    img.data[i + 1] = n;
    img.data[i + 2] = n;
    img.data[i + 3] = (alpha * 255 * scale) | 0;
  }
  ctx.putImageData(img, 0, 0);
}

/** Warm wood planks with grain + darker seams — readable at isometric distance. */
export function woodMap(tint = '#8b5e3c', scale = 2): THREE.CanvasTexture {
  return canvasTex(`wood2:${tint}:${scale}`, 512, (ctx, size) => {
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, size, size);
    const plank = size / 5;
    for (let y = 0; y < size; y += plank) {
      const shade = 0.82 + Math.random() * 0.22;
      ctx.fillStyle = shadeHex(tint, shade);
      ctx.fillRect(0, y, size, plank - 3);
      ctx.strokeStyle = `rgba(30,14,6,${0.22 + Math.random() * 0.18})`;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 10; i++) {
        const gy = y + 4 + Math.random() * (plank - 8);
        ctx.beginPath();
        ctx.moveTo(0, gy);
        for (let x = 0; x < size; x += 20) {
          ctx.lineTo(x, gy + Math.sin(x * 0.035 + i) * 2.2);
        }
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(18,8,4,0.55)';
      ctx.fillRect(0, y + plank - 3, size, 3);
    }
  });
}

export function woodRoughnessMap(): THREE.CanvasTexture {
  return canvasTex('wood-rough', 256, (ctx, size) => {
    ctx.fillStyle = '#9a9a9a';
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 2) {
      ctx.fillStyle = `rgb(${120 + ((Math.random() * 80) | 0)},${120 + ((Math.random() * 80) | 0)},${120 + ((Math.random() * 80) | 0)})`;
      ctx.fillRect(0, y, size, 2);
    }
  });
}

/** Painted wall — soft roller variation, no gravel noise. */
export function paintMap(tint: string): THREE.CanvasTexture {
  return canvasTex(`paint2:${tint}`, 512, (ctx, size) => {
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 40 + Math.random() * 90;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,255,255,${0.04 + Math.random() * 0.05})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // very light vignette bands (drywall panels)
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, size - 16, size - 16);
  });
}

/** Brushed metal with horizontal streaks. */
export function brushedMetalMap(tint = '#9aa3b2'): THREE.CanvasTexture {
  return canvasTex(`metal:${tint}`, 512, (ctx, size) => {
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y++) {
      const v = 140 + ((Math.random() * 90) | 0);
      ctx.fillStyle = `rgba(${v},${v},${v + 8},${0.15 + Math.random() * 0.25})`;
      ctx.fillRect(0, y, size, 1);
    }
    // occasional brighter scratch
    for (let i = 0; i < 30; i++) {
      const y = Math.random() * size;
      ctx.strokeStyle = `rgba(255,255,255,${0.08 + Math.random() * 0.12})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y + (Math.random() - 0.5) * 2);
      ctx.stroke();
    }
  });
}

export function metalRoughnessMap(): THREE.CanvasTexture {
  return canvasTex('metal-rough', 256, (ctx, size) => {
    for (let y = 0; y < size; y++) {
      const v = 40 + ((Math.random() * 50) | 0);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(0, y, size, 1);
    }
  });
}

/** Polished studio floor tiles — clear grout, subtle sheen variation. */
export function floorMap(tint = '#3a342e'): THREE.CanvasTexture {
  return canvasTex(`floor2:${tint}`, 512, (ctx, size) => {
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, size, size);
    const tile = size / 4;
    for (let ty = 0; ty < size; ty += tile) {
      for (let tx = 0; tx < size; tx += tile) {
        ctx.fillStyle = shadeHex(tint, 0.94 + ((tx + ty) % (tile * 2) === 0 ? 0.08 : 0.02));
        ctx.fillRect(tx + 3, ty + 3, tile - 6, tile - 6);
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 3;
    for (let x = 0; x <= size; x += tile) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y <= size; y += tile) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
  });
}

export function fabricMap(tint: string): THREE.CanvasTexture {
  return canvasTex(`fabric:${tint}`, 256, (ctx, size) => {
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i += 3) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.15;
    noise(ctx, size, 1);
    ctx.globalAlpha = 1;
  });
}

export function skinMap(tint: string): THREE.CanvasTexture {
  return canvasTex(`skin:${tint}`, 256, (ctx, size) => {
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillStyle = `rgba(180,80,60,${0.02 + Math.random() * 0.04})`;
      ctx.beginPath();
      ctx.arc(x, y, 4 + Math.random() * 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.06;
    noise(ctx, size, 1);
    ctx.globalAlpha = 1;
  });
}

type MatOpts = {
  roughness?: number;
  metalness?: number;
  envMapIntensity?: number;
  map?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  metalnessMap?: THREE.Texture;
  normalScale?: number;
  emissive?: string | number;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  repeat?: [number, number];
};

function applyRepeat(tex: THREE.Texture | undefined, repeat?: [number, number]) {
  if (!tex || !repeat) return tex;
  // clone so different repeats don't fight through the cache
  const t = tex.clone();
  t.repeat.set(repeat[0], repeat[1]);
  t.needsUpdate = true;
  return t;
}

export function surface(color: string | number, opts: MatOpts = {}): THREE.MeshStandardMaterial {
  const map = applyRepeat(opts.map, opts.repeat);
  const roughnessMap = applyRepeat(opts.roughnessMap, opts.repeat);
  return new THREE.MeshStandardMaterial({
    color: map ? '#ffffff' : color,
    map: map ?? null,
    roughnessMap: roughnessMap ?? null,
    metalnessMap: opts.metalnessMap ?? null,
    roughness: opts.roughness ?? 0.55,
    metalness: opts.metalness ?? 0.05,
    envMapIntensity: opts.envMapIntensity ?? 1.1,
    emissive: opts.emissive ?? '#000000',
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    flatShading: false,
  });
}

export const mats = {
  wood: (tint = '#8b5e3c', repeat: [number, number] = [2, 2]) =>
    surface(tint, {
      map: woodMap(tint),
      roughnessMap: woodRoughnessMap(),
      roughness: 0.58,
      metalness: 0.04,
      envMapIntensity: 0.7,
      repeat,
    }),
  paint: (tint: string, repeat: [number, number] = [2, 2]) =>
    surface(tint, {
      map: paintMap(tint),
      roughness: 0.78,
      metalness: 0.0,
      envMapIntensity: 0.45,
      repeat,
    }),
  floor: (tint = '#3a342e', repeat: [number, number] = [4, 4]) =>
    surface(tint, {
      map: floorMap(tint),
      roughness: 0.42,
      metalness: 0.08,
      envMapIntensity: 1.0,
      repeat,
    }),
  metal: (tint = '#9aa3b2', repeat: [number, number] = [1, 2]) =>
    surface(tint, {
      map: brushedMetalMap(tint),
      roughnessMap: metalRoughnessMap(),
      roughness: 0.32,
      metalness: 0.85,
      envMapIntensity: 1.4,
      repeat,
    }),
  plastic: (tint: string) =>
    surface(tint, { roughness: 0.38, metalness: 0.12, envMapIntensity: 0.9 }),
  fabric: (tint: string) =>
    surface(tint, {
      map: fabricMap(tint),
      roughness: 0.9,
      metalness: 0.0,
      envMapIntensity: 0.35,
      repeat: [2, 2],
    }),
  skin: (tint: string) =>
    surface(tint, {
      map: skinMap(tint),
      roughness: 0.52,
      metalness: 0.0,
      envMapIntensity: 0.55,
    }),
  hair: (tint: string) => surface(tint, { roughness: 0.55, metalness: 0.08, envMapIntensity: 0.7 }),
  glass: (tint = '#b8dcf5') =>
    surface(tint, {
      roughness: 0.05,
      metalness: 0.25,
      envMapIntensity: 1.8,
      transparent: true,
      opacity: 0.28,
    }),
  screen: (emissive: string) =>
    surface('#060a12', {
      roughness: 0.22,
      metalness: 0.55,
      emissive,
      emissiveIntensity: 1.35,
      envMapIntensity: 0.6,
    }),
};

function shadeHex(hex: string, factor: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * factor)));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * factor)));
  const b = Math.min(255, Math.max(0, Math.round((n & 255) * factor)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
