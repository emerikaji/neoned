"use client";

import { useState, useEffect } from "react";
import { Stop, Arrival } from "@/types/neoned";
import { GtfsFeedMessage } from "@/types/naolib";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface StopCardProps {
  stop: Stop;
  arrivals?: Arrival[];
  selectedLines?: Set<string>;
  selectedDirection?: string | null;
  onRemove: (stopId: string) => void;
  onToggleLine: (stopId: string, line: string, availableLines: string[]) => void;
  onSelectDirection: (stopId: string, directionCode: string) => void;
}

export interface ProcessedAlert {
  header: string;
  description: string;
  imageUrl?: string | null;
  severity: 'INFO' | 'WARNING' | 'SEVERE';
  routes: string[];
}

function parseAlertDescription(rawHtml: string): { text: string; imageUrl: string | null } {
  if (!rawHtml) return { text: "", imageUrl: null };

  const imgMatch = rawHtml.match(/href="([^"]+\.(?:png|jpg|jpeg|gif))"/i) || rawHtml.match(/src="([^"]+)"/i);
  const imageUrl = imgMatch ? imgMatch[1] : null;

  const text = rawHtml
    .replace(/<a\b[^>]*>(.*?)<\/a>/gi, "$1")
    .replace(/<[^>]*>?/gm, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { text, imageUrl };
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
  const t = useTranslations("HomePage");
  const [alerts, setAlerts] = useState<ProcessedAlert[]>([]);
  const [modalImage, setModalImage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch("/api/naolib?api=gtfs-rt&endpoint=alerts");
        const data: GtfsFeedMessage = await res.json();

        if (data && data.entity) {
          const now = Math.floor(Date.now() / 1000);

          const validAlerts: ProcessedAlert[] = data.entity
            .map((item) => item.alert)
            .filter((alert): alert is NonNullable<typeof alert> => alert !== undefined)
            .filter((alert) => {
              const rawDesc = alert.descriptionText?.translation?.[0]?.text;
              if (!rawDesc) return false;

              const rawHeader = alert.headerText
              const textToCheck = `${rawHeader || ""} ${rawDesc || ""}`.toLowerCase();
              if (textToCheck.includes("test") || textToCheck.includes("diffusion")) return false;

              const activePeriods = alert.activePeriod || [];
              const isActive = activePeriods.some((p) => {
                const start = parseInt(p.start || "0", 10);
                const end = parseInt(p.end || "0", 10);
                return now >= start && now <= end;
              });

              return isActive || activePeriods.length === 0;
            })
            .map((alert) => {
              const rawDesc = alert.descriptionText?.translation?.[0]?.text || "";
              const parsed = parseAlertDescription(rawDesc);

              return {
                header: alert.headerText?.translation?.[0]?.text || "Information Trafic",
                description: parsed.text,
                imageUrl: parsed.imageUrl,
                severity: alert.severityLevel || "INFO",
                routes: alert.informedEntity?.map((e) => e.routeId).filter((r): r is string => Boolean(r)) || [],
              };
            });

          setAlerts(validAlerts);
        }
      } catch (err) {
        console.error("Failed to load alerts", err);
      }
    }

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 120000);
    return () => clearInterval(interval);
  }, []);

  const availableLines = Array.from(new Set(arrivals.map(a => a.line))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  const lineFilteredArrivals = arrivals.filter(arr => {
    if (!selectedLines || selectedLines.size === 0) return true;
    return selectedLines.has(arr.line);
  });

  const isSingleLineSelected = (selectedLines && selectedLines.size === 1) || availableLines.length === 1;
  const singleSelectedLine = isSingleLineSelected
    ? (selectedLines?.size === 1 ? Array.from(selectedLines)[0] : availableLines[0])
    : null;

  const lineHasAlert = (line: string) => {
    return alerts.some(alert =>
      alert.routes.some((r) => r === line || r.endsWith(`:${line}`))
    );
  };

  const activeLineAlerts = singleSelectedLine
    ? alerts.filter(alert => alert.routes.some((r) => r === singleSelectedLine || r.endsWith(`:${singleSelectedLine}`)))
    : [];

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
    <div className="bg-white border border-slate-200 rounded-3xl p-5 mb-4 shadow-xs hover:shadow-md transition-all relative">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight">{stop.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{stop.quays.length} {t('quays')}</p>
        </div>
        <button
          onClick={() => onRemove(stop.id)}
          className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-xl hover:bg-red-50"
          title={t('removeStation')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Passing Lines with Alert Indicator Dot */}
      {availableLines.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('lines')}</div>
          <div className="flex flex-wrap gap-2.5">
            {availableLines.map(line => {
              const isSelected = selectedLines ? selectedLines.has(line) : false;
              const hasAlert = lineHasAlert(line);

              return (
                <button
                  key={line}
                  onClick={() => onToggleLine(stop.id, line, availableLines)}
                  className={`relative px-3.5 py-1.5 rounded-xl text-sm font-bold bg-sky-100 text-slate-900 transition-all ${
                    isSelected
                      ? "ring-2 ring-slate-900 ring-offset-2 shadow-xs"
                      : "hover:bg-sky-200"
                  }`}
                >
                  {line}
                  {hasAlert && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full ring-2 ring-white" title="Active Disruption" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Direction Filters */}
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

      {/* Active Line Alerts Banner with Thumbnail Preview */}
      {isSingleLineSelected && activeLineAlerts.length > 0 && (
        <div className="mb-4 pt-3 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{t('alerts')}</div>
          <div className="space-y-2">
          {activeLineAlerts.map((alert, idx) => (
            <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <div className="font-bold tracking-tight flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {alert.header}
                </div>
                <p className="opacity-90 leading-relaxed">{alert.description}</p>
              </div>

              {/* Thumbnail Preview on the Right using Next/Image with explicit dimensions */}
              {alert.imageUrl && (
                <button
                  onClick={() => setModalImage(alert.imageUrl!)}
                  className="shrink-0 group relative w-16 h-16 border border-amber-300 rounded-xl overflow-hidden bg-white shadow-2xs hover:scale-105 transition-transform block"
                  title="Click to view full image"
                >
                  <Image
                    src={alert.imageUrl}
                    alt="Disruption schema"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    unoptimized // Recommended if loading external cloudfront links directly without pre-configuring next.config.js remotePatterns
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors flex items-center justify-center">
                    <svg className="w-4 h-4 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </button>
              )}
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Fullscreen Image Modal for Mobile & Desktop */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-w-2xl w-full bg-white rounded-3xl p-4 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-sm text-slate-800">Disruption Schema / Map</span>
              <button
                onClick={() => setModalImage(null)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 flex justify-center max-h-[75vh]">
              <Image
                src={modalImage}
                alt="Expanded disruption schema"
                width={800}
                height={600}
                className="w-auto h-auto max-h-[75vh] object-contain rounded-xl"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Departures */}
      <div className="pt-3 border-t border-slate-100">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{t('departures')}</div>
        {!arrivals ? (
          <p className="text-sm text-slate-400 py-2">{t('loadingDepartures')}</p>
        ) : filteredArrivals.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">{t('noDepartures')}</p>
        ) : (
          <div className="space-y-2">
            {filteredArrivals.map((arr, idx) => {
              const timeString = new Date(arr.expectedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              let statusBadge = null;
              if (arr.arrivalStatus === "early") {
                statusBadge = <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">{t('early')}</span>;
              } else if (arr.arrivalStatus === "delayed" || arr.arrivalStatus === "late") {
                statusBadge = <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">{t('late')}</span>;
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