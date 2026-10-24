import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { db } from "../lib/db";
import { videos } from "../db/schema";

interface ConvexVideoRecord {
  _id?: string;
  _creationTime?: number;
  title?: string;
  description?: string;
  transcript?: string;
  url?: string;
  videoUrl?: string;
  storageId?: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  prompt?: string;
  code?: string;
  model?: string;
  creatorname?: string;
  creatorprofile?: string;
  likes?: number;
  dislikes?: number;
  tags?: string[] | unknown;
  sources?: unknown;
  [key: string]: unknown;
}

async function migrateConvexVideos(filePath: string, targetUserId?: string) {
  const fullPath = resolve(filePath);
  console.log(`[migration] Reading Convex export from: ${fullPath}`);

  const raw = readFileSync(fullPath, "utf-8");

  // Support either JSON Lines (.jsonl) or standard JSON Array (.json)
  let records: ConvexVideoRecord[] = [];
  if (fullPath.endsWith(".jsonl")) {
    records = raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line));
  } else {
    records = JSON.parse(raw);
  }

  console.log(`[migration] Found ${records.length} videos to process.`);

  // Sort by original creation time
  records.sort((a, b) => (a._creationTime ?? 0) - (b._creationTime ?? 0));

  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const TOTAL_SPREAD_DAYS = Math.min(records.length, 7); // Stagger over recent 7 days

  let count = 0;

  for (let i = 0; i < records.length; i++) {
    const item = records[i];

    // Modernize the date: oldest will be ~7 days ago, newest will be today
    const offsetMs =
      ((records.length - 1 - i) / Math.max(records.length - 1, 1)) *
      (TOTAL_SPREAD_DAYS * ONE_DAY_MS);
    const randomizedJitter = Math.floor((Math.random() - 0.5) * (2 * 60 * 60 * 1000));
    const modernizedDate = new Date(Math.min(now - offsetMs + randomizedJitter, now));

    const videoUrl = item.url ?? item.videoUrl;
    if (!videoUrl) {
      console.warn(`[migration] Warning: item ${item._id ?? i} has no url, skipping.`);
      continue;
    }

    const title = item.title || "Foldex Animation";
    const description = item.description || "";
    const creatorname = item.creatorname || "Pato Mb";
    const creatorprofile = item.creatorprofile || null;
    const thumbnail = item.thumbnail ?? item.thumbnailUrl ?? null;
    const code = item.code || null;
    const model = item.model || "gpt-4o";

    await db.insert(videos).values({
      userId: targetUserId ?? null,
      title,
      description,
      transcript: item.transcript ?? "",
      url: videoUrl,
      thumbnail,
      prompt: item.prompt ?? null,
      code,
      model,
      creatorname,
      creatorprofile,
      tags: Array.isArray(item.tags) ? item.tags : [],
      sources: item.sources ? item.sources : null,
      status: "ready", // ready so they are playable immediately
      isPublic: true,
      likes: item.likes ?? Math.floor(Math.random() * 20) + 5,
      dislikes: item.dislikes ?? 0,
      createdAt: modernizedDate,
      updatedAt: modernizedDate,
    });

    count++;
    console.log(
      `[migration] (${count}/${records.length}) Inserted: "${title}" -> ${modernizedDate.toISOString()}`
    );
  }

  console.log(`\n🎉 Successfully migrated ${count} videos into PostgreSQL!`);
}

const fileArg = process.argv[2] ?? "./documents.jsonl";
const userArg = process.argv[3];

migrateConvexVideos(fileArg, userArg)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[migration] Failed:", err);
    process.exit(1);
  });
