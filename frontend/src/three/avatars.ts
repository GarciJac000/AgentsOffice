import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export type AvatarLook =
  | 'creative'
  | 'cinematographer'
  | 'director'
  | 'strategist'
  | 'producer';

/** Claymation GLB roster — 5 authored characters mapped onto office agents. */
export const SLUG_LOOK: Record<string, AvatarLook> = {
  simone: 'creative',
  jarvis: 'director',
  dre: 'cinematographer',
  spike: 'cinematographer',
  aria: 'strategist',
  dispatcher: 'strategist',
  shakir: 'director',
  echo: 'producer',
  data_engineer: 'producer',
};

const LOOK_MODEL: Record<AvatarLook, string> = {
  creative: '01_pink_creative.glb',
  cinematographer: '02_blue_cinematographer.glb',
  director: '03_purple_director.glb',
  strategist: '04_green_strategist.glb',
  producer: '05_orange_producer.glb',
};

/** Target on-floor height so claymation figures read next to ~0.72 desks. */
const TARGET_HEIGHT = 2.55;

export interface AvatarParts {
  root: THREE.Group;
  body: THREE.Group;
  height: number;
  look: AvatarLook;
}

const loader = new GLTFLoader();
const templateCache = new Map<string, Promise<THREE.Group>>();

function modelUrl(file: string): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}assets/models/agents/${file}`;
}

function prepareTemplate(scene: THREE.Object3D): THREE.Group {
  const holder = new THREE.Group();
  // Authored assets are Z-up; rotate into Three.js Y-up.
  scene.rotation.x = -Math.PI / 2;
  holder.add(scene);
  holder.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(holder);
  const center = box.getCenter(new THREE.Vector3());
  scene.position.x -= center.x;
  scene.position.z -= center.z;
  scene.position.y -= box.min.y;
  holder.updateMatrixWorld(true);

  const sized = new THREE.Box3().setFromObject(holder);
  const height = Math.max(0.01, sized.max.y - sized.min.y);
  const scale = TARGET_HEIGHT / height;
  holder.scale.setScalar(scale);

  holder.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // Claymation assets ship as many tiny parts with vertex colors.
    // Authored metalness=1 washes them into chrome; force a matte clay read.
    if (mesh.geometry?.attributes?.color) {
      mesh.geometry.attributes.color.needsUpdate = true;
    }
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      if (!mat) continue;
      mat.side = THREE.FrontSide;
      const std = mat as THREE.MeshStandardMaterial;
      std.vertexColors = true;
      std.metalness = 0.08;
      std.roughness = 0.88;
      std.flatShading = true;
      if (std.map) std.map.colorSpace = THREE.SRGBColorSpace;
      std.needsUpdate = true;
    }
  });

  return holder;
}

function loadTemplate(file: string): Promise<THREE.Group> {
  const cached = templateCache.get(file);
  if (cached) return cached;

  const promise = new Promise<THREE.Group>((resolve, reject) => {
    loader.load(
      modelUrl(file),
      (gltf) => resolve(prepareTemplate(gltf.scene)),
      undefined,
      reject,
    );
  });
  templateCache.set(file, promise);
  return promise;
}

function addGroundShadow(root: THREE.Group) {
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 24),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  root.add(shadow);
}

function fallbackBlock(look: AvatarLook): AvatarParts {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const tint: Record<AvatarLook, number> = {
    creative: 0xec4899,
    cinematographer: 0x60a5fa,
    director: 0xa78bfa,
    strategist: 0x4ade80,
    producer: 0xf97316,
  };
  const mat = new THREE.MeshStandardMaterial({
    color: tint[look],
    roughness: 0.7,
    metalness: 0.05,
  });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.7, 6, 12), mat);
  torso.position.y = 1.0;
  torso.castShadow = true;
  body.add(torso);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xe8c4a8, roughness: 0.75 }),
  );
  head.position.y = 1.75;
  head.castShadow = true;
  body.add(head);
  addGroundShadow(root);
  return { root, body, height: TARGET_HEIGHT, look };
}

/** Load claymation GLB for slug (cached + cloned). */
export async function createAvatar(slug: string): Promise<AvatarParts> {
  const look = SLUG_LOOK[slug] ?? 'producer';
  const file = LOOK_MODEL[look];
  try {
    const template = await loadTemplate(file);
    const root = new THREE.Group();
    const body = template.clone(true);
    root.add(body);
    addGroundShadow(root);
    return { root, body, height: TARGET_HEIGHT, look };
  } catch (err) {
    console.warn(`[avatars] failed to load ${file} for ${slug}`, err);
    return fallbackBlock(look);
  }
}

/** Soft bob / sway — GLBs are rigid (no skeletal clips). */
export function animateAvatar(
  parts: AvatarParts,
  dt: number,
  phase: number,
  moving: boolean,
  working: boolean,
) {
  if (moving) {
    parts.body.position.y = Math.abs(Math.sin(phase)) * 0.045;
    parts.body.rotation.z = Math.sin(phase) * 0.04;
    parts.body.rotation.x = Math.sin(phase * 2) * 0.02;
  } else if (working) {
    parts.body.position.y = Math.sin(phase * 1.4) * 0.012;
    parts.body.rotation.z = Math.sin(phase * 0.9) * 0.015;
    parts.body.rotation.x = -0.04 + Math.sin(phase * 2.2) * 0.02;
  } else {
    parts.body.position.y = Math.sin(phase * 0.75) * 0.014;
    parts.body.rotation.z = Math.sin(phase * 0.55) * 0.012;
    parts.body.rotation.x = 0;
  }
  void dt;
}
