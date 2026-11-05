import { useMemo } from 'react';
import {
  ContactShadows,
  Environment,
  SoftShadows,
} from '@react-three/drei';
import { EffectComposer, Bloom, N8AO, Vignette } from '@react-three/postprocessing';
import type { OfficeMock } from './mockOffice';
import { Room } from './Room';
import { Agent } from './Agent';
import { CameraRig, InitialCamera } from './CameraRig';
import { mats } from './materials';

interface OfficeSceneProps {
  office: OfficeMock;
  selectedAgentId: string | null;
  selectedRoomId: string | null;
  focusTarget: [number, number, number] | null;
  onSelectAgent: (id: string) => void;
  onSelectRoom: (id: string) => void;
}

export function OfficeScene({
  office,
  selectedAgentId,
  selectedRoomId,
  focusTarget,
  onSelectAgent,
  onSelectRoom,
}: OfficeSceneProps) {
  const baseMat = useMemo(() => mats.floor('#25201c', [7, 6]), []);
  const hallMat = useMemo(() => mats.floor('#3f3832', [3, 2]), []);
  const rugMat = useMemo(() => mats.fabric('#1e293b'), []);
  const plinthMat = useMemo(() => mats.metal('#1e293b', [1, 1]), []);

  const agentWorldPos = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    for (const agent of office.agents) {
      const room = office.rooms.find((r) => r.id === agent.roomId);
      if (!room) continue;
      map.set(agent.id, [
        room.position[0] + agent.offset[0],
        0.1,
        room.position[2] + agent.offset[2],
      ]);
    }
    return map;
  }, [office]);

  return (
    <>
      <color attach="background" args={['#080c14']} />
      <fog attach="fog" args={['#080c14', 38, 70]} />

      <InitialCamera />
      <CameraRig focusTarget={focusTarget} />
      <SoftShadows size={12} samples={8} focus={0.7} />

      {/* Brighter keying now that rooms are open-top */}
      <ambientLight intensity={0.42} color="#e2e8f0" />
      <hemisphereLight args={['#f8fafc', '#1e293b', 0.7]} />
      <directionalLight
        castShadow
        position={[12, 20, 10]}
        intensity={2.4}
        color="#fff7ed"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00015}
        shadow-normalBias={0.03}
        shadow-camera-far={70}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
      />
      <directionalLight position={[-9, 14, -6]} intensity={0.75} color="#93c5fd" />
      <directionalLight position={[0, 10, 12]} intensity={0.4} color="#fda4af" />
      <pointLight position={[-4.5, 3.2, 3.5]} intensity={0.55} color="#fb7185" distance={12} />
      <pointLight position={[5.5, 3.2, -3]} intensity={0.45} color="#22d3ee" distance={12} />

      <Environment preset="apartment" environmentIntensity={0.45} />

      {/* Building slab */}
      <mesh position={[0, -0.12, 0]} receiveShadow castShadow material={baseMat}>
        <boxGeometry args={[22, 0.28, 16]} />
      </mesh>

      {/* Cross atrium / corridors tying the five rooms together */}
      <mesh position={[0, 0.06, 0]} receiveShadow material={hallMat}>
        <boxGeometry args={[7.2, 0.05, 3.2]} />
      </mesh>
      <mesh position={[0, 0.06, 0]} receiveShadow material={hallMat}>
        <boxGeometry args={[3.2, 0.05, 9.6]} />
      </mesh>
      {/* Accent rug under lobby */}
      <mesh position={[0, 0.09, 0]} receiveShadow material={rugMat}>
        <boxGeometry args={[3.6, 0.02, 2.4]} />
      </mesh>
      {/* Corridor edge rails */}
      {[
        [0, 0.1, 1.55, 7.2, 0.02, 0.05],
        [0, 0.1, -1.55, 7.2, 0.02, 0.05],
        [1.55, 0.1, 0, 0.05, 0.02, 9.6],
        [-1.55, 0.1, 0, 0.05, 0.02, 9.6],
      ].map((v, i) => (
        <mesh
          key={i}
          position={[v[0], v[1], v[2]]}
          material={mats.metal('#475569')}
        >
          <boxGeometry args={[v[3], v[4], v[5]]} />
        </mesh>
      ))}

      <ContactShadows
        position={[0, 0.09, 0]}
        opacity={0.55}
        scale={28}
        blur={2.0}
        far={9}
        resolution={2048}
        color="#000000"
      />

      {/* PRIM8 brand plinth in atrium center */}
      <group position={[0, 0.1, 0]}>
        <mesh position={[0, 0.28, 0]} castShadow material={plinthMat}>
          <boxGeometry args={[1.35, 0.55, 0.45]} />
        </mesh>
        <mesh position={[0, 0.02, 0]} material={mats.metal('#0f172a')}>
          <boxGeometry args={[1.45, 0.04, 0.55]} />
        </mesh>
        <mesh position={[0, 0.58, 0.02]}>
          <boxGeometry args={[1.05, 0.2, 0.05]} />
          <meshStandardMaterial
            color="#ec4899"
            emissive="#ec4899"
            emissiveIntensity={1.15}
            roughness={0.3}
            metalness={0.35}
          />
        </mesh>
        <pointLight position={[0, 0.85, 0.35]} intensity={0.5} color="#ec4899" distance={5} />
      </group>

      {/* Lounge bench + plant for atrium life */}
      <mesh position={[-2.2, 0.28, 0]} castShadow material={mats.fabric('#334155')}>
        <boxGeometry args={[1.1, 0.35, 0.45]} />
      </mesh>
      <mesh position={[2.2, 0.28, 0]} castShadow material={mats.fabric('#334155')}>
        <boxGeometry args={[1.1, 0.35, 0.45]} />
      </mesh>
      <group position={[0, 0.1, 1.35]}>
        <mesh position={[0, 0.18, 0]} castShadow material={mats.plastic('#57534e')}>
          <cylinderGeometry args={[0.16, 0.18, 0.32, 16]} />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow material={mats.fabric('#166534')}>
          <sphereGeometry args={[0.28, 16, 12]} />
        </mesh>
      </group>

      {office.rooms.map((room) => (
        <Room
          key={room.id}
          room={room}
          selected={selectedRoomId === room.id}
          onSelect={onSelectRoom}
        />
      ))}

      {office.agents.map((agent) => {
        const pos = agentWorldPos.get(agent.id) ?? [0, 0.1, 0];
        return (
          <Agent
            key={agent.id}
            agent={agent}
            position={pos}
            selected={selectedAgentId === agent.id}
            onSelect={onSelectAgent}
          />
        );
      })}

      <EffectComposer multisampling={4}>
        <N8AO aoRadius={0.35} intensity={0.85} distanceFalloff={0.75} quality="medium" />
        <Bloom
          luminanceThreshold={0.92}
          luminanceSmoothing={0.25}
          intensity={0.85}
          mipmapBlur
        />
        <Vignette offset={0.32} darkness={0.3} />
      </EffectComposer>
    </>
  );
}
