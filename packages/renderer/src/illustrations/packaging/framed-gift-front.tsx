import { useId } from "react";

import { FRAMED_GIFT_FRAME as F, FRAMED_GIFT_WINDOW as W } from "../../layouts/framed-gift";
import { ROUND } from "../palette";
import type { PackagingIllustrationProps } from "../types";

import { Bow } from "./Bow";
import { boxTones } from "./tones";

/** Over the items: a soft glass glare, the mat's inner lip and a bow on the top rail. */
export function FramedGiftFront({ wrapper, ribbon }: PackagingIllustrationProps) {
  const box = boxTones(wrapper);
  const id = useId().replace(/:/g, "");
  const right = W.x + W.width;
  const bottom = W.y + W.height;
  return (
    <g data-art="front">
      <clipPath id={`framed-gift-clip-${id}`}>
        <rect x={W.x} y={W.y} width={W.width} height={W.height} />
      </clipPath>
      <g clipPath={`url(#framed-gift-clip-${id})`}>
        <path
          d={`M${W.x + 40} ${bottom}L${W.x + 190} ${W.y}H${W.x + 250}L${W.x + 100} ${bottom}Z`}
          fill="#fff"
          opacity="0.14"
        />
        <path
          d={`M${W.x + 150} ${bottom}L${W.x + 300} ${W.y}H${W.x + 322}L${W.x + 172} ${bottom}Z`}
          fill="#fff"
          opacity="0.1"
        />
      </g>
      <path
        d={`M${W.x} ${bottom}V${W.y}H${right}`}
        fill="none"
        stroke={box.edge}
        strokeWidth="8"
        opacity="0.22"
        {...ROUND}
      />
      <path
        d={`M${F.x + 40} ${F.y + 14}H${F.x + 140}`}
        stroke="#fff"
        strokeWidth="8"
        opacity="0.45"
        {...ROUND}
      />
      <g transform={`translate(500 ${F.y + 22})`}>
        <Bow ribbon={ribbon} scale={0.45} />
      </g>
    </g>
  );
}
