import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { RoomDef } from './mockOffice';
import { clayMaterial, thumbprintDisplace } from './clayMaterial';

interface RoomProps {
  room: RoomDef;
  selected: boolean;
  onSelect: (roomId: string) => void;
}

export function Room({ room, selected, onSelect }: RoomProps) {
  const [w, d] = room.size;
  const wallH = 1.15;

  const floorGeo = useMemo(
    () => thumbprintDisplace(new THREE.BoxGeometry(w, 0.18, d, 6, 1, 6), 0.012, hash(room.id)),
    [w, d, room.id],
  );

  const wallMat = useMemo(() => clayMaterial(shade(room.color, 1.08)), [room.color]);
  const floorMat = useMemo(() => clayMaterial(room.color, { roughness: 0.96 }), [room.color]);
  const trimMat = useMemo(() => clayMaterial('#8b5e3c'), []);

  return (
    <group
      position={room.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(room.id);
      }}
    >
      {/* Floor slab */}
      <mesh
        geometry={floorGeo}
        material={floorMat}
        position={[0, 0.09, 0]}
        receiveShadow
        castShadow
      />

      {/* Low diorama walls (open toward hallway / center) */}
      <Wall width={w} height={wallH} material={wallMat} position={[0, wallH / 2, -d / 2]} />
      <Wall
        width={0.18}
        height={wallH}
        depth={d}
        material={wallMat}
        position={[-w / 2, wallH / 2, 0]}
      />
      <Wall
        width={0.18}
        height={wallH}
        depth={d * 0.35}
        material={wallMat}
        position={[w / 2, wallH / 2, -d * 0.3]}
      />

      {/* Baseboard trim */}
      <mesh position={[0, 0.2, -d / 2 + 0.05]} castShadow>
        <boxGeometry args={[w * 0.96, 0.12, 0.08]} />
        <primitive object={trimMat} attach="material" />
      </mesh>

      {selected && (
        <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.min(w, d) * 0.35, Math.min(w, d) * 0.4, 40]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.55} />
        </mesh>
      )}

      <Html position={[0, wallH + 0.35, -d / 2 + 0.2]} center distanceFactor={18}>
        <div
          style={{
            color: selected ? '#ec4899' : '#F4F3EF',
            font: '700 12px "Segoe UI", system-ui, sans-serif',
            letterSpacing: 0.4,
            textShadow: '0 2px 8px rgba(0,0,0,0.65)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
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
  depth = 0.16,
  material,
  position,
}: {
  width: number;
  height: number;
  depth?: number;
  material: THREE.Material;
  position: [number, number, number];
}) {
  const geo = useMemo(
    () => thumbprintDisplace(new THREE.BoxGeometry(width, height, depth, 4, 3, 1), 0.016, width + height),
    [width, height, depth],
  );
  return <mesh geometry={geo} material={material} position={position} castShadow receiveShadow />;
}

