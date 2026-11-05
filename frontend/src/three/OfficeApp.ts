import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { EventBus } from '../shared/events/EventBus';
import { loadAgentRegistry } from '../shared/agentRegistry';
import { buildOffice } from './buildOffice';
import { AgentManager } from './agents';
import { ROOM_SIZE } from './rooms';
import { detectQuality, type QualitySettings } from './quality';
import { PlayerControls } from './playerControls';

/**
 * PRIM8 cinematic HQ — Studio Floor showcase.
 * Dual cameras: overhead isometric + first-person walkthrough.
 */
export class OfficeApp {
  private renderer: THREE.WebGLRenderer;
  private labelRenderer: CSS2DRenderer;
  private scene: THREE.Scene;
  private orthoCamera: THREE.OrthographicCamera;
  private fpsCamera: THREE.PerspectiveCamera;
  private agents!: AgentManager;
  private player!: PlayerControls;
  private clock = new THREE.Clock();
  private running = false;
  private raf = 0;
  private chatInset = 520;
  private container: HTMLElement;
  private quality: QualitySettings;
  private composer: EffectComposer | null = null;
  private fxaaPass: ShaderPass | null = null;
  private perfSamples: number[] = [];
  private lastPerfLog = 0;
  private hotspotLabels: CSS2DObject[] = [];
  private lastZoom = 1;

  constructor(container: HTMLElement) {
    this.container = container;
    this.quality = detectQuality();
    document.documentElement.dataset.prim8Boot = 'constructing';

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0c0e);
    this.scene.fog = new THREE.FogExp2(0x0b0c0e, 0.018);

    const aspect = this.viewportAspect();
    const frustum = 9.5;
    this.orthoCamera = new THREE.OrthographicCamera(
      -frustum * aspect,
      frustum * aspect,
      frustum,
      -frustum,
      0.1,
      200,
    );

    this.fpsCamera = new THREE.PerspectiveCamera(70, aspect, 0.08, 80);
    this.fpsCamera.position.set(0, 1.65, 3.2);

