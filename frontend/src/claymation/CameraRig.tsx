import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';

interface CameraRigProps {
  focusTarget: [number, number, number] | null;
}

/**
 * High-angle isometric-ish orbit: zoom + pan enabled.
 * When focusTarget changes, eases the orbit target toward it.
 */
export function CameraRig({ focusTarget }: CameraRigProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const desired = useRef(new THREE.Vector3(0, 0, 0));
  const hasFocus = useRef(false);

  useEffect(() => {
    if (!focusTarget) return;
    desired.current.set(focusTarget[0], focusTarget[1], focusTarget[2]);
    hasFocus.current = true;
  }, [focusTarget]);

  useFrame(() => {
    const c = controls.current;
    if (!c || !hasFocus.current) return;
    c.target.lerp(desired.current, 0.08);
    // Nudge camera a bit closer when focusing a subject
    const offset = new THREE.Vector3().subVectors(camera.position, c.target);
    const dist = offset.length();
    const ideal = 14;
    if (Math.abs(dist - ideal) > 0.05) {
      offset.setLength(THREE.MathUtils.lerp(dist, ideal, 0.06));
      camera.position.copy(c.target).add(offset);
    }
    c.update();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan
      enableZoom
      minDistance={8}
      maxDistance={32}
      maxPolarAngle={Math.PI / 2.35}
      minPolarAngle={Math.PI / 5}
      target={[0, 0.4, 0]}
    />
  );
}

/** Place the initial high-angle isometric camera. */
export function InitialCamera() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(16, 14, 16);
    camera.lookAt(0, 0.4, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}
