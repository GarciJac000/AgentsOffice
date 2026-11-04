import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { DESK_SPOTS, POIS, ROOMS, type Spot3D } from './rooms';
import { getAgentsCached } from '../shared/agentRegistry';
import { EventBus } from '../shared/events/EventBus';
import { t } from '../shared/i18n';
import { animateAvatar, createAvatar, type AvatarParts } from './avatars';

export interface Agent3D {
  id: string;
  slug: string;
  name: string;
  color: number;
  homeRoom: string;
  currentRoom: string;
  group: THREE.Group;
  parts: AvatarParts;
  label: CSS2DObject;
  bubble?: CSS2DObject;
  isMoving: boolean;
  atShame: boolean;
  working: boolean;
  target: THREE.Vector3 | null;
  path: THREE.Vector3[];
  speed: number;
  bobPhase: number;
  facing: number;
}

function cssToHex(css: string): number {
  return parseInt(css.replace('#', ''), 16);
}

function makeNamePill(name: string, height: number): CSS2DObject {
  const el = document.createElement('div');
  el.textContent = name;
  el.style.cssText = `
    background: #fff;
    color: #111;
    font: 700 11px system-ui, sans-serif;
    padding: 3px 10px;
    border-radius: 999px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.22);
    white-space: nowrap;
    border-bottom: 2px solid #ec4899;
    pointer-events: none;
    user-select: none;
  `;
  const obj = new CSS2DObject(el);
  obj.position.set(0, height + 0.22, 0);
  return obj;
}

function makeBubble(text: string, height: number): CSS2DObject {
  const el = document.createElement('div');
  el.textContent = text.length > 48 ? text.slice(0, 45) + '…' : text;
  el.style.cssText = `
    background: rgba(10,10,14,0.94);
    color: #f9a8d4;
    font: 600 12px system-ui, sans-serif;
    padding: 8px 12px;
    border-radius: 10px;
    border: 1px solid #ec4899;
    max-width: 180px;
    box-shadow: 0 8px 24px rgba(236,72,153,0.2);
    pointer-events: none;
  `;
  const obj = new CSS2DObject(el);
  obj.position.set(0, height + 0.55, 0);
  return obj;
}

function makeRoomLabel(text: string, pos: Spot3D): CSS2DObject {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText = `
    color: #ec4899;
    font: 700 12px system-ui, sans-serif;
    text-shadow: 0 1px 3px rgba(0,0,0,0.45);
    letter-spacing: 0.4px;
    pointer-events: none;
    opacity: 0.9;
  `;
  const obj = new CSS2DObject(el);
  obj.position.set(pos.x, 0.05, pos.z);
  return obj;
}

const SPAWNS: Spot3D[] = [
  { x: 0, z: -4.5 },
  { x: -6, z: -2 },
  { x: -1.6, z: 0.5 },
  { x: 1.6, z: 0.5 },
  { x: 5.5, z: 4.5 },
  { x: 5.5, z: -4.2 },
  { x: -1.6, z: 2.4 },
  { x: 1.6, z: 2.4 },
  { x: 6, z: 5.2 },
  { x: -2, z: -4.5 },
];

export class AgentManager {
  agents: Agent3D[] = [];
  private scene: THREE.Scene;
  private labelRoot: THREE.Object3D;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private bubbleTimers = new Map<string, number>();
  private wanderAcc = 0;

  constructor(scene: THREE.Scene, labelRoot: THREE.Object3D) {
    this.scene = scene;
    this.labelRoot = labelRoot;
  }

  async create() {
    for (const room of Object.values(ROOMS)) {
      this.labelRoot.add(makeRoomLabel(t(room.labelKey), room.labelPos));
    }

    const entries = getAgentsCached();
    entries.forEach((a, idx) => {
      const spawn = SPAWNS[idx % SPAWNS.length];
      const color = cssToHex(a.color);
      const parts = createAvatar(a.slug);
      const group = parts.root;
      group.position.set(spawn.x, 0, spawn.z);
      // Face toward room center / desks so 3D silhouette varies
      const faceX = -spawn.x * 0.15;
      const faceZ = -spawn.z * 0.15 - 1;
      group.rotation.y = Math.atan2(faceX - 0, faceZ - 0) + (idx % 3 - 1) * 0.4;
      group.name = a.phaserAgentId || `agt_${a.slug}`;
      this.scene.add(group);

      const label = makeNamePill(a.displayName, parts.height);
      group.add(label);

      group.traverse((o) => {
        o.userData.agentId = a.phaserAgentId || `agt_${a.slug}`;
        o.userData.agentName = a.displayName;
        o.userData.isAgent = true;
      });

      const agent: Agent3D = {
        id: a.phaserAgentId || `agt_${a.slug}`,
        slug: a.slug,
        name: a.displayName,
        color,
        homeRoom: a.roomId || 'workspace',
        currentRoom: a.roomId || 'workspace',
        group,
        parts,
        label,
        isMoving: false,
        atShame: false,
        working: false,
        target: null,
        path: [],
        speed: 1.8,
        bobPhase: Math.random() * Math.PI * 2,
        facing: group.rotation.y,
      };
      this.agents.push(agent);

      // Kick off a short intro walk so 3D limbs are obvious on load
      if (idx % 2 === 0) {
        const room = ROOMS[agent.homeRoom];
        if (room) {
          const spot = room.spots[(idx + 1) % room.spots.length];
          this.setPath(agent, [new THREE.Vector3(spot.x, 0, spot.z)]);
        }
      }
    });

    EventBus.on('chat:agent-move', this.onMove);
    EventBus.on('chat:agent-bubble', this.onBubble);
    EventBus.on('agent:status', this.onStatus);
  }

