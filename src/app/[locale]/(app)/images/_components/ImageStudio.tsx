"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

import { cx, focusRing } from "@/components/atoms/states";
import { PicturePlaceholder } from "@/components/molecules/PicturePlaceholder";
import { MobileTopBar } from "@/components/organisms/MobileTopBar";
import { PicturePromptBox } from "@/components/organisms/PicturePromptBox";
import { PictureResult } from "@/components/organisms/PictureResult";
import {
  BrowseColumn,
  useBrowseToast,
} from "@/components/templates/BrowseColumn";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { CREDIT_IN_BDT } from "@/lib/mock/demo";
import {
  captionFrom,
  DEFAULT_PROMPT,
  DEMO_PICTURES,
  PICTURE_CREDITS,
  PICTURE_DELAY_MS,
  PICTURE_STYLES,
  titleFrom,
  type DemoPicture,
  type PictureStyle,
  type PictureTone,
} from "@/lib/mock/images";

import { downloadPicture } from "./download";

// Figma: Prototype › Image studio and Image studio · Picture ready (desktop); M21 · Make a picture
// and M22 · Picture ready (mobile). /images is the prompt form; /images?picture=<id> the picture.
// "Create picture" simulates the image AI: the new picture (?picture=new) shimmers, then is ready.
// Prototype: Create picture / Picture 1 → Picture ready; back and Make another version → Image
// studio; Use in a chat → Home; M22 back → Home.

const NEW = "new";
const TONE_FOR_STYLE: Record<PictureStyle, PictureTone> = {
  drawing: "warm",
  photo: "blue",
  poster: "green",
  logo: "pink",
};

/** Reads ?picture= (wrap in <Suspense>; the fallback renders the form). */
export function ImageStudioFromParams() {
  return <ImageStudio pictureId={useSearchParams().get("picture")} />;
}

export function ImageStudio({ pictureId }: { pictureId: string | null }) {
  const t = useTranslations("images");
  const tc = useTranslations("common");
  const format = useFormatter();
  const router = useRouter();
  const { toast, show } = useBrowseToast();
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [style, setStyle] = useState<PictureStyle>("drawing");
  const [created, setCreated] = useState<DemoPicture | null>(null);
  const [creating, setCreating] = useState(false);
  const pictureRef = useRef<HTMLDivElement>(null);

  const money = tc("taka", {
    amount: format.number(PICTURE_CREDITS * CREDIT_IN_BDT, {
      minimumFractionDigits: 2,
    }),
  });
  const credits = format.number(PICTURE_CREDITS);
  const pictures = created ? [created, ...DEMO_PICTURES] : DEMO_PICTURES;
  const picture =
    pictureId === NEW ? created : DEMO_PICTURES.find((p) => p.id === pictureId);

  const create = () => {
    const clean = prompt.trim();
    setCreated({
      id: NEW,
      title: titleFrom(clean),
      prompt: clean,
      style,
      tone: TONE_FOR_STYLE[style],
      caption: captionFrom(clean),
      credits: PICTURE_CREDITS,
    });
    setCreating(true);
    router.push(`/images?picture=${NEW}`);
    setTimeout(() => setCreating(false), PICTURE_DELAY_MS);
  };

  const share = async (p: DemoPicture) => {
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

  if (picture) {
    const pending = picture.id === NEW && creating;
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
            tone={picture.tone}
            caption={picture.caption}
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
              onClick: () => {
                const el =
                  pictureRef.current?.querySelector<HTMLElement>("[data-tone]");
                if (el && downloadPicture(el, picture.title)) show(t("saved"));
              },
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
          onCreate={create}
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
                  <PicturePlaceholder tone={p.tone} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </BrowseColumn>
  );
}
