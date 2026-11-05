import * as THREE from 'three';
import {
  CINEMATIC,
  makeWalnutTexture,
  matBronze,
  matCharcoal,
  matLeather,
  matSmokedGlass,
  matStone,
  matWalnut,
  meshBox,
} from './cinematicMaterials';

/** Axis-aligned floor collider used by first-person navigation. */
export interface Collider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * Cinematic Studio Floor (workspace) — dark walnut desks, bronze hardware,
 * smoked-glass partitions, acoustic detailing. Desk positions stay aligned
 * with DESK_SPOTS in rooms.ts.
 */
export function buildCinematicWorkspace(parent: THREE.Group): Collider[] {
  const root = new THREE.Group();
  root.name = 'cinematic-workspace';
  parent.add(root);

  const colliders: Collider[] = [];
  const walnutMap = makeWalnutTexture();
  walnutMap.repeat.set(2, 1);
  const walnut = matWalnut(walnutMap);
  const stone = matStone();
  const bronze = matBronze();
  const leather = matLeather();
  const charcoal = matCharcoal();
  const glass = matSmokedGlass();

  // Zone stone platform / rug substitute (charcoal stone inset)
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(6.2, 0.04, 5.0),
    stone,
  );
  platform.position.set(0, 0.02, 0.8);
  platform.receiveShadow = true;
  root.add(platform);

  // Thin bronze inlay border
  root.add(meshBox(6.25, 0.015, 0.04, bronze, 0, 0.045, -1.7));
  root.add(meshBox(6.25, 0.015, 0.04, bronze, 0, 0.045, 3.3));
  root.add(meshBox(0.04, 0.015, 5.05, bronze, -3.1, 0.045, 0.8));
  root.add(meshBox(0.04, 0.015, 5.05, bronze, 3.1, 0.045, 0.8));

  // Smoked glass low partitions (N/S of cluster) — keep circulation open
  const glassPanel = (x: number, z: number, rotY: number, w: number) => {
    const g = new THREE.Group();
    g.add(meshBox(w, 1.05, 0.04, glass, 0, 0.55, 0));
    g.add(meshBox(w + 0.08, 0.04, 0.06, bronze, 0, 1.1, 0));
    g.add(meshBox(w + 0.08, 0.05, 0.08, bronze, 0, 0.03, 0));
    g.add(meshBox(0.05, 1.05, 0.05, bronze, -w / 2, 0.55, 0));
    g.add(meshBox(0.05, 1.05, 0.05, bronze, w / 2, 0.55, 0));
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    root.add(g);
  };
  glassPanel(-3.05, 0.8, Math.PI / 2, 3.6);
  glassPanel(3.05, 0.8, Math.PI / 2, 3.6);

  // Acoustic wall panels above desks (back of workspace toward control)
  for (const ax of [-2.2, -0.7, 0.7, 2.2]) {
    const panel = meshBox(1.2, 0.9, 0.06, charcoal, ax, 2.4, -1.85);
    root.add(panel);
    root.add(meshBox(1.15, 0.02, 0.02, bronze, ax, 2.0, -1.81));
  }

  // Pendant linear lights over studio floor (restrained — avoid washing walnut)
  for (const [lx, lz] of [
    [-1.6, 0.9],
    [1.6, 0.9],
  ] as const) {
    root.add(meshBox(2.4, 0.04, 0.12, bronze, lx, 3.55, lz));
    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.03, 0.08),
      new THREE.MeshStandardMaterial({
        color: CINEMATIC.warmWhite,
        emissive: 0xffd9a8,
        emissiveIntensity: 0.35,
        roughness: 0.5,
      }),
    );
    glow.position.set(lx, 3.52, lz);
    root.add(glow);
    const pl = new THREE.PointLight(0xffe2b8, 0.28, 6.5, 2);
    pl.position.set(lx, 3.3, lz);
    root.add(pl);
  }

  // Soft pink LED cove under platform lip
  const cove = new THREE.Mesh(
    new THREE.BoxGeometry(5.8, 0.02, 0.03),
    new THREE.MeshStandardMaterial({
      color: CINEMATIC.pink,
      emissive: CINEMATIC.pink,
      emissiveIntensity: 0.55,
      roughness: 0.45,
    }),
  );
  cove.position.set(0, 0.06, 3.28);
  root.add(cove);

  const desks: Array<[number, number]> = [
    [-1.6, -0.2],
    [1.6, -0.2],
    [-1.6, 2.0],
    [1.6, 2.0],
  ];

  for (const [dx, dz] of desks) {
    addExecutiveDesk(root, dx, dz, walnut, bronze, charcoal, leather);
    addExecutiveChair(root, dx, dz + 0.92, Math.PI, leather, bronze);
    colliders.push({
      minX: dx - 0.85,
      maxX: dx + 0.85,
      minZ: dz - 0.45,
      maxZ: dz + 0.45,
    });
    // Chair footprint (soft)
    colliders.push({
      minX: dx - 0.35,
      maxX: dx + 0.35,
      minZ: dz + 0.65,
      maxZ: dz + 1.15,
    });
  }

  // Central collaboration table (low)
  const collab = new THREE.Group();
  collab.add(meshBox(1.4, 0.05, 0.7, walnut, 0, 0.42, 0));
  collab.add(meshBox(0.08, 0.4, 0.08, bronze, -0.55, 0.2, -0.25));
  collab.add(meshBox(0.08, 0.4, 0.08, bronze, 0.55, 0.2, -0.25));
  collab.add(meshBox(0.08, 0.4, 0.08, bronze, -0.55, 0.2, 0.25));
  collab.add(meshBox(0.08, 0.4, 0.08, bronze, 0.55, 0.2, 0.25));
  collab.position.set(0, 0, 0.9);
  root.add(collab);
  colliders.push({ minX: -0.75, maxX: 0.75, minZ: 0.5, maxZ: 1.3 });

  // Interaction hotspot markers (CSS2D attached by OfficeApp)
  root.userData.hotspots = [
    { id: 'desk_nw', label: 'Workstation', x: -1.6, y: 1.15, z: -0.2 },
    { id: 'desk_ne', label: 'Workstation', x: 1.6, y: 1.15, z: -0.2 },
    { id: 'desk_sw', label: 'Workstation', x: -1.6, y: 1.15, z: 2.0 },
    { id: 'desk_se', label: 'Workstation', x: 1.6, y: 1.15, z: 2.0 },
    { id: 'collab', label: 'Collab table', x: 0, y: 0.7, z: 0.9 },
  ];

  return colliders;
}

