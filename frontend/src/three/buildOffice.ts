import * as THREE from 'three';
import { ROOM_SIZE } from './rooms';

const COLORS = {
  wood: 0xc4a574,
  woodDark: 0xa8885c,
  wall: 0xf2f0eb,
  wallTrim: 0xe8e4dc,
  rug: 0xd8d6d0,
  desk: 0xf5f5f5,
  deskEdge: 0xe2e2e2,
  chair: 0x6b7280,
  sofa: 0x1e3a5f,
  plant: 0x4ade80,
  pot: 0xf8fafc,
  metal: 0xcbd5e1,
  screen: 0x111827,
  pink: 0xec4899,
  fridge: 0xf8fafc,
  counter: 0xffffff,
  shadow: 0x000000,
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
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBot, h, segments),
    mat(color),
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
  g.addColorStop(0, '#7ec8e8');
  g.addColorStop(0.55, '#b8dff0');
  g.addColorStop(1, '#5a9bb8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);
  // hills
  ctx.fillStyle = '#3d6b4f';
  ctx.beginPath();
  ctx.moveTo(0, 200);
  ctx.quadraticCurveTo(120, 140, 220, 190);
  ctx.quadraticCurveTo(320, 230, 512, 170);
  ctx.lineTo(512, 256);
  ctx.lineTo(0, 256);
  ctx.fill();
  // bridge hint (Golden Gate-ish)
  ctx.strokeStyle = '#c44';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(280, 175);
  ctx.quadraticCurveTo(360, 110, 440, 170);
  ctx.stroke();
  ctx.strokeStyle = '#a33';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const x = 280 + (440 - 280) * t;
    const y = 175 - Math.sin(t * Math.PI) * 55;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, 200);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makePrim8ScreenTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 288;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0b0c0e';
  ctx.fillRect(0, 0, 512, 288);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 72px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PRIM', 230, 144);
  ctx.fillStyle = '#ec4899';
  ctx.fillText('8', 340, 144);
  // subtle hex flower accent
  ctx.strokeStyle = '#ec489988';
  ctx.lineWidth = 3;
  const cx = 100;
  const cy = 144;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * 28, cy + Math.sin(a) * 28, 18, 0, Math.PI * 2);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function addPlant(parent: THREE.Group, x: number, z: number, scale = 1) {
  const g = new THREE.Group();
  g.add(cylinder(0.18 * scale, 0.22 * scale, 0.28 * scale, COLORS.pot, 0, 0.14 * scale, 0));
  g.add(cylinder(0.02, 0.02, 0.35 * scale, 0x5b4030, 0, 0.4 * scale, 0));
  const bush = new THREE.Mesh(
    new THREE.SphereGeometry(0.32 * scale, 12, 10),
    mat(COLORS.plant, { roughness: 0.7 }),
  );
  bush.position.set(0, 0.65 * scale, 0);
  bush.castShadow = true;
  g.add(bush);
  g.position.set(x, 0, z);
  parent.add(g);
}

function addDesk(parent: THREE.Group, x: number, z: number, rotY = 0) {
  const g = new THREE.Group();
  // top
  g.add(box(1.4, 0.06, 0.7, COLORS.desk, 0, 0.72, 0));
  // legs
  for (const [lx, lz] of [
    [-0.6, -0.28],
    [0.6, -0.28],
    [-0.6, 0.28],
    [0.6, 0.28],
  ]) {
    g.add(box(0.06, 0.72, 0.06, COLORS.metal, lx, 0.36, lz));
  }
  // laptop
  const base = box(0.42, 0.02, 0.28, 0x374151, 0, 0.76, 0.05);
  g.add(base);
  const screen = box(0.42, 0.28, 0.02, COLORS.screen, 0, 0.9, -0.08);
  g.add(screen);
  // mug
  g.add(cylinder(0.05, 0.05, 0.08, COLORS.plant, 0.45, 0.8, 0.15, 10));
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  parent.add(g);
}

function addChair(parent: THREE.Group, x: number, z: number, rotY = 0) {
  const g = new THREE.Group();
  g.add(box(0.42, 0.06, 0.42, COLORS.chair, 0, 0.42, 0));
  g.add(box(0.42, 0.45, 0.06, COLORS.chair, 0, 0.66, -0.18));
  g.add(cylinder(0.04, 0.04, 0.4, COLORS.metal, 0, 0.2, 0));
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  parent.add(g);
}

function addSofa(parent: THREE.Group, x: number, z: number) {
  const g = new THREE.Group();
  g.add(box(2.2, 0.35, 0.85, COLORS.sofa, 0, 0.28, 0));
  g.add(box(2.2, 0.55, 0.18, COLORS.sofa, 0, 0.55, -0.34));
  g.add(box(0.18, 0.45, 0.85, COLORS.sofa, -1.01, 0.5, 0));
  g.add(box(0.18, 0.45, 0.85, COLORS.sofa, 1.01, 0.5, 0));
  g.position.set(x, 0, z);
  parent.add(g);
}

