/**
 * Mock PRIM8 office data.
 * Swap this module (or its fetch) for a real backend later —
 * consumers only depend on these types + `getMockOffice()`.
 */

export type AgentStatus = 'idle' | 'working' | 'blocked' | 'done';

export interface ActivityLogEntry {
  id: string;
  at: string;
  text: string;
}

export interface ChatStubMessage {
  id: string;
  from: 'user' | 'agent';
  text: string;
  at: string;
}

export interface RoomDef {
  id: string;
  name: string;
  /** World-space center of the room floor */
  position: [number, number, number];
  /** Floor size [width, depth] */
  size: [number, number];
  /** Soft clay wall / floor tint */
  color: string;
  description: string;
}

export interface AgentDef {
  id: string;
  name: string;
  role: string;
  roomId: string;
  status: AgentStatus;
  /** Distinct clay skin + outfit accents */
  skin: string;
  hair: string;
  outfit: string;
  accent: string;
  /** Local offset inside the room */
  offset: [number, number, number];
  activity: string;
  log: ActivityLogEntry[];
  chat: ChatStubMessage[];
}

export interface OfficeMock {
  officeName: string;
  brand: {
    primary: string;
    secondary: string;
    accent: string;
  };
  rooms: RoomDef[];
  agents: AgentDef[];
}

const now = Date.now();
const iso = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString();

