import * as THREE from 'three';
import { ROOM_SIZE } from './rooms';

/**
 * Realistic Gather-style PRIM8 studio shell.
 * Procedural architecture with PBR materials, mullioned windows,
 * detailed desks/chairs, and soft ceiling lighting.
 */

const C = {
  plaster: 0xf3f0ea,
  plasterDeep: 0xe7e2d8,
  oak: 0xb8956a,
  oakDark: 0x8f6e45,
  oakLight: 0xd2b48c,
  white: 0xf8f7f4,
  charcoal: 0x1f2937,
  metal: 0xa8b2bf,
  metalDark: 0x4b5563,
  glassBlue: 0xb8d4e8,
  sofa: 0x1a3558,
  sofaLight: 0x27466d,
  rug: 0xddd8cf,
  rugAccent: 0xec4899,
  plant: 0x3f9e5a,
  plantDeep: 0x2d6a40,
  pot: 0xf1efe8,
  screen: 0x0b1220,
  pink: 0xec4899,
  warmEmit: 0xfff1c9,
};

function std(color: number, opts: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
    metalness: 0.04,
    ...opts,
  });
}

function mesh(
  geo: THREE.BufferGeometry,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function box(
  w: number,
  h: number,
  d: number,
  color: number,
  x: number,
  y: number,
  z: number,
  opts?: THREE.MeshStandardMaterialParameters,
) {
  return mesh(new THREE.BoxGeometry(w, h, d), std(color, opts), x, y, z);
}

/** Soft-noise canvas used as albedo / roughness variation. */
function noiseTexture(
  size: number,
  base: string,
  variance: number,
  opts?: { stripes?: boolean; stripeColor?: string },
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  if (opts?.stripes) {
    for (let i = 0; i < size; i += 10) {
      ctx.fillStyle = i % 20 === 0 ? opts.stripeColor || '#00000018' : '#ffffff10';
      ctx.fillRect(0, i, size, 9);
    }
  }
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * variance;
    img.data[i] = Math.min(255, Math.max(0, img.data[i] + n));
    img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + n));
    img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function makeSkyTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#8ec8ef');
  g.addColorStop(0.45, '#c5e4f5');
  g.addColorStop(0.72, '#9bbfd4');
  g.addColorStop(1, '#6a9ab0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 512);

  // distant hills
  ctx.fillStyle = '#4a7a58';
  ctx.beginPath();
  ctx.moveTo(0, 360);
  ctx.quadraticCurveTo(180, 280, 360, 350);
  ctx.quadraticCurveTo(560, 410, 780, 330);
  ctx.quadraticCurveTo(920, 290, 1024, 340);
  ctx.lineTo(1024, 512);
  ctx.lineTo(0, 512);
  ctx.fill();

  // Golden Gate hint
  ctx.strokeStyle = '#c45c4a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(560, 340);
  ctx.quadraticCurveTo(700, 230, 860, 335);
  ctx.stroke();
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const x = 560 + 300 * t;
    const y = 340 - Math.sin(t * Math.PI) * 95;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, 365);
    ctx.stroke();
  }

  // soft sun disc
  const sun = ctx.createRadialGradient(820, 120, 4, 820, 120, 70);
  sun.addColorStop(0, '#fff7d6');
  sun.addColorStop(1, '#fff7d600');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(820, 120, 70, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makePrim8ScreenTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 576;
  const ctx = c.getContext('2d')!;
  const bg = ctx.createLinearGradient(0, 0, 1024, 576);
  bg.addColorStop(0, '#0b0c0e');
  bg.addColorStop(1, '#1a1020');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 576);

  // vignette hex grid
  ctx.strokeStyle = '#ec489922';
  ctx.lineWidth = 1.5;
  for (let y = 40; y < 576; y += 48) {
    for (let x = 40; x < 1024; x += 56) {
      ctx.strokeRect(x, y, 40, 34);
    }
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 140px "Avenir Next", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PRIM', 460, 290);
  ctx.fillStyle = '#ec4899';
  ctx.shadowColor = '#ec4899';
  ctx.shadowBlur = 28;
  ctx.fillText('8', 680, 290);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ffffff88';
  ctx.font = '600 28px system-ui, sans-serif';
  ctx.fillText('PRODUCTIONS  ·  STUDIO FLOOR', 512, 390);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function addPlant(parent: THREE.Object3D, x: number, z: number, scale = 1) {
  const g = new THREE.Group();
  g.add(
    mesh(
      new THREE.CylinderGeometry(0.16 * scale, 0.2 * scale, 0.28 * scale, 16),
      std(C.pot, { roughness: 0.55 }),
      0,
      0.14 * scale,
      0,
    ),
  );
  g.add(
    mesh(
      new THREE.CylinderGeometry(0.015, 0.02, 0.38 * scale, 8),
      std(0x5b4030),
      0,
      0.42 * scale,
      0,
    ),
  );
  const canopy = new THREE.Group();
  canopy.position.y = 0.7 * scale;
  const leafMat = std(C.plant, { roughness: 0.65 });
  const leafDeep = std(C.plantDeep, { roughness: 0.7 });
  for (const [lx, ly, lz, r, deep] of [
    [0, 0, 0, 0.3, false],
    [0.18, 0.05, 0.08, 0.2, true],
    [-0.16, 0.08, -0.1, 0.22, false],
    [0.05, 0.18, -0.14, 0.18, true],
    [-0.08, 0.14, 0.16, 0.17, false],
  ] as const) {
    const leaf = mesh(
      new THREE.SphereGeometry(r * scale, 14, 12),
      deep ? leafDeep : leafMat,
      lx * scale,
      ly * scale,
      lz * scale,
    );
    canopy.add(leaf);
  }
  g.add(canopy);
  g.position.set(x, 0, z);
  parent.add(g);
}

function addDesk(parent: THREE.Object3D, x: number, z: number, rotY = 0) {
  const g = new THREE.Group();
  const topMat = std(C.white, { roughness: 0.35, metalness: 0.08 });
  const oakMat = std(C.oak, { roughness: 0.7 });

  // thickened desk top with oak edge so tops read against the floor
  g.add(mesh(new THREE.BoxGeometry(1.45, 0.05, 0.72), topMat, 0, 0.74, 0));
  g.add(mesh(new THREE.BoxGeometry(1.48, 0.04, 0.76), oakMat, 0, 0.695, 0));

  // sled legs — charcoal so silhouettes hold in isometric light
  for (const lx of [-0.58, 0.58]) {
    g.add(mesh(new THREE.BoxGeometry(0.06, 0.7, 0.6), std(0x2a2f38, { metalness: 0.45, roughness: 0.42 }), lx, 0.35, 0));
  }

  // dual monitors
  const stand = mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.12, 12), std(C.metalDark, { metalness: 0.6, roughness: 0.35 }), 0, 0.8, -0.05);
  g.add(stand);
  const arm = mesh(new THREE.BoxGeometry(0.5, 0.03, 0.03), std(C.metal, { metalness: 0.55, roughness: 0.35 }), 0, 0.95, -0.12);
  g.add(arm);
  for (const sx of [-0.22, 0.22]) {
    const bezel = mesh(new THREE.BoxGeometry(0.38, 0.26, 0.03), std(C.charcoal, { roughness: 0.45 }), sx, 0.98, -0.16);
    g.add(bezel);
    const panel = mesh(
      new THREE.BoxGeometry(0.34, 0.22, 0.01),
      std(C.screen, { emissive: 0x224466, emissiveIntensity: 0.35, roughness: 0.25 }),
      sx,
      0.98,
      -0.145,
    );
    g.add(panel);
  }

  // keyboard + mouse pad
  g.add(mesh(new THREE.BoxGeometry(0.36, 0.015, 0.13), std(0x374151, { roughness: 0.55 }), 0, 0.78, 0.16));
  g.add(mesh(new THREE.BoxGeometry(0.22, 0.008, 0.2), std(0x111827, { roughness: 0.7 }), 0.42, 0.775, 0.1));
  g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.025, 12), std(0x9ca3af), 0.42, 0.79, 0.1));

  // ceramic mug
  g.add(mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.09, 14), std(C.pink, { roughness: 0.4 }), -0.5, 0.81, 0.18));

  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  parent.add(g);
}

