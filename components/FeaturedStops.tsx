"use client";

import { useState, useEffect } from "react";
import { Stop } from "@/types/neoned";

interface FeaturedStopsProps {
  personalStops: Stop[];
  onAddStop: (stop: Stop) => void;
  onRemoveStop: (stopId: string) => void;
}

export default function FeaturedStops({ personalStops, onAddStop, onRemoveStop }: FeaturedStopsProps) {
  const [featuredStops, setFeaturedStops] = useState<Stop[]>([]);
  const [locationStatus, setLocationStatus] = useState<string>("Locating nearest stops...");

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`/api/neoned/near?lat=${latitude}&lng=${longitude}`);
          const data = await res.json();
          setFeaturedStops(data);
          setLocationStatus("");
        } catch (err) {
          console.error("Failed to fetch nearest stops", err);
          setLocationStatus("Failed to load nearby stops.");
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationStatus("Location access denied or unavailable.");
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold tracking-tight">Nearby Stops</h2>
      </div>

      {locationStatus && <p className="text-sm text-slate-400 italic mb-3">{locationStatus}</p>}

      {featuredStops.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {featuredStops.map((stop) => {
            const isAdded = personalStops.some(s => s.id === stop.id);
            const distKm = stop.distance !== undefined ? stop.distance.toFixed(2) : null;

            return (
              <div
                key={stop.id}
                className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-xs hover:border-slate-300 transition-all"
              >
                <div>
                  <h4 className="font-semibold text-sm">{stop.name}</h4>
                  {distKm && <span className="text-xs text-slate-400">{distKm} km away</span>}
                </div>
                <button
                  onClick={() => {
                    if (isAdded) {
                      onRemoveStop(stop.id);
                    } else {
                      onAddStop(stop);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isAdded
                      ? "border border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                      : "border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  {isAdded ? "Added" : "+ Add"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}