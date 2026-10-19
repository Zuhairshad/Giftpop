"use client";

import { animate, motion, useMotionTemplate, useMotionValue, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import { useEffect, useState } from "react";

import { ItemPlaceholderArt } from "./art";
import { itemImageBox } from "./images";
import { LoadableImage } from "./LoadableImage";
import type { SceneEntry, SceneItemArt } from "./model";
import { ENTER_SCALE, itemMotionProps, SLOT_SPRING } from "./motion-config";

function AnimatedItemArt({ art, nearViewport }: { art: SceneItemArt; nearViewport: boolean }) {
  const placeholder = <ItemPlaceholderArt art={art} />;
  if (!art.image) return placeholder;
  return (
    <LoadableImage
      key={art.image.url}
      url={art.image.url}
      box={itemImageBox(art.image)}
      nearViewport={nearViewport}
      placeholder={placeholder}
    />
  );
}

/**
 * One item in its slot. Position, rotation and scale are motion values that
 * spring to each new placement, so a shuffle slides items instead of remounting
 * them. Entering items fade and grow in; leaving items fade out. Under reduced
 * motion every value jumps and nothing fades.
 */
export function AnimatedItem({
  entry,
  reduced,
  entering,
  nearViewport,
}: {
  entry: SceneEntry;
  reduced: boolean;
  /** True for items added after the scene first mounted. */
  entering: boolean;
  nearViewport: boolean;
}) {
  const { placement: p, art } = entry;
  const [startsEntering] = useState(entering && !reduced);
  const x = useMotionValue(p.x);
  const y = useMotionValue(p.y);
  const rotation = useMotionValue(p.rotation);
  const scale = useMotionValue(p.scale);
  const pop = useMotionValue(startsEntering ? ENTER_SCALE : 1);
  const size = useTransform(
    [scale, pop],
    (latest: number[]) => (latest[0] ?? 1) * (latest[1] ?? 1),
  );
  const transform = useMotionTemplate`translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${size})`;

  useEffect(() => {
    const targets: [MotionValue<number>, number][] = [
      [x, p.x],
      [y, p.y],
      [rotation, p.rotation],
      [scale, p.scale],
    ];
    if (reduced) {
      for (const [value, target] of targets) value.jump(target);
      pop.jump(1);
      return undefined;
    }
    const controls = targets.map(([value, target]) => animate(value, target, SLOT_SPRING));
    if (pop.get() !== 1) controls.push(animate(pop, 1, SLOT_SPRING));
    return () => {
      for (const control of controls) control.stop();
    };
  }, [p.x, p.y, p.rotation, p.scale, reduced, x, y, rotation, scale, pop]);

  return (
    <motion.g
      {...itemMotionProps(reduced, startsEntering)}
      // Origin at the scene's 0,0 so rotate and scale pivot on the anchor, as in the static
      // scene. Motion ignores a plain `transformOrigin` for SVG and defaults to 50% 50%;
      // `originX`/`originY` are the props it honours.
      style={{ transform, originX: 0, originY: 0, transformBox: "view-box" }}
      data-item-index={entry.key}
    >
      <AnimatedItemArt art={art} nearViewport={nearViewport} />
    </motion.g>
  );
}