function addChair(parent: THREE.Object3D, x: number, z: number, rotY = 0) {
  const g = new THREE.Group();
  const fabric = std(0x2f3640, { roughness: 0.9 });
  const metal = std(0x1f2937, { metalness: 0.65, roughness: 0.35 });

  g.add(mesh(new THREE.BoxGeometry(0.44, 0.07, 0.44), fabric, 0, 0.46, 0));
  g.add(mesh(new THREE.BoxGeometry(0.44, 0.52, 0.07), fabric, 0, 0.74, -0.2));
  // lumbar curve hint
  g.add(mesh(new THREE.BoxGeometry(0.36, 0.14, 0.05), std(0x374151, { roughness: 0.85 }), 0, 0.62, -0.16));
  g.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.38, 10), metal, 0, 0.25, 0));

  // star base + casters
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const arm = mesh(new THREE.BoxGeometry(0.28, 0.03, 0.05), metal, Math.cos(a) * 0.14, 0.06, Math.sin(a) * 0.14);
    arm.rotation.y = -a;
    g.add(arm);
    g.add(
      mesh(
        new THREE.SphereGeometry(0.04, 10, 8),
        std(0x111827, { roughness: 0.4, metalness: 0.3 }),
        Math.cos(a) * 0.28,
        0.04,
        Math.sin(a) * 0.28,
      ),
    );
  }

  // armrests
  g.add(mesh(new THREE.BoxGeometry(0.06, 0.04, 0.3), fabric, -0.26, 0.62, -0.02));
  g.add(mesh(new THREE.BoxGeometry(0.06, 0.04, 0.3), fabric, 0.26, 0.62, -0.02));

  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  parent.add(g);
}

