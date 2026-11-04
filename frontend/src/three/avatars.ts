import * as THREE from 'three';

export type AvatarLook = 'cameraman' | 'beanie' | 'executive' | 'street' | 'producer';

export const SLUG_LOOK: Record<string, AvatarLook> = {
  dre: 'cameraman',
  spike: 'cameraman',
  shakir: 'beanie',
  jarvis: 'beanie',
  aria: 'executive',
  dispatcher: 'executive',
  simone: 'street',
  echo: 'producer',
  data_engineer: 'producer',
};

const SKIN: Record<string, number> = {
  jarvis: 0x5c3a21,
  aria: 0xc68642,
  simone: 0x8d5524,
  spike: 0xe0ac69,
  dre: 0xc68642,
  shakir: 0x5c3a21,
  echo: 0x5c3a21,
  data_engineer: 0xe0ac69,
  dispatcher: 0xffdbac,
};

const HAIR: Record<string, number> = {
  jarvis: 0x111111,
  aria: 0x1a1a1a,
  simone: 0x1a1a1a,
  spike: 0x1a1a1a,
  dre: 0x1a1a1a,
  shakir: 0x111111,
  echo: 0x111111,
  data_engineer: 0x333333,
  dispatcher: 0x4a3728,
};

export interface AvatarParts {
  root: THREE.Group;
  body: THREE.Group;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  head: THREE.Object3D;
  height: number;
  look: AvatarLook;
  restArms: {
    left: { x: number; z: number };
    right: { x: number; z: number };
  };
}

function m(color: number, opts: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
    metalness: 0.04,
    ...opts,
  });
}

function mesh(
  geo: THREE.BufferGeometry,
  color: number,
  x = 0,
  y = 0,
  z = 0,
  opts?: THREE.MeshStandardMaterialParameters,
) {
  const obj = new THREE.Mesh(geo, m(color, opts));
  obj.position.set(x, y, z);
  obj.castShadow = true;
  obj.receiveShadow = true;
  return obj;
}

function prim8Badge(parent: THREE.Object3D, y: number, z: number) {
  const plate = mesh(new THREE.BoxGeometry(0.22, 0.07, 0.02), 0x111111, 0, y, z);
  parent.add(plate);
  const eight = mesh(
    new THREE.BoxGeometry(0.06, 0.06, 0.025),
    0xec4899,
    0.06,
    y,
    z + 0.005,
    { emissive: 0xec4899, emissiveIntensity: 0.35 },
  );
  parent.add(eight);
}

