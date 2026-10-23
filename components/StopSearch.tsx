"use client";

import { useState, useEffect } from "react";
import { Stop } from "@/types/neoned";

interface StopSearchProps {
  onSelectStop: (stop: Stop) => void;
}

export default function StopSearch({ onSelectStop }: StopSearchProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Stop[]>([]);
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
        const res = await fetch(`/api/neoned/search?q=${encodeURIComponent(query)}`);
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

  return (
    <div className="relative mb-8">
      <div className="relative">
        <input
          type="text"
          placeholder="Search for a stop (e.g. Commerce)..."
          value={query}
          onChange={handleQueryChange}
          className="w-full px-4 py-3.5 bg-white rounded-2xl shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all text-base placeholder:text-slate-400"
        />
        {loadingSearch && (
          <div className="absolute right-4 top-4 text-xs text-slate-400 animate-pulse">
            Searching...
          </div>
        )}
      </div>

      {searchResults.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-20 divide-y divide-slate-100 max-h-60 overflow-y-auto">
          {searchResults.map((stop) => (
            <li
              key={stop.id}
              onClick={() => {
                onSelectStop(stop);
                setQuery("");
                setSearchResults([]);
              }}
              className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between"
            >
              <span className="font-medium">{stop.name}</span>
              <span className="text-xs text-slate-400">{stop.quays.length} quays</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}