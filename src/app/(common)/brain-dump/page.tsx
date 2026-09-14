import { redirect } from "next/navigation";

export default function LegacyBrainDumpPage() {
  redirect("/tasks?view=brain-dump");
}
