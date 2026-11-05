import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { AgentDef, AgentStatus } from './mockOffice';
import { STATUS_META } from './mockOffice';
import { clayMaterial, thumbprintDisplace } from './clayMaterial';
import { readStopMotionTime } from './StopMotion';

interface ClayAgentProps {
  agent: AgentDef;
  position: [number, number, number];
  selected: boolean;
  onSelect: (id: string) => void;
}

export function ClayAgent({ agent, position, selected, onSelect }: ClayAgentProps) {
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);

  const geos = useMemo(() => {
    const body = thumbprintDisplace(new THREE.CapsuleGeometry(0.28, 0.55, 4, 8), 0.022, 2);
    const headGeo = thumbprintDisplace(new THREE.SphereGeometry(0.26, 10, 8), 0.02, 3);
    const limb = thumbprintDisplace(new THREE.CapsuleGeometry(0.09, 0.32, 3, 6), 0.014, 4);
    const hair = thumbprintDisplace(new THREE.SphereGeometry(0.28, 8, 6), 0.025, 5);
    return { body, headGeo, limb, hair };
  }, []);

  const mats = useMemo(
    () => ({
      skin: clayMaterial(agent.skin),
      hair: clayMaterial(agent.hair, { roughness: 0.95 }),
      outfit: clayMaterial(agent.outfit),
    }),
    [agent.skin, agent.hair, agent.outfit],
  );

  useFrame((state) => {
    const t = readStopMotionTime(state as never);
    const g = root.current;
    if (!g) return;

    // Soft selection bob
    const baseY = selected ? 0.06 : 0;
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
      {/* Ground blob shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[0.42, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} depthWrite={false} />
      </mesh>

      <group ref={torso} position={[0, 0.55, 0]}>
        <mesh geometry={geos.body} material={mats.outfit} castShadow receiveShadow />
        {/* Collar lump */}
        <mesh position={[0, 0.38, 0.05]} material={mats.outfit} castShadow>
          <sphereGeometry args={[0.2, 8, 6]} />
        </mesh>
      </group>

      <group ref={head} position={[0, 1.22, 0]}>
        <mesh geometry={geos.headGeo} material={mats.skin} castShadow />
        <mesh
          geometry={geos.hair}
          material={mats.hair}
          position={[0, 0.12, -0.02]}
          scale={[1.05, 0.7, 1.05]}
          castShadow
        />
        {/* Eyes — pressed clay dots */}
        <mesh position={[-0.09, 0.02, 0.2]}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
        </mesh>
        <mesh position={[0.09, 0.02, 0.2]}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
        </mesh>
      </group>

      <group ref={leftArm} position={[-0.38, 0.85, 0]}>
        <mesh geometry={geos.limb} material={mats.skin} position={[0, -0.2, 0]} castShadow />
      </group>
      <group ref={rightArm} position={[0.38, 0.85, 0]}>
        <mesh geometry={geos.limb} material={mats.skin} position={[0, -0.2, 0]} castShadow />
      </group>

      {/* Legs */}
      <mesh position={[-0.14, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.28, 3, 6]} />
        <meshStandardMaterial color={agent.outfit} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.14, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.28, 3, 6]} />
        <meshStandardMaterial color={agent.outfit} roughness={0.9} flatShading />
      </mesh>

      {/* Status bubble */}
      <Html position={[0, 1.85, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            background: selected ? '#0B0C0E' : 'rgba(11,12,14,0.92)',
            color: meta.color,
            border: `2px solid ${selected ? '#ec4899' : meta.color}`,
            borderRadius: 14,
            padding: '6px 10px',
            fontFamily: '"Segoe UI", system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 13,
            boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
            whiteSpace: 'nowrap',
            transform: 'scale(1)',
            display: 'flex',
            gap: 6,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: 6,
              background: meta.color,
              color: '#0B0C0E',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
            }}
          >
            {meta.icon}
          </span>
          {agent.name}
        </div>
      </Html>

      {selected && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.68, 28]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.85} />
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

  // Reset soft
  root.position.y = baseY;
  root.rotation.y = 0;
  if (torso) torso.rotation.set(0, 0, 0);
  if (leftArm) leftArm.rotation.set(0, 0, 0);
  if (rightArm) rightArm.rotation.set(0, 0, 0);
  if (head) head.rotation.set(0, 0, 0);

  switch (status) {
    case 'working': {
      // Typing — arms pump, slight torso lean
      const tap = Math.sin(t * 10) > 0 ? 0.35 : -0.1;
      if (rightArm) rightArm.rotation.x = tap;
      if (leftArm) leftArm.rotation.x = tap * 0.6;
      if (torso) torso.rotation.x = 0.12;
      if (head) head.rotation.x = 0.15;
      root.position.y = baseY + (Math.sin(t * 6) > 0 ? 0.02 : 0);
      break;
    }
    case 'idle': {
      // Stretch / sway
      root.rotation.y = Math.sin(t * 1.4) * 0.18;
      if (leftArm) leftArm.rotation.z = 0.4 + Math.sin(t * 2) * 0.25;
      if (rightArm) rightArm.rotation.z = -0.25;
      if (head) head.rotation.y = Math.sin(t * 1.2) * 0.2;
      break;
    }
    case 'blocked': {
      // Pace left-right
      root.position.x = Math.sin(t * 2.2) * 0.35;
      root.rotation.y = Math.sin(t * 2.2) > 0 ? 0.4 : -0.4;
      if (leftArm) leftArm.rotation.x = Math.sin(t * 4) * 0.4;
      if (rightArm) rightArm.rotation.x = -Math.sin(t * 4) * 0.4;
      break;
    }
    case 'done': {
      // Satisfied stretch / arms up pulse
      const up = Math.sin(t * 3) > 0.2 ? 1.1 : 0.2;
      if (leftArm) {
        leftArm.rotation.z = up;
        leftArm.rotation.x = -0.3;
      }
      if (rightArm) {
        rightArm.rotation.z = -up;
        rightArm.rotation.x = -0.3;
      }
      if (head) head.rotation.x = -0.1;
      root.position.y = baseY + (Math.sin(t * 3) > 0 ? 0.05 : 0);
      break;
    }
  }
}
