import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { getUser } from "@/lib/auth";
import type { UserReport } from "@/types/reports";
import ReportEditor from "./ReportEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getUser();
  if (!user) notFound();

  const supabase = await createServerSupabase();
  const { data: report } = await supabase
    .from("user_reports")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!report) notFound();

  return <ReportEditor initialReport={report as UserReport} />;
}