export const MOCK_OFFICE: OfficeMock = {
  officeName: 'PRIM8 Productions',
  brand: {
    primary: '#0B0C0E',
    secondary: '#F4F3EF',
    accent: '#ec4899',
  },
  // Campus layout: north wing (3) + south wing (2) around a shared atrium
  rooms: [
    {
      id: 'corner-office',
      name: 'Corner Office',
      position: [-6.2, 0, -4.4],
      size: [5.2, 4.6],
      color: '#e8d5c0',
      description: 'A&R corner overlooking the studio floor',
    },
    {
      id: 'catalog',
      name: 'Catalog Desk',
      position: [0, 0, -4.4],
      size: [5.2, 4.6],
      color: '#dcc9b4',
      description: 'Shelves of songs, masters, and rights binders',
    },
    {
      id: 'screening',
      name: 'Screening Room',
      position: [6.2, 0, -4.4],
      size: [5.2, 4.8],
      color: '#2a3040',
      description: 'Storyboard wall + large playback monitor',
    },
    {
      id: 'recording',
      name: 'Recording Studio',
      position: [-4.8, 0, 4.0],
      size: [5.8, 5.0],
      color: '#4a3030',
      description: 'Mixing board, booth glass, warm foam walls',
    },
    {
      id: 'war-room',
      name: 'War Room',
      position: [4.8, 0, 4.0],
      size: [5.8, 5.0],
      color: '#d5c4ae',
      description: 'Whiteboard + social numbers screen',
    },
  ],
  agents: [
    {
      id: 'aria',
      name: 'Aria',
      role: 'A&R Manager',
      roomId: 'corner-office',
      status: 'working',
      skin: '#e8b89a',
      hair: '#2c1810',
      outfit: '#1a3a5c',
      accent: '#4ade80',
      offset: [0.4, 0, 0.6],
      activity: 'Reviewing demo submissions for next quarter',
      log: [
        { id: 'a1', at: iso(42), text: 'Opened 6 new demo links from scouts' },
        { id: 'a2', at: iso(28), text: 'Flagged 2 artists for A&R callback' },
        { id: 'a3', at: iso(9), text: 'Drafting note on vocal range fit' },
      ],
      chat: [
        { id: 'ac1', from: 'user', text: 'Any standouts this week?', at: iso(15) },
        {
          id: 'ac2',
          from: 'agent',
          text: 'Two — one indie R&B act and a producer with sticky hooks. Want the brief?',
          at: iso(14),
        },
      ],
    },
    {
      id: 'simone',
      name: 'Simone',
      role: 'Catalog Manager',
      roomId: 'catalog',
      status: 'idle',
      skin: '#f0c4a8',
      hair: '#6b3a2a',
      outfit: '#f472b6',
      accent: '#f472b6',
      offset: [-0.3, 0, 0.2],
      activity: 'Waiting on cleared masters metadata',
      log: [
        { id: 's1', at: iso(55), text: 'Reconciled rights sheet for “Night Drive”' },
        { id: 's2', at: iso(33), text: 'Shelved three masters pending ISRC' },
        { id: 's3', at: iso(12), text: 'Idle — queue empty until legal reply' },
      ],
      chat: [
        { id: 'sc1', from: 'user', text: 'Status on the catalog audit?', at: iso(20) },
        {
          id: 'sc2',
          from: 'agent',
          text: '92% tagged. Blocked on two masters without clearances.',
          at: iso(19),
        },
      ],
    },
    {
      id: 'spike',
      name: 'Spike',
      role: 'Music Video Director',
      roomId: 'screening',
      status: 'blocked',
      skin: '#d4a574',
      hair: '#1a1a1a',
      outfit: '#7c3aed',
      accent: '#a78bfa',
      offset: [0.2, 0, -0.4],
      activity: 'Blocked — waiting on location permit for shoot day 2',
      log: [
        { id: 'p1', at: iso(70), text: 'Pinned storyboard frames 4–9 on the wall' },
        { id: 'p2', at: iso(40), text: 'Cut a rough playback for the chorus' },
        { id: 'p3', at: iso(6), text: 'Blocked on city permit confirmation' },
      ],
      chat: [
        { id: 'pc1', from: 'user', text: 'Can we shoot interiors first?', at: iso(8) },
        {
          id: 'pc2',
          from: 'agent',
          text: 'Yes — flipping day 2 to warehouse B while permits clear.',
          at: iso(7),
        },
      ],
    },
    {
      id: 'dre',
      name: 'Dre',
      role: 'Music Production',
      roomId: 'recording',
      status: 'working',
      skin: '#c68642',
      hair: '#111111',
      outfit: '#2563eb',
      accent: '#60a5fa',
      offset: [0.8, 0, 0.1],
      activity: 'Balancing vocal ride on mix bus',
      log: [
        { id: 'd1', at: iso(50), text: 'Comp’d lead vocal takes 3–7' },
        { id: 'd2', at: iso(22), text: 'Dialed parallel compression on drums' },
        { id: 'd3', at: iso(4), text: 'Riding vocal automation through bridge' },
      ],
      chat: [
        { id: 'dc1', from: 'user', text: 'How’s the mix sounding?', at: iso(10) },
        {
          id: 'dc2',
          from: 'agent',
          text: 'Chorus hits hard. Softening the 2k harshness next.',
          at: iso(9),
        },
      ],
    },
    {
      id: 'shakir',
      name: 'Shakir',
      role: 'Promotion Strategy',
      roomId: 'war-room',
      status: 'done',
      skin: '#e0b090',
      hair: '#3d2314',
      outfit: '#0f766e',
      accent: '#2dd4bf',
      offset: [-0.5, 0, 0.5],
      activity: 'Campaign brief shipped to partners',
      log: [
        { id: 'h1', at: iso(80), text: 'Mapped TikTok / IG / playlist push windows' },
        { id: 'h2', at: iso(35), text: 'Whiteboard’d week-of creative angles' },
        { id: 'h3', at: iso(3), text: 'Marked promo pack done — sent to partners' },
      ],
      chat: [
        { id: 'hc1', from: 'user', text: 'Promo pack ready?', at: iso(5) },
        {
          id: 'hc2',
          from: 'agent',
          text: 'Done. Assets + calendar + talking points in the shared folder.',
          at: iso(4),
        },
      ],
    },
  ],
};

/** Clean async seam for a future API. */
export async function getMockOffice(): Promise<OfficeMock> {
  return MOCK_OFFICE;
}

export function getAgentById(id: string): AgentDef | undefined {
  return MOCK_OFFICE.agents.find((a) => a.id === id);
}

export function getRoomById(id: string): RoomDef | undefined {
  return MOCK_OFFICE.rooms.find((r) => r.id === id);
}

export const STATUS_META: Record<
  AgentStatus,
  { label: string; color: string; icon: string }
> = {
  idle: { label: 'Idle', color: '#94a3b8', icon: '…' },
  working: { label: 'Working', color: '#4ade80', icon: '✎' },
  blocked: { label: 'Blocked', color: '#f87171', icon: '!' },
  done: { label: 'Done', color: '#38bdf8', icon: '✓' },
};
