import { shade } from "../../placeholders/color";
import { GREEN, GREEN_DARK, itemPalette, ROUND } from "../palette";
import { ItemFrame } from "../parts/ItemFrame";
import { ShadedPath } from "../parts/ShadedPath";
import type { ItemIllustrationProps } from "../types";

const BLOOM =
  "M52 78C46 40 78 26 100 30C124 26 156 42 148 80C146 108 124 128 100 128C76 128 54 108 52 78Z";

/** A rose on a green stem: tinted bloom with three inner petals, fixed green leaf and calyx. */
export function FlowerIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  const petal = { stroke: p.dark, strokeWidth: 2.8, ...ROUND };
  return (
    <ItemFrame shape="flower" fit={[1.1, 3.3, -8.8]}>
      <path
        d="M100 118C98 150 102 168 100 192"
        fill="none"
        stroke={GREEN}
        strokeWidth="7"
        {...ROUND}
      />
      <path
        d="M100 158C130 140 146 150 148 162C128 172 108 168 100 158Z"
        fill={GREEN}
        stroke={GREEN_DARK}
        strokeWidth="2.5"
        {...ROUND}
      />
      <path
        d="M108 160C122 154 134 154 142 160"
        fill="none"
        stroke={GREEN_DARK}
        strokeWidth="2"
        opacity="0.5"
        {...ROUND}
      />
      <ShadedPath d={BLOOM} fill={p.fill} deep={p.deep} stroke={p.dark} shift={7} />
      <path
        d="M66 70C70 48 92 46 104 62C112 82 100 108 82 108C66 104 62 84 66 70Z"
        fill={shade(color, 0.35)}
        {...petal}
      />
      <path
        d="M134 70C130 48 108 46 96 62C90 84 106 110 122 108C138 102 138 84 134 70Z"
        fill={shade(color, 0.15)}
        {...petal}
      />
      <path
        d="M86 62C90 44 112 46 114 64C116 80 104 92 96 90C86 86 82 74 86 62Z"
        fill={p.deep}
        stroke={p.dark}
        strokeWidth="2.6"
        {...ROUND}
      />
      <path
        d="M60 56q10-14 26-18"
        fill="none"
        stroke="#fff"
        strokeWidth="5"
        opacity="0.55"
        {...ROUND}
      />
      <path
        d="M84 126L100 112L116 126L100 138Z"
        fill={GREEN}
        stroke={GREEN_DARK}
        strokeWidth="2.5"
        {...ROUND}
      />
    </ItemFrame>
  );
}
