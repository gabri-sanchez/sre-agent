import { NextRequest, NextResponse } from "next/server";
import {
  getAllServiceHealth,
  setServiceHealth,
  resetAllServiceHealth,
} from "../state";

const VALID_SERVICES = ["payments", "auth", "api", "ui"];

export async function GET() {
  const health = getAllServiceHealth();

  return NextResponse.json({
    services: health,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Handle reset all
  if (body.reset === true) {
    resetAllServiceHealth();
    return NextResponse.json({
      message: "All services reset to healthy",
      services: getAllServiceHealth(),
    });
  }

  // Handle individual service toggle
  const { service, healthy } = body;

  if (!service || typeof healthy !== "boolean") {
    return NextResponse.json(
      { error: "Missing required fields: service (string) and healthy (boolean)" },
      { status: 400 }
    );
  }

  if (!VALID_SERVICES.includes(service)) {
    return NextResponse.json(
      { error: "Unknown service", service, validServices: VALID_SERVICES },
      { status: 400 }
    );
  }

  setServiceHealth(service, healthy);

  return NextResponse.json({
    service,
    healthy,
    message: `${service} service set to ${healthy ? "UP" : "DOWN"}`,
    allServices: getAllServiceHealth(),
  });
}
