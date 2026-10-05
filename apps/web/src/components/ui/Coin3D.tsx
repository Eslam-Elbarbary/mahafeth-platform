import type { CSSProperties, Ref } from 'react';

import { cx } from '@/lib/cx';

/* Legacy `buildCoin`: 12 stacked discs over a 20px thickness, lighter toward the rim's middle. */
const LAYER_COUNT = 12;
const THICKNESS = 20;

const LAYERS: CSSProperties[] = Array.from({ length: LAYER_COUNT }, (_, i) => {
  const t = i / (LAYER_COUNT - 1);
  const z = -THICKNESS / 2 + t * THICKNESS;
  const k = 1 - Math.abs(t - 0.5) * 2;
  return {
    background: `hsl(126 40% ${(10 + k * 10).toFixed(1)}%)`,
    transform: `translateZ(${z.toFixed(2)}px)`,
  };
});

const BACK: CSSProperties = { transform: `translateZ(${-THICKNESS / 2 - 0.5}px) rotateY(180deg)` };
const FRONT: CSSProperties = { transform: `translateZ(${THICKNESS / 2 + 0.5}px)` };

type Coin3DProps = {
  ref?: Ref<HTMLDivElement>;
  /** The `.coin__in` element — the hero spins it independently of the pointer tilt. */
  innerRef?: Ref<HTMLDivElement>;
  className?: string;
};

/** The 3D logo coin: layered edge, seal on both faces, sweeping gloss on the front. */
export function Coin3D({ ref, innerRef, className }: Coin3DProps) {
  return (
    <div ref={ref} className={cx('coin', className)}>
      <div ref={innerRef} className="coin__in">
        {LAYERS.map((style, i) => (
          <div key={i} className="coin__lay" style={style} />
        ))}
        <div className="coin__b" style={BACK} />
        <div className="coin__f" style={FRONT}>
          <div className="coin__gl" />
        </div>
      </div>
    </div>
  );
}
