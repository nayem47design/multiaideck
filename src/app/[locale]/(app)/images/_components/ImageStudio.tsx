"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/atoms/Button";
import { Skeleton } from "@/components/atoms/Skeleton";
import { cx, focusRing } from "@/components/atoms/states";
import { EmptyState } from "@/components/molecules/EmptyState";
import { PicturePlaceholder } from "@/components/molecules/PicturePlaceholder";
import { MobileTopBar } from "@/components/organisms/MobileTopBar";
import { PicturePromptBox } from "@/components/organisms/PicturePromptBox";
import { PictureResult } from "@/components/organisms/PictureResult";
import {
  BrowseColumn,
  useBrowseToast,
} from "@/components/templates/BrowseColumn";
import { api, ApiClientError } from "@/lib/api-client";
import { IMAGE_MCR } from "@/lib/billing/pricing";
import { credits as toCredits } from "@/lib/billing/units";
import { invalidateChats } from "@/lib/chats";
import { ImageSchema, type Image } from "@/lib/contracts/account";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { me } from "@/lib/me";
import {
  captionFrom,
  DEFAULT_PROMPT,
  PICTURE_STYLES,
  type PictureStyle,
  type PictureTone,
} from "@/lib/mock/images";

import { downloadPicture } from "./download";

// Figma: Prototype › Image studio and Image studio · Picture ready (desktop); M21 · Make a picture
// and M22 · Picture ready (mobile). /images is the prompt form; /images?picture=<id> the picture.
// "Create picture" is POST /api/images (about 40 credits, held first); the picture shimmers until
// it's ready (polling GET /api/images/:id). Without an image provider the server makes a stand-in
// and the screen draws it as Figma does (a gradient with the prompt's quoted text).
// Prototype: Create picture / Picture 1 → Picture ready; back and Make another version → Image
// studio; Use in a chat → Home; M22 back → Home.

const POLL_MS = 1200;
const TONE_FOR_STYLE: Record<PictureStyle, PictureTone> = {
  drawing: "warm",
  photo: "blue",
  poster: "green",
  logo: "pink",
};
const ImagesResponse = z.object({ images: z.array(ImageSchema) });

/** Reads ?picture= (wrap in <Suspense>; the fallback renders the form). */
export function ImageStudioFromParams() {
  return <ImageStudio pictureId={useSearchParams().get("picture")} />;
}