/** Shared streetwear body: oversized hoodie + cargo joggers + shoes. */
function buildBody(slug: string, look: AvatarLook): AvatarParts {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const skin = SKIN[slug] ?? 0xe0ac69;
  const black = 0x141418;
  const charcoal = 0x1c1c22;
  const isExecutive = look === 'executive';
  const shoeWhite = look === 'beanie' || look === 'producer';
  const shoePink = look === 'street';

  // --- Legs (pivots at hip) ---
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.12, 0.72, 0);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.12, 0.72, 0);

  const pantColor = isExecutive ? 0x0d0d10 : charcoal;
  const thighGeo = new THREE.CapsuleGeometry(0.11, 0.28, 5, 10);
  leftLeg.add(mesh(thighGeo, pantColor, 0, -0.22, 0));
  rightLeg.add(mesh(thighGeo, pantColor, 0, -0.22, 0));

  // Cargo pockets
  if (!isExecutive) {
    leftLeg.add(mesh(new THREE.BoxGeometry(0.1, 0.14, 0.08), black, -0.12, -0.28, 0.02));
    rightLeg.add(mesh(new THREE.BoxGeometry(0.1, 0.14, 0.08), black, 0.12, -0.28, 0.02));
  }

  // Shin / cuff
  const shinGeo = new THREE.CapsuleGeometry(0.09, 0.22, 4, 10);
  leftLeg.add(mesh(shinGeo, pantColor, 0, -0.52, 0));
  rightLeg.add(mesh(shinGeo, pantColor, 0, -0.52, 0));

  // Shoes
  const shoeColor = shoeWhite ? 0xf5f5f5 : shoePink ? 0xec4899 : 0x0a0a0c;
  const shoeAccent = shoeWhite ? 0x111111 : shoePink ? 0x111111 : 0x222226;
  for (const leg of [leftLeg, rightLeg]) {
    const shoe = mesh(new THREE.BoxGeometry(0.16, 0.1, 0.28), shoeColor, 0, -0.7, 0.04);
    leg.add(shoe);
    leg.add(mesh(new THREE.BoxGeometry(0.16, 0.04, 0.08), shoeAccent, 0, -0.68, -0.1));
  }

  body.add(leftLeg, rightLeg);

  // --- Hips / waist ---
  if (isExecutive) {
    body.add(mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.16, 12), pantColor, 0, 0.78, 0));
    // gold buckle
    body.add(mesh(new THREE.BoxGeometry(0.1, 0.06, 0.04), 0xd4af37, 0, 0.78, 0.24, { metalness: 0.7, roughness: 0.35 }));
  } else {
    body.add(mesh(new THREE.CylinderGeometry(0.23, 0.25, 0.14, 12), charcoal, 0, 0.78, 0));
  }

  // --- Torso hoodie / turtleneck ---
  const torso = new THREE.Group();
  torso.position.y = 0.95;
  if (isExecutive) {
    torso.add(mesh(new THREE.CapsuleGeometry(0.24, 0.38, 6, 12), black, 0, 0.2, 0));
    // turtleneck collar
    torso.add(mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.14, 12), black, 0, 0.48, 0));
  } else {
    // oversized hoodie body
    torso.add(mesh(new THREE.CapsuleGeometry(0.27, 0.4, 6, 12), black, 0, 0.22, 0));
    // kangaroo pocket
    torso.add(mesh(new THREE.BoxGeometry(0.32, 0.16, 0.08), charcoal, 0, 0.05, 0.22));
    // hood bulk behind neck
    torso.add(mesh(new THREE.SphereGeometry(0.16, 12, 10), black, 0, 0.48, -0.12));
    // drawstrings
    torso.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 6), 0x9ca3af, -0.06, 0.28, 0.26));
    torso.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 6), 0x9ca3af, 0.06, 0.28, 0.26));
  }
  prim8Badge(torso, isExecutive ? 0.22 : 0.28, 0.27);
  body.add(torso);

  // --- Arms (pivots at shoulder) ---
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.34, 1.28, 0);
  const rightArm = new THREE.Group();
  rightArm.position.set(0.34, 1.28, 0);

  const sleeveGeo = new THREE.CapsuleGeometry(0.08, 0.32, 4, 10);
  leftArm.add(mesh(sleeveGeo, black, 0, -0.22, 0));
  rightArm.add(mesh(sleeveGeo, black, 0, -0.22, 0));
  // hands
  leftArm.add(mesh(new THREE.SphereGeometry(0.07, 10, 8), skin, 0, -0.48, 0));
  rightArm.add(mesh(new THREE.SphereGeometry(0.07, 10, 8), skin, 0, -0.48, 0));
  leftArm.rotation.z = 0.18;
  rightArm.rotation.z = -0.18;
  body.add(leftArm, rightArm);

  // --- Head (oversized vinyl-toy proportion for isometric readability) ---
  const head = new THREE.Group();
  head.position.set(0, 1.58, 0);
  head.add(mesh(new THREE.SphereGeometry(0.28, 20, 16), skin, 0, 0.1, 0));

  // Eyes
  const eyeWhite = 0xf8fafc;
  const pupil = 0x111111;
  head.add(mesh(new THREE.SphereGeometry(0.055, 10, 8), eyeWhite, -0.09, 0.12, 0.23));
  head.add(mesh(new THREE.SphereGeometry(0.055, 10, 8), eyeWhite, 0.09, 0.12, 0.23));
  head.add(mesh(new THREE.SphereGeometry(0.03, 8, 6), pupil, -0.09, 0.12, 0.27));
  head.add(mesh(new THREE.SphereGeometry(0.03, 8, 6), pupil, 0.09, 0.12, 0.27));

  // Nose / mouth hint
  head.add(mesh(new THREE.SphereGeometry(0.035, 8, 6), skin, 0, 0.05, 0.26));
  head.add(mesh(new THREE.BoxGeometry(0.09, 0.018, 0.02), 0x3f2a1d, 0, -0.02, 0.25));

  // Beard for masculine looks
  if (['jarvis', 'shakir', 'echo', 'dre', 'spike', 'data_engineer'].includes(slug)) {
    head.add(
      mesh(
        new THREE.SphereGeometry(0.2, 12, 10, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.5),
        0x111111,
        0,
        -0.02,
        0.06,
      ),
    );
  }

  body.add(head);

  // Look-specific accessories (may set idle arm pose)
  addLookExtras(body, head, leftArm, rightArm, slug, look, skin);

  // Ground contact shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  root.add(shadow);

  return {
    root,
    body,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    head,
    height: 1.85,
    look,
    restArms: {
      left: { x: leftArm.rotation.x, z: leftArm.rotation.z },
      right: { x: rightArm.rotation.x, z: rightArm.rotation.z },
    },
  };
}

