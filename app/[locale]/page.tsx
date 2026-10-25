"use client";

import { useState, useEffect } from "react";
import { Stop, Arrival } from "@/types/neoned";
import { Naolib } from "@/types/naolib";
import StopSearch from "@/components/StopSearch";
import MyStops from "@/components/MyStops";
import FeaturedStops from "@/components/FeaturedStops";
import {useTranslations} from 'next-intl';

const LOCAL_STORAGE_KEY = "naolib_personal_stops";

export default function Home() {
  const t = useTranslations("HomePage");

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

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <header className="mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Neoned</h1>
        <p className="text-sm text-slate-500 mt-1">{t('title')}</p>
      </header>

      <StopSearch onSelectStop={addStop} />

      <MyStops arrivals={arrivals} personalStops={personalStops} setPersonalStops={setPersonalStops} />

      <FeaturedStops personalStops={personalStops} onAddStop={addStop} />
    </main>
  );
}