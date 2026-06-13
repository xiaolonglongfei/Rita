import { scoreColor } from "@/lib/utils";

type ScoreTriangleProps = {
  value: number | null;
  effectiveness: number | null;
  punctuality: number | null;
  reviewCount: number;
};

const CX = 120;
const CY = 128;
const R = 78;

const ANGLES = {
  value: -Math.PI / 2,
  effectiveness: Math.PI / 6,
  punctuality: (5 * Math.PI) / 6,
};

function triPt(score: number, angle: number): [number, number] {
  const s = score / 5;
  return [CX + R * s * Math.cos(angle), CY + R * s * Math.sin(angle)];
}

function bgPt(angle: number): [number, number] {
  return [CX + R * Math.cos(angle), CY + R * Math.sin(angle)];
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

  const bgV = bgPt(ANGLES.value);
  const bgE = bgPt(ANGLES.effectiveness);
  const bgP = bgPt(ANGLES.punctuality);

  const dataV = triPt(v, ANGLES.value);
  const dataE = triPt(e, ANGLES.effectiveness);
  const dataP = triPt(p, ANGLES.punctuality);

  const labelR = R + 20;
  const labelV: [number, number] = [
    CX + labelR * Math.cos(ANGLES.value),
    CY + labelR * Math.sin(ANGLES.value),
  ];
  const labelE: [number, number] = [
    CX + labelR * Math.cos(ANGLES.effectiveness),
    CY + labelR * Math.sin(ANGLES.effectiveness),
  ];
  const labelP: [number, number] = [
    CX + labelR * Math.cos(ANGLES.punctuality),
    CY + labelR * Math.sin(ANGLES.punctuality),
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center mb-4">
        Score Breakdown
      </p>

      {/* Triangle SVG — always rendered */}
      <div className="flex justify-center mb-4">
        <svg width={240} height={236} viewBox="0 0 240 236">
          <defs>
            <linearGradient id="fillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#b8d400" stopOpacity="0.20" />
            </linearGradient>
          </defs>

          {/* Background triangle */}
          <polygon
            points={`${bgV[0]},${bgV[1]} ${bgE[0]},${bgE[1]} ${bgP[0]},${bgP[1]}`}
            fill="#f4f6f9"
            stroke="#e2e8f0"
            strokeWidth="1.5"
          />

          {/* Data triangle */}
          <polygon
            points={`${dataV[0]},${dataV[1]} ${dataE[0]},${dataE[1]} ${dataP[0]},${dataP[1]}`}
            fill={hasData ? "url(#fillGrad)" : "#e2e8f0"}
            stroke={hasData ? "#f97316" : "#cbd5e1"}
            strokeWidth={hasData ? "2" : "1"}
          />

          {/* Dots */}
          <circle
            cx={dataV[0]}
            cy={dataV[1]}
            r="5"
            fill={hasData ? "#f97316" : "#cbd5e1"}
            stroke="white"
            strokeWidth="2"
          />
          <circle
            cx={dataE[0]}
            cy={dataE[1]}
            r="5"
            fill={hasData ? "#f97316" : "#cbd5e1"}
            stroke="white"
            strokeWidth="2"
          />
          <circle
            cx={dataP[0]}
            cy={dataP[1]}
            r="5"
            fill={hasData ? "#f97316" : "#cbd5e1"}
            stroke="white"
            strokeWidth="2"
          />

          {/* Axis labels */}
          <text
            x={labelV[0]}
            y={labelV[1]}
            textAnchor="middle"
            dy={-14}
            fontSize="11"
            fontWeight="600"
            fill="#475569"
          >
            💰 Value
          </text>
          <text
            x={labelE[0]}
            y={labelE[1]}
            textAnchor="start"
            dy="4"
            fontSize="11"
            fontWeight="600"
            fill="#475569"
          >
            📈 Eff.
          </text>
          <text
            x={labelP[0]}
            y={labelP[1]}
            textAnchor="end"
            dy="4"
            fontSize="11"
            fontWeight="600"
            fill="#475569"
          >
            ⏰ Punc.
          </text>
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
          {hasData ? `Overall Score · ${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}` : "No reviews yet"}
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
            <span className="text-xs font-semibold text-slate-500 w-28 flex-shrink-0">
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
