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
  const baseMat = useMemo(() => mats.floor('#2c2621', [6, 5]), []);
  const hallMat = useMemo(() => mats.floor('#3d3530', [2, 2]), []);
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
      <color attach="background" args={['#070b12']} />
      <fog attach="fog" args={['#070b12', 36, 68]} />

      <InitialCamera />
      <CameraRig focusTarget={focusTarget} />
      <SoftShadows size={12} samples={8} focus={0.7} />

      {/* Studio key / fill / rim */}
      <ambientLight intensity={0.32} color="#dbe4f5" />
      <hemisphereLight args={['#f1f5f9', '#1a2332', 0.65]} />
      <directionalLight
        castShadow
        position={[14, 22, 11]}
        intensity={2.6}
        color="#fff4e6"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00015}
        shadow-normalBias={0.03}
        shadow-camera-far={70}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
      />
      <directionalLight position={[-10, 12, -8]} intensity={0.7} color="#93c5fd" />
      <directionalLight position={[0, 8, 14]} intensity={0.35} color="#fda4af" />
      <pointLight position={[-5.5, 3.8, 4.5]} intensity={0.7} color="#fb7185" distance={14} />
      <pointLight position={[7.5, 3.5, -4]} intensity={0.55} color="#22d3ee" distance={14} />
      <spotLight
        position={[0, 10, 0]}
        angle={0.55}
        penumbra={0.6}
        intensity={0.85}
        color="#ffffff"
        castShadow={false}
      />

      <Environment preset="apartment" environmentIntensity={0.4} />

      <mesh position={[0, -0.1, 0]} receiveShadow castShadow material={baseMat}>
        <boxGeometry args={[24, 0.3, 20]} />
      </mesh>
      <mesh position={[0, 0.08, 0]} receiveShadow material={hallMat}>
        <boxGeometry args={[6.8, 0.06, 4.8]} />
      </mesh>

      {/* Hallway edge inlays */}
      <mesh position={[0, 0.12, 2.35]} material={mats.metal('#475569')}>
        <boxGeometry args={[6.8, 0.02, 0.06]} />
      </mesh>
      <mesh position={[0, 0.12, -2.35]} material={mats.metal('#475569')}>
        <boxGeometry args={[6.8, 0.02, 0.06]} />
      </mesh>

      <ContactShadows
        position={[0, 0.11, 0]}
        opacity={0.65}
        scale={30}
        blur={2.2}
        far={10}
        resolution={2048}
        color="#000000"
      />

      {/* PRIM8 brand plinth */}
      <group position={[0, 0.12, 0]}>
        <mesh position={[0, 0.3, 0]} castShadow material={plinthMat}>
          <boxGeometry args={[1.45, 0.6, 0.48]} />
        </mesh>
        <mesh position={[0, 0.02, 0]} material={mats.metal('#0f172a')}>
          <boxGeometry args={[1.55, 0.04, 0.58]} />
        </mesh>
        <mesh position={[0, 0.64, 0.02]}>
          <boxGeometry args={[1.15, 0.24, 0.05]} />
          <meshStandardMaterial
            color="#ec4899"
            emissive="#ec4899"
            emissiveIntensity={1.1}
            roughness={0.3}
            metalness={0.35}
          />
        </mesh>
        <pointLight position={[0, 0.9, 0.4]} intensity={0.45} color="#ec4899" distance={5} />
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
        <N8AO aoRadius={0.4} intensity={0.95} distanceFalloff={0.7} quality="medium" />
        <Bloom
          luminanceThreshold={0.9}
          luminanceSmoothing={0.25}
          intensity={0.9}
          mipmapBlur
        />
        <Vignette offset={0.3} darkness={0.35} />
      </EffectComposer>
    </>
  );
}
