import {
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
} from "three";
import type { Texture } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import { BOX, GIFT_TAG, LID_SIZE, PALETTE, RIBBON_BAND_WIDTH } from "./constants";
import { bentTail, bowLoop, tissueSheet } from "./geometry";
import { posterToWorld } from "./layout";
import type { Owner } from "./owner";
import { DOTS_TILE_WORLD, dotsTexture } from "./textures";

export interface BoxParts {
  /** Origin at the middle of the box base; the timeline squashes and drops this group. */
  group: Group;
  lid: Group;
  lidBody: Mesh;
  lidBand: Mesh;
  band: Mesh;
  /** Tail pivots: scale Y unrolls them down the front. */
  tails: Group[];
  tag: Mesh;
}

function ribbonMaterial(owner: Owner): MeshPhysicalMaterial {
  return owner.material(
    new MeshPhysicalMaterial({
      color: PALETTE.ribbon,
      roughness: 0.38,
      sheen: 1,
      sheenRoughness: 0.35,
      sheenColor: new Color(PALETTE.ribbonSheen),
      side: DoubleSide,
    }),
  );
}

function bow(owner: Owner, ribbon: MeshPhysicalMaterial): Group {
  const bowGroup = new Group();
  for (const side of [-1, 1] as const) {
    const loop = new Mesh(owner.geometry(bowLoop(side)), ribbon);
    loop.position.z = -0.035;
    loop.rotation.y = -side * 0.32;
    loop.rotation.z = side * 0.12;
    bowGroup.add(loop);
    const tail = new Mesh(owner.geometry(bentTail(0.2, 0.7, side, 0.22, 0.08)), ribbon);
    tail.position.set(side * 0.06, -0.1, 0.02);
    tail.rotation.z = side * 0.18;
    bowGroup.add(tail);
  }
  const knot = new Mesh(owner.geometry(new RoundedBoxGeometry(0.26, 0.26, 0.22, 3, 0.09)), ribbon);
  knot.position.z = 0.02;
  bowGroup.add(knot);
  return bowGroup;
}

