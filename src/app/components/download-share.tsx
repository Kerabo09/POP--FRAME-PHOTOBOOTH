import { useState, useEffect } from "react";
import { Download, Share2, X, Check, Smartphone } from "lucide-react";
import { makeStory } from "../lib/strips";
import type { PhotoSession } from "./workstation";

interface DownloadShareProps {
  session: PhotoSession;
  onClose: () => void;
  onNewSession: () => void;
}

function Confetti() {
  const pieces = [
    { left: "8%", top: "12%", color: "#fc79bd", rotate: "-5deg" },
    { left: "22%", top: "75%", color: "#0060ac", rotate: "-126deg" },
    { left: "35%", top: "20%", color: "#0060ac", rotate: "23deg" },
    { left: "45%", top: "55%", color: "#0060ac", rotate: "-161deg" },
    { left: "55%", top: "8%", color: "#0060ac", rotate: "147deg" },
    { left: "62%", top: "35%", color: "#a3e635", rotate: "54deg" },
    { left: "70%", top: "65%", color: "#c084fc", rotate: "-153deg" },
    { left: "78%", top: "18%", color: "#fc79bd", rotate: "99deg" },
    { left: "85%", top: "42%", color: "#c084fc", rotate: "-72deg" },
    { left: "90%", top: "80%", color: "#0060ac", rotate: "-158deg" },
    { left: "15%", top: "45%", color: "#fc79bd", rotate: "-12deg" },
    { left: "50%", top: "90%", color: "#c084fc", rotate: "-153deg" },
    { left: "3%", top: "60%", color: "#a3e635", rotate: "-143deg" },
    { left: "28%", top: "38%", color: "#fc79bd", rotate: "-79deg" },
    { left: "72%", top: "90%", color: "#fc79bd", rotate: "-7deg" },
    { left: "92%", top: "25%", color: "#0060ac", rotate: "90deg" },
    { left: "40%", top: "48%", color: "#0060ac", rotate: "-162deg" },
    { left: "18%", top: "88%", color: "#fc79bd", rotate: "-94deg" },
    { left: "65%", top: "5%", color: "#0060ac", rotate: "-50deg" },
    { left: "82%", top: "55%", color: "#fc79bd", rotate: "53deg" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {pieces.map((p, i) => (
        <div
          key={i}
          className="absolute"
          style={{ left: p.left, top: p.top, transform: `rotate(${p.rotate})` }}
        >
          <div
            className="w-3 h-3 border border-black opacity-20"
            style={{ background: p.color }}
          />
        </div>
      ))}
    </div>
  );
}

function toPng(src: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      c.getContext("2d")!.drawImage(img, 0, 0);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
    };
    img.onerror = reject;
    img.src = src;
  });
}

const MODE_LABELS: Record<string, string> = {
  solo: "SOLO FRAME",
  couple: "COUPLE STRIP",
  family: "FAMILY GRID",
};

