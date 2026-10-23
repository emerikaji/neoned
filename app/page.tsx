"use client";

import { useState, useEffect } from "react";
import { Naolib } from "@/types/naolib";

interface Quay {
  id: string;
  name: string;
}

interface Stop {
  id: string;
  name: string;
  quays: Quay[];
}

interface Arrival {
  line: string;
  direction: string;
  destination: string;
  expectedArrivalTime: string;
  arrivalStatus: string;
  quayNumber: number;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Stop[]>([]);
  const [personalStops, setPersonalStops] = useState<Stop[]>([]);
  const [arrivals, setArrivals] = useState<Record<string, Arrival[]>>({});

  // State for line and direction filters per stop
  const [selectedLines, setSelectedLines] = useState<Record<string, Set<string>>>({});
  const [selectedDirections, setSelectedDirections] = useState<Record<string, Set<string>>>({});

  const [loadingSearch, setLoadingSearch] = useState(false);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim().length < 2) {
      setSearchResults([]);
    }
  };

  useEffect(() => {
    if (query.trim().length < 2) return;

    const fetchStops = async () => {
      setLoadingSearch(true);
      try {
        const res = await fetch(`/api/neoned?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error("Failed to search stops", err);
      } finally {
        setLoadingSearch(false);
      }
    };

    const timeout = setTimeout(fetchStops, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (personalStops.length === 0) return;

    const fetchArrivals = async () => {
      const newArrivals: Record<string, Arrival[]> = {};

      for (let i = 0; i < personalStops.length; i++) {
        const stop = personalStops[i];
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

              const line = journey.LineRef?.value || "Unknown";
              const direction = journey.DirectionName?.[0]?.value || "";
              const destination = journey.DestinationName?.[0]?.value || "Unknown";
              const call = journey.MonitoredCall;

              if (call?.ExpectedArrivalTime) {
                stopArrivals.push({
                  line,
                  direction,
                  destination,
                  expectedArrivalTime: call.ExpectedArrivalTime,
                  arrivalStatus: call.ArrivalStatus || "",
                  quayNumber,
                });
              }
            }
          } catch (err) {
            console.error(`Error fetching arrivals for quay ${quay.id}:`, err);
          }
        }

        // Deduplicate arrivals across quays
        const uniqueArrivals = Array.from(
          new Map(stopArrivals.map(item => [`${item.line}-${item.direction}-${item.destination}-${item.expectedArrivalTime}`, item])).values()
        );

        // Sort: 1. Line name, 2. Direction, 3. Expected Arrival Time
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
    setQuery("");
    setSearchResults([]);
  };

  const removeStop = (stopId: string) => {
    setPersonalStops(personalStops.filter(s => s.id !== stopId));
    setSelectedLines(prev => {
      const copy = { ...prev };
      delete copy[stopId];
      return copy;
    });
    setSelectedDirections(prev => {
      const copy = { ...prev };
      delete copy[stopId];
      return copy;
    });
  };

  // Toggle line filter
  const toggleLineFilter = (stopId: string, line: string, availableLines: string[]) => {
    setSelectedLines(prev => {
      const currentSelected = prev[stopId] ? new Set(prev[stopId]) : new Set<string>();

      if (currentSelected.has(line)) {
        currentSelected.delete(line);
      } else {
        currentSelected.add(line);
      }

      if (currentSelected.size === availableLines.length) {
        const copy = { ...prev };
        delete copy[stopId];
        return copy;
      }

      return {
        ...prev,
        [stopId]: currentSelected
      };
    });

    // Reset direction filter for this stop when line selection changes
    setSelectedDirections(prev => {
      const copy = { ...prev };
      delete copy[stopId];
      return copy;
    });
  };

  // Toggle direction filter
  const toggleDirectionFilter = (stopId: string, direction: string, availableDirections: string[]) => {
    setSelectedDirections(prev => {
      const currentSelected = prev[stopId] ? new Set(prev[stopId]) : new Set<string>();

      if (currentSelected.has(direction)) {
        currentSelected.delete(direction);
      } else {
        currentSelected.add(direction);
      }

      if (currentSelected.size === availableDirections.length) {
        const copy = { ...prev };
        delete copy[stopId];
        return copy;
      }

      return {
        ...prev,
        [stopId]: currentSelected
      };
    });
  };

  return (
    <main style={{ padding: "1.5rem", maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>Nantes Transit App</h1>

      {/* Search Section */}
      <div style={{ marginBottom: "2rem", position: "relative" }}>
        <input
          type="text"
          placeholder="Search for a stop (e.g. Commerce)..."
          value={query}
          onChange={handleQueryChange}
          style={{ width: "100%", padding: "0.5rem", fontSize: "1rem", boxSizing: "border-box" }}
        />
        {loadingSearch && <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.25rem" }}>Searching...</div>}

        {searchResults.length > 0 && (
          <ul style={{ border: "1px solid #ccc", listStyle: "none", padding: 0, margin: 0, background: "#fff", position: "absolute", width: "100%", zIndex: 10, boxSizing: "border-box" }}>
            {searchResults.map((stop) => (
              <li
                key={stop.id}
                onClick={() => addStop(stop)}
                style={{ padding: "0.5rem", cursor: "pointer", borderBottom: "1px solid #eee" }}
              >
                <strong>{stop.name}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Personal List & Live Departures */}
      <h2>My Stops</h2>
      {personalStops.length === 0 ? (
        <p style={{ color: "#666" }}>No stops added yet. Search and select a stop above.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {personalStops.map((stop) => {
            const stopArrivals = arrivals[stop.id] || [];

            // Available lines for this stop
            const availableLines = Array.from(new Set(stopArrivals.map(a => a.line))).sort((a, b) =>
              a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
            );

            const activeLineFilters = selectedLines[stop.id];

            // Determine available directions based on selected line(s)
            // If one or more lines are selected, show directions specific to those lines. Otherwise, show all directions.
            const relevantArrivalsForDirections = stopArrivals.filter(arr => {
              if (!activeLineFilters || activeLineFilters.size === 0) return true;
              return activeLineFilters.has(arr.line);
            });

            const availableDirections = Array.from(new Set(relevantArrivalsForDirections.map(a => a.direction))).filter(Boolean).sort();
            const activeDirectionFilters = selectedDirections[stop.id];

            // Final filtered arrivals based on both line and direction filters
            const filteredArrivals = stopArrivals.filter(arr => {
              const matchesLine = (!activeLineFilters || activeLineFilters.size === 0 || activeLineFilters.has(arr.line));
              const matchesDir = (!activeDirectionFilters || activeDirectionFilters.size === 0 || activeDirectionFilters.has(arr.direction));
              return matchesLine && matchesDir;
            });

            return (
              <li key={stop.id} style={{ border: "1px solid #ddd", padding: "1rem", marginBottom: "1rem", borderRadius: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0 }}>{stop.name}</h3>
                  <button onClick={() => removeStop(stop.id)} style={{ padding: "0.25rem 0.5rem", cursor: "pointer" }}>
                    Remove
                  </button>
                </div>

                {/* Line Filter Buttons */}
                {availableLines.length > 0 && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <div style={{ fontSize: "0.8rem", color: "#666", marginBottom: "0.2rem" }}>Filter by Line:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {availableLines.map(line => {
                        const isSelected = activeLineFilters ? activeLineFilters.has(line) : false;
                        return (
                          <button
                            key={line}
                            onClick={() => toggleLineFilter(stop.id, line, availableLines)}
                            style={{
                              padding: "0.2rem 0.5rem",
                              fontSize: "0.85rem",
                              cursor: "pointer",
                              background: isSelected ? "#0070f3" : "#eee",
                              color: isSelected ? "#fff" : "#333",
                              border: "1px solid #ccc",
                              borderRadius: "4px"
                            }}
                          >
                            Line {line}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Direction Filter Buttons (Enabled when lines are filtered or multiple directions exist) */}
                {availableDirections.length > 0 && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <div style={{ fontSize: "0.8rem", color: "#666", marginBottom: "0.2rem" }}>Filter by Direction:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {availableDirections.map(dir => {
                        const isSelected = activeDirectionFilters ? activeDirectionFilters.has(dir) : false;
                        return (
                          <button
                            key={dir}
                            onClick={() => toggleDirectionFilter(stop.id, dir, availableDirections)}
                            style={{
                              padding: "0.2rem 0.5rem",
                              fontSize: "0.85rem",
                              cursor: "pointer",
                              background: isSelected ? "#10b981" : "#f3f4f6",
                              color: isSelected ? "#fff" : "#333",
                              border: "1px solid #ccc",
                              borderRadius: "4px"
                            }}
                          >
                            Direction {dir}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: "0.75rem" }}>
                  <h4>Upcoming Departures:</h4>
                  {!arrivals[stop.id] ? (
                    <p style={{ fontSize: "0.9rem", color: "#666" }}>Loading arrivals...</p>
                  ) : filteredArrivals.length === 0 ? (
                    <p style={{ fontSize: "0.9rem", color: "#666" }}>No upcoming arrivals found for selected filter.</p>
                  ) : (
                    <ul style={{ paddingLeft: "1rem", margin: 0 }}>
                      {filteredArrivals.map((arr, idx) => {
                        const timeString = new Date(arr.expectedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        let statusBadge = null;
                        if (arr.arrivalStatus === "early") {
                          statusBadge = <span style={{ color: "green", fontSize: "0.8rem", marginLeft: "0.5rem" }}>(Early)</span>;
                        } else if (arr.arrivalStatus === "delayed" || arr.arrivalStatus === "late") {
                          statusBadge = <span style={{ color: "red", fontSize: "0.8rem", marginLeft: "0.5rem" }}>(Late)</span>;
                        }

                        return (
                          <li key={idx} style={{ fontSize: "0.95rem", marginBottom: "0.35rem" }}>
                            <strong>Line {arr.line}</strong> {arr.direction && `(Dir ${arr.direction})`} → {arr.destination} at <em>{timeString}</em>
                            {statusBadge}
                            <small style={{ display: "inline-block", background: "#f0f0f0", padding: "0.1rem 0.4rem", borderRadius: "4px", marginLeft: "0.5rem", fontSize: "0.75rem" }}>
                              Quay {arr.quayNumber}
                            </small>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}