function usePictures() {
  const [pictures, setPictures] = useState<Image[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const reload = useCallback(async () => {
    try {
      const { images } = await api("/api/images", { schema: ImagesResponse });
      setPictures(images);
      setStatus("ready");
      return images;
    } catch {
      setStatus((s) => (s === "ready" ? s : "error"));
      return null;
    }
  }, []);
  useEffect(() => {
    let live = true;
    api("/api/images", { schema: ImagesResponse })
      .then(({ images }) => {
        if (!live) return;
        setPictures(images);
        setStatus("ready");
      })
      .catch(() => live && setStatus("error"));
    return () => {
      live = false;
    };
  }, []);
  const retry = useCallback(() => {
    setStatus("loading");
    void reload();
  }, [reload]);
  return { pictures, setPictures, reload, status, retry };
}

export function ImageStudio({ pictureId }: { pictureId: string | null }) {
  const t = useTranslations("images");
  const tc = useTranslations("common");
  const format = useFormatter();
  const router = useRouter();
  const { toast, show } = useBrowseToast();
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [style, setStyle] = useState<PictureStyle>("drawing");
  const [creating, setCreating] = useState(false);
  const { pictures, setPictures, status, retry } = usePictures();
  const pictureRef = useRef<HTMLDivElement>(null);

  const priceCredits = toCredits(IMAGE_MCR);
  const money = tc("taka", {
    amount: format.number(priceCredits / 100, { minimumFractionDigits: 2 }),
  });
  const credits = format.number(priceCredits);
  const picture = pictures.find((p) => p.id === pictureId);

  // Poll a picture that's still being made.
  const generating = picture?.status === "generating";
  useEffect(() => {
    if (!generating || !pictureId) return;
    const timer = setInterval(async () => {
      try {
        const next = await api(`/api/images/${pictureId}`, {
          schema: ImageSchema,
        });
        if (next.status !== "generating") {
          setPictures((list) => list.map((p) => (p.id === next.id ? next : p)));
          void me.refresh();
          invalidateChats();
        }
      } catch {
        // try again on the next tick
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [generating, pictureId, setPictures]);

  const create = async () => {
    const clean = prompt.trim();
    if (!clean || creating) return;
    setCreating(true);
    try {
      const image = await api("/api/images", {
        method: "POST",
        body: { prompt: clean, style },
        schema: ImageSchema,
      });
      setPictures((list) => [image, ...list]);
      void me.refresh();
      invalidateChats();
      router.push(`/images?picture=${image.id}`);
    } catch (e) {
      if (e instanceof ApiClientError && e.code === "insufficient_credits")
        router.push("/wallet/top-up");
    } finally {
      setCreating(false);
    }
  };

  const share = async (p: Image) => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: p.title, url });
      else {
        await navigator.clipboard.writeText(url);
        show(t("linkCopied"));
      }
    } catch {
      // The user closed the share sheet.
    }
  };

  const download = async (p: Image) => {
    if (p.placeholder || !p.fileUrl) {
      const el = pictureRef.current?.querySelector<HTMLElement>("[data-tone]");
      if (el && downloadPicture(el, p.title)) show(t("saved"));
      return;
    }
    const link = document.createElement("a");
    link.href = p.fileUrl;
    link.download = `${
      p.title
        .trim()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .toLowerCase() || "picture"
    }.png`;
    link.click();
    show(t("saved"));
  };

  if (picture) {
    const pending = picture.status === "generating";
    const tone = TONE_FOR_STYLE[picture.style];
    return (
      <BrowseColumn
        toast={toast}
        mobileTopBar={
          <MobileTopBar
            title={picture.title}
            back={{ label: t("back"), link: <Link href="/" /> }}
            actions={[
              {
                icon: "share-01",
                label: t("share"),
                onClick: () => share(picture),
              },
            ]}
          />
        }
      >
        <div ref={pictureRef}>
          <PictureResult
            title={picture.title}
            back={{ label: t("back"), link: <Link href="/images" /> }}
            tone={tone}
            caption={
              picture.placeholder ? captionFrom(picture.prompt) : undefined
            }
            src={
              !picture.placeholder && picture.fileUrl
                ? picture.fileUrl
                : undefined
            }
            pending={pending}
            labels={{
              status: pending ? t("making") : t("ready"),
              prompt: t("promptLine", {
                prompt: picture.prompt.replace(/[“”"]/g, ""),
                style: t(`styles.${picture.style}`),
              }),
              cost: t("credits", { credits, money }),
              mobileCost: t("mobileCredits", { credits, money }),
            }}
            download={{
              label: t("download"),
              mobileLabel: t("saveToPhone"),
              onClick: () => void download(picture),
            }}
            share={{ label: t("share"), onClick: () => share(picture) }}
            another={{
              label: t("another"),
              onClick: () => {
                setPrompt(picture.prompt);
                setStyle(picture.style);
                router.push("/images");
              },
            }}
            useInChat={{
              label: t("useInChat"),
              onClick: () => router.push("/"),
            }}
          />
        </div>
      </BrowseColumn>
    );
  }

  return (
    <BrowseColumn
      toast={toast}
      mobileTopBar={
        <MobileTopBar
          title={t("mobileTitle")}
          back={{ label: t("back"), link: <Link href="/" /> }}
        />
      }
    >
      <div className="flex flex-col gap-browse-gap">
        <div className="flex flex-col gap-browse-gap max-md:hidden">
          <h1 className="type-title text-ink">{t("title")}</h1>
          <p className="type-body text-ink-2">
            {t("intro", { credits, money })}
          </p>
        </div>
        <PicturePromptBox
          prompt={prompt}
          onPromptChange={setPrompt}
          styles={PICTURE_STYLES.map((s) => ({
            value: s,
            label: t(`styles.${s}`),
          }))}
          style={style}
          onStyleChange={(s) => setStyle(s as PictureStyle)}
          onCreate={() => void create()}
          labels={{
            prompt: t("prompt"),
            placeholder: t("placeholder"),
            style: t("style"),
            cost: t("cost", { credits }),
            costLong: t("costLong", { credits, money }),
            create: t("create"),
          }}
        />
        <section
          aria-labelledby="recent-pictures"
          className="flex flex-col gap-browse-gap max-md:mt-4"
        >
          <h2 id="recent-pictures" className="type-ui-strong text-ink-2">
            {t("recent")}
          </h2>
          {status === "loading" && !pictures.length ? (
            <div
              role="status"
              aria-label={tc("loading")}
              className="grid grid-cols-2 gap-3 md:grid-cols-4"
            >
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} variant="tile" />
              ))}
            </div>
          ) : status === "error" && !pictures.length ? (
            <EmptyState
              tone="error"
              title={t("loadError")}
              body={tc("loadErrorBody")}
              action={
                <Button variant="secondary" size="sm" onClick={retry}>
                  {tc("tryAgain")}
                </Button>
              }
            />
          ) : !pictures.length ? (
            <EmptyState
              icon="image-01"
              title={t("empty.title")}
              body={t("empty.body")}
            />
          ) : (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {pictures.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/images?picture=${p.id}`}
                    aria-label={t("open", { title: p.title })}
                    className={cx(
                      "block rounded-images-tile transition-transform duration-fast ease-out hover:-translate-y-0-5",
                      focusRing,
                    )}
                  >
                    <PicturePlaceholder
                      tone={TONE_FOR_STYLE[p.style]}
                      size="sm"
                      pending={p.status === "generating"}
                      src={!p.placeholder && p.fileUrl ? p.fileUrl : undefined}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </BrowseColumn>
  );
}
