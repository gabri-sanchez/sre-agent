import { NextRequest, NextResponse } from "next/server";
import { getServiceHealth, setServiceHealth } from "../state";

const VALID_SERVICES = ["payments", "auth", "api", "ui"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  const { service } = await params;

  if (!VALID_SERVICES.includes(service)) {
    return NextResponse.json(
      { error: "Unknown service", service },
      { status: 404 }
    );
  }

  const isHealthy = getServiceHealth(service);

  if (isHealthy) {
    return NextResponse.json({
      status: "healthy",
      service,
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json(
    {
      status: "unhealthy",
      service,
      error: `${service} service is experiencing issues`,
      timestamp: new Date().toISOString(),
    },
    { status: 503 }
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  const { service } = await params;

  if (!VALID_SERVICES.includes(service)) {
    return NextResponse.json(
      { error: "Unknown service", service },
      { status: 404 }
    );
  }

  const body = await request.json();
  const fail = body.fail === true;

  setServiceHealth(service, !fail);

  return NextResponse.json({
    service,
    healthy: !fail,
    message: fail
      ? `${service} service marked as DOWN`
      : `${service} service marked as UP`,
  });
}
