import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import type { Collider } from './buildCinematicWorkspace';
import { ROOM_SIZE } from './rooms';

export type ViewMode = 'overhead' | 'fps';

const EYE_HEIGHT = 1.65;
const MOVE_SPEED = 3.4;
const TOUCH_SPEED = 2.8;

export class PlayerControls {
  mode: ViewMode = 'overhead';
  private fpsCamera: THREE.PerspectiveCamera;
  private orthoCamera: THREE.OrthographicCamera;
  private controls: PointerLockControls;
  private keys = new Set<string>();
  private velocity = new THREE.Vector3();
  private colliders: Collider[] = [];
  private touchMove = new THREE.Vector2(0, 0);
  private touchLook = new THREE.Vector2(0, 0);
  private touchIdMove: number | null = null;
  private touchIdLook: number | null = null;
  private touchOriginMove = new THREE.Vector2();
  private touchOriginLook = new THREE.Vector2();
  private hud: HTMLElement | null = null;
  private enabled = true;
  private panX = 0;
  private panZ = 0;
  private zoom = 1;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private downX = 0;
  private downY = 0;
  private onAgentClick?: (x: number, y: number) => void;
  private bound = false;
  private container: HTMLElement;
  private dom: HTMLElement;

  constructor(
    container: HTMLElement,
    dom: HTMLElement,
    fpsCamera: THREE.PerspectiveCamera,
    orthoCamera: THREE.OrthographicCamera,
  ) {
    this.container = container;
    this.dom = dom;
    this.fpsCamera = fpsCamera;
    this.orthoCamera = orthoCamera;
    this.controls = new PointerLockControls(fpsCamera, dom);
    fpsCamera.position.set(0, EYE_HEIGHT, 3.5);
  }

  setColliders(colliders: Collider[]) {
    this.colliders = colliders;
  }

  setAgentClickHandler(fn: (x: number, y: number) => void) {
    this.onAgentClick = fn;
  }

  get activeCamera(): THREE.Camera {
    return this.mode === 'fps' ? this.fpsCamera : this.orthoCamera;
  }

  getPan() {
    return { x: this.panX, z: this.panZ, zoom: this.zoom };
  }

  setPan(x: number, z: number) {
    this.panX = x;
    this.panZ = z;
  }

  setZoom(z: number) {
    this.zoom = z;
  }

  bind() {
    if (this.bound) return;
    this.bound = true;

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    this.dom.addEventListener('pointerdown', this.onPointerDown);
    this.dom.addEventListener('pointermove', this.onPointerMove);
    this.dom.addEventListener('pointerup', this.onPointerUp);
    this.dom.addEventListener('wheel', this.onWheel, { passive: false });
    this.dom.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.dom.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.dom.addEventListener('touchend', this.onTouchEnd);

    this.buildHud();
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.dom.removeEventListener('pointerdown', this.onPointerDown);
    this.dom.removeEventListener('pointermove', this.onPointerMove);
    this.dom.removeEventListener('pointerup', this.onPointerUp);
    this.dom.removeEventListener('wheel', this.onWheel);
    this.dom.removeEventListener('touchstart', this.onTouchStart);
    this.dom.removeEventListener('touchmove', this.onTouchMove);
    this.dom.removeEventListener('touchend', this.onTouchEnd);
    if (this.controls.isLocked) this.controls.unlock();
    this.hud?.remove();
  }

  setMode(mode: ViewMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    if (mode === 'fps') {
      // Eye-level at Studio Floor, facing toward Control / PRIM8 wall
      this.fpsCamera.position.set(0.2, EYE_HEIGHT, 2.6);
      this.controls.object.rotation.set(0, 0, 0);
      this.fpsCamera.rotation.set(-0.12, 0, 0);
      this.showFpsHint(true);
    } else {
      if (this.controls.isLocked) this.controls.unlock();
      this.showFpsHint(false);
      this.touchMove.set(0, 0);
      this.touchLook.set(0, 0);
    }
    this.updateHud();
  }

