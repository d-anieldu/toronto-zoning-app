"use client";

import { useState, useCallback } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PdfExportButtonProps {
  /** Address string used in filename and header */
  address: string;
  /** Zone code displayed in the PDF header */
  zoneCode?: string;
  /** CSS selector for the report container element to capture */
  containerSelector?: string;
}

export default function PdfExportButton({
  address,
  zoneCode,
  containerSelector = "[data-report-container]",
}: PdfExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    const toastId = toast.loading("Generating PDF…");

    try {
      // Dynamic imports — only loaded on demand
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const container = document.querySelector(containerSelector) as HTMLElement | null;
      if (!container) {
        toast.error("Could not find report content to export", { id: toastId });
        return;
      }

      // Hide elements marked with data-no-pdf before capture
      const hidden: HTMLElement[] = [];
      container.querySelectorAll("[data-no-pdf]").forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style.display !== "none") {
          hidden.push(htmlEl);
          htmlEl.style.display = "none";
        }
      });

      // Capture the report at 2× for quality
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: "#fafaf9", // stone-50
      });

      // Restore hidden elements
      hidden.forEach((el) => {
        el.style.display = "";
      });

      // PDF dimensions — Letter size in mm
      const pageW = 215.9;
      const pageH = 279.4;
      const margin = 12;
      const headerH = 18;
      const footerH = 10;
      const contentW = pageW - margin * 2;
      const contentH = pageH - margin * 2 - headerH - footerH;

      // Scale canvas to fit page width
      const imgW = contentW;
      const imgH = (canvas.height * contentW) / canvas.width;
      const totalPages = Math.ceil(imgH / contentH);

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

      const now = new Date();
      const dateStr = now.toLocaleDateString("en-CA", {
        year: "numeric", month: "long", day: "numeric",
      });
      const timeStr = now.toLocaleTimeString("en-CA", {
        hour: "2-digit", minute: "2-digit",
      });

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();

        // ── Header ──
        pdf.setFillColor(28, 25, 23); // stone-900
        pdf.rect(0, 0, pageW, headerH, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text(address || "Zoning Report", margin, 8);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        const headerRight = [
          zoneCode,
          "User-Edited Report",
          dateStr,
        ].filter(Boolean).join("  ·  ");
        pdf.text(headerRight, pageW - margin, 8, { align: "right" });
        pdf.setTextColor(163, 163, 163); // stone-400
        pdf.setFontSize(6);
        pdf.text("Toronto Zoning Intelligence", margin, 14);

        // ── Content slice ──
        const srcY = page * contentH * (canvas.width / contentW);
        const srcH = Math.min(
          contentH * (canvas.width / contentW),
          canvas.height - srcY,
        );

        if (srcH > 0) {
          // Create a slice canvas for this page
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = srcH;
          const ctx = sliceCanvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
            const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.92);
            const sliceImgH = (srcH * contentW) / canvas.width;
            pdf.addImage(sliceData, "JPEG", margin, headerH + margin, imgW, sliceImgH);
          }
        }

        // ── Footer ──
        const footerY = pageH - footerH;
        pdf.setDrawColor(214, 211, 209); // stone-300
        pdf.line(margin, footerY, pageW - margin, footerY);
        pdf.setFontSize(6);
        pdf.setTextColor(120, 113, 108); // stone-500
        pdf.text(
          `Page ${page + 1} of ${totalPages}  ·  Generated ${dateStr} at ${timeStr}`,
          margin,
          footerY + 5,
        );
        pdf.text(
          "For planning purposes only. Verify with City of Toronto.",
          pageW - margin,
          footerY + 5,
          { align: "right" },
        );
      }

      // Sanitize filename
      const safeAddr = (address || "zoning_report")
        .replace(/[^a-zA-Z0-9 _-]/g, "")
        .replace(/\s+/g, "_")
        .substring(0, 80);
      pdf.save(`${safeAddr}_zoning_report.pdf`);

      toast.success("PDF downloaded", { id: toastId });
    } catch (err) {
      toast.error("PDF generation failed. Try again.", { id: toastId });
    } finally {
      setExporting(false);
    }
  }, [address, zoneCode, containerSelector]);

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={exporting}
      className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-600 shadow-sm transition-colors hover:bg-stone-50 hover:text-stone-800 disabled:opacity-50"
      data-no-pdf
    >
      {exporting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileDown className="h-3.5 w-3.5" />
      )}
      {exporting ? "Exporting…" : "Export PDF"}
    </button>
  );
}
