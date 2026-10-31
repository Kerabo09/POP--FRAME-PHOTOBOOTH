/**
 * Pixel-level camera effects (Apple Photo Booth style warps + Snapchat-style lenses).
 * Every effect works on a canvas that already holds the (cropped, mirrored) camera frame,
 * so the exact same code drives the live preview AND the saved photo.
 */

export type EffectId =
  | "mirror" | "kaleido" | "tunnel" | "squeeze" | "twirl" | "stretch" | "bulge"
  | "thermal" | "xray" | "comic" | "pencil" | "popart"
  | "bighead" | "glitch" | "neon" | "dream" | "hearts" | "sparkles" | "flowers";

type Ctx = CanvasRenderingContext2D;
type Mapper = (x: number, y: number, out: number[]) => void;

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

/** Crop the video to the canvas aspect ratio (cover) and optionally mirror it. */
export function drawVideoCover(ctx: Ctx, video: HTMLVideoElement, w: number, h: number, mirrored: boolean) {
  const vw = video.videoWidth, vh = video.videoHeight;
  const target = w / h;
  let sw = vw, sh = vh;
  if (vw / vh > target) sw = vh * target; else sh = vw / target;
  const sx = (vw - sw) / 2, sy = (vh - sh) / 2;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (mirrored) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
  ctx.restore();
}

// ---------- helpers ----------

function sample(s: Uint8ClampedArray, w: number, h: number, x: number, y: number, d: Uint8ClampedArray, di: number) {
  if (x < 0) x = 0; else if (x > w - 1) x = w - 1;
  if (y < 0) y = 0; else if (y > h - 1) y = h - 1;
  const x0 = x | 0, y0 = y | 0;
  const x1 = x0 + 1 < w ? x0 + 1 : x0, y1 = y0 + 1 < h ? y0 + 1 : y0;
  const fx = x - x0, fy = y - y0;
  const i00 = (y0 * w + x0) * 4, i10 = (y0 * w + x1) * 4;
  const i01 = (y1 * w + x0) * 4, i11 = (y1 * w + x1) * 4;
  for (let c = 0; c < 3; c++) {
    d[di + c] = (s[i00 + c] * (1 - fx) + s[i10 + c] * fx) * (1 - fy) + (s[i01 + c] * (1 - fx) + s[i11 + c] * fx) * fy;
  }
  d[di + 3] = 255;
}

function warp(ctx: Ctx, w: number, h: number, map: Mapper) {
  const src = ctx.getImageData(0, 0, w, h);
  const out = ctx.createImageData(w, h);
  const o = [0, 0];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      map(x, y, o);
      sample(src.data, w, h, o[0], o[1], out.data, (y * w + x) * 4);
    }
  }
  ctx.putImageData(out, 0, 0);
}

/** Radial lens: sample radius = R * curve(r / R). curve(t) < t magnifies, > t shrinks. */
function radial(w: number, h: number, R: number, curve: (t: number) => number, xs = 1): Mapper {
  const cx = w / 2, cy = h / 2;
  return (x, y, o) => {
    const dx = x - cx, dy = y - cy;
    const r = Math.hypot(dx * xs, dy);
    if (r >= R || r < 0.001) { o[0] = x; o[1] = y; return; }
    const k = (R * curve(r / R)) / r;
    o[0] = cx + dx * k;
    o[1] = cy + dy * k;
  };
}

function lumArray(d: Uint8ClampedArray, w: number, h: number) {
  const L = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) L[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
  return L;
}

function sobel(L: Float32Array, w: number, h: number) {
  const E = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const a = L[(y - 1) * w + x - 1], b = L[(y - 1) * w + x], c = L[(y - 1) * w + x + 1];
      const d = L[y * w + x - 1], f = L[y * w + x + 1];
      const g = L[(y + 1) * w + x - 1], hh = L[(y + 1) * w + x], i = L[(y + 1) * w + x + 1];
      const gx = -a - 2 * d - g + c + 2 * f + i;
      const gy = -a - 2 * b - c + g + 2 * hh + i;
      E[y * w + x] = Math.hypot(gx, gy);
    }
  }
  return E;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- colour effects ----------

const THERMAL: number[][] = (() => {
  const stops: [number, number[]][] = [
    [0, [20, 0, 120]], [0.25, [0, 90, 255]], [0.5, [0, 220, 90]],
    [0.75, [255, 235, 0]], [1, [255, 40, 0]],
  ];
  const lut: number[][] = [];
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let k = 0;
    while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const [t0, c0] = stops[k], [t1, c1] = stops[k + 1];
    const f = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
    lut.push([0, 1, 2].map((c) => c0[c] + (c1[c] - c0[c]) * f));
  }
  return lut;
})();

