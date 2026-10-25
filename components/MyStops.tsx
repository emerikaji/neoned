import StopCard from "@/components/StopCard";
import {useTranslations} from "next-intl";
import {useState} from "react";
import { Stop, Arrival } from "@/types/neoned";

interface MyStopsProps {
  arrivals: Record<string, Arrival[]>;
  personalStops: Stop[];
  setPersonalStops: (stops: Stop[]) => void;
}

export default function MyStops({ arrivals, personalStops, setPersonalStops }: MyStopsProps) {
  const t = useTranslations("HomePage");

  const [selectedLines, setSelectedLines] = useState<Record<string, Set<string>>>({});
  const [selectedDirections, setSelectedDirections] = useState<Record<string, string | null>>({});

  const removeStop = (stopId: string) => {
    setPersonalStops(personalStops.filter(s => s.id !== stopId));
    setSelectedLines(prev => { const copy = { ...prev }; delete copy[stopId]; return copy; });
    setSelectedDirections(prev => { const copy = { ...prev }; delete copy[stopId]; return copy; });
  };

  const toggleLineFilter = (stopId: string, line: string, availableLines: string[]) => {
    setSelectedLines(prev => {
      const current = prev[stopId] ? new Set(prev[stopId]) : new Set<string>();
      current.has(line) ? current.delete(line) : current.add(line);
      if (current.size === availableLines.length) {
        const copy = { ...prev };
        delete copy[stopId];
        return copy;
      }
      return { ...prev, [stopId]: current };
    });
    // Reset direction filter when line selection changes
    setSelectedDirections(prev => ({ ...prev, [stopId]: null }));
  };

  const handleSelectDirection = (stopId: string, dirCode: string) => {
    setSelectedDirections(prev => {
      // If clicking the currently active direction, toggle it off (set to null)
      if (prev[stopId] === dirCode) {
        return { ...prev, [stopId]: null };
      }
      // Otherwise select the new direction
      return { ...prev, [stopId]: dirCode };
    });
  };

  return (
    <section>
      <h2 className="text-lg font-bold tracking-tight mb-4">{t('myStops')}</h2>
      {personalStops.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xs">
          <p className="text-slate-500 text-sm">No personal stops added yet.</p>
          <p className="text-slate-400 text-xs mt-1">Search above or select a nearby stop below to get started.</p>
        </div>
      ) : (
        <div>
          {personalStops.map((stop) => (
            <StopCard
              key={stop.id}
              stop={stop}
              arrivals={arrivals[stop.id]}
              selectedLines={selectedLines[stop.id]}
              selectedDirection={selectedDirections[stop.id]}
              onRemove={removeStop}
              onToggleLine={toggleLineFilter}
              onSelectDirection={handleSelectDirection}
            />
          ))}
        </div>
      )}
    </section>
  )
}