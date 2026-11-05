import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { AgentDef, AgentStatus } from './mockOffice';
import { STATUS_META } from './mockOffice';
import { mats } from './materials';

interface AgentProps {
  agent: AgentDef;
  position: [number, number, number];
  selected: boolean;
  onSelect: (id: string) => void;
}

/** Stylized but smooth game-character figure (capsule body, PBR materials). */
export function Agent({ agent, position, selected, onSelect }: AgentProps) {
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);

  const materials = useMemo(
    () => ({
      skin: mats.skin(agent.skin),
      hair: mats.hair(agent.hair),
      outfit: mats.fabric(agent.outfit),
      shoe: mats.plastic('#1a1a1a'),
    }),
    [agent.skin, agent.hair, agent.outfit],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const g = root.current;
    if (!g) return;
    const baseY = selected ? 0.04 : 0;
    animateStatus(agent.status, t, {
      root: g,
      torso: torso.current,
      leftArm: leftArm.current,
      rightArm: rightArm.current,
      head: head.current,
      baseY,
    });
  });

  const meta = STATUS_META[agent.status];

  return (
    <group
      position={position}
      ref={root}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(agent.id);
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <group ref={torso} position={[0, 0.58, 0]}>
        <mesh castShadow receiveShadow material={materials.outfit}>
          <capsuleGeometry args={[0.26, 0.52, 8, 16]} />
        </mesh>
        <mesh position={[0, 0.36, 0.02]} castShadow material={materials.outfit}>
          <sphereGeometry args={[0.18, 16, 12]} />
        </mesh>
      </group>

      <group ref={head} position={[0, 1.26, 0]}>
        <mesh castShadow material={materials.skin}>
          <sphereGeometry args={[0.24, 24, 18]} />
        </mesh>
        <mesh
          position={[0, 0.1, -0.02]}
          scale={[1.02, 0.65, 1.05]}
          castShadow
          material={materials.hair}
        >
          <sphereGeometry args={[0.26, 20, 14]} />
        </mesh>
        <mesh position={[-0.08, 0.02, 0.2]}>
          <sphereGeometry args={[0.032, 12, 12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.1} />
        </mesh>
        <mesh position={[0.08, 0.02, 0.2]}>
          <sphereGeometry args={[0.032, 12, 12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.1} />
        </mesh>
        <mesh position={[-0.08, 0.03, 0.225]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.2} />
        </mesh>
        <mesh position={[0.08, 0.03, 0.225]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.2} />
        </mesh>
      </group>

      <group ref={leftArm} position={[-0.36, 0.9, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow material={materials.skin}>
          <capsuleGeometry args={[0.075, 0.34, 6, 12]} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.36, 0.9, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow material={materials.skin}>
          <capsuleGeometry args={[0.075, 0.34, 6, 12]} />
        </mesh>
      </group>

      <mesh position={[-0.13, 0.24, 0]} castShadow material={materials.outfit}>
        <capsuleGeometry args={[0.09, 0.3, 6, 12]} />
      </mesh>
      <mesh position={[0.13, 0.24, 0]} castShadow material={materials.outfit}>
        <capsuleGeometry args={[0.09, 0.3, 6, 12]} />
      </mesh>
      <mesh position={[-0.13, 0.05, 0.04]} castShadow material={materials.shoe}>
        <boxGeometry args={[0.16, 0.08, 0.24]} />
      </mesh>
      <mesh position={[0.13, 0.05, 0.04]} castShadow material={materials.shoe}>
        <boxGeometry args={[0.16, 0.08, 0.24]} />
      </mesh>

      <Html position={[0, 1.9, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            background: selected ? 'rgba(8,10,14,0.95)' : 'rgba(12,14,18,0.88)',
            color: meta.color,
            border: `1px solid ${selected ? '#ec4899' : 'rgba(255,255,255,0.14)'}`,
            borderRadius: 10,
            padding: '5px 10px',
            fontFamily: '"Segoe UI", system-ui, sans-serif',
            fontWeight: 650,
            fontSize: 12,
            letterSpacing: 0.02,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
            display: 'flex',
            gap: 7,
            alignItems: 'center',
            backdropFilter: 'blur(6px)',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: meta.color,
              boxShadow: `0 0 8px ${meta.color}`,
            }}
          />
          {agent.name}
          <span style={{ opacity: 0.55, fontWeight: 500 }}>{meta.label}</span>
        </div>
      </Html>

      {selected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.62, 48]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}

function animateStatus(
  status: AgentStatus,
  t: number,
  parts: {
    root: THREE.Group;
    torso: THREE.Group | null;
    leftArm: THREE.Group | null;
    rightArm: THREE.Group | null;
    head: THREE.Group | null;
    baseY: number;
  },
) {
  const { root, torso, leftArm, rightArm, head, baseY } = parts;

  root.position.y = baseY;
  root.rotation.y = 0;
  if (torso) torso.rotation.set(0, 0, 0);
  if (leftArm) leftArm.rotation.set(0, 0, 0);
  if (rightArm) rightArm.rotation.set(0, 0, 0);
  if (head) head.rotation.set(0, 0, 0);

  switch (status) {
    case 'working': {
      const tap = (Math.sin(t * 9) + 1) * 0.5;
      if (rightArm) rightArm.rotation.x = THREE.MathUtils.lerp(-0.15, 0.45, tap);
      if (leftArm) leftArm.rotation.x = THREE.MathUtils.lerp(-0.05, 0.25, 1 - tap);
      if (torso) torso.rotation.x = 0.1;
      if (head) head.rotation.x = 0.12 + Math.sin(t * 1.5) * 0.03;
      root.position.y = baseY + Math.sin(t * 4) * 0.01;
      break;
    }
    case 'idle': {
      root.rotation.y = Math.sin(t * 0.8) * 0.12;
      if (leftArm) leftArm.rotation.z = 0.25 + Math.sin(t * 1.3) * 0.15;
      if (rightArm) rightArm.rotation.z = -0.2 + Math.sin(t * 1.1 + 1) * 0.08;
      if (head) head.rotation.y = Math.sin(t * 0.9) * 0.18;
      root.position.y = baseY + Math.sin(t * 1.6) * 0.015;
      break;
    }
    case 'blocked': {
      root.position.x = Math.sin(t * 1.6) * 0.32;
      root.rotation.y = Math.sin(t * 1.6) * 0.55;
      if (leftArm) leftArm.rotation.x = Math.sin(t * 3.2) * 0.35;
      if (rightArm) rightArm.rotation.x = -Math.sin(t * 3.2) * 0.35;
      break;
    }
    case 'done': {
      const pulse = (Math.sin(t * 2.2) + 1) * 0.5;
      const up = THREE.MathUtils.lerp(0.35, 1.05, pulse);
      if (leftArm) {
        leftArm.rotation.z = up;
        leftArm.rotation.x = -0.25;
      }
      if (rightArm) {
        rightArm.rotation.z = -up;
        rightArm.rotation.x = -0.25;
      }
      if (head) head.rotation.x = -0.08;
      root.position.y = baseY + pulse * 0.04;
      break;
    }
  }
}
