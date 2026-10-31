import type { EffectId } from "./effects";

export interface VintageFx {
  /** 0–1 film grain strength */
  grain: number;
  /** 0–1 edge darkening */
  vignette: number;
  /** optional colour wash laid over the photo */
  tint?: string;
  tintAlpha?: number;
}

export interface CameraFilter {
  id: string;
  label: string;
  /** Present on vintage filters: grain / vignette / tint baked in on top of the CSS filter. */
  fx?: VintageFx;
  /** Pixel effect (warp / colour map / sticker lens) from effects.ts. */
  effect?: EffectId;
  /** Picker section: "vintage" | "booth" | "snap". */
  group?: "vintage" | "booth" | "snap";
  /** CSS filter string — used for the live preview AND baked into the capture. */
  css: string;
  swatch: string;
}

// Only filter functions supported by the pixel fallback below are used here.
export const FILTERS: CameraFilter[] = [
  { id: "normal", label: "Normal", css: "none", swatch: "#ffffff" },
  // ---- Classic vintage photo-booth looks ----
  { id: "booth-bw", label: "Booth B&W", css: "grayscale(1) contrast(1.35) brightness(1.05)", swatch: "#6b6b6b", fx: { grain: 0.14, vignette: 0.45 } },
  { id: "fifties", label: "1950s", css: "sepia(0.9) contrast(1.2) brightness(0.97)", swatch: "#8b6b45", fx: { grain: 0.16, vignette: 0.5 } },
  { id: "seventies", label: "70s Fade", css: "sepia(0.35) saturate(1.4) hue-rotate(-10deg) contrast(0.95) brightness(1.08)", swatch: "#e0a458", fx: { grain: 0.1, vignette: 0.3, tint: "#ff9a3c", tintAlpha: 0.08 } },
  { id: "polaroid", label: "Polaroid", css: "sepia(0.2) contrast(1.1) saturate(1.2) brightness(1.08)", swatch: "#f2d9b0", fx: { grain: 0.07, vignette: 0.25, tint: "#ffe4b5", tintAlpha: 0.1 } },
  { id: "kodak", label: "Warm Film", css: "sepia(0.3) saturate(1.5) contrast(1.1)", swatch: "#d98c2b", fx: { grain: 0.12, vignette: 0.3 } },
  { id: "lomo", label: "Lomo", css: "contrast(1.3) saturate(1.5)", swatch: "#a23b3b", fx: { grain: 0.1, vignette: 0.65 } },
  { id: "cyanotype", label: "Cyanotype", css: "grayscale(1) contrast(1.15) sepia(1) hue-rotate(160deg) saturate(2.2)", swatch: "#2f5d8a", fx: { grain: 0.1, vignette: 0.4 } },
  // ---- Photo Booth effects (warps + colour maps) ----
  { id: "mirror", label: "Mirror", css: "none", swatch: "#c9a27e", effect: "mirror", group: "booth" },
  { id: "kaleido", label: "Kaleidoscope", css: "none", swatch: "#8a5a83", effect: "kaleido", group: "booth" },
  { id: "tunnel", label: "Light Tunnel", css: "none", swatch: "#d9a0a0", effect: "tunnel", group: "booth" },
  { id: "squeeze", label: "Squeeze", css: "none", swatch: "#b08a6a", effect: "squeeze", group: "booth" },
  { id: "twirl", label: "Twirl", css: "none", swatch: "#9a7a8a", effect: "twirl", group: "booth" },
  { id: "stretch", label: "Stretch", css: "none", swatch: "#a8827a", effect: "stretch", group: "booth" },
  { id: "bulge", label: "Bulge", css: "none", swatch: "#d2a679", effect: "bulge", group: "booth" },
  { id: "thermal", label: "Thermal", css: "none", swatch: "#ff4d00", effect: "thermal", group: "booth" },
  { id: "xray", label: "X-Ray", css: "none", swatch: "#2f5f5a", effect: "xray", group: "booth" },
  { id: "comic", label: "Comic Book", css: "none", swatch: "#f2c230", effect: "comic", group: "booth" },
  { id: "pencil", label: "Colored Pencil", css: "none", swatch: "#bfc5a8", effect: "pencil", group: "booth" },
  { id: "popart", label: "Pop Art", css: "none", swatch: "#e83a8a", effect: "popart", group: "booth" },
  // ---- Snap-style lenses ----
  { id: "bighead", label: "Big Head", css: "none", swatch: "#f2b48c", effect: "bighead", group: "snap" },
  { id: "glitch", label: "RGB Glitch", css: "none", swatch: "#00e5ff", effect: "glitch", group: "snap" },
  { id: "neon", label: "Neon Edge", css: "none", swatch: "#b400ff", effect: "neon", group: "snap" },
  { id: "dream", label: "Dreamy Glow", css: "none", swatch: "#ffc3e3", effect: "dream", group: "snap" },
  { id: "hearts", label: "Hearts", css: "none", swatch: "#ff2d6f", effect: "hearts", group: "snap" },
  { id: "sparkles", label: "Sparkles", css: "none", swatch: "#ffd84d", effect: "sparkles", group: "snap" },
  { id: "flowers", label: "Flowers", css: "none", swatch: "#ff9ac8", effect: "flowers", group: "snap" },
  { id: "pop", label: "Pop", css: "saturate(1.7) contrast(1.15)", swatch: "#fc79bd" },
  { id: "bw", label: "B&W", css: "grayscale(1)", swatch: "#9a9a9a" },
  { id: "noir", label: "Noir", css: "grayscale(1) contrast(1.6) brightness(0.9)", swatch: "#191d12" },
  { id: "sepia", label: "Sepia", css: "sepia(1)", swatch: "#a67c52" },
  { id: "vintage", label: "Vintage", css: "sepia(0.55) contrast(1.1) saturate(1.3) hue-rotate(-12deg)", swatch: "#d9a066" },
  { id: "warm", label: "Warm", css: "sepia(0.25) saturate(1.4) brightness(1.05)", swatch: "#ffb347" },
  { id: "cool", label: "Cool", css: "saturate(1.2) hue-rotate(15deg) brightness(1.05)", swatch: "#b9d4ff" },
  { id: "fade", label: "Fade", css: "contrast(0.85) brightness(1.12) saturate(0.8)", swatch: "#e6dccf" },
  { id: "candy", label: "Candy", css: "hue-rotate(-30deg) saturate(1.8) brightness(1.08)", swatch: "#ff8fd0" },
  { id: "acid", label: "Acid", css: "hue-rotate(70deg) saturate(1.6) contrast(1.1)", swatch: "#a3e635" },
  { id: "invert", label: "Invert", css: "invert(1)", swatch: "#c084fc" },
];

