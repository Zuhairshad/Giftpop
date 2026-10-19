import { PerspectiveCamera, Scene, WebGLRenderer } from "three";

import { cameraDistance, placeCamera } from "./camera";
import { CAMERA } from "./constants";
import { buildRig } from "./rig";
import { loadSpriteArt } from "./sprite-art";
import { heroStateAt } from "./timeline";

/** Largest time step one frame may advance, so a stall or a resume never skips the animation. */
const MAX_STEP = 1 / 20;
const MAX_PIXEL_RATIO = 2;

export interface HeroHooks {
  /** The first frame has been drawn (the box is still above the top of the frame). */
  onFirstFrame: () => void;
  onContextLost: () => void;
}

export interface HeroController {
  /** Start or stop drawing. Stopping freezes the animation clock; starting resumes without a jump. */
  setActive(active: boolean): void;
  /** Frees the renderer, geometries, materials and textures, and removes the canvas. */
  dispose(): void;
}

/**
 * Plain Three.js (no React renderer) so the lazy chunk carries only what the scene uses.
 * Resolves to `null` when `isCancelled()` turns true while the art loads; rejects if the art or
 * WebGL fails, so the caller can fall back to the poster.
 */
export async function startHero(
  host: HTMLElement,
  hooks: HeroHooks,
  isCancelled: () => boolean,
): Promise<HeroController | null> {
  const art = await loadSpriteArt();
  if (isCancelled()) {
    art.dispose();
    return null;
  }
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    art.dispose();
    throw error;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.style.cssText = "display:block;width:100%;height:100%";
  host.appendChild(canvas);
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    hooks.onContextLost();
  });

  const rig = buildRig(art);
  const scene = new Scene();
  scene.add(rig.root);
  const camera = new PerspectiveCamera(CAMERA.fov, 1, 0.1, 80);
  let aspect = 1;
  const resize = () => {
    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);
    renderer.setSize(width, height, false);
    aspect = width / height;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(host);

  let elapsed = 0;
  let last: number | null = null;
  let frame = 0;
  let firstFrameSent = false;
  const draw = (now: number) => {
    frame = requestAnimationFrame(draw);
    elapsed += last === null ? 0 : Math.min((now - last) / 1000, MAX_STEP);
    last = now;
    const state = heroStateAt(elapsed);
    const distance = cameraDistance(aspect);
    rig.apply(state, distance);
    placeCamera(camera, state.camera.azimuth, state.camera.elevation, distance);
    renderer.render(scene, camera);
    if (!firstFrameSent) {
      firstFrameSent = true;
      requestAnimationFrame(() => hooks.onFirstFrame());
    }
  };

  return {
    setActive(active) {
      if (active && frame === 0) {
        last = null;
        frame = requestAnimationFrame(draw);
      } else if (!active && frame !== 0) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    dispose() {
      cancelAnimationFrame(frame);
      frame = 0;
      observer.disconnect();
      rig.dispose();
      art.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
