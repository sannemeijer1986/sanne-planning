import { get, put } from "@vercel/blob";
import type { PlanningData } from "@/types/planning";

const PATHNAME = "planning/data.json";

async function streamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result;
}

export async function getPlanningData(): Promise<PlanningData> {
  const result = await get(PATHNAME, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) {
    return { items: [] };
  }
  const text = await streamToString(result.stream);
  return JSON.parse(text) as PlanningData;
}

export async function savePlanningData(data: PlanningData): Promise<void> {
  await put(PATHNAME, JSON.stringify(data), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}
