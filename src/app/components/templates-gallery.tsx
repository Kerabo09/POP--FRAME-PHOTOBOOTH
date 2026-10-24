import type { CaptureMode } from "./workstation";

interface TemplatesGalleryProps {
  onSelectMode: (mode: CaptureMode) => void;
  onNavigate: (view: "workstation") => void;
}

const templates = [
  {
    id: "solo",
    mode: "solo" as CaptureMode,
    name: "SOLO FRAME",
    tag: "1X",
    tagColor: "#fc79bd",
    description: "Single portrait frame. Fast, clean, classic.",
    bgColor: "#f7fbe8",
    accentColor: "#a3e635",
    shots: 1,
    layout: "portrait",
  },
  {
    id: "couple",
    mode: "couple" as CaptureMode,
    name: "COUPLE STRIP",
    tag: "3X",
    tagColor: "#b9d4ff",
    description: "Three-shot vertical strip. Tell your story.",
    bgColor: "#ffd8e7",
    accentColor: "#fc79bd",
    shots: 3,
    layout: "strip",
  },
  {
    id: "family",
    mode: "family" as CaptureMode,
    name: "FAMILY GRID",
    tag: "4X",
    tagColor: "#c084fc",
    description: "Four-photo 2×2 grid. Everyone's included.",
    bgColor: "#e0f0ff",
    accentColor: "#a43073",
    shots: 4,
    layout: "grid",
  },
];

function TemplatePreview({ layout, bgColor }: { layout: string; bgColor: string }) {
  if (layout === "strip") {
    return (
      <div className="flex flex-col gap-1 items-center" style={{ background: bgColor, padding: 12 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-20 h-14 bg-white/60 border border-[#191d12]" />
        ))}
        <div className="w-20 h-5 border-t border-[#191d12] flex items-center justify-center mt-1">
          <span className="text-[8px] font-['Space_Grotesk',sans-serif] font-bold text-[#191d12] uppercase">POP FRAME</span>
        </div>
      </div>
    );
  }
  if (layout === "grid") {
    return (
      <div className="flex flex-col gap-1 items-center" style={{ background: bgColor, padding: 12 }}>
        <div className="grid grid-cols-2 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="w-10 h-10 bg-white/60 border border-[#191d12]" />
          ))}
        </div>
        <div className="w-[84px] h-5 border-t border-[#191d12] flex items-center justify-center mt-1">
          <span className="text-[8px] font-['Space_Grotesk',sans-serif] font-bold text-[#191d12] uppercase">POP FRAME</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1 items-center" style={{ background: bgColor, padding: 12 }}>
      <div className="w-20 h-28 bg-white/60 border border-[#191d12]" />
      <div className="w-20 h-5 border-t border-[#191d12] flex items-center justify-center mt-1">
        <span className="text-[8px] font-['Space_Grotesk',sans-serif] font-bold text-[#191d12] uppercase">POP FRAME</span>
      </div>
    </div>
  );
}

export function TemplatesGallery({ onSelectMode, onNavigate }: TemplatesGalleryProps) {
  return (
    <div
      className="flex-1 bg-[#f7fbe8] px-4 sm:px-6 py-10 sm:py-16"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="bg-[#ecf0dd] drop-shadow-[4px_4px_0px_black] border border-[#191d12] p-5 sm:p-8 inline-block max-w-full">
            <h2 className="font-['Lexend',sans-serif] font-black text-[#191d12] uppercase tracking-tight text-4xl sm:text-5xl leading-none">
              TEMPLATES
            </h2>
            <p className="font-['Space_Grotesk',sans-serif] text-[#424936] mt-3 max-w-sm">
              Choose your photobooth layout and start capturing memories instantly.
            </p>
          </div>
        </div>

        {/* Template cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {templates.map((t) => (
            <div
              key={t.id}
              className="bg-white drop-shadow-[4px_4px_0px_black] border border-[#191d12] overflow-hidden flex flex-col group cursor-pointer hover:-translate-y-1 transition-transform"
              onClick={() => { onSelectMode(t.mode); onNavigate("workstation"); }}
            >
              {/* Preview */}
              <div className="flex items-center justify-center py-8 border-b border-[#191d12]" style={{ background: t.bgColor }}>
                <TemplatePreview layout={t.layout} bgColor={t.bgColor} />
              </div>

              {/* Info */}
              <div className="p-6 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between">
                  <h3 className="font-['Lexend',sans-serif] font-black text-[#191d12] text-xl uppercase">{t.name}</h3>
                  <div
                    className="drop-shadow-[2px_2px_0px_black] px-3 py-1 border border-[#191d12] flex items-center justify-center"
                    style={{ background: t.tagColor }}
                  >
                    <span className="font-['Lexend',sans-serif] font-black text-[#191d12] text-sm">{t.tag}</span>
                  </div>
                </div>
                <p className="font-['Space_Grotesk',sans-serif] text-[#424936] text-sm">{t.description}</p>
                <div className="mt-auto">
                  <div className="bg-[#191d12] drop-shadow-[2px_2px_0px_black] border border-[#191d12] flex items-center justify-center py-3">
                    <span className="font-['Space_Grotesk',sans-serif] font-bold text-[#a3e635] text-sm uppercase">
                      USE THIS TEMPLATE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tip box */}
        <div className="mt-10 sm:mt-12 bg-[#ffd8e7] drop-shadow-[4px_4px_0px_black] border border-[#191d12] p-6 flex gap-4 items-start">
          <div className="bg-[#191d12] px-2 py-1 shrink-0">
            <span className="font-['Space_Grotesk',sans-serif] font-bold text-[#a3e635] text-xs uppercase">TIP</span>
          </div>
          <p className="font-['Lexend',sans-serif] text-[#191d12] text-sm">
            All templates are free. No watermarks. High-res downloads included. Snap, download, share.
          </p>
        </div>
      </div>
    </div>
  );
}