function addLookExtras(
  body: THREE.Group,
  head: THREE.Group,
  leftArm: THREE.Group,
  rightArm: THREE.Group,
  slug: string,
  look: AvatarLook,
  skin: number,
) {
  const hair = HAIR[slug] ?? 0x111111;
  const black = 0x141418;

  if (look === 'cameraman') {
    // Forward cap
    head.add(mesh(new THREE.SphereGeometry(0.3, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), black, 0, 0.22, 0));
    head.add(mesh(new THREE.BoxGeometry(0.28, 0.04, 0.2), black, 0, 0.16, 0.26));
    // Backpack
    body.add(mesh(new THREE.BoxGeometry(0.48, 0.58, 0.28), black, 0, 1.18, -0.34));
    body.add(mesh(new THREE.BoxGeometry(0.1, 0.24, 0.05), 0xec4899, 0.24, 1.25, -0.48));
    // Cinema camera
    const cam = new THREE.Group();
    cam.add(mesh(new THREE.BoxGeometry(0.3, 0.2, 0.36), 0x1f2937, 0, 0, 0));
    cam.add(mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.24, 12), 0x374151, 0, 0, 0.26));
    cam.add(mesh(new THREE.BoxGeometry(0.16, 0.12, 0.03), 0x111111, 0.18, 0.04, 0));
    cam.add(mesh(new THREE.BoxGeometry(0.12, 0.05, 0.04), 0xec4899, 0.18, 0.04, 0.03));
    cam.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), 0x222222, 0, 0.18, -0.02));
    cam.position.set(0.08, -0.62, 0.2);
    cam.rotation.x = 0.35;
    rightArm.add(cam);
    rightArm.rotation.x = -0.95;
    rightArm.rotation.z = -0.05;
  }

  if (look === 'beanie') {
    // Tall ribbed beanie
    head.add(mesh(new THREE.SphereGeometry(0.32, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65), 0x1f1f23, 0, 0.2, -0.02));
    head.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16), 0x2a2a30, 0, 0.08, 0));
    // Sunglasses
    const glasses = new THREE.Group();
    glasses.add(mesh(new THREE.BoxGeometry(0.26, 0.1, 0.05), 0x111111, -0.12, 0, 0));
    glasses.add(mesh(new THREE.BoxGeometry(0.26, 0.1, 0.05), 0x111111, 0.12, 0, 0));
    glasses.add(mesh(new THREE.BoxGeometry(0.07, 0.04, 0.04), 0x111111, 0, 0, 0));
    glasses.add(mesh(new THREE.BoxGeometry(0.22, 0.08, 0.02), 0xf59e0b, -0.12, 0, 0.03, { transparent: true, opacity: 0.6 }));
    glasses.add(mesh(new THREE.BoxGeometry(0.22, 0.08, 0.02), 0xf59e0b, 0.12, 0, 0.03, { transparent: true, opacity: 0.6 }));
    glasses.position.set(0, 0.12, 0.26);
    head.add(glasses);
    leftArm.rotation.x = -1.15;
    rightArm.rotation.x = -1.15;
    leftArm.rotation.z = 0.55;
    rightArm.rotation.z = -0.55;
  }

  if (look === 'executive') {
    // High bun + slick hair
    head.add(mesh(new THREE.SphereGeometry(0.24, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.48), hair, 0, 0.2, -0.04));
    head.add(mesh(new THREE.SphereGeometry(0.15, 12, 10), hair, 0, 0.4, -0.02));
    // Glasses
    const frames = new THREE.Group();
    frames.add(mesh(new THREE.BoxGeometry(0.24, 0.12, 0.04), 0x111111, -0.12, 0, 0));
    frames.add(mesh(new THREE.BoxGeometry(0.24, 0.12, 0.04), 0x111111, 0.12, 0, 0));
    frames.add(mesh(new THREE.BoxGeometry(0.06, 0.04, 0.03), 0x111111, 0, 0, 0));
    frames.position.set(0, 0.12, 0.26);
    head.add(frames);
    // Gold hoop earrings
    head.add(mesh(new THREE.TorusGeometry(0.07, 0.012, 8, 16), 0xd4af37, -0.28, 0.02, 0.02, { metalness: 0.8, roughness: 0.3 }));
    head.add(mesh(new THREE.TorusGeometry(0.07, 0.012, 8, 16), 0xd4af37, 0.28, 0.02, 0.02, { metalness: 0.8, roughness: 0.3 }));
    // Laptop under left arm
    const laptop = new THREE.Group();
    laptop.add(mesh(new THREE.BoxGeometry(0.4, 0.03, 0.28), 0xc0c5ce, 0, 0, 0, { metalness: 0.45, roughness: 0.4 }));
    laptop.add(mesh(new THREE.BoxGeometry(0.14, 0.02, 0.03), 0xffffff, -0.05, 0.02, 0.14));
    laptop.add(mesh(new THREE.BoxGeometry(0.05, 0.02, 0.03), 0xec4899, 0.07, 0.02, 0.14));
    laptop.position.set(0.1, -0.4, 0.14);
    laptop.rotation.z = 0.45;
    leftArm.add(laptop);
    leftArm.rotation.x = -0.9;
    leftArm.rotation.z = 0.4;
  }

  if (look === 'street') {
    // Voluminous curly high ponytail
    head.add(mesh(new THREE.SphereGeometry(0.26, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), hair, 0, 0.22, -0.04));
    head.add(mesh(new THREE.SphereGeometry(0.2, 12, 10), hair, 0, 0.44, -0.08));
    head.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), hair, -0.22, 0.04, 0.14));
    head.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), hair, 0.22, 0.04, 0.14));
    head.add(mesh(new THREE.SphereGeometry(0.06, 8, 6), hair, -0.16, -0.08, 0.16));
    // Gold hoops
    head.add(mesh(new THREE.TorusGeometry(0.075, 0.014, 8, 16), 0xd4af37, -0.3, 0.0, 0.04, { metalness: 0.8, roughness: 0.3 }));
    head.add(mesh(new THREE.TorusGeometry(0.075, 0.014, 8, 16), 0xd4af37, 0.3, 0.0, 0.04, { metalness: 0.8, roughness: 0.3 }));
    // Pink shoe already set; hands in pocket
    leftArm.rotation.x = -1.1;
    rightArm.rotation.x = -1.1;
    leftArm.rotation.z = 0.6;
    rightArm.rotation.z = -0.6;
  }

  if (look === 'producer') {
    // Backward cap + big headphones
    head.add(mesh(new THREE.SphereGeometry(0.3, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), black, 0, 0.2, 0));
    head.add(mesh(new THREE.BoxGeometry(0.26, 0.04, 0.18), black, 0, 0.14, -0.26));
    const hp = new THREE.Group();
    hp.add(mesh(new THREE.TorusGeometry(0.28, 0.035, 8, 24), black, 0, 0.1, 0));
    hp.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 14), black, -0.3, 0.06, 0));
    hp.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 14), black, 0.3, 0.06, 0));
    hp.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 12), 0xec4899, -0.3, 0.06, 0.02));
    hp.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 12), 0xec4899, 0.3, 0.06, 0.02));
    hp.rotation.z = Math.PI / 2;
    hp.position.set(0, 0.14, 0);
    head.add(hp);
    leftArm.rotation.x = -1.05;
    rightArm.rotation.x = -1.05;
    leftArm.rotation.z = 0.55;
    rightArm.rotation.z = -0.55;
  }

  void skin;
}

