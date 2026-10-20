import { ExtrudeGeometry, Path, Shape } from "three";
import type { BufferGeometry } from "three";

/** A rectangle centred on the origin with rounded corners, as a closed path. */
function roundedRect<T extends Path>(target: T, width: number, depth: number, radius: number): T {
  const w = width / 2;
  const d = depth / 2;
  const r = Math.max(0, Math.min(radius, w, d));
  target.moveTo(-w + r, -d);
  target.lineTo(w - r, -d);
  target.quadraticCurveTo(w, -d, w, -d + r);
  target.lineTo(w, d - r);
  target.quadraticCurveTo(w, d, w - r, d);
  target.lineTo(-w + r, d);
  target.quadraticCurveTo(-w, d, -w, d - r);
  target.lineTo(-w, -d + r);
  target.quadraticCurveTo(-w, -d, -w + r, -d);
  return target;
}

export interface ShellSize {
  width: number;
  depth: number;
  height: number;
  /** Wall thickness. */
  wall: number;
  /** Radius of the four vertical corners. */
  corner: number;
  /** Size of the rounded bevel on the top and bottom edges. */
  bevel: number;
}

/**
 * The open box: four walls in one piece with rounded vertical corners and bevelled top and
 * bottom edges, standing on y = 0 and exactly `width` x `depth` x `height` outside. UVs are in
 * world units (three's extrude default), so a repeating paper texture keeps its scale on every face.
 */
export function boxShell(size: ShellSize): BufferGeometry {
  const { width, depth, height, wall, corner, bevel } = size;
  const outer = roundedRect(new Shape(), width - 2 * bevel, depth - 2 * bevel, corner);
  const innerW = width - 2 * wall - 2 * bevel;
  const innerD = depth - 2 * wall - 2 * bevel;
  outer.holes.push(roundedRect(new Path(), innerW, innerD, Math.max(corner - wall, 0.01)));
  const geometry = new ExtrudeGeometry(outer, {
    depth: height - 2 * bevel,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 6,
  });
  // Extruded along +z from -bevel; stand it up along +y from 0.
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, bevel, 0);
  return geometry;
}

/** A flat slab with rounded corners and bevelled edges (box floor, lid top), standing on y = 0. */
export function roundedSlab(
  width: number,
  depth: number,
  height: number,
  corner: number,
  bevel: number,
): BufferGeometry {
  const shape = roundedRect(new Shape(), width - 2 * bevel, depth - 2 * bevel, corner);
  const geometry = new ExtrudeGeometry(shape, {
    depth: Math.max(height - 2 * bevel, 0.001),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 6,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, bevel, 0);
  return geometry;
}