function addCoffeeTable(parent: THREE.Group, x: number, z: number) {
  const g = new THREE.Group();
  g.add(box(0.9, 0.05, 0.55, 0xb8956a, 0, 0.32, 0));
  g.add(cylinder(0.06, 0.08, 0.3, 0x8b6914, 0, 0.15, 0));
  g.position.set(x, 0, z);
  parent.add(g);
}

function addShelf(parent: THREE.Group, x: number, z: number) {
  const g = new THREE.Group();
  g.add(box(0.9, 1.8, 0.35, COLORS.desk, 0, 0.9, 0));
  for (let i = 0; i < 4; i++) {
    g.add(box(0.82, 0.03, 0.3, COLORS.deskEdge, 0, 0.3 + i * 0.4, 0.02));
  }
  g.position.set(x, 0, z);
  parent.add(g);
}

function addFridge(parent: THREE.Group, x: number, z: number) {
  const g = new THREE.Group();
  g.add(box(0.75, 1.8, 0.7, COLORS.fridge, 0, 0.9, 0));
  g.add(box(0.04, 0.35, 0.04, COLORS.metal, 0.32, 1.0, 0.36));
  // pink PRIM8 stripe
  g.add(box(0.76, 0.06, 0.02, COLORS.pink, 0, 1.5, 0.36));
  g.position.set(x, 0, z);
  parent.add(g);
}

function addDiningTable(parent: THREE.Group, x: number, z: number) {
  const g = new THREE.Group();
  g.add(box(1.8, 0.06, 0.9, 0xb8956a, 0, 0.7, 0));
  for (const [lx, lz] of [
    [-0.75, -0.35],
    [0.75, -0.35],
    [-0.75, 0.35],
    [0.75, 0.35],
  ]) {
    g.add(box(0.07, 0.7, 0.07, 0x8b6914, lx, 0.35, lz));
  }
  g.position.set(x, 0, z);
  parent.add(g);
}

function addCounter(parent: THREE.Group, x: number, z: number) {
  const g = new THREE.Group();
  g.add(box(2.2, 0.85, 0.6, COLORS.counter, 0, 0.425, 0));
  g.add(box(2.2, 0.05, 0.62, COLORS.metal, 0, 0.87, 0));
  // sink recess
  g.add(box(0.4, 0.08, 0.3, 0x94a3b8, -0.4, 0.9, 0));
  g.position.set(x, 0, z);
  parent.add(g);
}

function addVending(parent: THREE.Group, x: number, z: number) {
  const g = new THREE.Group();
  g.add(box(0.7, 1.6, 0.55, 0x1f2937, 0, 0.8, 0));
  g.add(box(0.55, 1.1, 0.04, 0x60a5fa, 0, 0.95, 0.28));
  g.add(box(0.72, 0.08, 0.04, COLORS.pink, 0, 1.55, 0.28));
  g.position.set(x, 0, z);
  parent.add(g);
}

function addPoster(parent: THREE.Group, x: number, y: number, z: number, color: number) {
  const frame = box(0.7, 1.1, 0.04, 0xffffff, x, y, z);
  parent.add(frame);
  const art = box(0.55, 0.9, 0.02, color, x, y, z + 0.03);
  parent.add(art);
}