  dispose() {
    EventBus.off('chat:agent-move', this.onMove);
    EventBus.off('chat:agent-bubble', this.onBubble);
    EventBus.off('agent:status', this.onStatus);
  }

  private onMove = (data: { agentId: string; roomId: string }) => {
    this.moveAgentToRoom(data.agentId, data.roomId);
  };

  private onBubble = (data: { agentSlug: string; text: string; duration?: number }) => {
    this.showBubble(data.agentSlug, data.text, data.duration ?? 4000);
  };

  private onStatus = (data: { agentSlug: string; status: string }) => {
    const agent = this.agents.find((a) => a.slug === data.agentSlug);
    if (!agent) return;
    if (data.status === 'working' || data.status === 'running') {
      this.moveToDesk(agent);
    } else if (data.status === 'error') {
      agent.working = false;
      agent.atShame = true;
      this.showBubble(agent.slug, '🐛 ...', 4000);
      this.setPath(agent, [new THREE.Vector3(-7.2, 0, -5.5)]);
    } else {
      agent.working = false;
      agent.atShame = false;
    }
  };

  pickAgent(clientX: number, clientY: number, camera: THREE.Camera, dom: HTMLElement) {
    const rect = dom.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, camera);
    const roots = this.agents.map((a) => a.group);
    const hits = this.raycaster.intersectObjects(roots, true);
    if (!hits.length) return null;
    let obj: THREE.Object3D | null = hits[0].object;
    while (obj) {
      if (obj.userData.agentId) {
        return this.agents.find((a) => a.id === obj!.userData.agentId) || null;
      }
      obj = obj.parent;
    }
    return null;
  }

  moveAgentToRoom(agentId: string, roomId: string) {
    const agent = this.agents.find((a) => a.id === agentId);
    const room = ROOMS[roomId];
    if (!agent || !room) return;
    const used = this.agents.filter((a) => a.currentRoom === roomId && a.id !== agentId).length;
    const spot = room.spots[used % room.spots.length];
    agent.currentRoom = roomId;
    this.setPath(agent, [
      new THREE.Vector3(room.entry.x, 0, room.entry.z),
      new THREE.Vector3(spot.x, 0, spot.z),
    ]);
  }

  private moveToDesk(agent: Agent3D) {
    const same = DESK_SPOTS.filter((d) => d.room === agent.currentRoom);
    const list = same.length ? same : DESK_SPOTS;
    let best = list[0];
    let bestD = Infinity;
    for (const d of list) {
      const dx = d.x - agent.group.position.x;
      const dz = d.z - agent.group.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < bestD) {
        bestD = dist;
        best = d;
      }
    }
    agent.currentRoom = best.room;
    agent.working = true;
    this.setPath(agent, [new THREE.Vector3(best.x, 0, best.z)]);
  }

  private setPath(agent: Agent3D, points: THREE.Vector3[]) {
    agent.path = points;
    agent.isMoving = true;
    agent.target = points[0] || null;
  }

  showBubble(slug: string, text: string, duration: number) {
    const agent = this.agents.find((a) => a.slug === slug);
    if (!agent) return;
    if (agent.bubble) {
      agent.group.remove(agent.bubble);
      agent.bubble.element.remove();
      agent.bubble = undefined;
    }
    const bubble = makeBubble(text, agent.parts.height);
    agent.group.add(bubble);
    agent.bubble = bubble;
    const prev = this.bubbleTimers.get(slug);
    if (prev) window.clearTimeout(prev);
    this.bubbleTimers.set(
      slug,
      window.setTimeout(() => {
        if (agent.bubble) {
          agent.group.remove(agent.bubble);
          agent.bubble.element.remove();
          agent.bubble = undefined;
        }
      }, duration),
    );
  }

  update(dt: number) {
    this.wanderAcc += dt;
    if (this.wanderAcc > 5) {
      this.wanderAcc = 0;
      this.idleWander();
    }

    for (const agent of this.agents) {
      agent.bobPhase += dt * (agent.isMoving ? 11 : 2.2);
      animateAvatar(agent.parts, dt, agent.bobPhase, agent.isMoving, agent.working);

      // Smooth facing toward movement
      const faceDiff = ((agent.facing - agent.group.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      agent.group.rotation.y += faceDiff * Math.min(1, dt * 8);

      if (!agent.target) continue;

      const pos = agent.group.position;
      const target = agent.target;
      const dx = target.x - pos.x;
      const dz = target.z - pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.05) {
        pos.x = target.x;
        pos.z = target.z;
        agent.path.shift();
        agent.target = agent.path[0] || null;
        if (!agent.target) agent.isMoving = false;
        continue;
      }
      const step = Math.min(dist, agent.speed * dt);
      pos.x += (dx / dist) * step;
      pos.z += (dz / dist) * step;
      agent.facing = Math.atan2(dx, dz);
    }
  }

  private idleWander() {
    for (const agent of this.agents) {
      if (agent.isMoving || agent.working || agent.atShame) continue;
      if (Math.random() > 0.28) continue;
      if (Math.random() < 0.2) {
        const poi = POIS[Math.floor(Math.random() * POIS.length)];
        this.setPath(agent, [new THREE.Vector3(poi.x, 0, poi.z)]);
      } else {
        const room = ROOMS[agent.currentRoom];
        if (!room) continue;
        const spot = room.spots[Math.floor(Math.random() * room.spots.length)];
        this.setPath(agent, [new THREE.Vector3(spot.x, 0, spot.z)]);
      }
    }
  }
}
