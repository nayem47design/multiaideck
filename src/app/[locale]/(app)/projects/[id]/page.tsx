import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { LightField } from "@/components/atoms/LightField";
import { AppMain } from "@/components/templates/AppShell";

import { ProjectScreen } from "./_components/ProjectScreen";

// A project (Figma: Prototype › Project · MultiAI launch / Coffee brand / Thesis research). Projects
// live in the database, so ids are runtime data: the page reads the param behind <Suspense> and the
// project loads in the browser (GET /api/projects/:id); an unknown or deleted project renders
// not-found. generateStaticParams gives Cache Components one sample id (as /c/[id] does).
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function ProjectPage({
  params,
}: PageProps<"/[locale]/projects/[id]">) {
  return (
    <>
      <LightField variant="app" fixed />
      <Suspense fallback={<AppMain>{null}</AppMain>}>
        <Project params={params} />
      </Suspense>
    </>
  );
}

async function Project({
  params,
}: Pick<PageProps<"/[locale]/projects/[id]">, "params">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <ProjectScreen key={id} id={id} />;
}
