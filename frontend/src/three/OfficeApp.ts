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
    this.scene.background = new THREE.Color(0x16141c);
    this.scene.fog = new THREE.Fog(0x16141c, 48, 85);

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
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
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
    // Warm studio sky / soft floor bounce
    const hemi = new THREE.HemisphereLight(0xfff4e8, 0x9aa090, 0.85);
    this.scene.add(hemi);

    // Key sun through window bay — softer, less stripe-dominant
    const sun = new THREE.DirectionalLight(0xffedd5, 0.85);
    sun.position.set(12, 20, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 50;
    sun.shadow.camera.left = -15;
    sun.shadow.camera.right = 15;
    sun.shadow.camera.top = 15;
    sun.shadow.camera.bottom = -15;
    sun.shadow.bias = -0.00035;
    sun.shadow.normalBias = 0.04;
    this.scene.add(sun);

    // Cool window fill (right / back bay)
    const fill = new THREE.DirectionalLight(0xc5d4e8, 0.5);
    fill.position.set(-8, 10, -8);
    this.scene.add(fill);

    // Soft bounce from floor / wood
    const bounce = new THREE.DirectionalLight(0xe8d5b5, 0.28);
    bounce.position.set(0, -4, 4);
    this.scene.add(bounce);

    // PRIM8 screen glow / pink rim at video wall
    const pinkRim = new THREE.PointLight(0xec4899, 0.55, 16, 2);
    pinkRim.position.set(0, 2.6, -ROOM_SIZE.depth / 2 + 1.2);
    this.scene.add(pinkRim);

    // Warm kitchen / lounge accents
    const loungeFill = new THREE.PointLight(0xffc4a8, 0.32, 10, 2);
    loungeFill.position.set(5.5, 2.2, -4);
    this.scene.add(loungeFill);

    const kitchenFill = new THREE.PointLight(0xffe8c8, 0.28, 9, 2);
    kitchenFill.position.set(5.5, 2.4, 4.2);
    this.scene.add(kitchenFill);
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
