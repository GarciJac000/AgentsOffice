import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { DESK_SPOTS, POIS, ROOMS, type Spot3D } from './rooms';
import { getAgentsCached } from '../shared/agentRegistry';
import { EventBus } from '../shared/events/EventBus';
import { t } from '../shared/i18n';

export interface Agent3D {
  id: string;
  slug: string;
  name: string;
  color: number;
  homeRoom: string;
  currentRoom: string;
  group: THREE.Group;
  sprite: THREE.Sprite;
  label: CSS2DObject;
  bubble?: CSS2DObject;
  isMoving: boolean;
  atShame: boolean;
  working: boolean;
  target: THREE.Vector3 | null;
  path: THREE.Vector3[];
  speed: number;
  bobPhase: number;
  baseScale: THREE.Vector3;
}

const AGENT_HEIGHT = 2.25;

function cssToHex(css: string): number {
  return parseInt(css.replace('#', ''), 16);
}

function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${path.replace(/^\//, '')}`;
}

function makeNamePill(name: string): CSS2DObject {
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
  obj.position.set(0, AGENT_HEIGHT + 0.18, 0);
  return obj;
}

function makeBubble(text: string): CSS2DObject {
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
  obj.position.set(0, AGENT_HEIGHT + 0.55, 0);
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

/** Build a camera-facing PRIM8 character billboard from cutout PNG. */
function buildAgentBillboard(texture: THREE.Texture, accent: number): {
  group: THREE.Group;
  sprite: THREE.Sprite;
  baseScale: THREE.Vector3;
} {
  const group = new THREE.Group();

  const img = texture.image as { width: number; height: number };
  const aspect = (img?.width || 682) / (img?.height || 1024);

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    alphaTest: 0.08,
    sizeAttenuation: true,
  });
  const sprite = new THREE.Sprite(mat);
  const height = AGENT_HEIGHT;
  const width = height * aspect;
  sprite.scale.set(width, height, 1);
  // Sprite center is midpoint — lift so feet sit on floor
  sprite.position.y = height / 2;
  sprite.center.set(0.5, 0.5);
  sprite.renderOrder = 10;
  group.add(sprite);

  // Soft contact shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 24),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  // Tiny accent ring so agents pop on wood floor
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.4, 0.46, 24),
    new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.025;
  group.add(ring);

  return { group, sprite, baseScale: sprite.scale.clone() };
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
  private textures = new Map<string, THREE.Texture>();

  constructor(scene: THREE.Scene, labelRoot: THREE.Object3D) {
    this.scene = scene;
    this.labelRoot = labelRoot;
  }

  async create() {
    for (const room of Object.values(ROOMS)) {
      this.labelRoot.add(makeRoomLabel(t(room.labelKey), room.labelPos));
    }

    const entries = getAgentsCached();
    const loader = new THREE.TextureLoader();

    await Promise.all(
      entries.map(
        (a) =>
          new Promise<void>((resolve) => {
            const url = assetUrl(`assets/agents/${a.slug}.png`);
            loader.load(
              url,
              (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.anisotropy = 8;
                this.textures.set(a.slug, tex);
                resolve();
              },
              undefined,
              () => {
                console.warn('[PRIM8] missing agent sprite', url);
                resolve();
              },
            );
          }),
      ),
    );

    entries.forEach((a, idx) => {
      const spawn = SPAWNS[idx % SPAWNS.length];
      const color = cssToHex(a.color);
      const tex = this.textures.get(a.slug);
      if (!tex) return;

      const { group, sprite, baseScale } = buildAgentBillboard(tex, color);
      group.position.set(spawn.x, 0, spawn.z);
      group.name = a.phaserAgentId || `agt_${a.slug}`;
      this.scene.add(group);

      const label = makeNamePill(a.displayName);
      group.add(label);

      group.traverse((o) => {
        o.userData.agentId = a.phaserAgentId || `agt_${a.slug}`;
        o.userData.agentName = a.displayName;
        o.userData.isAgent = true;
      });

      this.agents.push({
        id: a.phaserAgentId || `agt_${a.slug}`,
        slug: a.slug,
        name: a.displayName,
        color,
        homeRoom: a.roomId || 'workspace',
        currentRoom: a.roomId || 'workspace',
        group,
        sprite,
        label,
        isMoving: false,
        atShame: false,
        working: false,
        target: null,
        path: [],
        speed: 1.8,
        bobPhase: Math.random() * Math.PI * 2,
        baseScale,
      });
    });

    EventBus.on('chat:agent-move', this.onMove);
    EventBus.on('chat:agent-bubble', this.onBubble);
    EventBus.on('agent:status', this.onStatus);
  }

  dispose() {
    EventBus.off('chat:agent-move', this.onMove);
    EventBus.off('chat:agent-bubble', this.onBubble);
    EventBus.off('agent:status', this.onStatus);
    for (const tex of this.textures.values()) tex.dispose();
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
    const sprites = this.agents.map((a) => a.sprite);
    const hits = this.raycaster.intersectObjects(sprites, false);
    if (!hits.length) return null;
    const id = hits[0].object.userData.agentId as string | undefined;
    return this.agents.find((a) => a.id === id) || null;
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
    const bubble = makeBubble(text);
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

      // Idle breathing / walk bounce on the billboard
      const bounce = agent.isMoving
        ? Math.abs(Math.sin(agent.bobPhase)) * 0.06
        : Math.sin(agent.bobPhase) * 0.012;
      agent.group.position.y = bounce;

      const squash = agent.isMoving ? 1 + Math.sin(agent.bobPhase * 2) * 0.03 : 1;
      agent.sprite.scale.set(
        agent.baseScale.x * (agent.isMoving ? 1 / squash : 1),
        agent.baseScale.y * squash,
        1,
      );

      // Working: subtle "typing" scale pulse
      if (agent.working && !agent.isMoving) {
        const pulse = 1 + Math.sin(agent.bobPhase * 3) * 0.015;
        agent.sprite.scale.set(agent.baseScale.x * pulse, agent.baseScale.y * pulse, 1);
      }

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
