import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getPlanningData, savePlanningData } from "@/lib/blobStore";
import { MARKER_COLORS, MARKER_TYPES, QUARTERS_PER_DAY, type UpdateMarkerInput } from "@/types/planning";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function isValidOffset(offset: unknown): offset is number {
  return typeof offset === "number" && Number.isInteger(offset) && offset >= 0 && offset < QUARTERS_PER_DAY;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Partial<UpdateMarkerInput> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const data = await getPlanningData();
  const marker = data.markers?.find((m) => m.id === id);
  if (!marker) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.offset !== undefined) {
    if (!isValidOffset(body.offset)) {
      return NextResponse.json({ error: "Invalid offset" }, { status: 400 });
    }
    marker.offset = body.offset;
  }
  if (typeof body.type === "string") {
    if (!(MARKER_TYPES as readonly string[]).includes(body.type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    marker.type = body.type as typeof marker.type;
  }
  if (typeof body.title === "string") {
    marker.title = body.title.slice(0, 80);
  }
  if (typeof body.color === "string") {
    if (!(MARKER_COLORS as readonly string[]).includes(body.color)) {
      return NextResponse.json({ error: "Invalid color" }, { status: 400 });
    }
    marker.color = body.color as typeof marker.color;
  }
  marker.updatedAt = new Date().toISOString();

  await savePlanningData(data);
  return NextResponse.json(marker);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await getPlanningData();
  const index = data.markers?.findIndex((m) => m.id === id) ?? -1;
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  data.markers!.splice(index, 1);
  await savePlanningData(data);
  return NextResponse.json({ ok: true });
}
