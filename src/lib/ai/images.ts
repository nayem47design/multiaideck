import "server-only";

import { generateImage } from "ai";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { crc32, deflateSync } from "node:zlib";

import { InsufficientCreditsError } from "@/lib/billing/ledger";
import { IMAGE_MCR } from "@/lib/billing/pricing";
import { credits } from "@/lib/billing/units";
import type { Image } from "@/lib/contracts/account";
import type { Db } from "@/lib/db";
import { chats, images } from "@/lib/db/schema";
import { ApiError } from "@/lib/server/api";

import { appendHold, checkBalance, lockUser, settleHold } from "./holds";
import { resolveImageModel } from "./providers";

// Image studio. With OPENAI_API_KEY the picture comes from OpenAI's image model (generateImage);
// without it, a generated placeholder PNG (a gradient per style) stands in, and the screens draw
// it as Figma does. Each picture holds ~40 credits first and is charged only when it's ready.
// A picture is also a chat (kind "image", same id) so it shows in the chats list and search.

export type ImageStyle = "photo" | "drawing" | "logo" | "poster";

/** Media type marking the stand-in PNG (served as image/png). */
export const PLACEHOLDER_MEDIA = "image/png;placeholder=1";
/** How long the stand-in "takes", so the making-it state shows (Figma: shimmer). */
const PLACEHOLDER_DELAY_MS = 2400;

type Row = typeof images.$inferSelect;

export function toImage(row: Row, title = ""): Image {
  return {
    id: row.id,
    prompt: row.prompt,
    style: row.style,
    status: row.status,
    credits: credits(row.costMcr || (row.status === "failed" ? 0 : IMAGE_MCR)),
    fileUrl: row.status === "ready" ? `/api/images/${row.id}/file` : null,
    createdAt: row.createdAt.toISOString(),
    title,
    placeholder: row.mediaType === PLACEHOLDER_MEDIA,
  };
}

/** Text in quotes becomes the title ("Golpo Coffee"), else the first few words. */
export function imageTitle(prompt: string) {
  const quoted = /[“"]([^”"]+)[”"]/.exec(prompt)?.[1];
  if (quoted) return quoted;
  const words = prompt.trim().split(/\s+/).slice(0, 4).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export async function listImages(db: Db, userId: string): Promise<Image[]> {
  const rows = await db
    .select({ image: images, title: chats.title })
    .from(images)
    .leftJoin(chats, eq(chats.id, images.chatId))
    .where(eq(images.userId, userId))
    .orderBy(desc(images.createdAt));
  return rows.map((r) =>
    toImage(r.image, r.title ?? imageTitle(r.image.prompt)),
  );
}

export async function getImage(db: Db, userId: string, id: string) {
  const [r] = await db
    .select({ image: images, title: chats.title })
    .from(images)
    .leftJoin(chats, eq(chats.id, images.chatId))
    .where(and(eq(images.id, id), eq(images.userId, userId)));
  if (!r) throw new ApiError(404, "not_found");
  return {
    row: r.image,
    image: toImage(r.image, r.title ?? imageTitle(r.image.prompt)),
  };
}

export async function createImage(
  db: Db,
  userId: string,
  input: { prompt: string; style: ImageStyle },
): Promise<{ image: Image; job: Promise<void> }> {
  const id = randomUUID();
  const title = imageTitle(input.prompt);
  let row: Row;
  try {
    row = await db.transaction(async (tx) => {
      await lockUser(tx, userId);
      await checkBalance(tx, userId, IMAGE_MCR);
      await tx.insert(chats).values({ id, userId, title, kind: "image" });
      const [r] = await tx
        .insert(images)
        .values({
          id,
          userId,
          chatId: id,
          prompt: input.prompt,
          style: input.style,
        })
        .returning();
      await appendHold(tx, { userId, ref: "image", id, amountMcr: IMAGE_MCR });
      return r;
    });
  } catch (e) {
    if (e instanceof InsufficientCreditsError)
      throw new ApiError(402, "insufficient_credits", "Not enough credits", {
        neededCredits: credits(e.neededMcr),
        availableCredits: credits(e.availableMcr),
      });
    throw e;
  }
  const job = makePicture(db, userId, row).catch((e) =>
    console.error("[images]", id, e),
  );
  return { image: toImage(row, title), job };
}

async function makePicture(db: Db, userId: string, row: Row) {
  let data: string;
  let mediaType: string;
  try {
    const real = resolveImageModel();
    if (real) {
      const { image } = await generateImage({
        model: real.model,
        prompt: `${row.prompt}\nStyle: ${row.style}.`,
        size: "1024x1024",
        abortSignal: AbortSignal.timeout(120_000),
      });
      data = image.base64;
      mediaType = image.mediaType || "image/png";
    } else {
      await new Promise((r) => setTimeout(r, PLACEHOLDER_DELAY_MS));
      data = placeholderPng(row.style).toString("base64");
      mediaType = PLACEHOLDER_MEDIA;
    }
  } catch (e) {
    console.error("[images] generation failed", row.id, e);
    await db
      .update(images)
      .set({ status: "failed" })
      .where(eq(images.id, row.id));
    await settleHold(db, { userId, ref: "image", id: row.id, chargeMcr: 0 });
    return;
  }
  await db
    .update(images)
    .set({ status: "ready", data, mediaType, costMcr: IMAGE_MCR })
    .where(eq(images.id, row.id));
  await settleHold(db, {
    userId,
    ref: "image",
    id: row.id,
    chargeMcr: IMAGE_MCR,
  });
}

export function imageFile(row: Row) {
  if (row.status !== "ready" || !row.data) throw new ApiError(404, "not_found");
  return {
    body: Buffer.from(row.data, "base64"),
    contentType: (row.mediaType ?? "image/png").split(";")[0],
  };
}

// ---- Placeholder PNG: a diagonal gradient per style (the screens' picture tones).

const GRADIENTS: Record<ImageStyle, [number, number, number][]> = {
  drawing: [
    [255, 122, 182],
    [217, 119, 87],
    [120, 96, 220],
  ],
  photo: [
    [64, 200, 240],
    [77, 107, 254],
    [120, 96, 220],
  ],
  poster: [
    [64, 200, 240],
    [16, 163, 127],
    [120, 96, 220],
  ],
  logo: [
    [255, 122, 182],
    [150, 110, 255],
    [120, 96, 220],
  ],
};

export function placeholderPng(style: ImageStyle, size = 512) {
  const stops = GRADIENTS[style];
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * (size - 1));
      const seg = Math.min(
        stops.length - 2,
        Math.floor(t * (stops.length - 1)),
      );
      const local = t * (stops.length - 1) - seg;
      for (let c = 0; c < 3; c++)
        raw[row + 1 + x * 3 + c] = Math.round(
          stops[seg][c] + (stops[seg + 1][c] - stops[seg][c]) * local,
        );
    }
  }
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
