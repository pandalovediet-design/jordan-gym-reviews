import type { Metadata } from "next";
import { ExercisesPreview } from "./Preview";

export const metadata: Metadata = { title: "معاينة دليل التمارين", robots: { index: false, follow: false } };

export default function Page() {
  return <ExercisesPreview />;
}
