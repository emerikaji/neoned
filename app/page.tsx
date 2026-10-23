"use client";

import { useState, useEffect } from "react";
import { Stop, Arrival } from "@/types/neoned";
import { Naolib } from "@/types/naolib";
import StopSearch from "@/components/StopSearch";
import StopCard from "@/components/StopCard";
import FeaturedStops from "@/components/FeaturedStops";

const LOCAL_STORAGE_KEY = "naolib_personal_stops";

export default function Home() {
  const [personalStops, setPersonalStops] = useState<Stop[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [arrivals, setArrivals] = useState<Record<string, Arrival[]>>({});
  const [selectedLines, setSelectedLines] = useState<Record<string, Set<string>>>({});
  // Changed from Set to a single string (or null) per stop ID
  const [selectedDirections, setSelectedDirections] = useState<Record<string, string | null>>({});

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(personalStops));
    } catch (e) {
      console.error("Failed to save personal stops", e);
    }
  }, [personalStops]);

  useEffect(() => {
    if (personalStops.length === 0) return;

    const fetchArrivals = async () => {
      const newArrivals: Record<string, Arrival[]> = {};

      for (const stop of personalStops) {
        const stopArrivals: Arrival[] = [];

        for (let j = 0; j < stop.quays.length; j++) {
          const quay = stop.quays[j];
          const quayNumber = j + 1;

          try {
            const res = await fetch(`/api/naolib?endpoint=stop-monitoring&MonitoringRef=${quay.id}`);
            const data: Naolib = await res.json();
            const visits = data?.Siri?.ServiceDelivery?.StopMonitoringDelivery?.[0]?.MonitoredStopVisit || [];

            for (const visit of visits) {
              const journey = visit.MonitoredVehicleJourney;
              if (!journey) continue;

              stopArrivals.push({
                line: journey.LineRef?.value || "Unknown",
                direction: journey.DirectionName?.[0]?.value || "",
                destination: journey.DestinationName?.[0]?.value || "Unknown",
                expectedArrivalTime: journey.MonitoredCall?.ExpectedArrivalTime || "",
                arrivalStatus: journey.MonitoredCall?.ArrivalStatus || "",
                quayNumber,
              });
            }
          } catch (err) {
            console.error(`Error fetching quay ${quay.id}:`, err);
          }
        }

        const uniqueArrivals = Array.from(
          new Map(stopArrivals.map(item => [`${item.line}-${item.direction}-${item.destination}-${item.expectedArrivalTime}`, item])).values()
        );

        uniqueArrivals.sort((a, b) => {
          const lineCompare = a.line.localeCompare(b.line, undefined, { numeric: true, sensitivity: 'base' });
          if (lineCompare !== 0) return lineCompare;
          const dirCompare = a.direction.localeCompare(b.direction);
          if (dirCompare !== 0) return dirCompare;
          return new Date(a.expectedArrivalTime).getTime() - new Date(b.expectedArrivalTime).getTime();
        });

        newArrivals[stop.id] = uniqueArrivals;
      }
      setArrivals(newArrivals);
    };

    fetchArrivals();
    const interval = setInterval(fetchArrivals, 30000);
    return () => clearInterval(interval);
  }, [personalStops]);

  const addStop = (stop: Stop) => {
    if (!personalStops.some(s => s.id === stop.id)) {
      setPersonalStops([...personalStops, stop]);
    }
  };

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
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <header className="mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Neoned</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time Naolib arrivals tracker</p>
      </header>

      <StopSearch onSelectStop={addStop} />

      <section>
        <h2 className="text-lg font-bold tracking-tight mb-4">My Stops</h2>
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

      <FeaturedStops personalStops={personalStops} onAddStop={addStop} onRemoveStop={removeStop} />
    </main>
  );
}