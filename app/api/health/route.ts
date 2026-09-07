import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "Frontend App",
      timestamp: new Date().toISOString(),
      uptime_robot: "ready",
    },
    { status: 200 }
  );
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