/** The black, gold-dotted box with its lid, ribbon band, tails, bow, tissue and truffles. */
export function buildBox(owner: Owner, tagTexture: Texture): BoxParts {
  const dots = owner.texture(dotsTexture());
  const wallMaterial = (width: number, height: number) => {
    const map = owner.texture(dots.clone());
    map.repeat.set(width / DOTS_TILE_WORLD, height / DOTS_TILE_WORLD);
    map.needsUpdate = true;
    return owner.material(new MeshStandardMaterial({ map, roughness: 0.9 }));
  };
  const group = new Group();
  const { width, height, depth, wall } = BOX;
  const add = (
    geometry: BoxGeometry,
    material: MeshStandardMaterial,
    x: number,
    y: number,
    z: number,
  ) => {
    const mesh = new Mesh(owner.geometry(geometry), material);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };

  // Walls, floor and rim.
  const front = wallMaterial(width, height);
  add(new BoxGeometry(width, height, wall), front, 0, height / 2, depth / 2 - wall / 2);
  add(new BoxGeometry(width, height, wall), front, 0, height / 2, -depth / 2 + wall / 2);
  const side = wallMaterial(depth, height);
  add(new BoxGeometry(wall, height, depth - 2 * wall), side, -width / 2 + wall / 2, height / 2, 0);
  add(new BoxGeometry(wall, height, depth - 2 * wall), side, width / 2 - wall / 2, height / 2, 0);
  add(new BoxGeometry(width, wall, depth), wallMaterial(width, depth), 0, wall / 2, 0);
  const rim = owner.material(
    new MeshStandardMaterial({ color: PALETTE.bodyLight, roughness: 0.85 }),
  );
  const rimY = height - BOX.rimHeight / 2;
  const rimGeometry = new RoundedBoxGeometry(BOX.rimWidth, BOX.rimHeight, BOX.rimDepth, 2, 0.05);
  const sideRim = new RoundedBoxGeometry(BOX.rimDepth, BOX.rimHeight, depth, 2, 0.05);
  for (const z of [depth / 2, -depth / 2]) {
    const mesh = new Mesh(owner.geometry(rimGeometry.clone()), rim);
    mesh.position.set(0, rimY, z);
    group.add(mesh);
  }
  for (const x of [-BOX.rimWidth / 2 + BOX.rimDepth / 2, BOX.rimWidth / 2 - BOX.rimDepth / 2]) {
    const mesh = new Mesh(owner.geometry(sideRim.clone()), rim);
    mesh.position.set(x, rimY, 0);
    group.add(mesh);
  }
  rimGeometry.dispose();
  sideRim.dispose();

  // Tissue and gold truffles inside.
  const tissue = new Mesh(
    owner.geometry(tissueSheet(width - 2 * wall, depth - 2 * wall)),
    owner.material(
      new MeshStandardMaterial({
        color: PALETTE.tissue,
        roughness: 0.95,
        side: DoubleSide,
        flatShading: true,
      }),
    ),
  );
  tissue.position.y = height - 0.1;
  group.add(tissue);
  const gold = owner.material(
    new MeshStandardMaterial({ color: PALETTE.gold, roughness: 0.35, metalness: 0.5 }),
  );
  for (const [px, py, r] of [
    [516, 362, 0.17],
    [482, 368, 0.15],
  ] as const) {
    const w = posterToWorld(px, py);
    const truffle = new Mesh(owner.geometry(new SphereGeometry(r, 20, 14)), gold);
    truffle.position.set(w.x, w.y - BOX.floorY, 0.45);
    group.add(truffle);
  }

  // Ribbon band down the front, and two tails that unroll.
  const ribbon = ribbonMaterial(owner);
  const band = new Mesh(owner.geometry(new BoxGeometry(RIBBON_BAND_WIDTH, height, 0.05)), ribbon);
  band.position.set(0, height / 2, depth / 2 + 0.09);
  group.add(band);
  const tails: Group[] = [];
  for (const side2 of [-1, 1] as const) {
    const pivot = new Group();
    pivot.position.set(side2 * (RIBBON_BAND_WIDTH / 2 + 0.01), height - 0.1, depth / 2 + 0.13);
    pivot.add(
      new Mesh(owner.geometry(bentTail(0.46, 1.9, side2, side2 === 1 ? 0.55 : 0.5, 0.32)), ribbon),
    );
    group.add(pivot);
    tails.push(pivot);
  }
  const tagWorld = posterToWorld(GIFT_TAG.x + 62.6, GIFT_TAG.y + 21.6);
  const tag = new Mesh(
    owner.geometry(
      new PlaneGeometry((GIFT_TAG.width * GIFT_TAG.scale) / 100, (70 * GIFT_TAG.scale) / 100),
    ),
    owner.material(new MeshBasicMaterial({
        map: tagTexture,
        transparent: true,
        premultipliedAlpha: true,
        alphaTest: 0.04,
        side: DoubleSide,
      })),
  );
  tag.position.set(tagWorld.x, tagWorld.y - BOX.floorY, depth / 2 + 0.2);
  tag.rotation.z = (-GIFT_TAG.rotDeg * Math.PI) / 180;
  group.add(tag);

  // The lid, with its band and bow.
  const lid = new Group();
  const lidMap = owner.texture(dots.clone());
  lidMap.repeat.set(LID_SIZE.width / DOTS_TILE_WORLD, LID_SIZE.height / DOTS_TILE_WORLD);
  lidMap.needsUpdate = true;
  const lidMaterial = owner.material(
    new MeshStandardMaterial({
      map: lidMap,
      color: new Color().setRGB(1.7, 1.55, 1.8),
      roughness: 0.85,
    }),
  );
  const lidBody = new Mesh(
    owner.geometry(
      new RoundedBoxGeometry(LID_SIZE.width, LID_SIZE.height, LID_SIZE.depth, 3, 0.09),
    ),
    lidMaterial,
  );
  lid.add(lidBody);
  const lidBand = new Mesh(
    owner.geometry(
      new BoxGeometry(RIBBON_BAND_WIDTH, LID_SIZE.height + 0.02, LID_SIZE.depth + 0.04),
    ),
    ribbon,
  );
  lid.add(lidBand);
  const bowGroup = bow(owner, ribbon);
  bowGroup.position.set(0, LID_SIZE.height / 2 + 0.22, 0.25);
  bowGroup.rotation.x = -0.18;
  lid.add(bowGroup);
  group.add(lid);

  return { group, lid, lidBody, lidBand, band, tails, tag };
}
