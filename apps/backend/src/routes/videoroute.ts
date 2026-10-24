import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { zValidator } from "@hono/zod-validator";
import { requireauth } from "../middleware/requireauth";
import type { Appvariables } from "../env";
import {
  createVideoBody,
  feedbackBody,
  myVideosQuery,
  retryVideoBody,
  updateVideoBody,
  videoIdParam,
} from "../lib/video-schema";
import {
  deletevideo,
  generatevideo,
  getmyvideos,
  getpublicvideos,
  getUserFeedback,
  getvideo,
  getvideostatus,
  retryVideo,
  submitFeedback,
  updatevideo,
} from "../controllers/videocontroller";
import { seedConvexVideos } from "../db/seed-convex";

const factory = createFactory<{ Variables: Appvariables }>();

const videoRouter = new Hono<{ Variables: Appvariables }>()
  .get("/", (c) => getpublicvideos(c))
  .all("/seed-convex", async (c) => {
    const secret = c.req.query("secret");
    if (secret !== process.env.BETTER_AUTH_SECRET && secret !== "foldex-seed") {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const result = await seedConvexVideos();
      return c.json({ success: true, ...result });
    } catch (err: any) {
      console.error("[seed-convex] failed:", err);
      return c.json({ error: err.message }, 500);
    }
  })
  .get(
    "/my",
    ...factory.createHandlers(requireauth, zValidator("query", myVideosQuery), (c) =>
      getmyvideos(c),
    ),
  )
  .post(
    "/generate",
    ...factory.createHandlers(requireauth, zValidator("json", createVideoBody), (c) =>
      generatevideo(c),
    ),
  )
  .post(
    "/:id/retry",
    ...factory.createHandlers(
      requireauth,
      zValidator("param", videoIdParam),
      zValidator("json", retryVideoBody),
      (c) => retryVideo(c),
    ),
  )
  .put(
    "/:id",
    ...factory.createHandlers(
      requireauth,
      zValidator("param", videoIdParam),
      zValidator("json", updateVideoBody),
      (c) => updatevideo(c),
    ),
  )
  .delete(
    "/:id",
    ...factory.createHandlers(requireauth, zValidator("param", videoIdParam), (c) =>
      deletevideo(c),
    ),
  )
  .post(
    "/:id/feedback",
    ...factory.createHandlers(
      requireauth,
      zValidator("param", videoIdParam),
      zValidator("json", feedbackBody),
      (c) => submitFeedback(c),
    ),
  )
  .get(
    "/:id/feedback",
    ...factory.createHandlers(requireauth, zValidator("param", videoIdParam), (c) =>
      getUserFeedback(c),
    ),
  )
  .get(
    "/:id/getstatus",
    ...factory.createHandlers(zValidator("param", videoIdParam), (c) => getvideostatus(c)),
  )
  .get(
    "/:id",
    ...factory.createHandlers(zValidator("param", videoIdParam), (c) => getvideo(c)),
  );

export default videoRouter;
