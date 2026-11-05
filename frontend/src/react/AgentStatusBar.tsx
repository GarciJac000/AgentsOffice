import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EventBus } from '../shared/events/EventBus';
import { loadAgentRegistry, getAgentsCached, getPortraitUrl } from '../shared/agentRegistry';
import { t } from '../shared/i18n';
import { sendDirectMessage, type DirectReply } from './directMessage';

// 模型名称显示映射 — 从 /api/v1/office/models 动态加载
let MODEL_DISPLAY_NAMES: Record<string, string> = {};

// 启动时从后端加载模型显示名映射
fetch('/api/v1/office/models')
  .then((r) => r.json())
  .then((envelope) => {
    const models = envelope?.data?.models || [];
    const map: Record<string, string> = {};
    for (const m of models) {
      if (m.model_name && m.display_name) {
        map[m.model_name] = m.display_name;
      }
    }
    MODEL_DISPLAY_NAMES = map;
  })
  .catch(() => {});

interface AgentDef {
  slug: string;
  name: string;
  color: string;
  role: string;
  modelDisplay: string;
  active: boolean;
  hasPrompt: boolean;
}

type AgentStatus = 'idle' | 'working' | 'standby';

const MAX_PER_ROW = 7;

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

export const AgentStatusBar: React.FC = () => {
  // 展开/折叠状态
  const [expanded, setExpanded] = useState(false);
  const [hoverSlug, setHoverSlug] = useState<string | null>(null);
  const [menuSlug, setMenuSlug] = useState<string | null>(null);
  const [composeSlug, setComposeSlug] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [threads, setThreads] = useState<Record<string, DirectReply[]>>({});
  const [sendingSlug, setSendingSlug] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Agent 定义列表（从 agentRegistry 加载）
  const [agents, setAgents] = useState<AgentDef[]>(() =>
    getAgentsCached().map((a) => ({
      slug: a.slug,
      name: a.displayName,
      color: a.color,
      role: a.role,
      modelDisplay: 'Gemini Flash',
      active: true,
      hasPrompt: true,
    }))
  );

  // 加载注册表后更新 agent 列表
  useEffect(() => {
    loadAgentRegistry().then((entries) => {
      setAgents((prev) => {
        const fromRegistry = entries.map((a) => ({
          slug: a.slug,
          name: a.displayName,
          color: a.color,
          role: a.role,
          modelDisplay: 'Gemini Flash',
          active: true,
          hasPrompt: true,
        }));
        return fromRegistry.map((r) => {
          const existing = prev.find((p) => p.slug === r.slug);
          return existing ? { ...r, modelDisplay: existing.modelDisplay, active: existing.active, hasPrompt: existing.hasPrompt } : r;
        });
      });
    });
  }, []);

  const [statuses, setStatuses] = useState<Record<string, AgentStatus>>(() => {
    const init: Record<string, AgentStatus> = {};
    for (const a of getAgentsCached()) {
      init[a.slug] = 'idle';
    }
    return init;
  });

  const [tokens, setTokens] = useState<Record<string, number>>({});

  // 从后端加载 agent 定义
  const syncAgentDefinitions = useCallback(() => {
    fetch('/api/v1/office/agent-config')
      .then((res) => res.json())
      .then((envelope) => {
        const configs = envelope?.data?.configs || {};
        setAgents((prev) => {
          const updated = prev.map((agent) => {
            const cfg = configs[agent.slug];
            if (!cfg) return agent;
            return {
              ...agent,
              name: (cfg.display_name && cfg.display_name !== agent.slug) ? cfg.display_name : agent.name,
              color: cfg.color || agent.color,
              role: cfg.role || agent.role,
              modelDisplay: cfg.model_name
                ? MODEL_DISPLAY_NAMES[cfg.model_name] || cfg.model_name
                : agent.modelDisplay,
              active: cfg.active ?? agent.active,
              hasPrompt: !!(cfg.system_prompt),
            };
          });

          setStatuses((prevStatuses) => {
            const newStatuses = { ...prevStatuses };
            for (const agent of updated) {
              if (agent.active && newStatuses[agent.slug] === 'standby') {
                newStatuses[agent.slug] = 'idle';
              }
              if (!agent.active && newStatuses[agent.slug] !== 'standby') {
                newStatuses[agent.slug] = 'standby';
              }
            }
            return newStatuses;
          });

          return updated;
        });
      })
      .catch(() => {});
  }, []);

  const syncTokensFromAPI = useCallback(() => {
    fetch('/api/v1/office/costs/by-agent')
      .then((res) => res.json())
      .then((envelope) => {
        const items = envelope?.data?.items || [];
        const loaded: Record<string, number> = {};
        for (const item of items) {
          if (item.agent_slug) {
            loaded[item.agent_slug] = (loaded[item.agent_slug] || 0) + (item.total_tokens || 0);
          }
        }
        setTokens(loaded);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    syncAgentDefinitions();
    syncTokensFromAPI();

    EventBus.on('chat:round-complete', syncTokensFromAPI);
    EventBus.on('agent:config-updated', syncAgentDefinitions);

    return () => {
      EventBus.off('chat:round-complete', syncTokensFromAPI);
      EventBus.off('agent:config-updated', syncAgentDefinitions);
    };
  }, [syncAgentDefinitions, syncTokensFromAPI]);

  useEffect(() => {
    const onStatusChange = (data: { agentSlug: string; status: AgentStatus }) => {
      setStatuses((prev) => ({ ...prev, [data.agentSlug]: data.status }));
    };

    const onTokenUsage = (data: { agentSlug: string; tokens: number }) => {
      setTokens((prev) => ({
        ...prev,
        [data.agentSlug]: (prev[data.agentSlug] || 0) + data.tokens,
      }));
    };

    EventBus.on('agent:status', onStatusChange);
    EventBus.on('agent:token-usage', onTokenUsage);
    return () => {
      EventBus.off('agent:status', onStatusChange);
      EventBus.off('agent:token-usage', onTokenUsage);
    };
  }, []);

  const statusLabel = (s: AgentStatus) => {
    switch (s) {
      case 'working': return t('status.running');
      case 'standby': return t('status.idle');
      default: return t('status.idle');
    }
  };

  const openCard = (agent: AgentDef) => {
    setMenuSlug(null);
    EventBus.emit('agent:open-config', {
      agentSlug: agent.slug,
      agentName: agent.name,
      agentColor: agent.color,
    });
  };

  const focusComposer = (slug: string) => {
    setComposeSlug(slug);
    setMenuSlug(null);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const composerOpen = (slug: string) =>
    hoverSlug === slug || composeSlug === slug || menuSlug === slug || sendingSlug === slug;

  const sendDraft = async (agent: AgentDef) => {
    const text = (drafts[agent.slug] || '').trim();
    if (!text || sendingSlug) return;
    setDrafts((prev) => ({ ...prev, [agent.slug]: '' }));
    setSendError(null);
    setComposeSlug(agent.slug);
    setSendingSlug(agent.slug);
    try {
      await sendDirectMessage(agent.slug, text, (line) => {
        setThreads((prev) => ({
          ...prev,
          [agent.slug]: [...(prev[agent.slug] || []), line].slice(-6),
        }));
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Message failed';
      setSendError(message);
      setThreads((prev) => ({
        ...prev,
        [agent.slug]: [...(prev[agent.slug] || []), { role: 'system' as const, text: message }].slice(-6),
      }));
    } finally {
      setSendingSlug(null);
    }
  };

  // 将 agents 按每行 MAX_PER_ROW 分组
  const rows: AgentDef[][] = [];
  for (let i = 0; i < agents.length; i += MAX_PER_ROW) {
    rows.push(agents.slice(i, i + MAX_PER_ROW));
  }

  return (
    <div style={styles.bar}>
      {/* 展开/折叠按钮 */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={styles.toggleBtn}
        title={expanded ? t('status.collapse') : t('status.expand')}
      >
        <span style={{ fontSize: 10 }}>{expanded ? '▼' : '▲'}</span>
        <span style={{ fontSize: 11 }}>
          {expanded ? t('status.collapse_short') : t('status.details')}
        </span>
      </div>

      {/* Agent 卡片网格 */}
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} style={styles.row}>
          {row.map((agent) => {
            const status = statuses[agent.slug] || 'standby';
            const isWorking = status === 'working';
            const totalTokens = tokens[agent.slug] || 0;

            const open = composerOpen(agent.slug);
            const thread = threads[agent.slug] || [];
            return (
              <div
                key={agent.slug}
                style={styles.slot}
                onMouseEnter={() => setHoverSlug(agent.slug)}
                onMouseLeave={() => setHoverSlug((current) => (current === agent.slug ? null : current))}
              >
                {open && (
                  <div
                    style={{ ...styles.popover, borderColor: agent.color }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {menuSlug === agent.slug && (
                      <div style={styles.choiceRow}>
                        <button
                          type="button"
                          style={{ ...styles.choiceBtn, background: agent.color, color: '#111' }}
                          onClick={() => focusComposer(agent.slug)}
                        >
                          {t('bar.message')}
                        </button>
                        <button
                          type="button"
                          style={styles.choiceBtn}
                          onClick={() => openCard(agent)}
                        >
                          {t('bar.openCard')}
                        </button>
                      </div>
                    )}
                    {thread.length > 0 && (
                      <div style={styles.thread}>
                        {thread.map((line, i) => (
                          <div key={i} style={{ color: line.role === 'user' ? '#e4e4e7' : '#f9a8d4' }}>
                            {line.text}
                          </div>
                        ))}
                      </div>
                    )}
                    <form
                      style={styles.compose}
                      onSubmit={(e) => {
                        e.preventDefault();
                        void sendDraft(agent);
                      }}
                    >
                      <input
                        ref={agent.slug === (composeSlug || hoverSlug) ? inputRef : undefined}
                        value={drafts[agent.slug] || ''}
                        onChange={(e) => {
                          setComposeSlug(agent.slug);
                          setDrafts((prev) => ({ ...prev, [agent.slug]: e.target.value }));
                        }}
                        onFocus={() => setComposeSlug(agent.slug)}
                        placeholder={t('chat.inputPrivate', { agent: agent.name })}
                        disabled={sendingSlug === agent.slug}
                        style={styles.composeInput}
                      />
                      <button type="submit" disabled={sendingSlug === agent.slug} style={styles.sendBtn}>
                        {sendingSlug === agent.slug ? '…' : t('chat.send')}
                      </button>
                    </form>
                    {sendError && composeSlug === agent.slug && (
                      <div style={styles.errorLine}>{sendError}</div>
                    )}
                  </div>
                )}
              <div
                onClick={() => setMenuSlug(agent.slug)}
                style={{
                  ...styles.card,
                  opacity: agent.active ? 1 : 0.7,
                  borderColor: isWorking ? agent.color : (agent.active ? '#887755' : '#776655'),
                  boxShadow: isWorking ? `0 0 10px ${agent.color}44` : 'none',
                  cursor: 'pointer',
                }}
              >
                {/* Compact header: portrait + name + status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <img
                    src={getPortraitUrl(agent.slug)}
                    alt=""
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `1.5px solid ${isWorking ? agent.color : '#ec4899'}`,
                      boxShadow: isWorking ? `0 0 6px ${agent.color}` : 'none',
                      flexShrink: 0,
                      background: '#111',
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span style={{ color: agent.color, fontWeight: 'bold', fontSize: '13px' }}>
                    {agent.name}
                  </span>
                  <span style={{
                    color: isWorking ? '#f9a8d4' : '#a1a1aa',
                    fontSize: '11px',
                    fontWeight: isWorking ? 'bold' : 'normal',
                    marginLeft: 'auto',
                  }}>
                    {statusLabel(status)}
                  </span>
                </div>

                {/* 展开时显示的详细信息 */}
                {expanded && (
                  <>
                    <div style={{ color: '#a1a1aa', fontSize: '11px', marginTop: 3, lineHeight: 1.3 }}>
                      {agent.role}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <span style={{ fontSize: '10px', color: agent.active ? '#ec4899' : '#71717a' }}>
                        {agent.active ? '\u25cf' : '\u25cb'}
                      </span>
                      <span style={{ color: agent.active ? '#d4d4d8' : '#71717a', fontSize: '11px' }}>
                        {agent.active ? `${agent.modelDisplay}` : t('config.selectModel')}
                      </span>
                    </div>

                    <div style={{
                      marginTop: 3,
                      paddingTop: 3,
                      borderTop: '1px solid #55442233',
                    }}>
                      {agent.active ? (
                        <span style={{ color: '#f9a8d4', fontSize: '11px' }}>
                          {t('status.tokens', { count: formatTokens(totalTokens) })}
                        </span>
                      ) : (
                        <span style={{ color: '#52525b', fontSize: '11px' }}>
                          {t('config.title')}
                        </span>
                      )}
                    </div>
                  </>
                )}

                {/* 折叠时只显示 token 摘要 */}
                {!expanded && agent.active && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    <span style={{ color: '#f9a8d4', fontSize: '10px' }}>
                      {formatTokens(totalTokens)} tok
                    </span>
                  </div>
                )}
              </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  bar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    pointerEvents: 'auto',
    zIndex: 10,
  },
  slot: {
    position: 'relative',
    flex: '0 0 auto',
  },
  popover: {
    position: 'absolute' as const,
    left: 0,
    bottom: 'calc(100% - 6px)',
    width: 280,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
    padding: 8,
    background: 'rgba(10, 10, 14, 0.96)',
    border: '1.5px solid #ec4899',
    borderRadius: 10,
    boxShadow: '0 10px 28px rgba(0,0,0,0.45)',
    zIndex: 20,
  },
  choiceRow: {
    display: 'flex',
    gap: 6,
  },
  choiceBtn: {
    flex: 1,
    border: '1px solid #3f3f46',
    background: '#27272a',
    color: '#fafafa',
    borderRadius: 6,
    padding: '6px 8px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'system-ui, sans-serif',
  },
  thread: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    maxHeight: 96,
    overflowY: 'auto' as const,
    fontSize: 11,
    lineHeight: 1.35,
    fontFamily: 'system-ui, sans-serif',
  },
  compose: {
    display: 'flex',
    gap: 6,
  },
  composeInput: {
    flex: 1,
    minWidth: 0,
    background: '#18181b',
    color: '#fafafa',
    border: '1px solid #3f3f46',
    borderRadius: 6,
    padding: '6px 8px',
    fontSize: 12,
    fontFamily: 'system-ui, sans-serif',
  },
  sendBtn: {
    border: 'none',
    background: '#ec4899',
    color: '#fff',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  errorLine: {
    color: '#fca5a5',
    fontSize: 11,
  },
  toggleBtn: {
    alignSelf: 'flex-end',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(10, 10, 14, 0.9)',
    border: '1px solid #3f3f46',
    borderRadius: 8,
    padding: '3px 10px',
    fontFamily: 'system-ui, sans-serif',
    color: '#f9a8d4',
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
  row: {
    display: 'flex',
    gap: 4,
  },
  card: {
    flex: '0 0 auto',
    width: 160,
    display: 'flex',
    flexDirection: 'column' as const,
    background: 'rgba(10, 10, 14, 0.94)',
    border: '1.5px solid #3f3f46',
    borderRadius: 10,
    padding: '6px 8px',
    fontFamily: 'system-ui, sans-serif',
    boxSizing: 'border-box' as const,
  },
};
