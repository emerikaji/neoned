import { NextResponse } from "next/server"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db",
})

const prisma = new PrismaClient({
  adapter,
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const latParam = searchParams.get("lat")
  const lngParam = searchParams.get("lng")

  if (!latParam || !lngParam) {
    return NextResponse.json({ error: "Missing latitude or longitude" }, { status: 400 })
  }

  const userLat = parseFloat(latParam)
  const userLng = parseFloat(lngParam)

  try {
    // Fetch all stops with their quays
    const stops = await prisma.stop.findMany({
      include: {
        quays: true,
      },
    })

    // Calculate Haversine distance for each stop in memory
    const stopsWithDistance = stops.map(stop => {
      // Simple Haversine distance formula (in kilometers)
      const R = 6371; // Radius of the earth in km
      const dLat = (stop.lat - userLat) * (Math.PI / 180);
      const dLon = (stop.lng - userLng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(userLat * (Math.PI / 180)) * Math.cos(stop.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distance in km

      return {
        ...stop,
        distance,
      };
    });

    // Sort by closest distance and take top 5
    stopsWithDistance.sort((a, b) => a.distance - b.distance);
    const closestStops = stopsWithDistance.slice(0, 5);

    return NextResponse.json(closestStops);
  } catch (error) {
    console.error("Failed to fetch nearest stops:", error);
    return NextResponse.json({ error: "Failed to fetch nearest stops" }, { status: 500 });
  }
}