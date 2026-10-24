export interface CameraFilter {
  id: string;
  label: string;
  /** CSS filter string — used for the live preview AND baked into the capture. */
  css: string;
  swatch: string;
}

// Only filter functions supported by the pixel fallback below are used here.
export const FILTERS: CameraFilter[] = [
  { id: "normal", label: "Normal", css: "none", swatch: "#ffffff" },
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