function addSofa(parent: THREE.Object3D, x: number, z: number) {
  const g = new THREE.Group();
  const fabric = std(C.sofa, { roughness: 0.92 });
  const cushion = std(C.sofaLight, { roughness: 0.88 });
  g.add(mesh(new THREE.BoxGeometry(2.35, 0.32, 0.9), fabric, 0, 0.28, 0));
  g.add(mesh(new THREE.BoxGeometry(2.35, 0.58, 0.2), fabric, 0, 0.58, -0.36));
  g.add(mesh(new THREE.BoxGeometry(0.2, 0.48, 0.9), fabric, -1.08, 0.52, 0));
  g.add(mesh(new THREE.BoxGeometry(0.2, 0.48, 0.9), fabric, 1.08, 0.52, 0));
  // seat cushions
  g.add(mesh(new THREE.BoxGeometry(0.7, 0.1, 0.7), cushion, -0.7, 0.48, 0.05));
  g.add(mesh(new THREE.BoxGeometry(0.7, 0.1, 0.7), cushion, 0, 0.48, 0.05));
  g.add(mesh(new THREE.BoxGeometry(0.7, 0.1, 0.7), cushion, 0.7, 0.48, 0.05));
  // throw pillow pink accent
  g.add(mesh(new THREE.BoxGeometry(0.28, 0.28, 0.12), std(C.pink, { roughness: 0.85 }), 0.85, 0.7, -0.2));
  g.position.set(x, 0, z);
  parent.add(g);
}

function addCoffeeTable(parent: THREE.Object3D, x: number, z: number) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.04, 28), std(C.oakLight, { roughness: 0.45 }), 0, 0.34, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.32, 12), std(C.oakDark, { roughness: 0.6 }), 0, 0.16, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.03, 16), std(C.metal, { metalness: 0.5, roughness: 0.35 }), 0, 0.02, 0));
  // magazine stack
  g.add(mesh(new THREE.BoxGeometry(0.22, 0.02, 0.16), std(C.pink, { roughness: 0.7 }), 0.12, 0.38, 0.05));
  g.add(mesh(new THREE.BoxGeometry(0.2, 0.02, 0.15), std(0x111827, { roughness: 0.7 }), 0.12, 0.4, 0.05));
  g.position.set(x, 0, z);
  parent.add(g);
}

