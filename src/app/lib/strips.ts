import { applyVintage } from "./filters";

export const PHOTO_W = 600;
export const PHOTO_H = 450; // 4:3 — same ratio as the viewfinder

export type CaptureModeLike = "solo" | "couple" | "family";

/** The original neon look keeps using the "Strip color" picker. The rest are vintage papers. */
export const STRIP_STYLES = [
  { id: "pop", label: "Pop", swatch: "#a3e635" },
  { id: "booth", label: "Booth", swatch: "#f1e6c8" },
  { id: "bw", label: "Classic B&W", swatch: "#ffffff" },
  { id: "film", label: "Film Reel", swatch: "#15110e" },
] as const;

export const FRAMES = [
  { id: "white", label: "White", bg: "#ffffff", fg: "#191d12" },
  { id: "lime", label: "Lime", bg: "#a3e635", fg: "#191d12" },
  { id: "pink", label: "Pink", bg: "#fc79bd", fg: "#191d12" },
  { id: "sky", label: "Sky", bg: "#b9d4ff", fg: "#191d12" },
  { id: "ink", label: "Ink", bg: "#191d12", fg: "#a3e635" },
];

interface VintageSpec {
  bg: string;
  fg: string;
  header: string;
  serif: boolean;
  side: number; // extra margin on left/right (film sprockets live here)
  sprockets: boolean;
  doubleBorder: boolean;
  photoBorder: number;
  paper: { grain: number; vignette: number };
}

const VINTAGE: Record<string, VintageSpec> = {
  booth: {
    bg: "#f1e6c8", fg: "#3b2f1e", header: "PHOTO BOOTH", serif: true,
    side: 0, sprockets: false, doubleBorder: false, photoBorder: 3,
    paper: { grain: 0.1, vignette: 0.22 },
  },
  bw: {
    bg: "#fbfbf8", fg: "#111111", header: "★ PHOTO BOOTH ★", serif: true,
    side: 0, sprockets: false, doubleBorder: true, photoBorder: 2,
    paper: { grain: 0.08, vignette: 0.12 },
  },
  film: {
    bg: "#15110e", fg: "#e8b04a", header: "", serif: false,
    side: 72, sprockets: true, doubleBorder: false, photoBorder: 0,
    paper: { grain: 0.1, vignette: 0.2 },
  },
};

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const MONO = "'Courier New', Courier, monospace";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function stamp(ts: number) {
  return new Date(ts)
    .toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    .toUpperCase()
    .replace(",", "");
}

