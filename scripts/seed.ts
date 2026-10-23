import { promises as fs } from "fs"
import { parse } from "csv-parse/sync"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

interface GTFSStopsRow {
  stop_id: string
  stop_name: string
  stop_lat: number
  stop_lon: number
  location_type: number
  parent_station: string
  wheelchair_boarding: number
}

async function main() {
  const adapter = new PrismaBetterSqlite3({
    url: "file:./dev.db"
  })

  const prisma = new PrismaClient({
    adapter,
  })

  const stopsTxt = await fs.readFile("datasets/gtfs_lumidata_id/stops.txt", "utf8")

  const stops: GTFSStopsRow[] = parse(stopsTxt, {columns: true, cast: true, skip_empty_lines: true})

  const total = stops.length

  const stopPlaces = stops.filter(r => r.location_type === 1 && r.stop_id.includes("StopPlace"));
  const quays = stops.filter(r => r.location_type === 0 && r.stop_id.includes("Quay"));

  if (stopPlaces.length + quays.length < total) {
    console.error("Mismatching records detected")
    return
  }
  await prisma.$transaction(async (tx) => {
    for (const stopPlace of stopPlaces) {
      await tx.stop.upsert({
        where: { id: stopPlace.stop_id },
        update: {
          name: stopPlace.stop_name,
          lat: stopPlace.stop_lat,
          lng: stopPlace.stop_lon,
          wheelchairAccessible: stopPlace.wheelchair_boarding
        },
        create: {
          id: stopPlace.stop_id,
          name: stopPlace.stop_name,
          lat: stopPlace.stop_lat,
          lng: stopPlace.stop_lon,
          wheelchairAccessible: stopPlace.wheelchair_boarding
        }
      })
    }

    for (const quay of quays) {
      if (quay.parent_station === "") {
        console.log("Skipped a quay")
        continue
      }

      await tx.quay.upsert({
        where: { id: quay.stop_id },
        update: {
          stopId: quay.parent_station,
          name: quay.stop_name,
          lat: quay.stop_lat,
          lng: quay.stop_lon,
          wheelchairAccessible: quay.wheelchair_boarding
        },
        create: {
          id: quay.stop_id,
          stopId: quay.parent_station,
          name: quay.stop_name,
          lat: quay.stop_lat,
          lng: quay.stop_lon,
          wheelchairAccessible: quay.wheelchair_boarding
        }
      })
    }
  })
}

main().catch(console.error);