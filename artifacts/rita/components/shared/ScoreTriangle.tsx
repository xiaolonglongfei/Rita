import { scoreColor } from "@/lib/utils";

type ScoreTriangleProps = {
  value: number | null;
  effectiveness: number | null;
  punctuality: number | null;
  reviewCount: number;
};

// SVG canvas
const W = 300;
const H = 250;
const CX = 150;
const CY = 132;
const R = 82;

const ANGLES = [
  -Math.PI / 2,       // Value — top
  Math.PI / 6,        // Effectiveness — bottom right
  (5 * Math.PI) / 6, // Punctuality — bottom left
];

// Fixed label anchor positions — chosen so no label clips the SVG edges
const LABEL_POS = [
  { x: CX,       y: 16,  anchor: "middle" },  // 💰 Value — top center
  { x: W - 4,    y: 188, anchor: "end"    },  // 📈 Effectiveness — bottom right
  { x: 4,        y: 188, anchor: "start"  },  // ⏰ Punctuality — bottom left
] as const;

const LABELS = ["💰 Value", "📈 Effectiveness", "⏰ Punctuality"];

function bgPt(angle: number): [number, number] {
  return [CX + R * Math.cos(angle), CY + R * Math.sin(angle)];
}

function dataPt(score: number, angle: number): [number, number] {
  const s = score / 5;
  return [CX + R * s * Math.cos(angle), CY + R * s * Math.sin(angle)];
}

export function ScoreTriangle({
  value,
  effectiveness,
  punctuality,
  reviewCount,
}: ScoreTriangleProps) {
  const v = value ?? 0;
  const e = effectiveness ?? 0;
  const p = punctuality ?? 0;
  const overall = (v + e + p) / 3;
  const hasData = reviewCount > 0;

  const scores = [v, e, p];
  const bgPts = ANGLES.map(bgPt);
  const dataPts = ANGLES.map((angle, i) => dataPt(scores[i], angle));

  const bgPolygon = bgPts.map((pt) => pt.join(",")).join(" ");
  const dataPolygon = dataPts.map((pt) => pt.join(",")).join(" ");

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center mb-4">
        Score Breakdown
      </p>

      {/* Triangle SVG — always rendered */}
      <div className="flex justify-center mb-4">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <linearGradient id="fillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#b8d400" stopOpacity="0.20" />
            </linearGradient>
          </defs>

          {/* Background triangle */}
          <polygon
            points={bgPolygon}
            fill="#f4f6f9"
            stroke="#e2e8f0"
            strokeWidth="1.5"
          />

          {/* Data triangle */}
          <polygon
            points={dataPolygon}
            fill={hasData ? "url(#fillGrad)" : "#e2e8f0"}
            stroke={hasData ? "#f97316" : "#cbd5e1"}
            strokeWidth={hasData ? "2" : "1"}
          />

          {/* Dots at data vertices */}
          {dataPts.map((pt, i) => (
            <circle
              key={i}
              cx={pt[0]}
              cy={pt[1]}
              r="5"
              fill={hasData ? "#f97316" : "#cbd5e1"}
              stroke="white"
              strokeWidth="2"
            />
          ))}

          {/* Axis labels — fixed positions to prevent clipping */}
          {LABEL_POS.map(({ x, y, anchor }, i) => (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor={anchor}
              fontSize="11"
              fontWeight="600"
              fill="#1e2a38"
              fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
            >
              {LABELS[i]}
            </text>
          ))}
        </svg>
      </div>

      {/* Overall score */}
      <div className="text-center mb-5 pb-5 border-b border-slate-100">
        <div
          className="text-5xl font-bold leading-none"
          style={{ color: hasData ? scoreColor(overall) : "#cbd5e1" }}
        >
          {hasData ? overall.toFixed(1) : "—"}
        </div>
        <div className="text-xs text-slate-400 mt-2">
          {hasData
            ? `Overall Score · ${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}`
            : "No reviews yet"}
        </div>
      </div>

      {/* Score bars */}
      <div className="flex flex-col gap-3">
        {[
          { label: "💰 Value", score: v },
          { label: "📈 Effectiveness", score: e },
          { label: "⏰ Punctuality", score: p },
        ].map(({ label, score }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 w-32 flex-shrink-0">
              {label}
            </span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: hasData ? `${(score / 5) * 100}%` : "0%",
                  background: hasData ? scoreColor(score) : "#cbd5e1",
                }}
              />
            </div>
            <span
              className="text-sm font-bold w-8 text-right"
              style={{ color: hasData ? scoreColor(score) : "#cbd5e1" }}
            >
              {hasData ? score.toFixed(1) : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
