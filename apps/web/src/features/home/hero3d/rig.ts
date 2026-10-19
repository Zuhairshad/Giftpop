import {
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RingGeometry,
} from "three";

import { buildBox } from "./box-parts";
import { BOX, BOX_Z, PALETTE } from "./constants";
import { clamp01 } from "./easing";
import { posterToWorld } from "./layout";
import { Owner } from "./owner";
import type { SpriteArt } from "./sprite-art";
import { ITEM_ART_BOX, SPARKLES, SPRITES, STICKER_ART } from "./sprites";
import { radialTexture } from "./textures";
import type { HeroState } from "./timeline";

export interface Rig {
  root: Group;
  /** Moves every object to the pose in `state`. `cameraDistance` keeps sprite depth poster-true. */
  apply(state: HeroState, cameraDistance: number): void;
  /** Frees geometries, materials and textures the rig made (the shared art is freed by its owner). */
  dispose(): void;
}

function addLights(root: Group): void {
  root.add(new HemisphereLight(0xfff1f7, 0xcdb8ff, 1.15));
  const key = new DirectionalLight(0xfff0e4, 2.6);
  key.position.set(-4, 6, 6);
  root.add(key);
  const fill = new DirectionalLight(0xb9a4ff, 0.9);
  fill.position.set(5, 2, 4);
  root.add(fill);
  const bounce = new DirectionalLight(0xffc7a0, 0.7);
  bounce.position.set(0, -3, 4);
  root.add(bounce);
}

/** Builds the whole scene graph: lights, floor shadow, box, sprites and sparkles. */
export function buildRig(art: SpriteArt): Rig {
  const owner = new Owner();
  const root = new Group();
  addLights(root);

  const shadowMaterial = owner.material(
    new MeshBasicMaterial({
      map: owner.texture(radialTexture()),
      color: PALETTE.shadow,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    }),
  );
  const shadow = new Mesh(owner.geometry(new PlaneGeometry(5.6, 3.2)), shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, BOX.floorY + 0.01, BOX_Z + 0.6);
  shadow.renderOrder = -1;
  root.add(shadow);

  const ringMaterial = owner.material(
    new MeshBasicMaterial({
      color: new Color("#FFE0EC"),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  const ring = new Mesh(owner.geometry(new RingGeometry(0.92, 1, 64)), ringMaterial);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, BOX.floorY + 0.02, BOX_Z + 0.6);
  ring.visible = false;
  root.add(ring);

  const box = buildBox(owner, art.tag);
  root.add(box.group);

  const itemGeometry = owner.geometry(
    new PlaneGeometry(ITEM_ART_BOX.w / 100, ITEM_ART_BOX.h / 100),
  );
  const stickerGeometry = owner.geometry(
    new PlaneGeometry(STICKER_ART.w / 100, STICKER_ART.h / 100),
  );
  // The sticker's pivot is the heart's centre, not the middle of its art box.
  stickerGeometry.translate(
    (STICKER_ART.x + STICKER_ART.w / 2) / 100,
    -(STICKER_ART.y + STICKER_ART.h / 2) / 100,
    0,
  );
  const sprites = SPRITES.map((def) => {
    const map = art.sprites.get(def.id);
    const mesh = new Mesh(
      def.kind === "sticker" ? stickerGeometry : itemGeometry,
      owner.material(
        new MeshBasicMaterial({
          map,
          transparent: true,
          premultipliedAlpha: true,
          alphaTest: 0.04,
          toneMapped: false,
        }),
      ),
    );
    mesh.visible = false;
    root.add(mesh);
    return mesh;
  });

  const sparkleGeometry = owner.geometry(new PlaneGeometry(1, 1));
  const sparkles = SPARKLES.map((def) => {
    const mesh = new Mesh(
      sparkleGeometry,
      owner.material(
        new MeshBasicMaterial({
          map: art.sparkles.get(def.id),
          transparent: true,
          premultipliedAlpha: true,
          alphaTest: 0.04,
          toneMapped: false,
        }),
      ),
    );
    const w = posterToWorld(def.x, def.y);
    mesh.position.set(w.x, w.y, 0.3);
    mesh.visible = false;
    root.add(mesh);
    return mesh;
  });

  const apply = (state: HeroState, cameraDistance: number): void => {
    const { box: b, lid, ribbon } = state;
    box.group.position.set(0, BOX.floorY + b.y, BOX_Z);
    box.group.scale.set(b.scaleX, b.scaleY, b.scaleZ);
    box.group.rotation.z = b.rotZ;
    box.lid.position.set(lid.x, lid.y, lid.z);
    box.lid.rotation.z = lid.rotZ;
    box.lidBody.scale.set(lid.scaleX, 1, lid.scaleZ);
    box.lidBand.scale.z = lid.scaleZ;
    box.band.position.x = ribbon.sway;
    for (const tail of box.tails) {
      tail.visible = ribbon.tail > 0.001;
      tail.scale.y = Math.max(ribbon.tail, 0.0001);
    }
    box.tag.visible = ribbon.tail > 0.2;
    box.tag.scale.setScalar(clamp01((ribbon.tail - 0.2) / 0.8));

    shadow.scale.set(state.shadow.scale, state.shadow.scale, 1);
    shadowMaterial.opacity = 0.3 * state.shadow.opacity;
    ring.visible = state.ring.opacity > 0.004;
    ring.scale.setScalar(1.6 * state.ring.scale);
    ringMaterial.opacity = state.ring.opacity;

    SPRITES.forEach((def, i) => {
      const s = state.sprites[i];
      const mesh = sprites[i];
      if (!s || !mesh) return;
      // A sprite nearer the camera than the box plane would look bigger and off-centre; shrink it
      // towards the view axis so the resting layout equals the flat poster at any depth.
      const k = (cameraDistance - s.z) / cameraDistance;
      mesh.visible = s.scale > 0.001;
      mesh.position.set(s.x * k, s.y * k, s.z);
      mesh.scale.setScalar(Math.max(def.scale * s.scale * k, 1e-4));
      mesh.rotation.z = s.rotZ;
    });
    SPARKLES.forEach((def, i) => {
      const s = state.sparkles[i];
      const mesh = sparkles[i];
      if (!s || !mesh) return;
      mesh.visible = s.scale > 0.001;
      mesh.scale.setScalar(Math.max(def.size * 0.02 * s.scale, 1e-4));
      mesh.rotation.z = s.rotZ;
    });
  };

  return {
    root,
    apply,
    dispose: () => {
      owner.dispose();
    },
  };
}
