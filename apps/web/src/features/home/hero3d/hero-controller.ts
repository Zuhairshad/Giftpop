import { PerspectiveCamera, Scene, WebGLRenderer } from "three";

import { artPixelsPerPosterPixel, MAX_PIXEL_RATIO } from "./art-resolution";
import { cameraDistance, placeCamera, visibleTop } from "./camera";
import { BOX, BOX_Z, CAMERA, IDLE_RENDER } from "./constants";
import { dropEntryTime } from "./drop-physics";
import { degToRad } from "./layout";
import { buildRig } from "./rig";
import { loadSpriteArt } from "./sprite-art";
import { heroStateAt } from "./timeline";

/**
 * Largest time step one frame may advance. A late frame (up to two missed vsyncs) keeps real
 * time so speeds stay true; a longer stall or a resume slows the clock instead of skipping ahead,
 * so nothing ever jumps across the screen.
 */
const MAX_STEP = 1 / 20;

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
  const dpr = window.devicePixelRatio || 1;
  const art = await loadSpriteArt(
    artPixelsPerPosterPixel(host.clientWidth, host.clientHeight, dpr),
  );
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
      // A software rasteriser cannot keep 60 fps; the stage shows the static composition instead.
      failIfMajorPerformanceCaveat: true,
    });
  } catch (error) {
    art.dispose();
    throw error;
  }
  renderer.setPixelRatio(Math.min(dpr, MAX_PIXEL_RATIO));
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

  // Compile every shader without blocking the main thread where the browser can, then start the
  // clock just before the box reaches the top of the frame (a taller stage shows more sky).
  const distance0 = cameraDistance(aspect);
  rig.apply(heroStateAt(0), distance0);
  placeCamera(camera, degToRad(CAMERA.azimuthDeg), degToRad(CAMERA.elevationDeg), distance0);
  await renderer.compileAsync(scene, camera);
  if (isCancelled()) {
    observer.disconnect();
    rig.dispose();
    art.dispose();
    renderer.dispose();
    canvas.remove();
    return null;
  }
  let elapsed = dropEntryTime(
    visibleTop(distance0, degToRad(CAMERA.elevationDeg), BOX_Z - BOX.depth / 2),
  );
  let last: number | null = null;
  let frame = 0;
  let firstFrameSent = false;
  let lastRendered = 0;
  const draw = (now: number) => {
    frame = requestAnimationFrame(draw);
    // After the drop has settled, only the slow idle float is left: render at a lower rate.
    if (elapsed > IDLE_RENDER.afterSeconds && now - lastRendered < 1000 / IDLE_RENDER.fps - 2)
      return;
    lastRendered = now;
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
