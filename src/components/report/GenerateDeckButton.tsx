"use client";

import { useState, useCallback } from "react";
import { Presentation, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GenerateDeckButtonProps {
  address: string;
}

export default function GenerateDeckButton({ address }: GenerateDeckButtonProps) {
  const [generating, setGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [askingPrice, setAskingPrice] = useState("");

  const handleGenerate = useCallback(async () => {
    setShowModal(false);
    setGenerating(true);
    const toastId = toast.loading("Generating investor deck — this may take 15–30 seconds…");

    try {
      const res = await fetch("/api/generate-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          asking_price: askingPrice ? parseFloat(askingPrice.replace(/,/g, "")) : 0,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(err.detail || err.error || `Error ${res.status}`);
      }

      const blob = await res.blob();
      const slug = address
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deck-${slug}.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Investor deck downloaded", { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate deck", {
        id: toastId,
      });
    } finally {
      setGenerating(false);
    }
  }, [address, askingPrice]);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={generating}
        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50 disabled:opacity-50"
      >
        {generating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Presentation className="h-3.5 w-3.5" />
        )}
        Investor Deck
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-stone-900">
              Generate Investor Deck
            </h3>
            <p className="mt-1 text-xs text-stone-500">
              Enter the asking price (optional) for {address}.
            </p>

            <label className="mt-4 block text-[11px] font-medium uppercase tracking-wide text-stone-400">
              Asking Price ($)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={askingPrice}
              onChange={(e) => setAskingPrice(e.target.value)}
              placeholder="e.g. 1,200,000"
              className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Presentation className="h-3.5 w-3.5" />
                )}
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
