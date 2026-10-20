import {
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

import { buildBow } from "./bow";
import { boxShell, roundedSlab } from "./box-geometry";
import { BOX, GIFT_TAG, LID_SIZE, PALETTE, RIBBON_BAND_WIDTH } from "./constants";
import { bentTail, tissueSheet } from "./geometry";
import { posterToWorld } from "./layout";
import type { Owner } from "./owner";
import { DOTS_TILE_WORLD, dotsTexture, paperBumpTexture } from "./textures";

export interface BoxParts {
  /** Origin at the middle of the box base; the timeline squashes and drops this group. */
  group: Group;
  lid: Group;
  lidBody: Mesh;
  /** The lid's ribbon: one band front to back, one side to side. */
  lidBandZ: Mesh;
  lidBandX: Mesh;
  /** The band down the front of the box, with the piece that wraps over the top edge. */
  band: Group;
  /** Tail pivots: scale Y unrolls them down the front. */
  tails: Group[];
  tag: Mesh;
  tagMaterial: MeshBasicMaterial;
}

const RIBBON_DEPTH = 0.03;

function ribbonMaterial(owner: Owner): MeshPhysicalMaterial {
  return owner.material(
    new MeshPhysicalMaterial({
      color: PALETTE.ribbon,
      roughness: 0.42,
      sheen: 1,
      sheenRoughness: 0.3,
      sheenColor: new Color(PALETTE.ribbonSheen),
      side: DoubleSide,
    }),
  );
}

/** Matte card with a fine grain and foil dots. UVs are world units, so one texture fits every face. */
function paperMaterial(owner: Owner, tint?: Color): MeshStandardMaterial {
  const map = owner.texture(dotsTexture());
  map.repeat.set(1 / DOTS_TILE_WORLD, 1 / DOTS_TILE_WORLD);
  const bumpMap = owner.texture(paperBumpTexture());
  bumpMap.repeat.copy(map.repeat);
  return owner.material(
    new MeshStandardMaterial({
      map,
      bumpMap,
      bumpScale: 0.35,
      roughness: 0.78,
      ...(tint ? { color: tint } : {}),
    }),
  );
}

function addInterior(owner: Owner, group: Group): void {
  const { width, depth, height, wall } = BOX;
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
    new MeshStandardMaterial({ color: PALETTE.gold, roughness: 0.32, metalness: 0.55 }),
  );
  for (const [px, py, r] of [
    [516, 362, 0.17],
    [482, 368, 0.15],
  ] as const) {
    const w = posterToWorld(px, py);
    const truffle = new Mesh(owner.geometry(new SphereGeometry(r, 24, 16)), gold);
    truffle.position.set(w.x, w.y - BOX.floorY, 0.45);
    group.add(truffle);
  }
}

function addRibbonFront(owner: Owner, group: Group, ribbon: MeshPhysicalMaterial) {
  const { height, depth, wall } = BOX;
  const band = new Group();
  const front = new Mesh(
    owner.geometry(new RoundedBoxGeometry(RIBBON_BAND_WIDTH, height, RIBBON_DEPTH, 2, 0.012)),
    ribbon,
  );
  front.position.set(0, height / 2, depth / 2 + RIBBON_DEPTH / 2 + 0.002);
  band.add(front);
  const over = new Mesh(
    owner.geometry(new RoundedBoxGeometry(RIBBON_BAND_WIDTH, RIBBON_DEPTH, wall + 0.08, 2, 0.012)),
    ribbon,
  );
  over.position.set(0, height + RIBBON_DEPTH / 2, depth / 2 - wall / 2 + 0.01);
  band.add(over);
  group.add(band);

  const tails: Group[] = [];
  for (const side of [-1, 1] as const) {
    const pivot = new Group();
    pivot.position.set(side * (RIBBON_BAND_WIDTH / 2 + 0.01), height - 0.1, depth / 2 + 0.05);
    pivot.add(
      new Mesh(owner.geometry(bentTail(0.46, 1.9, side, side === 1 ? 0.55 : 0.5, 0.3)), ribbon),
    );
    group.add(pivot);
    tails.push(pivot);
  }
  return { band, tails };
}

