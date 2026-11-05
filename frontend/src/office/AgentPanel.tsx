import { useEffect, useState } from 'react';
import type { AgentDef, ChatStubMessage } from './mockOffice';
import { STATUS_META } from './mockOffice';

interface AgentPanelProps {
  agent: AgentDef | null;
  onClose: () => void;
}

export function AgentPanel({ agent, onClose }: AgentPanelProps) {
  const [draft, setDraft] = useState('');
  const [localChat, setLocalChat] = useState<ChatStubMessage[]>([]);

  useEffect(() => {
    setLocalChat(agent?.chat ?? []);
    setDraft('');
    // Reset stub chat when the selected agent changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional id-only sync
  }, [agent?.id]);

  if (!agent) return null;

  const meta = STATUS_META[agent.status];

  const sendStub = () => {
    const text = draft.trim();
    if (!text) return;
    const stamp = new Date().toISOString();
    setLocalChat((prev) => [
      ...prev,
      { id: `u-${stamp}`, from: 'user', text, at: stamp },
      {
        id: `a-${stamp}`,
        from: 'agent',
        text: `(stub) Got it — I'll follow up on “${text.slice(0, 48)}”.`,
        at: stamp,
      },
    ]);
    setDraft('');
  };

  return (
    <aside className="agent-panel" style={{ borderColor: agent.accent }}>
      <header className="agent-panel__header">
        <div className="agent-panel__identity">
          <div
            className="agent-panel__avatar"
            style={{
              background: agent.skin,
              boxShadow: `inset 0 -8px 0 ${agent.outfit}`,
            }}
          />
          <div>
            <h2>{agent.name}</h2>
            <p className="agent-panel__role">{agent.role}</p>
          </div>
        </div>
        <button type="button" className="agent-panel__close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>

      <div className="agent-panel__status" style={{ color: meta.color }}>
        <span className="agent-panel__status-dot" style={{ background: meta.color }} />
        {meta.label}
        <span className="agent-panel__activity">{agent.activity}</span>
      </div>

      <section className="agent-panel__section">
        <h3>Activity log</h3>
        <ul className="agent-panel__log">
          {agent.log.map((entry) => (
            <li key={entry.id}>
              <time dateTime={entry.at}>{formatTime(entry.at)}</time>
              <span>{entry.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="agent-panel__section agent-panel__chat">
        <h3>Chat (stub)</h3>
        <div className="agent-panel__messages">
          {localChat.map((m) => (
            <div key={m.id} className={`agent-panel__msg agent-panel__msg--${m.from}`}>
              {m.text}
            </div>
          ))}
        </div>
        <form
          className="agent-panel__compose"
          onSubmit={(e) => {
            e.preventDefault();
            sendStub();
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${agent.name}…`}
          />
          <button type="submit">Send</button>
        </form>
      </section>
    </aside>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}
