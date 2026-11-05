import { useMemo } from 'react';
import type { OfficeMock } from './mockOffice';
import { Room } from './Room';
import { ClayAgent } from './ClayAgent';
import { CameraRig, InitialCamera } from './CameraRig';
import { StopMotionClock } from './StopMotion';
import * as THREE from 'three';
import { clayMaterial, thumbprintDisplace } from './clayMaterial';

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
  const baseGeo = useMemo(
    () => thumbprintDisplace(new THREE.BoxGeometry(22, 0.35, 18, 10, 1, 8), 0.02, 11),
    [],
  );
  const baseMat = useMemo(() => clayMaterial('#8d6e4c', { roughness: 0.97 }), []);
  const hallMat = useMemo(() => clayMaterial('#b08968'), []);

  const agentWorldPos = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    for (const agent of office.agents) {
      const room = office.rooms.find((r) => r.id === agent.roomId);
      if (!room) continue;
      map.set(agent.id, [
        room.position[0] + agent.offset[0],
        0.18,
        room.position[2] + agent.offset[2],
      ]);
    }
    return map;
  }, [office]);

  return (
    <>
      <color attach="background" args={['#1a1510']} />
      <fog attach="fog" args={['#1a1510', 28, 55]} />

      <StopMotionClock fps={10} />
      <InitialCamera />
      <CameraRig focusTarget={focusTarget} />

      {/* Warm claymation lighting */}
      <ambientLight intensity={0.45} color="#ffe8d2" />
      <directionalLight
        castShadow
        position={[10, 18, 8]}
        intensity={1.35}
        color="#fff1e0"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={60}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />
      <pointLight position={[-6, 6, 4]} intensity={0.45} color="#ffb38a" />
      <pointLight position={[8, 5, -4]} intensity={0.35} color="#f9a8d4" />

      {/* Studio base / hallway diorama slab */}
      <mesh geometry={baseGeo} material={baseMat} position={[0, -0.1, 0]} receiveShadow castShadow />
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[6.5, 0.12, 4.5]} />
        <primitive object={hallMat} attach="material" />
      </mesh>

      {/* PRIM8 logo plinth in hallway */}
      <group position={[0, 0.2, 0]}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[1.4, 0.7, 0.5]} />
          <meshStandardMaterial color="#0B0C0E" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[0, 0.72, 0.02]}>
          <boxGeometry args={[1.1, 0.28, 0.08]} />
          <meshStandardMaterial color="#ec4899" roughness={0.55} emissive="#ec4899" emissiveIntensity={0.25} />
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
        const pos = agentWorldPos.get(agent.id) ?? [0, 0.18, 0];
        return (
          <ClayAgent
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