function addShelf(parent: THREE.Object3D, x: number, z: number) {
  const g = new THREE.Group();
  const wood = std(C.white, { roughness: 0.55 });
  g.add(mesh(new THREE.BoxGeometry(0.95, 1.85, 0.12), wood, 0, 0.95, -0.12));
  for (let i = 0; i < 5; i++) {
    g.add(mesh(new THREE.BoxGeometry(0.9, 0.03, 0.34), wood, 0, 0.25 + i * 0.38, 0.02));
    // book blocks
    const colors = [0xec4899, 0x111827, 0x4ade80, 0x60a5fa, 0xf59e0b];
    g.add(
      mesh(
        new THREE.BoxGeometry(0.12 + (i % 3) * 0.04, 0.22, 0.18),
        std(colors[i], { roughness: 0.75 }),
        -0.28 + (i % 2) * 0.2,
        0.38 + i * 0.38,
        0.02,
      ),
    );
  }
  g.position.set(x, 0, z);
  parent.add(g);
}

function addFridge(parent: THREE.Object3D, x: number, z: number) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.78, 1.85, 0.72), std(C.white, { roughness: 0.35, metalness: 0.15 }), 0, 0.95, 0));
  g.add(mesh(new THREE.BoxGeometry(0.76, 0.02, 0.02), std(0xd1d5db), 0, 1.05, 0.37));
  g.add(mesh(new THREE.BoxGeometry(0.04, 0.35, 0.04), std(C.metal, { metalness: 0.7, roughness: 0.3 }), 0.32, 1.05, 0.38));
  g.add(mesh(new THREE.BoxGeometry(0.78, 0.05, 0.02), std(C.pink, { emissive: C.pink, emissiveIntensity: 0.25 }), 0, 1.7, 0.37));
  g.position.set(x, 0, z);
  parent.add(g);
}

function addDiningTable(parent: THREE.Object3D, x: number, z: number) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(1.9, 0.06, 0.95), std(C.oak, { roughness: 0.5 }), 0, 0.72, 0));
  for (const [lx, lz] of [
    [-0.78, -0.36],
    [0.78, -0.36],
    [-0.78, 0.36],
    [0.78, 0.36],
  ]) {
    g.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.7, 10), std(C.oakDark), lx, 0.35, lz));
  }
  g.position.set(x, 0, z);
  parent.add(g);
}

function addCounter(parent: THREE.Object3D, x: number, z: number) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(2.3, 0.82, 0.62), std(C.white, { roughness: 0.55 }), 0, 0.41, 0));
  g.add(mesh(new THREE.BoxGeometry(2.34, 0.04, 0.66), std(C.metal, { metalness: 0.55, roughness: 0.28 }), 0, 0.84, 0));
  // sink
  g.add(mesh(new THREE.BoxGeometry(0.42, 0.06, 0.32), std(0x94a3b8, { metalness: 0.4, roughness: 0.3 }), -0.45, 0.88, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 8), std(C.metalDark, { metalness: 0.7 }), -0.45, 0.98, -0.08));
  g.add(mesh(new THREE.BoxGeometry(0.12, 0.02, 0.02), std(C.metalDark, { metalness: 0.7 }), -0.45, 1.06, -0.02));
  g.position.set(x, 0, z);
  parent.add(g);
}

function addVending(parent: THREE.Object3D, x: number, z: number) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.72, 1.65, 0.58), std(0x111827, { roughness: 0.5 }), 0, 0.85, 0));
  g.add(
    mesh(
      new THREE.BoxGeometry(0.56, 1.15, 0.04),
      std(0x60a5fa, { emissive: 0x1d4ed8, emissiveIntensity: 0.35, roughness: 0.25, transparent: true, opacity: 0.85 }),
      0,
      1.0,
      0.3,
    ),
  );
  g.add(mesh(new THREE.BoxGeometry(0.74, 0.08, 0.04), std(C.pink, { emissive: C.pink, emissiveIntensity: 0.3 }), 0, 1.62, 0.3));
  g.position.set(x, 0, z);
  parent.add(g);
}