  toggleMode() {
    this.setMode(this.mode === 'fps' ? 'overhead' : 'fps');
  }

  update(dt: number) {
    if (this.mode !== 'fps' || !this.enabled) return;

    const forward = Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) -
      Number(this.keys.has('KeyS') || this.keys.has('ArrowDown'));
    const strafe = Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) -
      Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft'));

    const moveX = forward || this.touchMove.y;
    const moveZ = strafe || this.touchMove.x;
    const speed = this.touchIdMove != null ? TOUCH_SPEED : MOVE_SPEED;

    this.velocity.x = 0;
    this.velocity.z = 0;

    if (moveX || moveZ) {
      const dir = new THREE.Vector3();
      this.controls.getDirection(dir);
      dir.y = 0;
      dir.normalize();
      const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
      const wish = new THREE.Vector3()
        .addScaledVector(dir, moveX)
        .addScaledVector(right, moveZ);
      if (wish.lengthSq() > 0) {
        wish.normalize().multiplyScalar(speed * dt);
        this.tryMove(wish.x, wish.z);
      }
    }

    // Touch look (right side)
    if (this.touchIdLook != null && (this.touchLook.x || this.touchLook.y)) {
      this.controls.object.rotation.y -= this.touchLook.x * 1.8 * dt;
      this.fpsCamera.rotation.x -= this.touchLook.y * 1.4 * dt;
      this.fpsCamera.rotation.x = THREE.MathUtils.clamp(this.fpsCamera.rotation.x, -1.2, 1.2);
    }

    this.fpsCamera.position.y = EYE_HEIGHT;
  }

  placeOrthoCamera() {
    const dist = 28;
    const target = new THREE.Vector3(this.panX, 0, this.panZ);
    this.orthoCamera.position.set(
      target.x + dist * 0.8,
      dist * 0.85,
      target.z + dist * 0.8,
    );
    this.orthoCamera.lookAt(target);
    this.orthoCamera.updateProjectionMatrix();
  }

  private tryMove(dx: number, dz: number) {
    const pos = this.fpsCamera.position;
    const radius = 0.28;
    const hw = ROOM_SIZE.width / 2 - 0.4;
    const hd = ROOM_SIZE.depth / 2 - 0.4;

    let nx = pos.x + dx;
    let nz = pos.z + dz;

    // Room bounds
    nx = THREE.MathUtils.clamp(nx, -hw, hw);
    nz = THREE.MathUtils.clamp(nz, -hd, hd);

    // Resolve colliders axis-separated
    if (!this.collides(nx, pos.z, radius)) pos.x = nx;
    if (!this.collides(pos.x, nz, radius)) pos.z = nz;
  }

  private collides(x: number, z: number, r: number) {
    for (const c of this.colliders) {
      if (x + r > c.minX && x - r < c.maxX && z + r > c.minZ && z - r < c.maxZ) {
        return true;
      }
    }
    return false;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.code);
    if (e.code === 'KeyV') this.toggleMode();
    if (e.code === 'KeyE' && this.mode === 'fps' && !this.controls.isLocked) {
      this.controls.lock();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    if (this.mode === 'fps') {
      if (!this.controls.isLocked) this.controls.lock();
      return;
    }
    this.dragging = true;
    this.downX = this.lastX = e.clientX;
    this.downY = this.lastY = e.clientY;
    this.dom.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.mode !== 'overhead' || !this.dragging) return;
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    const scale = 0.02 / this.zoom;
    this.panX -= (dx + dy) * scale;
    this.panZ -= (-dx + dy) * scale;
    this.placeOrthoCamera();
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.mode === 'overhead') {
      const moved = Math.hypot(e.clientX - this.downX, e.clientY - this.downY);
      this.dragging = false;
      if (moved < 6) this.onAgentClick?.(e.clientX, e.clientY);
    }
  };

  private onWheel = (e: WheelEvent) => {
    if (this.mode !== 'overhead') return;
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      this.zoom = THREE.MathUtils.clamp(this.zoom - e.deltaY * 0.0015, 0.55, 2.4);
    } else {
      const scale = 0.015 / this.zoom;
      this.panX += (e.deltaX + e.deltaY) * scale;
      this.panZ += (-e.deltaX + e.deltaY) * scale;
      this.placeOrthoCamera();
    }
  };

  private onTouchStart = (e: TouchEvent) => {
    if (this.mode !== 'fps') return;
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const mid = window.innerWidth * 0.45;
      if (t.clientX < mid && this.touchIdMove == null) {
        this.touchIdMove = t.identifier;
        this.touchOriginMove.set(t.clientX, t.clientY);
      } else if (t.clientX >= mid && this.touchIdLook == null) {
        this.touchIdLook = t.identifier;
        this.touchOriginLook.set(t.clientX, t.clientY);
      }
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    if (this.mode !== 'fps') return;
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === this.touchIdMove) {
        const dx = (t.clientX - this.touchOriginMove.x) / 60;
        const dy = (t.clientY - this.touchOriginMove.y) / 60;
        this.touchMove.set(
          THREE.MathUtils.clamp(dx, -1, 1),
          THREE.MathUtils.clamp(-dy, -1, 1),
        );
      }
      if (t.identifier === this.touchIdLook) {
        const dx = (t.clientX - this.touchOriginLook.x) / 80;
        const dy = (t.clientY - this.touchOriginLook.y) / 80;
        this.touchLook.set(
          THREE.MathUtils.clamp(dx, -1, 1),
          THREE.MathUtils.clamp(dy, -1, 1),
        );
        this.touchOriginLook.set(t.clientX, t.clientY);
      }
    }
  };

  private onTouchEnd = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === this.touchIdMove) {
        this.touchIdMove = null;
        this.touchMove.set(0, 0);
      }
      if (t.identifier === this.touchIdLook) {
        this.touchIdLook = null;
        this.touchLook.set(0, 0);
      }
    }
  };

  private buildHud() {
    const hud = document.createElement('div');
    hud.style.cssText = `
      position: absolute; left: 12px; bottom: 72px; z-index: 40;
      display: flex; gap: 8px; pointer-events: auto; font-family: system-ui, sans-serif;
    `;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.style.cssText = `
      background: rgba(12,12,16,0.82); color: #f8fafc; border: 1px solid #ec4899;
      border-radius: 8px; padding: 8px 12px; font: 600 12px system-ui; cursor: pointer;
      backdrop-filter: blur(8px);
    `;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMode();
    });
    hud.appendChild(btn);
    this.container.appendChild(hud);
    this.hud = hud;
    this.updateHud();
  }

  private updateHud() {
    const btn = this.hud?.querySelector('button');
    if (!btn) return;
    btn.textContent = this.mode === 'fps' ? 'Overhead view (V)' : 'Enter studio (V)';
  }

  private showFpsHint(show: boolean) {
    let hint = this.container.querySelector('.fps-hint') as HTMLElement | null;
    if (!show) {
      hint?.remove();
      return;
    }
    if (!hint) {
      hint = document.createElement('div');
      hint.className = 'fps-hint';
      hint.style.cssText = `
        position: absolute; left: 50%; top: 18px; transform: translateX(-50%);
        z-index: 40; pointer-events: none;
        background: rgba(10,10,14,0.75); color: #e2e8f0;
        border: 1px solid rgba(236,72,153,0.45); border-radius: 8px;
        padding: 8px 14px; font: 500 12px system-ui; text-align: center;
      `;
      this.container.appendChild(hint);
    }
    hint.textContent = 'Click to look · WASD move · V overhead · touch: left move / right look';
  }
}
