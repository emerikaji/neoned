import { NextResponse } from "next/server"
import { Naolib } from "@/types/naolib"
import GtfsRealtimeBindings from "gtfs-realtime-bindings";

const baseURL = process.env.PRODUCTION === 'true' ? "api.okina.fr" : "api.staging.okina.fr"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const api = searchParams.get("api")
  searchParams.delete("api")
  const endpoint = searchParams.get("endpoint")
  searchParams.delete("endpoint")

  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint cannot be empty" }, { status: 400 })
  }

  let req: Promise<NextResponse>
  switch (api) {
    case "siri":
      req = SIRI(endpoint, searchParams.toString())
      break
    case "gtfs-rt":
      req = GTFSRT(endpoint)
      break
    default:
      return NextResponse.json({ error: "Unknown API endpoint" }, { status: 400 })
  }

  try {
    return await req
  } catch {
    return NextResponse.json({ error: "Failed to fetch from Naolib API" }, { status: 500 })
  }
}

function SIRI(endpoint: string, params: string) {
  const apiKey = process.env.SIRI_API_KEY
  const targetUrl = `https://${baseURL}/gateway/sem/realtime/siri/2.0/${endpoint}.json?api-key=${apiKey}&${params}`

  return fetch(targetUrl, {
    headers: { Accept: "application/json" },
    next: { revalidate: 30 }, // Cache for 30 seconds
  }).then(
    async (response) => {
      const data: Naolib = await response.json()
      return NextResponse.json(data)
    }
  )
}

function GTFSRT(endpoint: string) {
  const apiKey = process.env.GTFSRT_API_KEY
  const targetUrl = `https://${baseURL}/gateway/semgtfsrt/realtime/${endpoint}/NAOLIBORG`

  return fetch(targetUrl, {
    headers: {
      "Accept": "application/x-protobuf",
      "X-Gravitee-Api-Key": apiKey as string,
    },
    next: { revalidate: 120 }, // Cache for 2 minutes
  }).then(
    async (response) => {
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Naolib GTFS-RT API error (${response.status}): ${errorText}`)
      }

      const buffer = await response.arrayBuffer()
      const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer))
      return NextResponse.json(feed.toJSON())
    }
  )
}