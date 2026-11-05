import * as THREE from 'three';

/** Premium music-label palette: dark walnut, charcoal stone, smoked glass, bronze. */
export const CINEMATIC = {
  walnut: 0x3b2416,
  walnutLight: 0x5c3a24,
  charcoal: 0x1c1e22,
  charcoalLight: 0x2a2d33,
  stone: 0x2f3238,
  stoneLight: 0x3d4149,
  smokedGlass: 0x1a1c20,
  bronze: 0x8a6a45,
  bronzeBright: 0xb08d57,
  cream: 0xe8e0d4,
  leather: 0x1a1410,
  screen: 0x050608,
  pink: 0xec4899,
  warmWhite: 0xfff1d6,
};

function canvasTex(
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  size = 512,
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

export function makeWalnutTexture(): THREE.CanvasTexture {
  return canvasTex((ctx, size) => {
    ctx.fillStyle = '#3b2416';
    ctx.fillRect(0, 0, size, size);
    const plank = 40;
    const tones = ['#4a2e1c', '#3b2416', '#523222', '#2e1a10', '#5a3824'];
    for (let row = 0; row < size / plank; row++) {
      const y = row * plank;
      ctx.fillStyle = tones[row % tones.length];
      ctx.fillRect(0, y, size, plank);
      for (let g = 0; g < 6; g++) {
        ctx.strokeStyle = `rgba(20,10,5,${0.18 + (g % 3) * 0.05})`;
        ctx.lineWidth = 1;
        const gy = y + 4 + g * 6;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        for (let x = 0; x < size; x += 20) {
          ctx.lineTo(x + 10, gy + ((x + row) % 4) - 2);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(10,5,2,0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y + plank - 1);
      ctx.lineTo(size, y + plank - 1);
      ctx.stroke();
    }
  });
}

export function makeCharcoalStoneTexture(): THREE.CanvasTexture {
  return canvasTex((ctx, size) => {
    ctx.fillStyle = '#2a2d33';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 900; i++) {
      const x = (i * 47) % size;
      const y = (i * 91) % size;
      const v = 28 + (i % 40);
      ctx.fillStyle = `rgba(${v},${v + 2},${v + 6},${0.04 + (i % 5) * 0.015})`;
      ctx.fillRect(x, y, 3 + (i % 5), 2 + (i % 3));
    }
    // Soft tile seams
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const p = (i + 1) * (size / 8);
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(size, p);
      ctx.stroke();
    }
  }, 256);
}

export function makeWallPlasterTexture(): THREE.CanvasTexture {
  return canvasTex((ctx, size) => {
    ctx.fillStyle = '#1e2026';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.01 + (i % 4) * 0.008})`;
      ctx.fillRect((i * 37) % size, (i * 53) % size, 8, 5);
    }
  }, 128);
}

export function matWalnut(map?: THREE.Texture): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: CINEMATIC.walnut,
    map: map ?? null,
    roughness: 0.55,
    metalness: 0.08,
  });
}

export function matStone(map?: THREE.Texture): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: CINEMATIC.stone,
    map: map ?? null,
    roughness: 0.82,
    metalness: 0.12,
  });
}

export function matBronze(opts: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: CINEMATIC.bronze,
    roughness: 0.35,
    metalness: 0.85,
    ...opts,
  });
}

export function matSmokedGlass(): THREE.MeshStandardMaterial {
  // Standard transparent glass — avoid MeshPhysical transmission (too heavy on mobile/software GL)
  return new THREE.MeshStandardMaterial({
    color: CINEMATIC.smokedGlass,
    roughness: 0.15,
    metalness: 0.35,
    transparent: true,
    opacity: 0.42,
    envMapIntensity: 0.9,
    depthWrite: false,
  });
}

export function matLeather(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: CINEMATIC.leather,
    roughness: 0.78,
    metalness: 0.04,
  });
}

export function matCharcoal(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: CINEMATIC.charcoal,
    roughness: 0.7,
    metalness: 0.15,
  });
}

export function meshBox(
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