function thermal(ctx: Ctx, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    let l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    l = Math.min(1, Math.max(0, (l - 0.08) * 1.35));
    const c = THERMAL[(l * 255) | 0];
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
  }
  ctx.putImageData(img, 0, 0);
}

function xray(ctx: Ctx, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    const v = Math.min(1, Math.max(0, (1 - l - 0.5) * 1.7 + 0.55)) * 255;
    d[i] = v * 0.72; d[i + 1] = v; d[i + 2] = v * 0.93;
  }
  ctx.putImageData(img, 0, 0);
}

function comic(ctx: Ctx, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h), d = img.data;
  const E = sobel(lumArray(d, w, h), w, h);
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
    for (let c = 0; c < 3; c++) {
      const v = clamp(l + (d[i + c] - l) * 1.6); // saturate
      d[i + c] = Math.round(v / 64) * 64 > 255 ? 255 : Math.round(v / 64) * 64; // posterize
    }
    if (E[p] > 0.55) { d[i] = d[i + 1] = d[i + 2] = 15; }
  }
  ctx.putImageData(img, 0, 0);
}

function pencil(ctx: Ctx, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h), d = img.data;
  const E = sobel(lumArray(d, w, h), w, h);
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
    const line = 1 - Math.min(1, E[p] * 1.8);
    for (let c = 0; c < 3; c++) {
      const soft = 255 * 0.62 + (l + (d[i + c] - l) * 0.55) * 0.38;
      d[i + c] = clamp(soft * (0.15 + 0.85 * line));
    }
  }
  ctx.putImageData(img, 0, 0);
}

const POP_PALETTES: number[][][] = [
  [[25, 20, 60], [255, 60, 40], [255, 225, 60]],
  [[20, 45, 25], [60, 190, 70], [255, 170, 205]],
  [[15, 20, 70], [235, 60, 150], [90, 205, 235]],
  [[20, 20, 110], [40, 90, 255], [255, 120, 190]],
];

function popart(ctx: Ctx, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h), s = img.data;
  const out = ctx.createImageData(w, h), d = out.data;
  const hw = w >> 1, hh = h >> 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const q = (x >= hw ? 1 : 0) + (y >= hh ? 2 : 0);
      const sx = Math.min(w - 1, (x % hw) * 2), sy = Math.min(h - 1, (y % hh) * 2);
      const si = (sy * w + sx) * 4;
      const l = (0.299 * s[si] + 0.587 * s[si + 1] + 0.114 * s[si + 2]) / 255;
      const pal = POP_PALETTES[q][l < 0.33 ? 0 : l < 0.62 ? 1 : 2];
      const di = (y * w + x) * 4;
      d[di] = pal[0]; d[di + 1] = pal[1]; d[di + 2] = pal[2]; d[di + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
}

// ---------- Snap-style lenses ----------

