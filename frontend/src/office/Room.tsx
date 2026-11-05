import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { Material } from 'three';
import type { RoomDef } from './mockOffice';
import { mats, surface } from './materials';

interface RoomProps {
  room: RoomDef;
  selected: boolean;
  onSelect: (roomId: string) => void;
}

export function Room({ room, selected, onSelect }: RoomProps) {
  const [w, d] = room.size;
  const wallH = 1.35;

  const wallMat = useMemo(() => mats.paint(shade(room.color, 1.15)), [room.color]);
  const floorMat = useMemo(() => mats.floor(shade(room.color, 0.72)), [room.color]);
  const trimMat = useMemo(() => mats.wood('#5c4030'), []);

  return (
    <group
      position={room.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(room.id);
      }}
    >
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow material={floorMat}>
        <boxGeometry args={[w, 0.12, d]} />
      </mesh>

      <mesh position={[0, 0.125, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w * 0.98, d * 0.98]} />
        <meshStandardMaterial
          color={shade(room.color, 0.85)}
          roughness={0.35}
          metalness={0.08}
          transparent
          opacity={0.55}
        />
      </mesh>

      <Wall width={w} height={wallH} material={wallMat} position={[0, wallH / 2 + 0.12, -d / 2]} />
      <Wall
        width={0.12}
        height={wallH}
        depth={d}
        material={wallMat}
        position={[-w / 2, wallH / 2 + 0.12, 0]}
      />
      <Wall
        width={0.12}
        height={wallH}
        depth={d * 0.38}
        material={wallMat}
        position={[w / 2, wallH / 2 + 0.12, -d * 0.28]}
      />

      <mesh position={[0, 0.18, -d / 2 + 0.04]} castShadow material={trimMat}>
        <boxGeometry args={[w * 0.98, 0.08, 0.06]} />
      </mesh>

      {selected && (
        <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.min(w, d) * 0.32, Math.min(w, d) * 0.38, 48]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.5} />
        </mesh>
      )}

      <Html position={[0, wallH + 0.45, -d / 2 + 0.15]} center distanceFactor={18}>
        <div
          style={{
            color: selected ? '#f9a8d4' : '#e8eaed',
            font: '650 11px "Segoe UI", system-ui, sans-serif',
            letterSpacing: 0.08,
            textTransform: 'uppercase',
            textShadow: '0 2px 10px rgba(0,0,0,0.75)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            opacity: 0.9,
          }}
        >
          {room.name}
        </div>
      </Html>

      <RoomFurniture roomId={room.id} size={room.size} />
    </group>
  );
}

function Wall({
  width,
  height,
  depth = 0.12,
  material,
  position,
}: {
  width: number;
  height: number;
  depth?: number;
  material: Material;
  position: [number, number, number];
}) {
  return (
    <mesh material={material} position={position} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
    </mesh>
  );
}