function RoomFurniture({ roomId, size }: { roomId: string; size: [number, number] }) {
  const [w, d] = size;
  switch (roomId) {
    case 'corner-office':
      return (
        <group>
          <Desk position={[-0.6, 0, 0.4]} />
          <Chair position={[-0.6, 0, 1.15]} />
          {/* Window ledge overlooking floor */}
          <mesh position={[0, 0.9, d / 2 - 0.2]} castShadow>
            <boxGeometry args={[w * 0.7, 0.7, 0.12]} />
            <meshStandardMaterial color="#87b8d8" transparent opacity={0.35} roughness={0.2} />
          </mesh>
          <Plant position={[w / 2 - 0.7, 0, -d / 2 + 0.7]} />
        </group>
      );
    case 'catalog':
      return (
        <group>
          <Desk position={[0.4, 0, 0.3]} />
          <Chair position={[0.4, 0, 1.05]} />
          <ShelfWall position={[-w / 2 + 0.45, 0, 0]} depth={d * 0.75} />
          <ShelfWall position={[w / 2 - 0.45, 0, -0.3]} depth={d * 0.55} />
        </group>
      );
    case 'screening':
      return (
        <group>
          {/* Large monitor */}
          <mesh position={[0, 1.1, -d / 2 + 0.35]} castShadow>
            <boxGeometry args={[2.4, 1.4, 0.14]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.1, -d / 2 + 0.43]}>
            <planeGeometry args={[2.1, 1.15]} />
            <meshStandardMaterial color="#312e81" emissive="#6366f1" emissiveIntensity={0.35} />
          </mesh>
          {/* Storyboard wall tiles */}
          {[-1.2, -0.4, 0.4, 1.2].map((x, i) => (
            <mesh key={i} position={[x, 0.85, -d / 2 + 0.2]} castShadow>
              <boxGeometry args={[0.55, 0.4, 0.06]} />
              <meshStandardMaterial color={i % 2 ? '#fde68a' : '#fecdd3'} roughness={0.95} flatShading />
            </mesh>
          ))}
          <Chair position={[0, 0, 0.8]} />
        </group>
      );
    case 'recording':
      return (
        <group>
          {/* Mixing board */}
          <mesh position={[0.3, 0.45, 0.2]} castShadow receiveShadow>
            <boxGeometry args={[2.2, 0.25, 0.9]} />
            <meshStandardMaterial color="#334155" roughness={0.7} flatShading />
          </mesh>
          {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
            <mesh key={i} position={[x + 0.3, 0.62, 0.15]}>
              <cylinderGeometry args={[0.06, 0.06, 0.08, 8]} />
              <meshStandardMaterial color="#ec4899" roughness={0.5} />
            </mesh>
          ))}
          {/* Booth */}
          <mesh position={[-w / 2 + 1.1, 0.85, -0.6]} castShadow>
            <boxGeometry args={[1.6, 1.5, 1.4]} />
            <meshStandardMaterial color="#7c2d12" roughness={0.95} flatShading />
          </mesh>
          <mesh position={[-w / 2 + 1.1, 0.9, 0.05]}>
            <boxGeometry args={[1.2, 0.9, 0.08]} />
            <meshStandardMaterial color="#67e8f9" transparent opacity={0.4} roughness={0.15} />
          </mesh>
          <Chair position={[0.3, 0, 1.0]} />
        </group>
      );
    case 'war-room':
      return (
        <group>
          {/* Whiteboard */}
          <mesh position={[0, 1.05, -d / 2 + 0.25]} castShadow>
            <boxGeometry args={[2.6, 1.3, 0.1]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.85} flatShading />
          </mesh>
          {/* Social numbers screen */}
          <mesh position={[w / 2 - 0.7, 1.0, 0]} castShadow>
            <boxGeometry args={[0.12, 1.5, 2.0]} />
            <meshStandardMaterial color="#0f172a" roughness={0.35} />
          </mesh>
          <mesh position={[w / 2 - 0.78, 1.0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[1.7, 1.25]} />
            <meshStandardMaterial color="#042f2e" emissive="#14b8a6" emissiveIntensity={0.4} />
          </mesh>
          <Desk position={[-0.4, 0, 0.5]} width={1.6} />
          <Chair position={[-0.4, 0, 1.25]} />
        </group>
      );
    default:
      return null;
  }
}

function Desk({
  position,
  width = 1.4,
}: {
  position: [number, number, number];
  width?: number;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.12, 0.75]} />
        <meshStandardMaterial color="#a67c52" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-width / 2 + 0.1, 0.28, 0.28]} castShadow>
        <boxGeometry args={[0.1, 0.55, 0.1]} />
        <meshStandardMaterial color="#7a5230" roughness={0.92} flatShading />
      </mesh>
      <mesh position={[width / 2 - 0.1, 0.28, 0.28]} castShadow>
        <boxGeometry args={[0.1, 0.55, 0.1]} />
        <meshStandardMaterial color="#7a5230" roughness={0.92} flatShading />
      </mesh>
      <mesh position={[-width / 2 + 0.1, 0.28, -0.28]} castShadow>
        <boxGeometry args={[0.1, 0.55, 0.1]} />
        <meshStandardMaterial color="#7a5230" roughness={0.92} flatShading />
      </mesh>
      <mesh position={[width / 2 - 0.1, 0.28, -0.28]} castShadow>
        <boxGeometry args={[0.1, 0.55, 0.1]} />
        <meshStandardMaterial color="#7a5230" roughness={0.92} flatShading />
      </mesh>
      {/* Tiny clay monitor */}
      <mesh position={[0.25, 0.85, -0.1]} castShadow>
        <boxGeometry args={[0.55, 0.4, 0.06]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Chair({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.24, 0.1, 10]} />
        <meshStandardMaterial color="#334155" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 0.55, -0.16]} castShadow>
        <boxGeometry args={[0.4, 0.45, 0.08]} />
        <meshStandardMaterial color="#475569" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 0.35, 8]} />
        <meshStandardMaterial color="#b45309" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.28, 8, 6]} />
        <meshStandardMaterial color="#166534" roughness={0.95} flatShading />
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
  return (
    <group position={position}>
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.35, 1.5, depth]} />
        <meshStandardMaterial color="#92400e" roughness={0.92} flatShading />
      </mesh>
      {[-0.4, 0, 0.4].map((z, i) => (
        <mesh key={i} position={[0.12, 0.55 + (i % 3) * 0.35, z]} castShadow>
          <boxGeometry args={[0.18, 0.28, 0.14]} />
          <meshStandardMaterial
            color={['#f472b6', '#38bdf8', '#fbbf24', '#a3e635'][i % 4]}
            roughness={0.9}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

function shade(hex: string, factor: number): string {
  const c = new THREE.Color(hex);
  c.multiplyScalar(factor);
  return `#${c.getHexString()}`;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
