import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { isAuthorized } from "@/lib/auth";
import { getPlanningData, savePlanningData } from "@/lib/blobStore";
import {
  MARKER_COLORS,
  MARKER_TYPES,
  QUARTERS_PER_DAY,
  type CreateMarkerInput,
  type DateMarker,
} from "@/types/planning";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidOffset(offset: unknown): offset is number {
  return typeof offset === "number" && Number.isInteger(offset) && offset >= 0 && offset < QUARTERS_PER_DAY;
}

export async function GET() {
  const data = await getPlanningData();
  return NextResponse.json({ markers: data.markers ?? [] });
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Partial<CreateMarkerInput> | null;
  const { date, offset, type, title, color } = body ?? {};

  if (
    typeof date !== "string" ||
    !ISO_DATE_RE.test(date) ||
    !isValidOffset(offset) ||
    typeof type !== "string" ||
    !(MARKER_TYPES as readonly string[]).includes(type) ||
    typeof title !== "string" ||
    typeof color !== "string" ||
    !(MARKER_COLORS as readonly string[]).includes(color)
  ) {
    return NextResponse.json({ error: "Invalid marker" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const marker: DateMarker = {
    id: nanoid(),
    date,
    offset,
    type: type as DateMarker["type"],
    title: title.slice(0, 80),
    color: color as DateMarker["color"],
    createdAt: now,
    updatedAt: now,
  };

  const data = await getPlanningData();
  if (!data.markers) data.markers = [];
  data.markers.push(marker);
  await savePlanningData(data);

  return NextResponse.json(marker, { status: 201 });
}
