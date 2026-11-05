import { useMemo } from 'react';
import { ContactShadows, Environment } from '@react-three/drei';
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
  const baseMat = useMemo(() => mats.floor('#2a2420'), []);
  const hallMat = useMemo(() => mats.floor('#3a332c'), []);
  const plinthMat = useMemo(() => mats.metal('#111827'), []);
  const logoMat = useMemo(
    () =>
      mats.plastic('#ec4899'),
    [],
  );

  const agentWorldPos = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    for (const agent of office.agents) {
      const room = office.rooms.find((r) => r.id === agent.roomId);
      if (!room) continue;
      map.set(agent.id, [
        room.position[0] + agent.offset[0],
        0.12,
        room.position[2] + agent.offset[2],
      ]);
    }
    return map;
  }, [office]);

  return (
    <>
      <color attach="background" args={['#0c1018']} />
      <fog attach="fog" args={['#0c1018', 32, 62]} />

      <InitialCamera />
      <CameraRig focusTarget={focusTarget} />

      <ambientLight intensity={0.28} color="#c7d2fe" />
      <hemisphereLight args={['#e2e8f0', '#1e293b', 0.45]} />
      <directionalLight
        castShadow
        position={[12, 20, 10]}
        intensity={1.85}
        color="#fff7ed"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
        shadow-camera-far={70}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <directionalLight position={[-8, 10, -6]} intensity={0.55} color="#93c5fd" />
      <pointLight position={[-5, 4.5, 4]} intensity={0.55} color="#fb7185" distance={18} />
      <pointLight position={[7, 4, -3]} intensity={0.4} color="#22d3ee" distance={16} />

      <Environment preset="city" environmentIntensity={0.45} />

      <mesh position={[0, -0.08, 0]} receiveShadow castShadow material={baseMat}>
        <boxGeometry args={[22, 0.28, 18]} />
      </mesh>
      <mesh position={[0, 0.1, 0]} receiveShadow material={hallMat}>
        <boxGeometry args={[6.5, 0.08, 4.5]} />
      </mesh>

      <ContactShadows
        position={[0, 0.13, 0]}
        opacity={0.55}
        scale={28}
        blur={2.4}
        far={8}
        resolution={1024}
        color="#000000"
      />

      <group position={[0, 0.14, 0]}>
        <mesh position={[0, 0.32, 0]} castShadow material={plinthMat}>
          <boxGeometry args={[1.35, 0.64, 0.45]} />
        </mesh>
        <mesh position={[0, 0.68, 0.02]} material={logoMat}>
          <boxGeometry args={[1.05, 0.22, 0.06]} />
        </mesh>
        <mesh position={[0, 0.68, 0.055]}>
          <planeGeometry args={[0.95, 0.16]} />
          <meshStandardMaterial
            color="#ec4899"
            emissive="#ec4899"
            emissiveIntensity={0.65}
            roughness={0.35}
            metalness={0.2}
          />
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
        const pos = agentWorldPos.get(agent.id) ?? [0, 0.12, 0];
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
    </>
  );
}
