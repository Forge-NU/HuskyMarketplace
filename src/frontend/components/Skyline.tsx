// Boston-ish skyline, original drawing. Uses a seeded RNG so the server
// and client render the exact same shapes.

const W = 1400, H = 380, BASE = 300;

type Rect = { x: number; y: number; width: number; height: number; opacity?: number; rx?: number };

function build() {
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const far: Rect[] = [], near: Rect[] = [], windows: Rect[] = [], reflections: Rect[] = [];

  for (let x = -20; x < W; ) {
    const w = 30 + rnd() * 50, h = 30 + rnd() * 60;
    far.push({ x, y: BASE - h, width: w, height: h });
    x += w - 4;
  }

  const towers: [number, number, number][] = [];
  for (let x = -10; x < W; ) {
    const w = 38 + rnd() * 60, h = 40 + rnd() * 75;
    towers.push([x, w, h]);
    x += w + 6 + rnd() * 10;
  }
  for (const [x, w, h] of towers) {
    near.push({ x, y: BASE - h, width: w, height: h });
    for (let wy = BASE - h + 12; wy < BASE - 10; wy += 14)
      for (let wx = x + 7; wx < x + w - 8; wx += 12)
        if (rnd() > 0.72) windows.push({ x: wx, y: wy, width: 4, height: 6 });
  }

  // Landmark: broad tower with mast
  const px = 860, pw = 96, ph = 150;
  near.push({ x: px, y: BASE - ph, width: pw, height: ph }, { x: px + 40, y: BASE - ph - 40, width: 6, height: 40 });
  for (let wy = BASE - ph + 14; wy < BASE - 10; wy += 16)
    windows.push({ x: px + 8, y: wy, width: pw - 16, height: 3, opacity: 0.7 });

  // Landmark: slim glass tower
  const hx = 1000, hw = 58, hh = 175;
  const glassTower = `${hx},${BASE} ${hx},${BASE - hh + 20} ${hx + hw},${BASE - hh} ${hx + hw},${BASE}`;

  for (let i = 0; i < 26; i++) {
    reflections.push({ x: rnd() * W, y: BASE + 10 + rnd() * 70, width: 20 + rnd() * 90, height: 2, rx: 1 });
  }
  return { far, near, windows, reflections, glassTower };
}

const SKY = build();
const rects = (list: Rect[]) => list.map((r, i) => <rect key={i} {...r} />);

export default function Skyline({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <rect width={W} height={H} fill="var(--sky)" />
      <g fill="var(--bldg-far)">{rects(SKY.far)}</g>
      <g fill="var(--bldg-near)">
        {rects(SKY.near)}
        <polygon points={SKY.glassTower} />
      </g>
      <g fill="var(--window)">{rects(SKY.windows)}</g>
      <rect y={BASE} width={W} height={H - BASE} fill="var(--water)" />
      <g fill="var(--window)" opacity={0.35}>{rects(SKY.reflections)}</g>
    </svg>
  );
}
