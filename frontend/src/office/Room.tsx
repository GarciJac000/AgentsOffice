import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { Material } from 'three';
import type { RoomDef } from './mockOffice';
import { mats } from './materials';

interface RoomProps {
  room: RoomDef;
  selected: boolean;
  onSelect: (roomId: string) => void;
}

export function Room({ room, selected, onSelect }: RoomProps) {
  const [w, d] = room.size;
  const wallH = 1.55;

  const wallMat = useMemo(() => mats.paint(shade(room.color, 1.18), [1.5, 1]), [room.color]);
  const floorMat = useMemo(() => mats.floor(shade(room.color, 0.55), [2.5, 2.5]), [room.color]);
  const trimMat = useMemo(() => mats.wood('#6b4423', [1, 0.2]), []);
  const ceilMat = useMemo(() => mats.paint('#3a3f4a', [1, 1]), []);

  return (
    <group
      position={room.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(room.id);
      }}
    >
      {/* Floor */}
      <mesh position={[0, 0.05, 0]} receiveShadow castShadow material={floorMat}>
        <boxGeometry args={[w, 0.1, d]} />
      </mesh>

      {/* Dark acoustic ceiling — depth without washing bloom */}
      <mesh position={[0, wallH + 0.18, -0.12]} material={ceilMat} castShadow>
        <boxGeometry args={[w * 0.92, 0.05, d * 0.62]} />
      </mesh>
      {/* Recessed ceiling light strips (emissive, small) */}
      <mesh position={[-w * 0.22, wallH + 0.14, -0.12]}>
        <boxGeometry args={[w * 0.28, 0.02, 0.08]} />
        <meshStandardMaterial
          color="#f8fafc"
          emissive="#fef3c7"
          emissiveIntensity={1.6}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[w * 0.22, wallH + 0.14, -0.12]}>
        <boxGeometry args={[w * 0.28, 0.02, 0.08]} />
        <meshStandardMaterial
          color="#f8fafc"
          emissive="#fef3c7"
          emissiveIntensity={1.6}
          roughness={0.3}
        />
      </mesh>

      <Wall width={w} height={wallH} material={wallMat} position={[0, wallH / 2 + 0.1, -d / 2]} />
      <Wall
        width={0.1}
        height={wallH}
        depth={d}
        material={wallMat}
        position={[-w / 2, wallH / 2 + 0.1, 0]}
      />
      <Wall
        width={0.1}
        height={wallH}
        depth={d * 0.4}
        material={wallMat}
        position={[w / 2, wallH / 2 + 0.1, -d * 0.28]}
      />

      {/* Baseboard + chair rail */}
      <mesh position={[0, 0.16, -d / 2 + 0.04]} castShadow material={trimMat}>
        <boxGeometry args={[w * 0.98, 0.1, 0.05]} />
      </mesh>
      <mesh position={[0, 0.85, -d / 2 + 0.03]} material={trimMat}>
        <boxGeometry args={[w * 0.96, 0.03, 0.03]} />
      </mesh>

      {selected && (
        <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.min(w, d) * 0.3, Math.min(w, d) * 0.36, 64]} />
          <meshBasicMaterial color="#ec4899" transparent opacity={0.55} />
        </mesh>
      )}

      <Html position={[0, wallH + 0.5, -d / 2 + 0.12]} center distanceFactor={17}>
        <div
          style={{
            color: selected ? '#f9a8d4' : '#dbe3f0',
            font: '650 10px "Segoe UI", system-ui, sans-serif',
            letterSpacing: 0.12,
            textTransform: 'uppercase',
            textShadow: '0 2px 12px rgba(0,0,0,0.8)',
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
  depth = 0.1,
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
          <ExecutiveDesk position={[-0.55, 0, 0.35]} />
          <OfficeChair position={[-0.55, 0, 1.2]} />
          <WindowWall width={w * 0.7} height={0.95} position={[0, 1.0, d / 2 - 0.16]} />
          <FloorLamp position={[w / 2 - 0.75, 0, -d / 2 + 0.65]} />
          <Plant position={[w / 2 - 0.65, 0, d / 2 - 0.7]} />
        </group>
      );
    case 'catalog':
      return (
        <group>
          <WorkDesk position={[0.35, 0, 0.25]} />
          <OfficeChair position={[0.35, 0, 1.1]} />
          <BookShelf position={[-w / 2 + 0.38, 0, 0]} depth={d * 0.78} />
          <BookShelf position={[w / 2 - 0.38, 0, -0.25]} depth={d * 0.55} />
          <FilingCabinet position={[-1.4, 0, 1.3]} />
        </group>
      );
    case 'screening':
      return (
        <group>
          <CinemaMonitor position={[0, 0, -d / 2 + 0.28]} />
          <StoryboardWall z={-d / 2 + 0.14} />
          <OfficeChair position={[0, 0, 0.9]} />
          <OfficeChair position={[-0.7, 0, 1.15]} />
          <SideTable position={[1.1, 0, 0.7]} />
        </group>
      );
    case 'recording':
      return (
        <group>
          <MixingConsole position={[0.35, 0, 0.15]} />
          <VocalBooth position={[-w / 2 + 1.15, 0, -0.45]} />
          <OfficeChair position={[0.35, 0, 1.05]} />
          <StudioMonitorSpeakers />
        </group>
      );
    case 'war-room':
      return (
        <group>
          <Whiteboard position={[0, 0, -d / 2 + 0.2]} />
          <MetricsScreen position={[w / 2 - 0.58, 0, 0]} />
          <WorkDesk position={[-0.45, 0, 0.45]} width={1.7} />
          <OfficeChair position={[-0.45, 0, 1.3]} />
          <OfficeChair position={[0.55, 0, 1.15]} />
        </group>
      );
    default:
      return null;
  }
}

