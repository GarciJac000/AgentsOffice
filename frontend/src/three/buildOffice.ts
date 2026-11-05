import * as THREE from 'three';
import { ROOM_SIZE } from './rooms';
import {
  buildCinematicWorkspace,
  type Collider,
} from './buildCinematicWorkspace';
import {
  CINEMATIC,
  makeCharcoalStoneTexture,
  makeWallPlasterTexture,
  makeWalnutTexture,
  matBronze,
} from './cinematicMaterials';

export type { Collider };

const COLORS = {
  woodDark: CINEMATIC.walnut,
  woodLight: CINEMATIC.walnutLight,
  wall: CINEMATIC.charcoalLight,
  wallWarm: CINEMATIC.charcoal,
  wallTrim: CINEMATIC.stoneLight,
  baseboard: CINEMATIC.bronze,
  desk: CINEMATIC.walnutLight,
  deskEdge: CINEMATIC.walnut,
  chair: 0x2a2a2e,
  chairSeat: CINEMATIC.leather,
  sofa: 0x141618,
  sofaCushion: 0x1c1f24,
  plant: 0x3d9b5f,
  plantDark: 0x2d7a4a,
  plantLight: 0x5cbf7a,
  pot: 0x3a3a40,
  potTerracotta: 0x8a5a3c,
  metal: CINEMATIC.bronzeBright,
  metalDark: CINEMATIC.bronze,
  screen: CINEMATIC.screen,
  pink: CINEMATIC.pink,
  fridge: 0x2a2d33,
  counter: 0x2f3238,
  beam: CINEMATIC.walnut,
  column: CINEMATIC.stone,
};

