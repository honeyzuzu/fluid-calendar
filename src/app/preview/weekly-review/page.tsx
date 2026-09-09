import { WeeklyReview } from "@/components/planning/WeeklyReview";
import { weeklyReviewPreview } from "@/components/planning/weekly-review-preview";

export default function WeeklyReviewPreviewPage() {
  return (
    <main className="min-h-screen min-w-0 overflow-x-clip bg-[#fff9e8] p-3 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-lg font-semibold text-[#64734a]">
          Sunnie · a little room to grow
        </p>
        <WeeklyReview preview={weeklyReviewPreview} />
      </div>
    </main>
  );
}