export async function assembleStrip(
  photos: string[],
  mode: CaptureModeLike,
  frameId: string,
  styleId: string = "pop",
  timestamp: number = Date.now(),
): Promise<string> {
  const spec = VINTAGE[styleId];
  const cols = mode === "family" ? 2 : 1;
  const rows = mode === "family" ? 2 : photos.length;
  const imgs = await Promise.all(photos.map(loadImage));

  // ---------- Original "Pop" strip (unchanged look) ----------
  if (!spec) {
    const frame = FRAMES.find((f) => f.id === frameId) ?? FRAMES[0];
    const PADDING = 24;
    const BRANDING_H = 80;
    const canvasW = PHOTO_W * cols + PADDING * (cols + 1);
    const canvasH = PHOTO_H * rows + PADDING * (rows + 1) + BRANDING_H;
    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = frame.bg;
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.strokeStyle = "#191d12";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvasW - 4, canvasH - 4);

    imgs.forEach((img, i) => {
      const x = PADDING + (mode === "family" ? (i % 2) * (PHOTO_W + PADDING) : 0);
      const y = PADDING + (mode === "family" ? Math.floor(i / 2) : i) * (PHOTO_H + PADDING);
      ctx.drawImage(img, x, y, PHOTO_W, PHOTO_H);
      ctx.strokeStyle = "#191d12";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, PHOTO_W, PHOTO_H);
    });

    const brandY = canvasH - BRANDING_H;
    ctx.fillStyle = frame.fg;
    ctx.fillRect(PADDING, brandY, canvasW - PADDING * 2, 2);
    ctx.font = "bold 26px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("POP FRAME MEMORIES", canvasW / 2, brandY + 48);
    return canvas.toDataURL("image/jpeg", 0.92);
  }

  // ---------- Vintage strips ----------
  const PADDING = 28;
  const HEADER_H = spec.header ? 74 : 20;
  const FOOTER_H = 84;
  const canvasW = PHOTO_W * cols + PADDING * (cols + 1) + spec.side * 2;
  const canvasH = HEADER_H + PHOTO_H * rows + PADDING * (rows + 1) + FOOTER_H;

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = spec.bg;
  ctx.fillRect(0, 0, canvasW, canvasH);

  if (spec.doubleBorder) {
    ctx.strokeStyle = spec.fg;
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvasW - 20, canvasH - 20);
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, canvasW - 40, canvasH - 40);
  }

  // Header
  ctx.fillStyle = spec.fg;
  ctx.textAlign = "center";
  if (spec.header) {
    ctx.font = `bold 34px ${SERIF}`;
    ctx.fillText(spec.header, canvasW / 2, HEADER_H - 22);
  }

  // Photos
  imgs.forEach((img, i) => {
    const x = spec.side + PADDING + (mode === "family" ? (i % 2) * (PHOTO_W + PADDING) : 0);
    const y = HEADER_H + PADDING + (mode === "family" ? Math.floor(i / 2) : i) * (PHOTO_H + PADDING);
    ctx.drawImage(img, x, y, PHOTO_W, PHOTO_H);
    if (spec.photoBorder) {
      ctx.strokeStyle = spec.fg;
      ctx.lineWidth = spec.photoBorder;
      ctx.strokeRect(x, y, PHOTO_W, PHOTO_H);
    }
    if (spec.sprockets) {
      // Film frame number, like the edge print on 35mm stock
      ctx.fillStyle = spec.fg;
      ctx.font = `bold 16px ${MONO}`;
      ctx.textAlign = "left";
      ctx.fillText(`▶ ${i + 1}A`, x, y - 8);
    }
  });

  // Sprocket holes
  if (spec.sprockets) {
    ctx.fillStyle = "#f1e6c8";
    const holeW = 28, holeH = 40, gap = 64;
    for (let y = 18; y < canvasH - holeH; y += gap) {
      for (const x of [(spec.side - holeW) / 2, canvasW - spec.side + (spec.side - holeW) / 2]) {
        ctx.beginPath();
        ctx.roundRect(x, y, holeW, holeH, 6);
        ctx.fill();
      }
    }
  }

  // Footer: date stamp + brand
  const footerY = canvasH - FOOTER_H;
  ctx.fillStyle = spec.fg;
  ctx.textAlign = "center";
  if (!spec.sprockets) ctx.fillRect(PADDING + spec.side, footerY + 6, canvasW - (PADDING + spec.side) * 2, 2);
  ctx.font = `bold 24px ${MONO}`;
  ctx.fillText(spec.sprockets ? `POP FRAME 400  ·  ${stamp(timestamp)}` : stamp(timestamp), canvasW / 2, footerY + 50);
  if (!spec.sprockets) {
    ctx.font = `italic 16px ${SERIF}`;
    ctx.fillText("pop frame memories", canvasW / 2, footerY + 72);
  }

  // Aged paper: grain + soft edge vignette
  applyVintage(ctx, canvasW, canvasH, spec.paper);

  return canvas.toDataURL("image/jpeg", 0.92);
}

const STORY_BG: Record<string, string> = {
  pop: "#a3e635",
  booth: "#2b2118",
  bw: "#141414",
  film: "#0d0b09",
};

/** 1080×1920 (9:16) export for Instagram / Facebook / TikTok stories. */
export async function makeStory(stripDataUrl: string, styleId: string = "pop"): Promise<string> {
  const W = 1080, H = 1920;
  const strip = await loadImage(stripDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = STORY_BG[styleId] ?? STORY_BG.pop;
  ctx.fillRect(0, 0, W, H);

  const maxH = 1560, maxW = 900;
  const scale = Math.min(maxH / strip.height, maxW / strip.width);
  const w = strip.width * scale, h = strip.height * scale;

  ctx.save();
  ctx.translate(W / 2, 100 + h / 2);
  ctx.rotate((-2 * Math.PI) / 180);
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  ctx.drawImage(strip, -w / 2, -h / 2, w, h);
  ctx.restore();

  const dark = styleId === "pop";
  ctx.fillStyle = dark ? "#191d12" : "#f1e6c8";
  ctx.textAlign = "center";
  ctx.font = "bold 44px 'Lexend', sans-serif";
  ctx.fillText("POP FRAME", W / 2, H - 90);

  return canvas.toDataURL("image/jpeg", 0.92);
}