function mat(color: number, opts: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });
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
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(
  rTop: number,
  rBot: number,
  h: number,
  color: number,
  x: number,
  y: number,
  z: number,
  segments = 12,
  opts?: THREE.MeshStandardMaterialParameters,
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBot, h, segments),
    mat(color, opts),
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeSkyTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#6eb4d8');
  g.addColorStop(0.35, '#9ecfe8');
  g.addColorStop(0.7, '#c5e0ef');
  g.addColorStop(1, '#7aa8bc');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);

  // Soft clouds
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (const [cx, cy, rx, ry] of [
    [80, 60, 50, 18],
    [200, 45, 70, 22],
    [380, 70, 60, 20],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant city block
  ctx.fillStyle = '#4a6270';
  for (let i = 0; i < 18; i++) {
    const bx = 20 + i * 28;
    const bh = 30 + ((i * 17) % 55);
    ctx.fillRect(bx, 200 - bh, 18, bh);
    if (i % 3 === 0) {
      ctx.fillStyle = '#ec489933';
      ctx.fillRect(bx + 4, 200 - bh + 8, 4, 4);
      ctx.fillStyle = '#4a6270';
    }
  }

  // Hills
  ctx.fillStyle = '#3d6b4f';
  ctx.beginPath();
  ctx.moveTo(0, 210);
  ctx.quadraticCurveTo(120, 155, 220, 200);
  ctx.quadraticCurveTo(320, 235, 512, 180);
  ctx.lineTo(512, 256);
  ctx.lineTo(0, 256);
  ctx.fill();

  // Bridge hint
  ctx.strokeStyle = '#c44';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(280, 185);
  ctx.quadraticCurveTo(360, 120, 440, 180);
  ctx.stroke();
  ctx.strokeStyle = '#a33';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const x = 280 + (440 - 280) * t;
    const y = 185 - Math.sin(t * Math.PI) * 55;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, 210);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makePrim8ScreenTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 768;
  c.height = 384;
  const ctx = c.getContext('2d')!;

  // Keep the panel dark so the mark reads (avoid emissive washout)
  ctx.fillStyle = '#0b0c0e';
  ctx.fillRect(0, 0, 768, 384);
  const bg = ctx.createLinearGradient(0, 0, 0, 384);
  bg.addColorStop(0, '#12141a');
  bg.addColorStop(1, '#08090c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 768, 384);

  // Soft vignette glow (subtle)
  const glow = ctx.createRadialGradient(400, 175, 10, 400, 175, 260);
  glow.addColorStop(0, 'rgba(236,72,153,0.22)');
  glow.addColorStop(1, 'rgba(236,72,153,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 768, 384);

  // Hex flower accent
  ctx.strokeStyle = '#ec4899cc';
  ctx.lineWidth = 3.5;
  const cx = 140;
  const cy = 175;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * 36, cy + Math.sin(a) * 36, 22, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 120px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PRIM', 370, 160);

  ctx.fillStyle = '#ec4899';
  ctx.shadowColor = '#ec4899';
  ctx.shadowBlur = 36;
  ctx.fillText('8', 545, 160);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 30px system-ui, sans-serif';
  ctx.letterSpacing = '6px';
  ctx.fillText('PRODUCTIONS', 400, 255);

  ctx.fillStyle = '#ec4899';
  ctx.fillRect(260, 288, 280, 4);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeWoodFloorTexture(): THREE.CanvasTexture {
  // Dark walnut planks for cinematic HQ shell
  return makeWalnutTexture();
}

function makeRugTexture(base: string, accent: string, style: 'rect' | 'round' = 'rect'): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);

  // Weave noise so rugs read apart from wood
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.03 + (i % 4) * 0.01})`;
    ctx.fillRect((i * 37) % 256, (i * 53) % 256, 18, 3);
  }

  if (style === 'round') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(128, 128, 108, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(128, 128, 86, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 18;
    ctx.strokeRect(8, 8, 240, 240);
    ctx.lineWidth = 4;
    ctx.strokeRect(28, 28, 200, 200);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWallPaintTexture(): THREE.CanvasTexture {
  return makeWallPlasterTexture();
}

function addPlant(parent: THREE.Group, x: number, z: number, scale = 1, terracotta = false) {
  const g = new THREE.Group();
  const potColor = terracotta ? COLORS.potTerracotta : COLORS.pot;
  g.add(cylinder(0.2 * scale, 0.24 * scale, 0.3 * scale, potColor, 0, 0.15 * scale, 0, 10));
  g.add(cylinder(0.16 * scale, 0.16 * scale, 0.06 * scale, 0x3f2a1a, 0, 0.3 * scale, 0, 10));

  // Stems + cone/leaf clusters (reads as foliage, not a green ball)
  const stems: Array<[number, number, number, number]> = [
    [0, 0, 0.55, COLORS.plant],
    [0.1, 0.08, 0.42, COLORS.plantDark],
    [-0.1, -0.06, 0.4, COLORS.plantLight],
    [0.02, -0.12, 0.48, COLORS.plantDark],
    [-0.08, 0.1, 0.36, COLORS.plant],
  ];
  for (const [sx, sz, h, col] of stems) {
    g.add(cylinder(0.015, 0.02, h * scale, 0x4a6741, sx * scale, 0.3 * scale + (h * scale) / 2, sz * scale, 5));
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.16 * scale, 0.34 * scale, 7),
      mat(col, { roughness: 0.72 }),
    );
    leaf.position.set(sx * scale, 0.3 * scale + h * scale, sz * scale);
    leaf.rotation.z = (sx > 0 ? -1 : 1) * 0.35;
    leaf.rotation.x = 0.15;
    leaf.castShadow = true;
    g.add(leaf);
    // Secondary flatter leaf
    const leaf2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.12 * scale, 8, 6),
      mat(col, { roughness: 0.75 }),
    );
    leaf2.position.set(sx * scale + 0.06, 0.28 * scale + h * scale * 0.7, sz * scale);
    leaf2.scale.set(1.3, 0.45, 0.9);
    leaf2.castShadow = true;
    g.add(leaf2);
  }

  g.position.set(x, 0, z);
  parent.add(g);
}

function addDesk(parent: THREE.Group, x: number, z: number, rotY = 0) {
  const g = new THREE.Group();

  // Desktop with slightly darker edge band
  g.add(box(1.5, 0.05, 0.75, COLORS.desk, 0, 0.74, 0));
  g.add(box(1.52, 0.02, 0.77, COLORS.deskEdge, 0, 0.71, 0));

  // Slim metal legs + cross brace
  for (const [lx, lz] of [
    [-0.65, -0.3],
    [0.65, -0.3],
    [-0.65, 0.3],
    [0.65, 0.3],
  ]) {
    g.add(box(0.05, 0.72, 0.05, COLORS.metalDark, lx, 0.36, lz));
  }
  g.add(box(1.3, 0.03, 0.04, COLORS.metal, 0, 0.2, 0));

  // Dual-monitor setup with soft screen glow
  const stand = box(0.08, 0.22, 0.08, COLORS.metalDark, 0, 0.86, -0.2);
  g.add(stand);
  g.add(box(0.28, 0.02, 0.18, COLORS.metalDark, 0, 0.76, -0.18));

  const leftMon = box(0.48, 0.32, 0.03, COLORS.screen, -0.28, 1.05, -0.22, {
    emissive: 0x1e3a5f,
    emissiveIntensity: 0.25,
    roughness: 0.35,
  });
  g.add(leftMon);
  const rightMon = box(0.48, 0.32, 0.03, COLORS.screen, 0.28, 1.05, -0.22, {
    emissive: 0x1e293b,
    emissiveIntensity: 0.2,
    roughness: 0.35,
  });
  g.add(rightMon);
  // Bezel glow strip
  g.add(
    box(0.46, 0.01, 0.01, COLORS.pink, -0.28, 0.9, -0.205, {
      emissive: COLORS.pink,
      emissiveIntensity: 0.4,
      roughness: 0.4,
    }),
  );

  // Keyboard + mouse
  g.add(box(0.38, 0.02, 0.14, 0x1f2937, 0, 0.78, 0.12));
  g.add(box(0.06, 0.02, 0.1, 0x374151, 0.32, 0.78, 0.14));

  // Cable tray under desk
  g.add(box(0.9, 0.04, 0.12, 0x374151, 0, 0.62, -0.1));
  // Cable droop (simple bent boxes)
  g.add(box(0.02, 0.18, 0.02, 0x1f2937, 0.4, 0.55, -0.15));

  // Mug + notebook
  g.add(cylinder(0.045, 0.05, 0.09, COLORS.pink, 0.55, 0.81, 0.18, 10));
  g.add(box(0.18, 0.015, 0.24, 0xfef3c7, -0.5, 0.775, 0.15));

  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  parent.add(g);
}

function addChair(parent: THREE.Group, x: number, z: number, rotY = 0) {
  const g = new THREE.Group();
  // Seat + back with slight lumbar
  g.add(box(0.44, 0.07, 0.44, COLORS.chairSeat, 0, 0.44, 0));
  g.add(box(0.44, 0.5, 0.07, COLORS.chair, 0, 0.7, -0.19));
  g.add(box(0.36, 0.12, 0.05, COLORS.chairSeat, 0, 0.58, -0.18));
  // Armrests
  g.add(box(0.05, 0.04, 0.32, COLORS.metalDark, -0.22, 0.58, 0));
  g.add(box(0.05, 0.04, 0.32, COLORS.metalDark, 0.22, 0.58, 0));
  g.add(box(0.04, 0.16, 0.04, COLORS.metal, -0.22, 0.5, 0.1));
  g.add(box(0.04, 0.16, 0.04, COLORS.metal, 0.22, 0.5, 0.1));
  // Pedestal + base
  g.add(cylinder(0.04, 0.05, 0.38, COLORS.metal, 0, 0.22, 0, 8));
  g.add(cylinder(0.22, 0.22, 0.03, COLORS.metalDark, 0, 0.04, 0, 8));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const wx = Math.cos(a) * 0.2;
    const wz = Math.sin(a) * 0.2;
    g.add(cylinder(0.03, 0.03, 0.04, 0x1f2937, wx, 0.02, wz, 6));
  }
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  parent.add(g);
}

function addSofa(parent: THREE.Group, x: number, z: number) {
  const g = new THREE.Group();
  // Base platform
  g.add(box(2.35, 0.18, 0.9, COLORS.sofa, 0, 0.16, 0));
  // Seat cushions
  g.add(box(1.05, 0.2, 0.78, COLORS.sofaCushion, -0.55, 0.36, 0.04));
  g.add(box(1.05, 0.2, 0.78, COLORS.sofaCushion, 0.55, 0.36, 0.04));
  // Back + arms
  g.add(box(2.35, 0.6, 0.16, COLORS.sofa, 0, 0.58, -0.37));
  g.add(box(0.16, 0.48, 0.9, COLORS.sofa, -1.1, 0.48, 0));
  g.add(box(0.16, 0.48, 0.9, COLORS.sofa, 1.1, 0.48, 0));
  // Throw pillows with pink accent
  g.add(box(0.28, 0.28, 0.12, COLORS.pink, -0.7, 0.55, -0.2, { roughness: 0.9 }));
  g.add(box(0.28, 0.28, 0.12, 0xe2e8f0, 0.7, 0.55, -0.2, { roughness: 0.9 }));
  g.position.set(x, 0, z);
  parent.add(g);
}

function addCoffeeTable(parent: THREE.Group, x: number, z: number) {
  const g = new THREE.Group();
  g.add(box(1.0, 0.04, 0.58, COLORS.woodLight, 0, 0.34, 0));
  g.add(box(0.9, 0.02, 0.5, COLORS.woodDark, 0, 0.3, 0));
  for (const [lx, lz] of [
    [-0.4, -0.22],
    [0.4, -0.22],
    [-0.4, 0.22],
    [0.4, 0.22],
  ]) {
    g.add(box(0.05, 0.3, 0.05, COLORS.woodDark, lx, 0.15, lz));
  }
  // Tray + books
  g.add(box(0.28, 0.02, 0.2, 0xf8fafc, -0.15, 0.37, 0));
  g.add(box(0.22, 0.03, 0.16, COLORS.pink, 0.25, 0.375, 0.05));
  g.add(cylinder(0.04, 0.04, 0.08, 0x86efac, 0.1, 0.4, -0.12, 8));
  g.position.set(x, 0, z);
  parent.add(g);
}

function addShelf(parent: THREE.Group, x: number, z: number) {
  const g = new THREE.Group();
  // Frame sides
  g.add(box(0.08, 1.85, 0.36, COLORS.deskEdge, -0.42, 0.925, 0));
  g.add(box(0.08, 1.85, 0.36, COLORS.deskEdge, 0.42, 0.925, 0));
  g.add(box(0.92, 0.06, 0.36, COLORS.desk, 0, 0.05, 0));
  g.add(box(0.92, 0.06, 0.36, COLORS.desk, 0, 1.82, 0));

  const bookColors = [0x1e3a5f, 0xec4899, 0xfef3c7, 0x4ade80, 0x94a3b8, 0xf97316, 0x0ea5e9];
  for (let i = 0; i < 4; i++) {
    const sy = 0.35 + i * 0.42;
    g.add(box(0.88, 0.03, 0.32, COLORS.desk, 0, sy, 0.01));
    // Books / objects on shelf
    let bx = -0.32;
    for (let b = 0; b < 5; b++) {
      const bh = 0.18 + (b % 3) * 0.04;
      const bw = 0.06 + (b % 2) * 0.02;
      g.add(box(bw, bh, 0.2, bookColors[(i * 3 + b) % bookColors.length], bx, sy + bh / 2 + 0.02, 0.02));
      bx += bw + 0.04;
    }
    if (i === 1) {
      g.add(cylinder(0.08, 0.08, 0.12, COLORS.potTerracotta, 0.28, sy + 0.1, 0.02, 8));
    }
  }
  g.position.set(x, 0, z);
  parent.add(g);
}

function addFridge(parent: THREE.Group, x: number, z: number) {
  const g = new THREE.Group();
  g.add(box(0.78, 1.85, 0.72, COLORS.fridge, 0, 0.925, 0));
  g.add(box(0.74, 0.02, 0.02, COLORS.metalDark, 0, 1.05, 0.37));
  g.add(box(0.04, 0.4, 0.04, COLORS.metal, 0.32, 1.05, 0.37));
  // PRIM8 pink stripe + badge
  g.add(
    box(0.8, 0.07, 0.03, COLORS.pink, 0, 1.55, 0.37, {
      emissive: COLORS.pink,
      emissiveIntensity: 0.35,
    }),
  );
  g.add(box(0.74, 0.55, 0.02, 0xe2e8f0, 0, 0.45, 0.37));
  g.position.set(x, 0, z);
  parent.add(g);
}

function addDiningTable(parent: THREE.Group, x: number, z: number) {
  const g = new THREE.Group();
  g.add(box(1.9, 0.06, 0.95, COLORS.woodLight, 0, 0.72, 0));
  for (const [lx, lz] of [
    [-0.8, -0.38],
    [0.8, -0.38],
    [-0.8, 0.38],
    [0.8, 0.38],
  ]) {
    g.add(box(0.07, 0.72, 0.07, COLORS.woodDark, lx, 0.36, lz));
  }
  // Laptop / edit station prop
  g.add(box(0.4, 0.02, 0.26, 0x374151, 0.35, 0.76, 0));
  g.add(
    box(0.4, 0.26, 0.02, COLORS.screen, 0.35, 0.9, -0.12, {
      emissive: 0x1e293b,
      emissiveIntensity: 0.3,
    }),
  );
  g.add(cylinder(0.05, 0.05, 0.1, 0xffffff, -0.5, 0.8, 0.15, 8));
  g.position.set(x, 0, z);
  parent.add(g);
}

function addCounter(parent: THREE.Group, x: number, z: number) {
  const g = new THREE.Group();
  g.add(box(2.3, 0.85, 0.62, COLORS.counter, 0, 0.425, 0));
  g.add(box(2.32, 0.05, 0.64, COLORS.metal, 0, 0.875, 0));
  // Sink
  g.add(box(0.42, 0.08, 0.32, 0x94a3b8, -0.5, 0.9, 0));
  g.add(cylinder(0.02, 0.02, 0.2, COLORS.metalDark, -0.5, 1.0, -0.1, 6));
  // Coffee machine
  g.add(box(0.28, 0.35, 0.28, 0x1f2937, 0.55, 1.08, 0));
  g.add(
    box(0.2, 0.08, 0.02, COLORS.pink, 0.55, 1.2, 0.15, {
      emissive: COLORS.pink,
      emissiveIntensity: 0.5,
    }),
  );
  // Bottles
  g.add(cylinder(0.04, 0.04, 0.22, 0x22c55e, 0.1, 1.0, 0.1, 8));
  g.add(cylinder(0.035, 0.035, 0.18, 0xf97316, 0.22, 0.98, 0.1, 8));
  g.position.set(x, 0, z);
  parent.add(g);
}

function addVending(parent: THREE.Group, x: number, z: number) {
  const g = new THREE.Group();
  g.add(box(0.72, 1.65, 0.58, 0x1f2937, 0, 0.825, 0));
  g.add(
    box(0.56, 1.15, 0.04, 0x38bdf8, 0, 0.95, 0.3, {
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.2,
      roughness: 0.3,
    }),
  );
  g.add(
    box(0.74, 0.08, 0.04, COLORS.pink, 0, 1.58, 0.3, {
      emissive: COLORS.pink,
      emissiveIntensity: 0.45,
    }),
  );
  // Product rows
  for (let r = 0; r < 4; r++) {
    g.add(box(0.5, 0.04, 0.02, 0xf8fafc, 0, 0.5 + r * 0.28, 0.28));
  }
  g.position.set(x, 0, z);
  parent.add(g);
}

function addPoster(parent: THREE.Group, x: number, y: number, z: number, color: number, rotY = 0) {
  const g = new THREE.Group();
  g.add(box(0.72, 1.12, 0.04, 0xffffff, 0, 0, 0));
  g.add(box(0.58, 0.92, 0.02, color, 0, 0, 0.03));
  // Thin pink accent bar on frame
  g.add(
    box(0.58, 0.03, 0.02, COLORS.pink, 0, -0.4, 0.035, {
      emissive: COLORS.pink,
      emissiveIntensity: 0.25,
    }),
  );
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  parent.add(g);
}

function addZoneRug(
  parent: THREE.Group,
  w: number,
  d: number,
  x: number,
  z: number,
  base: string,
  accent: string,
  round = false,
) {
  const tex = makeRugTexture(base, accent, round ? 'round' : 'rect');
  if (round) {
    const rug = new THREE.Mesh(
      new THREE.CylinderGeometry(Math.max(w, d) / 2, Math.max(w, d) / 2, 0.02, 28),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }),
    );
    rug.position.set(x, 0.012, z);
    rug.receiveShadow = true;
    parent.add(rug);
  } else {
    const rug = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.02, d),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }),
    );
    rug.position.set(x, 0.012, z);
    rug.receiveShadow = true;
    parent.add(rug);
  }
}

function addColumn(parent: THREE.Group, x: number, z: number, H: number) {
  const g = new THREE.Group();
  g.add(box(0.35, H, 0.35, COLORS.column, 0, H / 2, 0));
  g.add(box(0.42, 0.12, 0.42, COLORS.wallTrim, 0, 0.06, 0));
  g.add(box(0.42, 0.1, 0.42, COLORS.wallTrim, 0, H - 0.05, 0));
  // Pink LED accent strip on column
  g.add(
    box(0.04, H * 0.7, 0.04, COLORS.pink, 0.18, H * 0.45, 0.18, {
      emissive: COLORS.pink,
      emissiveIntensity: 0.55,
      roughness: 0.4,
    }),
  );
  g.position.set(x, 0, z);
  parent.add(g);
}

function addRecessedLight(parent: THREE.Group, x: number, y: number, z: number) {
  parent.add(
    box(1.4, 0.04, 0.9, 0xfff7e6, x, y, z, {
      emissive: 0xfff1c9,
      emissiveIntensity: 0.55,
      roughness: 0.45,
    }),
  );
  // Soft pink edge on select panels
  parent.add(
    box(1.42, 0.015, 0.04, COLORS.pink, x, y - 0.02, z + 0.44, {
      emissive: COLORS.pink,
      emissiveIntensity: 0.3,
      roughness: 0.5,
    }),
  );
}

/** Build the PRIM8 HQ. Studio Floor is the cinematic showcase room. */
export function buildOffice(scene: THREE.Scene): { root: THREE.Group; colliders: Collider[] } {
  const root = new THREE.Group();
  root.name = 'office-root';
  const colliders: Collider[] = [];

  const { width: W, depth: D, height: H } = ROOM_SIZE;
  const hw = W / 2;
  const hd = D / 2;

  // Floor — dark walnut with charcoal stone elsewhere via zone rugs
  const floorTex = makeWoodFloorTexture();
  floorTex.repeat.set(W / 2.2, D / 2.2);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.52,
      metalness: 0.08,
      envMapIntensity: 0.6,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  // Surrounding zone rugs (Studio Floor uses cinematic stone platform instead)
  addZoneRug(root, 4.6, 2.4, 0, -5.0, '#2a2d33', '#8a6a45'); // Control
  addZoneRug(root, 3.2, 3.2, 5.5, -4.2, '#1c1e22', '#ec4899', true); // Lounge
  addZoneRug(root, 3.8, 3.2, 5.4, 4.4, '#252830', '#8a6a45'); // Kitchen
  addZoneRug(root, 2.4, 7.5, -6.2, 0, '#1a1c20', '#ec4899'); // Creative Wall runner

  // Floating platform underside (charcoal)
  root.add(box(W + 0.5, 0.38, D + 0.5, 0x12141a, 0, -0.2, 0));
  root.add(box(W + 0.2, 0.08, D + 0.2, CINEMATIC.stone, 0, 0.005, 0));

  // Charcoal plaster walls
  const wallTex = makeWallPaintTexture();
  wallTex.repeat.set(4, 2);
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    color: COLORS.wall,
    roughness: 0.88,
    metalness: 0.06,
    envMapIntensity: 0.35,
  });

  // Outer wall colliders for FPS
  colliders.push(
    { minX: -hw - 0.5, maxX: -hw + 0.25, minZ: -hd, maxZ: hd },
    { minX: hw - 0.25, maxX: hw + 0.5, minZ: -hd, maxZ: hd },
    { minX: -hw, maxX: hw, minZ: -hd - 0.5, maxZ: -hd + 0.25 },
  );

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.18), wallMat);
  backWall.position.set(0, H / 2, -hd);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  root.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, H, D), wallMat.clone());
  leftWall.position.set(-hw, H / 2, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  root.add(leftWall);

  // Baseboards
  root.add(box(W, 0.12, 0.08, COLORS.baseboard, 0, 0.06, -hd + 0.1));
  root.add(box(0.08, 0.12, D, COLORS.baseboard, -hw + 0.1, 0.06, 0));

  // Right wall with window bay structure
  root.add(box(0.18, H, 1.15, COLORS.wall, hw, H / 2, -hd + 0.55));
  root.add(box(0.18, H, 1.15, COLORS.wall, hw, H / 2, hd - 0.55));
  root.add(box(0.18, H, 0.9, COLORS.wall, hw, H / 2, 0));
  root.add(box(0.18, 0.65, D, COLORS.wallTrim, hw, 0.32, 0));
  root.add(box(0.18, 0.5, D, COLORS.wallTrim, hw, H - 0.25, 0));

  // Front open edge with door opening (gap in knee wall)
  root.add(box(W * 0.35, 0.72, 0.16, COLORS.wallTrim, -hw + W * 0.18, 0.36, hd));
  root.add(box(W * 0.35, 0.72, 0.16, COLORS.wallTrim, hw - W * 0.18, 0.36, hd));
  // Door posts
  root.add(box(0.2, H * 0.85, 0.2, COLORS.wallWarm, -1.15, H * 0.42, hd));
  root.add(box(0.2, H * 0.85, 0.2, COLORS.wallWarm, 1.15, H * 0.42, hd));
  root.add(box(2.5, 0.18, 0.2, COLORS.wallWarm, 0, H * 0.85, hd));
  // Corner pillars
  root.add(box(1.15, H, 0.18, COLORS.wall, -hw + 0.55, H / 2, hd));
  root.add(box(1.15, H, 0.18, COLORS.wall, hw - 0.55, H / 2, hd));

  // Exterior sky / city backdrops (visible through window bays + around room)
  const sky = makeSkyTexture();
  const skyMat = new THREE.MeshBasicMaterial({ map: sky });
  const backSky = new THREE.Mesh(new THREE.PlaneGeometry(W + 8, H + 4), skyMat);
  backSky.position.set(0, H * 0.55, -hd - 1.5);
  root.add(backSky);
  const rightSky = new THREE.Mesh(new THREE.PlaneGeometry(D + 6, H + 4), skyMat.clone());
  rightSky.position.set(hw + 1.5, H * 0.55, 0);
  rightSky.rotation.y = -Math.PI / 2;
  root.add(rightSky);

  // Bronze window frames + smoked glass
  const bronzeMat = matBronze();
  const windowPositions: Array<[number, number, number, number, number, number]> = [
    [-5.2, 2.35, -hd + 0.12, 2.6, 2.0, 0.05],
    [4.8, 2.35, -hd + 0.12, 2.8, 2.0, 0.05],
    [hw - 0.12, 2.35, -3.2, 0.05, 2.0, 2.6],
    [hw - 0.12, 2.35, 3.0, 0.05, 2.0, 2.6],
  ];
  for (const [x, y, z, w, h, d] of windowPositions) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, h + 0.16, d + 0.06), bronzeMat);
    frame.position.set(x, y, z);
    frame.castShadow = true;
    root.add(frame);
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({
        map: sky,
        color: 0x1a1c20,
        roughness: 0.12,
        metalness: 0.25,
        transparent: true,
        opacity: 0.55,
        envMapIntensity: 0.8,
      }),
    );
    glass.position.set(x, y, z);
    root.add(glass);
  }

  // Large PRIM8 video wall with neon frame (low panel emissive so logo stays readable)
  const monitor = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 1.85, 0.1),
    new THREE.MeshStandardMaterial({
      map: makePrim8ScreenTexture(),
      emissive: 0x221018,
      emissiveIntensity: 0.35,
      roughness: 0.45,
      metalness: 0.05,
    }),
  );
  monitor.position.set(0, 2.55, -hd + 0.22);
  root.add(monitor);
  // Dark bezel
  root.add(box(4.4, 0.1, 0.14, 0x111827, 0, 1.58, -hd + 0.22));
  root.add(box(4.4, 0.1, 0.14, 0x111827, 0, 3.52, -hd + 0.22));
  root.add(box(0.1, 2.05, 0.14, 0x111827, -2.15, 2.55, -hd + 0.22));
  root.add(box(0.1, 2.05, 0.14, 0x111827, 2.15, 2.55, -hd + 0.22));
  // Neon pink edge glow
  root.add(
    box(4.5, 0.04, 0.06, COLORS.pink, 0, 1.52, -hd + 0.28, {
      emissive: COLORS.pink,
      emissiveIntensity: 0.85,
      roughness: 0.3,
    }),
  );
  root.add(
    box(4.5, 0.04, 0.06, COLORS.pink, 0, 3.58, -hd + 0.28, {
      emissive: COLORS.pink,
      emissiveIntensity: 0.7,
      roughness: 0.3,
    }),
  );
  // Wall mount / soundbar
  root.add(box(2.2, 0.08, 0.12, 0x1f2937, 0, 1.4, -hd + 0.2));

  // Ceiling beams (visual loft structure; no cast shadows to avoid striping the floor)
  for (const bx of [-5.5, -1.8, 1.8, 5.5]) {
    const beam = box(0.16, 0.14, D - 0.6, COLORS.beam, bx, H - 0.08, 0);
    beam.castShadow = false;
    root.add(beam);
  }
  for (const bz of [-hd + 1.4, hd - 1.8]) {
    const cross = box(W - 0.8, 0.12, 0.14, COLORS.beam, 0, H - 0.16, bz);
    cross.castShadow = false;
    root.add(cross);
  }

  // Partition / column accents defining zones
  addColumn(root, -3.6, -2.8, H);
  addColumn(root, 3.6, -2.8, H);
  addColumn(root, 3.6, 2.2, H);

  // Low partition between lounge and studio
  root.add(box(0.12, 1.1, 2.2, COLORS.wallWarm, 3.5, 0.55, -1.5));
  root.add(
    box(0.04, 1.0, 2.0, COLORS.pink, 3.56, 0.55, -1.5, {
      emissive: COLORS.pink,
      emissiveIntensity: 0.25,
    }),
  );

  // Left wall posters
  addPoster(root, -hw + 0.12, 2.1, -3.5, 0x86efac, Math.PI / 2);
  addPoster(root, -hw + 0.12, 2.1, -1.8, 0x4ade80, Math.PI / 2);
  addPoster(root, -hw + 0.12, 2.1, -0.1, 0x22c55e, Math.PI / 2);
  addPoster(root, -hw + 0.12, 2.1, 1.6, 0xec4899, Math.PI / 2);

  // Left storage
  addShelf(root, -hw + 0.55, -4.5);
  addShelf(root, -hw + 0.55, 3.5);
  root.add(box(1.4, 0.55, 0.5, COLORS.woodDark, -hw + 0.75, 0.28, 1.2));
  root.add(box(1.35, 0.04, 0.48, COLORS.woodLight, -hw + 0.75, 0.56, 1.2));

  // Plants
  for (const [px, pz, s, terra] of [
    [-7.5, -5.5, 1.05, true],
    [-7.5, 5.5, 1, false],
    [7.5, -5.8, 0.95, true],
    [7.2, 5.8, 1.15, false],
    [-3.2, -5.8, 0.85, false],
    [3.2, -5.8, 0.85, true],
    [-3, 2.8, 0.75, false],
    [3, 2.8, 0.75, false],
    [-6.5, 5.2, 0.7, true],
    [0, -6.3, 0.65, false],
  ] as const) {
    addPlant(root, px, pz, s, terra);
  }

  // Back desks (Control) — keep aligned with DESK_SPOTS (unchanged layout)
  addDesk(root, -2.2, -5.2);
  addChair(root, -2.2, -4.3, Math.PI);
  addDesk(root, 2.2, -5.2);
  addChair(root, 2.2, -4.3, Math.PI);
  colliders.push(
    { minX: -3.0, maxX: -1.4, minZ: -5.6, maxZ: -4.8 },
    { minX: 1.4, maxX: 3.0, minZ: -5.6, maxZ: -4.8 },
  );

  // ★ Studio Floor — cinematic showcase room (replaces primitive center desks)
  colliders.push(...buildCinematicWorkspace(root));

  // Lounge / kitchen retained as surrounding zones (palette-matched, not rebuilt)
  addSofa(root, 5.5, -5.1);
  addCoffeeTable(root, 5.5, -3.9);
  addChair(root, 7.0, -4.0, -Math.PI / 2);
  colliders.push({ minX: 4.2, maxX: 6.8, minZ: -5.6, maxZ: -4.5 });

  addFridge(root, 7.2, 4.2);
  addCounter(root, 5.2, 3.2);
  addDiningTable(root, 5.2, 5.2);
  addChair(root, 4.4, 4.5, 0.3);
  addChair(root, 5.2, 4.5, 0);
  addChair(root, 6.0, 4.5, -0.3);
  addVending(root, 7.3, 2.5);
  colliders.push(
    { minX: 4.2, maxX: 6.2, minZ: 4.7, maxZ: 5.7 },
    { minX: 6.8, maxX: 7.6, minZ: 3.8, maxZ: 4.6 },
  );

  // Stone accent strip near creative wall (charcoal stone texture sample)
  const stoneTex = makeCharcoalStoneTexture();
  stoneTex.repeat.set(2, 6);
  const stoneStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.03, 6),
    new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.8, metalness: 0.1 }),
  );
  stoneStrip.position.set(-5.8, 0.02, 0);
  stoneStrip.receiveShadow = true;
  root.add(stoneStrip);

  // Floor LED accent strips along main axis
  root.add(
    box(0.08, 0.02, 8, COLORS.pink, -3.55, 0.02, 0, {
      emissive: COLORS.pink,
      emissiveIntensity: 0.4,
      roughness: 0.5,
    }),
  );
  root.add(
    box(0.08, 0.02, 8, COLORS.pink, 3.55, 0.02, 0, {
      emissive: COLORS.pink,
      emissiveIntensity: 0.4,
      roughness: 0.5,
    }),
  );

  // Ceiling recessed lights
  for (const [lx, lz] of [
    [-3, -2],
    [3, -2],
    [-3, 2],
    [3, 2],
    [0, 0],
    [0, -4],
    [5.5, -4],
    [5.5, 4],
  ]) {
    addRecessedLight(root, lx, H - 0.28, lz);
  }

  scene.add(root);
  return { root, colliders };
}
