import { useRef, useEffect, useState, useCallback, Fragment } from "react";
import { Camera, Zap, Timer, SwitchCamera, X, RefreshCw } from "lucide-react";
import { FILTERS, drawFiltered, applyVintage, GRAIN_URL } from "../lib/filters";
import { applyEffect, drawVideoCover } from "../lib/effects";
import { FRAMES, STRIP_STYLES, PHOTO_W, PHOTO_H, assembleStrip } from "../lib/strips";

export type CaptureMode = "solo" | "couple" | "family";

export interface PhotoSession {
  id: string;
  mode: CaptureMode;
  photos: string[];
  strip: string;
  timestamp: number;
  filter?: string;
  frame?: string;
  style?: string;
}

interface WorkstationProps {
  captureMode: CaptureMode;
  onCaptureModeChange: (mode: CaptureMode) => void;
  onSessionComplete: (session: PhotoSession) => void;
}

const MODE_CONFIG = {
  solo: { label: "SOLO FRAME", count: 1, title: "SOLO", subtitle: "SESSION", description: "High-energy portraits without the studio fees. Align your face within the frame and hit the big button. No blurs allowed." },
  couple: { label: "COUPLE STRIP", count: 3, title: "COUPLE", subtitle: "STRIP", description: "Three frames, one story. Perfect for duo portraits. Get ready and strike a pose for each snap!" },
  family: { label: "FAMILY GRID", count: 4, title: "FAMILY", subtitle: "GRID", description: "Four frames, four memories. Gather everyone in the frame and capture your best group moments." },
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Workstation({ captureMode, onCaptureModeChange, onSessionComplete }: WorkstationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturedRef = useRef<string[]>([]);
  const cancelRef = useRef(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [canSwitch, setCanSwitch] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashMode, setFlashMode] = useState<"auto" | "on" | "off">("auto");
  const [timerSeconds, setTimerSeconds] = useState(3);
  const [filterId, setFilterId] = useState("normal");
  const [frameId, setFrameId] = useState("white");
  const [styleId, setStyleId] = useState("pop");

  const config = MODE_CONFIG[captureMode];
  const filter = FILTERS.find((f) => f.id === filterId) ?? FILTERS[0];
  const mirrored = facing === "user";

  // Start / restart camera
  useEffect(() => {
    let cancelled = false;
    setCameraError(null);
    setCameraReady(false);

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera isn't available here. Open the app over HTTPS (or localhost) in a modern browser.");
        return;
      }
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 960 }, facingMode: facing },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) setCanSwitch(devices.filter((d) => d.kind === "videoinput").length > 1);
      } catch (e) {
        const name = (e as DOMException)?.name;
        setCameraError(
          name === "NotFoundError"
            ? "No camera found on this device."
            : name === "NotReadableError"
            ? "Camera is busy in another app. Close it and try again."
            : "Camera access denied. Please allow camera permissions."
        );
      }
    }
    startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [facing, retryKey]);

  // Stop an in-progress session if the user leaves the page
  useEffect(() => () => { cancelRef.current = true; }, []);

  // Live preview for pixel effects: draw the video into a small canvas and run the effect ~30fps
  useEffect(() => {
    const effect = filter.effect;
    const canvas = fxCanvasRef.current;
    const video = videoRef.current;
    if (!effect || !canvas || !video) return;
    const W = 400, H = 300;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    let raf = 0, last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 33 || !video.videoWidth) return;
      last = now;
      drawVideoCover(ctx, video, W, H, mirrored);
      applyEffect(effect, ctx, W, H, now / 1000);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [filter.effect, mirrored, cameraReady]);

  const capturePhoto = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    // Center-crop the video to 4:3 so the photo matches the viewfinder
    const vw = video.videoWidth, vh = video.videoHeight;
    const target = PHOTO_W / PHOTO_H;
    let sw = vw, sh = vh;
    if (vw / vh > target) sw = vh * target; else sh = vw / target;
    const sx = (vw - sw) / 2, sy = (vh - sh) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = PHOTO_W;
    canvas.height = PHOTO_H;
    const ctx = canvas.getContext("2d")!;
    if (mirrored) {
      ctx.translate(PHOTO_W, 0);
      ctx.scale(-1, 1);
    }
    drawFiltered(ctx, video, filter.css, sx, sy, sw, sh, 0, 0, PHOTO_W, PHOTO_H);
    if (filter.effect) applyEffect(filter.effect, ctx, PHOTO_W, PHOTO_H, performance.now() / 1000);
    if (filter.fx) applyVintage(ctx, PHOTO_W, PHOTO_H, filter.fx);
    return canvas.toDataURL("image/jpeg", 0.92);
  }, [filter.css, filter.fx, filter.effect, mirrored]);

  const triggerFlash = useCallback(() => {
    if (flashMode === "off") return;
    setFlash(true);
    setTimeout(() => setFlash(false), flashMode === "on" ? 350 : 200);
  }, [flashMode]);

  const cancelCapture = () => { cancelRef.current = true; };

  const startCapture = useCallback(async () => {
    if (isCapturing || !cameraReady) return;
    cancelRef.current = false;
    setIsCapturing(true);
    capturedRef.current = [];
    setCapturedPhotos([]);

    for (let i = 0; i < config.count; i++) {
      for (let t = timerSeconds; t > 0; t--) {
        if (cancelRef.current) break;
        setCountdown(t);
        await sleep(1000);
      }
      if (cancelRef.current) break;
      setCountdown(0);
      triggerFlash();
      await sleep(80);
      const photo = capturePhoto();
      if (photo) {
        capturedRef.current = [...capturedRef.current, photo];
        setCapturedPhotos([...capturedRef.current]);
      }
      setCountdown(null);
      if (i < config.count - 1) await sleep(600);
    }

    if (cancelRef.current || capturedRef.current.length === 0) {
      setCountdown(null);
      setCapturedPhotos([]);
      setIsCapturing(false);
      return;
    }

    const strip = await assembleStrip(capturedRef.current, captureMode, frameId, styleId, Date.now());
    const session: PhotoSession = {
      id: Date.now().toString(),
      mode: captureMode,
      photos: capturedRef.current,
      strip,
      timestamp: Date.now(),
      filter: filter.label,
      frame: frameId,
      style: styleId,
    };
    setIsCapturing(false);
    setCapturedPhotos([]);
    onSessionComplete(session);
  }, [isCapturing, cameraReady, config.count, timerSeconds, triggerFlash, capturePhoto, captureMode, frameId, styleId, filter.label, onSessionComplete]);

  // Space bar = snap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        startCapture();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [startCapture]);

  const cycleFlash = () => setFlashMode((f) => (f === "auto" ? "on" : f === "on" ? "off" : "auto"));
  const cycleTimer = () => setTimerSeconds((t) => (t === 3 ? 5 : t === 5 ? 10 : 3));

  const photoProgress = capturedPhotos.length;
  const totalPhotos = config.count;
  const frameBtn = "font-['Lexend',sans-serif] font-bold text-[#191d12] text-xs sm:text-sm uppercase hover:opacity-70 cursor-pointer flex items-center gap-1 min-h-[44px] sm:min-h-0 disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="bg-[#f7fbe8] flex-1 flex flex-col items-center justify-center py-8 sm:py-12 md:py-16 px-4 sm:px-6 relative overflow-hidden">
      {/* Decorative floating elements (desktop only) */}
      <div className="hidden lg:block absolute right-[6%] top-[80px] pointer-events-none z-10">
        <div className="-rotate-12">
          <div className="bg-[#b9d4ff] drop-shadow-[4px_4px_0px_black] flex flex-col items-start p-[17px] border border-[#191d12]">
            <p className="font-['Space_Grotesk',sans-serif] font-bold text-[#191d12] text-sm uppercase">PRO TIP: LOOK UP!</p>
          </div>
        </div>
      </div>
      <div className="hidden lg:block absolute left-[4%] bottom-[100px] pointer-events-none z-10">
        <div className="rotate-6">
          <div className="bg-[#ffd8e7] drop-shadow-[4px_4px_0px_black] flex flex-col items-start p-[17px] border border-[#191d12]">
            <p className="font-['Space_Grotesk',sans-serif] font-bold text-[#191d12] text-sm uppercase">EST. 2024</p>
          </div>
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex flex-col items-center gap-3 sm:gap-4 mb-8 sm:mb-12 w-full">
        <p className="font-['Lexend',sans-serif] font-black text-[#191d12] text-xs sm:text-sm uppercase tracking-wide">CHOOSE YOUR CANVAS</p>
        <div className="bg-[#ecf0dd] drop-shadow-[4px_4px_0px_black] flex items-stretch p-[5px] border border-[#191d12] max-w-full">
          {(["solo", "couple", "family"] as CaptureMode[]).map((m) => (
            <button
              key={m}
              disabled={isCapturing}
              onClick={() => onCaptureModeChange(m)}
              className={`px-2.5 sm:px-6 py-2.5 sm:py-2 font-['Space_Grotesk',sans-serif] text-[11px] sm:text-base uppercase cursor-pointer transition-colors border disabled:cursor-not-allowed ${
                captureMode === m
                  ? "bg-[#fc79bd] border-[#191d12] text-[#76014e] font-bold"
                  : "border-transparent text-[#424936] font-normal hover:bg-white/50"
              }`}
            >
              {MODE_CONFIG[m].label}
            </button>
          ))}
        </div>
      </div>

      {/* Main camera interface */}
      <div className="bg-[#a3e635] drop-shadow-[4px_4px_0px_black] flex flex-col md:flex-row gap-8 md:gap-12 items-center max-w-[896px] w-full p-4 sm:p-8 md:p-12 border border-[#191d12] relative">

        {/* Viewfinder + filters */}
        <div className="w-full md:w-auto md:shrink-0 flex flex-col gap-4 items-center min-w-0">
          <div className="bg-white drop-shadow-[4px_4px_0px_black] p-2.5 sm:p-[17px] border border-[#191d12] w-full max-w-[484px] md:w-[484px]">
            <div className="bg-black relative w-full aspect-[4/3] overflow-hidden border border-[#191d12]">
              {!cameraError ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedData={() => setCameraReady(true)}
                  className="absolute inset-0 w-full h-full object-cover transition-[filter] duration-200"
                  style={{ transform: mirrored ? "scaleX(-1)" : "none", filter: filter.css, opacity: filter.effect ? 0 : 1 }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] p-4">
                  <div className="text-center">
                    <Camera className="text-white/50 mx-auto mb-2" size={40} />
                    <p className="text-white/70 text-sm font-['Space_Grotesk',sans-serif] text-center mb-3">{cameraError}</p>
                    <button
                      onClick={() => setRetryKey((k) => k + 1)}
                      className="inline-flex items-center gap-2 bg-[#a3e635] text-[#191d12] border border-[#191d12] px-4 py-2 font-['Space_Grotesk',sans-serif] font-bold text-sm uppercase cursor-pointer"
                    >
                      <RefreshCw size={14} /> Try again
                    </button>
                  </div>
                </div>
              )}

              {filter.effect && !cameraError && (
                <canvas ref={fxCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
              )}

              {filter.fx && !cameraError && (
                <>
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${filter.fx.vignette}) 100%)` }}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-overlay"
                    style={{ backgroundImage: GRAIN_URL, opacity: Math.min(1, filter.fx.grain * 3) }}
                  />
                </>
              )}

              {flash && <div className="absolute inset-0 bg-white z-20 pointer-events-none" />}

              {countdown !== null && countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <div className="bg-black/60 rounded-full w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                    <span className="text-white font-['Lexend',sans-serif] font-black text-6xl sm:text-[80px] leading-none">{countdown}</span>
                  </div>
                </div>
              )}

              {isCapturing && (
                <div className="absolute top-3 left-0 right-0 flex justify-center gap-2 z-10">
                  {Array.from({ length: totalPhotos }).map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full border border-white ${i < photoProgress ? "bg-[#a3e635]" : "bg-white/40"}`} />
                  ))}
                </div>
              )}

              {/* Filter badge */}
              {filter.id !== "normal" && (
                <div className="absolute bottom-3 left-3 z-10 bg-[#191d12]/80 px-2 py-0.5 pointer-events-none">
                  <span className="font-['Space_Grotesk',sans-serif] font-bold text-[#a3e635] text-[10px] uppercase">{filter.label}</span>
                </div>
              )}

              {canSwitch && (
                <button
                  onClick={() => !isCapturing && setFacing((f) => (f === "user" ? "environment" : "user"))}
                  disabled={isCapturing}
                  aria-label="Switch camera"
                  className="absolute top-2 right-2 z-10 w-11 h-11 bg-white/90 border border-[#191d12] flex items-center justify-center cursor-pointer disabled:opacity-40"
                >
                  <SwitchCamera size={18} className="text-[#191d12]" />
                </button>
              )}

              <div className="absolute left-[12px] top-[12px] w-6 h-6 sm:w-8 sm:h-8 border-l border-t border-white opacity-50 pointer-events-none" />
              <div className="absolute right-[12px] top-[12px] w-6 h-6 sm:w-8 sm:h-8 border-r border-t border-white opacity-50 pointer-events-none" />
              <div className="absolute left-[12px] bottom-[12px] w-6 h-6 sm:w-8 sm:h-8 border-l border-b border-white opacity-50 pointer-events-none" />
              <div className="absolute right-[12px] bottom-[12px] w-6 h-6 sm:w-8 sm:h-8 border-r border-b border-white opacity-50 pointer-events-none" />
            </div>
          </div>

          {/* Filter picker */}
          <div className="w-full max-w-[484px]">
            <p className="font-['Lexend',sans-serif] font-black text-[#191d12] text-xs uppercase mb-2">FILTERS <span className="opacity-60">· VINTAGE · BOOTH EFFECTS · SNAP LENSES →</span></p>
            <div className="flex gap-2 overflow-x-auto pb-2 snap-x -mx-1 px-1" role="radiogroup" aria-label="Camera filters">
              {FILTERS.map((f, idx) => (
                <Fragment key={f.id}>
                  {idx > 0 && (f.group ?? (f.fx ? "vintage" : "")) !== (FILTERS[idx - 1].group ?? (FILTERS[idx - 1].fx ? "vintage" : "")) && (
                    <span className="shrink-0 w-px self-stretch bg-[#191d12]/40 mx-1" aria-hidden />
                  )}
                <button
                  role="radio"
                  aria-checked={filterId === f.id}
                  onClick={() => setFilterId(f.id)}
                  className={`snap-start shrink-0 flex items-center gap-2 px-3 min-h-[44px] border border-[#191d12] cursor-pointer font-['Space_Grotesk',sans-serif] text-xs uppercase transition-colors ${
                    filterId === f.id ? "bg-[#191d12] text-[#a3e635] font-bold drop-shadow-[2px_2px_0px_black]" : "bg-white text-[#191d12] hover:bg-[#f0f4e0]"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full border border-[#191d12] shrink-0" style={{ background: f.swatch }} />
                  {f.label}
                </button>
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Controls & metadata */}
        <div className="flex-1 flex flex-col gap-5 sm:gap-6 items-center md:items-start text-center md:text-left w-full min-w-0">
          <div className="flex flex-col gap-2 items-center md:items-start">
            <div className="font-['Lexend',sans-serif] font-black text-[#191d12] text-4xl sm:text-5xl uppercase tracking-tight leading-none">
              <div>{config.title}</div>
              <div>{config.subtitle}</div>
            </div>
            <div className="flex gap-3 mt-2">
              <div className="bg-[#191d12] px-2 py-1 border border-[#191d12]">
                <span className="font-['Space_Grotesk',sans-serif] font-bold text-[#a3e635] text-xs sm:text-sm uppercase">100% FREE</span>
              </div>
              <div className="bg-white px-2 py-1 border border-[#191d12]">
                <span className="font-['Space_Grotesk',sans-serif] font-bold text-[#191d12] text-xs sm:text-sm uppercase">SNAP NOW</span>
              </div>
            </div>
          </div>

          <p className="font-['Lexend',sans-serif] text-[#191d12] text-sm sm:text-base opacity-80 max-w-xs">{config.description}</p>

          {/* Strip style */}
          <div className="w-full">
            <p className="font-['Lexend',sans-serif] font-black text-[#191d12] text-xs uppercase mb-2">STRIP STYLE</p>
            <div className="flex gap-2 flex-wrap justify-center md:justify-start" role="radiogroup" aria-label="Strip style">
              {STRIP_STYLES.map((st) => (
                <button
                  key={st.id}
                  role="radio"
                  aria-checked={styleId === st.id}
                  onClick={() => setStyleId(st.id)}
                  className={`flex items-center gap-2 px-3 min-h-[44px] border border-[#191d12] cursor-pointer font-['Space_Grotesk',sans-serif] text-xs uppercase transition-colors ${
                    styleId === st.id ? "bg-[#191d12] text-[#a3e635] font-bold drop-shadow-[2px_2px_0px_black]" : "bg-white text-[#191d12] hover:bg-[#f0f4e0]"
                  }`}
                >
                  <span className="w-4 h-4 border border-[#191d12] shrink-0" style={{ background: st.swatch }} />
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Strip colour (Pop style only) */}
          {styleId === "pop" && (
          <div className="w-full">
            <p className="font-['Lexend',sans-serif] font-black text-[#191d12] text-xs uppercase mb-2">STRIP COLOR</p>
            <div className="flex gap-2 justify-center md:justify-start" role="radiogroup" aria-label="Strip color">
              {FRAMES.map((f) => (
                <button
                  key={f.id}
                  role="radio"
                  aria-checked={frameId === f.id}
                  aria-label={f.label}
                  title={f.label}
                  onClick={() => setFrameId(f.id)}
                  className={`w-11 h-11 border-2 cursor-pointer transition-transform ${frameId === f.id ? "border-[#191d12] drop-shadow-[3px_3px_0px_black] -translate-y-0.5" : "border-[#191d12]/40"}`}
                  style={{ background: f.bg }}
                />
              ))}
            </div>
          </div>
          )}

          {/* Snap button */}
          {isCapturing ? (
            <button
              onClick={cancelCapture}
              className="bg-white drop-shadow-[4px_4px_0px_black] rounded-full w-36 h-36 sm:w-48 sm:h-48 flex flex-col items-center justify-center border border-[#191d12] cursor-pointer active:translate-y-[2px]"
            >
              <X size={36} className="text-[#191d12] mb-1" />
              <span className="font-['Lexend',sans-serif] font-black text-[#191d12] text-base sm:text-lg uppercase">CANCEL</span>
            </button>
          ) : (
            <button
              onClick={startCapture}
              disabled={!cameraReady || !!cameraError}
              className="bg-[#fc79bd] drop-shadow-[4px_4px_0px_black] rounded-full w-36 h-36 sm:w-48 sm:h-48 flex flex-col items-center justify-center border border-[#191d12] cursor-pointer md:hover:translate-y-[-2px] active:translate-y-[2px] active:drop-shadow-[2px_2px_0px_black] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera size={36} className="text-[#191d12] mb-1" />
              <span className="font-['Lexend',sans-serif] font-black text-[#191d12] text-base sm:text-lg uppercase">SNAP PHOTO</span>
            </button>
          )}

          {/* Settings row */}
          <div className="flex gap-4 flex-wrap justify-center md:justify-start">
            <button onClick={cycleFlash} disabled={isCapturing} className={frameBtn}>
              <Zap size={15} /> FLASH: {flashMode.toUpperCase()}
            </button>
            <button onClick={cycleTimer} disabled={isCapturing} className={frameBtn}>
              <Timer size={15} /> TIMER: {timerSeconds}S
            </button>
          </div>
        </div>
      </div>

      {/* Mini preview strip during multi-shot */}
      {capturedPhotos.length > 0 && (
        <div className="mt-8 flex gap-3 flex-wrap justify-center">
          {capturedPhotos.map((photo, i) => (
            <div key={i} className="border-2 border-[#191d12] overflow-hidden drop-shadow-[2px_2px_0px_black]">
              <img src={photo} alt={`Shot ${i + 1}`} className="w-24 h-16 object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
