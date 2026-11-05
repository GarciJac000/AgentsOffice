import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { AgentDef, AgentStatus } from './mockOffice';
import { STATUS_META } from './mockOffice';
import { mats, surface } from './materials';

interface AgentProps {
  agent: AgentDef;
  position: [number, number, number];
  selected: boolean;
  onSelect: (id: string) => void;
}

/**
 * Stylized game character — readable at isometric distance with layered
 * clothing, better proportions, hair mass, and shoe detail.
 */
export function Agent({ agent, position, selected, onSelect }: AgentProps) {
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);

  const materials = useMemo(
    () => ({
      // Solid PBR colors (no albedo maps) so outfits stay saturated at iso distance
      skin: mats.skin(agent.skin),
      hair: mats.hair(agent.hair),
      shirt: solidCloth(shade(agent.outfit, 1.25)),
      jacket: solidCloth(agent.outfit),
      pants: solidCloth(shade(agent.outfit, 0.45)),
      shoe: mats.plastic('#0a0a0a'),
      sole: mats.plastic('#1f1f1f'),
      accent: mats.plastic(agent.accent),
    }),
    [agent.skin, agent.hair, agent.outfit, agent.accent],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const g = root.current;
    if (!g) return;
    animateStatus(agent.status, t, {
      root: g,
      torso: torso.current,
      leftArm: leftArm.current,
      rightArm: rightArm.current,
      head: head.current,
      baseY: selected ? 0.03 : 0,
    });
  });

  const meta = STATUS_META[agent.status];

  return (
    <group
      position={position}
      scale={1.12}
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
      {/* Legs + pants */}
      <mesh position={[-0.12, 0.38, 0]} castShadow material={materials.pants}>
        <capsuleGeometry args={[0.085, 0.42, 8, 16]} />
      </mesh>
      <mesh position={[0.12, 0.38, 0]} castShadow material={materials.pants}>
        <capsuleGeometry args={[0.085, 0.42, 8, 16]} />
      </mesh>

      {/* Shoes */}
      <group position={[-0.12, 0.06, 0.04]}>
        <mesh castShadow material={materials.shoe}>
          <boxGeometry args={[0.15, 0.08, 0.28]} />
        </mesh>
        <mesh position={[0, -0.04, 0.02]} material={materials.sole}>
          <boxGeometry args={[0.16, 0.03, 0.3]} />
        </mesh>
      </group>
      <group position={[0.12, 0.06, 0.04]}>
        <mesh castShadow material={materials.shoe}>
          <boxGeometry args={[0.15, 0.08, 0.28]} />
        </mesh>
        <mesh position={[0, -0.04, 0.02]} material={materials.sole}>
          <boxGeometry args={[0.16, 0.03, 0.3]} />
        </mesh>
      </group>

      {/* Hip / belt */}
      <mesh position={[0, 0.62, 0]} castShadow material={materials.pants}>
        <cylinderGeometry args={[0.22, 0.24, 0.14, 20]} />
      </mesh>
      <mesh position={[0, 0.68, 0.0]} material={materials.accent}>
        <torusGeometry args={[0.23, 0.018, 8, 24]} />
      </mesh>

      <group ref={torso} position={[0, 0.95, 0]}>
        {/* Undershirt */}
        <mesh castShadow material={materials.shirt}>
          <capsuleGeometry args={[0.22, 0.38, 8, 20]} />
        </mesh>
        {/* Jacket / outer layer — slightly larger, open at collar */}
        <mesh position={[0, 0.02, 0]} castShadow material={materials.jacket} scale={[1.08, 1.02, 1.1]}>
          <capsuleGeometry args={[0.22, 0.34, 8, 20]} />
        </mesh>
        {/* Lapel folds */}
        <mesh position={[-0.12, 0.12, 0.18]} rotation={[0.2, 0.4, 0.15]} material={materials.jacket}>
          <boxGeometry args={[0.1, 0.28, 0.03]} />
        </mesh>
        <mesh position={[0.12, 0.12, 0.18]} rotation={[0.2, -0.4, -0.15]} material={materials.jacket}>
          <boxGeometry args={[0.1, 0.28, 0.03]} />
        </mesh>
        {/* Collar */}
        <mesh position={[0, 0.32, 0.05]} castShadow material={materials.shirt}>
          <torusGeometry args={[0.12, 0.035, 8, 16, Math.PI]} />
        </mesh>
      </group>

      {/* Neck */}
      <mesh position={[0, 1.28, 0]} castShadow material={materials.skin}>
        <cylinderGeometry args={[0.07, 0.08, 0.12, 16]} />
      </mesh>

      <group ref={head} position={[0, 1.48, 0]}>
        <mesh castShadow material={materials.skin}>
          <sphereGeometry args={[0.2, 32, 24]} />
        </mesh>
        {/* Ears */}
        <mesh position={[-0.19, 0, 0]} castShadow material={materials.skin}>
          <sphereGeometry args={[0.045, 12, 10]} />
        </mesh>
        <mesh position={[0.19, 0, 0]} castShadow material={materials.skin}>
          <sphereGeometry args={[0.045, 12, 10]} />
        </mesh>
        {/* Hair mass + fringe */}
        <mesh position={[0, 0.08, -0.02]} scale={[1.05, 0.72, 1.08]} castShadow material={materials.hair}>
          <sphereGeometry args={[0.21, 24, 16]} />
        </mesh>
        <mesh position={[0, 0.12, 0.12]} scale={[0.9, 0.35, 0.45]} material={materials.hair}>
          <sphereGeometry args={[0.16, 16, 12]} />
        </mesh>
        <mesh position={[-0.12, 0.05, -0.12]} scale={[0.45, 0.55, 0.4]} material={materials.hair}>
          <sphereGeometry args={[0.14, 12, 10]} />
        </mesh>
        <mesh position={[0.12, 0.05, -0.12]} scale={[0.45, 0.55, 0.4]} material={materials.hair}>
          <sphereGeometry args={[0.14, 12, 10]} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.07, 0.02, 0.17]}>
          <sphereGeometry args={[0.028, 12, 12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.25} metalness={0.15} />
        </mesh>
        <mesh position={[0.07, 0.02, 0.17]}>
          <sphereGeometry args={[0.028, 12, 12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.25} metalness={0.15} />
        </mesh>
        <mesh position={[-0.065, 0.028, 0.19]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.15} />
        </mesh>
        <mesh position={[0.075, 0.028, 0.19]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.15} />
        </mesh>
      </group>

      {/* Arms */}
      <group ref={leftArm} position={[-0.34, 1.12, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow material={materials.jacket}>
          <capsuleGeometry args={[0.07, 0.28, 6, 14]} />
        </mesh>
        <mesh position={[0, -0.42, 0]} castShadow material={materials.skin}>
          <sphereGeometry args={[0.065, 14, 12]} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.34, 1.12, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow material={materials.jacket}>
          <capsuleGeometry args={[0.07, 0.28, 6, 14]} />
        </mesh>
        <mesh position={[0, -0.42, 0]} castShadow material={materials.skin}>
          <sphereGeometry args={[0.065, 14, 12]} />
        </mesh>
      </group>

      <Html position={[0, 2.05, 0]} center distanceFactor={13} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            background: selected ? 'rgba(8,10,14,0.96)' : 'rgba(10,12,16,0.88)',
            color: '#e8eaed',
            border: `1px solid ${selected ? '#ec4899' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 8,
            padding: '5px 10px',
            fontFamily: '"Segoe UI", system-ui, sans-serif',
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: 0.02,
            boxShadow: '0 10px 28px rgba(0,0,0,0.45)',
            whiteSpace: 'nowrap',
            display: 'flex',
            gap: 7,
            alignItems: 'center',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: meta.color,
              boxShadow: `0 0 10px ${meta.color}`,
            }}
          />
          <span style={{ fontWeight: 700 }}>{agent.name}</span>
          <span style={{ opacity: 0.5, fontWeight: 500 }}>{meta.label}</span>
        </div>
      </Html>

      {selected && (
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.52, 64]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.95} />
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
  if (leftArm) leftArm.rotation.set(0, 0, 0.12);
  if (rightArm) rightArm.rotation.set(0, 0, -0.12);
  if (head) head.rotation.set(0, 0, 0);

  switch (status) {
    case 'working': {
      const tap = (Math.sin(t * 9) + 1) * 0.5;
      if (rightArm) rightArm.rotation.x = THREE.MathUtils.lerp(0.2, 0.85, tap);
      if (leftArm) leftArm.rotation.x = THREE.MathUtils.lerp(0.15, 0.55, 1 - tap);
      if (torso) torso.rotation.x = 0.14;
      if (head) head.rotation.x = 0.18 + Math.sin(t * 1.4) * 0.03;
      root.position.y = baseY + Math.sin(t * 3.5) * 0.008;
      break;
    }
    case 'idle': {
      root.rotation.y = Math.sin(t * 0.7) * 0.1;
      if (leftArm) leftArm.rotation.z = 0.2 + Math.sin(t * 1.2) * 0.12;
      if (rightArm) rightArm.rotation.z = -0.18 + Math.sin(t * 1.0 + 1) * 0.08;
      if (head) head.rotation.y = Math.sin(t * 0.85) * 0.2;
      root.position.y = baseY + Math.sin(t * 1.5) * 0.012;
      break;
    }
    case 'blocked': {
      root.position.x = Math.sin(t * 1.5) * 0.28;
      root.rotation.y = Math.sin(t * 1.5) * 0.5;
      if (leftArm) leftArm.rotation.x = Math.sin(t * 3) * 0.4;
      if (rightArm) rightArm.rotation.x = -Math.sin(t * 3) * 0.4;
      break;
    }
    case 'done': {
      const pulse = (Math.sin(t * 2.0) + 1) * 0.5;
      const up = THREE.MathUtils.lerp(0.25, 0.95, pulse);
      if (leftArm) {
        leftArm.rotation.z = up;
        leftArm.rotation.x = -0.2;
      }
      if (rightArm) {
        rightArm.rotation.z = -up;
        rightArm.rotation.x = -0.2;
      }
      if (head) head.rotation.x = -0.06;
      root.position.y = baseY + pulse * 0.035;
      break;
    }
  }
}

function solidCloth(hex: string) {
  return surface(hex, { roughness: 0.82, metalness: 0.02, envMapIntensity: 0.4 });
}

function shade(hex: string, factor: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * factor)));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * factor)));
  const b = Math.min(255, Math.max(0, Math.round((n & 255) * factor)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