let nativeSupport: boolean | null = null;
function supportsCanvasFilter(ctx: CanvasRenderingContext2D): boolean {
  if (nativeSupport !== null) return nativeSupport;
  try {
    ctx.filter = "grayscale(1)";
    nativeSupport = ctx.filter === "grayscale(1)";
    ctx.filter = "none";
  } catch {
    nativeSupport = false;
  }
  return nativeSupport;
}

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

function applyPixels(data: Uint8ClampedArray, css: string) {
  const ops = [...css.matchAll(/([a-z-]+)\(([-\d.]+)(?:deg)?\)/g)].map((m) => ({ fn: m[1], v: parseFloat(m[2]) }));
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];
    for (const { fn, v } of ops) {
      if (fn === "grayscale") {
        const a = 1 - Math.min(1, v);
        const nr = (0.2126 + 0.7874 * a) * r + (0.7152 - 0.7152 * a) * g + (0.0722 - 0.0722 * a) * b;
        const ng = (0.2126 - 0.2126 * a) * r + (0.7152 + 0.2848 * a) * g + (0.0722 - 0.0722 * a) * b;
        const nb = (0.2126 - 0.2126 * a) * r + (0.7152 - 0.7152 * a) * g + (0.0722 + 0.9278 * a) * b;
        r = nr; g = ng; b = nb;
      } else if (fn === "sepia") {
        const a = 1 - Math.min(1, v);
        const nr = (0.393 + 0.607 * a) * r + (0.769 - 0.769 * a) * g + (0.189 - 0.189 * a) * b;
        const ng = (0.349 - 0.349 * a) * r + (0.686 + 0.314 * a) * g + (0.168 - 0.168 * a) * b;
        const nb = (0.272 - 0.272 * a) * r + (0.534 - 0.534 * a) * g + (0.131 + 0.869 * a) * b;
        r = nr; g = ng; b = nb;
      } else if (fn === "saturate") {
        const nr = (0.213 + 0.787 * v) * r + (0.715 - 0.715 * v) * g + (0.072 - 0.072 * v) * b;
        const ng = (0.213 - 0.213 * v) * r + (0.715 + 0.285 * v) * g + (0.072 - 0.072 * v) * b;
        const nb = (0.213 - 0.213 * v) * r + (0.715 - 0.715 * v) * g + (0.072 + 0.928 * v) * b;
        r = nr; g = ng; b = nb;
      } else if (fn === "hue-rotate") {
        const rad = (v * Math.PI) / 180, c = Math.cos(rad), s = Math.sin(rad);
        const nr = (0.213 + c * 0.787 - s * 0.213) * r + (0.715 - c * 0.715 - s * 0.715) * g + (0.072 - c * 0.072 + s * 0.928) * b;
        const ng = (0.213 - c * 0.213 + s * 0.143) * r + (0.715 + c * 0.285 + s * 0.14) * g + (0.072 - c * 0.072 - s * 0.283) * b;
        const nb = (0.213 - c * 0.213 - s * 0.787) * r + (0.715 - c * 0.715 + s * 0.715) * g + (0.072 + c * 0.928 + s * 0.072) * b;
        r = nr; g = ng; b = nb;
      } else if (fn === "contrast") {
        r = (r - 128) * v + 128; g = (g - 128) * v + 128; b = (b - 128) * v + 128;
      } else if (fn === "brightness") {
        r *= v; g *= v; b *= v;
      } else if (fn === "invert") {
        const a = Math.min(1, v);
        r = r * (1 - a) + (255 - r) * a; g = g * (1 - a) + (255 - g) * a; b = b * (1 - a) + (255 - b) * a;
      }
      r = clamp(r); g = clamp(g); b = clamp(b);
    }
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
}

