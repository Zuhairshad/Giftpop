import type { PerspectiveCamera } from "three";

import { CAMERA, POSTER_UNITS_PER_WORLD_UNIT, POSTER_VIEWBOX } from "./constants";

/**
 * Distance at which the camera frames the whole poster rectangle for a viewport of this aspect
 * ratio (width / height), the same way the poster's `meet` scaling does.
 */
export function cameraDistance(aspect: number): number {
  const half = Math.tan((CAMERA.fov * Math.PI) / 360);
  const halfHeight = POSTER_VIEWBOX.h / POSTER_UNITS_PER_WORLD_UNIT / 2;
  const halfWidth = POSTER_VIEWBOX.w / POSTER_UNITS_PER_WORLD_UNIT / 2;
  return Math.max(halfHeight / half, halfWidth / (half * Math.max(aspect, 0.05)));
}

/** Orbits the camera around the world origin and looks at it. Angles in radians. */
export function placeCamera(
  camera: PerspectiveCamera,
  azimuth: number,
  elevation: number,
  distance: number,
): void {
  camera.position.set(
    distance * Math.sin(azimuth) * Math.cos(elevation),
    distance * Math.sin(elevation),
    distance * Math.cos(azimuth) * Math.cos(elevation),
  );
  camera.lookAt(0, 0, 0);
}

/**
 * World y of the top edge of the frame, measured on the vertical plane `planeZ`, for a camera
 * placed by `placeCamera` (azimuth ignored: it is a few degrees). Used to time the box's entry.
 */
export function visibleTop(distance: number, elevation: number, planeZ: number): number {
  const camY = distance * Math.sin(elevation);
  const camZ = distance * Math.cos(elevation);
  const pitch = (CAMERA.fov * Math.PI) / 360 - elevation;
  return camY + (camZ - planeZ) * Math.tan(pitch);
}
