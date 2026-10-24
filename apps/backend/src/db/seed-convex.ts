import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { videos } from "./schema";
import rawVideos from "./convex-videos.json";

export async function seedConvexVideos() {
  console.log(`[seeder] Starting Convex migration of ${rawVideos.length} videos...`);

  // Fetch already existing URLs to avoid duplicate inserts
  const existing = await db.select({ url: videos.url }).from(videos);
  const existingUrls = new Set(existing.map((v) => v.url).filter(Boolean));

  // Sort by original creation time
  const items = [...rawVideos].sort(
    (a, b) => ((a as any)._creationTime ?? 0) - ((b as any)._creationTime ?? 0)
  );

  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const TOTAL_SPREAD_DAYS = 7; // Stagger across the past week

  let insertedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as any;
    const videoUrl = item.url ?? item.videoUrl;

    if (!videoUrl) {
      skippedCount++;
      continue;
    }

    if (existingUrls.has(videoUrl)) {
      skippedCount++;
      continue;
    }

    // Modernize timestamp: oldest ~7 days ago, newest today
    const offsetMs =
      ((items.length - 1 - i) / Math.max(items.length - 1, 1)) *
      (TOTAL_SPREAD_DAYS * ONE_DAY_MS);
    const randomizedJitter = Math.floor((Math.random() - 0.5) * (2 * 60 * 60 * 1000));
    const modernizedDate = new Date(Math.min(now - offsetMs + randomizedJitter, now));

    const title = item.title || "Foldex Animation";
    const description = item.description || "";
    const creatorname = item.creatorname || "Pato Mb";
    const creatorprofile = item.creatorprofile || null;
    const thumbnail = item.thumbnail ?? item.thumbnailUrl ?? null;
    const code = item.code || null;
    const model = item.model || "gpt-4o";

    await db.insert(videos).values({
      title,
      description,
      transcript: item.transcript ?? "",
      url: videoUrl,
      filesize: item.filesize ? Number(item.filesize) : null,
      thumbnail,
      prompt: item.prompt ?? null,
      code,
      model,
      creatorname,
      creatorprofile,
      tags: Array.isArray(item.tags) ? item.tags : [],
      sources: item.sources ? item.sources : null,
      status: "ready",
      isPublic: true,
      likes: item.likes ?? Math.floor(Math.random() * 20) + 5,
      dislikes: item.dislikes ?? 0,
      createdAt: modernizedDate,
      updatedAt: modernizedDate,
    });

    insertedCount++;
  }

  console.log(
    `[seeder] Migration complete: ${insertedCount} inserted, ${skippedCount} skipped (duplicates or invalid).`
  );

  return {
    inserted: insertedCount,
    skipped: skippedCount,
    total: items.length,
  };
}
