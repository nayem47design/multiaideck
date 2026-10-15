import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { LightField } from "@/components/atoms/LightField";

import { ImageStudio, ImageStudioFromParams } from "./_components/ImageStudio";

export default async function ImagesPage({
  params,
}: PageProps<"/[locale]/images">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <LightField variant="app" fixed />
      <Suspense fallback={<ImageStudio pictureId={null} />}>
        <ImageStudioFromParams />
      </Suspense>
    </>
  );
}
