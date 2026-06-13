export function InstructorBadge({ isClaimed }: { isClaimed: boolean }) {
  if (isClaimed) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
        style={{ background: "#fff7ed", color: "#f97316", border: "1px solid #fed7aa" }}
      >
        ✓ Claimed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
      Unclaimed
    </span>
  );
}