function glitch(ctx: Ctx, w: number, h: number, t: number) {
  const src = ctx.getImageData(0, 0, w, h), s = src.data;
  const out = ctx.createImageData(w, h), d = out.data;
  const bandH = Math.max(6, (h / 24) | 0);
  const split = Math.max(2, Math.round(w * 0.012));
  const tick = Math.floor(t * 8);
  for (let y = 0; y < h; y++) {
    const band = (y / bandH) | 0;
    const hsh = Math.sin(band * 91.7 + tick * 13.3);
    const shift = Math.abs(hsh) > 0.82 ? Math.round(hsh * w * 0.07) : 0;
    for (let x = 0; x < w; x++) {
      const xr = Math.min(w - 1, Math.max(0, x + shift + split));
      const xg = Math.min(w - 1, Math.max(0, x + shift));
      const xb = Math.min(w - 1, Math.max(0, x + shift - split));
      const di = (y * w + x) * 4;
      d[di] = s[(y * w + xr) * 4];
      d[di + 1] = s[(y * w + xg) * 4 + 1];
      d[di + 2] = s[(y * w + xb) * 4 + 2];
      d[di + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
}

function neon(ctx: Ctx, w: number, h: number, t: number) {
  const img = ctx.getImageData(0, 0, w, h), d = img.data;
  const E = sobel(lumArray(d, w, h), w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x, i = p * 4;
      const e = Math.min(1, E[p] * 2.2);
      const hue = ((x / w) * 300 + y * 0.4 + t * 60) % 360;
      const [r, g, b] = hsl(hue, 1, 0.58);
      d[i] = clamp(d[i] * 0.12 + r * e);
      d[i + 1] = clamp(d[i + 1] * 0.12 + g * e);
      d[i + 2] = clamp(d[i + 2] * 0.12 + b * e);
    }
  }
  ctx.putImageData(img, 0, 0);
}

function hsl(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return [f(0), f(8), f(4)];
}

function dream(ctx: Ctx, w: number, h: number) {
  const tmp = document.createElement("canvas");
  tmp.width = Math.max(8, w >> 3);
  tmp.height = Math.max(8, h >> 3);
  const tctx = tmp.getContext("2d")!;
  tctx.imageSmoothingEnabled = true;
  tctx.drawImage(ctx.canvas, 0, 0, tmp.width, tmp.height);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.65;
  ctx.drawImage(tmp, 0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = "#ff9ed2";
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

function stickers(ctx: Ctx, w: number, h: number, emojis: string[], t: number) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const rnd = mulberry32(7);
  for (let i = 0; i < 16; i++) {
    const zone = rnd();
    let x: number, y: number;
    if (zone < 0.34) { x = rnd() * 0.22 * w; y = rnd() * h; }
    else if (zone < 0.68) { x = w - rnd() * 0.22 * w; y = rnd() * h; }
    else { x = rnd() * w; y = rnd() * 0.2 * h; }
    const size = (0.07 + rnd() * 0.07) * w;
    const bob = Math.sin(t * 2 + rnd() * 6.28) * size * 0.15;
    ctx.font = `${size}px ${EMOJI_FONT}`;
    ctx.fillText(emojis[i % emojis.length], x, y + bob);
  }
  ctx.restore();
}

// ---------- public entry ----------

/** Apply an effect in place. `t` is seconds (drives the animated bits in the live preview). */
export function applyEffect(id: EffectId, ctx: Ctx, w: number, h: number, t = 0) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const cx = w / 2, cy = h / 2, base = Math.min(w, h) / 2;

  switch (id) {
    case "mirror":
      warp(ctx, w, h, (x, y, o) => { o[0] = x; o[1] = y > cy ? 2 * cy - y : y; });
      break;
    case "kaleido": {
      const seg = (Math.PI * 2) / 6;
      warp(ctx, w, h, (x, y, o) => {
        const dx = x - cx, dy = y - cy;
        const r = Math.hypot(dx, dy) * 0.55;
        let a = Math.atan2(dy, dx) + t * 0.15;
        a = ((a % seg) + seg) % seg;
        if (a > seg / 2) a = seg - a;
        a -= Math.PI / 2;
        o[0] = cx + r * Math.cos(a);
        o[1] = cy + r * Math.sin(a);
      });
      break;
    }
    case "tunnel": {
      const r0 = base * 0.58;
      warp(ctx, w, h, (x, y, o) => {
        const dx = x - cx, dy = y - cy;
        const r = Math.hypot(dx, dy);
        if (r <= r0 || r < 0.001) { o[0] = x; o[1] = y; return; }
        const k = (r0 + (r - r0) * 0.1) / r;
        o[0] = cx + dx * k; o[1] = cy + dy * k;
      });
      break;
    }
    case "squeeze":
      warp(ctx, w, h, radial(w, h, base * 0.95, (t2) => Math.pow(t2, 0.7)));
      break;
    case "bulge":
      warp(ctx, w, h, radial(w, h, base * 0.95, (t2) => Math.pow(t2, 1.7)));
      break;
    case "bighead":
      warp(ctx, w, h, radial(w, h, base * 0.8, (t2) => Math.pow(t2, 2.2)));
      break;
    case "stretch":
      warp(ctx, w, h, radial(w, h, base * 0.95, (t2) => Math.pow(t2, 1.9), 0.55));
      break;
    case "twirl":
      warp(ctx, w, h, (x, y, o) => {
        const dx = x - cx, dy = y - cy;
        const r = Math.hypot(dx, dy);
        if (r >= base) { o[0] = x; o[1] = y; return; }
        const tt = 1 - r / base;
        const a = 3.8 * tt * tt;
        const c = Math.cos(a), s = Math.sin(a);
        o[0] = cx + dx * c - dy * s;
        o[1] = cy + dx * s + dy * c;
      });
      break;
    case "thermal": thermal(ctx, w, h); break;
    case "xray": xray(ctx, w, h); break;
    case "comic": comic(ctx, w, h); break;
    case "pencil": pencil(ctx, w, h); break;
    case "popart": popart(ctx, w, h); break;
    case "glitch": glitch(ctx, w, h, t); break;
    case "neon": neon(ctx, w, h, t); break;
    case "dream": dream(ctx, w, h); break;
    case "hearts": stickers(ctx, w, h, ["❤️", "💖", "💕", "💗"], t); break;
    case "sparkles": stickers(ctx, w, h, ["✨", "⭐", "🌟", "💫"], t); break;
    case "flowers": stickers(ctx, w, h, ["🌸", "🌼", "🌷", "🌺"], t); break;
  }
  ctx.restore();
}