function addPoster(parent: THREE.Object3D, x: number, y: number, z: number, color: number, rotY = 0) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.72, 1.12, 0.04), std(0xffffff, { roughness: 0.4 }), 0, 0, 0));
  g.add(mesh(new THREE.BoxGeometry(0.58, 0.92, 0.02), std(color, { roughness: 0.7 }), 0, 0, 0.03));
  g.add(mesh(new THREE.BoxGeometry(0.2, 0.2, 0.015), std(C.pink, { roughness: 0.5 }), 0.12, -0.25, 0.04));
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  parent.add(g);
}

function addWindow(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  sky: THREE.Texture,
  facing: 'z' | 'x',
) {
  const g = new THREE.Group();
  const frameMat = std(0xfafafa, { roughness: 0.45, metalness: 0.05 });
  const thick = facing === 'z' ? d : w;
  const frameDepth = 0.08;

  // outer frame
  if (facing === 'z') {
    g.add(mesh(new THREE.BoxGeometry(w + 0.16, h + 0.16, frameDepth), frameMat, 0, 0, 0));
    g.add(mesh(new THREE.BoxGeometry(0.05, h, frameDepth + 0.01), frameMat, 0, 0, 0.01));
    g.add(mesh(new THREE.BoxGeometry(w, 0.05, frameDepth + 0.01), frameMat, 0, 0, 0.01));
  } else {
    g.add(mesh(new THREE.BoxGeometry(frameDepth, h + 0.16, w + 0.16), frameMat, 0, 0, 0));
    g.add(mesh(new THREE.BoxGeometry(frameDepth + 0.01, h, 0.05), frameMat, 0.01, 0, 0));
    g.add(mesh(new THREE.BoxGeometry(frameDepth + 0.01, 0.05, w), frameMat, 0.01, 0, 0));
  }

  const glassGeo =
    facing === 'z' ? new THREE.BoxGeometry(w, h, thick) : new THREE.BoxGeometry(thick, h, w);
  const glass = new THREE.Mesh(
    glassGeo,
    new THREE.MeshStandardMaterial({
      map: sky,
      roughness: 0.15,
      metalness: 0.05,
      transparent: true,
      opacity: 0.94,
      emissive: 0x6a90a8,
      emissiveIntensity: 0.22,
    }),
  );
  glass.position.set(facing === 'z' ? 0 : 0.02, 0, facing === 'z' ? 0.02 : 0);
  glass.receiveShadow = true;
  g.add(glass);

  // sill
  if (facing === 'z') {
    g.add(mesh(new THREE.BoxGeometry(w + 0.2, 0.06, 0.18), std(C.white, { roughness: 0.5 }), 0, -h / 2 - 0.02, 0.06));
  } else {
    g.add(mesh(new THREE.BoxGeometry(0.18, 0.06, w + 0.2), std(C.white, { roughness: 0.5 }), 0.06, -h / 2 - 0.02, 0));
  }

  g.position.set(x, y, z);
  parent.add(g);
}

function addCeilingFixture(parent: THREE.Object3D, x: number, z: number, y: number, withLight = false) {
  const g = new THREE.Group();
  g.add(
    mesh(
      new THREE.BoxGeometry(1.7, 0.04, 1.05),
      std(0xfffaf0, { emissive: C.warmEmit, emissiveIntensity: 0.7, roughness: 0.4 }),
      0,
      0,
      0,
    ),
  );
  g.add(mesh(new THREE.BoxGeometry(1.78, 0.03, 1.12), std(C.metal, { metalness: 0.4, roughness: 0.4 }), 0, 0.035, 0));
  g.position.set(x, y, z);
  parent.add(g);

  if (withLight) {
    const light = new THREE.PointLight(0xfff0d6, 0.85, 10, 2);
    light.position.set(x, y - 0.25, z);
    light.castShadow = false;
    parent.add(light);
  }
}