/**
 * Draw `source` into `ctx` with the given CSS filter baked in.
 * Uses native canvas filters where available, otherwise a pixel fallback (Safari).
 */
export function drawFiltered(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  css: string,
  sx: number, sy: number, sw: number, sh: number,
  dx: number, dy: number, dw: number, dh: number,
) {
  if (css === "none") {
    ctx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
    return;
  }
  if (supportsCanvasFilter(ctx)) {
    ctx.filter = css;
    ctx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.filter = "none";
    return;
  }
  ctx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
  const img = ctx.getImageData(dx, dy, dw, dh);
  applyPixels(img.data, css);
  ctx.putImageData(img, dx, dy);
}

/** Pre-rendered noise tile for the live viewfinder overlay (CSS background). */
export const GRAIN_URL =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/**
 * Bake grain + vignette (+ optional tint) over the whole canvas.
 * Call after the photo has been drawn, with the transform reset.
 */
export function applyVintage(ctx: CanvasRenderingContext2D, w: number, h: number, fx: VintageFx) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (fx.tint) {
    ctx.globalAlpha = fx.tintAlpha ?? 0.1;
    ctx.fillStyle = fx.tint;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }

  if (fx.grain > 0) {
    const noise = document.createElement("canvas");
    noise.width = w;
    noise.height = h;
    const nctx = noise.getContext("2d")!;
    const img = nctx.createImageData(w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (Math.random() - 0.5) * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    nctx.putImageData(img, 0, 0);
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = Math.min(1, fx.grain * 3);
    ctx.drawImage(noise, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  if (fx.vignette > 0) {
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${fx.vignette})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}
