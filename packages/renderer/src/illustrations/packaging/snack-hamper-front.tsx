import { useId } from "react";

import { SNACK_HAMPER } from "../../layouts/snack-hamper";
import { ROUND } from "../palette";
import type { PackagingIllustrationProps } from "../types";

import { Bow } from "./Bow";
import { boxTones, ribbonTones, wrapTones } from "./tones";

const { rimY, centerX } = SNACK_HAMPER;
const FACE = `M130 ${rimY}H870L842 890H158Z`;

/** Over the items: a few paper strands over the rim, the slatted front, corner posts and ribbon. */
export function SnackHamperFront({ wrapper, ribbon }: PackagingIllustrationProps) {
  const t = wrapTones(wrapper);
  const box = boxTones(wrapper);
  const r = ribbonTones(ribbon);
  const id = useId().replace(/:/g, "");
  const stroke = { stroke: box.edge, strokeWidth: 6, ...ROUND } as const;
  return (
    <g data-art="front">
      <clipPath id={`snack-hamper-clip-${id}`}>
        <path d={FACE} />
      </clipPath>
      <path d={FACE} fill={box.face} {...stroke} />
      <g clipPath={`url(#snack-hamper-clip-${id})`}>
        <path
          d="M120 744H880M120 800H880M120 856H880"
          stroke={box.edge}
          strokeWidth="5"
          opacity="0.5"
        />
        <path
          d="M120 750H880M120 806H880M120 862H880"
          stroke={t.lit}
          strokeWidth="3"
          opacity="0.5"
        />
        <path d={`M120 764H880V818H120Z`} fill={r.fill} />
        <path d="M120 764H880M120 818H880" stroke={r.edge} strokeWidth="4" />
        <path d="M120 774H880" stroke={r.light} strokeWidth="4" opacity="0.6" />
      </g>
      <path d={`M126 ${rimY - 18}H874V${rimY + 22}H126Z`} fill={t.lit} {...stroke} />
      <path d={`M170 ${rimY - 6}H420`} stroke="#fff" strokeWidth="8" opacity="0.45" {...ROUND} />
      <path
        d={`M126 ${rimY - 18}H168V890H126ZM832 ${rimY - 18}H874V890H832Z`}
        fill={t.base}
        {...stroke}
      />
      <g fill="none" stroke={box.crease} strokeWidth="9" {...ROUND}>
        <path d={`M300 ${rimY - 14}C318 ${rimY - 40} 286 ${rimY - 50} 308 ${rimY - 72}`} />
        <path d={`M662 ${rimY - 14}C646 ${rimY - 36} 678 ${rimY - 48} 656 ${rimY - 66}`} />
      </g>
      <g transform={`translate(${centerX} 791)`}>
        <Bow ribbon={ribbon} scale={0.4} />
      </g>
    </g>
  );
}
