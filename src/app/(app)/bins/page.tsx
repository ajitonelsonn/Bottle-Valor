import type { Metadata } from "next";
import { BinsExplorer } from "@/components/bins/bins-explorer";

export const metadata: Metadata = { title: "Find Bins" };

export default async function BinsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { bin } = await searchParams;
  return <BinsExplorer initialBinId={typeof bin === "string" ? bin : undefined} />;
}
