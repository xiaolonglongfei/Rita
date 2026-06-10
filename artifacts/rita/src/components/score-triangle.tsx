interface ScoreTriangleProps {
  value: number
  effectiveness: number
  punctuality: number
  reviewCount?: number
}

export function ScoreTriangle({ value, effectiveness, punctuality, reviewCount }: ScoreTriangleProps) {
  const CX = 110, CY = 105, R = 80;
  const ANGLES = [-90, 30, 150];
  const LABELS = ['💰 Value', '📈 Effectiveness', '⏰ Punctuality'];
  const LABEL_OFFSETS = [
    { dx: 0, dy: -18 },
    { dx: 22, dy: 14 },
    { dx: -22, dy: 14 },
  ];
  const scores = [value, effectiveness, punctuality];
  const overall = ((value + effectiveness + punctuality) / 3).toFixed(1);

  function getPoint(angleDeg: number, radius: number) {
    const rad = angleDeg * Math.PI / 180;
    return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
  }

  function polyStr(points: { x: number; y: number }[]) {
    return points.map(p => `${p.x},${p.y}`).join(' ');
  }

  const gridLevels = [1, 2, 3, 4, 5].map(g =>
    polyStr(ANGLES.map(a => getPoint(a, R * g / 5)))
  );

  const dataPts = ANGLES.map((a, i) => getPoint(a, R * Math.max(scores[i], 0.1) / 5));

  function scoreColor(s: number) {
    if (s >= 4.0) return '#1668c8';
    if (s >= 2.5) return '#c89000';
    return '#c83030';
  }

  const overallColor = scoreColor(parseFloat(overall));

  return (
    <div className="bg-card rounded-2xl border p-6 shadow-sm">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center mb-4">
        Score Breakdown
      </p>

      <div className="flex justify-center mb-4">
        <svg width="220" height="210" viewBox="0 0 220 210" overflow="visible">
          <defs>
            <linearGradient id="fillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1668c8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#b8d400" stopOpacity="0.20" />
            </linearGradient>
          </defs>

          {gridLevels.map((pts, i) => (
            <polygon key={i} points={pts} fill="none" stroke="var(--color-border)" strokeWidth="1" />
          ))}

          {ANGLES.map((a, i) => {
            const tip = getPoint(a, R);
            return <line key={i} x1={CX} y1={CY} x2={tip.x} y2={tip.y} stroke="var(--color-border)" strokeWidth="1" />;
          })}

          <polygon
            points={polyStr(dataPts)}
            fill="url(#fillGrad)"
            stroke="#1668c8"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {dataPts.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r="5" fill="#1668c8" stroke="white" strokeWidth="2" />
          ))}

          {dataPts.map((pt, i) => (
            <text
              key={i}
              x={pt.x + LABEL_OFFSETS[i].dx * 0.6}
              y={pt.y + LABEL_OFFSETS[i].dy * 0.6 - 8}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="#1668c8"
              fontFamily="-apple-system,sans-serif"
            >
              {scores[i].toFixed(1)}
            </text>
          ))}

          {ANGLES.map((a, i) => {
            const tip = getPoint(a, R + 20);
            return (
              <text
                key={i}
                x={tip.x + LABEL_OFFSETS[i].dx}
                y={tip.y + LABEL_OFFSETS[i].dy}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="var(--color-foreground)"
                fontFamily="-apple-system,sans-serif"
              >
                {LABELS[i]}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="text-center mb-5 pb-5 border-b">
        <div className="text-5xl font-bold" style={{ color: overallColor }}>
          {overall}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Overall Score{reviewCount ? ` · ${reviewCount} reviews` : ''}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {[
          { label: '💰 Value', score: value },
          { label: '📈 Effectiveness', score: effectiveness },
          { label: '⏰ Punctuality', score: punctuality },
        ].map(({ label, score }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground w-32 flex-shrink-0">
              {label}
            </span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(score / 5) * 100}%`, backgroundColor: '#1668c8' }}
              />
            </div>
            <span className="text-sm font-bold w-8 text-right" style={{ color: '#1668c8' }}>
              {score.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
