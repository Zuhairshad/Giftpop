import { BoxGeometry, BufferGeometry, Float32BufferAttribute, PlaneGeometry } from "three";

/** Thickness of satin ribbon, world units: enough to catch a highlight on its edge. */
export const RIBBON_THICKNESS = 0.018;

/**
 * A ribbon tail: a thin strip that hangs from its top edge (the origin), curves outward by
 * `curve` over its length, narrows a little and has a V notch (a dovetail) cut into its end.
 * `side` is -1 for the left tail and 1 for the right.
 */
export function bentTail(
  width: number,
  length: number,
  side: 1 | -1,
  curve: number,
  notch: number,
): BufferGeometry {
  const geometry = new BoxGeometry(width, length, RIBBON_THICKNESS, 8, 24, 1);
  const position = geometry.getAttribute("position");
  // The notch grows over the last part of the strip (v^k) and never folds the strip back on itself.
  const k = notch > 0 ? Math.min(6, (0.8 * length) / notch) : 1;
  for (let i = 0; i < position.count; i += 1) {
    const u = position.getX(i) / width;
    const v = (length / 2 - position.getY(i)) / length;
    const x = side * curve * Math.pow(v, 1.7) + u * width * (1 - 0.18 * v);
    const y = -v * length + notch * (1 - 2 * Math.abs(u)) * Math.pow(v, k);
    // A gentle S twist across the width, so light rolls over the satin.
    const z =
      position.getZ(i) + 0.03 * Math.sin(v * Math.PI) + 0.02 * v + 0.025 * u * Math.sin(v * 5);
    position.setXYZ(i, x, y, z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * One hollow bow loop on the given side of the knot: a strip of ribbon swept round a teardrop
 * that is pinched at the knot, cupped across its width and a little lifted at the tip.
 */
export function bowLoop(side: 1 | -1): BufferGeometry {
  const along = 48;
  const across = 6;
  const length = 0.56;
  const halfHeight = 0.2;
  const width = 0.27;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= along; i += 1) {
    const phi = (2 * Math.PI * i) / along;
    const r = (1 - Math.cos(phi)) / 2; // 0 at the knot, 1 at the tip
    const x = side * length * r;
    const y = halfHeight * Math.sin(phi) * Math.sqrt(r) * 1.15 + 0.12 * r;
    const w = width * (0.38 + 0.62 * Math.sqrt(r));
    for (let j = 0; j <= across; j += 1) {
      const a = j / across - 0.5;
      const cup = 0.035 * (1 - 4 * a * a) * Math.sqrt(r);
      positions.push(x - side * cup * 0.4, y + cup, a * w);
    }
  }
  const row = across + 1;
  for (let i = 0; i < along; i += 1) {
    for (let j = 0; j < across; j += 1) {
      const a = i * row + j;
      const b = a + row;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
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
