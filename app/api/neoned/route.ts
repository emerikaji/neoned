import { NextResponse } from "next/server";
import { Naolib } from "@/types/naolib"; // Adjust import path to where you save your types

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint");
  searchParams.delete("endpoint");

  const apiKey = process.env.API_KEY;
  const targetUrl = `https://api.staging.okina.fr/gateway/sem/realtime/siri/2.0/${endpoint}.json?api-key=${apiKey}&${searchParams.toString()}`;
  console.log(targetUrl);
  try {
    const response = await fetch(targetUrl, {
      headers: { Accept: "application/json" },
    });
    const data: Naolib = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch from Naolib API" }, { status: 500 });
  }
}