    this.renderer = new THREE.WebGLRenderer({
      antialias: this.quality.antialias,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(this.quality.pixelRatio);
    this.renderer.setSize(this.viewWidth(), this.viewHeight());
    this.renderer.shadowMap.enabled = this.quality.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.quality.toneMappingExposure;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.style.position = 'relative';
    this.container.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(this.viewWidth(), this.viewHeight());
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.left = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.labelRenderer.domElement);

    this.setupLights();
    document.documentElement.dataset.prim8Boot = 'lights';
    const { root, colliders } = buildOffice(this.scene);
    document.documentElement.dataset.prim8Boot = 'office-built';
    this.attachHotspots(root);

    this.player = new PlayerControls(
      this.container,
      this.renderer.domElement,
      this.fpsCamera,
      this.orthoCamera,
    );
    this.player.setColliders(colliders);
    this.player.setAgentClickHandler((x, y) => {
      const cam = this.player.activeCamera;
      const agent = this.agents?.pickAgent(x, y, cam, this.renderer.domElement);
      if (agent) {
        EventBus.emit('agent:clicked', { agentId: agent.id, name: agent.name });
      }
    });
    this.player.bind();
    this.player.placeOrthoCamera();
    this.updateFrustum();

    // FXAA only on medium/high — keep low tier lean for mobile
    if (this.quality.fxaa && this.quality.tier !== 'low') {
      try {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.orthoCamera));
        this.fxaaPass = new ShaderPass(FXAAShader);
        const pixelRatio = this.renderer.getPixelRatio();
        this.fxaaPass.material.uniforms['resolution'].value.x =
          1 / (this.viewWidth() * pixelRatio);
        this.fxaaPass.material.uniforms['resolution'].value.y =
          1 / (this.viewHeight() * pixelRatio);
        this.composer.addPass(this.fxaaPass);
      } catch (err) {
        console.warn('[OfficeApp] postprocessing disabled', err);
        this.composer = null;
      }
    }

    window.addEventListener('resize', this.onResize);
    EventBus.on('chatbox:resize', this.onChatResize);

    // Defer PMREM — fromScene can stall on software GL
    queueMicrotask(() => this.installEnvironment());

    document.documentElement.dataset.prim8Boot = 'ready';
    document.documentElement.dataset.prim8Quality = this.quality.tier;
    console.log(`[OfficeApp] quality=${this.quality.tier} shadows=${this.quality.shadowMapSize}`);
  }

  private installEnvironment() {
    // Skip PMREM on low tier — fromScene is costly under software GL
    if (this.quality.tier === 'low') return;
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      this.scene.environment = env;
      this.scene.environmentIntensity = this.quality.envMapIntensity;
      pmrem.dispose();
    } catch (err) {
      console.warn('[OfficeApp] environment map skipped', err);
    }
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
    this.player?.dispose();
    window.removeEventListener('resize', this.onResize);
    EventBus.off('chatbox:resize', this.onChatResize);
    this.renderer.dispose();
    this.container.innerHTML = '';
  }

  /** Measured median frame ms from recent samples (if any). */
  getPerfSummary() {
    if (!this.perfSamples.length) return null;
    const sorted = [...this.perfSamples].sort((a, b) => a - b);
    const mid = sorted[Math.floor(sorted.length / 2)];
    return {
      samples: sorted.length,
      medianFrameMs: Math.round(mid * 10) / 10,
      approxFps: Math.round(1000 / mid),
      quality: this.quality.tier,
    };
  }

  private attachHotspots(root: THREE.Group) {
    root.traverse((obj) => {
      const spots = obj.userData?.hotspots as
        | Array<{ id: string; label: string; x: number; y: number; z: number }>
        | undefined;
      if (!spots) return;
      for (const s of spots) {
        const el = document.createElement('div');
        el.textContent = s.label;
        el.style.cssText = `
          background: rgba(12,12,16,0.78); color: #e8e0d4;
          border: 1px solid rgba(176,141,87,0.7); border-radius: 6px;
          padding: 3px 8px; font: 600 10px system-ui, sans-serif;
          letter-spacing: 0.02em; pointer-events: none; white-space: nowrap;
          opacity: 0.85;
        `;
        const label = new CSS2DObject(el);
        label.position.set(s.x, s.y, s.z);
        root.add(label);
        this.hotspotLabels.push(label);
      }
    });
  }

  private setupLights() {
    const hemi = new THREE.HemisphereLight(0xb8c4d4, 0x1a1410, 0.45);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffe2c4, 1.05);
    sun.position.set(10, 16, 6);
    sun.castShadow = this.quality.shadows;
    sun.shadow.mapSize.set(this.quality.shadowMapSize, this.quality.shadowMapSize);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 45;
    sun.shadow.camera.left = -14;
    sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 14;
    sun.shadow.camera.bottom = -14;
    sun.shadow.bias = -0.0003;
    sun.shadow.normalBias = 0.035;
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x9eb6d4, 0.35);
    fill.position.set(-9, 8, -6);
    this.scene.add(fill);

    const bounce = new THREE.DirectionalLight(0x5c4030, 0.22);
    bounce.position.set(0, -3, 4);
    this.scene.add(bounce);

    const pinkRim = new THREE.PointLight(0xec4899, 0.4, 14, 2);
    pinkRim.position.set(0, 2.4, -ROOM_SIZE.depth / 2 + 1.1);
    this.scene.add(pinkRim);

    // Studio Floor key pool (warm architectural, restrained)
    const studioKey = new THREE.SpotLight(0xffe6c8, 0.65, 14, Math.PI / 5, 0.5, 1.4);
    studioKey.position.set(0, 4.0, 0.8);
    studioKey.target.position.set(0, 0, 0.8);
    studioKey.castShadow = this.quality.tier === 'high';
    this.scene.add(studioKey);
    this.scene.add(studioKey.target);

    const loungeFill = new THREE.PointLight(0xffc4a8, 0.28, 9, 2);
    loungeFill.position.set(5.5, 2.2, -4);
    this.scene.add(loungeFill);

    const kitchenFill = new THREE.PointLight(0xffe8c8, 0.22, 8, 2);
    kitchenFill.position.set(5.5, 2.4, 4.2);
    this.scene.add(kitchenFill);
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
    const zoom = this.player?.getPan().zoom ?? 1;
    const frustum = 11 / zoom;
    this.orthoCamera.left = -frustum * aspect;
    this.orthoCamera.right = frustum * aspect;
    this.orthoCamera.top = frustum;
    this.orthoCamera.bottom = -frustum;
    this.orthoCamera.updateProjectionMatrix();

    this.fpsCamera.aspect = aspect;
    this.fpsCamera.updateProjectionMatrix();

    this.renderer.setSize(this.viewWidth(), this.viewHeight());
    this.labelRenderer.setSize(this.viewWidth(), this.viewHeight());
    this.container.style.width = `${this.viewWidth()}px`;
    this.container.style.height = `${this.viewHeight()}px`;

    if (this.composer) {
      this.composer.setSize(this.viewWidth(), this.viewHeight());
      if (this.fxaaPass) {
        const pixelRatio = this.renderer.getPixelRatio();
        this.fxaaPass.material.uniforms['resolution'].value.x =
          1 / (this.viewWidth() * pixelRatio);
        this.fxaaPass.material.uniforms['resolution'].value.y =
          1 / (this.viewHeight() * pixelRatio);
      }
    }
  }

  private onResize = () => {
    this.updateFrustum();
    this.player.placeOrthoCamera();
  };

  private onChatResize = (data: { width: number }) => {
    this.chatInset = data.width || 520;
    this.onResize();
  };

  private loop = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t0 = performance.now();

    this.player.update(dt);
    // Sync ortho frustum only when zoom changes (not every frame)
    if (this.player.mode === 'overhead') {
      const z = this.player.getPan().zoom;
      if (Math.abs(z - this.lastZoom) > 0.0001) {
        this.lastZoom = z;
        this.updateFrustum();
      }
      this.player.placeOrthoCamera();
    }

    this.agents?.update(dt);

    // Hotspot opacity: clearer in FPS near studio floor
    const showHotspots = this.player.mode === 'fps';
    for (const h of this.hotspotLabels) {
      (h.element as HTMLElement).style.opacity = showHotspots ? '0.9' : '0.35';
    }

    const cam = this.player.activeCamera;
    if (this.composer && this.player.mode === 'overhead') {
      // Update render pass camera
      const pass = this.composer.passes[0] as RenderPass;
      pass.camera = cam;
      this.composer.render();
    } else {
      this.renderer.render(this.scene, cam);
    }
    this.labelRenderer.render(this.scene, cam);

    const frameMs = performance.now() - t0;
    this.perfSamples.push(frameMs);
    if (this.perfSamples.length > 120) this.perfSamples.shift();
    if (performance.now() - this.lastPerfLog > 5000) {
      this.lastPerfLog = performance.now();
      const summary = this.getPerfSummary();
      if (summary) {
        document.documentElement.dataset.prim8Perf = JSON.stringify(summary);
        console.log(
          `[OfficeApp] perf ~${summary.approxFps} fps (median ${summary.medianFrameMs}ms, ${summary.quality})`,
        );
      }
    }
  };
}

export async function startOfficeApp(container: HTMLElement): Promise<OfficeApp> {
  const app = new OfficeApp(container);
  EventBus.setGameInstance(app);
  // Expose for local perf tooling (dataset used because some hosts block window.__* writes)
  const g = globalThis as unknown as { prim8Office?: OfficeApp };
  g.prim8Office = app;
  document.documentElement.dataset.prim8Office = '1';
  await app.start();
  document.documentElement.dataset.prim8Office = 'started';
  return app;
}
