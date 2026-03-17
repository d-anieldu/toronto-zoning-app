"use client";

import { useState } from "react";
import { BookmarkPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Props {
  address: string;
  lookupData: Record<string, unknown>;
}

export default function CreateReportButton({ address, lookupData }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    // Check auth on the client side
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/sign-in?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, lookup_data: lookupData }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to save" }));
        throw new Error(err.error || "Failed to save report");
      }

      const data = await res.json();
      toast.success("Report saved", {
        action: {
          label: "View →",
          onClick: () => router.push(`/reports/${data.id}`),
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-stone-800 disabled:opacity-50"
      title="Save Report"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <BookmarkPlus className="h-3.5 w-3.5" />
      )}
      Save Report
    </button>
  );
}