function addTag(owner: Owner, group: Group, tagTexture: Texture) {
  const tagWorld = posterToWorld(GIFT_TAG.x + 62.6, GIFT_TAG.y + 21.6);
  const tagMaterial = owner.material(
    new MeshBasicMaterial({
      map: tagTexture,
      transparent: true,
      premultipliedAlpha: true,
      alphaTest: 0.01,
      side: DoubleSide,
    }),
  );
  const tag = new Mesh(
    owner.geometry(
      new PlaneGeometry((GIFT_TAG.width * GIFT_TAG.scale) / 100, (70 * GIFT_TAG.scale) / 100),
    ),
    tagMaterial,
  );
  tag.position.set(tagWorld.x, tagWorld.y - BOX.floorY, BOX.depth / 2 + 0.2);
  tag.rotation.z = (-GIFT_TAG.rotDeg * Math.PI) / 180;
  group.add(tag);
  return { tag, tagMaterial };
}

function buildLid(owner: Owner, ribbon: MeshPhysicalMaterial) {
  const lid = new Group();
  const lidBody = new Mesh(
    owner.geometry(
      roundedSlab(LID_SIZE.width, LID_SIZE.depth, LID_SIZE.height, BOX.corner, BOX.bevel),
    ),
    paperMaterial(owner, new Color().setRGB(1.55, 1.42, 1.65)),
  );
  lidBody.geometry.translate(0, -LID_SIZE.height / 2, 0);
  lid.add(lidBody);
  const lidBandZ = new Mesh(
    owner.geometry(
      new RoundedBoxGeometry(
        RIBBON_BAND_WIDTH,
        LID_SIZE.height + 2 * RIBBON_DEPTH,
        LID_SIZE.depth + 2 * RIBBON_DEPTH,
        2,
        0.014,
      ),
    ),
    ribbon,
  );
  lid.add(lidBandZ);
  const lidBandX = new Mesh(
    owner.geometry(
      new RoundedBoxGeometry(
        LID_SIZE.width + 2 * RIBBON_DEPTH,
        LID_SIZE.height + RIBBON_DEPTH,
        RIBBON_BAND_WIDTH,
        2,
        0.014,
      ),
    ),
    ribbon,
  );
  lid.add(lidBandX);
  const bow = buildBow(owner, ribbon);
  bow.position.set(0, LID_SIZE.height / 2 + RIBBON_DEPTH, 0.05);
  lid.add(bow);
  return { lid, lidBody, lidBandZ, lidBandX };
}

/** The black, gold-dotted box with its lid, ribbon, tails, bow, tag, tissue and truffles. */
export function buildBox(owner: Owner, tagTexture: Texture): BoxParts {
  const group = new Group();
  const paper = paperMaterial(owner);
  const shell = new Mesh(
    owner.geometry(
      boxShell({
        width: BOX.width,
        depth: BOX.depth,
        height: BOX.height,
        wall: BOX.wall,
        corner: BOX.corner,
        bevel: BOX.bevel,
      }),
    ),
    paper,
  );
  group.add(shell);
  const floor = new Mesh(
    owner.geometry(
      roundedSlab(BOX.width - 2 * BOX.wall, BOX.depth - 2 * BOX.wall, BOX.wall, 0.03, 0.01),
    ),
    paper,
  );
  group.add(floor);
  addInterior(owner, group);

  const ribbon = ribbonMaterial(owner);
  const { band, tails } = addRibbonFront(owner, group, ribbon);
  const { tag, tagMaterial } = addTag(owner, group, tagTexture);
  const { lid, lidBody, lidBandZ, lidBandX } = buildLid(owner, ribbon);
  group.add(lid);

  return { group, lid, lidBody, lidBandZ, lidBandX, band, tails, tag, tagMaterial };
}
