import { NextResponse } from "next/server"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

// Initialize Prisma with the SQLite adapter
const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db",
})

const prisma = new PrismaClient({
  adapter,
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")

  if (!query || query.trim().length === 0) {
    return NextResponse.json([])
  }

  try {
    // Search parent stops matching the query and include their associated quays
    const stops = await prisma.stop.findMany({
      where: {
        name: {
          contains: query.trim(),
        },
      },
      include: {
        quays: true,
      },
      take: 10, // Limit to top 10 matches for responsive UI performance
    })

    return NextResponse.json(stops)
  } catch (error) {
    console.error("Database search error:", error)
    return NextResponse.json({ error: "Failed to search stops in database" }, { status: 500 })
  }
}