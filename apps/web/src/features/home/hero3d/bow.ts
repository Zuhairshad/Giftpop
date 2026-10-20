import { Group, Mesh } from "three";
import type { Material } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import { bentTail, bowLoop } from "./geometry";
import type { Owner } from "./owner";

/**
 * A tied satin bow: two hollow loops that stand up, lean back and splay apart, a knot wrapped
 * across the bands, and two notched tails that lie along the lid towards the front and curl over
 * its edge. Origin at the centre of the knot's base, sitting on the lid's top face.
 */
export function buildBow(owner: Owner, ribbon: Material): Group {
  const bow = new Group();
  for (const side of [-1, 1] as const) {
    const loop = new Mesh(owner.geometry(bowLoop(side)), ribbon);
    loop.position.set(side * 0.05, 0.1, 0);
    loop.rotation.set(-0.32, -side * 0.42, side * 0.16);
    bow.add(loop);

    // Tails: the hanging strip is turned to lie forward (+z), splayed out to each side.
    const tail = new Group();
    tail.position.set(side * 0.04, 0.035, 0.06);
    tail.rotation.set(-Math.PI / 2 + 0.12, side * 0.38, 0);
    tail.add(new Mesh(owner.geometry(bentTail(0.17, 0.78, side, 0.12, 0.08)), ribbon));
    bow.add(tail);
  }
  const knot = new Mesh(owner.geometry(new RoundedBoxGeometry(0.2, 0.19, 0.27, 3, 0.07)), ribbon);
  knot.position.y = 0.1;
  knot.rotation.x = -0.2;
  bow.add(knot);
  return bow;
}