/* ---------- detailed props ---------- */

function ExecutiveDesk({ position }: { position: [number, number, number] }) {
  const wood = useMemo(() => mats.wood('#7a4e2d', [1.5, 1]), []);
  const metal = useMemo(() => mats.metal('#5b6574'), []);
  return (
    <group position={position}>
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow material={wood}>
        <boxGeometry args={[1.7, 0.05, 0.85]} />
      </mesh>
      <mesh position={[0, 0.55, 0]} material={mats.wood('#5c3a22')}>
        <boxGeometry args={[1.65, 0.04, 0.8]} />
      </mesh>
      {/* Drawer block */}
      <mesh position={[-0.55, 0.35, 0.1]} castShadow material={wood}>
        <boxGeometry args={[0.45, 0.4, 0.55]} />
      </mesh>
      {[0.22, 0.35, 0.48].map((y, i) => (
        <mesh key={i} position={[-0.55, y, 0.38]} material={metal}>
          <boxGeometry args={[0.35, 0.015, 0.02]} />
        </mesh>
      ))}
      {[
        [0.75, 0.3, 0.32],
        [0.75, 0.3, -0.32],
        [-0.75, 0.3, -0.32],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow material={metal}>
          <cylinderGeometry args={[0.03, 0.035, 0.6, 12]} />
        </mesh>
      ))}
      <Monitor position={[0.35, 0.65, -0.15]} />
      <Keyboard position={[0.15, 0.65, 0.22]} />
      <MousePad position={[0.55, 0.65, 0.25]} />
    </group>
  );
}

function WorkDesk({
  position,
  width = 1.5,
}: {
  position: [number, number, number];
  width?: number;
}) {
  const wood = useMemo(() => mats.wood('#8b5e3c', [1.2, 1]), []);
  const metal = useMemo(() => mats.metal('#64748b'), []);
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow material={wood}>
        <boxGeometry args={[width, 0.045, 0.78]} />
      </mesh>
      {[
        [-width / 2 + 0.08, 0.3, 0.3],
        [width / 2 - 0.08, 0.3, 0.3],
        [-width / 2 + 0.08, 0.3, -0.3],
        [width / 2 - 0.08, 0.3, -0.3],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow material={metal}>
          <cylinderGeometry args={[0.028, 0.032, 0.58, 12]} />
        </mesh>
      ))}
      <Monitor position={[0.25, 0.63, -0.12]} />
      <Keyboard position={[0.05, 0.63, 0.2]} />
      <MousePad position={[0.48, 0.63, 0.22]} />
    </group>
  );
}

