"use client";

import { Stop, Arrival } from "@/types/neoned";

interface StopCardProps {
  stop: Stop;
  arrivals?: Arrival[];
  selectedLines?: Set<string>;
  selectedDirection?: string | null;
  onRemove: (stopId: string) => void;
  onToggleLine: (stopId: string, line: string, availableLines: string[]) => void;
  onSelectDirection: (stopId: string, directionCode: string) => void;
}

export default function StopCard({
                                   stop,
                                   arrivals = [],
                                   selectedLines,
                                   selectedDirection,
                                   onRemove,
                                   onToggleLine,
                                   onSelectDirection,
                                 }: StopCardProps) {
  const availableLines = Array.from(new Set(arrivals.map(a => a.line))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  const lineFilteredArrivals = arrivals.filter(arr => {
    if (!selectedLines || selectedLines.size === 0) return true;
    return selectedLines.has(arr.line);
  });

  const isSingleLineSelected = (selectedLines && selectedLines.size === 1) || availableLines.length === 1;

  let directionOptions: { directionCode: string; label: string }[] = [];
  if (isSingleLineSelected) {
    const dirMap = new Map<string, Set<string>>();
    lineFilteredArrivals.forEach(arr => {
      if (arr.direction) {
        if (!dirMap.has(arr.direction)) {
          dirMap.set(arr.direction, new Set());
        }
        dirMap.get(arr.direction)!.add(arr.destination);
      }
    });

    directionOptions = Array.from(dirMap.entries()).map(([directionCode, destinations]) => ({
      directionCode,
      label: Array.from(destinations).join(" / "),
    })).sort((a, b) => a.label.localeCompare(b.label));
  }

  const filteredArrivals = lineFilteredArrivals.filter(arr => {
    if (!isSingleLineSelected) return true;
    if (!selectedDirection) return true;
    return arr.direction === selectedDirection;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 mb-4 shadow-xs hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight">{stop.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{stop.quays.length} quays available</p>
        </div>
        <button
          onClick={() => onRemove(stop.id)}
          className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-xl hover:bg-red-50"
          title="Remove station"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Passing Lines */}
      {availableLines.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Lines</div>
          <div className="flex flex-wrap gap-2.5">
            {availableLines.map(line => {
              const isSelected = selectedLines ? selectedLines.has(line) : false;
              return (
                <button
                  key={line}
                  onClick={() => onToggleLine(stop.id, line, availableLines)}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-bold bg-sky-100 text-slate-900 transition-all ${
                    isSelected
                      ? "ring-2 ring-slate-900 ring-offset-2 shadow-xs"
                      : "hover:bg-sky-200"
                  }`}
                >
                  {line}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Direction Filters (Single string selection) */}
      {isSingleLineSelected && directionOptions.length > 0 && (
        <div className="mb-4 pt-3 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Direction</div>
          <div className="flex flex-wrap gap-2.5">
            {directionOptions.map(dir => {
              const isSelected = selectedDirection === dir.directionCode;
              return (
                <button
                  key={dir.directionCode}
                  onClick={() => onSelectDirection(stop.id, dir.directionCode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-100 text-slate-900 transition-all ${
                    isSelected
                      ? "ring-2 ring-slate-900 ring-offset-2 shadow-xs"
                      : "hover:bg-indigo-200"
                  }`}
                >
                  {dir.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Departures */}
      <div className="pt-3 border-t border-slate-100">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Live Departures</div>
        {!arrivals ? (
          <p className="text-sm text-slate-400 py-2">Loading arrivals...</p>
        ) : filteredArrivals.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">No upcoming departures found.</p>
        ) : (
          <div className="space-y-2">
            {filteredArrivals.map((arr, idx) => {
              const timeString = new Date(arr.expectedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              let statusBadge = null;
              if (arr.arrivalStatus === "early") {
                statusBadge = <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">Early</span>;
              } else if (arr.arrivalStatus === "delayed" || arr.arrivalStatus === "late") {
                statusBadge = <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">Late</span>;
              }

              return (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-2xs">
                      {arr.line}
                    </span>
                    <span className="text-sm font-medium">
                      → {arr.destination}
                    </span>
                    {statusBadge}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{timeString}</span>
                    <span className="px-2 py-0.5 bg-slate-200/70 rounded-full text-[11px] font-medium text-slate-600">
                      Q{arr.quayNumber}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}