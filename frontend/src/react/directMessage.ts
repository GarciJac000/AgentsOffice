import { EventBus } from '../shared/events/EventBus';

interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
}

async function streamChat(
  url: string,
  body: Record<string, unknown>,
  onEvent: (event: SSEEvent) => void,
): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    throw new Error(`API error: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    let currentEvent = '';
    let currentData = '';
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        currentData = line.slice(6);
      } else if (line === '' && currentEvent && currentData) {
        try {
          onEvent({ type: currentEvent, data: JSON.parse(currentData) as Record<string, unknown> });
        } catch {
          // ignore malformed SSE frames
        }
        currentEvent = '';
        currentData = '';
      }
    }
  }
}

export interface DirectReply {
  role: 'user' | 'agent' | 'system';
  text: string;
}

const histories: Record<string, { role: string; content: string }[]> = {};

/** Direct-message one agent. Replies also surface as the in-office speech bubble. */
export async function sendDirectMessage(
  slug: string,
  message: string,
  onReply: (line: DirectReply) => void,
): Promise<void> {
  const trimmed = message.trim();
  if (!trimmed) return;

  const history = histories[slug] || [];
  history.push({ role: 'user', content: trimmed });
  histories[slug] = history;
  onReply({ role: 'user', text: trimmed });

  EventBus.emit('agent:status', { agentSlug: slug, status: 'working' });
  try {
    await streamChat(
      '/api/v1/office/chat/direct/stream',
      {
        message: trimmed,
        history: history.slice(-10),
        agent_slug: slug,
      },
      (event) => {
        const data = event.data;
        const content = typeof data.content === 'string' ? data.content : '';
        const agentSlug = typeof data.agent_slug === 'string' ? data.agent_slug : slug;
        if (event.type === 'message' || event.type === 'routing' || event.type === 'process') {
          if (content) {
            onReply({ role: 'agent', text: content });
            EventBus.emit('chat:agent-bubble', {
              agentSlug,
              text: content,
              duration: 10000,
            });
          }
          if (event.type === 'message') {
            history.push({ role: 'assistant', content });
            const usage = data.usage as { total_tokens?: number } | undefined;
            if (usage?.total_tokens) {
              EventBus.emit('agent:token-usage', {
                agentSlug,
                tokens: usage.total_tokens,
              });
            }
          }
          EventBus.emit('agent:status', { agentSlug, status: 'working' });
        } else if (event.type === 'error') {
          onReply({ role: 'system', text: content || 'Message failed' });
        } else if (event.type === 'done') {
          EventBus.emit('agent:status', { agentSlug, status: 'idle' });
          EventBus.emit('chat:round-complete');
        }
      },
    );
  } finally {
    EventBus.emit('agent:status', { agentSlug: slug, status: 'idle' });
  }
}