function RoomFurniture({ roomId, size }: { roomId: string; size: [number, number] }) {
  const [w, d] = size;
  switch (roomId) {
    case 'corner-office':
      return (
        <group>
          <Desk position={[-0.6, 0, 0.4]} />
          <Chair position={[-0.6, 0, 1.15]} />
          <mesh position={[0, 0.95, d / 2 - 0.18]} castShadow>
            <boxGeometry args={[w * 0.72, 0.85, 0.06]} />
            <primitive object={mats.glass('#a8d4f0')} attach="material" />
          </mesh>
          <mesh position={[0, 0.5, d / 2 - 0.22]} castShadow material={mats.metal('#64748b')}>
            <boxGeometry args={[w * 0.74, 0.06, 0.08]} />
          </mesh>
          <Plant position={[w / 2 - 0.7, 0, -d / 2 + 0.7]} />
        </group>
      );
    case 'catalog':
      return (
        <group>
          <Desk position={[0.4, 0, 0.3]} />
          <Chair position={[0.4, 0, 1.05]} />
          <ShelfWall position={[-w / 2 + 0.4, 0, 0]} depth={d * 0.75} />
          <ShelfWall position={[w / 2 - 0.4, 0, -0.3]} depth={d * 0.55} />
        </group>
      );
    case 'screening':
      return (
        <group>
          <mesh position={[0, 1.15, -d / 2 + 0.32]} castShadow material={mats.metal('#1e293b')}>
            <boxGeometry args={[2.5, 1.45, 0.1]} />
          </mesh>
          <mesh position={[0, 1.15, -d / 2 + 0.38]}>
            <planeGeometry args={[2.2, 1.2]} />
            <meshStandardMaterial
              color="#0f172a"
              emissive="#6366f1"
              emissiveIntensity={0.9}
              roughness={0.25}
              metalness={0.2}
            />
          </mesh>
          {[-1.15, -0.4, 0.35, 1.1].map((x, i) => (
            <mesh
              key={i}
              position={[x, 0.9, -d / 2 + 0.18]}
              castShadow
              material={mats.plastic(i % 2 ? '#fef3c7' : '#fce7f3')}
            >
              <boxGeometry args={[0.5, 0.36, 0.04]} />
            </mesh>
          ))}
          <Chair position={[0, 0, 0.85]} />
        </group>
      );
    case 'recording':
      return (
        <group>
          <mesh
            position={[0.3, 0.48, 0.2]}
            castShadow
            receiveShadow
            material={mats.metal('#1f2937')}
          >
            <boxGeometry args={[2.3, 0.22, 0.95]} />
          </mesh>
          {[-0.7, -0.25, 0.2, 0.65].map((x, i) => (
            <mesh key={i} position={[x + 0.3, 0.64, 0.12]} material={mats.plastic('#ec4899')}>
              <cylinderGeometry args={[0.05, 0.05, 0.07, 16]} />
            </mesh>
          ))}
          <mesh
            position={[-w / 2 + 1.1, 0.9, -0.55]}
            castShadow
            material={mats.fabric('#7f1d1d')}
          >
            <boxGeometry args={[1.55, 1.55, 1.35]} />
          </mesh>
          <mesh position={[-w / 2 + 1.1, 0.95, 0.08]}>
            <boxGeometry args={[1.15, 0.95, 0.05]} />
            <primitive object={mats.glass('#67e8f9')} attach="material" />
          </mesh>
          <Chair position={[0.3, 0, 1.0]} />
        </group>
      );
    case 'war-room':
      return (
        <group>
          <mesh
            position={[0, 1.1, -d / 2 + 0.22]}
            castShadow
            material={surface('#f8fafc', { roughness: 0.55 })}
          >
            <boxGeometry args={[2.7, 1.35, 0.08]} />
          </mesh>
          <mesh position={[w / 2 - 0.65, 1.05, 0]} castShadow material={mats.metal('#0f172a')}>
            <boxGeometry args={[0.1, 1.55, 2.05]} />
          </mesh>
          <mesh position={[w / 2 - 0.72, 1.05, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[1.75, 1.3]} />
            <meshStandardMaterial
              color="#042f2e"
              emissive="#14b8a6"
              emissiveIntensity={0.95}
              roughness={0.3}
              metalness={0.25}
            />
          </mesh>
          <Desk position={[-0.4, 0, 0.5]} width={1.65} />
          <Chair position={[-0.4, 0, 1.25]} />
        </group>
      );
    default:
      return null;
  }
}

function Desk({
  position,
  width = 1.45,
}: {
  position: [number, number, number];
  width?: number;
}) {
  const wood = useMemo(() => mats.wood('#8b5e3c'), []);
  const leg = useMemo(() => mats.metal('#475569'), []);
  return (
    <group position={position}>
      <mesh position={[0, 0.58, 0]} castShadow receiveShadow material={wood}>
        <boxGeometry args={[width, 0.06, 0.78]} />
      </mesh>
      {[
        [-width / 2 + 0.08, 0.28, 0.3],
        [width / 2 - 0.08, 0.28, 0.3],
        [-width / 2 + 0.08, 0.28, -0.3],
        [width / 2 - 0.08, 0.28, -0.3],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow material={leg}>
          <cylinderGeometry args={[0.035, 0.04, 0.56, 12]} />
        </mesh>
      ))}
      <mesh position={[0.28, 0.88, -0.08]} castShadow material={mats.metal('#111827')}>
        <boxGeometry args={[0.58, 0.38, 0.05]} />
      </mesh>
      <mesh position={[0.28, 0.88, -0.05]}>
        <planeGeometry args={[0.5, 0.3]} />
        <meshStandardMaterial
          color="#0b1220"
          emissive="#38bdf8"
          emissiveIntensity={0.55}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

function Chair({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.34, 0]} castShadow material={mats.fabric('#334155')}>
        <cylinderGeometry args={[0.2, 0.22, 0.08, 20]} />
      </mesh>
      <mesh position={[0, 0.58, -0.14]} castShadow material={mats.fabric('#475569')}>
        <boxGeometry args={[0.38, 0.42, 0.06]} />
      </mesh>
      <mesh position={[0, 0.18, 0]} castShadow material={mats.metal('#64748b')}>
        <cylinderGeometry args={[0.03, 0.03, 0.28, 10]} />
      </mesh>
    </group>
  );
}

function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.22, 0]} castShadow material={mats.plastic('#78716c')}>
        <cylinderGeometry args={[0.14, 0.18, 0.38, 16]} />
      </mesh>
      <mesh position={[0, 0.58, 0]} castShadow material={mats.fabric('#15803d')}>
        <sphereGeometry args={[0.26, 16, 12]} />
      </mesh>
    </group>
  );
}

function ShelfWall({
  position,
  depth,
}: {
  position: [number, number, number];
  depth: number;
}) {
  const colors = ['#f472b6', '#38bdf8', '#fbbf24', '#a3e635', '#c084fc'];
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow material={mats.wood('#7c4a28')}>
        <boxGeometry args={[0.32, 1.6, depth]} />
      </mesh>
      {[-0.45, -0.1, 0.25, 0.5].map((z, i) => (
        <mesh
          key={i}
          position={[0.12, 0.5 + (i % 4) * 0.28, z]}
          castShadow
          material={mats.plastic(colors[i % colors.length])}
        >
          <boxGeometry args={[0.16, 0.24, 0.12]} />
        </mesh>
      ))}
    </group>
  );
}

function shade(hex: string, factor: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const clamp = (v: number) => Math.min(1, Math.max(0, v * factor));
  const to = (v: number) =>
    Math.round(clamp(v) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}
