import { ExtrudeGeometry, PlaneGeometry, Shape, Path } from "three";
import type { BufferGeometry } from "three";

/**
 * A ribbon tail: a flat strip that hangs from its top edge (the origin), curves outward by
 * `curve` over its length, narrows a little and has a V notch cut into its end.
 * `side` is -1 for the left tail and 1 for the right.
 */
export function bentTail(
  width: number,
  length: number,
  side: 1 | -1,
  curve: number,
  notch: number,
): BufferGeometry {
  const geometry = new PlaneGeometry(width, length, 8, 24);
  const position = geometry.getAttribute("position");
  for (let i = 0; i < position.count; i += 1) {
    const u = position.getX(i) / width;
    const v = (length / 2 - position.getY(i)) / length;
    const x = side * curve * Math.pow(v, 1.7) + u * width * (1 - 0.18 * v);
    const y = -v * length + (v > 0.999 ? notch * (1 - 2 * Math.abs(u)) : 0);
    const z = 0.03 * Math.sin(v * Math.PI) + 0.02 * v;
    position.setXYZ(i, x, y, z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** One hollow bow loop on the given side of the knot, standing in the XY plane. */
export function bowLoop(side: 1 | -1): BufferGeometry {
  const shape = new Shape();
  shape.absellipse(side * 0.4, 0.05, 0.36, 0.27, 0, Math.PI * 2, false, 0);
  const hole = new Path();
  hole.absellipse(side * 0.42, 0.03, 0.19, 0.12, 0, Math.PI * 2, true, 0);
  shape.holes.push(hole);
  return new ExtrudeGeometry(shape, {
    depth: 0.07,
    bevelEnabled: true,
    bevelSize: 0.03,
    bevelThickness: 0.03,
    bevelSegments: 2,
    curveSegments: 24,
  });
}

/** Crinkled tissue paper: a flat sheet with a deterministic ripple, lying in the XZ plane. */
export function tissueSheet(width: number, depth: number): BufferGeometry {
  const geometry = new PlaneGeometry(width, depth, 36, 18);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.getAttribute("position");
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const ripple = 0.07 * Math.sin(x * 6.2) * Math.cos(z * 4.4) + 0.04 * Math.sin(x * 13 + z * 5);
    position.setY(i, ripple);
  }
  geometry.computeVertexNormals();
  return geometry;
}