/** Build the full PRIM8 realistic isometric office into `scene`. */
export function buildOffice(scene: THREE.Scene): THREE.Group {
  const root = new THREE.Group();
  root.name = 'office-root';

  const { width: W, depth: D, height: H } = ROOM_SIZE;
  const hw = W / 2;
  const hd = D / 2;

  // --- Floor ---
  const floorTex = noiseTexture(512, '#a8885c', 22, { stripes: true, stripeColor: '#7a5a3a66' });
  floorTex.repeat.set(W / 1.8, D / 1.8);
  const floorRough = noiseTexture(256, '#777777', 48);
  floorRough.repeat.copy(floorTex.repeat);
  floorRough.colorSpace = THREE.NoColorSpace;
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    new THREE.MeshStandardMaterial({
      map: floorTex,
      roughnessMap: floorRough,
      roughness: 0.82,
      metalness: 0.02,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  // Platform mass under floor (Gather-style floating room)
  root.add(box(W + 0.5, 0.4, D + 0.5, 0xcfc7b8, 0, -0.22, 0, { roughness: 0.9 }));
  root.add(box(W + 0.18, 0.06, D + 0.18, 0xece7dc, 0, 0.01, 0, { roughness: 0.7 }));

  // Center studio rug — cooler stone so white desks pop
  const rug = box(5.4, 0.03, 4.4, 0xc5c0b6, 0, 0.02, 0.55, { roughness: 0.95 });
  root.add(rug);
  root.add(box(5.4, 0.032, 0.08, C.rugAccent, 0, 0.035, 0.55 - 2.17, { roughness: 0.85 }));
  root.add(box(5.4, 0.032, 0.08, C.rugAccent, 0, 0.035, 0.55 + 2.17, { roughness: 0.85 }));
  root.add(box(0.08, 0.032, 4.4, C.rugAccent, -2.66, 0.035, 0.55, { roughness: 0.85 }));
  root.add(box(0.08, 0.032, 4.4, C.rugAccent, 2.66, 0.035, 0.55, { roughness: 0.85 }));
  const loungeRug = mesh(
    new THREE.CylinderGeometry(1.7, 1.7, 0.03, 36),
    std(0xb9c4d0, { roughness: 0.95 }),
    5.5,
    0.02,
    -4.2,
  );
  root.add(loungeRug);

  // --- Walls ---
  const wallTex = noiseTexture(256, '#f2f0eb', 10);
  wallTex.repeat.set(4, 2);
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    color: C.plaster,
    roughness: 0.94,
    metalness: 0.0,
  });

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.2), wallMat);
  backWall.position.set(0, H / 2, -hd);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  root.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, H, D), wallMat);
  leftWall.position.set(-hw, H / 2, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  root.add(leftWall);

  // Right wall columns + knee rail
  root.add(box(0.2, H, 1.15, C.plaster, hw, H / 2, -hd + 0.55));
  root.add(box(0.2, H, 1.15, C.plaster, hw, H / 2, hd - 0.55));
  root.add(box(0.2, H, 0.9, C.plaster, hw, H / 2, 0));
  root.add(box(0.2, 0.75, D, C.plasterDeep, hw, 0.38, 0));
  root.add(box(0.2, 0.45, D, C.plasterDeep, hw, H - 0.22, 0));

  // Front knee wall + corner posts
  root.add(box(W, 0.78, 0.2, C.plasterDeep, 0, 0.39, hd));
  root.add(box(1.15, H, 0.2, C.plaster, -hw + 0.55, H / 2, hd));
  root.add(box(1.15, H, 0.2, C.plaster, hw - 0.55, H / 2, hd));

  // Baseboards
  root.add(box(W - 0.2, 0.12, 0.05, C.white, 0, 0.06, -hd + 0.12));
  root.add(box(0.05, 0.12, D - 0.2, C.white, -hw + 0.12, 0.06, 0));

  // Open-roof Gather style: no full ceiling slab (it would hide the floor in iso).
  // Keep only perimeter soffit beams + light fixtures for depth.
  root.add(box(W, 0.1, 0.28, 0xf0ebe3, 0, H - 0.05, -hd + 0.2, { roughness: 0.85 }));
  root.add(box(W, 0.1, 0.28, 0xf0ebe3, 0, H - 0.05, hd - 0.2, { roughness: 0.85 }));
  root.add(box(0.28, 0.1, D, 0xf0ebe3, -hw + 0.2, H - 0.05, 0, { roughness: 0.85 }));
  root.add(box(0.28, 0.1, D, 0xf0ebe3, hw - 0.2, H - 0.05, 0, { roughness: 0.85 }));

  // Windows
  const sky = makeSkyTexture();
  addWindow(root, -5.1, 2.4, -hd + 0.12, 2.7, 2.1, 0.04, sky, 'z');
  addWindow(root, 4.7, 2.4, -hd + 0.12, 2.9, 2.1, 0.04, sky, 'z');
  addWindow(root, hw - 0.12, 2.4, -3.1, 2.7, 2.1, 0.04, sky, 'x');
  addWindow(root, hw - 0.12, 2.4, 3.0, 2.7, 2.1, 0.04, sky, 'x');

  // PRIM8 hero screen
  const monitor = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 1.6, 0.08),
    new THREE.MeshStandardMaterial({
      map: makePrim8ScreenTexture(),
      emissive: 0xec4899,
      emissiveIntensity: 0.12,
      roughness: 0.35,
      metalness: 0.1,
    }),
  );
  monitor.position.set(0, 2.65, -hd + 0.22);
  monitor.castShadow = true;
  root.add(monitor);
  root.add(box(3.6, 0.1, 0.14, 0x111827, 0, 1.78, -hd + 0.22, { metalness: 0.4, roughness: 0.4 }));
  root.add(box(0.12, 0.55, 0.12, 0x111827, -1.4, 1.45, -hd + 0.22, { metalness: 0.4, roughness: 0.4 }));
  root.add(box(0.12, 0.55, 0.12, 0x111827, 1.4, 1.45, -hd + 0.22, { metalness: 0.4, roughness: 0.4 }));

  // Creative wall posters
  addPoster(root, -hw + 0.14, 2.15, -3.6, 0x86efac, Math.PI / 2);
  addPoster(root, -hw + 0.14, 2.15, -1.9, 0x4ade80, Math.PI / 2);
  addPoster(root, -hw + 0.14, 2.15, -0.2, 0x22c55e, Math.PI / 2);

  // Storage
  addShelf(root, -hw + 0.55, -4.5);
  addShelf(root, -hw + 0.55, 3.5);
  root.add(box(1.45, 0.5, 0.48, C.oak, -hw + 0.75, 0.26, 1.2, { roughness: 0.65 }));

  // Plants
  for (const [x, z, s] of [
    [-7.5, -5.5, 1.05],
    [-7.5, 5.5, 1],
    [7.5, -5.8, 0.95],
    [7.2, 5.8, 1.15],
    [-3.2, -5.8, 0.85],
    [3.2, -5.8, 0.85],
    [-3, 2.8, 0.75],
    [3, 2.8, 0.75],
    [0, -5.7, 0.7],
  ] as const) {
    addPlant(root, x, z, s);
  }

  // Control desks
  addDesk(root, -2.2, -5.2);
  addChair(root, -2.2, -4.25, Math.PI);
  addDesk(root, 2.2, -5.2);
  addChair(root, 2.2, -4.25, Math.PI);

  // Studio 2×2
  for (const [dx, dz] of [
    [-1.6, -0.2],
    [1.6, -0.2],
    [-1.6, 2.0],
    [1.6, 2.0],
  ] as const) {
    addDesk(root, dx, dz);
    addChair(root, dx, dz + 0.88, Math.PI);
  }

  // Lounge
  addSofa(root, 5.5, -5.15);
  addCoffeeTable(root, 5.5, -3.85);

  // Kitchen
  addFridge(root, 7.2, 4.2);
  addCounter(root, 5.2, 3.2);
  addDiningTable(root, 5.2, 5.2);
  addChair(root, 4.35, 4.45, 0.35);
  addChair(root, 5.2, 4.4, 0);
  addChair(root, 6.05, 4.45, -0.35);
  addVending(root, 7.3, 2.5);

  // Ceiling fixtures + practical lights
  const fixtures: Array<[number, number, boolean]> = [
    [-3.2, -2.2, false],
    [3.2, -2.2, false],
    [-3.2, 2.2, false],
    [3.2, 2.2, false],
    [0, 0.2, true],
    [5.4, -4.2, true],
    [5.4, 4.5, true],
  ];
  for (const [x, z, lit] of fixtures) {
    addCeilingFixture(root, x, z, H - 0.08, lit);
  }

  scene.add(root);
  return root;
}