function Monitor({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.08, 0]} castShadow material={mats.metal('#1f2937')}>
        <cylinderGeometry args={[0.06, 0.1, 0.04, 16]} />
      </mesh>
      <mesh position={[0, 0.2, -0.02]} material={mats.metal('#334155')}>
        <boxGeometry args={[0.04, 0.22, 0.03]} />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow material={mats.metal('#0f172a')}>
        <boxGeometry args={[0.72, 0.46, 0.04]} />
      </mesh>
      <mesh position={[0, 0.4, 0.022]}>
        <planeGeometry args={[0.64, 0.38]} />
        <meshStandardMaterial
          color="#061018"
          emissive="#38bdf8"
          emissiveIntensity={1.2}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>
      {/* UI chrome bars on screen */}
      <mesh position={[-0.18, 0.5, 0.025]}>
        <planeGeometry args={[0.22, 0.04]} />
        <meshBasicMaterial color="#ec4899" toneMapped={false} />
      </mesh>
      <mesh position={[0.1, 0.35, 0.025]}>
        <planeGeometry args={[0.35, 0.12]} />
        <meshBasicMaterial color="#1e293b" toneMapped={false} />
      </mesh>
    </group>
  );
}

function Keyboard({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow material={mats.plastic('#1e293b')}>
        <boxGeometry args={[0.42, 0.02, 0.16]} />
      </mesh>
      {[-0.12, -0.04, 0.04, 0.12].map((x, i) => (
        <mesh key={i} position={[x, 0.015, 0]} material={mats.plastic('#334155')}>
          <boxGeometry args={[0.06, 0.01, 0.1]} />
        </mesh>
      ))}
    </group>
  );
}

function MousePad({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh material={mats.fabric('#1e293b')}>
        <boxGeometry args={[0.18, 0.008, 0.2]} />
      </mesh>
      <mesh position={[0.02, 0.02, 0]} material={mats.plastic('#0f172a')}>
        <boxGeometry args={[0.05, 0.025, 0.08]} />
      </mesh>
    </group>
  );
}

function OfficeChair({ position }: { position: [number, number, number] }) {
  const fabric = useMemo(() => mats.fabric('#2d3748'), []);
  const metal = useMemo(() => mats.metal('#64748b'), []);
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]} castShadow material={fabric}>
        <boxGeometry args={[0.42, 0.07, 0.42]} />
      </mesh>
      <mesh position={[0, 0.72, -0.16]} castShadow material={fabric}>
        <boxGeometry args={[0.4, 0.55, 0.07]} />
      </mesh>
      {/* lumbar pad */}
      <mesh position={[0, 0.65, -0.11]} material={mats.fabric('#3f4b5c')}>
        <boxGeometry args={[0.28, 0.18, 0.04]} />
      </mesh>
      <mesh position={[0, 0.28, 0]} castShadow material={metal}>
        <cylinderGeometry args={[0.03, 0.03, 0.28, 10]} />
      </mesh>
      <mesh position={[0, 0.12, 0]} material={metal}>
        <cylinderGeometry args={[0.16, 0.16, 0.03, 16]} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.2, 0.06, Math.sin(a) * 0.2]}
            material={mats.plastic('#111827')}
          >
            <sphereGeometry args={[0.035, 12, 10]} />
          </mesh>
        );
      })}
      {/* armrests */}
      <mesh position={[-0.24, 0.55, 0]} material={metal}>
        <boxGeometry args={[0.04, 0.04, 0.28]} />
      </mesh>
      <mesh position={[0.24, 0.55, 0]} material={metal}>
        <boxGeometry args={[0.04, 0.04, 0.28]} />
      </mesh>
    </group>
  );
}

