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
  label: CSS2DObject;
  bubble?: CSS2DObject;
  isMoving: boolean;
  atShame: boolean;
  working: boolean;
  target: THREE.Vector3 | null;
  path: THREE.Vector3[];
  speed: number;
  bobPhase: number;
}

const HAIR: Record<string, number> = {
  jarvis: 0xec4899,
  aria: 0x22c55e,
  simone: 0xf472b6,
  spike: 0xa78bfa,
  dre: 0x60a5fa,
  shakir: 0x2dd4bf,
  echo: 0x22d3ee,
  data_engineer: 0x94a3b8,
  dispatcher: 0xc99b54,
};

const SKIN_TONES: Record<string, number> = {
  jarvis: 0x5c3a21,
  aria: 0xc68642,
  simone: 0x8d5524,
  spike: 0xf1c27d,
  dre: 0xc68642,
  shakir: 0x8d5524,
  echo: 0xffdbac,
  data_engineer: 0xe0ac69,
  dispatcher: 0xffdbac,
};

function cssToHex(css: string): number {
  return parseInt(css.replace('#', ''), 16);
}

function mat(color: number, opts: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, ...opts });
}

/** Skydive-meets-PRIM8 stylized agent: black streetwear body + distinctive head/hair. */
function buildAgentMesh(slug: string, accent: number): THREE.Group {
  const g = new THREE.Group();
  const skin = SKIN_TONES[slug] ?? 0xe0ac69;
  const hair = HAIR[slug] ?? accent;

  // Legs
  const legGeo = new THREE.CapsuleGeometry(0.09, 0.28, 4, 8);
  const pant = mat(0x1a1a1e);
  const leftLeg = new THREE.Mesh(legGeo, pant);
  leftLeg.position.set(-0.1, 0.28, 0);
  leftLeg.castShadow = true;
  const rightLeg = new THREE.Mesh(legGeo, pant);
  rightLeg.position.set(0.1, 0.28, 0);
  rightLeg.castShadow = true;
  g.add(leftLeg, rightLeg);

  // Shoes
  for (const sx of [-0.1, 0.1]) {
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.22), mat(0x0a0a0c));
    shoe.position.set(sx, 0.05, 0.02);
    shoe.castShadow = true;
    g.add(shoe);
  }

  // Torso hoodie
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.35, 6, 10), mat(0x141418));
  torso.position.y = 0.78;
  torso.castShadow = true;
  g.add(torso);

  // PRIM8 chest badge
  const badge = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.06, 0.02),
    mat(0xffffff, { emissive: 0xec4899, emissiveIntensity: 0.25 }),
  );
  badge.position.set(0, 0.88, 0.22);
  g.add(badge);

  // Arms
  const armGeo = new THREE.CapsuleGeometry(0.07, 0.28, 4, 8);
  const leftArm = new THREE.Mesh(armGeo, mat(0x141418));
  leftArm.position.set(-0.3, 0.78, 0);
  leftArm.rotation.z = 0.2;
  leftArm.castShadow = true;
  const rightArm = new THREE.Mesh(armGeo, mat(0x141418));
  rightArm.position.set(0.3, 0.78, 0);
  rightArm.rotation.z = -0.2;
  rightArm.castShadow = true;
  g.add(leftArm, rightArm);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), mat(skin));
  head.position.y = 1.28;
  head.castShadow = true;
  g.add(head);

  // Hair / beanie / cap variants by slug
  if (slug === 'echo' || slug === 'dre') {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
      mat(0x111113),
    );
    cap.position.y = 1.36;
    g.add(cap);
  } else if (slug === 'shakir') {
    const beanie = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.6),
      mat(0x1f1f23),
    );
    beanie.position.y = 1.38;
    g.add(beanie);
  } else if (slug === 'aria' || slug === 'simone') {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), mat(hair));
    bun.position.set(0, 1.52, -0.02);
    bun.castShadow = true;
    g.add(bun);
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
      mat(0x1a1a1a),
    );
    hairCap.position.y = 1.36;
    g.add(hairCap);
  } else {
    const hairMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
      mat(hair),
    );
    hairMesh.position.y = 1.38;
    hairMesh.castShadow = true;
    g.add(hairMesh);
  }

  g.userData.leftArm = leftArm;
  g.userData.rightArm = rightArm;
  g.userData.leftLeg = leftLeg;
  g.userData.rightLeg = rightLeg;
  return g;
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
    box-shadow: 0 4px 14px rgba(0,0,0,0.18);
    white-space: nowrap;
    border-bottom: 2px solid #ec4899;
    pointer-events: none;
    user-select: none;
  `;
  const obj = new CSS2DObject(el);
  obj.position.set(0, 1.75, 0);
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
  obj.position.set(0, 2.15, 0);
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

  create() {
    // Room labels
    for (const room of Object.values(ROOMS)) {
      this.labelRoot.add(makeRoomLabel(t(room.labelKey), room.labelPos));
    }

    const entries = getAgentsCached();
    entries.forEach((a, idx) => {
      const spawn = SPAWNS[idx % SPAWNS.length];
      const color = cssToHex(a.color);
      const mesh = buildAgentMesh(a.slug, color);
      mesh.position.set(spawn.x, 0, spawn.z);
      mesh.name = a.phaserAgentId || `agt_${a.slug}`;
      this.scene.add(mesh);

      const label = makeNamePill(a.displayName);
      mesh.add(label);

      // Click proxy
      mesh.traverse((o) => {
        o.userData.agentId = a.phaserAgentId || `agt_${a.slug}`;
        o.userData.agentName = a.displayName;
      });

      this.agents.push({
        id: a.phaserAgentId || `agt_${a.slug}`,
        slug: a.slug,
        name: a.displayName,
        color,
        homeRoom: a.roomId || 'workspace',
        currentRoom: a.roomId || 'workspace',
        group: mesh,
        label,
        isMoving: false,
        atShame: false,
        working: false,
        target: null,
        path: [],
        speed: 1.8,
        bobPhase: Math.random() * Math.PI * 2,
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
    const meshes = this.agents.map((a) => a.group);
    const hits = this.raycaster.intersectObjects(meshes, true);
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
      agent.bobPhase += dt * (agent.isMoving ? 10 : 2);
      const breathe = Math.sin(agent.bobPhase) * 0.015;
      agent.group.position.y = breathe;

      // Walk cycle
      const armSwing = agent.isMoving ? Math.sin(agent.bobPhase) * 0.45 : 0;
      const leftArm = agent.group.userData.leftArm as THREE.Mesh | undefined;
      const rightArm = agent.group.userData.rightArm as THREE.Mesh | undefined;
      if (leftArm) leftArm.rotation.x = armSwing;
      if (rightArm) rightArm.rotation.x = -armSwing;

      if (!agent.target) {
        if (agent.working) {
          // Typing bob on arms
          if (rightArm) rightArm.rotation.x = -0.6 + Math.sin(agent.bobPhase * 2) * 0.15;
        }
        continue;
      }

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
      agent.group.rotation.y = Math.atan2(dx, dz);
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
