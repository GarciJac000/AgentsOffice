import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OfficeScene } from './claymation/OfficeScene';
import { AgentPanel } from './claymation/AgentPanel';
import {
  getMockOffice,
  type OfficeMock,
  STATUS_META,
} from './claymation/mockOffice';

export default function App() {
  const [office, setOffice] = useState<OfficeMock | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  useEffect(() => {
    getMockOffice().then(setOffice);
  }, []);

  const selectedAgent = useMemo(
    () => office?.agents.find((a) => a.id === selectedAgentId) ?? null,
    [office, selectedAgentId],
  );

  const focusTarget = useMemo((): [number, number, number] | null => {
    if (!office) return null;
    if (selectedAgent) {
      const room = office.rooms.find((r) => r.id === selectedAgent.roomId);
      if (!room) return null;
      return [
        room.position[0] + selectedAgent.offset[0],
        0.8,
        room.position[2] + selectedAgent.offset[2],
      ];
    }
    if (selectedRoomId) {
      const room = office.rooms.find((r) => r.id === selectedRoomId);
      if (!room) return null;
      return [room.position[0], 0.5, room.position[2]];
    }
    return null;
  }, [office, selectedAgent, selectedRoomId]);

  const onSelectAgent = useCallback((id: string) => {
    setSelectedAgentId(id);
    setSelectedRoomId(null);
  }, []);

  const onSelectRoom = useCallback(
    (roomId: string) => {
      setSelectedRoomId(roomId);
      const occupant = office?.agents.find((a) => a.roomId === roomId);
      if (occupant) setSelectedAgentId(occupant.id);
      else setSelectedAgentId(null);
    },
    [office],
  );

  if (!office) {
    return <div className="boot">Loading PRIM8 claymation office…</div>;
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar__brand">
          <span className="top-bar__mark">PRIM</span>
          <span className="top-bar__eight">8</span>
          <span className="top-bar__sub">Claymation Office</span>
        </div>
        <div className="top-bar__roster">
          {office.agents.map((a) => {
            const meta = STATUS_META[a.status];
            return (
              <button
                key={a.id}
                type="button"
                className={`roster-chip${selectedAgentId === a.id ? ' is-active' : ''}`}
                style={{ borderColor: a.accent }}
                onClick={() => onSelectAgent(a.id)}
              >
                <span className="roster-chip__dot" style={{ background: meta.color }} />
                {a.name}
              </button>
            );
          })}
        </div>
        <p className="top-bar__hint">Drag to orbit · Scroll zoom · Right-drag pan · Click agent/room</p>
      </header>

      <div className="stage">
        <Canvas
          shadows
          dpr={[1, 1.75]}
          camera={{ position: [16, 14, 16], fov: 42, near: 0.1, far: 120 }}
          gl={{ antialias: true }}
          onPointerMissed={() => {
            setSelectedAgentId(null);
            setSelectedRoomId(null);
          }}
        >
          <Suspense fallback={null}>
            <OfficeScene
              office={office}
              selectedAgentId={selectedAgentId}
              selectedRoomId={selectedRoomId}
              focusTarget={focusTarget}
              onSelectAgent={onSelectAgent}
              onSelectRoom={onSelectRoom}
            />
          </Suspense>
        </Canvas>

        <AgentPanel agent={selectedAgent} onClose={() => setSelectedAgentId(null)} />
      </div>
    </div>
  );
}
