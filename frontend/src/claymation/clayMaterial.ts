import * as THREE from 'three';

/** Matte clay look — soft, slightly chalky, no metal. */
export function clayMaterial(
  color: string | number,
  opts: { roughness?: number; flat?: boolean } = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.92,
    metalness: 0.02,
    flatShading: opts.flat ?? true,
  });
}

/** Nudge vertices for handmade imperfect edges. */
export function thumbprintDisplace(
  geometry: THREE.BufferGeometry,
  amount = 0.018,
  seed = 1,
): THREE.BufferGeometry {
  const pos = geometry.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = pseudoNoise(v.x * 7.1 + seed, v.y * 5.3 + seed, v.z * 9.7 + seed);
    const m = pseudoNoise(v.z * 3.2 + seed, v.x * 4.1, v.y * 6.6);
    v.x += (n - 0.5) * amount;
    v.y += (m - 0.5) * amount * 0.7;
    v.z += (n * m - 0.25) * amount;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function pseudoNoise(x: number, y: number, z: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
}