/** Build the full PRIM8 Gather-style isometric office into `scene`. */
export function buildOffice(scene: THREE.Scene): THREE.Group {
  const root = new THREE.Group();
  root.name = 'office-root';

  const { width: W, depth: D, height: H } = ROOM_SIZE;
  const hw = W / 2;
  const hd = D / 2;

  // Floor — wood planks via striped texture
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 256;
  floorCanvas.height = 256;
  {
    const ctx = floorCanvas.getContext('2d')!;
    ctx.fillStyle = '#c4a574';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 ? '#b8956a' : '#cbb07e';
      ctx.fillRect(0, i * 16, 256, 16);
      ctx.strokeStyle = '#a8885c55';
      ctx.strokeRect(0, i * 16, 256, 16);
    }
  }
  const floorTex = new THREE.CanvasTexture(floorCanvas);
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(W / 2, D / 2);
  floorTex.colorSpace = THREE.SRGBColorSpace;
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  // Rugs
  const centerRug = box(5.2, 0.02, 4.2, COLORS.rug, 0, 0.015, 0.6);
  root.add(centerRug);
  const loungeRug = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, 0.02, 24),
    mat(COLORS.rug),
  );
  loungeRug.position.set(5.5, 0.015, -4.2);
  loungeRug.receiveShadow = true;
  root.add(loungeRug);

  // Floating platform underside (Gather-style room mass)
  root.add(box(W + 0.4, 0.35, D + 0.4, 0xd6d0c4, 0, -0.18, 0));
  root.add(box(W + 0.15, 0.08, D + 0.15, 0xece7dc, 0, 0.01, 0));

  // Walls — full height on back/left; windowed walls on right/front corners
  const wallMat = mat(COLORS.wall, { roughness: 0.95 });
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.18), wallMat);
  backWall.position.set(0, H / 2, -hd);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  root.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, H, D), wallMat);
  leftWall.position.set(-hw, H / 2, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  root.add(leftWall);

  // Right wall with large window openings (solid strips + glass)
  root.add(box(0.18, H, 1.2, COLORS.wall, hw, H / 2, -hd + 0.6));
  root.add(box(0.18, H, 1.2, COLORS.wall, hw, H / 2, hd - 0.6));
  root.add(box(0.18, H, 1.0, COLORS.wall, hw, H / 2, 0));
  root.add(box(0.18, 0.7, D, COLORS.wallTrim, hw, 0.35, 0));
  root.add(box(0.18, 0.55, D, COLORS.wallTrim, hw, H - 0.28, 0));

  // Front open edge with knee wall so agents stay readable
  root.add(box(W, 0.75, 0.18, COLORS.wallTrim, 0, 0.38, hd));
  root.add(box(1.2, H, 0.18, COLORS.wall, -hw + 0.6, H / 2, hd));
  root.add(box(1.2, H, 0.18, COLORS.wall, hw - 0.6, H / 2, hd));

  // Window frames + sky / bay views
  const sky = makeSkyTexture();
  const windowPositions: Array<[number, number, number, number, number, number]> = [
    [-5.2, 2.35, -hd + 0.12, 2.6, 2.0, 0.05],
    [4.8, 2.35, -hd + 0.12, 2.8, 2.0, 0.05],
    [hw - 0.12, 2.35, -3.2, 0.05, 2.0, 2.6],
    [hw - 0.12, 2.35, 3.0, 0.05, 2.0, 2.6],
  ];
  for (const [x, y, z, w, h, d] of windowPositions) {
    const frame = box(w + 0.14, h + 0.14, d + 0.05, 0xffffff, x, y, z);
    root.add(frame);
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({
        map: sky,
        roughness: 0.2,
        metalness: 0.05,
        emissive: 0x334455,
        emissiveIntensity: 0.22,
      }),
    );
    glass.position.set(x, y, z);
    root.add(glass);
  }

  // Big PRIM8 monitor on back wall
  const monitor = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 1.5, 0.08),
    new THREE.MeshStandardMaterial({
      map: makePrim8ScreenTexture(),
      emissive: 0xec4899,
      emissiveIntensity: 0.08,
      roughness: 0.4,
    }),
  );
  monitor.position.set(0, 2.6, -hd + 0.2);
  root.add(monitor);
  root.add(box(3.4, 0.08, 0.12, 0x111827, 0, 1.8, -hd + 0.2));

  // Left wall posters (green abstract)
  addPoster(root, -hw + 0.12, 2.1, -3.5, 0x86efac);
  addPoster(root, -hw + 0.12, 2.1, -1.8, 0x4ade80);
  addPoster(root, -hw + 0.12, 2.1, -0.1, 0x22c55e);

  // Left storage
  addShelf(root, -hw + 0.55, -4.5);
  addShelf(root, -hw + 0.55, 3.5);
  root.add(box(1.4, 0.55, 0.45, 0xb8956a, -hw + 0.7, 0.28, 1.2));

  // Plants
  for (const [x, z, s] of [
    [-7.5, -5.5, 1],
    [-7.5, 5.5, 1],
    [7.5, -5.8, 0.9],
    [7.2, 5.8, 1.1],
    [-3.2, -5.8, 0.8],
    [3.2, -5.8, 0.8],
    [-3, 2.8, 0.7],
    [3, 2.8, 0.7],
  ] as const) {
    addPlant(root, x, z, s);
  }

  // Back desks (Control)
  addDesk(root, -2.2, -5.2);
  addChair(root, -2.2, -4.3, Math.PI);
  addDesk(root, 2.2, -5.2);
  addChair(root, 2.2, -4.3, Math.PI);

  // Center 2x2 studio desks
  const desks: Array<[number, number]> = [
    [-1.6, -0.2],
    [1.6, -0.2],
    [-1.6, 2.0],
    [1.6, 2.0],
  ];
  for (const [x, z] of desks) {
    addDesk(root, x, z);
    addChair(root, x, z + 0.85, Math.PI);
  }

  // Lounge
  addSofa(root, 5.5, -5.1);
  addCoffeeTable(root, 5.5, -3.9);

  // Kitchen
  addFridge(root, 7.2, 4.2);
  addCounter(root, 5.2, 3.2);
  addDiningTable(root, 5.2, 5.2);
  addChair(root, 4.4, 4.5, 0.3);
  addChair(root, 5.2, 4.5, 0);
  addChair(root, 6.0, 4.5, -0.3);
  addVending(root, 7.3, 2.5);

  // Ceiling light panels (subtle emissive)
  for (const [x, z] of [
    [-3, -2],
    [3, -2],
    [-3, 2],
    [3, 2],
    [0, 0],
  ]) {
    const light = box(1.6, 0.05, 1.0, 0xfff7e6, x, H - 0.1, z, {
      emissive: 0xfff1c9,
      emissiveIntensity: 0.35,
      roughness: 0.5,
    });
    root.add(light);
  }

  scene.add(root);
  return root;
}
