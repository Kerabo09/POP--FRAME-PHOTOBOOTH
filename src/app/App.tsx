import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Workstation, type CaptureMode, type PhotoSession } from "./components/workstation";
import { TemplatesGallery } from "./components/templates-gallery";
import { PhotoGallery } from "./components/photo-gallery";
import { DownloadShare } from "./components/download-share";

type View = "workstation" | "templates" | "gallery" | "download";

const STORAGE_KEY = "popframe:sessions:v1";

function loadSessions(): PhotoSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PhotoSession[]) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [view, setView] = useState<View>("workstation");
  const [menuOpen, setMenuOpen] = useState(false);
  const [captureMode, setCaptureMode] = useState<CaptureMode>("solo");
  const [sessions, setSessions] = useState<PhotoSession[]>(loadSessions);
  const [activeSession, setActiveSession] = useState<PhotoSession | null>(null);

  // Persist the gallery (strips only — raw shots would blow the storage quota)
  useEffect(() => {
    let list = sessions.map((s) => ({ ...s, photos: [] as string[] }));
    while (list.length) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        return;
      } catch {
        list = list.slice(1); // quota hit: drop the oldest and retry
      }
    }
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, [sessions]);

  function go(v: View) {
    setView(v);
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  }

  function handleSessionComplete(session: PhotoSession) {
    setSessions((prev) => [...prev, session]);
    setActiveSession(session);
    go("download");
  }

  function handleDeleteSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  function handleViewSession(session: PhotoSession) {
    setActiveSession(session);
    go("download");
  }

  const navItem = (v: View, label: string, badge?: number) => (
    <button
      onClick={() => go(v)}
      aria-current={view === v ? "page" : undefined}
      className={`px-2 py-3 md:py-1 text-left font-['Space_Grotesk',sans-serif] text-base cursor-pointer transition-colors ${
        view === v ? "text-[#446900] underline decoration-solid" : "text-[#191d12] opacity-70 hover:opacity-100"
      }`}
    >
      {label}
      {badge ? (
        <span className="ml-1.5 bg-[#a3e635] text-[#416400] font-bold text-xs px-1.5 py-0.5 rounded-full border border-[#416400]">{badge}</span>
      ) : null}
    </button>
  );

  const captureBtn = (
    <button
      onClick={() => go("workstation")}
      className="bg-[#a3e635] drop-shadow-[4px_4px_0px_black] border border-[#191d12] px-6 py-2.5 md:py-1.5 font-['Lexend',sans-serif] font-bold text-[#416400] text-base uppercase cursor-pointer hover:opacity-90 active:translate-y-[1px] active:drop-shadow-[2px_2px_0px_black] transition-all"
    >
      CAPTURE
    </button>
  );

  return (
    <div className="flex flex-col min-h-[100dvh] overflow-x-hidden" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Top Nav */}
      <header className="bg-[#f7fbe8] border-b border-[#191d12] shrink-0 z-50 sticky top-0">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <button
            onClick={() => go("workstation")}
            className="font-['Lexend',sans-serif] font-black text-[#191d12] text-xl sm:text-2xl uppercase tracking-tight cursor-pointer hover:opacity-80"
          >
            POP FRAME APP
          </button>

          <nav className="hidden md:flex items-center gap-6" aria-label="Main">
            {navItem("workstation", "Workstation")}
            {navItem("templates", "Templates")}
            {navItem("gallery", "Gallery", sessions.length)}
            {captureBtn}
          </nav>

          <button
            className="md:hidden w-11 h-11 flex items-center justify-center border border-[#191d12] bg-white cursor-pointer"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <nav className="md:hidden border-t border-[#191d12] px-4 pb-4 pt-2 flex flex-col bg-[#f7fbe8]" aria-label="Mobile">
            {navItem("workstation", "Workstation")}
            {navItem("templates", "Templates")}
            {navItem("gallery", "Gallery", sessions.length)}
            <div className="mt-2">{captureBtn}</div>
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {view === "workstation" && (
          <Workstation
            captureMode={captureMode}
            onCaptureModeChange={setCaptureMode}
            onSessionComplete={handleSessionComplete}
          />
        )}
        {view === "templates" && (
          <TemplatesGallery onSelectMode={(mode) => setCaptureMode(mode)} onNavigate={(v) => go(v)} />
        )}
        {view === "gallery" && (
          <PhotoGallery sessions={sessions} onViewSession={handleViewSession} onDeleteSession={handleDeleteSession} />
        )}
        {view === "download" && activeSession && (
          <DownloadShare session={activeSession} onClose={() => go("gallery")} onNewSession={() => go("workstation")} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#121f00] border-t border-[#191d12] shrink-0 pb-[env(safe-area-inset-bottom)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 text-center">
          <span className="font-['Space_Grotesk',sans-serif] font-bold text-[#b2f746] text-xs sm:text-sm">
            © 2024 POP FRAME APP - NO BLURS ALLOWED
          </span>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Support"].map((l) => (
              <button key={l} className="font-['Space_Grotesk',sans-serif] text-[#b2f746] text-sm opacity-80 hover:opacity-100 cursor-pointer py-2">
                {l}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
