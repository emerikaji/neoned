"use client";

import { useState } from "react";
import { Naolib, MonitoredStop } from "@/types/naolib";

export default function NaolibStopApp() {
  const [stopRef, setStopRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [arrivals, setArrivals] = useState<MonitoredStop[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchStopMonitoring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stopRef) return;

    setLoading(true);
    setError(null);

    try {
      // Querying the real-time stop monitoring endpoint using your clean types
      const res = await fetch(`/api/neoned?endpoint=stop-monitoring&MonitoringRef=${stopRef}`);

      if (!res.ok) throw new Error("Failed to fetch stop data");

      const data: Naolib = await res.json();

      // Safely extract visits using the structured Naolib type
      const visits = data?.Siri?.ServiceDelivery?.StopMonitoringDelivery?.[0]?.MonitoredStopVisit || [];
      setArrivals(visits);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6 font-sans">
      <h1 className="text-2xl font-bold mb-4">Naolib Stop Monitoring</h1>

      <form onSubmit={fetchStopMonitoring} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Enter Stop Reference (e.g. StopPoint:1234)"
          value={stopRef}
          onChange={(e) => setStopRef(e.target.value)}
          className="flex-1 p-2 border rounded-lg"
        />
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold">
          Search
        </button>
      </form>

      {loading && <p>Loading upcoming transport...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-3">
        {arrivals.map((visit, idx) => {
          const journey = visit.MonitoredVehicleJourney;
          const lineName = journey?.PublishedLineName?.[0]?.value || journey?.LineRef?.value;
          const destination = journey?.DestinationName?.[0]?.value || "Unknown";
          const expectedArrival = journey?.MonitoredCall?.ExpectedArrivalTime;

          return (
            <div key={idx} className="p-4 border rounded-lg shadow-sm flex justify-between items-center bg-white">
              <div>
                <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-1 rounded mr-3">
                  {lineName}
                </span>
                <span className="text-gray-700">Direction: {destination}</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-indigo-600">
                  {expectedArrival ? new Date(expectedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "On time"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}