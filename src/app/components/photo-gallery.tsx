import { Download, Share2, Trash2 } from "lucide-react";
import type { PhotoSession } from "./workstation";

interface PhotoGalleryProps {
  sessions: PhotoSession[];
  onViewSession: (session: PhotoSession) => void;
  onDeleteSession: (id: string) => void;
}

const MODE_LABELS: Record<string, string> = {
  solo: "SOLO FRAME",
  couple: "COUPLE STRIP",
  family: "FAMILY GRID",
};

const MODE_COLORS: Record<string, string> = {
  solo: "#fc79bd",
  couple: "#b9d4ff",
  family: "#c084fc",
};

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function PhotoGallery({ sessions, onViewSession, onDeleteSession }: PhotoGalleryProps) {
  function handleDownload(session: PhotoSession) {
    const a = document.createElement("a");
    a.href = session.strip;
    a.download = `popframe-${session.mode}-${session.id}.jpg`;
    a.click();
  }

  return (
    <div
      className="flex-1 bg-[#f7fbe8] px-4 sm:px-6 py-10 sm:py-16"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <h2 className="font-['Lexend',sans-serif] font-black text-[#191d12] uppercase tracking-tight text-4xl sm:text-5xl leading-none">
              GALLERY
            </h2>
            <p className="font-['Space_Grotesk',sans-serif] text-[#424936] mt-2">
              {sessions.length === 0 ? "No sessions yet. Start snapping!" : `${sessions.length} session${sessions.length > 1 ? "s" : ""} captured`}
            </p>
          </div>
          {sessions.length > 0 && (
            <div className="bg-[#191d12] px-4 py-2 border border-[#191d12]">
              <span className="font-['Space_Grotesk',sans-serif] font-bold text-[#a3e635] text-sm uppercase">
                {sessions.length} MEMORIES
              </span>
            </div>
          )}
        </div>

        {/* Empty state */}
        {sessions.length === 0 && (
          <div className="bg-white drop-shadow-[4px_4px_0px_black] border border-[#191d12] p-8 sm:p-16 flex flex-col items-center text-center">
            <div className="bg-[#ecf0dd] w-20 h-20 border border-[#191d12] flex items-center justify-center mb-6">
              <span className="font-['Lexend',sans-serif] font-black text-[#191d12] text-3xl">📷</span>
            </div>
            <h3 className="font-['Lexend',sans-serif] font-black text-[#191d12] text-2xl uppercase mb-2">NO SNAPS YET</h3>
            <p className="font-['Space_Grotesk',sans-serif] text-[#424936]">Head to the Workstation and take your first shot.</p>
          </div>
        )}

        {/* Session grid */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...sessions].reverse().map((session) => (
              <div
                key={session.id}
                className="bg-white drop-shadow-[4px_4px_0px_black] border border-[#191d12] overflow-hidden flex flex-col"
              >
                {/* Strip preview */}
                <div
                  className="relative border-b border-[#191d12] overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ background: "#ecf0dd" }}
                  onClick={() => onViewSession(session)}
                >
                  <img
                    src={session.strip}
                    alt={`${session.mode} session`}
                    className="w-full object-contain max-h-64"
                  />
                  <div
                    className="absolute top-2 right-2 px-2 py-1 border border-[#191d12] drop-shadow-[2px_2px_0px_black]"
                    style={{ background: MODE_COLORS[session.mode] }}
                  >
                    <span className="font-['Space_Grotesk',sans-serif] font-bold text-[#191d12] text-xs uppercase">
                      {MODE_LABELS[session.mode]}
                    </span>
                  </div>
                </div>

                {/* Meta + actions */}
                <div className="p-4 flex items-center justify-between">
                  <span className="font-['Space_Grotesk',sans-serif] text-[#424936] text-sm">
                    {timeAgo(session.timestamp)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(session)}
                      className="w-11 h-11 sm:w-9 sm:h-9 bg-[#191d12] border border-[#191d12] flex items-center justify-center hover:opacity-80 cursor-pointer"
                      title="Download"
                    >
                      <Download size={14} className="text-[#a3e635]" />
                    </button>
                    <button
                      onClick={() => onViewSession(session)}
                      className="w-11 h-11 sm:w-9 sm:h-9 bg-white border border-[#191d12] flex items-center justify-center hover:bg-[#f0f4e0] cursor-pointer"
                      title="View & Share"
                    >
                      <Share2 size={14} className="text-[#191d12]" />
                    </button>
                    <button
                      onClick={() => onDeleteSession(session.id)}
                      className="w-11 h-11 sm:w-9 sm:h-9 bg-white border border-[#191d12] flex items-center justify-center hover:bg-red-50 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