export function DownloadShare({ session, onClose, onNewSession }: DownloadShareProps) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (downloaded) {
      const t = setTimeout(() => setDownloaded(false), 2000);
      return () => clearTimeout(t);
    }
  }, [downloaded]);

  function handleDownload(src: string = session.strip, suffix = "") {
    const a = document.createElement("a");
    a.href = src;
    a.download = `popframe-${session.mode}-${session.id}${suffix}.jpg`;
    a.click();
    setDownloaded(true);
  }

  // 9:16 story: opens the phone's share sheet (Instagram, Facebook, TikTok, Messenger…)
  async function handleStory() {
    const story = await makeStory(session.strip, session.style ?? "pop");
    await handleShare(story, "-story");
  }

  async function handleShare(src: string = session.strip, suffix = "") {
    try {
      const blob = await (await fetch(src)).blob();
      const file = new File([blob], `popframe-${session.mode}-${session.id}${suffix}.jpg`, { type: "image/jpeg" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My POP FRAME strip", text: "Snapped with POP FRAME" });
        return;
      }
      // Desktop fallback: copy the image to the clipboard if supported
      if (navigator.clipboard && "ClipboardItem" in window) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": await toPng(src) })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return; // user closed the share sheet
    }
    handleDownload(src, suffix);
  }

  return (
    <div
      className="flex-1 bg-[#f7fbe8] relative flex flex-col items-center justify-center py-16 px-4 sm:px-6 overflow-hidden"
    >
      <Confetti />

      <div className="relative z-10 max-w-4xl w-full flex flex-col md:flex-row gap-8 md:gap-6 items-center md:items-start mt-6 md:mt-0">
        {/* Left: Photo strip */}
        <div className="flex-1 flex items-center justify-center w-full">
          <div
            className="bg-white drop-shadow-[4px_4px_0px_black] border border-[#191d12] p-4 -rotate-2"
            style={{ maxWidth: 320, width: "100%" }}
          >
            <img
              src={session.strip}
              alt="Your photo strip"
              className="w-full border border-[#191d12]"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex-1 flex flex-col gap-6 w-full">
          {/* Success banner */}
          <div className="bg-[#c084fc] drop-shadow-[4px_4px_0px_black] border border-[#191d12] p-6">
            <p className="font-['Lexend',sans-serif] font-normal text-[#191d12] text-sm uppercase mb-2">
              {MODE_LABELS[session.mode]} — STRIP READY!
            </p>
            <p className="font-['Lexend',sans-serif] text-[#191d12] text-base opacity-90">
              Your memory is frozen in time. Fast, clean, and ready for the world. No blurs, just vibes.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => handleDownload()}
              className="flex-1 bg-[#191d12] drop-shadow-[4px_4px_0px_black] border border-[#191d12] flex items-center justify-center gap-2 py-4 cursor-pointer hover:opacity-90 active:translate-y-[2px]"
            >
              {downloaded ? <Check size={16} className="text-[#a3e635]" /> : <Download size={16} className="text-[#f7fbe8]" />}
              <div className="flex flex-col items-center">
                <span className="font-['Space_Grotesk',sans-serif] font-bold text-[#f7fbe8] text-sm uppercase">DOWNLOAD</span>
                <span className="font-['Space_Grotesk',sans-serif] font-bold text-[#f7fbe8] text-sm uppercase">HIGH-RES (FREE)</span>
              </div>
            </button>
            <button
              onClick={() => handleShare()}
              className="flex-1 bg-white drop-shadow-[4px_4px_0px_black] border border-[#191d12] flex items-center justify-center gap-2 py-4 cursor-pointer hover:opacity-90 active:translate-y-[2px]"
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Share2 size={16} className="text-[#191d12]" />}
              <span className="font-['Space_Grotesk',sans-serif] font-bold text-[#191d12] text-sm uppercase">
                {copied ? "COPIED!" : "SHARE"}
              </span>
            </button>
          </div>

          <button
            onClick={handleStory}
            className="bg-[#fc79bd] drop-shadow-[4px_4px_0px_black] border border-[#191d12] flex items-center justify-center gap-2 py-3 cursor-pointer hover:opacity-90 active:translate-y-[2px]"
          >
            <Smartphone size={16} className="text-[#191d12]" />
            <span className="font-['Space_Grotesk',sans-serif] font-bold text-[#191d12] text-sm uppercase">POST AS STORY (9:16)</span>
          </button>

          {/* Secondary info */}
          <div className="bg-[#ecf0dd] border border-dashed border-[#191d12] p-4 flex gap-4 items-start">
            <svg width="22" height="21" viewBox="0 0 22 21" fill="none" className="shrink-0 mt-0.5">
              <path d="M11 0L13.4 7.4H21.2L14.9 11.9L17.3 19.3L11 14.8L4.7 19.3L7.1 11.9L0.8 7.4H8.6L11 0Z" fill="#446900" />
            </svg>
            <div>
              <p className="font-['Space_Grotesk',sans-serif] font-bold text-[#191d12] text-sm uppercase mb-1">SAVED TO GALLERY</p>
              <p className="font-['Space_Grotesk',sans-serif] text-[#424936] text-sm">
                Your strip is kept in the Gallery on this device. Download it to keep a copy anywhere.
              </p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex gap-3">
            <button
              onClick={onNewSession}
              className="flex-1 bg-[#a3e635] drop-shadow-[2px_2px_0px_black] border border-[#191d12] py-3 cursor-pointer hover:opacity-90"
            >
              <span className="font-['Space_Grotesk',sans-serif] font-bold text-[#416400] text-sm uppercase">SNAP AGAIN</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-white border border-[#191d12] py-3 cursor-pointer hover:bg-[#f0f4e0]"
            >
              <span className="font-['Space_Grotesk',sans-serif] font-bold text-[#191d12] text-sm uppercase">VIEW GALLERY</span>
            </button>
          </div>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:right-6 z-20 w-11 h-11 bg-white border border-[#191d12] flex items-center justify-center cursor-pointer hover:bg-[#f0f4e0]"
      >
        <X size={18} className="text-[#191d12]" />
      </button>
    </div>
  );
}