export function createAvatar(slug: string): AvatarParts {
  const look = SLUG_LOOK[slug] ?? 'producer';
  const parts = buildBody(slug, look);
  // Slightly larger so detail reads in isometric view
  parts.root.scale.setScalar(1.25);
  parts.height *= 1.25;
  return parts;
}

/** Animate limbs for walk / idle / work. */
export function animateAvatar(
  parts: AvatarParts,
  dt: number,
  phase: number,
  moving: boolean,
  working: boolean,
) {
  const swing = moving ? Math.sin(phase) * 0.7 : Math.sin(phase * 0.5) * 0.04;
  parts.leftLeg.rotation.x = swing;
  parts.rightLeg.rotation.x = -swing;

  if (moving) {
    // Cameraman keeps camera arm relatively steady
    if (parts.look === 'cameraman') {
      parts.leftArm.rotation.x = -swing * 0.7;
      parts.rightArm.rotation.x = -0.9 + swing * 0.15;
      parts.leftArm.rotation.z = 0.18;
      parts.rightArm.rotation.z = -0.05;
    } else {
      parts.leftArm.rotation.x = -swing * 0.85;
      parts.rightArm.rotation.x = swing * 0.85;
      parts.leftArm.rotation.z = 0.18;
      parts.rightArm.rotation.z = -0.18;
    }
  } else if (working) {
    parts.rightArm.rotation.x = -0.7 + Math.sin(phase * 3) * 0.12;
    parts.leftArm.rotation.x = -0.5;
    parts.leftArm.rotation.z = parts.restArms.left.z;
    parts.rightArm.rotation.z = parts.restArms.right.z;
  } else {
    // Return to look-specific rest pose
    parts.leftArm.rotation.x = parts.restArms.left.x;
    parts.leftArm.rotation.z = parts.restArms.left.z;
    parts.rightArm.rotation.x = parts.restArms.right.x;
    parts.rightArm.rotation.z = parts.restArms.right.z;
  }

  // Subtle idle breathe / walk bounce
  if (!moving) {
    parts.body.position.y = Math.sin(phase * 0.8) * 0.012;
  } else {
    parts.body.position.y = Math.abs(Math.sin(phase)) * 0.03;
  }

  void dt;
}
