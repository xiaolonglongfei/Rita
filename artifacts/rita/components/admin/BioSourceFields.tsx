"use client";

export function BioSourceFields({ url, checkedOn, onUrlChange, onDateChange, disabled = false }: {
  url: string;
  checkedOn: string;
  onUrlChange: (value: string) => void;
  onDateChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-xs font-semibold text-slate-700">
        Bio source URL
        <input type="url" value={url} onChange={(event) => onUrlChange(event.target.value)}
          disabled={disabled} maxLength={2048} placeholder="https://example.com/coach"
          className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal" />
      </label>
      <label className="block text-xs font-semibold text-slate-700">
        Bio source checked on
        <input type="date" value={checkedOn} onChange={(event) => onDateChange(event.target.value)}
          disabled={disabled}
          className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal" />
      </label>
    </div>
  );
}