function addExecutiveDesk(
  parent: THREE.Group,
  x: number,
  z: number,
  walnut: THREE.Material,
  bronze: THREE.Material,
  charcoal: THREE.Material,
  leather: THREE.Material,
) {
  const g = new THREE.Group();

  // Thick walnut top
  g.add(meshBox(1.7, 0.06, 0.82, walnut, 0, 0.76, 0));
  // Underside bevel / edge band
  g.add(meshBox(1.72, 0.03, 0.84, bronze, 0, 0.72, 0));

  // Pedestal cabinets
  g.add(meshBox(0.42, 0.62, 0.7, charcoal, -0.58, 0.34, 0));
  g.add(meshBox(0.42, 0.62, 0.7, charcoal, 0.58, 0.34, 0));
  g.add(meshBox(0.08, 0.04, 0.12, bronze, -0.4, 0.45, 0.36));
  g.add(meshBox(0.08, 0.04, 0.12, bronze, 0.4, 0.45, 0.36));

  // Modesty panel
  g.add(meshBox(0.7, 0.4, 0.03, charcoal, 0, 0.35, -0.35));

  // Dual ultrawide-ish monitors on bronze arms
  g.add(meshBox(0.12, 0.02, 0.12, bronze, 0, 0.8, -0.28));
  g.add(meshBox(0.04, 0.28, 0.04, bronze, 0, 0.95, -0.28));
  g.add(meshBox(0.9, 0.03, 0.04, bronze, 0, 1.1, -0.28));

  const screenMat = new THREE.MeshStandardMaterial({
    color: CINEMATIC.screen,
    emissive: 0x142033,
    emissiveIntensity: 0.35,
    roughness: 0.25,
    metalness: 0.2,
  });
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 0.03), screenMat);
  left.position.set(-0.34, 1.28, -0.28);
  left.castShadow = true;
  g.add(left);
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 0.03), screenMat.clone());
  right.position.set(0.34, 1.28, -0.28);
  right.castShadow = true;
  g.add(right);

  // Bezels
  g.add(meshBox(0.66, 0.4, 0.02, charcoal, -0.34, 1.28, -0.3));
  g.add(meshBox(0.66, 0.4, 0.02, charcoal, 0.34, 1.28, -0.3));

  // Subtle pink status LED
  const led = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.01, 0.01),
    new THREE.MeshStandardMaterial({
      color: CINEMATIC.pink,
      emissive: CINEMATIC.pink,
      emissiveIntensity: 0.7,
    }),
  );
  led.position.set(0, 1.05, -0.26);
  g.add(led);

  // Keyboard deck + leather mousepad
  g.add(meshBox(0.42, 0.015, 0.15, charcoal, -0.1, 0.8, 0.18));
  g.add(meshBox(0.28, 0.01, 0.22, leather, 0.4, 0.795, 0.18));
  g.add(meshBox(0.05, 0.02, 0.08, charcoal, 0.45, 0.81, 0.2));

  // Audio interface / interface rack
  g.add(meshBox(0.28, 0.05, 0.16, charcoal, -0.55, 0.82, 0.15));
  const ifaceLed = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.015, 0.01),
    new THREE.MeshStandardMaterial({
      color: CINEMATIC.pink,
      emissive: CINEMATIC.pink,
      emissiveIntensity: 0.4,
    }),
  );
  ifaceLed.position.set(-0.55, 0.845, 0.23);
  g.add(ifaceLed);

  // Cable management tray
  g.add(meshBox(1.0, 0.04, 0.14, charcoal, 0, 0.58, -0.15));

  g.position.set(x, 0, z);
  parent.add(g);
}

function addExecutiveChair(
  parent: THREE.Group,
  x: number,
  z: number,
  rotY: number,
  leather: THREE.Material,
  bronze: THREE.Material,
) {
  const g = new THREE.Group();
  g.add(meshBox(0.5, 0.08, 0.5, leather, 0, 0.48, 0));
  g.add(meshBox(0.5, 0.62, 0.08, leather, 0, 0.82, -0.22));
  g.add(meshBox(0.42, 0.14, 0.06, leather, 0, 0.7, -0.2));
  // Arms
  g.add(meshBox(0.06, 0.05, 0.36, bronze, -0.26, 0.62, 0));
  g.add(meshBox(0.06, 0.05, 0.36, bronze, 0.26, 0.62, 0));
  g.add(meshBox(0.04, 0.2, 0.04, bronze, -0.26, 0.52, 0.1));
  g.add(meshBox(0.04, 0.2, 0.04, bronze, 0.26, 0.52, 0.1));
  // Base
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.4, 10), bronze);
  pole.position.set(0, 0.24, 0);
  pole.castShadow = true;
  g.add(pole);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 10), bronze);
  base.position.set(0, 0.04, 0);
  g.add(base);
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  parent.add(g);
}