function WindowWall({
  width,
  height,
  position,
}: {
  width: number;
  height: number;
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh castShadow material={mats.metal('#64748b')}>
        <boxGeometry args={[width + 0.08, height + 0.08, 0.06]} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[width, height, 0.04]} />
        <primitive object={mats.glass('#a8d4f0')} attach="material" />
      </mesh>
      <mesh position={[0, 0, 0.01]} material={mats.metal('#94a3b8')}>
        <boxGeometry args={[0.03, height, 0.05]} />
      </mesh>
      <mesh position={[0, 0, 0.01]} material={mats.metal('#94a3b8')}>
        <boxGeometry args={[width, 0.03, 0.05]} />
      </mesh>
    </group>
  );
}

function BookShelf({
  position,
  depth,
}: {
  position: [number, number, number];
  depth: number;
}) {
  const wood = useMemo(() => mats.wood('#6b3f22', [1, 2]), []);
  const bookColors = ['#f472b6', '#38bdf8', '#fbbf24', '#a3e635', '#c084fc', '#fb7185', '#2dd4bf'];
  return (
    <group position={position}>
      <mesh position={[0, 0.95, 0]} castShadow receiveShadow material={wood}>
        <boxGeometry args={[0.34, 1.75, depth]} />
      </mesh>
      {[-0.55, -0.15, 0.25, 0.55].map((z, row) => (
        <group key={row}>
          <mesh position={[0.02, 0.35 + row * 0.38, z]} material={mats.wood('#5a341c')}>
            <boxGeometry args={[0.3, 0.025, depth * 0.22]} />
          </mesh>
          {[-0.12, -0.02, 0.08].map((dz, bi) => (
            <mesh
              key={bi}
              position={[0.12, 0.48 + row * 0.38, z + dz]}
              castShadow
              material={mats.plastic(bookColors[(row * 3 + bi) % bookColors.length])}
            >
              <boxGeometry args={[0.12, 0.22 + (bi % 3) * 0.04, 0.07]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function FilingCabinet({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow material={mats.metal('#64748b')}>
        <boxGeometry args={[0.45, 0.7, 0.5]} />
      </mesh>
      {[0.15, 0.35, 0.55].map((y, i) => (
        <mesh key={i} position={[0, y - 0.35, 0.26]} material={mats.metal('#475569')}>
          <boxGeometry args={[0.38, 0.14, 0.02]} />
        </mesh>
      ))}
    </group>
  );
}

function CinemaMonitor({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow material={mats.metal('#0f172a')}>
        <boxGeometry args={[2.7, 1.55, 0.12]} />
      </mesh>
      <mesh position={[0, 0.95, 0.07]}>
        <planeGeometry args={[2.4, 1.3]} />
        <meshStandardMaterial
          color="#0b1020"
          emissive="#6366f1"
          emissiveIntensity={1.4}
          roughness={0.18}
          metalness={0.35}
        />
      </mesh>
      {/* playback UI */}
      <mesh position={[0, 0.45, 0.08]}>
        <planeGeometry args={[1.6, 0.08]} />
        <meshBasicMaterial color="#ec4899" toneMapped={false} />
      </mesh>
      <mesh position={[-0.9, 1.35, 0.08]}>
        <planeGeometry args={[0.4, 0.12]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.12, 0]} material={mats.metal('#1e293b')}>
        <boxGeometry args={[0.8, 0.2, 0.25]} />
      </mesh>
    </group>
  );
}

function StoryboardWall({ z }: { z: number }) {
  const colors = ['#fef3c7', '#fce7f3', '#e0e7ff', '#d1fae5'];
  return (
    <group>
      {[-1.3, -0.45, 0.4, 1.25].map((x, i) => (
        <group key={i} position={[x, 0.85, z]}>
          <mesh castShadow material={mats.plastic(colors[i % colors.length])}>
            <boxGeometry args={[0.55, 0.4, 0.03]} />
          </mesh>
          <mesh position={[0, 0, 0.02]} material={mats.plastic('#334155')}>
            <boxGeometry args={[0.35, 0.08, 0.01]} />
          </mesh>
          <mesh position={[0, -0.1, 0.02]} material={mats.plastic('#64748b')}>
            <boxGeometry args={[0.4, 0.05, 0.01]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function MixingConsole({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow material={mats.metal('#1f2937')}>
        <boxGeometry args={[2.4, 0.12, 1.0]} />
      </mesh>
      <mesh position={[0, 0.5, -0.15]} castShadow material={mats.metal('#111827')}>
        <boxGeometry args={[2.3, 0.08, 0.55]} />
      </mesh>
      {/* faders */}
      {Array.from({ length: 12 }).map((_, i) => {
        const x = -1.05 + i * 0.19;
        return (
          <group key={i} position={[x, 0.56, 0.15]}>
            <mesh material={mats.metal('#334155')}>
              <boxGeometry args={[0.03, 0.02, 0.35]} />
            </mesh>
            <mesh position={[0, 0.025, -0.05 + (i % 3) * 0.04]} material={mats.plastic('#ec4899')}>
              <boxGeometry args={[0.05, 0.03, 0.06]} />
            </mesh>
          </group>
        );
      })}
      {/* knobs */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh
          key={`k${i}`}
          position={[-0.9 + i * 0.2, 0.58, -0.2]}
          material={mats.plastic(i % 2 ? '#22d3ee' : '#fbbf24')}
        >
          <cylinderGeometry args={[0.035, 0.035, 0.04, 16]} />
        </mesh>
      ))}
      <mesh position={[0.9, 0.72, -0.25]} castShadow material={mats.metal('#0f172a')}>
        <boxGeometry args={[0.45, 0.28, 0.04]} />
      </mesh>
      <mesh position={[0.9, 0.72, -0.22]}>
        <planeGeometry args={[0.38, 0.22]} />
        <meshStandardMaterial
          color="#042f2e"
          emissive="#14b8a6"
          emissiveIntensity={1.3}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}

function VocalBooth({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow material={mats.fabric('#7f1d1d')}>
        <boxGeometry args={[1.6, 1.7, 1.45]} />
      </mesh>
      {/* foam wedges suggestion */}
      {[-0.4, 0, 0.4].map((y, i) => (
        <mesh key={i} position={[0.82, 0.7 + y * 0.3, 0]} material={mats.fabric('#991b1b')}>
          <boxGeometry args={[0.05, 0.25, 1.2]} />
        </mesh>
      ))}
      <mesh position={[0, 0.95, 0.74]}>
        <boxGeometry args={[1.2, 1.0, 0.05]} />
        <primitive object={mats.glass('#67e8f9')} attach="material" />
      </mesh>
      <mesh position={[0, 0.95, 0.78]} material={mats.metal('#475569')}>
        <boxGeometry args={[1.28, 1.08, 0.04]} />
      </mesh>
      {/* mic stand */}
      <mesh position={[0.2, 0.55, 0.15]} material={mats.metal('#94a3b8')}>
        <cylinderGeometry args={[0.015, 0.02, 1.0, 10]} />
      </mesh>
      <mesh position={[0.2, 1.1, 0.25]} rotation={[0.6, 0, 0]} material={mats.metal('#1e293b')}>
        <cylinderGeometry args={[0.04, 0.03, 0.18, 12]} />
      </mesh>
    </group>
  );
}

function StudioMonitorSpeakers() {
  return (
    <group>
      {[-1.1, 1.1].map((x, i) => (
        <group key={i} position={[x, 0.85, -0.9]}>
          <mesh castShadow material={mats.plastic('#1e293b')}>
            <boxGeometry args={[0.28, 0.4, 0.25]} />
          </mesh>
          <mesh
            position={[0, 0.08, 0.13]}
            rotation={[Math.PI / 2, 0, 0]}
            material={mats.plastic('#0f172a')}
          >
            <cylinderGeometry args={[0.08, 0.08, 0.04, 20]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Whiteboard({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow material={mats.paint('#f8fafc')}>
        <boxGeometry args={[2.85, 1.45, 0.06]} />
      </mesh>
      <mesh position={[0, 0.95, 0]} material={mats.metal('#94a3b8')}>
        <boxGeometry args={[2.95, 1.55, 0.04]} />
      </mesh>
      {/* marker tray */}
      <mesh position={[0, 0.2, 0.08]} material={mats.metal('#64748b')}>
        <boxGeometry args={[1.2, 0.05, 0.12]} />
      </mesh>
      {[-0.3, 0, 0.3].map((x, i) => (
        <mesh
          key={i}
          position={[x, 0.24, 0.08]}
          rotation={[0, 0, Math.PI / 2]}
          material={mats.plastic(['#ec4899', '#22d3ee', '#111'][i])}
        >
          <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} />
        </mesh>
      ))}
      {/* scribble lines */}
      <mesh position={[-0.5, 1.1, 0.04]}>
        <planeGeometry args={[1.2, 0.04]} />
        <meshBasicMaterial color="#334155" toneMapped={false} />
      </mesh>
      <mesh position={[0.4, 0.9, 0.04]}>
        <planeGeometry args={[0.9, 0.03]} />
        <meshBasicMaterial color="#ec4899" toneMapped={false} />
      </mesh>
      <mesh position={[-0.2, 0.7, 0.04]}>
        <planeGeometry args={[1.5, 0.03]} />
        <meshBasicMaterial color="#0ea5e9" toneMapped={false} />
      </mesh>
    </group>
  );
}

function MetricsScreen({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow material={mats.metal('#0f172a')} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.1, 1.7, 2.2]} />
      </mesh>
      <mesh position={[-0.06, 0.95, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1.95, 1.45]} />
        <meshStandardMaterial
          color="#042f2e"
          emissive="#14b8a6"
          emissiveIntensity={1.35}
          roughness={0.22}
          metalness={0.3}
        />
      </mesh>
      {/* chart bars */}
      {[0.3, 0.55, 0.4, 0.7, 0.5].map((h, i) => (
        <mesh
          key={i}
          position={[-0.07, 0.5 + h / 2, -0.6 + i * 0.3]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <planeGeometry args={[0.18, h]} />
          <meshBasicMaterial color="#5eead4" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function FloorLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh material={mats.metal('#64748b')}>
        <cylinderGeometry args={[0.12, 0.14, 0.04, 16]} />
      </mesh>
      <mesh position={[0, 0.7, 0]} material={mats.metal('#94a3b8')}>
        <cylinderGeometry args={[0.02, 0.02, 1.35, 10]} />
      </mesh>
      <mesh position={[0, 1.4, 0]} material={mats.plastic('#fef3c7')}>
        <coneGeometry args={[0.18, 0.22, 16]} />
      </mesh>
      <pointLight position={[0, 1.25, 0]} intensity={0.55} color="#fde68a" distance={4} />
    </group>
  );
}

function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} castShadow material={mats.plastic('#57534e')}>
        <cylinderGeometry args={[0.14, 0.17, 0.35, 16]} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow material={mats.fabric('#166534')}>
        <sphereGeometry args={[0.24, 16, 12]} />
      </mesh>
      <mesh position={[0.1, 0.7, 0.05]} material={mats.fabric('#15803d')}>
        <sphereGeometry args={[0.14, 12, 10]} />
      </mesh>
    </group>
  );
}

function SideTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow material={mats.wood('#6b4423')}>
        <cylinderGeometry args={[0.22, 0.22, 0.04, 20]} />
      </mesh>
      <mesh position={[0, 0.2, 0]} material={mats.metal('#64748b')}>
        <cylinderGeometry args={[0.025, 0.025, 0.4, 10]} />
      </mesh>
    </group>
  );
}

function shade(hex: string, factor: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * factor)));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * factor)));
  const b = Math.min(255, Math.max(0, Math.round((n & 255) * factor)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
