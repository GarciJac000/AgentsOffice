import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { EventBus } from '../shared/events/EventBus';
import { loadAgentRegistry } from '../shared/agentRegistry';
import { buildOffice } from './buildOffice';
import { AgentManager } from './agents';
import { ROOM_SIZE } from './rooms';

/**
 * PRIM8 full-3D isometric office.
 * Orthographic isometric camera + soft shadows + Gather-style open plan.
 */
export class OfficeApp {
  private renderer: THREE.WebGLRenderer;
  private labelRenderer: CSS2DRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private agents!: AgentManager;
  private clock = new THREE.Clock();
  private running = false;
  private raf = 0;

  private panX = 0;
  private panZ = 0;
  private zoom = 1;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private downX = 0;
  private downY = 0;
  private chatInset = 520;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x12131a);
    this.scene.fog = new THREE.Fog(0x12131a, 45, 80);

    const aspect = this.viewportAspect();
    const frustum = 9.5;
    this.camera = new THREE.OrthographicCamera(
      -frustum * aspect,
      frustum * aspect,
      frustum,
      -frustum,
      0.1,
      200,
    );
    this.placeCamera();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.viewWidth(), this.viewHeight());
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(this.viewWidth(), this.viewHeight());
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.left = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.labelRenderer.domElement);

    this.setupLights();
    buildOffice(this.scene);

    this.bindInput();
    window.addEventListener('resize', this.onResize);

    EventBus.on('chatbox:resize', this.onChatResize);
  }

  async start() {
    await loadAgentRegistry();
    this.agents = new AgentManager(this.scene, this.scene);
    await this.agents.create();
    this.running = true;
    this.clock.start();
    this.loop();
    EventBus.emit('scene:ready');
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.agents?.dispose();
    window.removeEventListener('resize', this.onResize);
    EventBus.off('chatbox:resize', this.onChatResize);
    this.renderer.dispose();
    this.container.innerHTML = '';
  }

  private setupLights() {
    const hemi = new THREE.HemisphereLight(0xfff4e6, 0x8a9bb0, 0.85);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff0d6, 1.35);
    sun.position.set(12, 18, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 50;
    sun.shadow.camera.left = -16;
    sun.shadow.camera.right = 16;
    sun.shadow.camera.top = 16;
    sun.shadow.camera.bottom = -16;
    sun.shadow.bias = -0.0002;
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0xb4c6ff, 0.35);
    fill.position.set(-10, 8, -6);
    this.scene.add(fill);

    const pinkRim = new THREE.PointLight(0xec4899, 0.45, 24);
    pinkRim.position.set(0, 3.5, -ROOM_SIZE.depth / 2 + 1);
    this.scene.add(pinkRim);
  }

  private placeCamera() {
    // True isometric: equal X/Z, elevation giving ~35.264°
    const dist = 28;
    const target = new THREE.Vector3(this.panX, 0, this.panZ);
    this.camera.position.set(
      target.x + dist * 0.8,
      dist * 0.85,
      target.z + dist * 0.8,
    );
    this.camera.lookAt(target);
    this.camera.updateProjectionMatrix();
  }

  private viewWidth() {
    return Math.max(320, window.innerWidth - this.chatInset);
  }

  private viewHeight() {
    return window.innerHeight;
  }

  private viewportAspect() {
    return this.viewWidth() / Math.max(1, this.viewHeight());
  }

  private updateFrustum() {
    const aspect = this.viewportAspect();
    const frustum = 11 / this.zoom;
    this.camera.left = -frustum * aspect;
    this.camera.right = frustum * aspect;
    this.camera.top = frustum;
    this.camera.bottom = -frustum;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.viewWidth(), this.viewHeight());
    this.labelRenderer.setSize(this.viewWidth(), this.viewHeight());
    this.container.style.width = `${this.viewWidth()}px`;
    this.container.style.height = `${this.viewHeight()}px`;
  }

  private onResize = () => {
    this.updateFrustum();
    this.placeCamera();
  };

  private onChatResize = (data: { width: number }) => {
    this.chatInset = data.width || 520;
    this.onResize();
  };

  private bindInput() {
    const el = this.renderer.domElement;

    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      this.dragging = true;
      this.downX = this.lastX = e.clientX;
      this.downY = this.lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
    });

    el.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      // Pan in isometric ground plane
      const scale = 0.02 / this.zoom;
      this.panX -= (dx + dy) * scale;
      this.panZ -= (-dx + dy) * scale;
      this.placeCamera();
    });

    el.addEventListener('pointerup', (e) => {
      const moved = Math.hypot(e.clientX - this.downX, e.clientY - this.downY);
      this.dragging = false;
      // Click select if it was a short press
      if (moved < 6) {
        const agent = this.agents?.pickAgent(e.clientX, e.clientY, this.camera, el);
        if (agent) {
          EventBus.emit('agent:clicked', { agentId: agent.id, name: agent.name });
        }
      }
    });

    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          this.zoom = THREE.MathUtils.clamp(this.zoom - e.deltaY * 0.0015, 0.55, 2.4);
          this.updateFrustum();
        } else {
          const scale = 0.015 / this.zoom;
          this.panX += (e.deltaX + e.deltaY) * scale;
          this.panZ += (-e.deltaX + e.deltaY) * scale;
          this.placeCamera();
        }
      },
      { passive: false },
    );
  }

  private loop = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.agents?.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  };
}

export async function startOfficeApp(container: HTMLElement): Promise<OfficeApp> {
  const app = new OfficeApp(container);
  EventBus.setGameInstance(app);
  await app.start();
  return app;
}
