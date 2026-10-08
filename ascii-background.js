/* ==========================================================================
   Ambient Animated ASCII Art Background Engine
   Mashuke Alam Jim Portfolio
   Curated from ascii.rest by Shubham (@bas3line, MIT Licensed)
   Zero external dependencies, self-contained, operates seamlessly on file://,
   http://, and production hosting with high-performance canvas glyph cache.
   ========================================================================== */

(function () {
  'use strict';

  const SCENES = {};

  // -------------------------------------------------------------
  // Scene: aurora-fjord
  // -------------------------------------------------------------
  SCENES["aurora-fjord"] = (function () {
const meta = {
    name: "aurora fjord",
    category: "scenes",
    note: "aurora curtains rippling over a still fjord, a cabin lit on the shore",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 15,
    ground: "#05080f",
    palette: [
        "#0b1322", "#101b30", "#16243f", "#1e3050", "#2a3f63",
        "#0e3a33", "#11573f", "#167a4c", "#22a05c", "#3ccb73", "#7cf0a0", "#c8ffdc",
        "#0f5f5c", "#16877f", "#2cb5a6", "#7fe6d6",
        "#2a1f52", "#432b78", "#6a3c9f", "#9558c6", "#c48ae4", "#363a72", "#4f5596", "#1b4f63",
        "#1a2236", "#283350", "#3b4a6e", "#566a92", "#7d91b8", "#a9bad9", "#d6e0f2", "#9fc9cf",
        "#0f1a1c", "#173128", "#24493a",
        "#4a1517", "#7c2420", "#b23a2a", "#d65aa8",
        "#ffd27c", "#ffb04a", "#fff2c4",
        "#eef3ff",
    ],
};
const W = 200, H = 100;
const WL = 62; // the waterline
const DOTS = " ·•●";
const COVER = [0, 0.3, 0.6, 1];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
const AIR = 0, NEAR = 1, FAR = 2, SHORE = 3, WALL = 4, ROOF = 5, PANE = 6, TREE = 7, DOOR = 8;
const CAB = [142, 161]; // the cabin's walls, x from and to
const PANES = [[145, 148], [156, 159]];
const DOOR_X = [150, 152];
const LAMPS = [[147, 1], [158, 0.8]]; // pane centres and their strength
function hash(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, octaves) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
        s += amp * noise(x * f, y * f);
        n += amp;
        amp *= 0.5;
        f *= 2;
    }
    return s / n;
}
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => {
    const k = clamp((v - a) / (b - a));
    return k * k * (3 - 2 * k);
};
const mix = (a, b, k) => a + (b - a) * k;
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
// Ranges as tent peaks [x, height, slope], roughened.
const LEFT = [[25, 38, 1.3], [6, 29, 0.9], [50, 25, 1.0], [72, 13, 0.6]];
const RIGHT = [[172, 30, 1.15], [194, 24, 0.85], [151, 16, 1.0], [212, 22, 0.6]];
const DISTANT = [[100, 10, 0.5], [119, 12, 0.55], [86, 7, 0.45], [134, 8, 0.5]];
function range(x, peaks, seed, rough) {
    let m = -99, px = 0;
    for (const [cx, h, s] of peaks) {
        const v = h - Math.abs(x - cx) * s;
        if (v > m)
            (m = v), (px = cx);
    }
    const j = rough * (fbm(x * 0.09, seed, 3) - 0.5) + rough * 0.45 * (noise(x * 0.45, seed + 5) - 0.5);
    return [m + j * Math.min(1, Math.max(0, m) / 6), px];
}
function auroraFjord() {
    const P = meta.palette.map(hex);
    const N = W * H;
    const out = new Array(N);
    const lut = new Uint8Array(32768).fill(255);
    const nearest = (r, g, b) => {
        const k = (Math.min(31, (r * 31.99) | 0) << 10) | (Math.min(31, (g * 31.99) | 0) << 5) | Math.min(31, (b * 31.99) | 0);
        if (lut[k] !== 255)
            return lut[k];
        let best = 0, bd = 1e9;
        for (let i = 0; i < P.length; i++) {
            const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
            const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
            if (d < bd)
                (bd = d), (best = i);
        }
        return (lut[k] = best);
    };
    // --- the land, built once ------------------------------------------------
    const mat = new Uint8Array(N);
    const sr = new Float32Array(N), sg = new Float32Array(N), sb = new Float32Array(N);
    const rec = new Float32Array(N); // how much aurora light a cell picks up
    const rim = new Float32Array(N); // aurora light caught on ridgelines and treetops
    const nearTop = new Float32Array(W), farTop = new Float32Array(W), peakX = new Float32Array(W);
    for (let x = 0; x < W; x++) {
        const [hl, pl] = range(x + 0.5, LEFT, 3.1, 4);
        const [hr, pr] = range(x + 0.5, RIGHT, 7.7, 4);
        const [hd] = range(x + 0.5, DISTANT, 11.3, 2.2);
        nearTop[x] = WL - Math.max(hl, hr, 0);
        peakX[x] = hl > hr ? pl : pr;
        farTop[x] = WL - Math.max(hd, 0);
    }
    const shoreTop = (x) => WL - 2.2 * smooth(134, 140, x) * smooth(178, 168, x) - 0.6 * noise(x * 0.3, 2);
    const cabBase = WL - 2.2;
    for (let r = 0; r < WL; r++) {
        for (let x = 0; x < W; x++) {
            const k = r * W + x;
            const y = r + 0.5;
            if (y >= nearTop[x]) {
                mat[k] = NEAR;
                const px = peakX[x];
                const side = x + 0.5 - px;
                const depth = y - nearTop[x];
                const height = WL - nearTop[x];
                // Faces turned toward the fjord catch the aurora; the ridge between
                // the faces wanders as it comes down from the peak.
                const ridge = px + (depth + 1) * 0.6 * (noise(y * 0.1, px) - 0.5);
                const inward = px < 100 ? 1 : -1;
                const face = smooth(-4, 4, (x + 0.5 - ridge) * inward);
                // ribs and couloirs running down the fall line, each with a lit side
                const u = x + depth * 0.45 * Math.sign(side || 1);
                const rib = (v) => fbm(v * 0.13, px * 0.37, 3);
                const grad = (rib(u + 1) - rib(u - 1)) * 7 * inward;
                // the snow reaches further down the ribs than the couloirs, in fingers
                const reach = 3 + height * (0.62 + 0.42 * rib(u + 40));
                const streak = smooth(0.56, 0.64, fbm(u * 0.32, y * 0.035 + px, 3)) * smooth(1, 5, depth);
                // a stand of spruce climbing the slope behind the cabin, jagged on top
                const cx = x + 0.5 - 152;
                const wood = WL - 18.5 + 9 * (cx / 19) ** 2 + 1.5 * (noise(x * 0.7, 9) - 0.5) - 2.6 * hash(x, 77) * ((x & 1) ? 1 : 0.3);
                const snow = smooth(reach + 1.6, reach - 1.6, depth) * (1 - smooth(WL - 3, WL - 0.5, y)) * (1 - 0.5 * streak);
                const lit = clamp(0.35 + 0.55 * face + grad * 0.5);
                // blue-grey rock below the snow, a little lighter on the lit faces
                const rv = 0.75 + 0.5 * fbm(x * 0.4, y * 0.4, 2);
                const rr = (0.05 + 0.03 * lit) * rv, rg = (0.065 + 0.035 * lit) * rv, rb = (0.11 + 0.05 * lit) * rv;
                const s = 0.34 + 0.66 * Math.pow(lit, 1.5);
                sr[k] = mix(rr, 0.62 * s + 0.04, snow);
                sg[k] = mix(rg, 0.7 * s + 0.05, snow);
                sb[k] = mix(rb, 0.86 * s + 0.09, snow);
                rec[k] = snow * (0.25 + 0.75 * lit) + 0.06;
                rim[k] = smooth(2.2, 0.3, depth) * 0.5;
                if (y > wood && cx > -14 - 2 * hash(r, 3) && cx < 13 + 2 * hash(r, 4)) {
                    mat[k] = TREE;
                    const h = hash(x * 13 + r, 5);
                    sr[k] = 0.02 + 0.03 * h, sg[k] = 0.045 + 0.045 * h, sb[k] = 0.06 + 0.04 * h;
                    rec[k] = 0.05;
                    rim[k] = smooth(wood + 1.6, wood + 0.2, y) * (0.7 + 0.3 * h);
                }
            }
            else if (y >= farTop[x]) {
                mat[k] = FAR;
                const depth = y - farTop[x];
                const snow = smooth(0.5, 0.62, fbm(x * 0.18, y * 0.25, 3) * 0.6 + (1 - depth / 7) * 0.55);
                const lit = 0.5 + 0.3 * (noise(x * 0.25, y * 0.1) - 0.5);
                sr[k] = mix(0.075, 0.22 * lit + 0.12, snow);
                sg[k] = mix(0.1, 0.27 * lit + 0.15, snow);
                sb[k] = mix(0.17, 0.36 * lit + 0.24, snow);
                rec[k] = 0.2 + 0.3 * snow;
            }
            // the shelf the cabin stands on, snowed over
            if (x > 132 && x < 180 && y >= shoreTop(x)) {
                mat[k] = SHORE;
                const f = 0.6 + 0.3 * fbm(x * 0.3, y * 0.5, 2);
                sr[k] = 0.26 * f, sg[k] = 0.3 * f, sb[k] = 0.42 * f;
                rec[k] = 0.4;
                rim[k] = 0;
            }
        }
    }
    // a spruce treeline along the foot of both ranges, open where the fjord runs in
    const spruce = (tx, th, tw, tb, guard) => {
        for (let r = Math.max(0, Math.floor(tb - th)); r < WL; r++) {
            const y = r + 0.5, dy = y - (tb - th);
            if (dy < 0 || y >= tb + 0.5)
                continue;
            const tier = (dy + th * 0.3) / 1.8;
            const w = (dy / th) * tw * (0.7 + 0.45 * (tier - Math.floor(tier))) + 0.35;
            for (let x = Math.max(0, Math.floor(tx - tw - 1)); x <= Math.min(W - 1, tx + tw + 1); x++) {
                const k = r * W + x;
                const ex = x + 0.5 - tx;
                if (Math.abs(ex) > w || (guard && guard(k)))
                    continue;
                mat[k] = TREE;
                const h = hash(x * 13 + r, 5);
                const s = ex < 0 ? 0.7 : 0.3; // the aurora is up and left
                sr[k] = 0.02 + 0.03 * s * h, sg[k] = 0.04 + 0.05 * s, sb[k] = 0.055 + 0.045 * s;
                rec[k] = 0.05;
                rim[k] = Math.max(smooth(1.6, 0.2, dy), ex < 0 && ex < -w + 1 ? 0.45 * smooth(th, 0, dy) : 0);
            }
        }
    };
    const solid = (k) => mat[k] === WALL || mat[k] === ROOF || mat[k] === PANE || mat[k] === DOOR || mat[k] === SHORE;
    for (let x = -1; x < W + 2;) {
        const h = hash(Math.floor(x * 7), 21);
        const open = smooth(96, 80, x) + smooth(122, 136, x);
        const onShelf = x > 132 && x < 180;
        if (open > 0.05 && !(x > 136 && x < 166)) {
            const th = (3.2 + hash(Math.floor(x * 3), 5) * 3 + (hash(Math.floor(x * 5), 8) > 0.7 ? 2.4 : 0)) * Math.min(1, open) * (onShelf ? 0.7 : 1);
            if (th > 1.5)
                spruce(x + hash(Math.floor(x), 2), th, 1 + hash(Math.floor(x), 4) * 0.6, onShelf ? shoreTop(x) - 0.4 : WL + 0.3, onShelf ? solid : null);
        }
        x += 2 + 2.2 * h;
    }
    // The cabin: red boards, a snowed roof, two warm panes, a door, a chimney.
    const eave = cabBase - 7;
    const roofTop = eave - 8;
    const CHIM = CAB[1] - 5, CHIM_TOP = eave - 8.5;
    for (let r = 0; r < WL; r++) {
        for (let x = CAB[0] - 3; x <= CAB[1] + 3; x++) {
            const k = r * W + x;
            const y = r + 0.5;
            const cx = (CAB[0] + CAB[1] + 1) / 2;
            if (x >= CAB[0] && x <= CAB[1] && y >= eave && y < cabBase + 0.5) {
                mat[k] = WALL;
                const boards = r & 1 ? 0.82 : 1;
                const s = (0.5 + 0.5 * ((CAB[1] - x) / (CAB[1] - CAB[0]))) * boards;
                sr[k] = 0.7 * s, sg[k] = 0.14 * s, sb[k] = 0.11 * s;
                rim[k] = 0;
                for (const [a, b] of PANES)
                    if (x >= a && x <= b && y >= eave + 1.5 && y < cabBase - 2)
                        mat[k] = PANE;
                if (x >= DOOR_X[0] && x <= DOOR_X[1] && y >= eave + 1.5) {
                    mat[k] = DOOR;
                    sr[k] = 0.16, sg[k] = 0.06, sb[k] = 0.05;
                }
            }
            const half = 12.5 - (eave - y) * 1.45;
            if (y >= roofTop && y < eave && Math.abs(x + 0.5 - cx) <= half) {
                mat[k] = ROOF;
                const snowy = y < eave - 1;
                const s = 0.78 + 0.22 * ((cx - x - 0.5) / 12);
                if (snowy)
                    (sr[k] = 0.78 * s), (sg[k] = 0.84 * s), (sb[k] = 0.96 * s);
                else
                    (sr[k] = 0.12), (sg[k] = 0.05), (sb[k] = 0.06);
                rec[k] = snowy ? 0.5 : 0;
                rim[k] = 0;
            }
            if (x >= CHIM && x <= CHIM + 1 && y >= CHIM_TOP && y < eave - 4) {
                mat[k] = WALL;
                const s = x === CHIM ? 1 : 0.55;
                sr[k] = 0.2 * s, sg[k] = 0.21 * s, sb[k] = 0.27 * s;
                rim[k] = 0;
            }
        }
    }
    // a few spruce on the shelf, beside the cabin
    for (const [tx, th] of [[134, 7], [137.8, 10], [166.5, 9], [170, 6], [174.5, 8]]) {
        spruce(tx, th, 2.2, shoreTop(tx) + 0.5, (k) => mat[k] === WALL || mat[k] === ROOF || mat[k] === PANE || mat[k] === DOOR);
    }
    // the warm light the panes throw on the snow and the air around them
    const lampLand = new Float32Array(WL * W);
    for (let r = 0; r < WL; r++) {
        for (let x = 0; x < W; x++) {
            const k = r * W + x, m = mat[k];
            if (m === PANE || m === WALL || m === ROOF || m === DOOR)
                continue;
            let g = 0;
            for (const [lx, s] of LAMPS) {
                const wx = x + 0.5 - lx, wy = r + 0.5 - (cabBase - 2.5);
                const d = Math.sqrt(wx * wx * 0.6 + wy * wy * 2.2);
                g += s * Math.exp(-d / 5.5) * 0.6;
            }
            lampLand[k] = g * (m === AIR ? 0.3 : m === TREE ? 0.4 : 0.75 + 0.5 * hash(x, r + 31));
        }
    }
    // the sky's unevenness and its stars
    const haze = new Float32Array(WL * W);
    for (let k = 0; k < WL * W; k++)
        haze[k] = fbm((k % W) * 0.04, Math.floor(k / W) * 0.07, 3);
    const star = new Float32Array(WL * W);
    for (let k = 0; k < WL * W; k++) {
        const h = hash(k % W, Math.floor(k / W) + 101);
        if (h > 0.986)
            star[k] = 0.35 + (h - 0.986) * 45;
    }
    // rows of the water that break the reflection into strips
    const gap = new Uint8Array(H);
    for (let r = WL; r < H; r++)
        gap[r] = hash(r, 404) < 0.3 ? 1 : 0;
    // per-column aurora state, filled each frame
    const baseA = new Float32Array(W), tallA = new Float32Array(W), envA = new Float32Array(W);
    const baseB = new Float32Array(W), envB = new Float32Array(W);
    const RAYS = 4 * W;
    const raysA = new Float32Array(RAYS + 2), raysB = new Float32Array(RAYS + 2);
    const R = new Float32Array(WL * W), G = new Float32Array(WL * W), B = new Float32Array(WL * W);
    const lightX = new Float32Array(W); // the aurora's light falling on the land below
    const ray = (arr, u) => {
        const s = u * 4;
        let i = Math.floor(s);
        const f = s - i;
        i = ((i % RAYS) + RAYS) % RAYS;
        return arr[i] + (arr[i + 1] - arr[i]) * f;
    };
    return (t, { color } = {}) => {
        // --- the curtains -------------------------------------------------------
        for (let x = 0; x < W; x++) {
            const u = x / W;
            // the main curtain sweeps down from the upper left, low over the fjord,
            // and lifts again to the right; ripples travel along it and fold it
            baseA[x] = 5 + 40 * Math.pow(Math.sin(Math.min(1, u / 0.6) * Math.PI / 2), 1.5) - 13 * smooth(0.6, 0.95, u)
                + 2.6 * Math.sin(x * 0.07 - t * 0.55) + 1.4 * Math.sin(x * 0.17 + t * 0.9 + 1.3) + 2.2 * Math.sin(x * 0.22 + t * 1.2)
                + 4 * (fbm(x * 0.015 + t * 0.03, 4.2, 2) - 0.5);
            tallA[x] = 11 + 8 * fbm(x * 0.03 - t * 0.05, 1.7, 2);
            envA[x] = smooth(0.0, 0.2, u) * smooth(0.98, 0.72, u) * (0.4 + 0.8 * fbm(x * 0.022 - t * 0.07, 8.8, 3));
            // a fainter curtain behind, higher up, on the right
            baseB[x] = 14 + 4 * Math.sin(x * 0.035 + t * 0.3 + 2) + 1.6 * Math.sin(x * 0.11 - t * 0.7);
            envB[x] = smooth(0.45, 0.7, u) * smooth(1.05, 0.85, u) * (0.25 + 0.5 * fbm(x * 0.03 + t * 0.05, 3.3, 2));
        }
        for (let i = 0; i <= RAYS + 1; i++) {
            const u = i / 4;
            raysA[i] = 0.14 + Math.pow(fbm(u * 0.6 + t * 0.35, t * 0.12, 3), 2.4) * 2.5;
            raysB[i] = 0.1 + Math.pow(fbm(u * 0.45 - t * 0.2, 5 + t * 0.1, 3), 2.2) * 2.0;
        }
        for (let x = 0; x < W; x++) {
            let s = 0;
            for (let d = -24; d <= 24; d += 6) {
                const xx = Math.min(W - 1, Math.max(0, x + d));
                s += envA[xx] + 0.4 * envB[xx];
            }
            lightX[x] = s / 9;
        }
        const flick = 0.92 + 0.05 * Math.sin(t * 2.3) + 0.03 * Math.sin(t * 7.1);
        // --- sky and land ---------------------------------------------------------
        for (let r = 0; r < WL; r++) {
            const y = r + 0.5;
            const v = y / WL;
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                const m = mat[k];
                let cr, cg, cb;
                if (m === AIR) {
                    const hz = 0.85 + 0.3 * haze[k];
                    cr = (0.025 + 0.03 * v * v) * hz;
                    cg = (0.04 + 0.07 * v * v) * hz;
                    cb = (0.1 + 0.11 * v * v) * hz;
                    // curtain A: a sharp lower hem, rays rising and fading to violet
                    let a = 0;
                    const d = baseA[x] - y;
                    if (d > -4 && d < 46) {
                        const bend = Math.abs(baseA[Math.min(W - 1, x + 1)] - baseA[Math.max(0, x - 1)]);
                        const hc = tallA[x];
                        const lean = ray(raysA, x + d * 0.22);
                        const prof = d < 0 ? Math.exp(-d * d * 0.9) : (1 - Math.exp(-(d + 0.4) * 1.1)) * Math.exp(-d / hc);
                        // the rays, over a continuous bright band along the hem
                        const band = d < 0 ? Math.exp(-d * d) : Math.exp(-d / 3);
                        a = (prof * lean + 0.3 * band * (0.55 + 0.45 * Math.min(1.4, lean))) * envA[x] * (1.15 + 0.35 * bend);
                        const up = clamp(d / (hc * 1.6));
                        const gk = 1 - smooth(0, 0.5, up), vk = smooth(0.4, 0.9, up);
                        const tk = 1 - gk - vk;
                        cr += a * (0.18 * gk + 0.06 * tk + 0.42 * vk);
                        cg += a * (1.0 * gk + 0.78 * tk + 0.16 * vk);
                        cb += a * (0.48 * gk + 0.7 * tk + 0.75 * vk);
                        // pink at the very hem where it is brightest
                        const hem = Math.exp(-((d + 0.6) ** 2) * 1.2) * smooth(0.3, 0.8, a) * 0.8 * (0.45 + 0.55 * Math.min(1, lean));
                        cr += hem * 0.95, cg *= 1 - 0.55 * Math.min(1, hem * 1.6), cb += hem * 0.4;
                    }
                    // curtain B, further away, thinning out toward the top of the frame
                    const db = baseB[x] - y;
                    if (db > -3 && db < 30) {
                        const prof = db < 0 ? Math.exp(-db * db) : (1 - Math.exp(-(db + 0.4))) * Math.exp(-db / 9);
                        const b = prof * ray(raysB, x + db * 0.18) * envB[x] * 0.85 * smooth(0, 8, y);
                        const up = clamp(db / 12);
                        cr += b * (0.1 + 0.4 * up);
                        cg += b * (0.75 - 0.5 * up);
                        cb += b * (0.7 + 0.2 * up);
                        a += b;
                    }
                    // a little glow round the curtain, kept tight under the hem so the
                    // hem reads as an edge over dark sky
                    const below = y - baseA[x];
                    const gl = envA[x] * (below > 0 ? Math.exp(-below / 6) * 0.1 : Math.exp(below / 8) * 0.18);
                    cr += gl * 0.12, cg += gl * 0.62, cb += gl * 0.52;
                    // airglow on the horizon
                    const ag = Math.exp(-(WL - y) / 10) * (0.1 + 0.16 * lightX[x]);
                    cg += ag * 0.7, cb += ag * 0.75, cr += ag * 0.2;
                    const st = star[k];
                    if (st > 0) {
                        const tw = 0.7 + 0.3 * Math.sin(t * (1.3 + 3 * hash(x, r)) + 6.28 * hash(r, x));
                        const s = st * tw * clamp(1 - a * 1.6) * smooth(WL - 2, 30, y);
                        cr = Math.max(cr, s * 0.9), cg = Math.max(cg, s * 0.94), cb = Math.max(cb, s);
                    }
                }
                else {
                    cr = sr[k], cg = sg[k], cb = sb[k];
                    const L = lightX[x] * rec[k];
                    cr += L * 0.03, cg += L * 0.14, cb += L * 0.1;
                    const e = rim[k];
                    if (e > 0) {
                        const q = e * (m === TREE ? 0.2 + 0.45 * lightX[x] : 0.05 + 0.22 * lightX[x]);
                        cr += q * 0.25, cg += q * 0.95, cb += q * 0.7;
                    }
                    if (m === PANE) {
                        const f = flick + 0.04 * Math.sin(t * 5.3 + x);
                        cr = f, cg = 0.76 * f, cb = 0.38 * f;
                    }
                    else if (m === DOOR) {
                        // light through the crack of the door
                        if (x === DOOR_X[1] && r > eave + 1)
                            (cr = 0.55 * flick), (cg = 0.36 * flick), (cb = 0.14 * flick);
                    }
                }
                const lg = lampLand[k] * flick;
                if (lg > 0)
                    cr += lg, cg += lg * 0.62, cb += lg * 0.26;
                R[k] = cr, G[k] = cg, B[k] = cb;
            }
        }
        for (let r = 0; r < H; r++) {
            const y = r + 0.5;
            let floor = 0.1, fade = 1;
            const dw = y - WL;
            const deep = r >= WL ? mix(1, 0.45, dw / (H - WL)) : 1;
            const ry = WL - 1 - (r - WL) - Math.round(0.4 * Math.sin(r * 0.9 + t * 0.6));
            const r0 = Math.max(0, ry) * W, r1 = Math.max(0, ry - 1) * W, r2 = Math.max(0, ry - 2) * W;
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                let cr, cg, cb;
                if (r < WL) {
                    cr = R[k], cg = G[k], cb = B[k];
                    const m = mat[k];
                    floor = m === AIR ? 0.1 : m === NEAR ? 0.05 : m === TREE ? 0.04 : 0.06;
                }
                else {
                    // still water: the mirror image, stretched and broken by slow ripples
                    const wave = noise(x * 0.04 + t * 0.05, r * 0.55 - t * 0.35);
                    const sx = x + (0.5 + dw * 0.12) * Math.sin(r * 1.3 + t * 1.6 + wave * 4);
                    let ix = Math.floor(sx);
                    const fx = sx - ix;
                    ix = Math.max(0, Math.min(W - 2, ix));
                    const a0 = r0 + ix, a1 = r1 + ix, a2 = r2 + ix;
                    const sky = mat[a0] === AIR;
                    let kr = (sky ? 0.55 : 0.64) * (0.82 + 0.3 * wave) * deep;
                    if (sky && gap[r] && wave < 0.45)
                        kr *= 0.12;
                    // the cabin's own image is soft; the lamplight road below carries it
                    const ms = mat[a0];
                    if (ms === PANE)
                        kr *= 0.4;
                    else if (ms === WALL || ms === ROOF || ms === DOOR)
                        kr *= 0.7;
                    const gx = 1 - fx;
                    cr = ((R[a0] * gx + R[a0 + 1] * fx) * 0.5 + (R[a1] * gx + R[a1 + 1] * fx) * 0.3 + (R[a2] * gx + R[a2 + 1] * fx) * 0.2) * kr;
                    cg = ((G[a0] * gx + G[a0 + 1] * fx) * 0.5 + (G[a1] * gx + G[a1 + 1] * fx) * 0.3 + (G[a2] * gx + G[a2 + 1] * fx) * 0.2) * kr;
                    cb = ((B[a0] * gx + B[a0 + 1] * fx) * 0.5 + (B[a1] * gx + B[a1 + 1] * fx) * 0.3 + (B[a2] * gx + B[a2 + 1] * fx) * 0.2) * kr;
                    if (ms !== WALL && ms !== DOOR)
                        cr += 0.02, cg += 0.035, cb += 0.065;
                    // a pale line where the water meets the shore
                    if (r === WL) {
                        const e = 0.3 * (0.3 + 0.7 * smooth(0.25, 0.75, noise(x * 0.3, t * 0.4)));
                        cr += e * 0.6, cg += e * 0.85, cb += e;
                    }
                    // the lamplight laid on the water as a broken golden road
                    if (dw < 14 && x > 138 && x < 166) {
                        const rip = noise(x * 0.5 - t * 0.2, r * 1.4 - t * 1.5);
                        for (const [lx, s] of LAMPS) {
                            const lw = 1 + dw * 0.1;
                            const q = (x + 0.5 - lx) / lw;
                            const g = Math.exp(-q * q) * Math.exp(-dw / 8) * smooth(0.3, 0.65, rip) * s * 1.6 * flick;
                            cr += g, cg += g * 0.68, cb += g * 0.28;
                        }
                    }
                    floor = sky ? 0.07 * deep : 0.03;
                    fade = smooth(H + 3, H - 12, y);
                }
                const peak = Math.max(cr, cg, cb, 1e-4);
                const level = clamp(floor + (1 - floor) * Math.pow(peak, 0.85) * 0.95) * fade;
                const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
                out[k] = DOTS[step];
                if (color) {
                    const want = step ? Math.min(1, (level + 0.06) / COVER[step]) : 0;
                    const s = (0.3 + 0.7 * want) / peak;
                    color[k] = nearest(clamp(cr * s), clamp(cg * s), clamp(cb * s));
                }
            }
        }
        const lines = [];
        for (let r = 0; r < H; r++)
            lines.push(out.slice(r * W, (r + 1) * W).join(""));
        return lines.join("\n");
    };
}

    return { meta: meta, make: auroraFjord };
  })();

  // -------------------------------------------------------------
  // Scene: night-coast
  // -------------------------------------------------------------
  SCENES["night-coast"] = (function () {
const meta = {
    name: "night coast",
    category: "scenes",
    note: "a lighthouse turning its beam under moonlit clouds over a dark sea",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 15,
    ground: "#080b12",
    palette: [
        "#15203d", "#1b2a50", "#223463", "#2b4077", "#364e8b", "#445f9f", "#5874b2", "#7089c0",
        "#8a9cc4", "#a3b1cf", "#bec9dc", "#d8dfea", "#eef1f6", "#f7f8fc",
        "#ffe9ae", "#ffd27c", "#f3a64a", "#c46c2d",
        "#121c1b", "#182724", "#203530", "#2c473d", "#3c5c4c",
        "#232a36", "#363e4c", "#555d6c", "#2a3550", "#3a4868",
        "#9c4136", "#ff5d4d",
    ],
};
const W = 200, H = 100;
const HORIZON = 60;
const MOON = [150, 19];
const LAMP_X = 30;
const DOTS = " ·•●";
const COVER = [0, 0.3, 0.6, 1]; // how much each dot fills, against the largest
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
const AIR = 0, LAND = 1, TREE = 2, TOWER = 3, LANTERN = 4, CAP = 5, WALL = 6, PANE = 7, ROOF = 8, ISLE = 9;
function hash(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// Value noise, wrapping every `period` lattice cells in x when period > 0.
function noise(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
        x0 = ((xi % period) + period) % period;
        x1 = (x0 + 1) % period;
    }
    const a = hash(x0, yi), b = hash(x1, yi), c = hash(x0, yi + 1), d = hash(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, octaves, period) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
        s += amp * noise(x * f, y * f, period * f);
        n += amp;
        amp *= 0.5;
        f *= 2;
    }
    return s / n;
}
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => {
    const k = clamp((v - a) / (b - a));
    return k * k * (3 - 2 * k);
};
const mix = (a, b, k) => a + (b - a) * k;
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
function nightCoast() {
    const P = meta.palette.map(hex);
    const N = W * H;
    const out = new Array(N);
    // Nearest palette colour, cached on a 32-step cube.
    const lut = new Uint8Array(32768).fill(255);
    const nearest = (r, g, b) => {
        const k = (Math.min(31, (r * 31.99) | 0) << 10) | (Math.min(31, (g * 31.99) | 0) << 5) | Math.min(31, (b * 31.99) | 0);
        if (lut[k] !== 255)
            return lut[k];
        let best = 0, bd = 1e9;
        for (let i = 0; i < P.length; i++) {
            const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
            const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
            if (d < bd)
                (bd = d), (best = i);
        }
        return (lut[k] = best);
    };
    // --- the land, built once -----------------------------------------------
    const top = (x) => HORIZON - 15 * smooth(86, 50, x) * (1 - 0.12 * smooth(24, 0, x)) - 1.6 * fbm(x * 0.15, 3.7, 3, 0);
    const mat = new Uint8Array(N);
    const shade = new Float32Array(N);
    const base = top(LAMP_X);
    const towerTop = base - 15;
    const trees = [];
    for (let x = 1; x < 76; x += 2.6 + hash(x * 7, 1) * 2.6) {
        if (x > 22 && x < 49)
            continue; // the clearing for the tower and the cottage
        trees.push([x + hash(x, 2) * 1.2, (4 + hash(x, 3) * 7) * smooth(78, 56, x), 2 + hash(x, 4) * 1.6]);
    }
    const cottage = top(41);
    for (let r = 0; r < H; r++) {
        for (let x = 0; x < W; x++) {
            const k = r * W + x;
            const y = r + 0.5;
            const t0 = top(x);
            const isle = HORIZON - 4.5 * Math.max(0, 1 - ((x - 180) / 26) ** 2) - 1.4 * fbm(x * 0.2, 9, 2, 0);
            if (y >= t0 && y < HORIZON + 4 && x < 90) {
                mat[k] = LAND;
                // rock and scrub, the brow of the slope catching the moon
                shade[k] = 0.2 + 0.45 * fbm(x * 0.35, y * 0.35, 3, 0) + 0.5 * smooth(t0 + 3, t0, y) - 0.2 * smooth(HORIZON - 4, HORIZON + 4, y);
            }
            else if (x > 148 && y >= isle && y < HORIZON) {
                mat[k] = ISLE;
            }
            for (const [tx, th, tw] of trees) {
                if (th < 1)
                    continue;
                const tb = top(tx);
                const dy = y - (tb - th);
                if (dy >= 0 && y < tb + 2 && Math.abs(x + 0.5 - tx) <= (dy / th) * tw + 0.4) {
                    mat[k] = TREE;
                    shade[k] = 0.1 + 0.35 * hash(x * 13 + r, 5) + (x + 0.5 > tx ? 0.35 : 0);
                }
            }
            // the tower: tapered, white, lit from the moon on its right
            const dx = x + 0.5 - LAMP_X;
            if (y >= towerTop && y < base + 2) {
                const hw = 3 - 1.1 * smooth(base, towerTop, y);
                if (Math.abs(dx) <= hw) {
                    mat[k] = TOWER;
                    shade[k] = 0.45 + 0.5 * (dx / hw);
                }
            }
            if (y >= towerTop - 1 && y < towerTop + 1 && Math.abs(dx) <= 3.6)
                (mat[k] = CAP), (shade[k] = 0.55);
            if (y >= towerTop - 7 && y < towerTop - 1 && Math.abs(dx) <= 2)
                mat[k] = LANTERN;
            if (y >= towerTop - 10 && y < towerTop - 7 && Math.abs(dx) <= 2.8 - (towerTop - 7 - y) * 0.8)
                (mat[k] = CAP), (shade[k] = 0.4);
            // the keeper's cottage, lit inside
            if (x >= 36 && x <= 47 && y >= cottage - 5 && y < cottage + 1) {
                mat[k] = WALL;
                shade[k] = 0.3 + 0.4 * (x - 36) / 11;
                if ((x === 39 || x === 44) && y >= cottage - 4 && y < cottage - 1.5)
                    mat[k] = PANE;
            }
            if (y >= cottage - 10 && y < cottage - 5 && Math.abs(x + 0.5 - 42) <= 7.5 - (cottage - 5 - y) * 1.2)
                mat[k] = ROOF;
        }
    }
    // a faint unevenness in the clear sky, so it is never one flat tone
    const haze = new Float32Array(N);
    for (let k = 0; k < N; k++)
        haze[k] = fbm((k % W) * 0.05, Math.floor(k / W) * 0.08, 3, 0);
    // --- the clouds: heaps of noise that wrap, so they can drift forever ----
    const CW = 640;
    const cover = new Float32Array(CW * HORIZON);
    const lit = new Float32Array(CW * HORIZON);
    const density = (x, y) => {
        const q = fbm(x * 0.008, y * 0.02, 3, CW * 0.008);
        const d = fbm(x * 0.018 + q * 2.4, y * 0.036 + q * 1.1, 5, CW * 0.018);
        // heaped mid-sky, thinner overhead, wisps at the horizon
        return d + 0.05 * smooth(8, 22, y) - 0.04 * smooth(10, 0, y) - 0.16 * smooth(36, HORIZON - 4, y);
    };
    for (let r = 0; r < HORIZON; r++) {
        for (let x = 0; x < CW; x++) {
            const y = r + 0.5;
            const d = density(x, y);
            cover[r * CW + x] = smooth(0.52, 0.63, d);
            // Lit on the side facing the moon (up and right), shadowed underneath,
            // a little darker deep inside.
            const toward = density(x + 2.5, y - 3);
            lit[r * CW + x] = clamp(0.5 + (d - toward) * 11 - (d - 0.6) * 1.2);
        }
    }
    return (t, { color } = {}) => {
        const beam = (t / 8) * Math.PI * 2 - 0.75; // starts out over the sea
        const cb = Math.cos(beam), sb = Math.sin(beam);
        const flash = Math.pow(Math.max(0, sb), 14) * 2.2; // pointed at us
        const lampY = towerTop - 4;
        const drift = t * 1.4;
        for (let r = 0; r < H; r++) {
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                const y = r + 0.5;
                const m = mat[k];
                let cr = 0, cg = 0, cbl = 0, floor = 0.3, fade = 1;
                const dmx = x + 0.5 - MOON[0], dmy = y - MOON[1];
                const dm = Math.sqrt(dmx * dmx + dmy * dmy);
                if (y < HORIZON && m === AIR) {
                    // sky: deep navy up top to a hazy horizon, brighter round the moon
                    const v = y / HORIZON;
                    const halo = Math.exp(-dm / 24) * 0.35 + Math.exp(-dm / 9) * 0.45;
                    const glowH = Math.pow(v, 3) * 0.24; // the horizon's last light
                    const veil = 0.85 + 0.3 * haze[r * W + x];
                    cr = (0.04 + 0.1 * v * v + glowH * 0.9) * veil + 0.3 * halo;
                    cg = (0.07 + 0.13 * v * v + glowH) * veil + 0.35 * halo;
                    cbl = (0.17 + 0.2 * v * v + glowH * 1.1) * veil + 0.42 * halo;
                    floor = 0.15;
                    const sx = x + drift, ix = Math.floor(sx), fx = sx - ix;
                    const i0 = r * CW + (ix % CW), i1 = r * CW + ((ix + 1) % CW);
                    // a break in the cloud round the moon
                    const c = (cover[i0] + (cover[i1] - cover[i0]) * fx) * (0.15 + 0.85 * smooth(7, 24, dm));
                    const l = lit[i0] + (lit[i1] - lit[i0]) * fx;
                    if (dm < 6) {
                        // the moon, dimmed where cloud crosses it
                        const face = 0.86 + 0.14 * fbm(x * 0.5, y * 0.5, 2, 0);
                        const a = (1 - c * 0.8) * smooth(6, 5, dm);
                        cr = mix(cr, 0.96 * face, a);
                        cg = mix(cg, 0.97 * face, a);
                        cbl = mix(cbl, 1.0 * face, a);
                    }
                    else if (c < 0.05 && hash(x, r * 3 + 11) > 0.982) {
                        const tw = 0.6 + 0.4 * Math.sin(t * (1.5 + hash(x, r) * 3) + hash(r, x) * 6.28);
                        const s = (0.5 + 0.5 * tw) * (1 - halo) * smooth(HORIZON, 20, y);
                        cr = Math.max(cr, s * 0.92), cg = Math.max(cg, s * 0.94), cbl = Math.max(cbl, s);
                    }
                    if (c > 0.01) {
                        // shadow slate, through moonlit grey, to a silver rim near the moon;
                        // low cloud is lit from below by the horizon and stays hazy
                        const near = Math.exp(-dm / 30);
                        const b = clamp(l * (0.5 + 0.6 * near) + 0.25 * smooth(30, HORIZON, y));
                        const kr = b < 0.5 ? mix(0.1, 0.36, b * 2) : mix(0.36, 0.95, (b - 0.5) * 2);
                        const kg = b < 0.5 ? mix(0.13, 0.42, b * 2) : mix(0.42, 0.96, (b - 0.5) * 2);
                        const kb = b < 0.5 ? mix(0.25, 0.58, b * 2) : mix(0.58, 1.0, (b - 0.5) * 2);
                        const a = Math.min(1, c * 1.1);
                        cr = mix(cr, kr, a);
                        cg = mix(cg, kg, a);
                        cbl = mix(cbl, kb, a);
                    }
                }
                else if (y >= HORIZON && (m === AIR || m === LAND) && !(m === LAND && y < HORIZON + 4)) {
                    // sea: cold, darker toward us, waves stretched along the swell
                    const v = (y - HORIZON) / (H - HORIZON);
                    const w = 0.6 * noise(x * 0.07 + t * 0.12, y * 0.45 - t * 0.6, 0) + 0.4 * noise(x * 0.2 - t * 0.25, y * 0.9 - t * 1.1, 0);
                    const swell = 0.45 + 0.95 * w;
                    cr = (0.08 - 0.04 * v) * swell;
                    cg = (0.13 - 0.06 * v) * swell;
                    cbl = (0.28 - 0.12 * v) * swell;
                    // the moon's road: wider toward us, broken into glints
                    const roadW = 3 + (y - HORIZON) * 0.55;
                    const road = Math.exp(-(((x + 0.5 - MOON[0]) / roadW) ** 2));
                    const glint = smooth(0.5, 0.8, w) * road;
                    cr += 0.95 * glint + 0.07 * road;
                    cg += 0.95 * glint + 0.09 * road;
                    cbl += 0.95 * glint + 0.15 * road;
                    // the lamp's reflection, warm, under the tower
                    const lw = 1.3 + (y - HORIZON) * 0.22;
                    const refl = Math.exp(-(((x + 0.5 - LAMP_X) / lw) ** 2)) * smooth(0.45, 0.8, w) * (0.75 + 0.6 * flash);
                    cr += refl;
                    cg += 0.72 * refl;
                    cbl += 0.32 * refl;
                    // surf where the headland meets the water
                    if (y < HORIZON + 8 && x < 90) {
                        const edge = smooth(90, 74, x) * smooth(HORIZON + 8, HORIZON + 3, y);
                        const foam = smooth(0.5, 0.85, noise(x * 0.45 - t * 0.6, y * 0.8 + t * 0.4, 0)) * edge;
                        cr += 0.65 * foam, cg += 0.7 * foam, cbl += 0.75 * foam;
                    }
                    const haze = Math.exp(-(y - HORIZON) / 2.5) * 0.16;
                    cr += haze * 0.8, cg += haze * 0.9, cbl += haze;
                    floor = 0.18;
                    fade = smooth(H, H - 26, y); // the bottom rows thin out into the ground
                }
                else if (m === LAND) {
                    const s = shade[k];
                    (cr = 0.05 + 0.14 * s), (cg = 0.09 + 0.2 * s), (cbl = 0.1 + 0.18 * s);
                    floor = 0.1;
                }
                else if (m === TREE) {
                    const s = shade[k];
                    (cr = 0.03 + 0.07 * s), (cg = 0.07 + 0.14 * s), (cbl = 0.07 + 0.1 * s);
                    floor = 0.06;
                }
                else if (m === ISLE) {
                    (cr = 0.06), (cg = 0.08), (cbl = 0.15);
                    floor = 0.1;
                    if (x === 184 && r === 55) {
                        // a buoy light out on the point, blinking
                        const on = Math.sin(t * 2.2) > 0.55;
                        (cr = on ? 1 : 0.35), (cg = on ? 0.36 : 0.12), (cbl = on ? 0.3 : 0.1);
                    }
                }
                else if (m === TOWER || m === CAP) {
                    const s = shade[k];
                    (cr = 0.4 + 0.58 * s), (cg = 0.42 + 0.56 * s), (cbl = 0.48 + 0.52 * s);
                    if (m === CAP)
                        (cr *= 0.7), (cg *= 0.66), (cbl *= 0.68);
                }
                else if (m === LANTERN) {
                    const g = 0.85 + 0.15 * Math.min(1, flash);
                    (cr = g), (cg = 0.84 * g), (cbl = 0.5 * g);
                }
                else if (m === WALL) {
                    const s = shade[k];
                    (cr = 0.3 + 0.4 * s), (cg = 0.32 + 0.4 * s), (cbl = 0.38 + 0.4 * s);
                }
                else if (m === PANE) {
                    const g = 0.85 + 0.15 * Math.sin(t * 3 + x);
                    (cr = g), (cg = 0.72 * g), (cbl = 0.32 * g);
                }
                else if (m === ROOF) {
                    (cr = 0.4), (cg = 0.17), (cbl = 0.14);
                }
                // The beam: a soft cone from the lamp to one side, shortened as it
                // turns toward or away from us, and a glow that flares when it faces us.
                const bx = x + 0.5 - LAMP_X, by = y - lampY;
                if (m !== TOWER && m !== CAP && m !== LANTERN) {
                    if (bx * cb > 0) {
                        const along = Math.abs(bx) / (Math.abs(cb) * 115 + 1);
                        if (along < 1) {
                            const spread = 1.4 + Math.abs(bx) * 0.11;
                            const b = Math.pow(1 - along, 1.8) * Math.exp(-((by / spread) ** 2)) * 0.85;
                            cr += b, cg += b * 0.84, cbl += b * 0.5;
                        }
                    }
                    const dl = Math.sqrt(bx * bx + by * by);
                    const glow = Math.exp(-dl / (3.5 + 3 * flash)) * (0.5 + 0.6 * flash) + Math.exp(-dl / 14) * 0.12;
                    cr += glow, cg += glow * 0.82, cbl += glow * 0.5;
                }
                // Dot size from brightness, dithered. Then the colour makes up what the
                // dot size could not: a small dot is drawn brighter and a large one
                // dimmer, so a gradient stays smooth across the dither's steps.
                const peak = Math.max(cr, cg, cbl, 1e-4);
                const level = clamp(floor + (1 - floor) * Math.pow(peak, 0.85) * 0.95) * fade;
                const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
                out[k] = DOTS[step];
                if (color) {
                    const want = step ? Math.min(1, (level + 0.06) / COVER[step]) : 0;
                    const s = (0.3 + 0.7 * want) / peak;
                    color[k] = nearest(clamp(cr * s), clamp(cg * s), clamp(cbl * s));
                }
            }
        }
        const lines = [];
        for (let r = 0; r < H; r++)
            lines.push(out.slice(r * W, (r + 1) * W).join(""));
        return lines.join("\n");
    };
}

    return { meta: meta, make: nightCoast };
  })();

  // -------------------------------------------------------------
  // Scene: alpine-dawn
  // -------------------------------------------------------------
  SCENES["alpine-dawn"] = (function () {
const meta = {
    name: "alpine dawn",
    category: "scenes",
    note: "snow peaks catching first light above a still, misty mountain lake",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 15,
    ground: "#090c18",
    palette: [
        "#0e1430", "#151d40", "#1d2752", "#263365", "#314179", "#3e508c", "#4f62a0", "#6577b3", "#8090c4", "#9eaad3", "#bec6e2",
        "#4b3e6c", "#6a5482", "#8c6a92", "#b0829c", "#cf96a4",
        "#e8a9a8", "#f5bcaa", "#ffd0b0", "#ffe2c2", "#fff1e0", "#fdfaf6",
        "#ffc887", "#f7a965", "#f2a08f", "#e58a87", "#f8b59d", "#d97b7e",
        "#7a4c4a", "#a5654f", "#523a4a",
        "#1b2034", "#262c45", "#363c59",
        "#0a1418", "#0f1f24", "#162a2f", "#203a3c",
        "#a3a7c6", "#c6c3d8", "#e0d4dc",
        "#5a4f7e", "#7b6c9c", "#9a8cb6", "#b8a8c8", "#d8bccb",
    ],
};
const W = 200, H = 100;
const K = 0.62; // tangent of half the field of view, across the width
const HZ = 56.5; // eye level, in rows
const CAM = 1.5; // camera height above the water
const SHORE_Z = 46; // distance to the far shore
const SHORE = 62; // first row of open water
const SUN = [151, 50];
const DOTS = " ·•●";
const COVER = [0, 0.3, 0.6, 1];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
function hash(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
        x0 = ((xi % period) + period) % period;
        x1 = (x0 + 1) % period;
    }
    const a = hash(x0, yi), b = hash(x1, yi), c = hash(x0, yi + 1), d = hash(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, octaves, period) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
        s += amp * noise(x * f, y * f, period * f);
        n += amp;
        amp *= 0.5;
        f *= 2;
    }
    return s / n;
}
// Sharp crests where plain noise crosses its middle: rock ribs and couloirs.
function ridged(x, y, octaves) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
        const v = 1 - Math.abs(2 * noise(x * f + i * 17.3, y * f, 0) - 1);
        s += amp * v * v;
        n += amp;
        amp *= 0.5;
        f *= 2.1;
    }
    return s / n;
}
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => {
    const k = clamp((v - a) / (b - a));
    return k * k * (3 - 2 * k);
};
const mix = (a, b, k) => a + (b - a) * k;
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
// Peaks as pyramids, each turned a little, placed by where their summits
// should land on screen: [column, row, distance, spread, turn].
const PEAKS = [
    [66, 11, 140, 0.95, 0.3],
    [38, 26, 115, 1.1, -0.15],
    [116, 22, 175, 0.9, 0.2],
    [92, 33, 150, 1.0, 0.1],
    [96, 25, 340, 1.1, 0.4],
    [180, 38, 200, 1.5, -0.1],
    [8, 30, 160, 1.2, 0.25],
].map(([sx, row, z, f, a]) => {
    const h = CAM + ((HZ - row) / 100) * K * z - 1.5;
    return [((sx - 100) / 100) * K * z, z, h, h * f, Math.cos(a), Math.sin(a)];
});
function terrain(x, z) {
    let h = 0;
    for (const [px, pz, ph, pr, c, s] of PEAKS) {
        const dx = x - px, dz = z - pz;
        const rx = dx * c - dz * s, rz = dx * s + dz * c;
        const v = ph * (1 - (Math.abs(rx) + Math.abs(rz)) / pr);
        if (v > h)
            h = v;
    }
    const hills = (1 + 3 * fbm(x * 0.04, z * 0.04, 3, 0)) * smooth(SHORE_Z, SHORE_Z + 15, z);
    if (hills > h)
        h = hills;
    // crags, deeper on the high ground
    h += ((ridged(x * 0.06, z * 0.06, 3) - 0.45) * 6 + (ridged(x * 0.2, z * 0.2, 2) - 0.45) * 1.6) * smooth(4, 22, h);
    return h;
}
// Distance along a ray from height `oy` with slope `v` and spread `u` to the
// terrain beyond the shore, or 0 when it reaches the sky.
function march(u, v, oy) {
    let z = SHORE_Z, prev = z;
    for (let i = 0; i < 260 && z < 520; i++) {
        const gap = oy + v * z - terrain(u * z, z);
        if (gap < 0) {
            let a = prev, b = z;
            for (let j = 0; j < 7; j++) {
                const m = (a + b) / 2;
                if (oy + v * m - terrain(u * m, m) < 0)
                    b = m;
                else
                    a = m;
            }
            return b;
        }
        prev = z;
        z += Math.max(0.35, gap * 0.45) + z * 0.002;
    }
    return 0;
}
function alpineDawn() {
    const P = meta.palette.map(hex);
    const N = W * H;
    const out = new Array(N);
    const lut = new Uint8Array(32768).fill(255);
    const nearest = (r, g, b) => {
        const k = (Math.min(31, (r * 31.99) | 0) << 10) | (Math.min(31, (g * 31.99) | 0) << 5) | Math.min(31, (b * 31.99) | 0);
        if (lut[k] !== 255)
            return lut[k];
        let best = 0, bd = 1e9;
        for (let i = 0; i < P.length; i++) {
            const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
            const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
            if (d < bd)
                (bd = d), (best = i);
        }
        return (lut[k] = best);
    };
    const L = (() => {
        const v = [0.9, 0.3, 0.14];
        const n = Math.hypot(...v);
        return v.map((c) => c / n);
    })();
    // --- the range, raymarched once ------------------------------------------
    const SR = SHORE; // rows above the open water
    const depth = new Float32Array(SR * W);
    const alt = new Float32Array(SR * W);
    const sun = new Float32Array(SR * W);
    const snow = new Float32Array(SR * W);
    const up = new Float32Array(SR * W);
    for (let r = 0; r < SR; r++) {
        const v = ((HZ - (r + 0.5)) / 100) * K;
        for (let x = 0; x < W; x++) {
            const u = ((x + 0.5 - 100) / 100) * K;
            const z = march(u, v, CAM);
            const k = r * W + x;
            if (!z)
                continue;
            const px = u * z, py = CAM + v * z;
            const e = 0.35;
            const hx = (terrain(px + e, z) - terrain(px - e, z)) / (2 * e);
            const hz = (terrain(px, z + e) - terrain(px, z - e)) / (2 * e);
            const nl = Math.hypot(hx, 1, hz);
            const nx = -hx / nl, ny = 1 / nl, nz = -hz / nl;
            let lit = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
            if (lit > 0) {
                // cast shadow: walk toward the sun
                for (let s = 0.8; s < 160; s += 0.6 + s * 0.04) {
                    const qx = px + L[0] * s, qy = py + L[1] * s + 0.15, qz = z + L[2] * s;
                    if (qz < SHORE_Z)
                        break;
                    if (qy < terrain(qx, qz)) {
                        lit = 0;
                        break;
                    }
                }
            }
            depth[k] = z;
            alt[k] = py;
            sun[k] = lit;
            up[k] = ny;
            const grain = fbm(px * 0.4, py * 0.25, 2, 0);
            // rock shows through in couloirs running down the fall line
            const gully = ridged(px * 0.22 + z * 0.05, py * 0.045, 2);
            snow[k] = smooth(0.36, 0.52, ny + 0.3 * (grain - 0.5)) * smooth(5, 11, py + 5 * grain) * (1 - 0.75 * smooth(0.62, 0.85, gully));
        }
    }
    // sunlit terrain with open sky directly above: the crest line
    const rim = new Uint8Array(SR * W);
    for (let k = W; k < SR * W; k++)
        rim[k] = depth[k] && !depth[k - W] && sun[k] > 0 ? 1 : 0;
    // --- the far shore's treeline --------------------------------------------
    const treeTop = new Float32Array(W);
    for (let x = 0; x < W; x++)
        treeTop[x] = SHORE - 0.6 - 1.2 * fbm(x * 0.06, 2.3, 2, 0);
    for (let tx = -2; tx < W + 2; tx += 1.6 + hash(tx * 9, 7) * 2.2) {
        const tip = SHORE - 2.6 - hash(tx * 3, 8) * 4 - 1.5 * smooth(60, 0, tx);
        const slope = 1.1 + hash(tx * 5, 9) * 0.5;
        for (let x = Math.max(0, Math.floor(tx - 6)); x < Math.min(W, tx + 6); x++) {
            treeTop[x] = Math.min(treeTop[x], tip + Math.abs(x + 0.5 - tx) * slope);
        }
    }
    // --- the lake: where each cell's reflected ray lands in the picture above -
    const LR = H - SHORE;
    const src = new Float32Array(LR * W);
    for (let r = SHORE; r < H; r++) {
        const v = ((HZ - (r + 0.5)) / 100) * K;
        for (let x = 0; x < W; x++) {
            const u = ((x + 0.5 - 100) / 100) * K;
            const z = march(u, -v, -CAM);
            const vs = -v - (z ? (2 * CAM) / z : 0);
            let row = HZ - (vs * 100) / K - 0.5;
            const mirror = 2 * SHORE - 1 - r; // the treeline stands on the shore
            if (mirror >= treeTop[x])
                row = mirror;
            src[(r - SHORE) * W + x] = row;
        }
    }
    // --- the near pines and the bank they stand on ---------------------------
    const fg = new Uint8Array(N);
    const fgShade = new Float32Array(N);
    const fgRim = new Float32Array(N);
    const PINES = [
        [9, 5, 1.15], [20, 38, 0.85], [32, 66, 0.5],
        [192, 10, 1.15], [181, 40, 0.75], [204, 26, 1],
    ];
    for (let r = 0; r < H; r++) {
        for (let x = 0; x < W; x++) {
            const k = r * W + x;
            const y = r + 0.5;
            const bankL = 88 + 14 * smooth(0, 52, x) + 2 * fbm(x * 0.2, 1, 2, 0);
            const bankR = 90 + 12 * smooth(W, W - 40, x) + 2 * fbm(x * 0.2, 4, 2, 0);
            if (y > bankL || y > bankR)
                (fg[k] = 1), (fgShade[k] = 0.15 * hash(x, r));
            for (const [px, tip, s] of PINES) {
                const d = y - tip;
                if (d < 0)
                    continue;
                const tier = 3.4 * s;
                const f = d / tier - Math.floor(d / tier);
                const hw = (0.4 + d * 0.2) * (0.5 + 0.5 * f) * (1 + 0.6 * (hash(r, Math.floor(px) * 7) - 0.5) * smooth(0, 8, d));
                const dx = x + 0.5 - px;
                if (Math.abs(dx) <= hw) {
                    fg[k] = 2;
                    // the outline catches the dawn sky: a warm rim on the side facing
                    // the sun, a dim cool one on the other, the inside stays black
                    const edge = hw - Math.abs(dx) < 1;
                    const sunward = px < SUN[0] ? dx > 0 : dx < 0;
                    fgShade[k] = edge ? (sunward ? 1 : 0.5) : 0.3 * hash(x * 3, r * 5);
                    // the rim is light from the sky behind, so it fades out below the shore
                    fgRim[k] = edge ? smooth(70, 44, y) * (0.75 + 0.25 * hash(x, r * 7)) : 0;
                }
            }
        }
    }
    // --- mist, a wrapping sheet that drifts along the valley -----------------
    const MW = 480, M0 = 36, MR = SHORE + 2 - M0;
    const mist = new Float32Array(MW * MR);
    for (let r = 0; r < MR; r++) {
        for (let x = 0; x < MW; x++) {
            const y = r + M0;
            const q = fbm(x * 0.0125, y * 0.1, 2, MW * 0.0125);
            mist[r * MW + x] = fbm(x * 0.025 + q * 1.4, y * 0.22 + q, 4, MW * 0.025);
        }
    }
    // --- thin high cloud, streaked and lit from below by the sun -------------
    const CW = 640, CR = 34;
    const cloud = new Float32Array(CW * CR);
    for (let r = 0; r < CR; r++) {
        for (let x = 0; x < CW; x++) {
            const y = r + 0.5;
            const q = fbm(x * 0.0125, y * 0.12, 2, 8);
            const c = fbm(x * 0.025 + q * 2, y * 0.2 + q * 0.8, 4, 16);
            cloud[r * CW + x] = smooth(0.52, 0.7, c - 0.06 * Math.abs(y - 18) / 10) * smooth(5, 13, y) * smooth(33, 24, y);
        }
    }
    // a faint large-scale unevenness, so the open sky and the deep water are
    // never one flat halftone screen
    const hz = new Float32Array(N);
    for (let k = 0; k < N; k++)
        hz[k] = fbm((k % W) * 0.03, Math.floor(k / W) * 0.06, 3, 0);
    // the sky's colour at a point, for the sky itself and as haze on the peaks
    const skyR = new Float32Array(SR * W), skyG = new Float32Array(SR * W), skyB = new Float32Array(SR * W);
    const glowA = new Float32Array(SR * W);
    for (let r = 0; r < SR; r++) {
        for (let x = 0; x < W; x++) {
            const y = r + 0.5;
            const v = clamp(y / 52);
            const east = smooth(20, 190, x);
            const dx = x + 0.5 - SUN[0], dy = (y - SUN[1]) * 2.2;
            const ds = Math.sqrt(dx * dx + dy * dy);
            const low = Math.pow(v, 1.9);
            // indigo overhead, a soft unevenness in it, then a pale lilac and rose
            // band behind the range, lighter than the mountains' shadowed flanks
            const veil = (hz[r * W + x] - 0.5) * 0.1 * (1 - v);
            let cr = 0.03 + veil + low * (0.56 + 0.2 * east);
            let cg = 0.04 + veil + low * (0.48 + 0.02 * east);
            let cb = 0.13 + veil * 1.6 + low * (0.62 - 0.12 * east);
            skyR[r * W + x] = cr;
            skyG[r * W + x] = cg;
            skyB[r * W + x] = cb;
            // the sun's glow, kept apart so it can breathe
            glowA[r * W + x] = Math.exp(-ds / 6) * 0.65 + Math.exp(-ds / 15) * 0.2 + Math.exp(-ds / 50) * 0.1;
        }
    }
    const AR = new Float32Array(SR * W), AG = new Float32Array(SR * W), AB = new Float32Array(SR * W);
    const FR = new Float32Array(N), FG = new Float32Array(N), FB = new Float32Array(N);
    const floor = new Float32Array(N);
    const fade = new Float32Array(N).fill(1);
    const wisp = new Float32Array(W);
    return (t, { color } = {}) => {
        const warm = 0.75 - 0.5 * Math.exp(-t / 60); // rose first light warming toward gold
        const line = 6 + 4 * Math.exp(-t / 70); // the sunlit line creeps down the slopes
        const drift = t * 1.1;
        const pulse = 1 + 0.06 * Math.sin((t / 8) * Math.PI * 2); // the sun's glow breathes
        for (let x = 0; x < W; x++)
            wisp[x] = noise((x + drift * 0.6) * 0.06, 3.7, 0);
        // the warm light, from rose toward gold
        const lr = 1, lg = mix(0.6, 0.8, warm), lb = mix(0.55, 0.4, warm);
        for (let r = 0; r < SR; r++) {
            const y = r + 0.5;
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                const gl = glowA[k] * pulse;
                const gg = 0.62 + 0.28 * smooth(0.15, 0.7, gl); // gold at the core, rose further out
                let cr = skyR[k] + gl, cg = skyG[k] + gl * gg, cb = skyB[k] + gl * (gg - 0.22), fl = 0.21;
                const z = depth[k];
                if (z) {
                    const sn = snow[k];
                    const lit = sun[k] * smooth(line, line + 7, alt[k]);
                    const amb = (0.55 + 0.45 * up[k]) * (0.55 + 0.5 * smooth(4, 34, alt[k]));
                    // snow: deep blue in shadow, rose to gold in the sun, ending sharply
                    const sl = smooth(0.08, 0.24, lit);
                    // full on faces and summits glow gold, glancing light stays rose
                    const gold = clamp(0.6 * smooth(0.25, 0.8, lit) + 0.5 * smooth(14, 36, alt[k]));
                    const br = 0.78 + 0.3 * lit;
                    const sr = mix(0.13 * amb, lr * br, sl);
                    const sg = mix(0.17 * amb, mix(lg - 0.12, lg + 0.14, gold) * br, sl);
                    const sb = mix(0.36 * amb, mix(lb + 0.02, lb + 0.12, gold) * br, sl);
                    // rock: slate in shadow, warm umber in the sun
                    const rr = mix(0.06, 0.4, sl), rg = mix(0.07, 0.2, sl), rb = mix(0.14, 0.2, sl);
                    cr = mix(rr, sr, sn);
                    cg = mix(rg, sg, sn);
                    cb = mix(rb, sb, sn);
                    // forested foothills
                    const wood = smooth(9, 4, alt[k]) * smooth(110, 75, z);
                    cr = mix(cr, 0.07, wood);
                    cg = mix(cg, 0.09, wood);
                    cb = mix(cb, 0.18, wood);
                    // distance hazes toward the sky behind, and haze settles in the
                    // far valleys so each ridge stands clear of the one behind it
                    const fog = smooth(16, 3, alt[k]) * smooth(70, 150, z) * 0.6;
                    const haze = Math.max(fog, clamp(1 - Math.exp(-(z - SHORE_Z) / 260)) * 0.45);
                    cr = mix(cr, skyR[k] + gl, haze);
                    cg = mix(cg, skyG[k] + gl * gg, haze);
                    cb = mix(cb, skyB[k] + gl * (gg - 0.22), haze);
                    // the first light catches the crest itself in a bright line
                    if (rim[k] && sl > 0.3) {
                        const a = rim[k] * sl;
                        cr = mix(cr, 1, a);
                        cg = mix(cg, mix(0.89, 0.95, warm), a);
                        cb = mix(cb, mix(0.76, 0.88, warm), a);
                    }
                    // the shadowed range still carries a dim blue screen; the wooded
                    // foothills in front of it drop away to near black
                    fl = mix(mix(0.42, 0.3, wood), 0.04, sl);
                }
                else {
                    // a few stars still out in the west
                    if (y < 34 && hash(x, r * 3 + 11) > 0.985) {
                        const tw = 0.6 + 0.4 * Math.sin(t * (1.5 + hash(x, r) * 3) + hash(r, x) * 6.28);
                        const s = tw * smooth(150, 40, x) * smooth(34, 6, y) * 0.75;
                        cr = Math.max(cr, s * 0.9);
                        cg = Math.max(cg, s * 0.92);
                        cb = Math.max(cb, s);
                    }
                    // high cloud, rose-gold toward the sun and mauve away from it
                    if (r < CR) {
                        const sx = x + t * 0.8, ix = Math.floor(sx), fx = sx - ix;
                        const c0 = cloud[r * CW + (ix % CW)], c1 = cloud[r * CW + ((ix + 1) % CW)];
                        const c = (c0 + (c1 - c0) * fx) * (0.35 + 0.65 * smooth(40, 150, x));
                        if (c > 0.01) {
                            const g = Math.exp(-Math.hypot(x + 0.5 - SUN[0], (y - SUN[1]) * 1.6) / 55);
                            const b = clamp(0.25 + 0.9 * g);
                            const kr = mix(0.32, 1, b), kg = mix(0.24, mix(0.62, 0.74, warm), b), kb = mix(0.4, 0.5, b);
                            cr = mix(cr, kr, c * 0.75);
                            cg = mix(cg, kg, c * 0.75);
                            cb = mix(cb, kb, c * 0.75);
                        }
                    }
                    // the sun, just clearing the ridge
                    const dx = x + 0.5 - SUN[0], dy = y - SUN[1];
                    const ds = Math.sqrt(dx * dx + dy * dy);
                    if (ds < 4.5) {
                        const a = smooth(4.5, 3.3, ds);
                        cr = mix(cr, 1, a);
                        cg = mix(cg, 0.96, a);
                        cb = mix(cb, 0.86, a);
                    }
                }
                // mist pooled in the valley behind the shore, lit rose toward the sun
                const e = smooth(20, 170, x) * (0.6 + 0.4 * warm);
                const near = Math.exp(-Math.abs(x + 0.5 - SUN[0]) / 22) * 0.3;
                const mr = mix(0.48, 0.9, e) + near, mg = mix(0.46, 0.7, e) + near * 0.75, mb = mix(0.7, 0.7, e) + near * 0.5;
                if (r >= M0) {
                    const m = mist[(r - M0) * MW + (Math.floor(x + drift) % MW)];
                    // a ragged top edge: the sheet heaves in long swells and small tufts
                    const edge = 5 * (m - 0.5) + 4 * (wisp[x] - 0.5);
                    const band = smooth(M0 + 14, SHORE - 3, y + edge);
                    const a = (0.3 + 0.7 * smooth(0.32, 0.64, m)) * band * 0.6;
                    cr = mix(cr, mr, a);
                    cg = mix(cg, mg, a);
                    cb = mix(cb, mb, a);
                    if (a > 0.05)
                        fl = Math.max(fl, 0.2);
                }
                if (y >= treeTop[x]) {
                    // the far shore's pines, dark against the mist
                    const s = 0.4 + 0.6 * hash(x * 7, r * 3);
                    cr = 0.04 + 0.03 * s;
                    cg = 0.06 + 0.04 * s;
                    cb = 0.1 + 0.05 * s;
                    fl = 0;
                    // and low wisps drifting across their feet
                    const m = mist[(r - M0) * MW + (Math.floor(x * 0.7 + drift * 1.9 + 211) % MW)];
                    const a = smooth(0.45, 0.72, m) * smooth(treeTop[x] + 1, SHORE, y) * 0.6;
                    cr = mix(cr, mr, a);
                    cg = mix(cg, mg, a);
                    cb = mix(cb, mb, a);
                }
                AR[k] = cr;
                AG[k] = cg;
                AB[k] = cb;
                FR[k] = cr;
                FG[k] = cg;
                FB[k] = cb;
                floor[k] = fl;
            }
        }
        // the lake: the picture above, shaken a little by slow ripples
        for (let r = SHORE; r < H; r++) {
            const y = r + 0.5;
            const d = (y - SHORE) / LR;
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                const w1 = noise(x * 0.045 + t * 0.06, y * 0.5 - t * 0.35, 0);
                const w2 = noise(x * 0.12 - t * 0.1, y * 1.1 - t * 0.7, 0);
                const sway = (w1 - 0.5) * (0.4 + 1.4 * d) + (w2 - 0.5) * 0.5;
                const sx = Math.max(0, Math.min(W - 1, Math.round(x + sway)));
                const sr = Math.max(0, Math.min(SR - 1, Math.round(src[(r - SHORE) * W + x] + (w2 - 0.5) * 0.6 * d)));
                const sk = sr * W + sx;
                const refl = 0.68 - 0.32 * d;
                const w3 = noise(x * 0.03 + t * 0.04, y * 1.9 - t * 0.45, 0);
                const lift = 1 + (w3 - 0.5) * (0.4 + 0.5 * d); // long, faint ripple lines
                // the water gives back a little less colour than it was sent
                const ar = AR[sk], ag = AG[sk], ab = AB[sk];
                const grey = (ar + ag + ab) / 3;
                const deep = (hz[k] - 0.5) * 0.1 * d; // slow unevenness in the dark water
                let cr = 0.02 + deep + mix(grey, ar, 0.75) * refl * lift;
                let cg = 0.035 + deep + mix(grey, ag, 0.75) * refl * lift;
                let cb = 0.07 + deep * 1.6 + mix(grey, ab, 0.75) * refl * lift;
                // the sun's road
                const roadW = 1.5 + (y - SHORE) * 0.45;
                const road = Math.exp(-(((x + 0.5 - SUN[0]) / roadW) ** 2));
                const glint = smooth(0.55, 0.85, w2) * road * (0.5 + 0.5 * warm);
                cr += glint;
                cg += glint * 0.8;
                cb += glint * 0.6;
                FR[k] = cr;
                FG[k] = cg;
                FB[k] = cb;
                floor[k] = 0.26;
                fade[k] = smooth(H + 2, H - 22, y);
                if (r === SHORE) {
                    // a dark seam where the shore meets the water
                    FR[k] = 0.06;
                    FG[k] = 0.12;
                    FB[k] = 0.14;
                    floor[k] = 0;
                }
            }
        }
        // the near pines and the bank, black against it all, rimmed on the sun side
        for (let k = 0; k < N; k++) {
            if (!fg[k])
                continue;
            const s = fgShade[k];
            FR[k] = 0.02 + 0.05 * s;
            FG[k] = 0.04 + 0.06 * s;
            FB[k] = 0.05 + 0.06 * s;
            floor[k] = 0;
            const e = fgRim[k];
            if (e > 0 && s === 1) {
                // warm on the side facing the sun
                FR[k] = mix(FR[k], 0.62, e), FG[k] = mix(FG[k], 0.4, e), FB[k] = mix(FB[k], 0.38, e);
                floor[k] = 0.12 * e;
            }
            else if (e > 0 && s === 0.5) {
                // cool lilac from the sky on the other
                FR[k] = mix(FR[k], 0.2, e), FG[k] = mix(FG[k], 0.22, e), FB[k] = mix(FB[k], 0.36, e);
                floor[k] = 0.22 * e;
            }
            fade[k] = 1;
        }
        for (let r = 0; r < H; r++) {
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                const cr = FR[k], cg = FG[k], cbl = FB[k], fl = floor[k];
                const peak = Math.max(cr, cg, cbl, 1e-4);
                const level = clamp(fl + (1 - fl) * Math.pow(peak, 1.1)) * fade[k];
                const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
                out[k] = DOTS[step];
                if (color) {
                    const want = step ? Math.min(1, (level + 0.06) / COVER[step]) : 0;
                    // dim cells keep some of their darkness in the colour too, so the
                    // shadows sit back in deep blues rather than as a bright fine screen
                    const s = ((0.3 + 0.7 * want) * mix(0.5, 1, smooth(0.08, 0.5, peak))) / peak;
                    color[k] = nearest(clamp(cr * s), clamp(cg * s), clamp(cbl * s));
                }
            }
        }
        const lines = [];
        for (let r = 0; r < H; r++)
            lines.push(out.slice(r * W, (r + 1) * W).join(""));
        return lines.join("\n");
    };
}

    return { meta: meta, make: alpineDawn };
  })();

  // -------------------------------------------------------------
  // Scene: kyoto-dusk
  // -------------------------------------------------------------
  SCENES["kyoto-dusk"] = (function () {
const meta = {
    name: "kyoto dusk",
    category: "scenes",
    note: "a pagoda at dusk behind a cherry tree lit by a stone lantern",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 15,
    ground: "#0b0a16",
    palette: [
        "#1c1d4a", "#262759", "#33316b", "#433d7c", "#574a8c", "#6e5a9a",
        "#8a5a92", "#a8668f", "#c4748f", "#db8a95", "#ec9f9c", "#f6b8a8", "#fbd0b8",
        "#fff1d8", "#fffaf0", "#7e5f9e",
        "#f9d3dc", "#f2b2c4", "#e28fab", "#c66e92", "#9c5279", "#74405f",
        "#ffd9a0", "#ffbb6a", "#f29a4a", "#d0763a", "#a35a35",
        "#2a2240", "#3a2c50", "#4a3860",
        "#5b4f86", "#7a6aa0",
        "#2c3a3a", "#3d4c46", "#56604f",
        "#9a6aa0", "#b47ea6",
        "#4a3038", "#6a4448",
        "#2b3a6a", "#3e4f86",
    ],
};
const W = 200, H = 100;
const SHORE = 80; // the far bank of the pond, where the pagoda stands
const PX = 141; // the pagoda's axis
const MOON = [176, 17];
const LX = 53, LB = 98, LS = 1.8; // the lantern's axis, foot and scale
const LAMP = [LX, LB - (LB - 83) * LS]; // its lit opening
const DOTS = " ·•●";
const COVER = [0, 0.3, 0.6, 1];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
const SKY = 0, HILL = 1, TOWN = 2, PAGODA = 3, POND = 4, BANK = 5, TREE = 6, BLOOM = 7, STONE = 8, FLAME = 9;
function hash(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
        x0 = ((xi % period) + period) % period;
        x1 = (x0 + 1) % period;
    }
    const a = hash(x0, yi), b = hash(x1, yi), c = hash(x0, yi + 1), d = hash(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, octaves, period) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
        s += amp * noise(x * f, y * f, period * f);
        n += amp;
        amp *= 0.5;
        f *= 2;
    }
    return s / n;
}
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => {
    const k = clamp((v - a) / (b - a));
    return k * k * (3 - 2 * k);
};
const mix = (a, b, k) => a + (b - a) * k;
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
// distance from a point to a segment, and how far along it the nearest point is
function seg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const k = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy));
    const ex = ax + dx * k - px, ey = ay + dy * k - py;
    return [Math.sqrt(ex * ex + ey * ey), k];
}
/*
 * The pagoda, in cells about its axis: returns a shade code or 0 for air.
 * 1 body, 2 roof top, 3 roof underside, 4 roof rim, 5 spire, 6 lit doorway.
 */
const EAVE = [68.5, 58, 48.5, 40, 32.5]; // where each roof's eave sits
const ROOF = [14.5, 13.4, 12.3, 11.2, 10.1]; // each roof's half-width
const BODY = [6.4, 5.9, 5.4, 4.9, 4.4];
function pagoda(dx, y) {
    const ax = Math.abs(dx);
    // stone base
    if (y >= 76 && y < SHORE + 0.5)
        return ax <= 9.5 - (y < 77 ? 1 : 0) ? 1 : 0;
    for (let i = 0; i < 5; i++) {
        const e = EAVE[i], R = ROOF[i];
        // a roof: thin at its upturned tips, rising in a shallow concave curve to the body
        const u = ax / R;
        if (u <= 1) {
            const lift = 3.5 * u * u * u * u;
            const bottom = e - lift + 0.6;
            const top = e - lift - 1.2 - 3.6 * Math.pow(1 - u, 1.7);
            if (y >= top && y < bottom) {
                if (y < top + 0.9)
                    return 4;
                if (y > bottom - 1.0)
                    return 3;
                return 2;
            }
        }
        // the storey beneath this roof, up from the roof below it (or the base)
        const floor = i === 0 ? 76 : EAVE[i - 1] - 3.6;
        if (y >= e + 0.6 && y < floor && ax <= BODY[i]) {
            if (i === 0 && ax <= 1 && y > 72 && y < 75.5)
                return 6;
            // a railed balcony under each roof
            if (y < e + 2 && ax <= BODY[i] + 1.2)
                return 3;
            return 1;
        }
        if (i > 0 && y >= e + 0.6 && y < e + 2 && ax <= BODY[i] + 1.2)
            return 3;
    }
    // the spire: a mast with nine rings and a flame-shaped finial
    const top = EAVE[4] - 1.2 - 3.6 - 0.2;
    if (y < top && y >= 9) {
        if (y >= top - 1.5)
            return ax <= 2.4 ? 3 : 0; // the roof box
        if (y >= 15 && y < top - 1.5) {
            const ring = Math.floor((y - 15) / 1.2) & 1;
            return ax <= (ring ? 1.4 : 0.55) ? 5 : 0;
        }
        if (y >= 12)
            return ax <= 1.3 - (y - 12) * 0.2 ? 5 : 0;
        return ax <= 0.6 ? 5 : 0;
    }
    return 0;
}
function kyotoDusk() {
    const P = meta.palette.map(hex);
    const N = W * H;
    const out = new Array(N);
    const lut = new Uint8Array(32768).fill(255);
    const nearest = (r, g, b) => {
        const k = (Math.min(31, (r * 31.99) | 0) << 10) | (Math.min(31, (g * 31.99) | 0) << 5) | Math.min(31, (b * 31.99) | 0);
        if (lut[k] !== 255)
            return lut[k];
        let best = 0, bd = 1e9;
        for (let i = 0; i < P.length; i++) {
            const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
            const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
            if (d < bd)
                (bd = d), (best = i);
        }
        return (lut[k] = best);
    };
    const mat = new Uint8Array(N);
    const R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N);
    const floorA = new Float32Array(N).fill(0.12);
    const warmth = new Float32Array(N); // how much of the lantern's light each cell takes
    // --- sky ----------------------------------------------------------------
    const skyAt = (x, y) => {
        const v = clamp(y / SHORE);
        // indigo overhead, through violet, to rose and peach low in the west (left)
        const west = Math.exp(-Math.abs(x - 80) / 120);
        let a = smooth(0, 0.5, v);
        let r = mix(0.07, 0.22, a), g = mix(0.07, 0.14, a), b = mix(0.25, 0.38, a);
        a = smooth(0.42, 0.86, v);
        r = mix(r, 0.52, a), g = mix(g, 0.32, a), b = mix(b, 0.58, a);
        a = smooth(0.78, 0.98, v) * (0.55 + 0.45 * west);
        r = mix(r, 1.0, a), g = mix(g, 0.62, a), b = mix(b, 0.48, a);
        const band = Math.exp(-Math.abs(y - 74) / 4) * west * 0.18;
        r += band, g += band * 0.66, b += band * 0.45;
        // a faint unevenness, so no stretch of sky is one flat tone
        const veil = 0.86 + 0.28 * fbm(x * 0.035, y * 0.09, 3, 0);
        r *= veil, g *= veil, b *= veil;
        // the moon's halo
        const dx = x - MOON[0], dy = y - MOON[1];
        const d = Math.sqrt(dx * dx + dy * dy);
        const halo = Math.exp(-d / 5) * 0.24 + Math.exp(-d / 16) * 0.07;
        r += halo * 0.75, g += halo * 0.72, b += halo;
        return [r, g, b];
    };
    // --- the far side: hills, town roofs, the pagoda -------------------------
    // low in the west where the glow is, rising behind the pagoda and the town
    const hillA = (x) => 77.5 - (3 + 13 * smooth(70, 175, x)) * (0.3 + 1.1 * fbm(x * 0.022 + 3, 1, 4, 0));
    const hillB = (x) => 77 - 2.5 * fbm(x * 0.04 + 9, 2, 4, 0);
    // low tiled roofs along the far bank, a few lit
    const town = (x) => {
        const i = Math.floor((x + 3) / 11);
        const f = (x + 3) / 11 - i;
        // a hipped roof: a short level ridge, sloping ends, a gap between houses
        const h = 2 + hash(i, 5) * 2.5;
        const e = Math.abs(f - 0.5) * 2;
        return e > 0.86 ? SHORE : SHORE - 1 - h + Math.max(0, e - 0.35) * 6;
    };
    // --- the cherry tree's skeleton ----------------------------------------
    const branches = [
        // trunk, leaning up and to the right
        [16, 101, 20, 86, 5.2, 4.4], [20, 86, 27, 70, 4.4, 3.6], [27, 70, 31, 58, 3.6, 3],
        // limbs
        [31, 58, 50, 46, 3, 2.1], [50, 46, 74, 37, 2.1, 1.4], [74, 37, 98, 31, 1.4, 0.9], [98, 31, 116, 30, 0.9, 0.5],
        [31, 58, 24, 40, 2.6, 1.8], [24, 40, 12, 26, 1.8, 1.1], [12, 26, 0, 18, 1.1, 0.7],
        [29, 50, 42, 30, 2, 1.3], [42, 30, 52, 19, 1.3, 0.8], [52, 19, 70, 13, 0.8, 0.5],
        [50, 46, 60, 52, 1.2, 0.7], [74, 37, 86, 44, 1, 0.5], [42, 30, 66, 24, 1, 0.6], [66, 24, 90, 21, 0.6, 0.4],
        [24, 40, 34, 25, 1, 0.6], [12, 26, 6, 16, 0.7, 0.4], [98, 31, 104, 40, 0.6, 0.35],
        // sprays drooping low over the lantern
        [40, 51, 44, 58, 1.1, 0.4], [58, 43, 62, 55, 0.9, 0.35], [70, 38, 76, 47, 0.7, 0.3],
    ];
    // short twigs off every limb, reaching up and out
    const limbs = branches.length;
    for (let b = 3; b < limbs; b++) {
        const [ax, ay, bx, by, w0, w1] = branches[b];
        const ang = Math.atan2(by - ay, bx - ax);
        for (let j = 0; j < 3; j++) {
            const k = 0.25 + 0.65 * hash(b * 7 + j, 31);
            const sx = mix(ax, bx, k), sy = mix(ay, by, k);
            const turn = (j & 1 ? 1 : -1) * (0.5 + 0.6 * hash(b, j + 40));
            const len = 4 + 7 * hash(b + j, 41);
            const a2 = ang + turn - 0.25;
            branches.push([sx, sy, sx + Math.cos(a2) * len, sy + Math.sin(a2) * len, mix(w0, w1, k) * 0.55, 0.3]);
        }
    }
    // blossom clumps all along the limbs and twigs, thickest at their ends
    const clusters = [];
    for (let b = 3; b < branches.length; b++) {
        const [ax, ay, bx, by, w0] = branches[b];
        const len = Math.hypot(bx - ax, by - ay);
        const n = 1 + Math.round(len / 1.7);
        for (let i = 0; i <= n; i++) {
            const k = i / n;
            if (k < 0.3 && w0 > 2)
                continue;
            const h1 = hash(b * 13 + i, 7), h2 = hash(b * 5 + i, 11), h3 = hash(b * 3 + i, 17);
            const cx = mix(ax, bx, k) + (h1 - 0.5) * 6, cy = mix(ay, by, k) + (h2 - 0.5) * 4.5 - 1;
            // only the drooping sprays (and their twigs) hang below the crown
            const spray = (b >= limbs - 3 && b < limbs) || b >= limbs + 3 * (limbs - 6);
            // the crown is domed: thinner toward its top, never cut by the frame
            const dome = 9 + 10 * Math.pow(clamp(Math.abs(cx - 52) / 70), 1.6);
            if (cx > 122 || cy < dome || cy > (spray ? 55 : 47))
                continue;
            clusters.push([cx, cy, 1.4 + 1.6 * h3 + 0.8 * k]);
        }
    }
    const bankX = (y) => 38 + (y - SHORE) * 2.3 + 4 * fbm(y * 0.2, 4, 2, 0);
    // build the static picture
    for (let r = 0; r < H; r++) {
        for (let x = 0; x < W; x++) {
            const k = r * W + x;
            const y = r + 0.5, xc = x + 0.5;
            let m = SKY, cr, cg, cb, fl = 0.12, warm = 0;
            if (y < SHORE) {
                [cr, cg, cb] = skyAt(xc, y);
                fl = 0.04;
                // distant hills in haze, then a nearer ridge
                if (y >= hillA(xc)) {
                    // the Higashiyama hills, flat and violet in the haze
                    m = HILL;
                    const s = skyAt(xc, hillA(xc));
                    const d = smooth(hillA(xc), hillA(xc) + 8, y);
                    // wooded slopes: clumps of trees in the haze
                    const tex = fbm(xc * 0.3, y * 0.45, 3, 0);
                    const a = 0.6 + 0.2 * d + 0.25 * (tex - 0.5);
                    cr = mix(s[0], 0.14, a), cg = mix(s[1], 0.08, a), cb = mix(s[2], 0.24, a);
                    // the ridge line catches the afterglow
                    const lip = smooth(hillA(xc) + 1.4, hillA(xc), y) * 0.3;
                    cr = mix(cr, s[0] * 1.1, lip), cg = mix(cg, s[1] * 1.05, lip), cb = mix(cb, s[2], lip);
                }
                if (y >= hillB(xc)) {
                    m = HILL;
                    const tex = fbm(xc * 0.3, y * 0.3, 3, 0);
                    cr = 0.1 + 0.05 * tex, cg = 0.07 + 0.03 * tex, cb = 0.17 + 0.05 * tex;
                    // mist settling along the water
                    const mist = smooth(hillB(xc) + 1, SHORE, y) * 0.5;
                    cr = mix(cr, 0.7, mist), cg = mix(cg, 0.44, mist), cb = mix(cb, 0.58, mist);
                }
                if (y >= town(xc) && xc > 70) {
                    m = TOWN;
                    cr = 0.08, cg = 0.06, cb = 0.14;
                    // the roof ridges catch the sky
                    const tf = Math.abs(((xc + 3) / 11) % 1 - 0.5) * 2;
                    if (y < town(xc) + 0.9 && tf < 0.45)
                        (cr = 0.5), (cg = 0.31), (cb = 0.44), (fl = 0.06);
                    // a few lit shoji under the eaves
                    const wi = Math.floor(xc / 4);
                    if (y > SHORE - 1.6 && y < SHORE - 0.5 && (xc % 4) < 1.2 && hash(wi, 7) > 0.74) {
                        (cr = 1), (cg = 0.66), (cb = 0.32);
                        fl = 0.3;
                    }
                }
                const p = pagoda(xc - PX, y);
                if (p) {
                    m = PAGODA;
                    const dx = xc - PX;
                    const rim = Math.exp(-Math.abs(dx + 4) / 30); // the sky to the west lights its left
                    // dark timber; the tiled roofs pick up the sky, their ridges most of all
                    if (p === 1)
                        (cr = 0.07), (cg = 0.05), (cb = 0.12);
                    else if (p === 2)
                        (cr = 0.2 + 0.08 * rim), (cg = 0.13 + 0.03 * rim), (cb = 0.27 + 0.04 * rim);
                    else if (p === 3)
                        (cr = 0.05), (cg = 0.04), (cb = 0.1);
                    else if (p === 4)
                        (cr = 0.9 * rim + 0.25), (cg = 0.5 * rim + 0.15), (cb = 0.5 * rim + 0.3);
                    else if (p === 5)
                        (cr = 0.3 + 0.2 * (dx < 0 ? 1 : 0)), (cg = 0.22), (cb = 0.32);
                    else if (p === 6)
                        (cr = 0.7), (cg = 0.42), (cb = 0.24), (fl = 0.2);
                }
            }
            else {
                // the pond, and the near bank where the lantern stands
                if (xc < bankX(y)) {
                    m = BANK;
                    const tex = fbm(xc * 0.3, y * 0.5, 3, 0);
                    cr = 0.08 + 0.05 * tex, cg = 0.08 + 0.05 * tex, cb = 0.1 + 0.05 * tex;
                    // fallen petals on the moss
                    if (hash(x * 7, r * 3) > 0.975 - 0.015 * smooth(SHORE + 4, H, y))
                        (cr = 0.42), (cg = 0.22), (cb = 0.3), (fl = 0.06);
                    // the stone lip of the pond
                    if (xc > bankX(y) - 2.6) {
                        const s = 0.85 + 0.3 * hash(x * 3, r * 5);
                        (cr = 0.45 * s), (cg = 0.38 * s), (cb = 0.46 * s), (fl = 0.1);
                    }
                    warm = 1;
                }
                else
                    m = POND;
            }
            mat[k] = m;
            R[k] = cr || 0, G[k] = cg || 0, B[k] = cb || 0;
            floorA[k] = fl;
            warmth[k] = warm;
        }
    }
    // the reflection source: the far side before the tree covers it
    const RR = R.slice(), RG = G.slice(), RB = B.slice(), RM = mat.slice();
    // --- the stone lantern ----------------------------------------------------
    const lantern = (dx, y) => {
        const ax = Math.abs(dx);
        if (y >= 93.5 && y < LB)
            return ax <= 4.2 - (y < 94.5 ? 0.8 : 0) ? 1 : 0; // foot
        if (y >= 87 && y < 93.5)
            return ax <= 1.4 ? 1 : 0; // post
        if (y >= 85.5 && y < 87)
            return ax <= 3.6 - (y < 86.2 ? 0.6 : 0) ? 1 : 0; // platform
        if (y >= 80 && y < 85.5) {
            if (ax <= 1.7 && y >= 80.8 && y < 84.8)
                return 2; // lit opening
            return ax <= 2.9 ? 1 : 0;
        }
        if (y >= 76.5 && y < 80) {
            // the roof, flaring out with upturned corners
            const u = (80 - y) / 3.5;
            const hw = 5.6 - 4.1 * Math.pow(u, 0.8) + (y > 79.2 ? 0.6 : 0);
            return ax <= hw ? 3 : 0;
        }
        if (y >= 73.5 && y < 76.5)
            return ax <= 1.3 - Math.abs(y - 75) * 0.25 ? 3 : ax <= 0.5 ? 3 : 0; // finial
        return 0;
    };
    // drawn a size up from its plan, standing on the bank
    const at = (xc, y) => lantern((xc - LX) / LS, LB - (LB - y) / LS);
    for (let r = 45; r < H; r++) {
        for (let x = LX - 14; x <= LX + 14; x++) {
            const y = r + 0.5, xc = x + 0.5;
            const l = at(xc, y);
            if (!l)
                continue;
            const k = r * W + x;
            const py = LB - (LB - y) / LS, pdx = (xc - LX) / LS;
            if (l === 2) {
                mat[k] = FLAME;
                // hottest at the heart of the firebox
                const c = Math.exp(-(pdx * pdx * 0.5 + (py - 82.8) * (py - 82.8) * 0.35));
                (R[k] = 0.85 + 0.15 * c), (G[k] = 0.5 + 0.38 * c), (B[k] = 0.2 + 0.4 * c * c), (floorA[k] = 0.35);
            }
            else {
                mat[k] = STONE;
                // dark granite, its top surfaces catching the last of the sky
                const g = 0.8 + 0.4 * hash(x * 5, r * 3);
                const edge = !at(xc, y - 1) ? 1 : 0;
                (R[k] = (0.05 + 0.22 * edge) * g), (G[k] = (0.04 + 0.14 * edge) * g), (B[k] = (0.08 + 0.2 * edge) * g);
                // the roof's underside and the platform take the flame's light
                const under = (l === 3 && py > 78.6) || (py >= 85.5 && py < 86.4);
                if (under) {
                    const f = Math.exp(-Math.abs(py - 82.8) / 3) * 0.75;
                    (R[k] += f), (G[k] += f * 0.5), (B[k] += f * 0.18);
                }
                floorA[k] = 0.02;
            }
            warmth[k] = l === 2 ? 0 : 0.75;
        }
    }
    // --- the cherry tree -------------------------------------------------------
    for (let r = 0; r < H; r++) {
        for (let x = 0; x < 130; x++) {
            const k = r * W + x;
            const y = r + 0.5, xc = x + 0.5;
            // blossom density: soft clouds, broken up by noise into clumps
            let d = 0, best = 0, up = 0;
            for (const [cx, cy, rad] of clusters) {
                const dx = xc - cx, dy = (y - cy) * 1.15;
                const q = (dx * dx + dy * dy) / (rad * rad);
                if (q < 3) {
                    const c = Math.exp(-q * 1.4);
                    d += c;
                    if (c > best)
                        (best = c), (up = (dy + dx * 0.4) / rad);
                }
            }
            // big holes where the sky shows through, small ones between clumps
            const n = fbm(xc * 0.11, y * 0.15, 3, 0), n2 = noise(xc * 0.5, y * 0.6, 0);
            const bloom = (1 - Math.exp(-d * 1.5)) * (0.15 + 1.35 * n) * (0.75 + 0.5 * n2);
            let onBranch = false, bw = 0;
            for (const [ax, ay, bx, by, w0, w1] of branches) {
                const [dist, kk] = seg(xc, y, ax, ay, bx, by);
                const w = mix(w0, w1, kk) * 0.5 + 0.15;
                if (dist < w) {
                    onBranch = true;
                    bw = Math.max(bw, (dist / w) * (xc < ax + (bx - ax) * kk ? -1 : 1));
                }
            }
            if (onBranch && bloom < 0.85) {
                mat[k] = TREE;
                // dark bark threading through the blossom; the side toward the lantern catches it
                const lit = smooth(0.35, 1, bw);
                (R[k] = 0.05 + 0.03 * lit), (G[k] = 0.035 + 0.01 * lit), (B[k] = 0.07);
                floorA[k] = 0;
                warmth[k] = 0.8;
            }
            else if (bloom > 0.5) {
                mat[k] = BLOOM;
                // each spray pale pink on top where the sky lights it, deep rose beneath
                const inner = hash(x * 3, r * 7);
                let b = clamp(0.62 - 0.6 * up + 0.26 * (inner - 0.5) - 0.3 * smooth(0.75, 0.5, bloom));
                b = mix(b, 0.12, smooth(0.3, 1.1, up));
                // the lower crown sits in its own shade
                b *= 1 - 0.3 * smooth(28, 48, y);
                (R[k] = 0.34 + 0.64 * b), (G[k] = 0.08 + 0.62 * b * b), (B[k] = 0.2 + 0.5 * b);
                floorA[k] = 0.1;
                warmth[k] = 1;
            }
        }
    }
    // the lantern's light: how far each cell sits from the lit opening
    const glow = new Float32Array(N);
    for (let r = 0; r < H; r++)
        for (let x = 0; x < W; x++) {
            const dx = x + 0.5 - LAMP[0], dy = (r + 0.5 - LAMP[1]) * 1.1;
            const d = Math.sqrt(dx * dx + dy * dy);
            glow[r * W + x] = Math.exp(-d / 4) * 0.6 + Math.exp(-d / 11) * 0.32 + Math.exp(-d / 32) * 0.1;
            // the blossom overhead takes the lamp's light from below, from further off
            const m = mat[r * W + x];
            if (m === BLOOM || m === TREE)
                glow[r * W + x] += Math.exp(-d / 11) * 1.6;
            // and a pool of light on the moss round its foot
            if (m === BANK) {
                const px = (x + 0.5 - LX) / 20, py = (r + 0.5 - LB + 3) / 8;
                glow[r * W + x] += Math.exp(-(px * px + py * py)) * 0.6;
            }
        }
    // a few faint stars in the indigo
    const stars = [];
    for (let i = 0; i < 400; i++) {
        const x = Math.floor(hash(i, 91) * W), r = Math.floor(hash(i, 92) * 40);
        const k = r * W + x;
        if (mat[k] === SKY && hash(i, 93) > 0.72)
            stars.push([k, hash(i, 94) * 6.28, 0.6 + hash(i, 95) * 1.6]);
    }
    // thin streaks of cloud low in the sky, dark violet, their undersides lit
    // by the set sun; they wrap so they can drift forever
    const CW = 500, C0 = 34, C1 = 68;
    const cdens = (x, y) => fbm(x * 0.014, y * 0.13, 4, CW * 0.014) - 0.3 * (1 - smooth(C0, C0 + 10, y) * smooth(C1, C1 - 8, y));
    const ccov = new Float32Array(CW * (C1 - C0)), clit = new Float32Array(CW * (C1 - C0));
    for (let r = C0; r < C1; r++)
        for (let x = 0; x < CW; x++) {
            const y = r + 0.5, d = cdens(x, y);
            ccov[(r - C0) * CW + x] = smooth(0.56, 0.7, d);
            clit[(r - C0) * CW + x] = clamp(0.5 + (d - cdens(x - 1, y + 2.2)) * 7);
        }
    // petals: each with its own drift, fall, sway and tumble
    const petals = [];
    for (let i = 0; i < 50; i++)
        petals.push({
            // most of them near the tree, thinning out downwind
            x: Math.pow(hash(i, 101), 2.2) * 140, y: hash(i, 102) * (H + 20),
            vx: 3 + hash(i, 103) * 4, vy: 1.6 + hash(i, 104) * 2.2,
            sw: 1 + hash(i, 105) * 2, sf: 0.6 + hash(i, 106) * 1.2, ph: hash(i, 107) * 6.28, tum: 2 + hash(i, 108) * 4,
        });
    // petals afloat on the pond, drifting slowly
    const floaters = [];
    for (let i = 0; i < 26; i++)
        floaters.push([hash(i, 111) * W, SHORE + 3 + hash(i, 112) * 20, 0.3 + hash(i, 113) * 0.5]);
    const dith = new Float32Array(N);
    for (let k = 0; k < N; k++)
        dith[k] = BAYER[((Math.floor(k / W)) & 3) * 4 + ((k % W) & 3)] * 0.4 + (hash(k, 77) - 0.5) * 0.5;
    const tone = new Float32Array(1025);
    for (let i = 0; i <= 1024; i++) {
        const v = i / 256;
        tone[i] = v < 0.75 ? v : 0.75 + 0.25 * (1 - Math.exp(-(v - 0.75) * 4));
    }
    const pr = new Float32Array(N), pg = new Float32Array(N), pb = new Float32Array(N);
    const pmask = new Uint8Array(N);
    return (t, { color } = {}) => {
        // the flame breathes, with now and then a gutter
        const flick = 0.82 + 0.1 * Math.sin(t * 7.3) * Math.sin(t * 3.1 + 1) + 0.12 * (noise(t * 4, 3.3, 0) - 0.5) * 2;
        const cdrift = (((t * 0.8) % CW) + CW) % CW;
        // petals in the air this frame
        pmask.fill(0);
        for (const p of petals) {
            const xx = ((((p.x + p.vx * t + p.sw * Math.sin(t * p.sf + p.ph)) % (W + 40)) + W + 40) % (W + 40)) - 20;
            const yy = ((((p.y + p.vy * t + 0.6 * Math.sin(t * p.sf * 1.7 + p.ph)) % (H + 20)) + H + 20) % (H + 20)) - 10;
            const x = Math.round(xx), r = Math.round(yy);
            if (x < 0 || x >= W || r < 0 || r >= H)
                continue;
            const k = r * W + x;
            // tumbling, catching light; dim against the dark bank and water
            const face = (0.55 + 0.45 * Math.abs(Math.sin(t * p.tum + p.ph))) * (mat[k] === POND || mat[k] === BANK ? 0.6 : 1);
            const lg = glow[k] * flick * 1.6;
            pr[k] = (1.0 * face + lg * 0.6), pg[k] = (0.76 * face + lg * 0.35), pb[k] = (0.84 * face + lg * 0.1);
            pmask[k] = 1;
        }
        for (let r = 0; r < H; r++) {
            const y = r + 0.5;
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                const m = mat[k];
                let cr, cg, cb, fl = floorA[k], fade = 1;
                if (m === POND) {
                    // the far side, upside down, shaken by small ripples
                    const depth = (y - SHORE) / (H - SHORE);
                    const wob = Math.sin(y * 1.7 - t * 2 + Math.sin(x * 0.13 + t * 0.6) * 1.4) * (0.05 + 0.8 * depth);
                    let sx = Math.round(x + wob);
                    sx = sx < 0 ? 0 : sx > W - 1 ? W - 1 : sx;
                    const w = noise(x * 0.14 + t * 0.2, y * 1.1 - t * 0.8, 0);
                    // ripples also tip the image up and down, so level lines break
                    // (drawn a little stretched, so the pagoda's lower roofs land in the pond)
                    let sr = Math.round(SHORE - 1 - (r - SHORE) * 1.35 + (w - 0.5) * 3 * depth);
                    sr = sr < 0 ? 0 : sr > SHORE - 1 ? SHORE - 1 : sr;
                    const j = sr * W + sx;
                    // crisp and bright right under the bank, darker further out
                    const lit = mix(0.95, 0.6, smooth(SHORE + 1, SHORE + 6, y)) * (0.8 + 0.4 * w);
                    cr = RR[j] * lit * 0.9, cg = RG[j] * lit * 0.92, cb = RB[j] * lit + 0.03;
                    const glint = smooth(0.74, 0.95, w) * 0.06;
                    cr += glint, cg += glint * 0.8, cb += glint;
                    // the lantern's light laid on the water as a broken warm streak
                    const sl = Math.exp(-Math.abs(x + 0.5 - LX - 9 - (y - SHORE) * 0.25) / (3.5 + depth * 3)) * smooth(0.45, 0.8, w) * 1.0 * flick;
                    cr += sl, cg += sl * 0.62, cb += sl * 0.25;
                    fade = smooth(H + 2, H - 9, y);
                }
                else {
                    cr = R[k], cg = G[k], cb = B[k];
                    if (m === SKY && r >= C0 && r < C1) {
                        const sx = x + cdrift, ix = Math.floor(sx), fx = sx - ix;
                        const i0 = (r - C0) * CW + (ix % CW), i1 = (r - C0) * CW + ((ix + 1) % CW);
                        const c = ccov[i0] + (ccov[i1] - ccov[i0]) * fx;
                        if (c > 0.01) {
                            const l = clit[i0] + (clit[i1] - clit[i0]) * fx;
                            // brighter undersides toward the west and the horizon
                            const sun = l * (0.45 + 0.55 * smooth(C0, C1, y)) * (0.6 + 0.4 * Math.exp(-Math.abs(x - 80) / 90));
                            const a = c * 0.85;
                            cr = mix(cr, mix(0.2, 1.0, sun), a), cg = mix(cg, mix(0.12, 0.58, sun), a), cb = mix(cb, mix(0.27, 0.5, sun), a);
                        }
                    }
                }
                // lamplight on everything near the lantern
                const wm = warmth[k];
                if (wm > 0) {
                    const g = glow[k] * flick * wm;
                    cr += g * 1.0, cg += g * 0.58, cb += g * 0.22;
                }
                else if (m === SKY || m === POND) {
                    const g = glow[k] * flick * 0.6;
                    cr += g, cg += g * 0.6, cb += g * 0.3;
                }
                if (m === FLAME) {
                    const f = 0.85 + 0.25 * flick;
                    (cr = f), (cg = 0.72 * f), (cb = 0.38 * f);
                }
                if (pmask[k] && m !== FLAME) {
                    cr = pr[k], cg = pg[k], cb = pb[k], fl = 0.3;
                }
                cr = tone[Math.min(1024, (cr * 256) | 0)], cg = tone[Math.min(1024, (cg * 256) | 0)], cb = tone[Math.min(1024, (cb * 256) | 0)];
                const peak = Math.max(cr, cg, cb, 1e-4);
                const level = clamp(fl + (1 - fl) * Math.pow(peak, 1.1) * 1.02) * fade;
                const step = Math.max(0, Math.min(3, Math.round(level * 3 + dith[k])));
                out[k] = DOTS[step];
                if (color) {
                    const want = step ? Math.min(1, (level + 0.06) / COVER[step]) : 0;
                    const s = (0.3 + 0.7 * want) / peak;
                    color[k] = nearest(clamp(cr * s), clamp(cg * s), clamp(cb * s));
                }
            }
        }
        // the moon: a thin crescent, lit on the side toward the set sun
        for (let r = MOON[1] - 6; r <= MOON[1] + 6; r++) {
            for (let x = MOON[0] - 6; x <= MOON[0] + 6; x++) {
                const dx = x + 0.5 - MOON[0], dy = r + 0.5 - MOON[1];
                const inside = dx * dx + dy * dy < 5.2 * 5.2;
                const ex = dx - 2.2, ey = dy + 1.6; // the shadowed disc, offset up and right
                if (inside && ex * ex + ey * ey > 4.9 * 4.9) {
                    const k = r * W + x;
                    out[k] = "●";
                    if (color)
                        color[k] = nearest(1, 0.96, 0.86);
                }
            }
        }
        // stars twinkle
        for (const [k, ph, sp] of stars) {
            const s = Math.sin(t * sp + ph);
            if (s > -0.3) {
                out[k] = s > 0.7 ? "•" : "·";
                if (color)
                    color[k] = nearest(0.9, 0.88, 1);
            }
        }
        // petals resting on the pond
        for (const [fx, fy, sp] of floaters) {
            const x = Math.round((fx + t * sp) % W), r = Math.round(fy + 0.3 * Math.sin(t * 0.8 + fx));
            if (r >= H)
                continue;
            const k = r * W + x;
            if (mat[k] !== POND)
                continue;
            out[k] = "•";
            if (color)
                color[k] = nearest(0.95, 0.72, 0.8);
        }
        const lines = [];
        for (let r = 0; r < H; r++)
            lines.push(out.slice(r * W, (r + 1) * W).join(""));
        return lines.join("\n");
    };
}

    return { meta: meta, make: kyotoDusk };
  })();

  // -------------------------------------------------------------
  // Scene: earthrise
  // -------------------------------------------------------------
  SCENES["earthrise"] = (function () {
const meta = {
    name: "earthrise",
    category: "scenes",
    note: "the earth rising over a cratered lunar horizon in long low sunlight",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 15,
    ground: "#030408",
    palette: [
        "#18181b", "#232326", "#303033", "#414143", "#555556", "#6b6a69", "#83817d", "#9c9993",
        "#b6b2aa", "#cfcac1", "#e6e1d8", "#f7f4ee",
        "#0c1120", "#131a2e", "#1b2540", "#262f4a",
        "#dfe9ff",
        "#0a2259", "#0f2f72", "#15408c", "#1d53a6", "#2a69bf", "#4386d3",
        "#6eaeea", "#a8d3f6",
        "#e8f0fa", "#c2d0e3", "#8b9fbc",
        "#2f4a26", "#3b5a2c", "#5b7238", "#7a9150", "#77783f", "#8f8550", "#a8955e", "#6b5634",
        "#b9774a", "#8a4838",
    ],
};
const W = 200, H = 100;
const EYE = 37; // screen row of eye level; the horizon dips below it
const F = 112; // focal length in cells
const CAM_H = 20;
const RM = 1500; // the moon's radius, in ground units, for the falling horizon
const ZMAX = 520;
const EC = [141, 32], ER = 22; // the Earth on screen, its lower edge still behind the horizon
const LON0 = 3.5; // which face of the globe is turned to us at the start
const RISE = 5, RISE_T = 150; // it climbs RISE rows and settles back over RISE_T seconds
const DOTS = " ·•●";
const COVER = [0, 0.3, 0.6, 1];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
// the bright stars, which twinkle: [col, row, brightness, period in seconds]
const BRIGHT = [[24, 9, 1, 4.6], [67, 27, 0.85, 3.4], [99, 12, 0.95, 5.8], [189, 7, 0.8, 4.1]];
// toward the sun: low, from the right and a little behind us (z is forward)
const SUN = (() => {
    const v = [0.94, 0.14, -0.3];
    const l = Math.hypot(...v);
    return v.map((c) => c / l);
})();
function hash(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
        x0 = ((xi % period) + period) % period;
        x1 = (x0 + 1) % period;
    }
    const a = hash(x0, yi), b = hash(x1, yi), c = hash(x0, yi + 1), d = hash(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, octaves, period) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
        s += amp * noise(x * f, y * f, period * f);
        n += amp;
        amp *= 0.5;
        f *= 2;
    }
    return s / n;
}
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => {
    const k = clamp((v - a) / (b - a));
    return k * k * (3 - 2 * k);
};
const mix = (a, b, k) => a + (b - a) * k;
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
// A bowl with a raised rim, r in ground units, q its distance in radii.
const bowl = (q, r) => r * ((q < 1 ? -0.36 * (1 - q * q) : 0) + 0.14 * Math.exp(-(((q - 1) / 0.25) ** 2)));
// Craters scattered one to a cell.
function craters(X, Z, cell, salt, r0, r1, p) {
    const ci = Math.floor(X / cell), cj = Math.floor(Z / cell);
    let h = 0;
    for (let j = cj - 1; j <= cj + 1; j++) {
        for (let i = ci - 1; i <= ci + 1; i++) {
            if (hash(i + salt, j - salt) > p)
                continue;
            const cx = (i + hash(i, j + salt * 3)) * cell, cz = (j + hash(i + salt * 5, j)) * cell;
            const e = hash(j + salt, i - salt * 7);
            const r = cell * (r0 + (r1 - r0) * e * e);
            const dx = X - cx, dz = Z - cz, d2 = dx * dx + dz * dz;
            if (d2 > 4 * r * r)
                continue;
            h += bowl(Math.sqrt(d2) / r, r) * 0.95;
        }
    }
    return h;
}
// a few big boulders in the near ground, [x, z, radius]
const ROCKS = [[30, 50, 2.4], [62, 63, 1.8], [12, 70, 1.3], [-4, 45, 1.2], [90, 55, 1.6], [46, 90, 1.4]];
function height(X, Z) {
    let h = 6 * fbm(X * 0.006 + 50, Z * 0.006 + 50, 3, 0) + 0.6 * fbm(X * 0.04, Z * 0.04, 2, 0);
    // old, worn highlands at the edge of sight, rising to the left, and a lower
    // ridge in front of them
    if (Z > 150) {
        const lift = smooth(150, 300, Z);
        // rounded massifs: folded noise, worn smooth
        const m = 1 - Math.abs(2 * fbm(X * 0.006 + 7, Z * 0.006, 4, 0) - 1);
        h += lift * (28 * Math.exp(-(((X + 260) / 230) ** 2)) + 45 * (m * m - 0.35));
        const ridge = Math.exp(-(((Z - 205) / 20) ** 2)) * Math.exp(-(((X + 140) / 130) ** 2));
        h += ridge * 22 * (0.35 + fbm(X * 0.018 + 3, Z * 0.01, 3, 0));
    }
    // big basins only out in the middle distance, so we do not stand in one
    if (Z > 90)
        h += craters(X, Z, 110, 11, 0.14, 0.34, 0.55) * smooth(90, 150, Z);
    if (Z < 300)
        h += craters(X, Z, 34, 23, 0.12, 0.36, 0.85);
    if (Z < 170)
        h += craters(X, Z, 10, 37, 0.12, 0.34, 0.85) * smooth(170, 110, Z);
    // one big crater in the near ground, off to the left
    {
        const dx = X + 24, dz = Z - 58;
        const q = Math.sqrt(dx * dx + dz * dz) / 16;
        if (q < 2)
            h += bowl(q, 16);
    }
    // boulders strewn close by, and a few big ones
    if (Z < 90) {
        const c = 5, ci = Math.floor(X / c), cj = Math.floor(Z / c);
        if (hash(ci + 91, cj) < 0.14) {
            const bx = (ci + 0.2 + 0.6 * hash(ci, cj + 92)) * c, bz = (cj + 0.2 + 0.6 * hash(ci + 93, cj)) * c;
            const br = 0.3 + 0.5 * hash(ci + 94, cj + 95) ** 2;
            const d2 = ((X - bx) ** 2 + (Z - bz) ** 2) / (br * br);
            if (d2 < 4)
                h += br * 0.9 * Math.exp(-d2 * 1.4);
        }
        for (const [bx, bz, br] of ROCKS) {
            const d2 = ((X - bx) ** 2 + (Z - bz) ** 2) / (br * br);
            // a squat, lumpy dome
            if (d2 < 1)
                h += br * (0.85 + 0.3 * noise(X * 1.3, Z * 1.3, 0)) * Math.sqrt(1 - d2);
        }
    }
    return h;
}
function earthrise() {
    const P = meta.palette.map(hex);
    const N = W * H;
    const lut = new Uint8Array(32768).fill(255);
    const nearest = (r, g, b) => {
        const k = (Math.min(31, (r * 31.99) | 0) << 10) | (Math.min(31, (g * 31.99) | 0) << 5) | Math.min(31, (b * 31.99) | 0);
        if (lut[k] !== 255)
            return lut[k];
        let best = 0, bd = 1e9;
        for (let i = 0; i < P.length; i++) {
            const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
            const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
            if (d < bd)
                (bd = d), (best = i);
        }
        return (lut[k] = best);
    };
    // Halftone one cell: dot size from brightness, colour from hue, with the
    // colour making up what the dot size could not.
    const chars = new Array(N).fill(" ");
    const cols = new Uint8Array(N);
    const dot = (k, x, r, cr, cg, cb, floor, cap) => {
        const peak = Math.max(cr, cg, cb, 1e-4);
        const level = clamp(floor + (1 - floor) * Math.pow(peak, 0.85) * 0.95);
        const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
        chars[k] = DOTS[step];
        const want = step ? Math.min(1, (level + 0.06) / COVER[step]) : 0;
        const s = Math.min(cap, 0.3 + 0.7 * want) / peak;
        cols[k] = nearest(clamp(cr * s), clamp(cg * s), clamp(cb * s));
    };
    // --- the ground: march each column from near to far ---------------------
    const ground = new Uint8Array(N);
    const top = new Int16Array(W).fill(H);
    const gx = new Float32Array(N), gz = new Float32Array(N), gy = new Float32Array(N);
    const camY = height(0, 7) + CAM_H;
    for (let c = 0; c < W; c++) {
        const dir = (c + 0.5 - W / 2) / F;
        let topR = H, Z = 26, prevY = 0, prevZ = 0, prevF = 1e9;
        while (Z < ZMAX && topR > 0) {
            const X = dir * Z;
            const hy = height(X, Z);
            const Y = hy - (Z * Z) / (2 * RM);
            const yf = EYE - (F * (Y - camY)) / Z;
            let r0 = Math.max(0, Math.ceil(yf - 0.5));
            for (let r = r0; r < topR; r++) {
                // place the cell between this sample and the last, by where its row falls
                const a = prevF > yf + 1e-6 ? clamp((prevF - (r + 0.5)) / (prevF - yf)) : 1;
                const k = r * W + c;
                ground[k] = 1;
                gz[k] = prevZ ? mix(prevZ, Z, a) : Z;
                gx[k] = dir * gz[k];
                gy[k] = prevZ ? mix(prevY, hy, a) : hy;
            }
            if (r0 < topR)
                topR = r0;
            (prevF = yf), (prevY = hy), (prevZ = Z);
            Z += 0.03 + Z * 0.012;
        }
        top[c] = topR;
    }
    // Static light: the ground and the sky, everything but the Earth's disc.
    const sr = new Float32Array(N), sg = new Float32Array(N), sb = new Float32Array(N), sf = new Float32Array(N), scap = new Float32Array(N).fill(1);
    for (let r = 0; r < H; r++) {
        for (let x = 0; x < W; x++) {
            const k = r * W + x;
            if (!ground[k])
                continue;
            const X = gx[k], Z = gz[k], Y = gy[k];
            const e = 0.1 + Z * 0.004;
            const hx = (height(X + e, Z) - height(X - e, Z)) / (2 * e);
            const hz = (height(X, Z + e) - height(X, Z - e)) / (2 * e);
            const nl = Math.hypot(hx, 1, hz);
            const lam = (-hx * SUN[0] + SUN[1] - hz * SUN[2]) / nl;
            // toward the eye, for the moon's own way of reflecting (Lommel-Seeliger)
            const vx = -X, vy = camY - Y, vz = -Z, vl = Math.hypot(vx, vy, vz);
            const mu = Math.max(0.02, (-hx * vx + vy - hz * vz) / (nl * vl));
            let lit = 0;
            if (lam > 0) {
                // march toward the sun; a soft edge for the sun's own width
                lit = 1;
                let s = 0.1 + Z * 0.003;
                while (s < 120) {
                    const px = X + SUN[0] * s, pz = Z + SUN[2] * s, py = Y + SUN[1] * s;
                    const d = py - height(px, pz);
                    if (d < 0) {
                        lit = 0;
                        break;
                    }
                    lit = Math.min(lit, (d * 30) / s);
                    s += 0.05 + s * 0.2;
                }
                lit = smooth(0, 1, lit);
            }
            // regolith: patchy, the maria darker
            const albedo = 0.5 + 0.9 * fbm(X * 0.025 + 3, Z * 0.025, 3, 0) + 0.3 * (fbm(X * 0.35, Z * 0.35, 2, 0) - 0.5) - 0.22 * smooth(0.46, 0.64, fbm(X * 0.0035, Z * 0.0035 + 20, 3, 0));
            const ls = lam > 0 ? ((0.2 * lam) / (lam + mu) + 2.6 * lam) * lit : 0;
            // the near corners fall off a little, to frame the view
            const vig = 1 - 0.3 * smooth(84, 102, r) * smooth(30, 100, Math.abs(x - 100));
            let b = Math.pow((1 - Math.exp(-ls * 1.5)) * albedo, 1.0) * vig;
            // the far crest catches the sun along its whole length
            const crest = r - top[x];
            if (crest < 2 && lit > 0.2)
                b = Math.max(b, (crest ? 0.55 : 0.85) * albedo);
            // shadow is black, but for a breath of earthshine on what faces us
            const fill = lit > 0.02 || b > 0.03 ? 0.008 + 0.007 * clamp(-hz / nl + 0.5) : 0;
            sr[k] = b * 1.0 + fill * 0.75;
            sg[k] = b * 0.95 + fill * 0.85;
            sb[k] = b * 0.86 + fill * 1.2;
            sf[k] = 0;
            scap[k] = 0.42 + 0.62 * b; // grey stays grey: dim ground draws in darker ink
        }
    }
    // the sky: a soft band of the galaxy, and stars that hold still
    const near = (x, r) => Math.hypot(x + 0.5 - EC[0], r + 0.5 - (EC[1] - RISE / 2)) < 2 * ER;
    for (let r = 0; r < H; r++) {
        for (let x = 0; x < W; x++) {
            const k = r * W + x;
            if (ground[k])
                continue;
            // a black sky. Faint stars, thicker along a diagonal where the galaxy
            // runs, none round the Earth
            const bandD = (r - (4 + x * 0.32)) / 1.05;
            const band = Math.exp(-((bandD / 10) ** 2)) * smooth(0.35, 0.65, fbm(x * 0.05, r * 0.08, 3, 0)) * smooth(120, 70, x);
            let cr = 0, cg = 0, cb = 0, cap = 1;
            const hs = hash(x * 3 + 1, r * 7 + 2);
            if (hs > 0.994 - 0.05 * band && !near(x, r)) {
                const m = Math.pow(hash(x + 17, r + 29), 3);
                const s = 0.2 + 0.5 * m;
                const tint = hash(x + 5, r + 77);
                const [tr, tg, tb] = tint < 0.3 ? [0.84, 0.9, 1] : tint > 0.88 ? [1, 0.93, 0.84] : [0.96, 0.96, 0.98];
                (cr = s * tr), (cg = s * tg), (cb = s * tb);
            }
            sr[k] = cr, sg[k] = cg, sb[k] = cb, sf[k] = 0, scap[k] = cap;
        }
    }
    for (let k = 0; k < N; k++)
        dot(k, k % W, (k / W) | 0, sr[k], sg[k], sb[k], sf[k], scap[k]);
    // --- the Earth -----------------------------------------------------------
    // Equirectangular maps, wrapping in longitude: surface colour and cloud.
    const TW = 192, TH = 96;
    const tr = new Float32Array(TW * TH), tg = new Float32Array(TW * TH), tb = new Float32Array(TW * TH), sea = new Float32Array(TW * TH);
    const cloud = new Float32Array(TW * TH);
    const storms = [[0.9, 0.8, 1], [3.1, -0.85, -1], [4.6, 0.62, 1], [1.9, 0.25, 1], [5.6, -0.55, -1]];
    const elev = new Float32Array(TW * TH);
    for (let j = 0; j < TH; j++) {
        const v = (j + 0.5) / TH, lat = (0.5 - v) * Math.PI, al = Math.abs(lat);
        for (let i = 0; i < TW; i++) {
            const u = i / TW, lon = u * Math.PI * 2, t = j * TW + i;
            const wx = fbm(u * 6, v * 3 + 9, 3, 6);
            elev[t] = fbm(u * 8 + 1.6 * wx, v * 4, 5, 8) - 0.04 * smooth(1.2, 1.5, al);
            // clouds: warped noise, wound into spirals around a few storms
            let cx = u * 14, cy = v * 7;
            for (const [slon, slat, spin] of storms) {
                let dl = lon - slon;
                dl -= Math.round(dl / (Math.PI * 2)) * Math.PI * 2;
                const lx = dl * Math.cos(lat), ly = lat - slat;
                const dd = Math.hypot(lx, ly);
                const a = spin * 5 * Math.exp(-dd / 0.2);
                if (a * spin > 0.02) {
                    const ca = Math.cos(a), sa = Math.sin(a);
                    cx += ((lx * ca - ly * sa - lx) / (Math.PI * 2)) * 14;
                    cy -= ((lx * sa + ly * ca - ly) / Math.PI) * 7;
                }
            }
            // streaked along the winds, east to west
            const q = fbm(cx * 0.5 + 3, cy * 1.2, 3, 7);
            const n0 = fbm(cx + 1.6 * q, cy * 1.3 + 0.5 * q, 5, 14);
            // folded into filaments, the way weather fronts string out
            const n = 0.4 * n0 + 0.6 * (1 - Math.abs(2 * fbm(cx * 1.5 + 2.2 * q, cy * 1.6 + 9, 4, 21) - 1));
            // cloudy at the equator and in the storm belts, clearer in the subtropics
            const belt = 0.05 * Math.exp(-((lat / 0.12) ** 2)) - 0.07 * Math.exp(-(((al - 0.42) / 0.16) ** 2)) + 0.05 * Math.exp(-(((al - 0.95) / 0.25) ** 2));
            cloud[t] = n + belt;
        }
    }
    // thresholds by share of the globe: about three tenths land, a third cloud
    const quantile = (A, p) => {
        const s = Float32Array.from(A).sort();
        return s[Math.floor(p * (s.length - 1))];
    };
    const shore = quantile(elev, 0.7), c0 = quantile(cloud, 0.6), c1 = quantile(cloud, 0.86);
    for (let j = 0; j < TH; j++) {
        const v = (j + 0.5) / TH, lat = (0.5 - v) * Math.PI, al = Math.abs(lat);
        for (let i = 0; i < TW; i++) {
            const u = i / TW, t = j * TW + i, e = elev[t];
            const land = smooth(shore - 0.004, shore + 0.006, e);
            const ice = smooth(1.22, 1.32, al + 0.12 * fbm(u * 12, v * 6, 2, 12));
            // desert in the subtropics and on high ground, forest and scrub elsewhere,
            // broken up finely so a continent is never one flat tone
            const grain = fbm(u * 36 + 2, v * 18, 3, 36) - 0.5;
            const arid = clamp(Math.exp(-(((al - 0.4) / 0.22) ** 2)) * (0.1 + 1.2 * fbm(u * 10 + 4, v * 5, 3, 10)) + (e - shore - 0.04) * 4 + 0.8 * grain);
            const relief = 1 + 1.2 * grain - 2.5 * Math.max(0, e - shore - 0.08);
            let r = mix(0.13, 0.4, arid) * relief, g = mix(0.25, 0.34, arid) * relief, b = mix(0.08, 0.19, arid) * relief;
            // ocean, lighter over the shelves near the coasts
            const shelf = smooth(shore - 0.06, shore, e);
            const or = mix(0.025, 0.07, shelf), og = mix(0.11, 0.3, shelf), ob = mix(0.38, 0.62, shelf);
            r = mix(or, r, land), g = mix(og, g, land), b = mix(ob, b, land);
            r = mix(r, 0.92, ice), g = mix(g, 0.95, ice), b = mix(b, 0.99, ice);
            tr[t] = r, tg[t] = g, tb[t] = b, sea[t] = (1 - land) * (1 - ice);
            cloud[t] = smooth(c0, c1, cloud[t]);
        }
    }
    const sample = (A, lon, vy) => {
        const fx = (((lon / (Math.PI * 2)) % 1) + 1) % 1 * TW;
        const x0 = Math.floor(fx), ax = fx - x0, x1 = (x0 + 1) % TW;
        const y0 = Math.max(0, Math.min(TH - 2, Math.floor(vy))), ay = clamp(vy - y0);
        const a = A[y0 * TW + x0], b = A[y0 * TW + x1], c = A[y0 * TW + TW + x0], d = A[y0 * TW + TW + x1];
        return a + (b - a) * ax + (c - a) * ay + (a - b - c + d) * ax * ay;
    };
    const L = [SUN[0], SUN[1], -SUN[2]]; // into screen space, z toward us
    const HV = (() => {
        const v = [L[0], L[1], L[2] + 1];
        const l = Math.hypot(...v);
        return v.map((c) => c / l);
    })();
    const tilt = 0.4, nod = 0.22;
    const ct = Math.cos(tilt), st = Math.sin(tilt), cn = Math.cos(nod), sn = Math.sin(nod);
    // the sky cells the Earth and its air can reach, as it rises and settles
    const box = [];
    for (let r = Math.max(0, EC[1] - RISE - ER - 13); r <= Math.min(H - 1, EC[1] + ER + 2); r++) {
        for (let x = EC[0] - ER - 13; x <= EC[0] + ER + 13; x++)
            if (!ground[r * W + x])
                box.push(r * W + x);
    }
    // the bright stars and the faint cross each one carries
    const twinkle = [];
    for (const [x, r, s, p] of BRIGHT) {
        for (const [ox, oy, w] of [[0, 0, 1], [-1, 0, 0.2], [1, 0, 0.2], [0, -1, 0.2], [0, 1, 0.2]]) {
            const k = (r + oy) * W + x + ox;
            if (!ground[k])
                twinkle.push([k, x + ox, r + oy, s * w, p, hash(x, r) * 6.28, w === 1]);
        }
    }
    const dirty = new Uint8Array(H);
    for (const k of box)
        dirty[(k / W) | 0] = 1;
    for (const [k] of twinkle)
        dirty[(k / W) | 0] = 1;
    const lines = [];
    for (let r = 0; r < H; r++)
        lines.push(chars.slice(r * W, (r + 1) * W).join(""));
    return (t, { color } = {}) => {
        const spin = t * 0.045;
        const drift = t * 0.012; // clouds run a little ahead of the ground
        const ey = EC[1] - RISE * (0.5 - 0.5 * Math.cos((t / RISE_T) * Math.PI * 2));
        for (const k of box) {
            const x = k % W, r = (k / W) | 0;
            let cr = sr[k], cg = sg[k], cb = sb[k], cap = scap[k], floor = 0;
            const dx = x + 0.5 - EC[0], dy = r + 0.5 - ey;
            const d = Math.hypot(dx, dy);
            // the Earth's air, a thin blue rim on its sunlit side
            if (d >= ER - 1 && d < ER + 12) {
                const side = smooth(-0.3, 0.75, (dx * L[0] - dy * L[1]) / d);
                let g = Math.exp(-Math.max(0, d - ER) / 1.2) * 0.55 * side;
                if (g < 0.05)
                    g = 0; // no stray haze dots out in space
                cr += 0.25 * g, cg += 0.52 * g, cb += 1.0 * g;
                if (g > 0)
                    cap = 1;
            }
            if (d < ER) {
                const nx = dx / ER, ny = -dy / ER, q2 = nx * nx + ny * ny;
                const nz = Math.sqrt(1 - q2);
                // into the globe's own frame: tip the pole toward us, then lean it
                const ax = nx * ct + ny * st;
                const ay0 = -nx * st + ny * ct;
                const ay = ay0 * cn - nz * sn;
                const az = ay0 * sn + nz * cn;
                const lat = Math.asin(Math.max(-1, Math.min(1, ay)));
                const lon = Math.atan2(ax, az) + LON0 + spin;
                const vy = (0.5 - lat / Math.PI) * TH - 0.5;
                const ndl = nx * L[0] + ny * L[1] + nz * L[2];
                // full sun at the right limb, dimming toward the terminator, so the
                // disc reads as a ball
                const day = smooth(-0.005, 0.06, ndl) * (0.45 + 0.8 * Math.sqrt(clamp(ndl)));
                const dusk = Math.exp(-(((ndl - 0.02) / 0.035) ** 2));
                const cl = sample(cloud, lon + drift, vy);
                // the cloud's own shadow, offset away from the sun
                const sh = sample(cloud, lon + drift - 0.03, vy + 0.4);
                const sw = sample(sea, lon, vy);
                let er = sample(tr, lon, vy), eg = sample(tg, lon, vy), eb = sample(tb, lon, vy);
                const shade = 1 - 0.45 * sh * (1 - cl);
                er *= shade, eg *= shade, eb *= shade;
                er = mix(er, 0.95, cl), eg = mix(eg, 0.97, cl), eb = mix(eb, 1.0, cl);
                er *= day * (1 + 0.06 * dusk), eg *= day * (1 - 0.03 * dusk), eb *= day * (1 - 0.1 * dusk);
                const glint = Math.pow(Math.max(0, nx * HV[0] + ny * HV[1] + nz * HV[2]), 70) * 0.8 * sw * (1 - cl);
                const rim = Math.pow(1 - nz, 2.2) * smooth(0, 0.3, ndl);
                er += glint * 0.95 + rim * 0.2;
                eg += glint * 0.92 + rim * 0.42;
                eb += glint * 0.85 + rim * 0.85;
                // a crisp edge where the disc meets space; the night side is a void
                const edge = smooth(1, 0.95, Math.sqrt(q2));
                cr = mix(cr, er, edge), cg = mix(cg, eg, edge), cb = mix(cb, eb, edge);
                // land keeps its earth tones instead of washing out to cream
                cap = mix(1, 0.66, (1 - sw) * (1 - cl) * smooth(0.95, 0.85, Math.abs(ay)));
                // the day side is the brightest thing in the sky: full, round dots
                floor = 0.15 * Math.min(1, day) * edge;
            }
            dot(k, x, r, cr, cg, cb, floor, cap);
        }
        for (const [k, x, r, s, p, ph, core] of twinkle) {
            const v = s * (0.86 + 0.14 * Math.sin((t / p) * Math.PI * 2 + ph));
            if (core)
                dot(k, x, r, v * 0.97, v * 0.98, v, 0, 1);
            else
                dot(k, x, r, Math.max(sr[k], v * 0.95), Math.max(sg[k], v), Math.max(sb[k], v * 1.15), 0, 0.6);
        }
        for (let r = 0; r < H; r++)
            if (dirty[r])
                lines[r] = chars.slice(r * W, (r + 1) * W).join("");
        if (color)
            color.set(cols);
        return lines.join("\n");
    };
}

    return { meta: meta, make: earthrise };
  })();

  // -------------------------------------------------------------
  // Scene: ocean-sunset
  // -------------------------------------------------------------
  SCENES["ocean-sunset"] = (function () {
const meta = {
    name: "ocean sunset",
    category: "scenes",
    note: "the sun sets past a pine headland, lit cloud, glitter on rolling sea",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 15,
    ground: "#0b0817",
    palette: [
        "#140f2c", "#1e1640", "#2b1c52", "#3d2266", "#552a74",
        "#6e2c78", "#90327c", "#b23c7c", "#d24f7a", "#ea6a78",
        "#c2306a", "#ff5d8f", "#ff8a9a", "#7a2456", "#f05d5e",
        "#f2804f", "#f99a43", "#ffb44a", "#ffcd62", "#ffe39a", "#fff5d8",
        "#a8323c", "#d2453c", "#e8603e",
        "#2f1a3e", "#47234f", "#63305c", "#874266", "#ac5b70",
        "#ff9e86", "#ffc4a2", "#ffdcc0",
        "#0e1230", "#171a46", "#232059", "#33286a", "#4a2f78",
        "#1c2a5c", "#2e4078",
        "#7d3f8f", "#a24f98", "#c8649e", "#de8bb5",
    ],
};
const W = 200, H = 100;
const HZ = 56; // the horizon
const SUN = [134, HZ - 4.5];
const SR = 8.5; // the sun's radius
const BOAT = 112; // the sloop's mast
// wind chop on the swell: [dir x, dir z, wavenumber, slope, speed, offset]
const CHOP = [
    [-0.45, 0.89, 22, 0.07, 2.1, 0.4],
    [0.5, 0.87, 37, 0.06, 2.9, 2.1],
    [-0.15, 0.99, 61, 0.05, 3.7, 4.4],
    [0.3, 0.95, 97, 0.04, 4.6, 1.3],
];
const DOTS = " ·•●";
const COVER = [0, 0.3, 0.6, 1];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
// pines on the headland: [x, height, half width at the foot]
const PINES = [[2.5, 10, 2.6], [8, 13, 3], [13, 18, 3.6], [18.5, 11, 2.8], [24, 20, 3.8], [30, 12, 2.9], [35, 8, 2.3], [39.5, 5, 1.8]];
function hash(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// Value noise, wrapping every `period` lattice cells in x when period > 0.
function noise(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
        x0 = ((xi % period) + period) % period;
        x1 = (x0 + 1) % period;
    }
    const a = hash(x0, yi), b = hash(x1, yi), c = hash(x0, yi + 1), d = hash(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, octaves, period) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
        s += amp * noise(x * f, y * f, period * f);
        n += amp;
        amp *= 0.5;
        f *= 2;
    }
    return s / n;
}
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => {
    const k = clamp((v - a) / (b - a));
    return k * k * (3 - 2 * k);
};
const mix = (a, b, k) => a + (b - a) * k;
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
// The sky's gradient, top to horizon, as [stop, r, g, b].
const STOPS = [
    [0, 0.08, 0.1, 0.3],
    [0.3, 0.15, 0.1, 0.34],
    [0.52, 0.4, 0.15, 0.4],
    [0.72, 0.68, 0.27, 0.4],
    [0.88, 0.8, 0.32, 0.4],
    [1, 0.88, 0.4, 0.4],
];
function gradient(v, out) {
    let i = 1;
    while (i < STOPS.length - 1 && v > STOPS[i][0])
        i++;
    const a = STOPS[i - 1], b = STOPS[i];
    const k = clamp((v - a[0]) / (b[0] - a[0]));
    out[0] = mix(a[1], b[1], k), out[1] = mix(a[2], b[2], k), out[2] = mix(a[3], b[3], k);
}
// The headland: its skyline row at x, and the row where its foot meets the sea.
const ridge = (x) => HZ + 2.5 - 11 * Math.pow(smooth(54, 32, x), 0.7) - 2.4 * Math.exp(-(((x - 19) / 9) ** 2)) - 2 * fbm(x * 0.21, 3.3, 3, 0);
const shore = (x) => HZ + 1.5 + 5 * smooth(54, 4, x);
// a sea stack off the point
const stack = (x) => (x > 52 && x < 58 ? HZ - 3.5 - 1.6 * fbm(x * 0.6, 8.1, 2, 0) + 2.5 * ((x - 55) / 3) ** 4 : 1e9);
function oceanSunset() {
    const P = meta.palette.map(hex);
    const N = W * H;
    const out = new Array(N);
    const lut = new Uint8Array(32768).fill(255);
    const nearest = (r, g, b) => {
        const k = (Math.min(31, (r * 31.99) | 0) << 10) | (Math.min(31, (g * 31.99) | 0) << 5) | Math.min(31, (b * 31.99) | 0);
        if (lut[k] !== 255)
            return lut[k];
        let best = 0, bd = 1e9;
        for (let i = 0; i < P.length; i++) {
            const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
            const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
            if (d < bd)
                (bd = d), (best = i);
        }
        return (lut[k] = best);
    };
    // dot and colour for one shaded cell
    const halftone = (k, r, x, cr, cg, cb, floor, fade, color) => {
        const peak = Math.max(cr, cg, cb, 1e-4);
        const level = clamp(floor + (1 - floor) * Math.pow(peak, 0.85) * 0.95) * fade;
        const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
        out[k] = DOTS[step];
        if (color) {
            // small dots are drawn brighter to make up their size, but the darkest
            // cells keep a dim colour, so the shadows stay deep instead of glittering
            const want = step ? Math.min(1, (level + 0.06) / COVER[step]) : 0;
            const s = ((0.3 + 0.7 * want) * (0.4 + 0.6 * smooth(0.14, 0.5, level))) / peak;
            color[k] = nearest(clamp(cr * s), clamp(cg * s), clamp(cb * s));
        }
    };
    // --- the clear sky, built once ------------------------------------------
    const sky = new Float32Array(HZ * W * 3);
    const g = [0, 0, 0];
    for (let r = 0; r < HZ; r++) {
        for (let x = 0; x < W; x++) {
            const y = r + 0.5;
            const dx = x + 0.5 - SUN[0], dy = (y - SUN[1]) * 1.6;
            const d = Math.sqrt(dx * dx + dy * dy);
            // rose and violet everywhere, burning gold only toward the sun
            const near = Math.exp(-Math.abs(dx) / 62);
            const v = y / HZ;
            gradient(Math.pow(v, 1.0 + 0.12 * (1 - near)), g);
            const warm = Math.exp(-Math.abs(dx) / 36) * smooth(0.45, 1, v) * 0.9;
            g[0] = mix(g[0], 1.0 * mix(0.6, 1, v), warm), g[1] = mix(g[1], 0.64 * mix(0.6, 1, v), warm), g[2] = mix(g[2], 0.3, warm);
            const fall = mix(1, 0.86 + 0.14 * near, smooth(0.6, 1, v));
            const glow = Math.exp(-d / 40) * 0.15 + Math.exp(-d / 9) * 0.1;
            // high haze in long thin bands, so no stretch of sky is one flat tone
            const haze = 0.82 + 0.36 * fbm(x * 0.03, y * 0.12, 3, 0);
            const k = (r * W + x) * 3;
            const vig = (1 - 0.08 * Math.pow(Math.abs(x + 0.5 - 100) / 100, 2)) * haze * fall;
            sky[k] = g[0] * (0.85 + 0.15 * near) * vig + glow;
            sky[k + 1] = g[1] * (0.65 + 0.35 * near) * vig + glow * 0.7;
            sky[k + 2] = g[2] * (1.1 - 0.2 * near) * vig + glow * 0.3;
        }
    }
    // --- the headland and its pines, built once ------------------------------
    const LANDW = 60, LANDH = HZ + 10;
    const land = new Uint8Array(N); // 1 rock, 2 pine
    const LR = new Float32Array(N), LG = new Float32Array(N), LB = new Float32Array(N);
    // the rock's seaward edge on each row, for the light on the cliff face
    const edge = new Float32Array(LANDH).fill(-1);
    for (let r = 0; r < LANDH; r++) {
        const y = r + 0.5;
        for (let x = 0; x < LANDW; x++)
            if (y >= ridge(x + 0.5) && y < shore(x + 0.5))
                edge[r] = x;
    }
    for (let r = 0; r < LANDH; r++) {
        const y = r + 0.5;
        for (let x = 0; x < LANDW; x++) {
            const k = r * W + x, xc = x + 0.5;
            const t0 = ridge(xc), st = stack(xc);
            let cr, cg, cb;
            if ((y >= t0 && y < shore(xc)) || (y >= st && y < HZ + 1.2)) {
                land[k] = 1;
                const isStack = !(y >= t0 && y < shore(xc));
                const top = isStack ? st : t0;
                // dark violet rock in rough strata
                const s = 0.6 + 0.8 * fbm(x * 0.22, y * 0.7, 3, 0);
                cr = 0.06 * s, cg = 0.042 * s, cb = 0.15 * s;
                // the sun is low and to the right: slopes that drop toward it catch it
                const facing = clamp(0.4 + (isStack ? 0.5 : (ridge(xc + 1.2) - ridge(xc - 1.2)) * 0.45));
                const rim = smooth(top + 2.4, top + 0.4, y) * facing;
                // the cliff face, warm where it turns to the sun, broken by crags
                const crag = smooth(0.35, 0.75, fbm(x * 0.4 + 3, y * 0.5, 3, 0));
                const face = isStack ? smooth(53.5, 57.5, xc) * 0.7 : edge[r] > 30 ? Math.exp(-(edge[r] - x) / 4) * smooth(HZ + 5, HZ - 4, y) : 0;
                const lit = clamp(Math.max(rim * 0.9, face * (0.3 + 0.7 * crag) * 0.75));
                cr = mix(cr, 0.95, lit), cg = mix(cg, 0.38, lit * 0.95), cb = mix(cb, 0.3, lit * 0.9);
            }
            for (const [tx, th, tw] of PINES) {
                const tb = ridge(tx);
                const dy = y - (tb - th);
                // a conifer: a spire that widens in tiers of branches
                const tier = (dy + th * 0.3) / 2.4;
                const half = (dy / th) * tw * (0.5 + 0.75 * (tier - Math.floor(tier))) + 0.35;
                const ex = xc - tx;
                if (dy >= 0 && y < tb + 1.5 && Math.abs(ex) <= half) {
                    land[k] = 2;
                    const s = 0.7 + 0.6 * hash(x * 13 + r, 5);
                    cr = 0.045 * s, cg = 0.03 * s, cb = 0.1 * s;
                    // the right flank faces the sun
                    const e = ex > 0 && ex > half - 1.1 ? 0.3 + 0.3 * smooth(th, 0, dy) : 0;
                    cr = mix(cr, 0.85, e), cg = mix(cg, 0.3, e), cb = mix(cb, 0.3, e);
                }
            }
            if (land[k])
                LR[k] = cr, LG[k] = cg, LB[k] = cb;
        }
    }
    // a small sloop out on the water, dark against the glow left of the sun
    for (let r = HZ - 10; r < HZ + 4; r++) {
        const y = r + 0.5;
        for (let x = BOAT - 6; x <= BOAT + 6; x++) {
            const k = r * W + x, ex = x + 0.5 - BOAT;
            const hull = y >= HZ + 1 && y < HZ + 3 && Math.abs(ex - 0.3) < 4.6 - (y - HZ - 1) * 1.3;
            const mast = Math.abs(ex) < 0.5 && y >= HZ - 9 && y < HZ + 1;
            const main = ex > 0 && y >= HZ - 8.5 && y < HZ + 0.5 && ex < 0.6 + (y - (HZ - 8.5)) * 0.42;
            const jib = ex < 0 && y >= HZ - 7 && y < HZ + 0.5 && -ex < (y - (HZ - 7)) * 0.36;
            if (hull || mast || main || jib) {
                land[k] = 3;
                // the sails are thin enough to glow a little with the sun behind them
                const glow = main ? 0.12 + 0.18 * smooth(0, 3.5, ex) : 0;
                LR[k] = 0.05 + glow, LG[k] = 0.03 + glow * 0.45, LB[k] = 0.09 + glow * 0.35;
            }
        }
    }
    // --- the cloud deck: a sheet of heaped cloud seen from below, laid out on
    // its own plane so it shrinks and flattens toward the horizon -------------
    const U = 640, V = 128;
    const deck = new Float32Array(U * V), deckLit = new Float32Array(U * V);
    const deckAt = (u, v) => {
        const q = fbm(u * 0.0125, v * 0.06, 2, 8);
        const patch = fbm(u * 0.00625, v * 0.03 + 7, 2, 4);
        return fbm(u * 0.040625 + q * 1.6, v * 0.3, 5, 26) + 0.25 * (patch - 0.5);
    };
    for (let v = 0; v < V; v++) {
        for (let u = 0; u < U; u++) {
            const d = deckAt(u, v);
            deck[v * U + u] = d;
            // the side of each heap that faces the horizon, and the sun, is lit
            deckLit[v * U + u] = clamp(0.5 + (d - deckAt(u, v + 2.5)) * 9);
        }
    }
    // thinning toward the zenith, ragged rather than a ruled line
    const thinTop = new Float32Array(W * HZ);
    for (let r = 0; r < HZ; r++)
        for (let x = 0; x < W; x++)
            thinTop[r * W + x] = fbm(x * 0.05 + 11, r * 0.15, 2, 0);
    // --- low bars over the horizon: a wrapping field that drifts -------------
    const CW = 720;
    const loCover = new Float32Array(CW * HZ), loLit = new Float32Array(CW * HZ);
    const lower = (x, y) => {
        // long thin bars low over the horizon
        const b = fbm(x / 40, y * 0.3, 4, CW / 40);
        const gaps = fbm(x / 120, 5, 2, CW / 120);
        return b + 0.01 + 0.5 * (gaps - 0.5) - 0.35 * smooth(HZ - 14, HZ - 20, y) - 0.25 * smooth(HZ - 4, HZ - 1, y);
    };
    for (let r = 0; r < HZ; r++) {
        for (let x = 0; x < CW; x++) {
            const y = r + 0.5;
            const k = r * CW + x;
            const dl = lower(x, y);
            loCover[k] = smooth(0.58, 0.66, dl);
            loLit[k] = clamp(0.5 + (dl - lower(x, y + 1.2)) * 6);
        }
    }
    // this frame's sky, finished, for the sea to mirror
    const SKR = new Float32Array(HZ * W), SKG = new Float32Array(HZ * W), SKB = new Float32Array(HZ * W);
    return (t, { color } = {}) => {
        const dUp = t * 0.9, dLo = t * 1.7;
        for (let r = 0; r < HZ; r++) {
            const y = r + 0.5;
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                const s = k * 3;
                let cr = sky[s], cg = sky[s + 1], cb = sky[s + 2];
                const dx = x + 0.5 - SUN[0];
                const dy = y - SUN[1];
                let disc = 0;
                const ds = Math.sqrt(dx * dx + (dy / 0.9) ** 2);
                if (ds < SR + 0.6) {
                    // the disc, a little flattened, hot at the core and redder at the rim
                    const e = ds / SR;
                    disc = smooth(SR + 0.45, SR - 0.45, ds);
                    const e4 = e * e * e * e;
                    cr = mix(cr, 1.0, disc);
                    cg = mix(cg, 0.95 - 0.2 * e4, disc);
                    cb = mix(cb, 0.78 - 0.38 * e4, disc);
                }
                const near = Math.exp(-Math.sqrt(dx * dx + dy * dy * 2.5) / 45);
                const v = y / HZ;
                // the cloud deck, found on its plane: far rows are far away
                const D = 58 / (HZ - y + 2.5);
                // a band of heaped cloud mid-sky: clear above and clear in the low glow
                const far = smooth(4.8, 2.7, D) * smooth(1.08, 1.7, D);
                let cloud = 0;
                if (far > 0) {
                    const su = dx * D + dUp + 64200, sv = (D - 0.9) * 10;
                    let iu = Math.floor(su);
                    const fu = su - iu, iv = Math.floor(sv), fv = sv - iv;
                    iu %= U;
                    const iu1 = (iu + 1) % U, a0 = iv * U, a1 = a0 + U;
                    const d0 = deck[a0 + iu] + (deck[a0 + iu1] - deck[a0 + iu]) * fu;
                    const d1 = deck[a1 + iu] + (deck[a1 + iu1] - deck[a1 + iu]) * fu;
                    const dd = d0 + (d1 - d0) * fv - 0.22 * (1 - far) * thinTop[k];
                    const c = smooth(0.56, 0.68, dd) * Math.sqrt(far);
                    if (c > 0.01) {
                        cloud = c;
                        const l0 = deckLit[a0 + iu] + (deckLit[a0 + iu1] - deckLit[a0 + iu]) * fu;
                        const l1 = deckLit[a1 + iu] + (deckLit[a1 + iu1] - deckLit[a1 + iu]) * fu;
                        const l = l0 + (l1 - l0) * fv;
                        // undersides glow gold toward the sun and rose away from it, and
                        // more the lower they sit; thick cores stay dusk violet
                        const az = Math.exp(-Math.abs(dx) / 60);
                        const low = v * v;
                        const thin = 1 - smooth(0.6, 0.76, dd);
                        const b = clamp(Math.pow(smooth(0.45, 0.85, l), 1.5) * (0.55 + 0.25 * low + 0.35 * az) + 0.3 * thin * az * low);
                        const warm = clamp(az * (0.1 + 1.2 * low));
                        const hr = 1.0, hg = mix(0.45, 0.72, warm), hb = mix(0.52, 0.38, warm);
                        const sr = mix(0.1, 0.2, v), sg = mix(0.065, 0.07, v), sb = mix(0.23, 0.27, v);
                        cr = mix(cr, mix(sr, hr, b), c);
                        cg = mix(cg, mix(sg, hg, b), c);
                        cb = mix(cb, mix(sb, hb, b), c);
                    }
                }
                // the low bars, dark against the glow with burning edges
                const sx = x + dLo, ix = Math.floor(sx), fx = sx - ix;
                const i0 = r * CW + (ix % CW), i1 = r * CW + ((ix + 1) % CW);
                // thinned over the sun and kept off the sky behind the headland
                const c = (loCover[i0] + (loCover[i1] - loCover[i0]) * fx) * (1 - 0.75 * Math.exp(-((dx / 13) ** 2))) * (1 - 0.85 * smooth(76, 50, x));
                if (c > 0.01) {
                    cloud = Math.max(cloud, c);
                    const l = loLit[i0] + (loLit[i1] - loLit[i0]) * fx;
                    const rim = Math.pow(l, 2) * (0.35 + 0.9 * near);
                    const a = Math.min(1, c * 1.2) * 0.92;
                    cr = mix(cr, 0.3 + 0.7 * rim, a);
                    cg = mix(cg, 0.09 + 0.55 * rim, a);
                    cb = mix(cb, 0.24 + 0.18 * rim, a);
                }
                // the first stars, high up where the sky has gone to indigo
                if (r < 22 && cloud < 0.05 && hash(x, r * 5 + 3) > 0.993) {
                    const tw = 0.55 + 0.45 * Math.sin(t * (0.8 + hash(r, x) * 1.6) + hash(x, r) * 6.28);
                    const st = tw * smooth(22, 4, r) * 0.75;
                    cr = Math.max(cr, st * 0.95), cg = Math.max(cg, st * 0.85), cb = Math.max(cb, st);
                }
                // the sea is too rough to mirror the disc whole: it gives back glitter
                const keep = 1 - 0.75 * disc;
                SKR[k] = cr * keep, SKG[k] = cg * keep, SKB[k] = cb * keep;
                if (land[k]) {
                    cr = LR[k], cg = LG[k], cb = LB[k];
                    halftone(k, r, x, cr, cg, cb, 0.02, 1, color);
                }
                else
                    halftone(k, r, x, cr, cg, cb, 0.05, 1, color);
            }
        }
        for (let r = HZ; r < H; r++) {
            const y = r + 0.5;
            // the sea: each cell is a facet of water that mirrors whatever part
            // of the sky its tilt points it at
            const dz = y - HZ;
            const Z = 36 / dz; // distance out
            const rows = 36 / (dz * dz); // how much sea one row spans
            const swellAmt = smooth(8, 26, dz);
            const hot = Math.exp(-dz / 9);
            const pw = 3 + dz * 0.8; // the glitter path, wider as it comes toward us
            const fx = (0.9 / (1 + dz * 0.06)) * 0.35, fy = 1.6 / (1 + dz * 0.05);
            const fres = 0.24 + 0.46 * Math.exp(-dz / 8);
            const depth = smooth(HZ, H, y);
            const fade = smooth(H + 6, H - 4, y);
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                if (land[k]) {
                    halftone(k, r, x, LR[k], LG[k], LB[k], 0.02, 1, color);
                    continue;
                }
                const dx = x + 0.5 - SUN[0];
                const X = (x + 0.5 - 100) / dz;
                // the long swell rolls toward us; shorter chop rides on it
                const p = 13 * (Z + 0.05 * X) + 2.2 * fbm(X * 0.35 + 3, Z * 0.4, 2, 0) + t * 0.8;
                const wv = Math.sin(p), slope = Math.cos(p);
                let sz = 0.11 * slope * clamp(1.4 / (13 * rows)), sxl = 0.015 * slope;
                for (let i = 0; i < CHOP.length; i++) {
                    const [kx, kz, kk, a, w, f] = CHOP[i];
                    const ph = kk * (kx * X + kz * Z) - w * t + f;
                    const c = Math.cos(ph) * a * clamp(1.6 / (kk * rows));
                    sz += c * kz, sxl += c * kx;
                }
                let ry = Math.round(HZ - 1 - dz * 0.85 - 70 * sz);
                ry = ry < 0 ? 0 : ry > HZ - 1 ? HZ - 1 : ry;
                let rx = Math.round(x - 60 * sxl);
                rx = rx < 0 ? 0 : rx > W - 1 ? W - 1 : rx;
                const q = ry * W + rx;
                // violet near the horizon, deepening to indigo toward us
                // broken into long horizontal ripples, each giving back a little more
                // or less of the sky
                const rip = noise(x * fx * 1.4 + 13 - t * 0.15, y * fy * 1.1 + t * 0.25, 0);
                const rf = fres * (0.5 + 1.1 * rip * rip);
                let cr = SKR[q] * rf * 0.8 + 0.03 - 0.01 * depth;
                let cg = SKG[q] * rf * 0.75 + 0.022;
                let cb = SKB[q] * rf + 0.095 + 0.03 * depth;
                // ripple facets that catch the sun: short dashes far out, longer
                // close in, each turning toward the sun and away again
                const n = 0.55 * noise(x * fx + t * 0.3, y * fy * 1.3 - t * 0.4, 0) + 0.45 * noise(x * fx * 1.7 - t * 0.4, y * fy * 2 + t * 0.3 + 40, 0);
                const wave = Math.floor(p / (2 * Math.PI));
                const crest = Math.pow(0.5 + 0.5 * wv, 7) * swellAmt * smooth(0.4, 0.65, noise(X * 2.5 + 7, wave * 3.7, 0));
                const path = Math.exp(-((dx / pw) ** 2));
                const soft = Math.exp(-((dx / (pw * 1.6)) ** 2));
                // the near face of a swell is in shadow
                if (slope > 0) {
                    const d = 1 - 0.7 * swellAmt * slope;
                    cr *= d, cg *= d, cb *= d;
                }
                const th = 0.84 - 0.3 * path * (0.45 + 0.55 * hot);
                const glint = smooth(th, th + 0.08, n) * (0.25 + 0.75 * path) * soft;
                const white = path * path * smooth(th + 0.04, th + 0.2, n);
                cr += 0.2 * soft * (0.4 + hot) + glint * 1.1;
                cg += 0.1 * soft * (0.4 + hot) + glint * (0.55 + 0.3 * hot + 0.35 * white);
                cb += 0.04 * soft + glint * (0.2 + 0.25 * hot + 0.45 * white);
                // the crests catch it: gold in the path, rose out to the sides
                const catchL = crest * (0.15 + 0.85 * soft) * (0.6 + 0.6 * n);
                cr += catchL * 0.95, cg += catchL * mix(0.3, 0.7, soft), cb += catchL * mix(0.5, 0.3, soft);
                // the sun's own column: a gap under the disc, then broken dashes
                const dash = smooth(0.4, 0.7, noise(x * 0.18 + t * 0.25, y * 0.9 - t * 0.5, 0));
                const col = Math.exp(-((dx / (1.0 + dz * 0.22)) ** 2)) * Math.exp(-dz / 5) * (0.6 + 0.4 * n) * smooth(0, 3, dz) * dash;
                cr += col, cg += col * 0.8, cb += col * 0.45;
                // the headland upside down in the water, broken by ripples
                if (x < LANDW + 4 && dz < 26) {
                    const xs = x + 0.5 + 1.3 * Math.sin(y * 1.1 + t * 1.2 + x * 0.05);
                    const ix = Math.max(0, Math.min(LANDW - 1, xs | 0));
                    const ft = shore(ix + 0.5);
                    if (y > ft) {
                        const my = Math.floor(2 * ft - y);
                        if (my >= 0 && my < LANDH) {
                            const m = my * W + ix;
                            if (land[m]) {
                                const a = 0.8 * smooth(ft + 24, ft + 4, y);
                                cr = mix(cr, LR[m] * 0.8 + 0.02, a), cg = mix(cg, LG[m] * 0.7 + 0.015, a), cb = mix(cb, LB[m] * 0.85 + 0.05, a);
                            }
                        }
                        // a line of surf where rock meets water
                        const foam = smooth(ft + 1.6, ft + 0.3, y) * smooth(0.45, 0.8, noise(x * 0.5 - t * 0.4, t * 0.3, 0));
                        cr += 0.5 * foam, cg += 0.3 * foam, cb += 0.35 * foam;
                    }
                }
                // and the sloop's, shorter and more broken
                if (dz > 2.5 && dz < 14 && x > BOAT - 8 && x < BOAT + 8) {
                    const ix = (x + 0.5 + 0.9 * Math.sin(y * 1.3 + t * 1.6)) | 0;
                    const m = Math.floor(2 * (HZ + 3) - y) * W + ix;
                    if (land[m] === 3) {
                        const a = 0.7 * smooth(HZ + 14, HZ + 4, y) * (0.6 + 0.4 * rip);
                        cr = mix(cr, 0.04, a), cg = mix(cg, 0.03, a), cb = mix(cb, 0.1, a);
                    }
                }
                // a crisp dark line at the horizon for the sun to sit on
                if (dz < 1.5)
                    cr *= 0.55, cg *= 0.55, cb *= 0.55;
                halftone(k, r, x, cr, cg, cb, 0.18, fade, color);
            }
        }
        const lines = [];
        for (let r = 0; r < H; r++)
            lines.push(out.slice(r * W, (r + 1) * W).join(""));
        return lines.join("\n");
    };
}

    return { meta: meta, make: oceanSunset };
  })();

  // -------------------------------------------------------------
  // Scene: storm-plains
  // -------------------------------------------------------------
  SCENES["storm-plains"] = (function () {
const meta = {
    name: "storm plains",
    category: "scenes",
    note: "an anvil thunderhead at dusk flickering over a wheat field",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 15,
    ground: "#0b0912",
    palette: [
        // night violets, zenith to dusk
        "#0f0c20", "#141029", "#1c1638", "#261c4a", "#32235a", "#40306c", "#53407e", "#6a5590", "#8670a6",
        // dusty mauve, the shaded flank
        "#7a6288", "#9a7890", "#b98e94",
        // peach and gold, the sunlit tops
        "#e6a890", "#f2bca8", "#f7d6a8", "#fbe8c6",
        // amber afterglow
        "#f8b070", "#e88a4c", "#c8643a", "#9a4630", "#6a3226",
        // wheat, gold to umber
        "#f0c868", "#d8a447", "#b7843a", "#8c6230", "#5e4226", "#3a2a1c", "#261c14",
        // rain and slate
        "#181a2c", "#2a3048", "#3a4260", "#4f5878", "#6a7392", "#8890ae", "#a2aabd", "#5d5878", "#7c7598",
        // lightning
        "#a6a2c8", "#d6d2fa", "#f4f2ff",
        // lamplight
        "#ffe08a", "#ffb84a",
    ],
};
const W = 200, H = 100;
const HZ = 64; // the horizon
const SUN = [30, 70]; // just below the horizon, behind the farmhouse
const BASE = 45; // the storm's flat base
const DOTS = " ·•●";
const COVER = [0, 0.3, 0.6, 1];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
const SKY = 0, PLAIN = 1, FIELD = 2, ROAD = 3, HOUSE = 4, ROOF = 5, PANE = 6, TREE = 7, PUMP = 8, BELT = 9;
function hash(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
        x0 = ((xi % period) + period) % period;
        x1 = (x0 + 1) % period;
    }
    const a = hash(x0, yi), b = hash(x1, yi), c = hash(x0, yi + 1), d = hash(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, octaves, period) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
        s += amp * noise(x * f, y * f, period * f);
        n += amp;
        amp *= 0.5;
        f *= 2;
    }
    return s / n;
}
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => {
    const k = clamp((v - a) / (b - a));
    return k * k * (3 - 2 * k);
};
const mix = (a, b, k) => a + (b - a) * k;
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
const dome = (dx, dy, r) => {
    const q = 1 - dx * dx - dy * dy;
    return q > 0 ? r * Math.sqrt(q) : 0;
};
// Distance from (px, py) to the segment a-b.
function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const k = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1));
    const ex = px - ax - dx * k, ey = py - ay - dy * k;
    return Math.sqrt(ex * ex + ey * ey);
}
function stormPlains() {
    const P = meta.palette.map(hex);
    const STALK = meta.palette.indexOf("#8c6230");
    const N = W * H;
    const out = new Array(N);
    const lut = new Uint8Array(32768).fill(255);
    const nearest = (r, g, b) => {
        const k = (Math.min(31, (r * 31.99) | 0) << 10) | (Math.min(31, (g * 31.99) | 0) << 5) | Math.min(31, (b * 31.99) | 0);
        if (lut[k] !== 255)
            return lut[k];
        let best = 0, bd = 1e9;
        for (let i = 0; i < P.length; i++) {
            const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
            const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
            if (d < bd)
                (bd = d), (best = i);
        }
        return (lut[k] = best);
    };
    // --- the thunderhead, as a height field ----------------------------------
    const towerC = (y) => 138 + (BASE - y) * 0.14;
    const towerHW = (y) => 23 - (BASE - y) * 0.08;
    const anvilTop = (x) => 7.5 + 2.5 * smooth(150, 210, x) + 3 * smooth(112, 58, x);
    const anvilBot = (x) => 21 - 9 * smooth(124, 62, x) - 7 * smooth(152, 210, x);
    // The towers are heaps of puffs: [x, y, radius, bulge toward us]. Each puff
    // is a dome in the height field, so it gets its own lit side and shadow.
    const puffs = [];
    let seed = 1;
    const rnd = () => hash(seed++, 911);
    for (let y = BASE - 4.5; y > 14; y -= 4.4) {
        const cx = towerC(y), hw = towerHW(y);
        const n = Math.max(2, Math.round((hw * 2) / 11));
        for (let i = 0; i < n; i++) {
            const u = ((i + 0.5) / n) * 2 - 1;
            const rr = 7 + rnd() * 4;
            puffs.push([cx + u * (hw - rr * 0.55) + (rnd() - 0.5) * 3, y + (rnd() - 0.5) * 2, rr, 4 * Math.sqrt(1 - u * u * 0.85), 1]);
        }
    }
    // the overshooting top, bulging out of the anvil
    puffs.push([141, 8.5, 9, 2, 0], [133, 9.5, 6, 1, 0], [149, 10, 6, 1, 0]);
    // the flanking line: younger towers stepping down to the west
    for (const [cx, top, w] of [
        [104, 27, 9],
        [89, 34, 6.5],
        [77, 40.5, 3.8],
    ]) {
        for (let y = BASE - w * 0.4; y > top + w * 0.6; y -= w * 0.75)
            puffs.push([cx + (rnd() - 0.5) * w * 0.6, y, w * (0.75 + rnd() * 0.2), 1, 1]);
        puffs.push([cx - w * 0.35, top + w * 0.75, w * 0.62, 1, 1], [cx + w * 0.3, top + w * 0.6, w * 0.7, 1.5, 1], [cx, top + w * 0.45, w * 0.55, 2, 1]);
    }
    // one continuous low base under the line, so the towers stand on something
    for (let x = 66; x < 126; x += 3.2 + rnd() * 1.6)
        puffs.push([x, BASE - 1.8 - rnd() * 1.2, 3 + rnd() * 1.6 + 1.6 * smooth(70, 110, x), 0.4, 1]);
    const SX = W + 4, SY = BASE + 8; // the grid, two cells of margin either side
    const sh = new Float32Array(SX * SY);
    const anv = new Float32Array(SX * SY); // how much of the height is anvil
    const lip = new Float32Array(SX * SY); // the anvil's sunlit top edge
    for (let r = 0; r < SY; r++) {
        for (let i = 0; i < SX; i++) {
            const x = i - 2 + 0.5, y = r + 0.5;
            // the towers, cut flat along the base
            let tower = 0;
            const cut = smooth(BASE + 1, BASE - 1.5, y + 1.2 * (noise(x * 0.15, 3.3, 0) - 0.5));
            for (const [px, py, pr, pz, flat] of puffs) {
                const dx = (x - px) / pr, dy = (y - py) / pr;
                if (dx * dx + dy * dy >= 1)
                    continue;
                const v = (pr * 0.6 + pz) * Math.sqrt(1 - dx * dx - dy * dy) * (flat ? cut : 1);
                if (v > tower)
                    tower = v;
            }
            // the anvil: flat on top, a lens in section, combed by the wind
            const fib = fbm(x * 0.035, y * 0.2, 3, 0) - 0.5;
            const top = anvilTop(x) + 2.2 * fib, bot = anvilBot(x) - 1.5 * fib - 3 * (fbm(x * 0.2, 7, 2, 0) - 0.5);
            const mid = (top + bot) / 2, half = Math.max(0.5, (bot - top) / 2);
            let anvil = dome(0, (y - mid) / half, Math.min(5, half * 0.9)) * smooth(58, 72, x + 6 * fib);
            const onTop = anvil > 0 ? smooth(top + 3.2, top + 0.6, y) : 0;
            // pouches of mammatus hanging under its western half
            if (x > 66 && x < 128 && y > bot - 2 && y < bot + 5) {
                const row = Math.floor((x - 66) / 5.2);
                const off = row * 5.2 + 66 + 2.6 + (hash(row, 3) - 0.5) * 1.2;
                const py = bot + 0.6 + hash(row, 4) * 1.2;
                anvil = Math.max(anvil, dome((x - off) / 2.7, (y - py) / 2.3, 2.2) * smooth(64, 76, x) * smooth(130, 116, x));
            }
            const solid = tower;
            let h = Math.max(solid, anvil);
            const a = anvil > solid ? smooth(0, 2, anvil - solid) : 0;
            // small billows on the towers; long streaks on the anvil, combed at a
            // slight slant so they do not line up with the rows
            const billow = fbm(x * 0.22, y * 0.24, 3, 0) - 0.5;
            const sy = y * 0.18 + 0.9 * (noise(x * 0.04, 5.5, 0) - 0.5) + x * 0.012;
            const streaky = fbm(x * 0.03 + 0.6 * noise(x * 0.08, y * 0.1, 0), sy, 3, 0) - 0.5;
            h += Math.min(1, h / 2.5) * mix(3 * billow, 2.2 * streaky, a);
            sh[r * SX + i] = Math.max(0, h);
            anv[r * SX + i] = a;
            lip[r * SX + i] = onTop * a;
        }
    }
    // --- static colour of every cell: sky, storm, land -----------------------
    const sr = new Float32Array(N), sg = new Float32Array(N), sb = new Float32Array(N);
    const mat = new Uint8Array(N);
    const cloud = new Float32Array(N); // storm cover, for the lightning
    const dark = new Float32Array(N); // base and shelf, lit from behind by a flash
    const darkSky = new Float32Array(N); // the slot under the storm
    const floorOf = new Float32Array(N);
    const jit = new Float32Array(N); // per-cell dither jitter, against contour lines
    for (let k = 0; k < N; k++)
        jit[k] = (hash(k % W, ((k / W) | 0) + 517) - 0.5) * (((k / W) | 0) < HZ ? 0.16 : 0.06);
    const glowSun = (x, y) => {
        const dx = x - SUN[0], dy = y - SUN[1];
        return Math.exp(-((dx / 48) ** 2) - ((dy / 10) ** 2)) * 0.9 + Math.exp(-((dx / 95) ** 2) - ((dy / 20) ** 2)) * 0.26;
    };
    const LX = -0.72, LY = -0.3, LZ = 0.62; // toward the light: west, a touch high, out of the page
    // the farmhouse, its tree and a windpump, standing on the horizon
    const ground = (x) => HZ + 3 - 1.2 * smooth(20, 70, x) * smooth(110, 70, x);
    const HX0 = 40, HX1 = 54, HW0 = 58; // walls from x 40 to 54, eaves at row 58
    const hb = ground(47);
    const PUMP_X = 66, PUMP_Y = hb - 15;
    // the shelf: a flat dark lip of cloud along the storm's leading edge
    const shelfTop = (x) => BASE - 2.4 + 1.2 * (noise(x * 0.2, 8.1, 0) - 0.5);
    const shelfBot = (x) => BASE + 2.4 + 1.8 * (fbm(x * 0.12, 8.7, 2, 0) - 0.5) - 2 * smooth(184, 199, x) - 2 * smooth(114, 104, x);
    const shelfOn = (x) => smooth(103, 112, x) * smooth(199, 190, x);
    for (let r = 0; r < H; r++) {
        for (let x = 0; x < W; x++) {
            const k = r * W + x;
            const y = r + 0.5;
            if (y < ground(x)) {
                // sky: indigo overhead, dusky rose lower down, amber where the sun went
                const v = y / HZ;
                const g = glowSun(x, y);
                const east = smooth(60, 190, x); // the storm side is cooler and darker
                const v2 = Math.pow(v, 2.2);
                const veil = 0.9 + 0.2 * fbm(x * 0.05, y * 0.09, 3, 0);
                let cr = (0.045 + 0.2 * v2 * (1 - 0.6 * east)) * veil + 1.0 * g;
                let cg = (0.045 + 0.09 * v2 * (1 - 0.5 * east)) * veil + 0.56 * g;
                let cb = (0.16 + 0.13 * v2 * (1 - 0.35 * east)) * veil + 0.22 * g;
                // the last light along the horizon, gone where the storm stands
                const be = smooth(45, 118, x);
                const band = Math.exp(-(HZ + 2 - y) / 11) * (1 - 0.85 * be) * (1 - 0.6 * g);
                cr += band * mix(0.5, 0.34, be), cg += band * mix(0.26, 0.21, be), cb += band * mix(0.26, 0.3, be);
                // under the storm the air itself goes dark slate, with only a thread
                // of light left along the ground behind the rain
                const under = smooth(98, 128, x + 8 * (noise(y * 0.15, 4.4, 0) - 0.5)) * smooth(BASE - 14, BASE - 1, y);
                // black under the base, opening to a dim violet glow at the ground:
                // the clear sky far beyond the storm, for the rain to hang against
                const slot = Math.pow(smooth(BASE + 1.5, HZ - 6, y), 0.5) * (0.85 + 0.3 * noise(x * 0.06, 6.6, 0));
                cr = mix(cr, mix(0.035, 0.38, slot) * veil, under * 0.92);
                cg = mix(cg, mix(0.032, 0.3, slot) * veil, under * 0.92);
                cb = mix(cb, mix(0.075, 0.56, slot) * veil, under * 0.92);
                darkSky[k] = under;
                // the storm
                if (r < SY - 1) {
                    const i = x + 2, j = r * SX + i;
                    const h = sh[j];
                    const c = smooth(0.15, 1.6, h);
                    if (c > 0) {
                        const up = r > 0 ? sh[j - SX] : 0, dn = sh[j + SX];
                        const gx = (sh[j + 1] - sh[j - 1]) / 2, gy = (dn - up) / 2;
                        const nl = Math.sqrt(gx * gx + gy * gy + 1);
                        const nx = -gx / nl, ny = -gy / nl, nz = 1 / nl;
                        const an = anv[j];
                        const lam = Math.pow(clamp(nx * LX + ny * LY + nz * LZ), 1.5);
                        // earth's shadow climbing the tower: the tops still lit, the
                        // lower bulk already in dusk
                        const vis = 1 - 0.4 * smooth(22, BASE - 4, y + 5 * (noise(x * 0.12, 2.2, 0) - 0.5));
                        const a = smooth(8, BASE, y);
                        const near = Math.exp(-(((x - SUN[0]) / 110) ** 2));
                        const flank = smooth(122, 108, x) * (1 - an); // the younger towers to the west
                        // sunlight: cream-gold up high, peach lower down
                        const sR = 1.0, sG = mix(0.84, 0.58, a), sB = mix(0.58, 0.45, a);
                        // the tower's own bulk shades its eastern side, along a ragged edge
                        const ej = 8 * (fbm(y * 0.14 + x * 0.02, 21.3, 3, 0) - 0.5);
                        const lee = 1 - 0.65 * smooth(towerC(y) - 14 + ej, towerC(y) + towerHW(y) + 16 + ej, x) * (1 - an) * smooth(anvilBot(x) - 3, anvilBot(x) + 9, y + 5 * (noise(x * 0.15, 21, 0) - 0.5)) * (y < BASE ? 1 : 0);
                        const sun = lam * vis * lee * (0.95 + 0.4 * near) * (1 - 0.3 * flank) * (1 - 0.2 * an);
                        // skylight from above, violet; afterglow bounced up from the west
                        const sky = 0.55 + 0.45 * Math.max(0, -ny);
                        const bounce = Math.max(0, ny) * (0.2 + 0.45 * near) * (1 - 0.6 * flank) * (1 - 0.5 * an);
                        const occ = 1 - 0.35 * smooth(4, 22, h) * (1 - lam);
                        let kr = (0.27 * sky + sR * sun + 0.36 * bounce) * occ;
                        let kg = (0.2 * sky + sG * sun + 0.16 * bounce) * occ;
                        let kb = (0.45 * sky + sB * sun + 0.16 * bounce) * occ;
                        // the anvil's underside sinks into mauve shadow; its top edge
                        // catches the last direct light, cream toward the west
                        const below = clamp(ny * 2.2) * an;
                        kr *= 1 - 0.42 * below, kg *= 1 - 0.46 * below, kb *= 1 - 0.3 * below;
                        const rim = lip[j] * smooth(196, 120, x) * (0.6 + 0.4 * lam);
                        kr = mix(kr, 0.98, rim * 0.75), kg = mix(kg, 0.86, rim * 0.75), kb = mix(kb, 0.64, rim * 0.75);
                        // the flankers' lower halves turn violet-grey
                        const low = clamp(ny * 1.6 + 0.2) * flank;
                        kr = mix(kr, 0.14, low * 0.65), kg = mix(kg, 0.11, low * 0.65), kb = mix(kb, 0.24, low * 0.65);
                        // the base: dark slate where the rain hangs
                        const base = smooth(BASE - 4.5, BASE - 0.5, y) * (1 - an) * (1 - 0.3 * near);
                        kr = mix(kr, 0.03, base * 0.9), kg = mix(kg, 0.026, base * 0.9), kb = mix(kb, 0.06, base * 0.9);
                        cr = mix(cr, kr, c), cg = mix(cg, kg, c), cb = mix(cb, kb, c);
                        cloud[k] = c;
                        dark[k] = base * c;
                    }
                }
                // the shelf, hung along the base, a touch lighter on its leading lip
                const on = shelfOn(x);
                if (on > 0 && y > BASE - 5 && y < BASE + 5) {
                    const st = shelfTop(x), sbt = shelfBot(x);
                    const s = smooth(st - 1, st + 0.6, y) * smooth(sbt + 0.6, sbt - 0.8, y) * on;
                    if (s > 0) {
                        const n = fbm(x * 0.15, y * 0.5, 2, 0);
                        // striations along its face, and a faint lip of light underneath
                        const lit = 0.55 + 0.9 * n * (0.7 + 0.6 * noise(x * 0.05, y * 1.3, 0)) + 0.9 * smooth(sbt - 1.6, sbt - 0.2, y);
                        cr = mix(cr, 0.06 * lit, s), cg = mix(cg, 0.056 * lit, s), cb = mix(cb, 0.12 * lit, s);
                        cloud[k] = Math.max(cloud[k], s);
                        dark[k] = Math.max(dark[k], s);
                    }
                }
                sr[k] = cr, sg[k] = cg, sb[k] = cb;
                mat[k] = SKY;
                floorOf[k] = 0.06 - 0.06 * Math.max(darkSky[k], dark[k]);
            }
            else {
                // land: the afterglow caught only in the far rows near the sun
                const g = glowSun(x, HZ + 1) * Math.exp(-(y - HZ) / 3.2);
                mat[k] = y < HZ + 4 ? PLAIN : FIELD;
                sr[k] = 0.06 + 0.55 * g, sg[k] = 0.045 + 0.3 * g, sb[k] = 0.08 + 0.1 * g;
                floorOf[k] = 0.06;
            }
            // a shelterbelt of trees on the far horizon, half lost in the rain
            const belt = HZ + 2 - (1.5 + 2.2 * fbm(x * 0.3, 2, 2, 0)) * smooth(140, 150, x) * smooth(196, 186, x);
            const belt2 = HZ + 2 - (1 + 1.8 * fbm(x * 0.35, 9, 2, 0)) * smooth(0, 4, x) * smooth(18, 10, x);
            if (y >= Math.min(belt, belt2) && y < HZ + 3)
                mat[k] = BELT;
            // the cottonwood by the house
            const tx = (x + 0.5 - 31) / 8.5, ty = (y - (hb - 10)) / 7;
            const crown = tx * tx + ty * ty < 1 + 0.35 * (fbm(x * 0.4, y * 0.4, 2, 0) - 0.5);
            if (crown || (Math.abs(x + 0.5 - 31.5) < 1 && y > hb - 6 && y < hb + 1))
                mat[k] = TREE;
            // the farmhouse: two storeys, a gable roof, a chimney, a porch
            if (x >= HX0 && x <= HX1 && y >= HW0 && y < hb + 1)
                mat[k] = HOUSE;
            if (y >= HW0 - 7 && y < HW0 && Math.abs(x + 0.5 - 47.5) <= 8.6 - (HW0 - y) * 1.15)
                mat[k] = ROOF;
            if (x >= 50 && x <= 51 && y >= HW0 - 8 && y < HW0 - 3)
                mat[k] = ROOF;
            if (x >= 36 && x < HX0 && y >= hb - 4 && y < hb - 3)
                mat[k] = ROOF;
            if (x === 36 && y >= hb - 3 && y < hb)
                mat[k] = HOUSE;
            if (x >= 49 && x <= 51 && y >= HW0 + 2 && y < HW0 + 5)
                mat[k] = PANE;
            if (x >= 43 && x <= 44 && y >= HW0 + 2 && y < HW0 + 4)
                mat[k] = PANE;
            // the windpump: a tapering lattice tower
            const py = y - PUMP_Y;
            if (py > 2 && y < hb + 0.5) {
                const half = 0.4 + py * 0.11;
                const dx = x + 0.5 - PUMP_X;
                if (Math.abs(Math.abs(dx) - half) < 0.55)
                    mat[k] = PUMP;
                if (Math.abs(dx) < half && (py | 0) % 4 === 0)
                    mat[k] = PUMP;
            }
        }
    }
    // the road: from the yard to the bottom edge, a leading line
    const roadC = (p) => 57 + 62 * Math.pow(p, 1.25);
    const roadW = (p) => 0.6 + 12 * p;
    for (let r = HZ + 3; r < H; r++) {
        const p = (r + 0.5 - HZ) / (H - HZ);
        for (let x = 0; x < W; x++) {
            const k = r * W + x;
            if (mat[k] !== FIELD)
                continue;
            if (Math.abs(x + 0.5 - roadC(p)) < roadW(p) + 0.6 * (noise(x * 0.3, r * 0.3, 0) - 0.5))
                mat[k] = ROAD;
        }
    }
    // wheat: stalks in perspective, their columns converging on the farmhouse,
    // tall strokes up close and a fine grain toward the horizon
    const VX = 57;
    const TW = 512;
    const wheat = new Float32Array(H * TW);
    const persp = new Float32Array(N); // each cell's column in the wheat texture
    for (let r = HZ; r < H; r++) {
        const p = (r + 0.5 - HZ) / (H - HZ);
        for (let u = 0; u < TW; u++)
            wheat[r * TW + u] = fbm(u * 0.55, r * (0.5 - 0.42 * p), 3, TW * 0.55);
        for (let x = 0; x < W; x++)
            persp[r * W + x] = ((x + 0.5 - VX) * 24) / (r + 2 - HZ) + 256;
    }
    // how much light the field holds: the sun side, the far rows, not the east
    // or the foreground, which sink into the storm's shadow
    const fieldLight = new Float32Array(N);
    for (let r = HZ; r < H; r++) {
        const y = r + 0.5;
        const p = (y - HZ) / (H - HZ);
        for (let x = 0; x < W; x++) {
            const sunW = Math.exp(-(((x - SUN[0]) / 100) ** 2));
            const east = smooth(80, 130, x + 10 * p);
            const fore = 1 - 0.6 * smooth(H - 22, H - 2, y);
            fieldLight[r * W + x] = (0.72 + 0.45 * sunW) * (1 - 0.35 * east) * fore;
        }
    }
    // gusts: soft patches of bent, brighter wheat rolling across the field
    const GW = 512;
    const gust = new Float32Array(GW * (H - HZ));
    for (let r = HZ; r < H; r++)
        for (let u = 0; u < GW; u++)
            gust[(r - HZ) * GW + u] = smooth(0.4, 0.7, fbm(u * 0.025, r * 0.16, 3, GW * 0.025));
    // thin glowing streaks of altostratus in the clear western sky
    const CW = 400;
    const streak = new Float32Array(CW * HZ);
    for (let r = 0; r < HZ; r++)
        for (let u = 0; u < CW; u++) {
            const n = fbm(u * 0.02, r * 0.2, 4, CW * 0.02);
            streak[r * CW + u] = smooth(0.64, 0.8, n) * smooth(40, 46, r) * smooth(HZ - 3, 52, r);
        }
    // stars in the darkest part of the sky
    const stars = [];
    for (let r = 0; r < 28; r++)
        for (let x = 0; x < 100; x++)
            if (hash(x, r * 5 + 3) > 0.986 && cloud[r * W + x] < 0.05)
                stars.push([r * W + x, hash(x, r) * 6.28, 1 + hash(r, x) * 2.5, 0.85 * (1 - r / 28) * (1 - x / 130)]);
    const star = new Float32Array(N);
    // wheat ears right in front of us, bowing with the wind:
    // [x, stalk height, phase, foot below the frame, head length]
    const ears = [];
    for (let x = 2; x < W; x += 5 + hash(x | 0, 60) * 4)
        ears.push([x, 8 + hash(x * 3, 61) * 12, hash(x * 7, 62) * 6.28, hash(x * 5, 63) * 6, 5 + (hash(x, 64) > 0.5 ? 1 : 0)]);
    const ear = new Float32Array(N); // > 0: a lit grain head; < 0: a dark stalk
    const touched = [];
    // rain: one envelope of shafts that drifts, and falling streaks inside it
    const RW = 256;
    const shafts = new Float32Array(RW);
    for (let u = 0; u < RW; u++)
        shafts[u] = smooth(0.47, 0.57, fbm(u * 0.09375, 0.5, 2, 24));
    const colPhase = new Float32Array(W), colSpeed = new Float32Array(W);
    for (let x = 0; x < W; x++)
        (colPhase[x] = hash(x, 77) * 40), (colSpeed[x] = 22 + hash(x, 78) * 14);
    const rainTop = new Float32Array(W), rainOn = new Float32Array(W);
    for (let x = 0; x < W; x++)
        (rainTop[x] = shelfBot(x) - 1.5), (rainOn[x] = smooth(106, 118, x) * smooth(198, 186, x));
    // lightning: a fixed schedule of flashes, some carrying a bolt
    const PERIOD = 3.1;
    const bolts = [];
    for (let i = 0; i < 4; i++) {
        const segs = [];
        const walk = (x, y, len, lean, depth) => {
            for (let s = 0; s < len && y < HZ + 2; s++) {
                const nx = x + (hash(i * 97 + s, depth * 13 + 41) - 0.5) * 3.2 + lean;
                const ny = y + 0.9 + hash(i * 31 + s, depth + 42) * 1.3;
                segs.push([x, y, nx, ny, depth]);
                if (depth === 0 && hash(i * 7 + s, 43) > 0.84)
                    walk(nx, ny, 3 + hash(s, i) * 5, (hash(s, i + 9) - 0.5) * 2.4, 1);
                (x = nx), (y = ny);
            }
        };
        walk(122 + hash(i, 40) * 34, BASE - 4, 40, (hash(i, 44) - 0.5) * 0.8, 0);
        const field = new Float32Array(N).fill(99);
        for (let r = 25; r < HZ + 4; r++)
            for (let x2 = 80; x2 < W; x2++) {
                let m = 99;
                for (const [ax, ay, bx, by, dep] of segs) {
                    if (Math.abs(x2 - ax) > 14 && Math.abs(x2 - bx) > 14)
                        continue;
                    const d = segDist(x2 + 0.5, r + 0.5, ax, ay, bx, by) + dep * 0.5;
                    if (d < m)
                        m = d;
                }
                field[r * W + x2] = m;
            }
        bolts.push({ x: segs[0][0], field });
    }
    const flashAt = (t) => {
        const n = Math.floor(t / PERIOD);
        if (n > 0 && hash(n, 50) < 0.25)
            return null; // some periods stay dark
        const start = n === 0 ? -0.08 : n * PERIOD + 0.2 + hash(n, 51) * 1.6;
        const l = t - start;
        if (l < 0 || l > 0.9)
            return null;
        // a stroke and its restrikes, each a sharp rise and a fast decay
        let I = 0;
        const strikes = [0, 0.09 + hash(n, 52) * 0.06, 0.32 + hash(n, 53) * 0.2];
        for (let j = 0; j < 3; j++)
            if (l >= strikes[j])
                I += Math.exp(-(l - strikes[j]) / (j === 0 ? 0.09 : 0.06)) * (j === 0 ? 1 : 0.7 - j * 0.15);
        const bolt = n === 0 || hash(n, 54) > 0.55 ? bolts[n % 4] : null;
        const cx = bolt ? bolt.x : 115 + hash(n, 55) * 45;
        const cy = bolt ? BASE - 8 : 14 + hash(n, 56) * 24;
        return { I: Math.min(1.3, I), bolt, cx, cy, boltOn: bolt && l < 0.5 ? Math.min(1, I * 1.4) : 0, inside: 0 };
    };
    // between the big flashes, the storm keeps flickering inside itself
    const FL = 1.6;
    const flickerAt = (t) => {
        const n0 = Math.floor(t / FL);
        for (let n = n0; n >= n0 - 1 && n >= 0; n--) {
            const l = t - (n * FL + 0.35 + hash(n, 70) * 0.75);
            if (l < 0 || l > 0.6)
                continue;
            let I = 0;
            const pulses = [0, 0.08 + hash(n, 71) * 0.1, 0.26 + hash(n, 72) * 0.18];
            for (let j = 0; j < 3; j++)
                if (l >= pulses[j])
                    I += Math.exp(-(l - pulses[j]) / 0.07) * (j === 1 ? 0.7 : j === 2 ? 0.45 : 1);
            return { I: Math.min(1, I) * (0.25 + 0.2 * hash(n, 73)), bolt: null, cx: 120 + hash(n, 74) * 38, cy: 15 + hash(n, 75) * 25, boltOn: 0, inside: 1 };
        }
        return null;
    };
    return (t, { color } = {}) => {
        let f = flashAt(t);
        const fl = flickerAt(t);
        if (fl && (!f || f.I < fl.I))
            f = fl;
        const I = f ? f.I : 0;
        const inside = f ? f.inside : 0;
        const drift = t * 1.2;
        const shaftOff = t * 0.9;
        const gOff = t * 9;
        for (const [k, ph, sp, a] of stars)
            star[k] = a * (0.55 + 0.45 * Math.sin(t * sp + ph));
        // the near ears: each stalk bends from its foot, more at the tip, and the
        // gusts that roll across the field push them further
        for (const k of touched)
            ear[k] = 0;
        touched.length = 0;
        for (const [ex, eh, ph, foot, hl] of ears) {
            const gu = gust[(H - 1 - HZ) * GW + ((((ex | 0) - Math.floor(gOff * 1.5)) % GW) + GW) % GW];
            // the inflow blows toward the storm, so every ear bows a little east
            const lean = 0.7 + 0.7 * Math.sin(t * 1.7 + ph) + 1.8 * gu;
            const tall = eh + hl;
            for (let i = 0; i < tall; i++) {
                const y = Math.round(H + foot - i);
                if (y >= H)
                    continue;
                const q = i / tall;
                const x = Math.round(ex + lean * q * q);
                if (x < 0 || x + 1 >= W)
                    continue;
                const k = y * W + x;
                if (i < eh) {
                    // the stalk: a thin dark line against the field
                    if (ear[k] === 0)
                        (ear[k] = -1), touched.push(k);
                }
                else {
                    // the head: plump, two grains wide in the middle, tapering at both
                    // ends, the grains alternating side to side
                    const j = i - eh;
                    const tip = j === hl - 1;
                    const v = tip ? 0.55 : j === 0 ? 0.7 : 1 - 0.18 * (j & 1);
                    if (v > ear[k])
                        (ear[k] = v), touched.push(k);
                    if (!tip && j > 0 && v * 0.82 > ear[k + 1])
                        (ear[k + 1] = v * 0.82), touched.push(k + 1);
                    // a whisker of awns past the tip
                    if (tip && y > 0) {
                        const a = k - W + (lean > 0.5 ? 1 : 0);
                        if (ear[a] < 0.3)
                            (ear[a] = 0.3), touched.push(a);
                    }
                }
            }
        }
        for (let r = 0; r < H; r++) {
            const y = r + 0.5;
            const p = (y - HZ) / (H - HZ);
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                const m = mat[k];
                let cr = sr[k], cg = sg[k], cb = sb[k];
                let floor = floorOf[k], fade = 1, rain = 0;
                if (m === SKY) {
                    const c = cloud[k];
                    if (c < 0.98 && r < HZ) {
                        // the altostratus, lit gold toward the sun
                        const sx = x + drift, ix = Math.floor(sx), fx = sx - ix;
                        const s0 = streak[r * CW + (ix % CW)], s1 = streak[r * CW + ((ix + 1) % CW)];
                        const s = (s0 + (s1 - s0) * fx) * (1 - c) * smooth(105, 55, x) * 0.75;
                        if (s > 0.005) {
                            const sun = Math.exp(-(((x - SUN[0]) / 80) ** 2));
                            cr = mix(cr, 0.5 + 0.5 * sun, s);
                            cg = mix(cg, 0.24 + 0.36 * sun, s);
                            cb = mix(cb, 0.34 + 0.06 * sun, s);
                        }
                        if (star[k]) {
                            const v = star[k] * (1 - c);
                            cr = Math.max(cr, v * 0.9), cg = Math.max(cg, v * 0.88), cb = Math.max(cb, v);
                        }
                    }
                    // rain curtains hanging from the shelf to the ground
                    const on = rainOn[x];
                    if (on > 0 && y > rainTop[x]) {
                        const u = x + (y - BASE) * 0.42 - shaftOff;
                        const ui = ((Math.floor(u) % RW) + RW) % RW;
                        const env = shafts[ui] * on * smooth(rainTop[x], rainTop[x] + 3, y) * (1 - c * 0.7);
                        if (env > 0.01) {
                            // falling streaks, slanted with the shafts
                            const col = Math.floor(x + (y - BASE) * 0.42) % W;
                            const fall = (y * 0.4 - t * colSpeed[col] * 0.1 + colPhase[col] + 1000) % 4;
                            const lit = fall < 1.4 ? 1 : 0;
                            rain = env;
                            cr = mix(cr, 0.06 + 0.07 * lit, env * 0.88);
                            cg = mix(cg, 0.065 + 0.075 * lit, env * 0.88);
                            cb = mix(cb, 0.12 + 0.1 * lit, env * 0.88);
                        }
                    }
                }
                else if (m === FIELD || m === PLAIN) {
                    const gi = (r - HZ) * GW + ((((x - Math.floor(gOff * (0.5 + p))) % GW) + GW) % GW);
                    const gu = gust[gi];
                    const g = sr[k] - 0.06; // the gold glint just under the horizon
                    if (m === FIELD) {
                        // stalks lean with the gust and spring back
                        const sway = 0.5 * Math.sin(t * 2.1 + x * 0.05 + r * 0.17) + 2.2 * gu;
                        const u = persp[k] + sway;
                        const ui = Math.floor(u), uf = u - ui;
                        const a0 = wheat[r * TW + (ui & 511)], a1 = wheat[r * TW + ((ui + 1) & 511)];
                        const tex = a0 + (a1 - a0) * uf;
                        const v = clamp(0.55 + (tex - 0.5) * (0.9 + 1.4 * p));
                        const L = (v * 0.7 + 0.4 * gu) * fieldLight[k];
                        cr = 0.04 + 0.7 * L + 0.9 * g;
                        cg = 0.03 + 0.48 * L + 0.48 * g;
                        cb = 0.035 + 0.18 * L + 0.12 * g;
                        fade = smooth(H + 10, H - 8, y);
                    }
                    else {
                        const v = 0.75 + 0.45 * gu;
                        cr *= v, cg *= v, cb *= v;
                    }
                    floor = 0.05;
                }
                else if (m === ROAD) {
                    const sun = 0.5 + 0.5 * Math.exp(-(((x - SUN[0]) / 110) ** 2));
                    const rut = Math.abs(Math.abs(x + 0.5 - roadC(p)) - roadW(p) * 0.45) < 0.4 + p * 0.8 ? 0.6 : 1;
                    const L = (0.6 + 0.3 * noise(x * 0.5, r * 0.5, 0)) * sun * rut * (1 - 0.65 * p);
                    cr = 0.08 + 0.42 * L, cg = 0.06 + 0.3 * L, cb = 0.07 + 0.26 * L;
                    fade = smooth(H + 10, H - 8, y);
                    floor = 0.05;
                }
                else if (m === BELT) {
                    // far trees: dark, hazed toward the rain
                    const h = smooth(130, 190, x);
                    cr = mix(0.07, 0.1, h), cg = mix(0.05, 0.1, h), cb = mix(0.1, 0.17, h);
                    floor = 0.06;
                }
                else if (m === TREE) {
                    const rim = noise(x * 0.6, y * 0.6, 0);
                    cr = 0.06 + 0.06 * rim, cg = 0.04 + 0.03 * rim, cb = 0.07 + 0.04 * rim;
                    floor = 0.03;
                }
                else if (m === HOUSE || m === PUMP) {
                    // back-lit by the afterglow: a dark silhouette with a warm western rim
                    const rim = m === HOUSE && x === HX0 ? 0.18 : 0;
                    cr = 0.07 + rim, cg = 0.05 + rim * 0.55, cb = 0.09 + rim * 0.3;
                    floor = 0.03;
                }
                else if (m === ROOF) {
                    cr = 0.1, cg = 0.06, cb = 0.1;
                    floor = 0.03;
                }
                else if (m === PANE) {
                    const g = 0.88 + 0.12 * Math.sin(t * 2.3 + x) * Math.sin(t * 3.7);
                    const small = x < 46 ? 0.6 : 1;
                    cr = g * small, cg = 0.72 * g * small, cb = 0.3 * g * small;
                    floor = 0.3;
                }
                const e = ear[k];
                if (e > 0) {
                    // a grain head, warm and brightest on its sunward edge
                    const sunW = Math.exp(-(((x - SUN[0]) / 120) ** 2));
                    const L = e * (0.5 + 0.5 * sunW);
                    (cr = 0.95 * L), (cg = 0.68 * L), (cb = 0.3 * L), (fade = 1), (floor = 0.1);
                }
                // the windpump's wheel, turning slowly, and its tail vane
                const wx = x + 0.5 - PUMP_X, wy = y - PUMP_Y;
                if (wx > -4 && wx < 7 && wy > -4 && wy < 4) {
                    const wd = Math.sqrt(wx * wx + wy * wy);
                    if (wd < 3.6 && wd > 0.4 && (Math.cos((Math.atan2(wy, wx) - t * 1.6) * 8) > 0.2 || wd < 1))
                        (cr = 0.07), (cg = 0.05), (cb = 0.09), (floor = 0.03);
                    if (wy > -1 && wy < 0.6 && wx > 2)
                        (cr = 0.07), (cg = 0.05), (cb = 0.09), (floor = 0.03);
                }
                // the lit pane's glow on the yard and the wall around it
                const lx = x + 0.5 - 50.5, ly = y - (HW0 + 3.5);
                if (m !== PANE && lx * lx + ly * ly < 200) {
                    const lg = Math.exp(-Math.sqrt(lx * lx + ly * ly * 2) / 3) * 0.5;
                    cr += lg, cg += lg * 0.66, cb += lg * 0.25;
                }
                // lightning: the cloud glows from inside; the base and the rain are
                // lit from behind; a full flash reaches the land as well
                if (I > 0.01) {
                    const dx = x - f.cx, dy = (y - f.cy) * 1.3;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const c = m === SKY ? cloud[k] : 0;
                    const inner = inside ? Math.exp(-dist / 14) * c * I * 2 : Math.exp(-dist / 16) * (0.3 + 0.7 * c) * I * 1.3;
                    const back = m === SKY ? (dark[k] * 0.5 + rain * 0.8) * Math.exp(-Math.abs(dx) / 34) * I * (inside ? 0.5 : 1) : 0;
                    const amb = inside ? 0 : I * (m === SKY ? 0.08 : 0.05);
                    const lw = inner + back;
                    cr += 0.75 * lw + amb * 0.8, cg += 0.72 * lw + amb * 0.8, cb += 1.0 * lw + amb;
                    if (f.boltOn) {
                        const d = f.bolt.field[k];
                        if (d < 12 && (c < 0.6 || y > BASE - 1)) {
                            const core = smooth(1.1, 0.35, d) * f.boltOn;
                            const glow = (Math.exp(-d / 2) * 0.55 + Math.exp(-d / 7) * 0.2) * f.boltOn;
                            cr += core + glow * 0.75, cg += core + glow * 0.72, cb += core + glow;
                        }
                    }
                }
                if (e < 0) {
                    // a stalk: one unbroken line of the smallest dots in dark umber
                    out[k] = DOTS[1];
                    if (color)
                        color[k] = STALK;
                    continue;
                }
                const peak = Math.max(cr, cg, cb, 1e-4);
                const level = clamp(floor + (1 - floor) * peak * 0.97 + jit[k]) * fade;
                const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
                out[k] = DOTS[step];
                if (color) {
                    // a small dot is drawn brighter, a large one dimmer, so a gradient
                    // stays smooth across the steps; the darkest stay dark
                    const want = step ? Math.min(1, (level + 0.04) / COVER[step]) : 0;
                    const s = Math.min(0.14 + 0.86 * want, 0.45 + 0.8 * level) / peak;
                    color[k] = nearest(clamp(cr * s), clamp(cg * s), clamp(cb * s));
                }
            }
        }
        const lines = [];
        for (let r = 0; r < H; r++)
            lines.push(out.slice(r * W, (r + 1) * W).join(""));
        return lines.join("\n");
    };
}

    return { meta: meta, make: stormPlains };
  })();

  // -------------------------------------------------------------
  // Scene: desert-night
  // -------------------------------------------------------------
  SCENES["desert-night"] = (function () {
const meta = {
    name: "desert night",
    category: "scenes",
    note: "the milky way over a lone acacia on moonless dunes, meteors falling",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 15,
    ground: "#04060c",
    palette: [
        "#0a1024", "#101830", "#16213f", "#1e2b50", "#283864", "#34477a", "#45598f", "#5a6fa6", "#7488bd",
        "#93a5d2", "#b6c3e4", "#d8e0f2", "#f4f6fb",
        "#fff3dc", "#ffe2b4", "#f5c98e", "#e2a86e", "#c4864f", "#9c6440", "#74492f",
        "#2a2230", "#3d2f3a", "#56404a", "#735358", "#946a62", "#b6836c",
        "#4a3b48", "#6b5562", "#8a6f7a", "#a88590", "#c9a3a3", "#e2bfb4",
        "#2a2448", "#3d3466", "#57498a", "#7a68a8",
        "#ffd8a8", "#cfe0ff", "#a9c4ff",
        "#ff9a52", "#e07a3e",
        "#0d0f1a", "#151827",
    ],
};
const W = 200, H = 100;
const K = 0.62;
const HZ = 64; // eye level, in rows
const CAM = 6;
const HMAX = 16; // no dune is taller
const TOWN = [30, 66]; // the far glow, just under the horizon
const CORE = [152, 38]; // the galaxy's bright centre
const ARC = [50, 209.8, 199.8]; // the milky way's arch: centre and radius
const ARC_S = [-1.035, 0.8]; // its angle at the core, and the sweep to the west edge
const ACACIA = 150;
const DOTS = " ·•●";
const COVER = [0, 0.3, 0.6, 1];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
function hash(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, octaves) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
        s += amp * noise(x * f + i * 31.7, y * f);
        n += amp;
        amp *= 0.5;
        f *= 2;
    }
    return s / n;
}
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => {
    const k = clamp((v - a) / (b - a));
    return k * k * (3 - 2 * k);
};
const mix = (a, b, k) => a + (b - a) * k;
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
// Where a point sits across the dunes' wave: 0 at a trough, rising gently up
// the windward side to the crest at 0.72, then dropping down the slip face.
function phase(x, z) {
    const p = x * 0.9 + z * 0.42 + 26 * fbm(x * 0.014, z * 0.014, 3);
    const q = p / 19;
    return q - Math.floor(q);
}
// The tall dune the acacia stands on: a sharp crest that snakes toward us from
// its summit, a gentle face on the town's side and a steep one on the other.
const crestX = (z) => {
    const k = clamp((z - 22) / 52);
    return -4 + 26 * k * k * (3 - 2 * k) + 5 * Math.sin((z - 22) * 0.09);
};
function ridge(x, z) {
    if (z < 8)
        return 0;
    const hc = z <= 74 ? 0.5 + 13 * Math.pow(clamp((z - 12) / 62), 1.25) : 13.5 * (1 - (z - 74) / 9);
    const dx = x - crestX(z);
    return hc - (dx < 0 ? -dx * 0.36 : dx * 0.8);
}
function dunes(x, z) {
    const u = phase(x, z);
    const prof = u < 0.72 ? Math.pow(u / 0.72, 1.5) : Math.pow((1 - u) / 0.28, 0.75);
    const rg = ridge(x, z);
    // the field lies low around the big dune so its faces stay clean
    const amp = (1 + 4.5 * fbm(x * 0.008 + 5, z * 0.008, 2)) * (1 - 0.8 * smooth(-3, 3, rg));
    return Math.max(prof * amp, rg) + 0.3 * fbm(x * 0.05, z * 0.05, 2);
}
function march(u, v) {
    let z = 3, prev = z;
    for (let i = 0; i < 300 && z < 600; i++) {
        const y = CAM + v * z;
        if (v > 0 && y > HMAX)
            return 0;
        const gap = y - dunes(u * z, z);
        if (gap < 0) {
            let a = prev, b = z;
            for (let j = 0; j < 7; j++) {
                const m = (a + b) / 2;
                if (CAM + v * m - dunes(u * m, m) < 0)
                    b = m;
                else
                    a = m;
            }
            return b;
        }
        prev = z;
        z += Math.max(0.25, gap * 0.5) + z * 0.004;
    }
    return 0;
}
function desertNight() {
    const P = meta.palette.map(hex);
    const N = W * H;
    const out = new Array(N);
    const lut = new Uint8Array(32768).fill(255);
    const nearest = (r, g, b) => {
        const k = (Math.min(31, (r * 31.99) | 0) << 10) | (Math.min(31, (g * 31.99) | 0) << 5) | Math.min(31, (b * 31.99) | 0);
        if (lut[k] !== 255)
            return lut[k];
        let best = 0, bd = 1e9;
        for (let i = 0; i < P.length; i++) {
            const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
            const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
            if (d < bd)
                (bd = d), (best = i);
        }
        return (lut[k] = best);
    };
    const unit = (v) => {
        const n = Math.hypot(...v);
        return v.map((c) => c / n);
    };
    // the town's light comes in low from ahead and to the left
    const L = unit([-0.8, 0.32, 0.5]);
    // the galaxy's cool fill, from up and to the right
    const G = unit([0.6, 0.5, 0.4]);
    // --- the dunes, raymarched once ------------------------------------------
    const SKY = 0, SAND = 1, TREE = 2;
    const mat = new Uint8Array(N);
    const depth = new Float32Array(N);
    const sR = new Float32Array(N), sG = new Float32Array(N), sB = new Float32Array(N);
    const crest = new Float32Array(N);
    const top = new Int16Array(W).fill(H);
    for (let r = 0; r < H; r++) {
        const v = ((HZ - (r + 0.5)) / 100) * K;
        for (let x = 0; x < W; x++) {
            const u = ((x + 0.5 - 100) / 100) * K;
            const z = march(u, v);
            if (!z)
                continue;
            const k = r * W + x;
            mat[k] = SAND;
            depth[k] = z;
            if (r < top[x])
                top[x] = r;
            const px = u * z, py = CAM + v * z;
            const e = 0.2;
            const hx = (dunes(px + e, z) - dunes(px - e, z)) / (2 * e);
            const hz = (dunes(px, z + e) - dunes(px, z - e)) / (2 * e);
            const nl = Math.hypot(hx, 1, hz);
            const nx = -hx / nl, ny = 1 / nl, nz = -hz / nl;
            let lit = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
            if (lit > 0) {
                // a soft shadow: how close the ray to the light passes over the sand
                let sh = 1;
                for (let s = 0.6; s < 90; s += 0.5 + s * 0.05) {
                    const qx = px + L[0] * s, qy = py + L[1] * s + 0.05, qz = z + L[2] * s;
                    if (qy > HMAX)
                        break;
                    sh = Math.min(sh, (qy - dunes(qx, qz)) / (0.08 * s));
                    if (sh <= 0)
                        break;
                }
                lit *= clamp(sh);
            }
            lit = Math.min(1, Math.pow(lit, 1.4) * 1.45); // faces square to the light stand out
            // brightest along the crests, shading down each face into the trough
            const ph = phase(px, z);
            const onRidge = ridge(px, z) >= dunes(px, z) - 0.35;
            const dxc = px - crestX(z);
            const fall = onRidge ? 0.5 + 0.5 * Math.exp(-Math.abs(dxc) / 7) : 0.55 + 0.45 * smooth(0.2, 0.72, ph);
            const near = 0.72 + 0.28 * smooth(5, 25, z);
            const reach = (0.55 + 0.45 * Math.exp(-Math.abs(x - TOWN[0]) / 90)) * fall * near * smooth(300, 120, z);
            // starlight from the galaxy's side, and wind ripples across every slope
            const fill = 0.045 * Math.max(0, nx * G[0] + ny * G[1] + nz * G[2]);
            const ripple = (fbm(px * 0.6 + z * 0.2, z * 0.6, 2) - 0.5) * 0.05;
            const amb = (0.02 + 0.03 * ny + ripple) * near;
            let cr = amb * 0.7 + fill * 0.45 + lit * 1.0 * reach;
            let cg = amb * 0.62 + fill * 0.65 + lit * 0.63 * reach;
            let cb = amb * 1.35 + fill * 1.2 + lit * 0.53 * reach;
            // the big dune's shadowed brink catches a line of starlight
            if (onRidge && z < 76 && dxc > 0) {
                const cellW = z * K * 0.01;
                const rim = smooth(2.2 * cellW, 0.6 * cellW, dxc) * smooth(10, 20, z);
                cr += 0.1 * rim;
                cg += 0.14 * rim;
                cb += 0.24 * rim;
            }
            // distance thins the light into the horizon's haze
            const haze = clamp(1 - Math.exp(-z / 260)) * mix(0.7, 0.92, smooth(120, 300, z));
            const hg = Math.exp(-Math.abs(x - TOWN[0]) / 40) * 0.18;
            cr = mix(cr, 0.07 + hg, haze);
            cg = mix(cg, 0.085 + hg * 0.6, haze);
            cb = mix(cb, 0.15 + hg * 0.3, haze);
            sR[k] = cr;
            sG[k] = cg;
            sB[k] = cb;
            const big = ridge(px, z) > 0.5 && z < 76 ? smooth(0.9, 0, Math.abs(dxc)) : 0;
            crest[k] = Math.max(smooth(0.07, 0, Math.abs(ph - 0.72)) * smooth(260, 30, z), big) * (0.3 + 0.7 * smooth(0, 0.2, lit));
        }
    }
    // --- the acacia, on the crest under the galaxy's core ---------------------
    const bark = new Float32Array(N); // warm light from the core caught on the canopy's top
    {
        const base = top[ACACIA];
        const canopyTop = base - 16;
        // an umbrella: a low lumpy dome on top, thinning to the tips, tufts below
        const SPAN = 17;
        const canopy = (x, px, py) => {
            const q = (px - ACACIA) / SPAN;
            if (Math.abs(q) > 1.08)
                return false;
            const topY = canopyTop + 0.4 + 2.6 * q * q + 1.3 * (noise(px * 0.3, 7.1) - 0.5);
            const botY = canopyTop + 3.8 + 1.4 * (1 - q * q) - 1.4 * smooth(0.8, 1.08, Math.abs(q)) +
                1.2 * (noise(px * 0.45, 3.3) - 0.5) + (hash(x, 51) < 0.2 ? 0.9 : 0);
            return py > topY && py < botY;
        };
        // limbs: from the fork up and out to the canopy
        const fork = [ACACIA + 0.3, base - 5];
        const limbs = [
            [[ACACIA, base + 1], fork, 1.3],
            [fork, [ACACIA - 9, canopyTop + 3], 0.8],
            [fork, [ACACIA + 1.5, canopyTop + 2], 0.75],
            [fork, [ACACIA + 10, canopyTop + 3.2], 0.8],
            [fork, [ACACIA - 4, canopyTop + 2.6], 0.55],
            [[ACACIA - 4, base - 9], [ACACIA - 14, canopyTop + 3.5], 0.55],
            [[ACACIA + 3, base - 8], [ACACIA + 15, canopyTop + 3.6], 0.5],
        ];
        for (let r = Math.max(0, canopyTop - 3); r <= base + 1; r++) {
            for (let x = ACACIA - 26; x <= ACACIA + 26; x++) {
                if (x < 0 || x >= W)
                    continue;
                const px = x + 0.5, py = r + 0.5;
                let on = canopy(x, px, py);
                for (const [[ax, ay], [bx, by], w] of limbs) {
                    const lx = bx - ax, ly = by - ay;
                    const t = clamp(((px - ax) * lx + (py - ay) * ly) / (lx * lx + ly * ly));
                    const dx = px - (ax + lx * t), dy = py - (ay + ly * t);
                    if (dx * dx + dy * dy < (w * (1 - 0.4 * t)) ** 2)
                        on = true;
                }
                if (on)
                    mat[r * W + x] = TREE;
            }
        }
        // the canopy's upper edge, rimmed by the bulge behind it
        for (let r = 1; r < H; r++) {
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                if (mat[k] !== TREE || mat[k - W] !== SKY)
                    continue;
                const dx = x + 0.5 - CORE[0], dy = (r - CORE[1]) * 1.3;
                bark[k] = 0.25 + 0.75 * Math.exp(-Math.sqrt(dx * dx + dy * dy) / 18);
            }
        }
    }
    // --- the town's lights, a few pinpricks along the far horizon -------------
    const lamps = [];
    for (let x = TOWN[0] - 9; x <= TOWN[0] + 9 && lamps.length < 5; x++) {
        const r = top[x];
        if (r >= H || depth[r * W + x] < 140 || hash(x, 91) > 0.45)
            continue;
        if (lamps.some(([k]) => Math.abs((k % W) - x) < 2))
            continue;
        lamps.push([r * W + x, hash(x, 92) * 6.28, 0.7 + hash(x, 93) * 1.4]);
    }
    // --- the sky: gradient, the town's glow and the milky way ----------------
    const kR = new Float32Array(N), kG = new Float32Array(N), kB = new Float32Array(N);
    const air = new Float32Array(N);
    const band = new Float32Array(N);
    for (let r = 0; r < H; r++) {
        for (let x = 0; x < W; x++) {
            const k = r * W + x;
            const y = r + 0.5;
            const v = clamp(y / HZ);
            // a saturated navy, so the dither's specks read as colour
            let cr = 0.02 + 0.03 * v * v, cg = 0.035 + 0.045 * v * v, cb = 0.1 + 0.08 * v * v;
            // the town: an amber dome rising from below the horizon, its warmth
            // taking over from the navy rather than greying it
            const tx = x + 0.5 - TOWN[0], ty = (y - TOWN[1]) * 1.9;
            const td = Math.sqrt(tx * tx + ty * ty);
            const glow = Math.exp(-td / 16) * 0.4 + Math.exp(-td / 60) * 0.22;
            const cool = 1 - 0.85 * clamp(Math.exp(-td / 22) * 1.5);
            cr = cr * cool + glow;
            cg = cg * cool + glow * 0.5;
            cb = cb * cool + glow * 0.16;
            // airglow, a faint blue sheen low down, kept off the town; it drifts each frame
            // it peaks a little above the horizon, where the air below thins it, and
            // varies along the skyline so it never lies as one flat strip
            const along = 0.72 + 0.5 * fbm(x * 0.025 + 3, y * 0.04, 2);
            air[k] = Math.pow(smooth(0.3, 0.94, v), 3) * (1 - 0.3 * smooth(0.92, 1.02, v)) * 0.32 * cool * along;
            // the milky way, along an arc from the core up and over to the west
            const ax = x + 0.5 - ARC[0], ay = y - ARC[1];
            const d = Math.sqrt(ax * ax + ay * ay) - ARC[2];
            const sRaw = (ARC_S[0] - Math.atan2(ay, ax)) / ARC_S[1]; // 0 at the core end
            const s = clamp(sRaw);
            const end = sRaw < 0 ? Math.exp(-((sRaw / 0.05) ** 2)) : 1; // the band ends at the core
            const laneEnd = sRaw < 0 ? Math.exp(-((sRaw / 0.11) ** 2)) : 1;
            const w = 9 + 8 * Math.pow(1 - s, 1.4);
            const lane0 = (noise(s * 9, 3.3) - 0.5) * w * 0.5 * smooth(0, 0.25, s);
            let b = Math.exp(-((d / w) ** 2));
            const clump = fbm(x * 0.09, y * 0.09, 4);
            b *= 0.35 + 1.1 * smooth(0.3, 0.75, clump);
            b *= (0.55 + 0.55 * (1 - s)) * end;
            // the core's bulge
            const cx = x + 0.5 - CORE[0], cy = (y - CORE[1]) * 1.3;
            const cd = Math.sqrt(cx * cx + cy * cy);
            const core = Math.exp(-cd / 6) * 0.5 + Math.exp(-cd / 22) * 0.25;
            b += core;
            // the dust lane, a crisp rift through the bulge, and its filaments
            const nearCore = Math.exp(-cd / 16);
            const lane = Math.exp(-(((d - lane0) / (w * 0.12)) ** 2)) *
                mix((0.55 + 0.6 * fbm(x * 0.12, y * 0.12, 3)) * (0.55 + 0.45 * (1 - s)), 1, nearCore) *
                laneEnd;
            const fil = smooth(0.58, 0.78, fbm(x * 0.16 + 9, y * 0.16, 3)) * 0.6;
            b *= clamp(1 - mix(0.92, 0.97, nearCore) * lane) * (1 - fil * Math.exp(-((d / (w * 1.3)) ** 2)));
            band[k] = Math.exp(-((d / (w * 1.2)) ** 2)) * end + core;
            // warm toward the core, cool along the arm
            const warm = clamp(Math.exp(-cd / 26) * 1.2 + (1 - s) * 0.25);
            cr += b * mix(0.62, 1.0, warm) * 0.75;
            cg += b * mix(0.68, 0.9, warm) * 0.75;
            cb += b * mix(0.95, 0.74, warm) * 0.75;
            kR[k] = cr;
            kG[k] = cg;
            kB[k] = cb;
        }
    }
    // per-cell dither and floor: random in open sky, half ordered in the band
    const dith = new Float32Array(N);
    const floor0 = new Float32Array(N);
    for (let r = 0; r < H; r++) {
        for (let x = 0; x < W; x++) {
            const k = r * W + x;
            const bay = BAYER[(r & 3) * 4 + (x & 3)];
            if (mat[k] === SKY) {
                // the band and the glow low down get a wider, half-ordered dither, so
                // their gradients fade out instead of stopping at an edge
                const inb = clamp(band[k]);
                const soft = Math.max(inb, clamp(air[k] / 0.2));
                const rnd = (hash(x * 3 + 1, r * 5 + 2) - 0.5) * mix(0.6, 0.94, soft);
                dith[k] = mix(rnd, bay, 0.5 * soft);
                floor0[k] = 0.1 * inb;
            }
            else {
                dith[k] = bay;
                floor0[k] = mat[k] === SAND ? 0.02 : 0;
            }
        }
    }
    // --- stars: thick in the band, a few bright ones everywhere ---------------
    const stars = [];
    for (let r = 0; r < HZ + 2; r++) {
        for (let x = 0; x < W; x++) {
            const k = r * W + x;
            if (mat[k] !== SKY)
                continue;
            const p = 0.015 + 0.12 * clamp(band[k]);
            if (hash(x * 7 + 3, r * 13 + 1) > p)
                continue;
            const m = Math.pow(hash(x * 5 + 1, r * 3 + 7), 12);
            const bright = (0.2 + 0.95 * m) * smooth(HZ + 1, HZ - 6, r + 0.5);
            const c = hash(x * 11, r * 17 + 5);
            const tint = c < 0.2 ? [0.78, 0.86, 1] : c < 0.9 ? [1, 1, 1] : [1, 0.82, 0.6];
            stars.push([k, bright, tint, 1.5 + hash(x, r * 9) * 4, hash(r, x * 3) * 6.28]);
        }
    }
    const FR = new Float32Array(N), FG = new Float32Array(N), FB = new Float32Array(N);
    const floor = new Float32Array(N);
    const AIR0 = Math.floor(HZ * 0.3);
    // meteor 0 is already falling; meteor n starts somewhere in its 7 second slot
    const meteor = (n) => {
        const start = n === 0 ? -0.35 : 7 * (n - 1) + 2.5 + hash(n, 71) * 2.5;
        const x0 = n === 0 ? 199 : 30 + hash(n, 72) * 140;
        const y0 = n === 0 ? 4 : 4 + hash(n, 73) * 18;
        // each one heads across the sky rather than straight off its nearer edge
        const a = n === 0 ? 2.65 : (x0 > 100 ? 2.6 : 0.55) + (hash(n, 75) - 0.5) * 0.4;
        return [start, x0, y0, Math.cos(a), Math.sin(a), 52 + hash(n, 76) * 30];
    };
    return (t, { color } = {}) => {
        FR.set(kR);
        FG.set(kG);
        FB.set(kB);
        floor.set(floor0);
        // the airglow drifts slowly along the horizon
        for (let r = AIR0; r < HZ + 2; r++) {
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                if (mat[k] !== SKY)
                    continue;
                const a = air[k] * (0.86 + 0.28 * noise((x - t * 0.3) * 0.03, r * 0.08));
                FR[k] += a * 0.3;
                FG[k] += a * 0.5;
                FB[k] += a * 1.2;
            }
        }
        for (let k = 0; k < N; k++) {
            const m = mat[k];
            if (m === SAND) {
                FR[k] = sR[k];
                FG[k] = sG[k];
                FB[k] = sB[k];
                const c = crest[k];
                if (c > 0) {
                    // sand glinting along the brink of each slip face
                    const h = hash(k, 5);
                    const g = c * Math.pow(Math.max(0, Math.sin(t * (0.8 + 2.2 * h) + h * 40)), 8) * 0.5;
                    FR[k] += g;
                    FG[k] += g * 0.85;
                    FB[k] += g * 0.7;
                }
            }
            else if (m === TREE) {
                const e = bark[k];
                FR[k] = e * 0.42;
                FG[k] = e * 0.3;
                FB[k] = e * 0.2;
                floor[k] = e > 0 ? 0.1 : 0;
            }
        }
        for (const [k, b, tint, rate, ph] of stars) {
            const tw = b > 0.35 ? 0.72 + 0.28 * Math.sin(t * rate + ph) : 0.6 + 0.4 * Math.sin(t * rate + ph);
            const s = b * tw;
            FR[k] += s * tint[0];
            FG[k] += s * tint[1];
            FB[k] += s * tint[2];
            floor[k] = 0.28;
        }
        for (const [k, ph, rate] of lamps) {
            const g = 0.42 + 0.14 * Math.sin(t * rate + ph) * Math.sin(t * rate * 2.3 + ph * 3);
            FR[k] = g;
            FG[k] = 0.85 * g;
            FB[k] = 0.66 * g;
            floor[k] = 0.12;
        }
        // a meteor, if one is crossing
        const n = Math.floor((t - 2.5) / 7) + 1;
        for (let i = Math.max(0, n - 1); i <= n + 1; i++) {
            const [start, x0, y0, dx, dy, speed] = meteor(i);
            const age = t - start;
            if (age < 0 || age > 0.9)
                continue;
            const fadeIn = smooth(0, 0.12, age), fadeOut = smooth(0.9, 0.6, age);
            const hx = x0 + dx * speed * age, hy = y0 + dy * speed * age * 0.75;
            const len = Math.min(28, speed * age);
            for (let j = 0; j < len * 2; j++) {
                const f = j / (len * 2);
                const px = Math.round(hx - dx * f * len), py = Math.round(hy - dy * f * len * 0.75);
                if (px < 0 || px >= W || py < 0 || py >= H)
                    continue;
                const k = py * W + px;
                if (mat[k] !== SKY)
                    continue;
                const s = (1 - f) * fadeIn * fadeOut * 1.25;
                FR[k] = Math.max(FR[k], s * 0.9);
                FG[k] = Math.max(FG[k], s * 0.96);
                FB[k] = Math.max(FB[k], s);
                floor[k] = Math.max(floor[k], s > 0.12 ? 0.4 : 0);
            }
        }
        for (let r = 0; r < H; r++) {
            const edge = smooth(H + 1, H - 12, r + 0.5);
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                const cr = FR[k], cg = FG[k], cbl = FB[k], fl = floor[k];
                const peak = Math.max(cr, cg, cbl, 1e-4);
                const sky = mat[k] === SKY;
                const level = clamp(fl + (1 - fl) * Math.pow(peak, sky ? 0.92 : 0.75)) * edge;
                const step = Math.max(0, Math.min(3, Math.round(level * 3 + dith[k])));
                out[k] = DOTS[step];
                if (color) {
                    const want = step ? Math.min(1, (level + 0.06) / COVER[step]) : 0;
                    const s = (0.3 + 0.7 * want) / peak;
                    color[k] = nearest(clamp(cr * s), clamp(cg * s), clamp(cbl * s));
                }
            }
        }
        const lines = [];
        for (let r = 0; r < H; r++)
            lines.push(out.slice(r * W, (r + 1) * W).join(""));
        return lines.join("\n");
    };
}

    return { meta: meta, make: desertNight };
  })();

  // -------------------------------------------------------------
  // Scene: deep-reef
  // -------------------------------------------------------------
  SCENES["deep-reef"] = (function () {
const meta = {
    name: "deep reef",
    category: "scenes",
    note: "light shafts, swaying kelp and a turning school of fish over a reef",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 15,
    ground: "#03101a",
    // A dot is never drawn darker than about half brightness (dot size carries
    // the darkness), so the palette starts at mid tones.
    palette: [
        "#114a66", "#165c78", "#1d708a", "#27869b", "#3a9fae", "#58b9c0", "#80d2d2", "#b0e8e2", "#e2fbf5",
        "#5e6b62", "#87927f", "#aab39a", "#cfd2b4",
        "#38461a", "#5a6420", "#857f2a", "#b0a03c", "#d6c25a", "#efe08e",
        "#8e3355", "#c4506a", "#e0786e", "#f0a070",
        "#6a3a78", "#9a5aa8", "#c88ad0",
        "#6f8a98", "#9fb8c6", "#cfe3ea",
    ],
};
const W = 200, H = 100;
const SURF = 15; // the surface band
const HZ = 61; // where the sea floor would meet the haze
const SUNX = 136; // where the sun shows through the surface
const DOTS = " ·•●";
const COVER = [0, 0.3, 0.6, 1];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
const NONE = 0, SAND = 1, REEF = 2, FAR = 3, FAN = 4;
function hash(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, octaves) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
        s += amp * noise(x * f, y * f);
        n += amp;
        amp *= 0.5;
        f *= 2;
    }
    return s / n;
}
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => {
    const k = clamp((v - a) / (b - a));
    return k * k * (3 - 2 * k);
};
const mix = (a, b, k) => a + (b - a) * k;
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
// A seeded generator for laying things out.
function prng(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function deepReef() {
    const P = meta.palette.map(hex);
    const N = W * H;
    const lut = new Uint8Array(32768).fill(255);
    const nearest = (r, g, b) => {
        const k = (Math.min(31, (r * 31.99) | 0) << 10) | (Math.min(31, (g * 31.99) | 0) << 5) | Math.min(31, (b * 31.99) | 0);
        if (lut[k] !== 255)
            return lut[k];
        let best = 0, bd = 1e9;
        for (let i = 0; i < P.length; i++) {
            const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
            const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
            if (d < bd)
                (bd = d), (best = i);
        }
        return (lut[k] = best);
    };
    // --- caustics: a tiling web of bright lines (cell edges of a Voronoi) -----
    const CT = 64, CC = 6, CS = CT / CC;
    const caus = new Float32Array(CT * CT);
    {
        const rnd = prng(7);
        const pts = [];
        for (let j = 0; j < CC; j++)
            for (let i = 0; i < CC; i++)
                pts.push([(i + 0.15 + 0.7 * rnd()) * CS, (j + 0.15 + 0.7 * rnd()) * CS]);
        for (let y = 0; y < CT; y++) {
            for (let x = 0; x < CT; x++) {
                let f1 = 1e9, f2 = 1e9;
                for (const [px, py] of pts) {
                    for (let oy = -CT; oy <= CT; oy += CT) {
                        for (let ox = -CT; ox <= CT; ox += CT) {
                            const dx = x + 0.5 - px - ox, dy = y + 0.5 - py - oy;
                            const d = Math.sqrt(dx * dx + dy * dy);
                            if (d < f1)
                                (f2 = f1), (f1 = d);
                            else if (d < f2)
                                f2 = d;
                        }
                    }
                }
                caus[y * CT + x] = Math.pow(1 - smooth(0, 0.42 * CS, f2 - f1), 2.2);
            }
        }
    }
    const causAt = (u, v) => {
        u = ((u % CT) + CT) % CT;
        v = ((v % CT) + CT) % CT;
        const x0 = u | 0, y0 = v | 0, ax = u - x0, ay = v - y0;
        const x1 = (x0 + 1) % CT, y1 = (y0 + 1) % CT;
        const a = caus[y0 * CT + x0], b = caus[y0 * CT + x1], c = caus[y1 * CT + x0], d = caus[y1 * CT + x1];
        return a + (b - a) * ax + (c - a) * ay + (a - b - c + d) * ax * ay;
    };
    // --- the water: deep navy, lit from the surface and the sun ----------------
    const wr = new Float32Array(N), wg = new Float32Array(N), wb = new Float32Array(N);
    // which shaft each cell sits in: shafts fan out from the sun, above the frame
    const rayAt = new Uint16Array(N);
    const SUNY = -12, RAYS = 320;
    for (let r = 0; r < H; r++) {
        for (let x = 0; x < W; x++) {
            const k = r * W + x, v = (r + 0.5) / H;
            const up = Math.pow(1 - v, 2.2);
            const sun = Math.exp(-(((x - SUNX) / 52) ** 2) - (((r - 4) / 34) ** 2));
            // looking level, the distance is a lit blue haze the reefs stand against
            const haze = Math.exp(-(((r - 54) / 15) ** 2)) * (1 - 0.6 * smooth(30, 100, Math.abs(x - 112)));
            // darker toward the sides and the floor, but the upper water stays lit
            // so the kelp stands dark against it
            const edge = 1 - 0.4 * smooth(50, 104, Math.abs(x - 112)) * smooth(8, 70, r) - 0.3 * smooth(66, 100, r);
            // soft clouds of plankton haze, so open water is never one flat tone
            const veil = 0.78 + 0.44 * fbm(x * 0.022 + 5, r * 0.04, 4);
            wr[k] = (0.012 + 0.09 * up + 0.05 * sun + 0.04 * haze) * edge * veil;
            wg[k] = (0.1 + 0.32 * up + 0.14 * sun + 0.15 * haze) * edge * veil;
            wb[k] = (0.15 + 0.27 * up + 0.12 * sun + 0.17 * haze) * edge * veil;
            const a = Math.atan2(x + 0.5 - SUNX, r + 0.5 - SUNY);
            rayAt[k] = Math.max(0, Math.min(RAYS - 1, Math.round((a + 1.6) * 100)));
        }
    }
    const RAY0 = 160; // the shaft straight down from the sun
    // --- the static scene: sand, the reef, a far reef in the haze, a sea fan --
    const mat = new Uint8Array(N);
    const ar = new Float32Array(N), ag = new Float32Array(N), ab = new Float32Array(N); // lit colour
    const fog = new Float32Array(N); // how much water stands between us and it
    const cu = new Float32Array(N), cv = new Float32Array(N), cw = new Float32Array(N); // caustic coords, weight
    // both reefs are rounded masses, shouldering down toward the open sand
    const dome = (u) => 1 - Math.sqrt(Math.max(0, 1 - u * u));
    const leftTop = (x) => 47 + 56 * dome(Math.min(1, x / 86)) - 8 * fbm(x * 0.06, 3.1, 4) + 3 * Math.max(0, (10 - x) / 10);
    const rightTop = (x) => 69 + 34 * dome(Math.min(1, (196 - x) / 48)) - 5 * fbm(x * 0.08, 8.3, 3) - 3 * Math.exp(-(((x - 191) / 6) ** 2));
    const farTop = (x) => HZ - 1 - 6 * fbm(x * 0.035 + 2, 1.7, 3) - 3 * Math.exp(-(((x - 120) / 18) ** 2));
    // brain corals: domes on the crests
    // [x, depth of the centre below the crest, radius, kind]
    const domes = [[16, 3, 7, 0], [41, 2.5, 6.5, 1], [53, 2, 4.5, 3], [65, 2, 5, 2], [158, 2, 4, 2], [186, 3, 5, 1], [196, 3, 4.5, 3]]
        .map(([x, d, r, kind]) => [x, (x < 100 ? leftTop(x) : rightTop(x)) + d, r, kind]);
    const coral = [
        [0.86, 0.36, 0.44], [0.93, 0.55, 0.3], [0.6, 0.36, 0.72], [0.78, 0.7, 0.35],
    ];
    const rock = [0.016, 0.03, 0.042];
    // [x, crest row, half width, fog, coral kind]
    const BOMMIES = [[114, 69, 9, 0.18, 0], [94, 63.6, 4, 0.5, 2], [139, 64.4, 4, 0.42, 1]];
    const FAN_C = [167, rightTop(167) + 1.5], FAN_R = 27;
    for (let r = 0; r < H; r++) {
        for (let x = 0; x < W; x++) {
            const k = r * W + x, y = r + 0.5;
            // the sea floor, a plane running off into the haze
            if (r >= HZ + 2) {
                const d = y - HZ;
                const z = 300 / d; // distance
                // the floor is seen at a low angle, so its pattern squeezes toward the
                // haze; spacing grows as it comes nearer, and fades out before it
                // gets too fine to draw
                const near = 0.4 + 0.6 * (d / 38);
                const sx = (x + 0.5 - 100) / near;
                const sy = 30 * Math.log(d);
                const aa = smooth(2.2, 1.4, 30 / d);
                // ripples in the sand run across our view, bending a little: thin
                // bright crests over darker troughs
                const ph = sy + 7 * fbm(sx * 0.07, sy * 0.06, 2) + sx * 0.05;
                const crest = Math.pow(0.5 + 0.5 * Math.sin(ph), 3) * smooth(0.3, 0.6, fbm(sx * 0.09 + 7, sy * 0.12, 2));
                const rip = 0.74 + aa * (0.5 * crest - 0.12) + 0.12 * (fbm(sx * 0.08, sy * 0.15, 3) - 0.5);
                mat[k] = SAND;
                const lit = 0.6 + 0.15 * smooth(100, 130, x) - 0.3 * smooth(84, 100, r);
                ar[k] = 0.38 * rip * lit, ag[k] = 0.37 * rip * lit, ab[k] = 0.3 * rip * lit;
                fog[k] = 1 - Math.exp(-z / 40);
                cu[k] = sx * 0.9, cv[k] = sy * 2.3, cw[k] = 0.5 * smooth(14, 26, d);
            }
            if (y >= farTop(x) && r < HZ + 6) {
                mat[k] = FAR;
                // lit along its crest, dim below, half lost in the blue
                const s = (0.45 + 0.55 * fbm(x * 0.15, y * 0.15, 2)) * (0.5 + 0.8 * Math.exp(-(y - farTop(x)) / 2));
                ar[k] = 0.06 * s, ag[k] = 0.11 * s, ab[k] = 0.14 * s;
                fog[k] = 0.68;
                cw[k] = 0;
            }
            // the sea fan: a thin lattice of veins spreading up from its root
            {
                const dx = x + 0.5 - FAN_C[0], dy = FAN_C[1] - y;
                const d = Math.hypot(dx, dy), a = Math.atan2(dx, dy);
                const reach = FAN_R * (0.68 + 0.36 * fbm(a * 2.6 + 5, 1, 3));
                if (dy > -1 && Math.abs(a) < 1.2 && d < reach) {
                    const aw = a + 0.08 * (fbm(d * 0.2, a * 2, 2) - 0.5) * 4;
                    const ray = Math.abs(((aw * 7.5) / Math.PI + 100) % 1 - 0.5);
                    const ring = Math.abs(((d / 3.2) + 100) % 1 - 0.5);
                    const mesh = hash(x * 3, r * 5) < 0.08;
                    const vein = ray > 0.42 || (ring > 0.45 && d > 5) || mesh || (d < 4 && Math.abs(dx) < 1.2) || d > reach - 1.2;
                    mat[k] = FAN;
                    // dark at the root, catching the light toward its rim; between the
                    // veins a thin dim web the water shows through
                    const o = smooth(2, reach, d);
                    const s = (0.35 + 0.75 * o) * (vein ? 1 : 0.22);
                    ar[k] = mix(0.32, 0.72, o) * s, ag[k] = mix(0.12, 0.38, o) * s, ab[k] = mix(0.38, 0.8, o) * s;
                    fog[k] = vein ? 0.2 : 0.4;
                    cw[k] = 0;
                }
            }
            // small coral heads out on the sand, half lost in the blue
            for (const [bx, crest, hw, f0, kind] of BOMMIES) {
                const u = (x + 0.5 - bx) / hw;
                const top = crest + u * u * u * u * hw * 0.5 - 1.6 * fbm(x * 0.35, crest, 2);
                if (Math.abs(u) < 1.1 && y >= top && y < crest + hw * 0.5 + 1.5 * fbm(x * 0.3, crest + 5, 2) - 0.6 * u * u) {
                    mat[k] = REEF;
                    const below = y - top;
                    const living = smooth(2.2, 0.6, below) * smooth(0.45, 0.6, fbm(x * 0.25 + bx, y * 0.3, 2));
                    const lit = 0.3 + 0.6 * Math.exp(-below / 1.5);
                    const [cr0, cg0, cb0] = coral[kind];
                    ar[k] = mix(rock[0], cr0, living) * lit;
                    ag[k] = mix(rock[1], cg0, living) * lit;
                    ab[k] = mix(rock[2], cb0, living) * lit;
                    fog[k] = f0;
                    cu[k] = x * 0.5, cv[k] = y * 0.9, cw[k] = 0.5 * Math.exp(-below / 1.5);
                }
            }
            // reef masses, left and right: dark rock, rimmed with lit coral
            const tl = leftTop(x), tr = rightTop(x);
            const top = x < 100 ? tl : tr;
            if (y >= top && (x < 87 || x > 147)) {
                mat[k] = REEF;
                const below = y - top;
                const n = fbm(x * 0.18, y * 0.22, 4);
                // lumps of rock and coral heads, each lit on its upper side
                const lump = fbm(x * 0.07, y * 0.1, 3), lumpUp = fbm(x * 0.07, (y - 1.5) * 0.1, 3);
                const face = clamp(0.5 + (lumpUp - lump) * 14);
                const lit = (0.25 + 0.5 * face + 0.6 * Math.exp(-below / 5) + 0.14 * (n - 0.5)) * (0.55 + 0.45 * smooth(100, 40, r));
                // patches of living coral, thick along the crest, a few sponges below
                const kind = Math.floor(fbm(x * 0.06 + 11, y * 0.09, 3) * 7) % 4;
                const patch = fbm(x * 0.12 + 4, y * 0.12, 3);
                const living = Math.max(smooth(0.44, 0.56, patch) * smooth(7, 1.5, below), smooth(0.66, 0.72, patch) * 0.35 * smooth(24, 6, below));
                const [cr0, cg0, cb0] = coral[kind];
                // a cool rim of light along the bare rock of the crest
                const rim = smooth(2.4, 0.3, below) * 0.6;
                // and the upper lips of ledges down the face catch a little of it
                const ledge = smooth(0.66, 0.9, face) * smooth(3, 8, below) * 0.55;
                const rr = mix(mix(rock[0], 0.05, ledge), 0.12, rim), rg = mix(mix(rock[1], 0.11, ledge), 0.24, rim), rb = mix(mix(rock[2], 0.13, ledge), 0.25, rim);
                ar[k] = mix(rr, cr0, living) * lit;
                ag[k] = mix(rg, cg0, living) * lit;
                ab[k] = mix(rb, cb0, living) * lit;
                fog[k] = x < 100 ? 0.04 + 0.04 * smooth(0, 80, x) : 0.08;
                cu[k] = x * 0.5, cv[k] = y * 0.9, cw[k] = 0.8 * Math.exp(-below / 1.5);
            }
            for (const [dx0, dy0, dr, kind] of domes) {
                const dx = x + 0.5 - dx0, dy = y - dy0;
                const d = Math.hypot(dx, dy * 1.25);
                if (d < dr && dy < dr * 0.3) {
                    mat[k] = REEF;
                    const nz = Math.sqrt(Math.max(0, 1 - (d / dr) ** 2));
                    const lamb = clamp(0.15 + 0.85 * (nz * 0.6 - (dy / dr) * 0.55 + (dx / dr) * 0.25));
                    const groove = 0.75 + 0.25 * Math.sin(d * 2.4 + 2 * fbm(x * 0.3, y * 0.3, 2) * 3);
                    const [cr0, cg0, cb0] = coral[(kind + 1) % 4];
                    const s = (0.15 + 0.9 * lamb) * groove;
                    ar[k] = cr0 * s, ag[k] = cg0 * s, ab[k] = cb0 * s;
                    fog[k] = dx0 < 100 ? 0.04 + 0.04 * smooth(0, 80, dx0) : 0.08;
                    cu[k] = x * 0.5, cv[k] = y * 0.9, cw[k] = 0.5 * clamp(-dy / dr + 0.6);
                }
            }
        }
    }
    // branching coral standing up off both crests
    for (const [seed, count, x0, span, topAt] of [[31, 10, 3, 60, leftTop], [53, 3, 178, 20, rightTop]]) {
        const rnd = prng(seed);
        for (let i = 0; i < count; i++) {
            const bx = x0 + rnd() * span;
            if (Math.abs(bx - FAN_C[0]) < 3)
                continue; // leave the fan's root clear
            const base = topAt(bx);
            const h = 2 + rnd() * 3.5;
            const lean = (rnd() - 0.5) * 0.5;
            const kind = rnd() < 0.5 ? 1 : 3;
            for (let s = 0; s < h; s += 0.5) {
                const x = Math.round(bx + lean * s + (s > h * 0.55 ? (i % 2 ? 1 : -1) * (s - h * 0.55) * 0.6 : 0));
                const r = Math.round(base - s);
                if (x < 0 || x >= W || r < 0)
                    continue;
                const k = r * W + x;
                mat[k] = REEF;
                const tip = s / h;
                const [cr0, cg0, cb0] = coral[kind];
                const sh = 0.4 + 0.6 * tip;
                ar[k] = cr0 * sh, ag[k] = cg0 * sh, ab[k] = cb0 * sh;
                fog[k] = 0.06;
                cu[k] = x * 0.5, cv[k] = r * 0.9, cw[k] = 0.4;
            }
        }
    }
    // the water's colour filters what is behind it: reds go first
    const br = new Float32Array(N), bg = new Float32Array(N), bb = new Float32Array(N);
    for (let k = 0; k < N; k++) {
        if (mat[k] === NONE) {
            br[k] = wr[k], bg[k] = wg[k], bb[k] = wb[k];
            continue;
        }
        const f = fog[k];
        const tint = 1 - f;
        const ex = 1.9; // shallow water: the reef takes plenty of light
        br[k] = mix(ar[k] * ex * (0.55 + 0.45 * tint), wr[k], f);
        bg[k] = mix(ag[k] * ex * (0.85 + 0.15 * tint), wg[k], f);
        bb[k] = mix(ab[k] * ex, wb[k], f);
    }
    // --- the moving things, laid out once ------------------------------------
    const rnd = prng(1234);
    const gauss = () => {
        let s = 0;
        for (let i = 0; i < 4; i++)
            s += rnd();
        return (s - 2) * 1.7;
    };
    const fish = [];
    for (let i = 0; i < 150; i++)
        fish.push({ a: gauss() * 10, b: gauss() * 3.8, ph: rnd() * 6.28, sp: 0.8 + rnd() * 0.6 });
    // kelp: x, base row, length, width, phase, and how much water hides it
    const kelp = [];
    for (const [bx, base, len, sz, ph, haze] of [
        [14, 100, 96, 3.5, 0.0, 0], [189, 100, 96, 3.5, 5.2, 0],
    ])
        kelp.push({ bx, base, len, sz, ph, haze });
    const streams = [[44, 52, 8], [168, 66, 7], [116, 96, 6]];
    const bubbles = [];
    for (const [x0, y0, n] of streams)
        for (let i = 0; i < n; i++)
            bubbles.push({ x0, y0, ph: rnd(), sp: 4 + rnd() * 3, w: rnd() * 6.28 });
    const snow = [];
    for (let i = 0; i < 90; i++)
        snow.push({ x: rnd() * W, y: rnd() * H, sp: 0.3 + rnd() * 0.7, ph: rnd() * 6.28, b: 0.12 + rnd() * 0.22 });
    // --- each frame ------------------------------------------------------------
    const cr = new Float32Array(N), cg = new Float32Array(N), cb = new Float32Array(N), floor = new Float32Array(N);
    const rays = new Float32Array(RAYS);
    const out = new Array(N);
    const add = (x, r, R, G, B) => {
        if (x < 0 || x >= W || r < 0 || r >= H)
            return;
        const k = r * W + x;
        cr[k] += R, cg[k] += G, cb[k] += B;
    };
    const put = (x, r, R, G, B, a) => {
        if (x < 0 || x >= W || r < 0 || r >= H)
            return;
        const k = r * W + x;
        cr[k] = mix(cr[k], R, a), cg[k] = mix(cg[k], G, a), cb[k] = mix(cb[k], B, a);
    };
    return (t, { color } = {}) => {
        // shafts: a slow pattern across the surface, shimmering as the waves pass,
        // strongest straight under the sun
        for (let u = 0; u < RAYS; u++) {
            const s = Math.pow(smooth(0.5, 0.62, fbm(u * 0.06 + t * 0.025, 3.3, 3)), 1.2);
            const shimmer = 0.6 + 0.4 * noise(u * 0.18 - t * 0.7, t * 0.3);
            rays[u] = s * shimmer * (0.35 + 0.65 * Math.exp(-(((u - RAY0) / 60) ** 2)));
        }
        const cx0 = t * 0.9, cy0 = t * 0.35, cx1 = -t * 0.6 + 21, cy1 = t * 0.5 + 9;
        // the sun's blaze wobbles as the swell passes over it
        const hx = SUNX + 1.6 * Math.sin(t * 0.6) + 0.8 * Math.sin(t * 1.7 + 1);
        for (let r = 0; r < H; r++) {
            const y = r + 0.5;
            const depthFade = Math.exp(-r / 30) * smooth(0, 14, r + 6);
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                let R = br[k], G = bg[k], B = bb[k];
                const m = mat[k];
                const ray = rays[rayAt[k]] * depthFade;
                if (m === NONE) {
                    if (r < SURF + 6) {
                        // the underside of the surface: a rippling ceiling, pressed flat toward the haze
                        const dist = SURF + 7 - y;
                        const q = 30 / dist;
                        const a = causAt(((x - 100) / dist) * 1.6 + t * 1.6, q * 6 + t * 0.8);
                        const b2 = causAt(((x - 100) / dist) * 1.2 - t * 1.1 + 31, q * 4.5 - t * 0.6 + 17);
                        const lit = Math.pow(smooth(SURF + 6, 0, y), 1.3);
                        const c = Math.pow(Math.max(a, b2), 1.6);
                        const near = Math.exp(-(((x - hx) / 34) ** 2));
                        // troughs darken the water under them, crests focus light into lines
                        const dim = 1 - lit * 0.7 * (1 - c);
                        R *= dim, G *= dim, B *= dim;
                        const v = lit * c * (0.1 + 0.42 * near);
                        // the sun: a compact blaze through the surface, broken by the ripples
                        const dx = x + 0.5 - hx;
                        const hot = Math.exp(-((dx / 8) ** 2) - (((y - 6) / 3.6) ** 2)) * (1 + 0.3 * c);
                        const halo = Math.exp(-((dx / 15) ** 2) - (((y - 6) / 7) ** 2)) * 0.3 * (0.6 + 0.6 * c);
                        R += 0.55 * v + 0.9 * hot + 0.35 * halo;
                        G += 0.85 * v + 1.0 * hot + 0.6 * halo;
                        B += 0.8 * v + 0.97 * hot + 0.58 * halo;
                    }
                    R += 0.42 * ray, G += 0.86 * ray, B += 0.78 * ray;
                    floor[k] = 0;
                }
                else {
                    const f = fog[k];
                    if (cw[k] > 0) {
                        const c = Math.min(causAt(cu[k] + cx0, cv[k] + cy0), 1) * 0.6 + causAt(cu[k] * 0.8 + cx1, cv[k] * 0.8 + cy1) * 0.6;
                        const s = cw[k] * c * c * (1 - f) * (0.6 + 0.6 * ray + 0.3 * depthFade);
                        // on the sand the light comes back warm, on the reef cool
                        if (m === SAND)
                            R += 0.62 * s, G += 0.66 * s, B += 0.5 * s;
                        else
                            R += 0.55 * s, G += 0.72 * s, B += 0.62 * s;
                    }
                    R += 0.16 * ray * f, G += 0.3 * ray * f, B += 0.28 * ray * f;
                    floor[k] = 0.02;
                }
                cr[k] = R, cg[k] = G, cb[k] = B;
            }
        }
        // the school: one body turning along a slow loop, each fish a beat behind
        const pathX = (s) => 95 + 24 * Math.sin(0.11 * s + 0.4);
        const pathY = (s) => 44 + 8 * Math.sin(0.17 * s + 2.2);
        for (const f of fish) {
            const s = t - f.a * 0.08;
            const vx = 24 * 0.11 * Math.cos(0.11 * s + 0.4), vy = 8 * 0.17 * Math.cos(0.17 * s + 2.2);
            const th = Math.atan2(vy, vx);
            const ct = Math.cos(th), st = Math.sin(th);
            const wob = Math.sin(t * 1.3 * f.sp + f.ph);
            const px = pathX(s) + f.a * ct - f.b * st + wob * 0.6;
            const py = pathY(s) + f.a * st + f.b * ct + Math.cos(t * f.sp + f.ph) * 0.4;
            const h = th + 0.15 * wob;
            const dx = Math.cos(h), dy = Math.sin(h);
            // dark shapes against the light, until a fish turns its silver flank to it
            const flash = smooth(0.72, 0.97, Math.abs(Math.sin(th * 1.6 + f.a * 0.35 + f.b * 0.4 - t * 0.5 + 0.6)));
            const R0 = mix(0.008, 0.85, flash), G0 = mix(0.018, 0.97, flash), B0 = mix(0.026, 1.0, flash);
            for (let j = 0; j < 2; j++) {
                const gx = Math.round(px - dx * j * 0.9), gy = Math.round(py - dy * j * 0.9);
                put(gx, gy, R0, G0, B0, j === 0 ? 1 : 0.85);
            }
        }
        // kelp: dark fronds framing the view, a gold edge only where a shaft hits
        for (const kp of kelp) {
            const { bx, base, len, sz, ph, haze } = kp;
            const side = bx < 100 ? 1 : -1; // which way the sun lies
            for (let r = base - 1; r >= base - len; r--) {
                if (r < 0)
                    break;
                const s01 = (base - r) / len;
                const lean = side * 2.5 * sz * s01 * s01;
                // the swell runs up the frond, so it bends in an S rather than tipping like a stick
                const bend = Math.sin(t * 0.55 + ph - s01 * 4.2) * 2.2 * sz * Math.pow(s01, 1.2) + Math.sin(t * 0.21 + ph) * 1.5 * s01 + lean;
                const x = bx + bend;
                // the frond: a stipe with blades off alternate sides, each blade a lobe
                // that swells and tapers, trailing a little behind the stipe's sway
                const stem = 0.8 + 0.4 * sz * (1 - s01);
                const beat = s01 * len * 0.32 + ph;
                const lobeL = Math.pow(Math.max(0, Math.sin(beat)), 1.2) * sz * 2.3 * (1 - 0.35 * s01);
                const lobeR = Math.pow(Math.max(0, -Math.sin(beat)), 1.2) * sz * 2.3 * (1 - 0.35 * s01);
                const drag = Math.cos(t * 0.55 + ph - s01 * 4.2) * 0.8 * sz;
                const x0 = x - stem - lobeL + Math.min(0, drag), x1 = x + stem + lobeR + Math.max(0, drag);
                const ray = rays[rayAt[r * W + Math.max(0, Math.min(W - 1, Math.round(x)))]] * Math.exp(-r / 30);
                const lit = smooth(0.3, 0.6, ray);
                const xa = Math.round(x0), xb = Math.round(x1);
                for (let xx = xa; xx <= xb; xx++) {
                    if (xx < 0 || xx >= W)
                        continue;
                    const k = r * W + xx;
                    // backlit: dark through the middle, the edges glowing, the sun-facing
                    // edge most of all and gold where a shaft catches it
                    const sun = side > 0 ? xx === xb : xx === xa;
                    const rim = xx === xa || xx === xb;
                    const blade = Math.abs(xx - x) > stem ? 1 : 0;
                    // the stipe is black, the blades let a little olive light through
                    const through = blade * 0.12 * smooth(0, 1, Math.abs(xx - x) - stem) * (0.5 + 0.5 * hash(xx * 7, r * 3));
                    const g = 0.02 + through + (rim ? 0.16 : 0) + (sun ? 0.34 + 0.66 * lit * (0.4 + 0.6 * blade) : 0);
                    put(xx, r, mix(0.62 * g, wr[k], haze), mix(0.58 * g, wg[k], haze), mix(0.18 * g, wb[k], haze), 1);
                    floor[k] = 0.02;
                }
            }
        }
        // bubbles: wobbling up to the surface, growing as they rise
        for (const b of bubbles) {
            const span = b.y0 - SURF;
            const p = ((t * b.sp) / span + b.ph) % 1;
            const y = b.y0 - p * span;
            const x = b.x0 + Math.sin(y * 0.35 + b.w) * 1.2 + p * 3;
            const v = 0.55 + 0.45 * p;
            add(Math.round(x), Math.round(y), 0.7 * v, 0.95 * v, 1.0 * v);
        }
        // specks drifting in the water
        for (const s of snow) {
            const x = (((s.x + t * s.sp + 2 * Math.sin(t * 0.3 + s.ph)) % W) + W) % W;
            const y = (((s.y + t * s.sp * 0.4) % H) + H) % H;
            add(Math.floor(x), Math.floor(y), s.b * 0.7, s.b * 0.9, s.b);
        }
        for (let r = 0; r < H; r++) {
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                const R = cr[k], G = cg[k], B = cb[k];
                const peak = Math.max(R, G, B, 1e-4);
                const level = clamp(floor[k] + (1 - floor[k]) * Math.pow(peak, 0.85) * 0.95);
                const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
                out[k] = DOTS[step];
                if (color) {
                    const want = step ? Math.min(1, (level + 0.06) / COVER[step]) : 0;
                    const s = (0.3 + 0.7 * want) / peak;
                    color[k] = nearest(clamp(R * s), clamp(G * s), clamp(B * s));
                }
            }
        }
        const lines = [];
        for (let r = 0; r < H; r++)
            lines.push(out.slice(r * W, (r + 1) * W).join(""));
        return lines.join("\n");
    };
}

    return { meta: meta, make: deepReef };
  })();

  // -------------------------------------------------------------
  // Scene: misty-forest
  // -------------------------------------------------------------
  SCENES["misty-forest"] = (function () {
const meta = {
    name: "misty forest",
    category: "scenes",
    note: "pine ridges fading into morning fog, sunbeams slanting through",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 15,
    ground: "#090f0e",
    palette: [
        // sunlight and the warm fog around it
        "#fffbea", "#fff0c8", "#fbe2a6", "#f2c97e", "#e0a95e", "#b9834a",
        // cool fog, pale to sea-green
        "#e4ebe6", "#cbe0dc", "#a8d2d0", "#86c0c2", "#68a7ac", "#4f8c93", "#3b7078",
        // pines, from the haze to the dark in front of us
        "#557570", "#456761", "#365952", "#2a4a44", "#1f3c37", "#172f2b", "#11231f",
        // moss and bark where the light touches the floor
        "#a4a35a", "#8a8f4c", "#6d7440", "#4d5530", "#7a5a3a", "#5b4532",
        // the clear sky above the fog, deepening overhead
        "#a9c3cc", "#8eadb8", "#6f93a2", "#53798a", "#3d6172", "#2b4a5a",
    ],
};
const W = 200, H = 100;
const SUN = [146, 45.5];
const SUN_R = 3.4;
const DOTS = " ·•●";
const COVER = [0, 0.3, 0.6, 1];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
const SKY = -1, FLOOR = 5, GIANT = 6;
function hash(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
        x0 = ((xi % period) + period) % period;
        x1 = (x0 + 1) % period;
    }
    const a = hash(x0, yi), b = hash(x1, yi), c = hash(x0, yi + 1), d = hash(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, octaves, period) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
        s += amp * noise(x * f, y * f, period * f);
        n += amp;
        amp *= 0.5;
        f *= 2;
    }
    return s / n;
}
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => {
    const k = clamp((v - a) / (b - a));
    return k * k * (3 - 2 * k);
};
const mix = (a, b, k) => a + (b - a) * k;
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
// The ridges, far to near: [ridge row, its rise and fall, tree spacing, tree
// heights from and to, haze, how fast its fog drifts, mist lying in the
// valley below it, drifting fog in front of it, sunbeam in front of it]
const LAYERS = [
    [50, 6, 1.6, 1, 2.5, 0.48, 0.8, 1, 0.14, 0.6],
    [59, 6, 2, 3, 5.5, 0.3, 1.3, 0.8, 0.16, 0.8],
    [69, 7, 2.6, 4, 7, 0.13, 2, 0.66, 0.18, 0.9],
    [80, 6, 3.4, 5, 9, 0.03, 2.8, 0.44, 0.14, 1],
    [90, 1.5, 10, 9, 24, 0.03, 3.4, 0, 0.08, 0.6],
];
const NEAR = LAYERS.length - 1;
function mistyForest() {
    const P = meta.palette.map(hex);
    const N = W * H;
    const out = new Array(N);
    const lut = new Uint8Array(32768).fill(255);
    const nearest = (r, g, b) => {
        const k = (Math.min(31, (r * 31.99) | 0) << 10) | (Math.min(31, (g * 31.99) | 0) << 5) | Math.min(31, (b * 31.99) | 0);
        if (lut[k] !== 255)
            return lut[k];
        let best = 0, bd = 1e9;
        for (let i = 0; i < P.length; i++) {
            const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
            const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
            if (d < bd)
                (bd = d), (best = i);
        }
        return (lut[k] = best);
    };
    // the colour of the fog: cool and green-grey, warming to cream by the sun
    const fogR = (s) => mix(0.7, 1.05, s), fogG = (s) => mix(0.92, 0.92, s), fogB = (s) => mix(0.9, 0.6, s);
    // --- the layers, rasterised far to near so nearer ones cover farther -----
    const layer = new Int8Array(N).fill(SKY);
    const edge = new Float32Array(N); // how much a cell sits on a silhouette's sunward rim
    const below = new Float32Array(N); // rows below the layer's tree line
    const tex = new Float32Array(N); // the lower edge of a tier of boughs, near trees only
    const ground = new Float32Array(N); // the row a cell's ridge rises from, for its valley mist
    LAYERS.forEach(([Y, amp, gap, h0, h1], i) => {
        // nearer ridges dip toward the sun, a valley opening onto the light
        const ridge = (x) => Y + amp * (fbm(x * (0.018 + i * 0.003), i * 13 + 2, 3, 0) - 0.5) * (i < 3 ? 4 : 3) + (i > 0 && i < NEAR ? (2 + i * 2) * Math.exp(-(((x - SUN[0] - 4) / 38) ** 2)) : 0);
        const base = Float32Array.from({ length: W }, (_, x) => ridge(x));
        const fill = new Uint8Array(N);
        const spire = new Uint8Array(N);
        for (let x = 0; x < W; x++)
            for (let r = Math.max(0, Math.floor(ridge(x))); r < H; r++)
                fill[r * W + x] = 1;
        // pines: a spire of tiers, each tier flaring out and stepping back in
        for (let tx = -2 + hash(i, 1) * gap; tx < W + 2; tx += gap * (0.7 + hash(tx | 0, i + 3) * 0.7)) {
            // the nearest trees leave a clearing under the sun for the light to land in
            if (i === NEAR && tx > 92 && tx < 140)
                continue;
            const th = h0 + (h1 - h0) * hash(tx * 7 | 0, i + 5);
            const tip = ridge(tx) - th;
            const tier = 2 + th * 0.12;
            for (let r = Math.max(0, Math.floor(tip)); r < Math.min(H, ridge(tx) + 2); r++) {
                const d = r + 0.5 - tip;
                if (d < 0)
                    continue;
                const saw = (d % tier) / tier;
                const half = d * 0.3 * (0.6 + 0.5 * saw) + 0.35;
                for (let x = Math.max(0, Math.floor(tx - half)); x <= Math.min(W - 1, Math.ceil(tx + half)); x++) {
                    const dx = Math.abs(x + 0.5 - tx);
                    if (dx > half)
                        continue;
                    const k = r * W + x;
                    fill[k] = spire[k] = 1;
                    if (i === NEAR)
                        tex[k] = smooth(0.62, 0.95, saw) * smooth(0.3, 0.85, dx / half) * (0.55 + 0.45 * hash(x, r * 5));
                }
            }
        }
        // where the silhouette starts in each column, smoothed a little so the
        // mist line follows the forest rather than every single spire
        const top = new Float32Array(W).fill(H);
        for (let x = 0; x < W; x++)
            for (let r = 0; r < H; r++)
                if (fill[r * W + x]) {
                    top[x] = r;
                    break;
                }
        const line = top.map((_, x) => {
            let s = 0;
            for (let d = -3; d <= 3; d++)
                s += top[Math.min(W - 1, Math.max(0, x + d))];
            return Math.max(s / 7, top[x]);
        });
        const open = (xx, rr) => xx >= 0 && xx < W && (rr < 0 || !fill[rr * W + xx]);
        for (let r = 0; r < H; r++)
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                if (!fill[k])
                    continue;
                layer[k] = i === NEAR && !spire[k] ? FLOOR : i;
                if (i !== NEAR)
                    tex[k] = 0;
                below[k] = r + 0.5 - line[x];
                ground[k] = base[x];
                // a rim where the sky (or a farther layer) shows beside or above
                const toward = x < SUN[0] ? 1 : -1;
                edge[k] = open(x + toward, r) || open(x, r - 1) ? 1 : open(x + 2 * toward, r) ? 0.5 : 0;
            }
    });
    // --- what stands in front: a giant pine cut by the left of the frame, and a
    // smaller one at the right edge, so the frame is not a symmetric curtain ---
    const giant = new Uint8Array(N);
    for (const [gx, tip, spread, tier] of [[9, -12, 15, 7], [192, 12, 7, 5]]) {
        for (let r = Math.max(0, Math.floor(tip)); r < H; r++) {
            const d = r + 0.5 - tip;
            const saw = (d % tier) / tier;
            // each tier of boughs sweeps out and droops, so the outline is a stack
            // of points rather than a straight edge where it meets the frame
            const half = Math.min(spread * (0.5 + 0.5 * saw), d * 0.34 * (0.45 + 0.7 * saw) + 0.5);
            for (let x = Math.max(0, Math.floor(gx - half)); x <= Math.min(W - 1, Math.ceil(gx + half)); x++) {
                const dx = Math.abs(x + 0.5 - gx);
                // the side toward the frame stays full, so no sliver of sky shows there
                const outer = (x + 0.5 - gx) * (gx - W / 2) > 0 ? 1.6 : 1;
                const ragged = half * outer * (0.82 + 0.3 * noise(x * 0.5, r * 0.4, 0));
                if (dx <= ragged || dx < 0.9) {
                    const k = r * W + x;
                    giant[k] = 1;
                    tex[k] = smooth(0.66, 0.96, saw) * smooth(0.25, 0.8, dx / ragged) * (0.5 + 0.5 * hash(x * 3, r));
                }
            }
        }
    }
    for (let k = 0; k < N; k++)
        if (giant[k])
            (layer[k] = GIANT), (below[k] = 0);
    // a rim two cells deep on the side that faces the sun
    {
        const open = (x, r) => x >= 0 && x < W && (r < 0 || !giant[r * W + x]);
        for (let r = 0; r < H; r++)
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                if (!giant[k])
                    continue;
                const tx = x < SUN[0] ? 1 : -1;
                edge[k] = open(x + tx, r) || open(x, r - 1) ? 1 : open(x + 2 * tx, r) ? 0.6 : 0;
            }
    }
    // --- static colour --------------------------------------------------------
    const sr = new Float32Array(N), sg = new Float32Array(N), sb = new Float32Array(N);
    const fogAmt = new Float32Array(N); // how much drifting fog shows in front of a cell
    const fogSpeed = new Float32Array(N);
    const rayAmt = new Float32Array(N); // how much of a sunbeam the air in front of it holds
    const sunS = new Float32Array(N); // nearness to the sun, for the fog's warmth
    const floorLit = new Float32Array(N); // where a beam that reaches the floor lights it
    const lift = new Float32Array(N); // the dot floor, so the darkest air still shows
    const cloudAmt = new Float32Array(N); // where high cloud can show, in the sky only
    const abin = new Float32Array(N), dist = new Float32Array(N);
    const RA = 720;
    for (let r = 0; r < H; r++)
        for (let x = 0; x < W; x++) {
            const k = r * W + x;
            const y = r + 0.5;
            const L = layer[k];
            const dx = x + 0.5 - SUN[0], dy = y - SUN[1];
            const ang = Math.atan2(dy, dx);
            abin[k] = ((ang / (Math.PI * 2)) * RA + RA) % RA;
            const d = (dist[k] = Math.sqrt(dx * dx + dy * dy));
            const s = (sunS[k] = Math.exp(-Math.sqrt(dx * dx + dy * dy * 1.96) / 30));
            // a soft warm bloom over a wide radius, in the air and the fog
            const bloom = Math.exp(-d / 16) * 0.25 + Math.exp(-d / 6) * 0.1;
            let cr, cg, cb, ray;
            if (L === SKY) {
                // sky: deep overhead, paling to the fog band low down, warm by the sun
                const v = clamp(y / 52);
                const p = Math.pow(v, 1.6);
                const veil = 0.95 + 0.1 * fbm(x * 0.04, y * 0.08, 3, 0);
                cr = mix(0.065, 0.36, p) * veil, cg = mix(0.14, 0.58, p) * veil, cb = mix(0.17, 0.62, p) * veil;
                // the fog band the far ridge stands in
                const band = 0.75 * smooth(28, 50, y) * (0.55 + 0.75 * fbm(x * 0.025, y * 0.16, 3, 0));
                cr = mix(cr, fogR(0), band), cg = mix(cg, fogG(0), band), cb = mix(cb, fogB(0), band);
                // warm in hue round the sun, but falling off in brightness, so the
                // disc stands in a halo rather than a flat blaze
                const kw = s * 0.55, kb = 0.5 + 0.5 * Math.exp(-d / 9);
                cr = mix(cr, fogR(s) * kb, kw), cg = mix(cg, fogG(s) * kb, kw), cb = mix(cb, fogB(s) * kb, kw);
                const glow = Math.exp(-d / 3) * 0.3 + Math.exp(-d / 10) * 0.18;
                cr += glow + bloom, cg += glow * 0.9 + bloom * 0.78, cb += glow * 0.66 + bloom * 0.45;
                // the disc itself, a little brighter in the middle
                const disc = smooth(SUN_R + 0.6, SUN_R - 0.4, d);
                cr = mix(cr, 1.3, disc), cg = mix(cg, 1.24, disc), cb = mix(cb, 1.08, disc);
                fogAmt[k] = 0.3 * smooth(30, 50, y);
                fogSpeed[k] = 0.4;
                cloudAmt[k] = 0.75 * smooth(5, 15, y) * smooth(44, 28, y) * smooth(SUN_R + 2, SUN_R + 8, d);
                ray = 0.35 * smooth(26, 46, y);
                lift[k] = 0.04;
            }
            else if (L <= NEAR - 1) {
                const [, , , , , haze, speed, M, drift, beam] = LAYERS[L];
                // pine: dark teal, paling with distance; mist pooled just under the
                // tree line, and a sheet of it lying along the valley floor below
                const pool = smooth(2.5, 8 + L * 1.5, below[k]) * smooth(20, 11, below[k]);
                // the sheet follows the lie of the land, smoothly, so it never streaks
                const sheet = Math.exp(-(((y - (ground[k] + 5)) / 3) ** 2)) * (0.75 + 0.5 * fbm(x * 0.035, L * 7.3, 3, 0));
                const mist = clamp(Math.max(pool * 0.5, sheet) * M);
                const h = clamp(haze + (1 - haze) * mist);
                const veil = 0.9 + 0.2 * fbm(x * 0.06, y * 0.12, 3, 0);
                const pr = 0.02, pg = 0.075, pb = 0.07;
                cr = mix(pr, fogR(s) * veil, h), cg = mix(pg, fogG(s) * veil, h), cb = mix(pb, fogB(s) * veil, h);
                cr += bloom * h, cg += bloom * 0.78 * h, cb += bloom * 0.45 * h;
                const rim = edge[k] * s * (0.2 + 0.6 * (1 - haze));
                cr += rim * 0.95, cg += rim * 0.8, cb += rim * 0.45;
                fogAmt[k] = drift;
                fogSpeed[k] = speed;
                // the trees stop most of the light; the beams show in the mist between
                // (far off there is more air in front of them to hold the light)
                ray = beam * (L < 3 ? 0.45 + 0.55 * clamp(mist / M) : 0.25 + 0.75 * clamp(mist / M));
                lift[k] = 0.03;
            }
            else if (L === NEAR) {
                // the nearest pines: near-black, a faint teal on each tier's lower edge
                const g = tex[k] * 0.12;
                // (the body itself stays black, or the dither would screen it evenly)
                cr = 0.001 + g * 0.35, cg = 0.004 + g, cb = 0.004 + g * 0.9;
                const rim = edge[k] * (0.12 + 0.6 * s);
                cr += rim * 0.9, cg += rim * 0.7, cb += rim * 0.38;
                fogAmt[k] = LAYERS[L][8];
                fogSpeed[k] = LAYERS[L][6];
                ray = 0.12;
                lift[k] = 0;
            }
            else if (L === FLOOR) {
                // the forest floor: moss in clumps, sparse, fading out toward the frame
                const clump = smooth(0.42, 0.72, fbm(x * 0.09, y * 0.4, 3, 0));
                const speck = hash(x * 7, r * 11) > 0.55 ? 1 : 0.35;
                const m = (0.06 + 0.3 * clump) * speck * smooth(H + 2, H - 8, y);
                cr = 0.02 + m * 0.6, cg = 0.03 + m * 0.62, cb = 0.02 + m * 0.3;
                fogAmt[k] = 0.06;
                fogSpeed[k] = 3.4;
                ray = 0;
                // dappled patches the beams can land on
                floorLit[k] = smooth(0.32, 0.56, fbm(x * 0.06 + 3, y * 0.24, 3, 0)) * smooth(H + 3, H - 6, y);
                lift[k] = 0;
            }
            else {
                // the giants: near-black needles, the tiers drawn by a faint teal edge,
                // a warm rim two cells deep toward the light
                const g = tex[k] * 0.15;
                cr = 0.001 + g * 0.35, cg = 0.004 + g, cb = 0.004 + g * 0.9;
                // warm on the side near the sun, a cool fog-lit edge far from it
                const warm = Math.exp(-d / 50);
                const rim = edge[k] * (0.13 + 0.55 * warm);
                cr += rim * mix(0.4, 0.95, warm), cg += rim * mix(0.75, 0.66, warm), cb += rim * mix(0.72, 0.32, warm);
                fogAmt[k] = 0.04;
                fogSpeed[k] = 4;
                ray = 0.04;
                lift[k] = 0;
            }
            // the beams fan out mostly down and to the west, the way the gaps face
            ray *= 0.2 + 0.8 * smooth(1.25, 1.75, ang) * smooth(3.1, 2.6, ang);
            rayAmt[k] = ray;
            sr[k] = cr, sg[k] = cg, sb[k] = cb;
        }
    // drifting fog banks: wide soft noise that wraps so it can slide forever
    const FW = 400;
    const fog = new Float32Array(FW * H);
    for (let r = 0; r < H; r++)
        for (let u = 0; u < FW; u++)
            fog[r * FW + u] = smooth(0.42, 0.75, fbm(u * 0.022, r * 0.09, 4, FW * 0.022));
    // thin high cloud, long and flat, lit from below by the low sun
    const CH = 46;
    const cloud = new Float32Array(FW * CH);
    for (let r = 0; r < CH; r++)
        for (let u = 0; u < FW; u++) {
            const q = fbm(u * 0.01, r * 0.05, 2, FW * 0.01);
            cloud[r * FW + u] = smooth(0.44, 0.68, fbm(u * 0.016 + q * 1.5, r * 0.17, 4, FW * 0.016));
        }
    // sunbeams: a handful of wide shafts through the gaps, [angle, half width,
    // strength], with a faint grain along each, and a slower pattern sliding
    // across them so they brighten and fade
    const SHAFTS = [[1.42, 0.05, 0.7], [1.66, 0.07, 1], [1.93, 0.05, 0.8], [2.18, 0.08, 1], [2.45, 0.05, 0.75], [2.7, 0.06, 0.9], [2.95, 0.04, 0.6]];
    const rayA = new Float32Array(RA), rayB = new Float32Array(RA);
    for (let i = 0; i < RA; i++) {
        const a = (i / RA) * Math.PI * 2;
        let v = 0;
        for (const [c, w, st] of SHAFTS)
            v = Math.max(v, st * smooth(w, w * 0.35, Math.abs(a - c)));
        rayA[i] = v * (0.8 + 0.2 * fbm(i * 0.4, 3.1, 2, RA * 0.4));
        rayB[i] = smooth(0.4, 0.7, fbm(i * 0.03, 8.7, 2, RA * 0.03));
    }
    // dust in the air: [x, y, drift speed, bob phase, size]
    const motes = [];
    for (let i = 0; i < 110; i++)
        motes.push([hash(i, 1) * W, 50 + hash(i, 2) * 44, 0.3 + hash(i, 3) * 0.8, hash(i, 4) * 6.28, hash(i, 5)]);
    const mote = new Float32Array(N);
    const moteCells = [];
    return (t, { color } = {}) => {
        for (const k of moteCells)
            mote[k] = 0;
        moteCells.length = 0;
        for (const [mx, my, sp, ph, sz] of motes) {
            const x = Math.floor((((mx + t * sp + 2.5 * Math.sin(t * 0.4 + ph)) % W) + W) % W);
            const y = Math.floor(my + 2 * Math.sin(t * 0.3 + ph * 1.7) - ((t * sp * 0.2) % 6));
            if (y < 0 || y >= H)
                continue;
            const k = y * W + x;
            mote[k] = 0.5 + 0.5 * sz;
            moteCells.push(k);
        }
        // the beams hold their places (the gaps in the trees do not move) and
        // only sway a hair; a second, slower pattern drifts across them
        const shiftA = 2 * Math.sin(t * 0.35), shiftB = -t * 1.6;
        const pulse = 0.88 + 0.12 * Math.sin(t * 0.7);
        for (let r = 0; r < H; r++) {
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                let cr = sr[k], cg = sg[k], cb = sb[k];
                const s = sunS[k];
                // the fog banks drift, nearer ones faster
                const fa = fogAmt[k];
                if (fa > 0.01) {
                    const u = x + t * fogSpeed[k], ui = Math.floor(u), uf = u - ui;
                    const f0 = fog[r * FW + (ui % FW)], f1 = fog[r * FW + ((ui + 1) % FW)];
                    const a = (f0 + (f1 - f0) * uf) * fa;
                    cr = mix(cr, fogR(s), a), cg = mix(cg, fogG(s), a), cb = mix(cb, fogB(s), a);
                }
                const ca = cloudAmt[k];
                if (ca > 0.01) {
                    const u = x + t * 0.6, ui = Math.floor(u), uf = u - ui;
                    const c0 = cloud[r * FW + (ui % FW)], c1 = cloud[r * FW + ((ui + 1) % FW)];
                    const a = (c0 + (c1 - c0) * uf) * ca;
                    if (a > 0.005) {
                        // cool grey-teal, warming to gold on the undersides near the sun
                        const w = Math.exp(-dist[k] / 40);
                        cr = mix(cr, mix(0.26, 0.95, w), a), cg = mix(cg, mix(0.38, 0.72, w), a), cb = mix(cb, mix(0.42, 0.45, w), a);
                    }
                }
                // the beams: brightest near the sun, fading with distance
                const ra = rayAmt[k], fl = floorLit[k];
                let beam = 0;
                if (ra > 0.01 || fl > 0.01) {
                    const ai = abin[k];
                    const ia = Math.floor(ai + shiftA), ib = Math.floor(ai + shiftB);
                    beam = rayA[((ia % RA) + RA) % RA] * (0.6 + 0.4 * rayB[((ib % RA) + RA) % RA]) * pulse;
                }
                if (ra > 0.01 && dist[k] > SUN_R) {
                    // lit shafts brighten the air, the shadows between them dim it
                    const fall = Math.exp(-dist[k] / 80) * smooth(SUN_R, 12, dist[k]);
                    const b = (beam - 0.3) * fall * ra * 2.2;
                    if (b > 0)
                        cr += b * 1.05, cg += b * 0.8, cb += b * 0.42;
                    else {
                        const dim = 1 + b;
                        cr *= dim, cg *= dim, cb *= dim;
                    }
                }
                if (fl > 0.01) {
                    // a patch of sun on the moss where a beam lands
                    const b = beam * fl * 1.1;
                    cr += b * 1.0, cg += b * 0.78, cb += b * 0.4;
                }
                let floor = lift[k];
                if (mote[k] && dist[k] > 6) {
                    // a mote shows up where a beam catches it
                    const ia = Math.floor(abin[k] + shiftA);
                    const lit = rayA[((ia % RA) + RA) % RA] * Math.exp(-dist[k] / 90);
                    const v = mote[k] * (0.1 + 1.6 * lit) * Math.min(1, rayAmt[k] * 2);
                    if (v > 0.18) {
                        cr = Math.max(cr, v * 1.05), cg = Math.max(cg, v * 0.97), cb = Math.max(cb, v * 0.7);
                        floor = 0.3;
                    }
                }
                const peak = Math.max(cr, cg, cb, 1e-4);
                const level = clamp(floor + (1 - floor) * Math.pow(peak, 0.9) * 0.95);
                const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
                out[k] = DOTS[step];
                if (color) {
                    const want = step ? Math.min(1, (level + 0.06) / COVER[step]) : 0;
                    const sc = (0.3 + 0.7 * want) / peak;
                    color[k] = nearest(clamp(cr * sc), clamp(cg * sc), clamp(cb * sc));
                }
            }
        }
        const lines = [];
        for (let r = 0; r < H; r++)
            lines.push(out.slice(r * W, (r + 1) * W).join(""));
        return lines.join("\n");
    };
}

    return { meta: meta, make: mistyForest };
  })();

  // -------------------------------------------------------------
  // Scene: taj-dawn
  // -------------------------------------------------------------
  SCENES["taj-dawn"] = (function () {
const meta = {
    name: "taj dawn",
    category: "scenes",
    note: "the taj mahal at sunrise, mirrored in its pool through morning haze",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 15,
    ground: "#0d0a13",
    palette: [
        "#2e2a55", "#3d3870", "#514a8a", "#6a62a3", "#8a83bd",
        "#5a3a5e", "#7a4d72", "#9a6284", "#b97a92", "#d495a2",
        "#b8705a", "#d98d66", "#efab78", "#f8c98e", "#ffe2ae", "#fff3d8", "#fffcf2",
        "#8e7f9e", "#ad9cb4", "#cbb6c4", "#e3cdd2", "#f3e0dc",
        "#2a4a3e", "#36584a", "#4a6c58", "#66845f", "#8a9a68",
        "#8a4a3e", "#b0624a", "#3a2f4a", "#4e3d5a", "#f6d6c0", "#e9bfae",
        "#5e6a40", "#7d8a52", "#a3a064", "#c2b274",
    ],
};
const W = 200, H = 100;
const CX = 128; // the Taj's axis, and the canal's vanishing point
const BASE = 68; // where the Taj meets the garden, and the far end of the canal
const HZ = 60; // eye level
const S = 0.7; // cells per metre on the Taj
const SUN = [36, 40];
const MX = 45, MB = 67; // the mosque's axis and foot
const KR = 1.55; // the reflection is foreshortened so the dome reaches the canal
const DOTS = " ·•●";
const COVER = [0, 0.3, 0.6, 1];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
// materials
const SKY = 0, BGTREE = 1, MARBLE = 2, LAWN = 3, WALK = 4, POOL = 5, CYPRESS = 6, MOSQUE = 7;
function hash(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
        x0 = ((xi % period) + period) % period;
        x1 = (x0 + 1) % period;
    }
    const a = hash(x0, yi), b = hash(x1, yi), c = hash(x0, yi + 1), d = hash(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, octaves, period) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
        s += amp * noise(x * f, y * f, period * f);
        n += amp;
        amp *= 0.5;
        f *= 2;
    }
    return s / n;
}
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => {
    const k = clamp((v - a) / (b - a));
    return k * k * (3 - 2 * k);
};
const mix = (a, b, k) => a + (b - a) * k;
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
// The onion dome's profile: swelling out past the drum, then drawn to a point.
const onion = (h) => (h < 0.3 ? 0.8 + 0.2 * Math.sin((h / 0.3) * Math.PI * 0.5) : Math.pow(Math.cos(((h - 0.3) / 0.7) * Math.PI * 0.5), 1.45));
// Pointed arch: half-width at height h above the springline, for an arch of
// half-width w; zero above the apex.
const arch = (w, h) => {
    if (h <= 0)
        return w;
    const c = w * 0.5, R = w + c;
    const q = R * R - h * h;
    return q > 0 ? Math.max(0, Math.sqrt(q) - c) : 0;
};
/*
 * The Taj in metres: X across from the axis, Y up from the garden. Returns
 * [lit, recess] for marble, or null for air. lit runs 0 (shadow, facing away
 * from the sun) to 1 (facing it); recess darkens arches and niches.
 */
function taj(X, Y) {
    const ax = Math.abs(X);
    const left = X < 0 ? 1 : -1; // +1 on the sun's side
    // finial
    if (Y >= 72 && Y < 80.5 && ax <= 0.75 + (Math.abs(Y - 74.5) < 0.9 ? 0.6 : 0) + (Math.abs(Y - 77) < 0.7 ? 0.4 : 0))
        return [0.75 + 0.2 * left, 0];
    // the great dome
    if (Y >= 47.5 && Y < 72) {
        const h = (Y - 47.5) / 24.5;
        const hw = 15 * onion(h);
        if (ax <= hw) {
            // a sphere lit from the left and a little above
            const nx = X / (hw + 0.01);
            const nz = Math.sqrt(Math.max(0, 1 - nx * nx));
            return [clamp(0.3 + 0.5 * (-0.8 * nx + 0.4 * nz) + 0.2 * h), 0];
        }
    }
    // the four chhatris on the roof, two in view
    const cx = ax - 17.5;
    if (Math.abs(cx) <= 4.4 && Y >= 39.5 && Y < 55.5) {
        const nx = (X < 0 ? -cx : cx) / 4.4;
        if (Y < 41)
            return [clamp(0.5 - 0.4 * nx * left), 0];
        if (Y < 46.5) {
            if (Math.abs(cx) > 3.6)
                return null;
            const open = Math.abs(cx) < 2.6 && Math.abs(cx) > 0.6 && Y < 45.5;
            return [clamp(0.5 - 0.45 * (X < 0 ? -cx : cx) / 4 * left), open ? 0.75 : 0];
        }
        if (Y < 47.3)
            return [clamp(0.55 - 0.4 * nx * left), 0];
        const h = (Y - 47.3) / 6.5;
        if (h < 1 && Math.abs(cx) <= 4 * onion(h))
            return [clamp(0.55 - 0.6 * ((X < 0 ? -cx : cx) / (4 * onion(h) + 0.01)) * left + 0.1 * h), 0];
        if (h >= 1 && Math.abs(cx) < 0.6)
            return [0.6, 0];
    }
    // the drum under the dome
    if (Y >= 40 && Y < 47.5 && ax <= 12.2) {
        const nx = X / 12.2;
        const band = Y > 45.8 ? 0.15 : 0;
        return [clamp(0.45 - 0.55 * nx + band), 0];
    }
    // slender pinnacles at the corners of the portal and of the building
    if ((Math.abs(ax - 8.8) < 0.75 && Y >= 40 && Y < 47.5) || (Math.abs(ax - 28.2) < 0.75 && Y >= 38 && Y < 44.5))
        return [0.55 + 0.25 * left, 0];
    // the main building
    if (ax <= 28.5 && Y >= 7 && Y < 40) {
        // the portal rises a little above the parapet
        if (Y >= 38.5 && ax > 9 && (Math.floor((ax + 0.5) / 1.5) & 1))
            return null;
        if (ax <= 9) {
            // central portal: a calligraphy band round a deep pointed arch
            const hw = arch(6, Y - 25);
            if (ax <= hw && Y < 25 + 9) {
                const door = ax <= 3.2 && ax <= arch(3.2, Y - 15.5);
                return [0.35 + 0.15 * left, door ? 0.82 : 0.6 + 0.12 * (1 - smooth(25, 33, Y))];
            }
            if (ax <= hw + 0.8 && Y < 25 + 10.2)
                return [0.42, 0.35];
            if (ax > 7.6 && ax <= 9 && Y < 40)
                return [0.5 + 0.12 * left, 0.08];
            return [0.5 + 0.08 * left, 0];
        }
        if (ax <= 21) {
            // front face either side of the portal: two storeys of arched niches
            const nx = ax - 15;
            for (const [y0, y1] of [[9, 21.5], [24.5, 37]]) {
                if (Y >= y0 && Y < y1 && Math.abs(nx) <= arch(3.6, Y - (y1 - 4.5)))
                    return [0.4 + 0.1 * left, 0.5];
                if (Y >= y0 - 0.6 && Y < y1 + 0.6 && Math.abs(nx) <= arch(4.3, Y - (y1 - 4.2)) && Math.abs(nx) > 3.6)
                    return [0.45, 0.22];
            }
            return [0.5 + 0.1 * left, 0];
        }
        // chamfered corners, turned toward the sun on the left and away on the right
        const lit = 0.5 + 0.48 * left;
        const nx = ax - 24.7;
        for (const [y0, y1] of [[9, 21.5], [24.5, 37]]) {
            if (Y >= y0 && Y < y1 && Math.abs(nx) <= arch(2.2, Y - (y1 - 3)))
                return [lit * 0.7, 0.45];
        }
        return [lit, 0];
    }
    // minarets at the corners of the plinth, tapering, with three galleries
    const mx = ax - 44;
    if (Y >= 7 && Y < 57) {
        const s = X < 0 ? -mx : mx; // across the shaft, toward the sun negative
        const hw = 2.9 - 0.6 * (Y - 7) / 40;
        for (const g of [19.5, 32, 44.5]) {
            if (Y >= g && Y < g + 1.4 && Math.abs(mx) <= hw + 1.1)
                return [clamp(0.5 - 0.42 * s / (hw + 1.1) * left), Y < g + 0.5 ? 0.35 : 0];
        }
        if (Y < 46 && Math.abs(mx) <= hw)
            return [clamp(0.5 - 0.48 * (s / hw) * left), 0];
        if (Y >= 45.9 && Y < 49.5 && Math.abs(mx) <= 2.2)
            return [clamp(0.5 - 0.4 * s / 2.2 * left), Math.abs(mx) < 1.4 && Math.abs(mx) > 0.3 ? 0.7 : 0];
        if (Y >= 49.5) {
            const h = (Y - 49.5) / 4.5;
            if (h < 1 && Math.abs(mx) <= 2.5 * onion(h))
                return [clamp(0.55 - 0.55 * s / (2.5 * onion(h) + 0.01) * left), 0];
            if (h >= 1 && Y < 56 && Math.abs(mx) < 0.5)
                return [0.6, 0];
        }
    }
    // the plinth, with a row of shallow niches
    if (ax <= 47.5 && Y >= 0 && Y < 7) {
        if (Y > 6.2)
            return [0.62, 0];
        const k = (ax % 5.2) - 2.6;
        if (Y > 1.5 && Y < 5.2 && Math.abs(k) < 1.1)
            return [0.42, 0.3];
        return [0.52, 0];
    }
    return null;
}
/*
 * The red sandstone mosque that flanks the Taj, in cells: three domes over a
 * five-bay front with a tall central portal. Returns 0 for wall, 1 for dome,
 * 2 for a recess, or -1 for air. It stands against the sun, so it is mostly
 * silhouette.
 */
function mosque(xc, y) {
    const dx = xc - MX, ax = Math.abs(dx);
    // plinth
    if (y >= MB - 2.5 && y < MB && ax <= 22)
        return 0;
    // end towers, each with a small kiosk on top
    const tx = Math.abs(ax - 19.5);
    if (tx <= 1.3 && y >= MB - 13 && y < MB - 2.5)
        return 0;
    if (y >= MB - 15.5 && y < MB - 13) {
        const h = (MB - 13 - y) / 2.5;
        if (tx <= 1.8 * onion(h))
            return 1;
    }
    if (tx < 0.35 && y >= MB - 16.5 && y < MB - 15.5)
        return 1;
    // central portal, rising above the front
    if (ax <= 5.5 && y >= MB - 15 && y < MB - 2.5) {
        if (y < MB - 14.3 && (Math.floor(xc) & 1))
            return -1;
        if (ax <= arch(3.4, MB - 9.5 - y) && y >= MB - 13.5)
            return 2;
        return 0;
    }
    // the five-bay front and its parapet
    if (ax <= 18 && y >= MB - 10 && y < MB - 2.5) {
        const bay = ((ax - 5.5) % 4.2) - 2.1;
        if (ax > 6 && y >= MB - 8.5 && Math.abs(bay) <= arch(1.4, MB - 6.2 - y))
            return 2;
        return 0;
    }
    if (ax <= 18 && y >= MB - 10.8 && y < MB - 10 && (Math.floor(xc * 0.75) & 1))
        return 0;
    // side domes on drums
    const sx = Math.abs(ax - 11.5);
    if (sx <= 2.6 && y >= MB - 12 && y < MB - 10)
        return 0;
    if (y >= MB - 17 && y < MB - 12) {
        const h = (MB - 12 - y) / 5;
        if (sx <= 3.6 * onion(h))
            return 1;
    }
    if (sx < 0.35 && y >= MB - 18.5 && y < MB - 17)
        return 1;
    // the great central dome
    if (ax <= 4 && y >= MB - 16.5 && y < MB - 15)
        return 0;
    if (y >= MB - 23.5 && y < MB - 16.5) {
        const h = (MB - 16.5 - y) / 7;
        if (ax <= 5.2 * onion(h))
            return 1;
    }
    if (ax < 0.4 && y >= MB - 25.5 && y < MB - 23.5)
        return 1;
    return -1;
}
function tajDawn() {
    const P = meta.palette.map(hex);
    const N = W * H;
    const out = new Array(N);
    const lut = new Uint8Array(32768).fill(255);
    const nearest = (r, g, b) => {
        const k = (Math.min(31, (r * 31.99) | 0) << 10) | (Math.min(31, (g * 31.99) | 0) << 5) | Math.min(31, (b * 31.99) | 0);
        if (lut[k] !== 255)
            return lut[k];
        let best = 0, bd = 1e9;
        for (let i = 0; i < P.length; i++) {
            const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
            const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
            if (d < bd)
                (bd = d), (best = i);
        }
        return (lut[k] = best);
    };
    const mat = new Uint8Array(N);
    const R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N);
    const floorA = new Float32Array(N).fill(0.12);
    const hazeW = new Float32Array(N); // how much drifting haze each cell takes
    const glowA = new Float32Array(N); // how much of the sun's glow a sky cell holds, for its breathing
    // --- the sky ------------------------------------------------------------
    const sunGlow = (x, y) => {
        const dx = x - SUN[0], dy = (y - SUN[1]) * 1.25;
        const d = Math.sqrt(dx * dx + dy * dy);
        return Math.exp(-d / 4) * 0.9 + Math.exp(-d / 13) * 0.42 + Math.exp(-d / 40) * 0.3;
    };
    const skyAt = (x, y) => {
        const v = clamp(y / HZ);
        // deep violet overhead, mauve, then rose and peach toward the horizon
        const up = smooth(0.05, 0.8, v);
        let r = mix(0.055, 0.3, up), g = mix(0.05, 0.19, up), b = mix(0.17, 0.36, up);
        const low = smooth(0.62, 1, v);
        r = mix(r, 0.66, low), g = mix(g, 0.4, low), b = mix(b, 0.42, low);
        // cooler and dimmer on the side away from the sun
        const far = smooth(50, 200, x) * 0.18;
        r *= 1 - far, g *= 1 - far * 0.8, b *= 1 - far * 0.3;
        const glow = sunGlow(x, y) + Math.exp(-Math.abs(y - 57) / 5) * 0.25 * Math.exp(-Math.abs(x - SUN[0]) / 50);
        r += glow * 1.0, g += glow * 0.78, b += glow * 0.48;
        // faint shafts of light fanning up from the sun through the haze
        const ang = Math.atan2(y - SUN[1], x - SUN[0]);
        const ray = fbm(ang * 9 + 3, 1.7, 2, 0);
        const rd = Math.hypot(x - SUN[0], y - SUN[1]);
        const shaft = smooth(0.5, 0.75, ray) * Math.exp(-rd / 45) * smooth(4, 14, rd) * 0.12;
        r += shaft, g += shaft * 0.8, b += shaft * 0.55;
        return [r, g, b];
    };
    // Dawn cloud in a wrapping strip that drifts: broken noise, gathered into
    // a bank up and right of the sun and a lower one behind the dome.
    const CW = 400, CH = 50;
    // [x, y, half-width, height above, depth below, strength]
    const banks = [
        [76, 28, 40, 7, 3.5, 1.4], // over the sun's right shoulder
        [152, 36, 52, 9, 4, 1], // behind the dome
        [16, 13, 32, 4, 2.5, 0.8], // a high wisp
        [250, 24, 40, 8, 4, 1],
        [330, 33, 36, 7, 4, 0.95],
    ];
    const cdens = (x, y) => {
        const q = fbm(x * 0.01, y * 0.04, 2, CW * 0.01);
        const n = fbm(x * 0.025 + q * 1.6, y * 0.075 + q * 0.6, 5, CW * 0.025);
        let m = 0;
        for (const [bx, by, rx, up, down, a] of banks) {
            let dx = x - bx;
            dx -= Math.round(dx / CW) * CW;
            const ex = dx / rx, ey = (y - by) / (y < by ? up : down);
            const e = Math.exp(-ex * ex * ex * ex - ey * ey) * a;
            if (e > m)
                m = e;
        }
        return 0.62 * m + 1.4 * (n - 0.5) + 0.02;
    };
    const cloud = new Float32Array(CW * CH);
    const cloudLit = new Float32Array(CW * CH);
    for (let r = 0; r < CH; r++) {
        for (let x = 0; x < CW; x++) {
            const y = r + 0.5;
            const d = cdens(x, y);
            cloud[r * CW + x] = smooth(0.46, 0.66, d);
            // the side toward the sun (down and left) catches the light
            const toward = cdens(x - 2, y + 2.5);
            cloudLit[r * CW + x] = clamp(0.56 + (d - toward) * 0.75 - (d - 0.6) * 0.2 + 0.7 * (fbm(x * 0.09, y * 0.2, 2, CW * 0.09) - 0.5));
        }
    }
    // --- the land -----------------------------------------------------------
    // the far tree line: rounded crowns, lower behind the Taj
    const crowns = [];
    for (let x = -12, i = 0; x < W + 12; x += 4 + hash(i, 60) * 5, i++) {
        const rad = 3 + hash(i, 61) * 4.5;
        crowns.push([x, 60.5 - hash(i, 62) * 2.5 - 2.5 * fbm(x * 0.03, 2, 2, 0) + rad * 0.35, rad]);
    }
    const tops = new Float32Array(W);
    for (let x = 0; x < W; x++) {
        let t0 = 64;
        for (const [cx, cy, rad] of crowns) {
            const dx = x + 0.5 - cx;
            if (Math.abs(dx) < rad)
                t0 = Math.min(t0, cy - Math.sqrt(rad * rad - dx * dx) * 0.75);
        }
        tops[x] = t0 - 0.6 * fbm(x * 0.5, 7, 2, 0);
    }
    const treeTop = (x) => tops[Math.min(W - 1, Math.max(0, Math.floor(x)))];
    const poolHalf = (y) => 0.5 * (y - HZ) + 1;
    const walkHalf = (y) => 0.7 * (y - HZ) + 1.5;
    // cypress rows either side of the canal, near ones last
    const trees = [];
    for (const s of [8.5, 10.4, 13, 16.8, 22.5, 31]) {
        for (const side of [-1, 1]) {
            // an inner row along the walks, and a lower outer row further back
            for (const [off, tall] of [[4.3, 0.8], [2.45, 1]]) {
                if (off > 3 && (s > 20 || side > 0))
                    continue;
                if (side < 0 && s > 30)
                    continue; // leave the sun clear
                const cxp = CX + side * off * s;
                trees.push({ x: cxp + (hash(s * 10, side + off) - 0.5) * 0.6, base: HZ + s, h: 1.6 * tall * s * (0.94 + 0.12 * hash(s * 7, side + 3 + off)), w: 0.26 * s, s });
            }
        }
    }
    // long shadows of the cypresses, cast toward us and to the right
    const shadowAt = (xc, y) => {
        let lit = 1;
        for (const tr of trees) {
            const dx = xc - tr.x, dy = y - tr.base;
            if (dy < -0.5)
                continue;
            const along = (dx * 0.6 + dy * 0.8) / tr.s;
            const across = (dx * 0.8 - dy * 0.6) / tr.s;
            if (along > 0 && along < 3 && Math.abs(across) < 0.17 * (1 - along / 3.4) + 0.03)
                lit *= 0.08 + 0.92 * smooth(1.6, 3, along);
        }
        return lit;
    };
    // the mosque's silhouette, and its edges toward the sun
    const mq = new Int8Array(N).fill(-1);
    for (let r = MB - 27; r < MB; r++)
        for (let x = MX - 24; x <= MX + 24; x++)
            mq[r * W + x] = mosque(x + 0.5, r + 0.5);
    for (let r = 0; r < H; r++) {
        for (let x = 0; x < W; x++) {
            const k = r * W + x;
            const y = r + 0.5, xc = x + 0.5;
            let m = SKY, cr, cg, cb, fl = 0.18, hz = 0;
            const tt = treeTop(xc);
            if (y < BASE && y >= tt) {
                m = BGTREE;
            }
            else if (y >= BASE) {
                const dx = Math.abs(xc - CX);
                m = dx < poolHalf(y) ? POOL : dx < walkHalf(y) ? WALK : LAWN;
            }
            if (m === SKY) {
                [cr, cg, cb] = skyAt(xc, y);
                // never one flat tone: a faint unevenness in the dawn air
                const veil = 0.88 + 0.24 * fbm(xc * 0.05, y * 0.09, 3, 0);
                cr *= veil, cg *= veil, cb *= veil;
                glowA[k] = sunGlow(xc, y);
                hz = 0.5 + 0.5 * smooth(20, 58, y);
                fl = 0.05 + 0.13 * smooth(18, 42, y);
            }
            else if (m === BGTREE) {
                // distant trees, flattened by the haze; rimmed where the sun is close
                const tex = fbm(xc * 0.25, y * 0.3, 3, 0);
                const depth = smooth(tt, BASE, y);
                const sky = skyAt(xc, tt);
                const a = 0.46 - 0.12 * depth + 0.12 * tex;
                cr = mix(0.1, sky[0], a), cg = mix(0.09, sky[1], a), cb = mix(0.15, sky[2], a);
                const rim = smooth(tt + 1.8, tt, y) * Math.exp(-Math.abs(xc - SUN[0]) / 18);
                cr += 0.4 * rim, cg += 0.27 * rim, cb += 0.14 * rim;
                // their feet lost in a bank of ground mist, broken into soft patches
                const patch = 0.45 + 0.75 * smooth(0.3, 0.7, fbm(xc * 0.035 + 11, y * 0.18, 3, 0));
                const mist = smooth(tt + 1, BASE + 1, y) * 0.75 * Math.min(1, patch);
                const mw = Math.exp(-Math.abs(xc - SUN[0]) / 90);
                cr = mix(cr, 0.62 + 0.25 * mw, mist), cg = mix(cg, 0.46 + 0.16 * mw, mist), cb = mix(cb, 0.55 + 0.02 * mw, mist);
                fl = 0.1;
                hz = 0.8;
            }
            else if (m === LAWN) {
                const v = (y - BASE) / (H - BASE);
                const u = (xc - CX) / (y - HZ); // across the ground plane
                const tex = fbm(u * 3, 40 / (y - HZ), 3, 0);
                const stripe = Math.floor(u * 1.4) & 1 ? 1 : 0.55; // mown bands that run toward the Taj
                // low sun raking across the grass from the left: gold where it lands,
                // violet sky-light in the shade
                let lit = (0.6 + 0.4 * Math.exp(-Math.abs(xc - SUN[0]) / 60)) * stripe * (0.85 + 0.3 * tex);
                lit *= shadowAt(xc, y);
                const vig = 1 - 0.45 * smooth(0.5, 1, v) * (0.6 + 0.4 * smooth(40, 0, Math.min(xc, W - xc)));
                const fall = 1 - 0.35 * v;
                // sunlit grass turns from gold near the sun to rose further off
                const warm = Math.exp(-Math.abs(xc - SUN[0]) / 80);
                // the shade holds the violet of the sky overhead, brighter in the open
                const amb = 0.75 + 0.5 * stripe - 0.25 * v;
                cr = (0.12 * amb + 0.56 * lit * fall) * vig;
                cg = (0.09 * amb + (0.36 + 0.14 * warm) * lit * fall) * vig;
                cb = (0.24 * amb + (0.26 - 0.1 * warm) * lit * fall) * vig;
                // the far lawn sits in the haze
                const far = smooth(BASE + 10, BASE, y) * 0.7;
                const mw = Math.exp(-Math.abs(xc - SUN[0]) / 90);
                cr = mix(cr, 0.62 + 0.25 * mw, far), cg = mix(cg, 0.46 + 0.16 * mw, far), cb = mix(cb, 0.55 + 0.02 * mw, far);
                fl = 0.1;
                hz = 0.7 * (1 - v);
            }
            else if (m === WALK) {
                const v = (y - BASE) / (H - BASE);
                const lit = xc < CX ? 1 : 0.86;
                // paving joints, closer together into the distance
                const joint = ((90 / (y - HZ)) % 1 < 0.14 ? 0.72 : 1) * (0.5 + 0.5 * shadowAt(xc, y));
                cr = (0.78 - 0.22 * v) * lit * joint, cg = (0.57 - 0.16 * v) * lit * joint, cb = (0.53 - 0.12 * v) * lit * joint;
                fl = 0.15;
                hz = 0.3;
            }
            else {
                fl = 0.15;
            }
            // the mosque, dark against the sun, its edges caught by it
            const q = mq[k];
            if (q >= 0) {
                m = MOSQUE;
                const sg = sunGlow(xc, y);
                const isDome = q === 1;
                let a = isDome ? [0.2, 0.11, 0.19] : [0.31, 0.13, 0.15];
                if (q === 2)
                    a = [0.07, 0.04, 0.07];
                const air = 0.06 + 0.3 * smooth(MB - 8, MB, y); // the foot sinks into the mist
                cr = mix(a[0], 0.62, air), cg = mix(a[1], 0.44, air), cb = mix(a[2], 0.5, air);
                // rim light where the cell faces open sky toward the sun
                const lft = x > 0 ? mq[k - 1] : -1, up = r > 0 ? mq[k - W] : -1;
                const toward = xc < SUN[0] ? (x < W - 1 ? mq[k + 1] : -1) : lft;
                let rim = (up < 0 ? 0.75 : 0) + (toward < 0 ? 0.9 : 0) + (lft < 0 && up < 0 ? 0.2 : 0);
                rim = Math.min(1, rim) * Math.min(1, 0.25 + sg * 1.6);
                cr = mix(cr, 1.0, rim * 0.8), cg = mix(cg, 0.7, rim * 0.8), cb = mix(cb, 0.48, rim * 0.8);
                fl = 0.04;
                hz = 0.15;
            }
            // the Taj in front of the sky and the trees
            if (y < BASE + 0.01) {
                const t = taj((xc - CX) / S, (BASE - y) / S);
                if (t) {
                    m = MARBLE;
                    const [lit, rec] = t;
                    // lavender shadow, pink-white front, gold where it faces the sun
                    const sh = [0.42, 0.36, 0.56], fr = [0.9, 0.76, 0.75], gd = [1.0, 0.88, 0.72];
                    let a, b2, kk;
                    if (lit < 0.5)
                        (a = sh), (b2 = fr), (kk = Math.pow(lit * 2, 1.4));
                    else
                        (a = fr), (b2 = gd), (kk = (lit - 0.5) * 2);
                    cr = mix(a[0], b2[0], kk), cg = mix(a[1], b2[1], kk), cb = mix(a[2], b2[2], kk);
                    if (rec > 0) {
                        const d = 1 - rec * 0.78;
                        cr *= d * 0.95, cg *= d * 0.92, cb *= d;
                    }
                    // a little grain in the stone, and the morning haze over the lower storeys
                    const g = 0.94 + 0.08 * hash(x * 3 + 1, r * 5 + 2);
                    cr *= g, cg *= g, cb *= g;
                    const low = smooth(40, BASE, y) * 0.2;
                    const sky = skyAt(xc, y);
                    cr = mix(cr, sky[0], low), cg = mix(cg, sky[1], low), cb = mix(cb, sky[2], low);
                    fl = 0.12;
                    hz = 0.55;
                }
            }
            mat[k] = m;
            R[k] = cr, G[k] = cg, B[k] = cb;
            floorA[k] = fl;
            hazeW[k] = hz;
        }
    }
    // cypresses, far to near: dark, with a warm rim on the side toward the sun
    for (const tr of trees) {
        const top = tr.base - tr.h;
        const sunSide = tr.x < CX ? 0.9 : 0.6;
        for (let r = Math.max(0, Math.floor(top)); r < Math.min(H, Math.ceil(tr.base + 0.6)); r++) {
            const y = r + 0.5;
            const u = (tr.base - y) / tr.h; // 0 at the foot, 1 at the tip
            if (u > 1)
                continue;
            let p = u < 0.06 ? 0.18 : u < 0.3 ? 0.8 + 0.2 * (u / 0.3) : Math.pow((1 - u) / 0.7, 0.8);
            for (let x = Math.max(0, Math.floor(tr.x - tr.w - 2)); x < Math.min(W, Math.ceil(tr.x + tr.w + 2)); x++) {
                const xc = x + 0.5;
                const n = noise(xc * 0.9, y * 0.55 + tr.s, 0);
                const hw = tr.w * p * (0.88 + 0.26 * n) + 0.35;
                const dx = (xc - tr.x) / hw;
                if (Math.abs(dx) > 1)
                    continue;
                const k = r * W + x;
                const leaf = fbm(xc * 0.6, y * 0.35 + tr.s * 3, 2, 0);
                const rim = smooth(-0.2, -0.9, dx) * (0.4 + 0.6 * leaf) * (0.5 + 0.5 * Math.exp(-Math.abs(tr.x - SUN[0]) / 80));
                // clumps of foliage, each a little lit on top
                const clump = smooth(0.45, 0.7, fbm(xc * 0.45, y * 0.3 + tr.s * 3, 3, 0));
                const base = 0.5 + 0.5 * leaf + 0.5 * clump;
                const dist = smooth(30, 8, tr.s); // far trees take more haze
                let cr = 0.045 * base + sunSide * rim, cg = 0.1 * base + sunSide * 0.63 * rim, cb = 0.08 * base + sunSide * 0.27 * rim;
                const sky = [0.7, 0.5, 0.56];
                cr = mix(cr, sky[0], dist * 0.45), cg = mix(cg, sky[1], dist * 0.45), cb = mix(cb, sky[2], dist * 0.45);
                mat[k] = CYPRESS;
                R[k] = cr, G[k] = cg, B[k] = cb;
                floorA[k] = 0.05;
                hazeW[k] = (0.3 + 0.4 * dist) * smooth(tr.base - tr.h * 0.7, tr.base, y);
            }
        }
    }
    // The reflection source: everything above the garden, trees included.
    const RR = R.slice(), RG = G.slice(), RB = B.slice();
    // drifting haze, two layers in a strip that wraps
    const HWd = 400;
    const haze1 = new Float32Array(HWd * H), haze2 = new Float32Array(HWd * H);
    for (let r = 0; r < H; r++) {
        for (let x = 0; x < HWd; x++) {
            haze1[r * HWd + x] = smooth(0.4, 0.75, fbm(x * 0.018, r * 0.09, 4, HWd * 0.018));
            haze2[r * HWd + x] = smooth(0.42, 0.8, fbm(x * 0.04 + 7, r * 0.16 + 3, 3, HWd * 0.04));
        }
    }
    // haze is thickest just above the garden
    const hazeRow = new Float32Array(H);
    for (let r = 0; r < H; r++)
        hazeRow[r] = 0.03 + 0.42 * Math.exp(-Math.abs(r + 0.5 - 63) / 6);
    const birds = [];
    for (let i = 0; i < 3; i++)
        birds.push([58 + i * 8 + hash(i, 40) * 4, 30 - i * 2.5 + hash(i, 41) * 2, hash(i, 42) * 6.28]);
    // ordered dither, nudged per cell so its grid does not show in flat light
    const dith = new Float32Array(N), jit = new Float32Array(N);
    for (let k = 0; k < N; k++) {
        dith[k] = BAYER[((Math.floor(k / W)) & 3) * 4 + ((k % W) & 3)] * 0.85;
        jit[k] = hash(k, 77) - 0.5;
    }
    // a gentle shoulder so the brightest light keeps its gradient
    const tone = new Float32Array(1025);
    for (let i = 0; i <= 1024; i++) {
        const v = i / 256;
        tone[i] = v < 0.75 ? v : 0.75 + 0.25 * (1 - Math.exp(-(v - 0.75) * 4));
    }
    return (t, { color } = {}) => {
        const d1 = t * 1.1, d2 = t * 2.3;
        const cd = t * 0.5;
        const breathe = 0.035 * Math.sin((t / 6) * Math.PI * 2);
        // where the birds are this frame
        const bx = [], by = [], bu = [];
        for (const [x0, y0, ph] of birds) {
            bx.push((((x0 + t * 3.2) % 260) + 260) % 260 - 30);
            by.push(y0 + Math.sin(t * 0.4 + ph) * 1.3);
            bu.push(Math.sin(t * 7 + ph) > 0);
        }
        for (let r = 0; r < H; r++) {
            const y = r + 0.5;
            const hr = hazeRow[r];
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                const m = mat[k];
                let cr, cg, cb, fl = floorA[k], fade = 1;
                if (m === POOL) {
                    // the mirror: the scene above, flipped about the far end, shortened
                    // and shaken
                    const depth = (y - BASE) / (H - BASE);
                    const wob = Math.sin(y * 1.9 - t * 2.4 + Math.sin(x * 0.11 + t * 0.7) * 1.5) * (0.2 + 0.7 * depth);
                    let sx = Math.round(x + wob);
                    sx = sx < 0 ? 0 : sx > W - 1 ? W - 1 : sx;
                    let sr = Math.round(BASE - 0.5 - (y - BASE) * KR - (Math.sin(x * 0.3 + t * 1.3 + y) > 0.6 ? 1 : 0));
                    sr = sr < 0 ? 0 : sr > BASE - 1 ? BASE - 1 : sr;
                    const j = sr * W + sx;
                    // stone reflects brighter than the sky does, so the Taj holds its shape
                    const src = mat[j] === MARBLE ? 1.0 : 0.85;
                    const dim = src - 0.1 * depth;
                    cr = RR[j] * dim * 0.9, cg = RG[j] * dim * 0.94, cb = RB[j] * dim + 0.05;
                    // ripples catching the sky
                    const w = noise(x * 0.12 + t * 0.15, y * 0.9 - t * 0.9, 0);
                    const glint = smooth(0.75, 0.95, w) * 0.14;
                    cr += glint, cg += glint * 0.85, cb += glint * 0.75;
                    // a sparse line of light drifting across the far end
                    if (r > BASE && r <= BASE + 4) {
                        const gl = smooth(0.62, 0.85, noise(x * 0.55 - t * 0.9, r * 2.7 + t * 0.2, 0)) * (0.5 - 0.08 * (r - BASE));
                        cr += gl, cg += gl * 0.85, cb += gl * 0.6;
                    }
                    // a thin line of light where the far edge meets the plinth
                    if (r === BASE)
                        cr += 0.2, cg += 0.16, cb += 0.12;
                    fade = 0.8 + 0.2 * smooth(H + 2, H - 6, y);
                }
                else {
                    cr = R[k], cg = G[k], cb = B[k];
                    if (m === SKY) {
                        const ga = glowA[k] * breathe;
                        cr += ga, cg += ga * 0.78, cb += ga * 0.48;
                    }
                    if (m === SKY && y < CH) {
                        // drifting dawn cloud: gold and rose underneath near the sun,
                        // violet-grey elsewhere
                        const sx = x + cd, ix = Math.floor(sx), fx = sx - ix;
                        const i0 = r * CW + (ix % CW), i1 = r * CW + ((ix + 1) % CW);
                        const c = cloud[i0] + (cloud[i1] - cloud[i0]) * fx;
                        if (c > 0.01) {
                            const l = cloudLit[i0] + (cloudLit[i1] - cloudLit[i0]) * fx;
                            const near = Math.min(1, glowA[k] * 1.7);
                            // a mauve body, rose underneath, gold where the sun is close
                            const b2 = clamp(0.2 + 0.6 * l + near * 0.55 * l);
                            let kr, kg, kb;
                            if (b2 < 0.5) {
                                const q = b2 * 2;
                                (kr = mix(0.16, 0.6, q)), (kg = mix(0.12, 0.34, q)), (kb = mix(0.3, 0.5, q));
                            }
                            else {
                                const q = (b2 - 0.5) * 2;
                                (kr = mix(0.6, 1.05, q)), (kg = mix(0.34, 0.8, q)), (kb = mix(0.5, 0.55, q));
                            }
                            const a = Math.min(1, c) * 0.9;
                            cr = mix(cr, kr, a), cg = mix(cg, kg, a), cb = mix(cb, kb, a);
                        }
                    }
                    if (m === SKY && r < 24 && x > 96 && hash(x, r * 3 + 11) > 0.988) {
                        // the last few stars, fading where the dawn reaches
                        const tw = 0.7 + 0.3 * Math.sin(t * (1.2 + hash(x, r) * 2) + hash(r, x) * 6.28);
                        const s = tw * 0.62 * smooth(24, 8, r) * smooth(96, 140, x);
                        cr = Math.max(cr, s * 0.85), cg = Math.max(cg, s * 0.85), cb = Math.max(cb, s);
                    }
                    if (m === SKY) {
                        // the sun's disc, softened by the haze
                        const dx = x + 0.5 - SUN[0], dy = y - SUN[1];
                        const dd = dx * dx + dy * dy;
                        if (dd < 22) {
                            const a = smooth(22, 9, dd);
                            cr = mix(cr, 1.05, a), cg = mix(cg, 0.98, a), cb = mix(cb, 0.86, a);
                        }
                        // birds, dark against the light
                        for (let i = 0; i < bx.length; i++) {
                            const ox = Math.round(bx[i]) - x, oy = Math.round(by[i]) - r;
                            if (ox < -2 || ox > 2)
                                continue;
                            const ax = ox < 0 ? -ox : ox;
                            const hit = bu[i] ? (ax === 0 && oy === 0) || (ax === 1 && oy === 1) || (ax === 2 && oy === 1) : (ax === 0 && oy === 0) || (ax === 1 && oy === 0) || (ax === 2 && oy === -1);
                            if (hit)
                                (cr = 0.16), (cg = 0.1), (cb = 0.17), (fl = 0);
                        }
                    }
                }
                // the morning haze, drifting
                const hw = hazeW[k];
                if (hw > 0 || m === POOL) {
                    const a = (m === POOL ? 0.12 : hw) * hr;
                    const sx1 = (x + d1) % HWd, sx2 = (x + d2) % HWd;
                    const i1 = r * HWd + (sx1 | 0), i2 = r * HWd + (sx2 | 0);
                    const hz = a * (0.35 + 0.75 * haze1[i1] + 0.45 * haze2[i2]);
                    cr = mix(cr, 0.9, hz), cg = mix(cg, 0.64, hz), cb = mix(cb, 0.62, hz);
                }
                cr = tone[Math.min(1024, (cr * 256) | 0)], cg = tone[Math.min(1024, (cg * 256) | 0)], cb = tone[Math.min(1024, (cb * 256) | 0)];
                const peak = Math.max(cr, cg, cb, 1e-4);
                const level = clamp(fl + (1 - fl) * Math.pow(peak, 1.1) * 1.02) * fade;
                const step = Math.max(0, Math.min(3, Math.round(level * 3 + dith[k] + jit[k] * (level < 0.3 ? 0.12 : 0.3))));
                out[k] = DOTS[step];
                if (color) {
                    const want = step ? Math.min(1, (level + 0.06) / COVER[step]) : 0;
                    let s = (0.3 + 0.7 * want) / peak;
                    if (m === SKY && s > 1.6)
                        s = 1.6;
                    color[k] = nearest(clamp(cr * s), clamp(cg * s), clamp(cb * s));
                }
            }
        }
        const lines = [];
        for (let r = 0; r < H; r++)
            lines.push(out.slice(r * W, (r + 1) * W).join(""));
        return lines.join("\n");
    };
}

    return { meta: meta, make: tajDawn };
  })();

  // -------------------------------------------------------------
  // Scene: varanasi-ghats
  // -------------------------------------------------------------
  SCENES["varanasi-ghats"] = (function () {
const meta = {
    name: "varanasi ghats",
    category: "scenes",
    note: "dusk aarti on the ganga, lamps on the steps and diyas on the water",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 15,
    ground: "#0b0812",
    palette: [
        // the sky, indigo through violet
        "#141230", "#1d1a42", "#272257", "#332b6a", "#45357a", "#5a4388", "#7259a8",
        // plum, orchid, mauve and rose
        "#6d3a73", "#8a4677", "#a8527a", "#c4607a", "#d97a92", "#b866a0", "#9a68c8", "#c868b0", "#e8707a",
        // coral to gold
        "#d9705f", "#e88552", "#f29f4a", "#f8b85a", "#fcd07a", "#ffe3a6", "#fff2d2",
        // stone in shadow, and the violet treads
        "#1a1220", "#24182a", "#301f33", "#3f2838", "#523340", "#3a2c4c", "#4d3a64",
        // stone in lamplight
        "#5e3524", "#7d4527", "#a0582a", "#c06e2e", "#d98a46",
        // flame
        "#ffffff", "#fff6d8", "#ffd860", "#ff9f2a", "#f06a1e", "#c8401a", "#8a2a16",
        // dark water
        "#0f1a2c", "#162540", "#20325a",
        // starlight, set directly and never matched
        "#d6d4ee",
    ],
};
const W = 200, H = 100;
const HZ = 60; // the far bank
const END = 150; // where the ghats meet the far bank
const GLOW = [156, HZ - 1.5]; // the afterglow, sitting on the far bank
const DOTS = " ·•●";
const COVER = [0, 0.3, 0.6, 1];
// how far a dot's colour may be brightened to make up for its size: small dots
// in dark areas stay dark instead of turning into a pale speckle
const LIFT = [0, 2.5, 1.7, 1.35];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
const FLAME = [1, 0.62, 0.22];
const WASH = [1, 0.5, 0.2];
const SKY = 0, WATER = 1, BANK = 2, STEPS = 3, BLD = 4, SPIRE = 5, UMB = 6, FIG = 7, PLAT = 8;
// heat, then colour: indigo overhead, violet, plum, rose, coral, amber, gold
const RAMP = [
    [0.0, 0.085, 0.07, 0.24],
    [0.14, 0.13, 0.1, 0.34],
    [0.28, 0.22, 0.14, 0.44],
    [0.42, 0.34, 0.17, 0.48],
    [0.52, 0.47, 0.21, 0.47],
    [0.62, 0.6, 0.26, 0.42],
    [0.7, 0.7, 0.31, 0.36],
    [0.78, 0.8, 0.39, 0.3],
    [0.86, 0.88, 0.5, 0.26],
    [0.92, 0.95, 0.65, 0.32],
    [0.97, 1.0, 0.8, 0.48],
    [1.0, 1.0, 0.92, 0.7],
];
function hash(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
        x0 = ((xi % period) + period) % period;
        x1 = (x0 + 1) % period;
    }
    const a = hash(x0, yi), b = hash(x1, yi), c = hash(x0, yi + 1), d = hash(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, octaves, period) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
        s += amp * noise(x * f, y * f, period * f);
        n += amp;
        amp *= 0.5;
        f *= 2;
    }
    return s / n;
}
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => {
    const k = clamp((v - a) / (b - a));
    return k * k * (3 - 2 * k);
};
const mix = (a, b, k) => a + (b - a) * k;
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
// The heat ramp, tabulated.
const RL = 256;
const RT = new Float32Array((RL + 1) * 3);
for (let i = 0; i <= RL; i++) {
    const h = i / RL;
    let j = 0;
    while (j < RAMP.length - 2 && h > RAMP[j + 1][0])
        j++;
    const [h0, r0, g0, b0] = RAMP[j], [h1, r1, g1, b1] = RAMP[j + 1];
    const k = clamp((h - h0) / (h1 - h0));
    RT[i * 3] = mix(r0, r1, k), RT[i * 3 + 1] = mix(g0, g1, k), RT[i * 3 + 2] = mix(b0, b1, k);
}
const rampAt = (h) => ((h < 0 ? 0 : h > 1 ? 1 : h) * RL + 0.5) | 0;
// The waterline along the ghats, near at the left and running away to the right.
const wlF = (x) => (x < END ? HZ + 0.5 + 20 * Math.pow(1 - x / END, 1.6) : HZ + 0.5);
const scF = (x) => 0.45 + 1.75 * Math.pow(Math.max(0, 1 - x / END), 1.3);
const stepTopF = (x) => wlF(x) - 9.5 * scF(x) * (0.3 + 0.7 * smooth(END, END - 16, x));
// The dusk sky's heat: low overhead, rising toward the horizon, hottest at the glow.
function skyHeat(x, y) {
    const v = clamp(y / HZ);
    const dx = Math.abs(x - GLOW[0]), dy = Math.abs(GLOW[1] - y);
    // a wide warm band along the horizon, and a small hot core on the bank
    const wide = 0.46 * Math.exp(-dx / 55 - dy / 23);
    const core = 0.24 * Math.exp(-Math.sqrt((dx / 13) ** 2 + (dy / 4.5) ** 2));
    return 0.06 + 0.42 * v * v + wide + core;
}
function varanasiGhats() {
    const P = meta.palette.map(hex);
    const STAR = P.length - 1;
    const N = W * H;
    const out = new Array(N);
    const lut = new Uint8Array(32768).fill(255);
    const nearest = (r, g, b) => {
        const k = (Math.min(31, (r * 31.99) | 0) << 10) | (Math.min(31, (g * 31.99) | 0) << 5) | Math.min(31, (b * 31.99) | 0);
        if (lut[k] !== 255)
            return lut[k];
        let best = 0, bd = 1e9;
        for (let i = 0; i < STAR; i++) {
            const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
            const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
            if (d < bd)
                (bd = d), (best = i);
        }
        return (lut[k] = best);
    };
    // --- the bank -------------------------------------------------------------
    // Buildings along the ghats: [x0, x1, height above the steps in scale units, seed]
    const blds = [];
    for (let x = -6; x < END - 10;) {
        const s = scF(Math.max(0, x));
        const w = (8 + 10 * hash(x | 0, 3)) * s;
        const low = (x > 110 ? 0.8 : 1) * (0.45 + 0.55 * smooth(END - 8, END - 34, x));
        blds.push([x, x + w, (7 + 9 * hash(x | 0, 4)) * low, hash(x | 0, 5)]);
        x += w;
    }
    // Temple spires: [centre x, height in rows, half width at the base]
    const spires = [[118, 33, 5.2], [64, 19, 4], [31, 15, 3.6], [139, 8, 1.6], [90, 11, 2.4], [129, 10, 2]];
    // Aarti stations on the near ghat, unevenly spaced: [x, streak width, streak length]
    const aarti = [[11, 1.15, 1.25], [24, 0.8, 0.85], [39, 1.25, 1.1], [54, 0.75, 0.75]];
    // Umbrellas on the far steps
    const umbs = [70, 83, 98, 109];
    const mat = new Uint8Array(N);
    const sR = new Float32Array(N), sG = new Float32Array(N), sB = new Float32Array(N);
    const flo = new Float32Array(N);
    const alb = new Float32Array(N); // how much the lamps' wash lights each cell
    const skyH = new Float32Array(N);
    const warm = new Float32Array(N);
    const roofOf = (x) => {
        for (const [x0, x1, h] of blds)
            if (x >= x0 && x < x1)
                return stepTopF(x) - h * scF(x);
        return stepTopF(x);
    };
    for (let r = 0; r < H; r++) {
        for (let x = 0; x < W; x++) {
            const k = r * W + x;
            const xc = x + 0.5, y = r + 0.5;
            const wl = wlF(xc);
            if (y >= wl) {
                mat[k] = WATER;
                alb[k] = 0.25;
                continue;
            }
            let m = SKY, cr = 0, cg = 0, cb = 0, fl = 0.06, al = 0;
            const s = scF(xc);
            // the far bank: an embankment and clumps of trees against the glow
            const clump = smooth(0.42, 0.72, fbm(xc * 0.11, 3, 3, 0)) * smooth(160, 172, xc);
            const bankTop = HZ - 2.2 - 0.6 * fbm(xc * 0.4, 7, 2, 0) - 4 * clump;
            if (xc >= END - 4 && y >= bankTop)
                (m = BANK), (cr = 0.1), (cg = 0.07), (cb = 0.125), (fl = 0.03);
            if (xc < END) {
                const st = stepTopF(xc);
                // buildings and their rooftop pavilions
                let roof = st, bi = -1;
                for (let i = 0; i < blds.length; i++)
                    if (xc >= blds[i][0] && xc < blds[i][1])
                        (roof = st - blds[i][2] * s), (bi = i);
                let top = roof;
                if (bi >= 0) {
                    const [x0, x1, , hb] = blds[bi];
                    const mid = (x0 + x1) / 2, half = (x1 - x0) / 2;
                    if (hb > 0.45) {
                        // a chhatri: a small dome on four posts
                        const cx = hb > 0.75 ? x0 + half * 0.4 : mid;
                        const dx = Math.abs(xc - cx) / (1.6 * s);
                        if (dx < 1)
                            top = Math.min(top, roof - 1.4 * s - 1.5 * s * Math.sqrt(1 - dx * dx));
                        if (dx < 1.1 && dx > 0.7)
                            top = Math.min(top, roof - 1.4 * s);
                    }
                    if (Math.abs(xc - x0) < 0.6 * s || Math.abs(xc - x1) < 0.6 * s)
                        top = Math.min(top, roof - 0.6 * s); // parapet ends
                }
                if (y >= top && y < st) {
                    m = BLD;
                    // backlit stone, a little violet from the sky, darker low down
                    cr = 0.075, cg = 0.05, cb = 0.09;
                    const fy = (y - top) / Math.max(1, st - top);
                    cr *= 1.1 - 0.4 * fy, cg *= 1.1 - 0.4 * fy, cb *= 1.1 - 0.3 * fy;
                    al = 0.5;
                    // rows of arched openings, a fair number lit on the near ghats
                    if (bi >= 0 && s > 0.6) {
                        const fx = (xc - blds[bi][0]) / (2.4 * s), fz = (st - y) / (3 * s);
                        const ix = Math.floor(fx), iz = Math.floor(fz);
                        if (fx - ix > 0.35 && fx - ix < 0.7 && fz - iz > 0.25 && fz - iz < 0.75 && iz >= 1 && st - y < blds[bi][2] * s - 1.5 * s) {
                            const lit = hash(bi * 31 + ix, iz * 7) < (s > 1.2 ? 0.28 : 0.2);
                            if (lit)
                                (cr += 0.5), (cg += 0.28), (cb += 0.08);
                            else
                                (cr *= 0.55), (cg *= 0.55), (cb *= 0.65), (al = 0.2);
                        }
                    }
                    fl = 0.14;
                }
                if (y >= st) {
                    // the steps: treads catch the violet sky, risers fall in shadow
                    m = STEPS;
                    const sp = 1.6 * s;
                    const near = (wl - y) / (wl - st);
                    if (sp < 2.2) {
                        // too far to count the steps: a faint alternating tread
                        const odd = Math.floor(wl - y) & 1;
                        (cr = 0.19), (cg = 0.13), (cb = 0.25);
                        if (odd)
                            (cr *= 0.55), (cg *= 0.55), (cb *= 0.58);
                        al = odd ? 0.4 : 0.75;
                    }
                    else {
                        const ph = ((wl - y) / sp) % 1;
                        if (ph < 0.6)
                            (cr = 0.24 + 0.05 * (1 - near)), (cg = 0.15), (cb = 0.2), (al = 1);
                        else
                            (cr = 0.05), (cg = 0.035), (cb = 0.06), (al = 0.3);
                    }
                    // the wet bottom steps darker
                    if (wl - y < 1.2 * s)
                        (cr *= 0.6), (cg *= 0.6), (cb *= 0.75), (al *= 0.6);
                    fl = 0.12;
                }
            }
            // spires
            for (const [sx, sh, sw] of spires) {
                const base = roofOf(sx) + 1;
                const h = base - y;
                if (h < -1 || h > sh + 2.5)
                    continue;
                const dx = Math.abs(xc - sx);
                const f = h / sh;
                // the curved shikhara, an amalaka disc and the kalash on top
                let hw = f <= 1 ? sw * Math.pow(Math.max(0, 1 - Math.pow(f, 1.8)), 0.6) : 0;
                if (f > 0.92 && f < 1.02)
                    hw = Math.max(hw, sw * 0.32);
                if (f >= 1.02 && h < sh + 2.2)
                    hw = Math.max(hw, 0.35 + 0.2 * Math.sin(((h - sh) / 2.2) * Math.PI));
                if (h >= -1 && h < 0.5)
                    hw = sw * 1.15;
                if (dx <= hw) {
                    m = SPIRE;
                    const band = Math.floor(h / 1.6) % 2 ? 0.8 : 1;
                    cr = 0.085 * band, cg = 0.055 * band, cb = 0.095 * band;
                    fl = 0.12, al = 0.35;
                }
            }
            // the big umbrellas on the far steps
            for (const ux of umbs) {
                const s2 = scF(ux), wl2 = wlF(ux);
                const cy = wl2 - (wl2 - stepTopF(ux)) * 0.55;
                const dx = (xc - ux) / (3 * s2), dy = (cy - y) / (1.4 * s2);
                if (dy > 0 && dy < 1 && Math.abs(dx) < Math.sqrt(1 - dy * dy))
                    (m = UMB), (cr = 0.07), (cg = 0.045), (cb = 0.075), (al = 0.4);
                if (dy <= 0 && dy > -0.25 && Math.abs(dx) < 1)
                    (m = UMB), (cr = 0.05), (cg = 0.03), (cb = 0.05), (al = 0.2);
                if (Math.abs(xc - ux) < 0.5 && y > cy && y < cy + 2.2 * s2)
                    (m = UMB), (cr = 0.04), (cg = 0.03), (cb = 0.04), (al = 0.1);
            }
            // the priests on their platforms, dark against the lit steps
            for (const [ax] of aarti) {
                const s2 = scF(ax), u = 1.3 * s2, base = wlF(ax) - 2.6 * s2;
                const dx = (xc - ax) / u;
                const fy = (base - y) / u;
                // a dhoti, a broad-shouldered torso, a neck and the head
                const bw = fy < 0 ? -1 : fy < 2.2 ? 0.66 - 0.04 * fy : fy < 4.1 ? 0.58 + 0.32 * smooth(2.2, 3.7, fy) : fy < 4.5 ? 0.28 : -1;
                const head = Math.hypot(dx * 1.05, fy - 5.05) < 0.62;
                if (Math.abs(dx) < bw || head)
                    (m = FIG), (cr = 0.035), (cg = 0.022), (cb = 0.035), (fl = 0.02), (al = 0.04);
                if (y >= base && y < base + 0.7 * s2 && Math.abs(xc - ax) < 2.3 * u)
                    (m = PLAT), (cr = 0.12), (cg = 0.07), (cb = 0.06), (fl = 0.04), (al = 0.8);
            }
            if (m === SKY) {
                const veil = 0.92 + 0.16 * fbm(x * 0.05, r * 0.1, 3, 0);
                const hh = skyHeat(xc, y) + 0.05 * (fbm(x * 0.07 + 11, r * 0.16, 2, 0) - 0.5) + 0.1 * (fbm(x * 0.025 + 3, r * 0.09 + 5, 3, 0) - 0.5);
                skyH[k] = hh;
                warm[k] = smooth(0.3, 0.9, hh);
                const i = rampAt(hh) * 3;
                cr = RT[i] * veil, cg = RT[i + 1] * veil, cb = RT[i + 2] * veil;
                fl = 0.2;
            }
            mat[k] = m;
            sR[k] = cr, sG[k] = cg, sB[k] = cb, flo[k] = fl, alb[k] = al;
        }
    }
    // rim light: silhouette edges facing the glow, and their tops, take the sky's colour
    const rimR = new Float32Array(N), rimG = new Float32Array(N), rimB = new Float32Array(N);
    for (let r = 1; r < H - 1; r++) {
        for (let x = 2; x < W - 2; x++) {
            const k = r * W + x;
            const m = mat[k];
            if (m === SKY || m === WATER)
                continue;
            // the edge facing the glow takes its orange light, the top the sky's colour
            const toward = x < GLOW[0] ? 1 : -1;
            const strong = 0.75 * Math.exp(-Math.abs(x - GLOW[0]) / 42);
            let a = 0;
            if (mat[k + toward] === SKY)
                a = strong;
            else if (mat[k + 2 * toward] === SKY)
                a = strong * 0.4;
            if (a > 0)
                (rimR[k] = 0.85 * a), (rimG[k] = 0.45 * a), (rimB[k] = 0.26 * a);
            if (mat[k - W] === SKY)
                (rimR[k] += sR[k - W] * 0.3), (rimG[k] += sG[k - W] * 0.3), (rimB[k] += sB[k - W] * 0.3);
        }
    }
    for (let k = 0; k < N; k++)
        (sR[k] += rimR[k]), (sG[k] += rimG[k]), (sB[k] += rimB[k]);
    // small diyas lining the steps near the aarti, twinkling
    const stepLamps = [];
    for (let x = 2; x < 118; x++) {
        const s = scF(x + 0.5);
        for (let r = Math.floor(stepTopF(x + 0.5)); r < wlF(x + 0.5) - 1; r++) {
            const k = r * W + x;
            if (mat[k] !== STEPS)
                continue;
            const near = Math.exp(-(((x - 33) / 36) ** 2));
            if (hash(x * 3 + 7, r * 5) < 0.035 * near + 0.006 && ((wlF(x + 0.5) - r - 0.5) / (1.6 * s)) % 1 < 0.3)
                stepLamps.push([k, hash(x, r) * 40]);
        }
    }
    // electric lamps along the far ghats, each with its thin road on the water
    const sref = new Float32Array(N);
    for (let x = 58; x < END - 3;) {
        const s = scF(x);
        const ly = stepTopF(x) - 0.4 * s + (wlF(x) - stepTopF(x)) * 0.55 * hash(x | 0, 78) ** 2;
        const halo = 1 + 3.2 * s, R = Math.ceil(halo * 3);
        for (let r = Math.max(0, Math.floor(ly - R)); r < Math.min(H, ly + R); r++) {
            for (let xx = Math.max(0, Math.floor(x - R)); xx < Math.min(W, x + R); xx++) {
                const k = r * W + xx;
                if (mat[k] === WATER || mat[k] === SKY)
                    continue;
                const dx = xx + 0.5 - x, dy = r + 0.5 - ly;
                const d = Math.sqrt(dx * dx + dy * dy);
                // the lamp, and the pool of light it throws on the stone round it
                const v = Math.exp(-((d / 0.6) ** 2)) * 1.3 + Math.exp(-d / 1.4) * 0.12;
                const p = Math.exp(-d / halo) * 0.3 * alb[k];
                sR[k] += v + p * WASH[0], sG[k] += v * 0.76 + p * WASH[1], sB[k] += v * 0.42 + p * WASH[2];
            }
        }
        const wl = wlF(x), width = 0.35 + 0.35 * s, len = 9 * s;
        for (let r = Math.floor(wl); r < H; r++) {
            const a = Math.exp(-(r + 0.5 - wl) / len) * 0.5;
            if (a < 0.01)
                break;
            for (let xx = Math.floor(x - 3); xx < x + 3; xx++)
                sref[r * W + xx] += a * Math.exp(-(((xx + 0.5 - x) / width) ** 2));
        }
        x += (5 + 10 * hash(x | 0, 77)) * Math.max(0.8, s);
    }
    // --- the reflection: the bank and sky mirrored at the waterline -----------
    const refl = [new Float32Array(N), new Float32Array(N), new Float32Array(N)];
    const mirK = new Int32Array(N).fill(-1); // the lit cell each water cell mirrors
    for (let r = 0; r < H; r++) {
        for (let x = 0; x < W; x++) {
            const k = r * W + x;
            if (mat[k] !== WATER)
                continue;
            const wl = wlF(x + 0.5), d = r + 0.5 - wl;
            let ar = 0, ag = 0, ab = 0;
            for (let o = 0; o < 2; o++) {
                const ym = wl - d * 0.85 - 0.4 - o * 0.8;
                let cr, cg, cb;
                const q = ym < 0 ? -1 : Math.floor(ym) * W + x;
                // the rippled water stretches the sky's light down toward us
                const i = rampAt(skyHeat(x + 0.5, Math.max(0, wl - d * 0.36 - 1 - o * 0.6))) * 3;
                if (q < 0 || mat[q] === WATER || mat[q] === SKY)
                    (cr = RT[i]), (cg = RT[i + 1]), (cb = RT[i + 2]);
                else {
                    // tilted ripples under the bank still catch a little sky
                    (cr = sR[q] + RT[i] * 0.22), (cg = sG[q] + RT[i + 1] * 0.22), (cb = sB[q] + RT[i + 2] * 0.22);
                    if (o === 0)
                        mirK[k] = q;
                }
                ar += cr, ag += cg, ab += cb;
            }
            const a = 0.8 - 0.4 * smooth(HZ, H, r);
            refl[0][k] = (ar / 2) * a, refl[1][k] = (ag / 2) * a, refl[2][k] = (ab / 2) * a;
        }
    }
    // --- clouds: long dusk streaks, dark on top and lit from below --------------
    const CW = 800, CH = HZ - 6;
    const cover = new Float32Array(CW * CH);
    const clit = new Float32Array(CW * CH);
    // stretched, warped noise, gathered into three loose bands
    const density = (x, y) => {
        const q = fbm(x * 0.005, y * 0.03, 3, 4);
        const d = fbm(x * 0.0125 + q * 1.8, y * 0.09 + q * 0.9, 5, 10);
        const env = 0.03 * Math.exp(-(((y - 13) / 4) ** 2)) + 0.1 * Math.exp(-(((y - 29) / 5.5) ** 2));
        // and one thin, broken streak low down, to cross the glow
        const c = 46.5 + 3 * (fbm(x * 0.01, 9.5, 2, 8) - 0.5);
        const th = 1 + 0.9 * fbm(x * 0.05, 3.5, 2, 40);
        const streak = Math.exp(-(((y - c) / th) ** 2)) * smooth(0.42, 0.6, fbm(x * 0.0125, 21.5, 3, 10)) * (0.75 + 0.5 * fbm(x * 0.05, y * 0.3, 3, 40));
        return Math.max(d + env - 0.08, 0.36 + 0.3 * streak);
    };
    for (let r = 0; r < CH; r++) {
        for (let x = 0; x < CW; x++) {
            const y = r + 0.5;
            const d = density(x, y);
            cover[r * CW + x] = smooth(0.47, 0.62, d);
            // the undersides catch the light from below the horizon, the tops go dark
            clit[r * CW + x] = clamp(0.4 + (d - density(x, y + 2)) * 5.5 + (density(x, y - 2.5) - d) * 1.5);
        }
    }
    // --- the floating diyas ------------------------------------------------------
    const diyas = [];
    for (let i = 0; i < 34; i++) {
        const q = hash(i, 61);
        const y = HZ + 5 + 34 * Math.pow(q, 1.3);
        diyas.push([hash(i, 62) * 260 - 30, y, hash(i, 63) * 50, 0.6 + 0.6 * hash(i, 64)]);
    }
    const dyn = [new Float32Array(N), new Float32Array(N), new Float32Array(N)];
    const dref = new Float32Array(N); // warm light to be reflected
    const arm = new Uint8Array(N); // the priests' raised arms, this frame
    const addGlow = (fx, fy, core, halo, amp) => {
        const R = Math.ceil(halo * 3.2);
        for (let r = Math.max(0, Math.floor(fy - R)); r < Math.min(H, fy + R); r++) {
            for (let x = Math.max(0, Math.floor(fx - R)); x < Math.min(W, fx + R); x++) {
                const k = r * W + x;
                const dx = x + 0.5 - fx, dy = (r + 0.5 - fy) * 0.85;
                const d = Math.sqrt(dx * dx + dy * dy);
                // a white-hot heart inside an orange halo; the priests are not lit
                const am = mat[k] === FIG ? amp * 0.15 : amp;
                const c = Math.exp(-((d / core) ** 2)) * 1.6 * am, v = Math.exp(-d / halo) * 0.35 * am;
                dyn[0][k] += c + v * FLAME[0], dyn[1][k] += c * 0.86 + v * FLAME[1], dyn[2][k] += c * 0.55 + v * FLAME[2];
            }
        }
    };
    // the lamps' wide warm wash on the stone, by how much each surface takes it
    const addWash = (fx, fy, halo, amp) => {
        const R = Math.ceil(halo * 2.6);
        for (let r = Math.max(0, Math.floor(fy - R)); r < Math.min(H, fy + R); r++) {
            for (let x = Math.max(0, Math.floor(fx - R)); x < Math.min(W, fx + R); x++) {
                const k = r * W + x;
                const a = alb[k];
                if (!a)
                    continue;
                const dx = x + 0.5 - fx, dy = r + 0.5 - fy;
                const v = Math.exp(-Math.sqrt(dx * dx + dy * dy) / halo) * amp * a;
                dyn[0][k] += v * WASH[0], dyn[1][k] += v * WASH[1], dyn[2][k] += v * WASH[2];
            }
        }
    };
    const addStreak = (fx, wl, width, len, amp) => {
        for (let r = Math.max(0, Math.floor(wl)); r < H; r++) {
            const dy = r + 0.5 - wl;
            const a = Math.exp(-dy / len) * amp * smooth(-0.5, 1, dy);
            if (a < 0.01)
                break;
            for (let x = Math.max(0, Math.floor(fx - 3 * width - 1)); x < Math.min(W, fx + 3 * width + 1); x++) {
                const k = r * W + x;
                if (mat[k] === WATER)
                    dref[k] += a * Math.exp(-(((x + 0.5 - fx) / width) ** 2));
            }
        }
    };
    // the boat crossing the bright reach
    const BS = 0.85;
    const boatAt = (lx, ly) => {
        // local coordinates: lx along the boat, ly up from the waterline
        const L = 9;
        if (Math.abs(lx) < L && ly > -0.6 && ly < 1.2 + 1.4 * Math.pow(Math.abs(lx) / L, 3))
            return 1;
        if (lx > 4.6 && lx < 5.8 && ly > 0 && ly < 6.6)
            return 1; // the boatman
        if (Math.abs(lx - 5.2) < 0.7 && Math.abs(ly - 7.2) < 0.7)
            return 1;
        const ox = lx - 5.6, oy = ly - 5.4; // his oar, raked back into the water
        const along = ox * 0.42 - oy * 0.91;
        if (along > 0 && along < 8 && Math.abs(ox * 0.91 + oy * 0.42) < 0.32)
            return 1;
        if (lx > -4 && lx < -0.5 && ly > 0 && ly < 2.6 - 0.25 * Math.abs(lx + 2.2))
            return 1; // a passenger
        return 0;
    };
    return (t, { color } = {}) => {
        for (let c = 0; c < 3; c++)
            dyn[c].fill(0);
        dref.fill(0);
        // aarti: each lamp is raised and turned in slow circles
        arm.fill(0);
        aarti.forEach(([ax, sw, sl], i) => {
            const s = scF(ax), u = 1.3 * s, base = wlF(ax) - 2.6 * s;
            const ph = t * 1.1 + i * 1.3;
            const fx = ax + 0.9 * u + Math.cos(ph) * 1.1 * u, fy = base - 7.2 * u + Math.sin(ph) * 0.6 * u;
            // the arm from the shoulder to the lamp
            const sx0 = ax + 0.62 * u, sy0 = base - 3.8 * u;
            const ex = fx - sx0, ey = fy + 0.6 * u - sy0, el = ex * ex + ey * ey;
            for (let r = Math.floor(Math.min(sy0, fy) - 1); r <= Math.max(sy0, fy) + 1; r++) {
                for (let x = Math.floor(Math.min(sx0, fx) - 1); x <= Math.max(sx0, fx) + 1; x++) {
                    if (x < 0 || x >= W || r < 0 || r >= H)
                        continue;
                    const px = x + 0.5 - sx0, py = r + 0.5 - sy0;
                    const q = clamp((px * ex + py * ey) / el);
                    if (Math.hypot(px - q * ex, py - q * ey) < 0.28 * u)
                        arm[r * W + x] = 1;
                }
            }
            const fl = 0.85 + 0.15 * Math.sin(t * 13 + i * 5) * Math.sin(t * 7.3 + i);
            addGlow(fx, fy, 0.6 * u, 1.7 * u, fl);
            addWash(fx, fy + 2 * u, 7.5 * s, 0.34 * fl);
            addStreak(fx, wlF(fx), 0.8 * s * sw, 15 * s * sl, 0.75 * fl);
        });
        // the step lamps
        for (const [k, ph] of stepLamps) {
            const v = 0.7 + 0.3 * Math.sin(t * 5 + ph);
            dyn[0][k] += v * FLAME[0], dyn[1][k] += v * FLAME[1] * 0.95, dyn[2][k] += v * FLAME[2];
        }
        // diyas drifting downstream, nearer ones faster
        for (const [x0, y, ph, sz] of diyas) {
            const near = (y - HZ) / (H - HZ);
            const x = ((((x0 + t * (0.25 + 0.9 * near)) % 260) + 260) % 260) - 30;
            if (x < -3 || x > W + 3 || y < wlF(x) + 0.8)
                continue;
            const fl = 0.8 + 0.2 * Math.sin(t * 9 + ph);
            const s = (0.35 + 0.9 * near) * sz;
            addGlow(x, y - 0.3, 0.45 + 0.3 * s, 0.6 + 1.2 * s, fl * 0.8);
            addStreak(x, y + 0.2, 0.3 + 0.35 * s, 2 + 5 * s, 0.6 * fl);
        }
        const drift = t * 0.9 + 720; // starts with the long streaks over the glow
        const bx = ((((159 - t * 0.1 + 24) % 250) + 250) % 250) - 24, by = 71 + Math.sin(t * 0.9) * 0.15;
        for (let r = 0; r < H; r++) {
            const y = r + 0.5;
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                const m = mat[k];
                let cr = sR[k], cg = sG[k], cb = sB[k], floor = flo[k], fade = 1, star = false;
                if (m === SKY) {
                    if (r < CH) {
                        const sx = x + drift, ix = Math.floor(sx), fx = sx - ix;
                        const i0 = r * CW + (ix % CW), i1 = r * CW + ((ix + 1) % CW);
                        const c = cover[i0] + (cover[i1] - cover[i0]) * fx;
                        if (c > 0.01) {
                            // high streaks glow rose from below; low ones stand dark against
                            // the afterglow with only their undersides lit, gold near the glow
                            const l = clit[i0] + (clit[i1] - clit[i0]) * fx;
                            const lo = smooth(12, 30, y);
                            const lit = mix(0.3 + 0.7 * l, 0.9 * l * l, lo);
                            const i = rampAt(0.56 + 0.38 * warm[k] + 0.08 * l) * 3;
                            const kr = mix(0.075, RT[i], lit), kg = mix(0.05, RT[i + 1], lit), kb = mix(0.15, RT[i + 2], lit);
                            cr = mix(cr, kr, c), cg = mix(cg, kg, c), cb = mix(cb, kb, c);
                            floor = mix(floor, 0.06, c * (1 - lit));
                        }
                        else if (y < 24 && hash(x, r * 3 + 11) > 0.993) {
                            const tw = 0.4 + 0.25 * Math.sin(t * (1.3 + hash(x, r) * 2) + hash(r, x) * 6.28);
                            cr = Math.max(cr, tw * 0.9), cg = Math.max(cg, tw * 0.88), cb = Math.max(cb, tw);
                            star = true;
                        }
                    }
                }
                else if (m === WATER) {
                    const v = (y - HZ) / (H - HZ);
                    const w = 0.6 * noise(x * 0.05 + t * 0.08, y * 0.45 - t * 0.45, 0) + 0.4 * noise(x * 0.16 - t * 0.15, y * 0.95 - t * 0.9, 0);
                    const swell = 0.55 + 0.9 * w;
                    cr = 0.035 * swell, cg = 0.045 * swell, cb = 0.12 * swell;
                    const wob = (noise(x * 0.04 + 7, y * 0.3 - t * 0.6, 0) - 0.5) * (1.2 + 4 * v);
                    let sx = x + wob;
                    if (sx < 0)
                        sx = 0;
                    if (sx > W - 1.001)
                        sx = W - 1.001;
                    const i0 = r * W + (sx | 0), fx = sx - (sx | 0);
                    const dash = smooth(0.25, 0.75, noise(x * 0.12 + 3, y * 0.8 - t * 1.1, 0));
                    const ref = (a) => a[i0] + (a[i0 + 1] - a[i0]) * fx;
                    // broken bands, except in the bright reach under the glow
                    const reach = Math.exp(-(((x + 0.5 - GLOW[0]) / 15) ** 2)) * smooth(HZ + 2.5, HZ + 5.5, y);
                    const da = mix(0.15 + 1.1 * dash, 0.7 + 0.5 * dash, reach);
                    cr += ref(refl[0]) * da, cg += ref(refl[1]) * da, cb += ref(refl[2]) * da;
                    // the lamplit stone above, given back in broken bands
                    const q = mirK[k];
                    if (q >= 0)
                        (cr += dyn[0][q] * 0.4 * da), (cg += dyn[1][q] * 0.4 * da), (cb += dyn[2][q] * 0.4 * da);
                    const fl = (ref(dref) + ref(sref)) * (0.2 + 1.1 * dash);
                    cr += fl * FLAME[0], cg += fl * FLAME[1], cb += fl * FLAME[2];
                    // a narrow road of glitter straight under the glow
                    const gw = 1.3 + (y - HZ) * 0.15;
                    const gx = (x + 0.5 - GLOW[0]) / gw;
                    if (gx > -3 && gx < 3) {
                        const road = Math.exp(-gx * gx) * Math.exp(-(y - HZ) / 24);
                        const rip = noise(x * 0.45 + y * 0.1 - t * 0.3, y * 1.3 - t * 1.6, 0);
                        const glint = smooth(0.42, 0.78, 0.45 * w + 0.55 * rip) * road;
                        cr += 1.0 * glint + 0.12 * road, cg += 0.78 * glint + 0.07 * road, cb += 0.42 * glint + 0.04 * road;
                    }
                    floor = 0.12;
                    fade = smooth(H + 4, H - 16, y);
                }
                // the boat and its dark reflection
                const lx = x + 0.5 - bx;
                if (lx > -14 && lx < 15 && r > by - 11 && r < by + 11) {
                    let cov = 0, rc = 0;
                    for (let sy2 = 0; sy2 < 2; sy2++)
                        for (let sx2 = 0; sx2 < 2; sx2++) {
                            const px = (lx - 0.25 + sx2 * 0.5) / BS, py = (by - (r + 0.25 + sy2 * 0.5)) / BS;
                            cov += boatAt(px, py);
                            if (m === WATER)
                                rc += boatAt(px, -py * 0.9);
                        }
                    cov /= 4, rc /= 4;
                    if (cov > 0) {
                        cr = mix(cr, 0.035, cov), cg = mix(cg, 0.022, cov), cb = mix(cb, 0.035, cov);
                        floor = mix(floor, 0.02, cov), star = false;
                    }
                    else if (rc > 0)
                        (cr *= 1 - 0.8 * rc), (cg *= 1 - 0.8 * rc), (cb *= 1 - 0.75 * rc);
                }
                if (arm[k])
                    (cr = 0.035 + dyn[0][k] * 0.12), (cg = 0.022 + dyn[1][k] * 0.12), (cb = 0.035 + dyn[2][k] * 0.12), (floor = 0.02);
                else
                    (cr += dyn[0][k]), (cg += dyn[1][k]), (cb += dyn[2][k]);
                const peak = Math.max(cr, cg, cb, 1e-4);
                const level = clamp(floor + (1 - floor) * Math.pow(peak, 0.72) * 0.95) * fade;
                const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
                out[k] = DOTS[step];
                if (color) {
                    if (star)
                        color[k] = STAR;
                    else {
                        const want = step ? Math.min(1, (level + 0.06) / COVER[step]) : 0;
                        const s = Math.min(LIFT[step], (0.3 + 0.7 * want) / peak);
                        color[k] = nearest(clamp(cr * s), clamp(cg * s), clamp(cb * s));
                    }
                }
            }
        }
        const lines = [];
        for (let r = 0; r < H; r++)
            lines.push(out.slice(r * W, (r + 1) * W).join(""));
        return lines.join("\n");
    };
}

    return { meta: meta, make: varanasiGhats };
  })();

  // -------------------------------------------------------------
  // Scene: marine-drive
  // -------------------------------------------------------------
  SCENES["marine-drive"] = (function () {
const meta = {
    name: "marine drive",
    category: "scenes",
    note: "mumbai's queen's necklace at night, lamps curving round the bay",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 15,
    ground: "#07080f",
    palette: [
        "#18213f", "#202c55", "#2a396d", "#374a88", "#4a60a2", "#6880bc",
        "#2c2140", "#3f2d58", "#56396b", "#6e4a7a", "#8a5f88",
        "#5a2e3c", "#7b404c", "#9e5858",
        "#55300f", "#7d4515", "#a95c1b", "#d27a24", "#ee9631", "#ffb246", "#ffcd6a", "#ffe39c", "#fff2cf",
        "#ffffff", "#dce6ff", "#a9bde8",
        "#6a181b", "#b22a28", "#ff4b3e",
        "#132c38", "#1c3f4f", "#2a5868",
        "#29283a", "#3c3a4c", "#565266", "#79738a",
    ],
};
const W = 200, H = 100;
const HZ = 40; // the sea horizon
const TIP = 176; // nariman point, where the necklace ends
const MOON = [189, 13];
const MOON_R = 4.5;
// darker seas on the moon's face: [dx, dy, radius]
const MARIA = [[-1.4, -1.2, 1.6], [1.3, 0.8, 1.4], [-0.6, 2, 1.1]];
const DOTS = " ·•●";
const COVER = [0, 0.3, 0.6, 1];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
const SODIUM = [1, 0.56, 0.18];
const SKY = 0, WATER = 1, FAR = 2, TOWER = 3, FRONT = 4, ROAD = 5, WALL = 6, POLE = 7, SHIP = 8;
function hash(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
        x0 = ((xi % period) + period) % period;
        x1 = (x0 + 1) % period;
    }
    const a = hash(x0, yi), b = hash(x1, yi), c = hash(x0, yi + 1), d = hash(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, octaves, period) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
        s += amp * noise(x * f, y * f, period * f);
        n += amp;
        amp *= 0.5;
        f *= 2;
    }
    return s / n;
}
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => {
    const k = clamp((v - a) / (b - a));
    return k * k * (3 - 2 * k);
};
const mix = (a, b, k) => a + (b - a) * k;
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
// The shoreline: steep and near at the left, flat and far toward the point.
const shoreF = (x) => 50 + 34 * Math.pow(Math.max(0, 1 - x / TIP), 2.2);
// How large one unit of distance along the drive looks at column x.
const scF = (x) => 0.5 + 1.9 * Math.pow(Math.max(0, 1 - x / TIP), 1.5);
const seaTop = (x) => (x <= TIP ? shoreF(x) : Math.max(HZ, 50 - (x - TIP) * 1.6));
const wallTopF = (x) => shoreF(x) - Math.max(1, scF(x));
const roadTopF = (x) => wallTopF(x) - Math.max(1, 1.5 * scF(x));
// The city's sodium glow in the sky, weaker out over the open sea.
const glowF = (x, y) => {
    const over = 0.5 + 0.5 * smooth(TIP + 24, TIP - 16, x);
    const h = Math.max(0, HZ - y);
    return over * (Math.exp(-h / 4) * 0.5 + Math.exp(-h / 12) * 0.12);
};
function marineDrive() {
    const P = meta.palette.map(hex);
    const N = W * H;
    const out = new Array(N);
    const lut = new Uint8Array(32768).fill(255);
    const nearest = (r, g, b) => {
        const k = (Math.min(31, (r * 31.99) | 0) << 10) | (Math.min(31, (g * 31.99) | 0) << 5) | Math.min(31, (b * 31.99) | 0);
        if (lut[k] !== 255)
            return lut[k];
        let best = 0, bd = 1e9;
        for (let i = 0; i < P.length; i++) {
            const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
            const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
            if (d < bd)
                (bd = d), (best = i);
        }
        return (lut[k] = best);
    };
    // --- distance along the drive -----------------------------------------
    const STEP = 0.25;
    const nU = Math.ceil((TIP + 4) / STEP) + 2;
    const Utab = new Float32Array(nU);
    for (let i = 1; i < nU; i++) {
        const x = (i - 0.5) * STEP;
        const sl = (shoreF(x + 0.05) - shoreF(x - 0.05)) / 0.1;
        Utab[i] = Utab[i - 1] + (Math.sqrt(1 + sl * sl) * STEP) / scF(x);
    }
    const Uof = (x) => {
        const f = Math.max(0, Math.min(nU - 1.001, x / STEP));
        const i = f | 0;
        return Utab[i] + (Utab[i + 1] - Utab[i]) * (f - i);
    };
    const xOfU = (u) => {
        let lo = 0, hi = TIP;
        for (let i = 0; i < 30; i++) {
            const m = (lo + hi) / 2;
            if (Uof(m) < u)
                lo = m;
            else
                hi = m;
        }
        return (lo + hi) / 2;
    };
    const UEND = Uof(TIP);
    // --- the lamps --------------------------------------------------------
    const lamps = [];
    for (let u = 0.6; u < UEND - 0.4; u += 3.75) {
        const lx = xOfU(u), s = scF(lx);
        lamps.push([lx, wallTopF(lx) - 2.4 * s, s]);
    }
    const FLICK = 6; // one lamp near us is failing
    // --- the front row: art deco blocks along the drive ---------------------
    const blds = [];
    for (let u = -4; u < UEND;) {
        const i = blds.length;
        const w = 7 + 7 * hash(i, 21);
        // art deco blocks of five to eight storeys, and towers at the near, hilly end
        const tall = Math.round(7 * smooth(26, 2, u) * (0.6 + 0.4 * hash(i, 26)));
        blds.push({ u0: u, u1: u + w, floors: 5 + Math.floor(hash(i, 22) * 4) + tall, tone: 0.75 + 0.5 * hash(i, 23), crown: hash(i, 24) > 0.45 });
        u += w + 0.4 + 1.8 * hash(i, 25);
    }
    const colU = new Float32Array(W);
    const bldAt = new Int16Array(W).fill(-1);
    for (let x = 0; x < W; x++) {
        colU[x] = Uof(x + 0.5);
        if (x + 0.5 > TIP)
            continue;
        for (let i = 0; i < blds.length; i++)
            if (colU[x] >= blds[i].u0 && colU[x] < blds[i].u1)
                bldAt[x] = i;
    }
    // --- towers behind, a cluster at the point --------------------------------
    // [centre, half width, top row, warm light]
    const towers = [
        [24, 4.5, 21, 0],
        [97, 2.5, 27, 1], [107, 2, 22, 0], [118, 3, 30, 0], [126, 2, 25, 1],
        [136, 3, 23, 0], [142.5, 2, 15, 1], [149, 3.5, 27, 0], [156, 2.5, 19, 0], [162, 3, 12, 1], [168.5, 2.5, 21, 0], [173, 2, 28, 1],
    ];
    // --- the static picture -------------------------------------------------
    const mat = new Uint8Array(N);
    const sR = new Float32Array(N), sG = new Float32Array(N), sB = new Float32Array(N);
    const flo = new Float32Array(N);
    const lane = new Uint8Array(N); // 1 far lane, 2 near lane, 3 both
    const skyGlow = new Float32Array(N);
    const flick = []; // rooms whose light changes: [cell, r, g, b, kind, rate, phase]
    const beacons = []; // red lights on the tallest towers: [cell, phase]
    for (let r = 0; r < H; r++) {
        for (let x = 0; x < W; x++) {
            const k = r * W + x;
            const xc = x + 0.5, y = r + 0.5;
            if (y >= seaTop(xc)) {
                mat[k] = WATER;
                continue;
            }
            let m = SKY, cr = 0, cg = 0, cb = 0, fl = 0.15;
            const blk = Math.floor((x + 40 * fbm(x * 0.02, 5, 2, 0)) / 3);
            const farTop = HZ - 0.4 - (0.4 + 5 * hash(blk, 7) ** 3) * (0.5 + 0.5 * fbm(x * 0.05, 2, 2, 0));
            if (xc < TIP + 7 && y >= farTop) {
                // the far city: low blocks in the haze, pricked with tiny lights
                m = FAR;
                const g = glowF(xc, HZ - 2);
                cr = 0.03 + 0.05 * g, cg = 0.04 + 0.03 * g, cb = 0.08 + 0.02 * g;
                const hl = hash(x * 3 + 1, r * 7 + 2);
                if (hl < 0.035) {
                    const v = 0.25 + 0.45 * hash(x, r * 5 + 9);
                    const cool = hash(x * 5, r) < 0.3;
                    cr += v * (cool ? 0.8 : 1), cg += v * (cool ? 0.85 : 0.7), cb += v * (cool ? 1 : 0.4);
                }
                fl = 0.08;
            }
            for (let ti = 0; ti < towers.length; ti++) {
                const [tx, hw, top, warm] = towers[ti];
                const dx = xc - tx;
                if (Math.abs(dx) > hw || y < top)
                    continue;
                m = TOWER;
                // dark glass, its moonward edge catching a little light
                cr = 0.015, cg = 0.018, cb = 0.035;
                if (dx > hw - 1)
                    (cr += 0.04), (cg += 0.055), (cb += 0.1);
                const g = glowF(xc, y) * 0.2;
                cr += g * 0.42, cg += g * 0.21, cb += g * 0.1;
                const fr = r - top;
                if (fr === 0)
                    (cr += 0.08), (cg += 0.1), (cb += 0.16); // the rooftop's edge
                else if (fr > 0 && fr % 2 === 1 && Math.abs(dx) < hw - 0.5) {
                    const seg = Math.floor((xc - tx + hw) / 3);
                    const h = hash(ti * 17 + seg, r * 13 + 3);
                    if (h < 0.5) {
                        const v = 0.4 + 0.3 * hash(ti * 7 + seg, r);
                        const cool = warm ? h < 0.1 : h > 0.1;
                        cr += v * (cool ? 0.72 : 1), cg += v * (cool ? 0.84 : 0.72), cb += v * (cool ? 1 : 0.42);
                    }
                }
                if (fr === 0 && Math.abs(dx) < 0.6 && top < 20)
                    beacons.push([k - W, ti * 1.7]);
                fl = 0.03;
            }
            if (xc <= TIP) {
                const s = scF(xc), wt = wallTopF(xc), rt = roadTopF(xc);
                const bi = bldAt[x];
                if (bi >= 0 && y < rt) {
                    const b = blds[bi];
                    const uu = colU[x] - b.u0, bw = b.u1 - b.u0;
                    const f = (rt - y) / s; // height above the road, in storeys of 1.7
                    let hgt = b.floors * 1.7 + 1.1;
                    if (b.crown && uu > bw * 0.32 && uu < bw * 0.68)
                        hgt += 1.6;
                    if (f < hgt) {
                        m = FRONT;
                        const edge = uu < 0.5 || uu > bw - 0.5;
                        const t0 = b.tone * (edge ? 1.35 : 1);
                        // pale art deco plaster, warm where the street lamps reach it
                        cr = 0.03 * t0, cg = 0.035 * t0, cb = 0.06 * t0;
                        const up = Math.exp(-f / 2) * 0.16;
                        cr += up * SODIUM[0], cg += up * SODIUM[1], cb += up * SODIUM[2];
                        if (f > hgt - 0.6 / s || (f > b.floors * 1.7 + 0.6 && f < b.floors * 1.7 + 0.6 + 0.5 / s))
                            (cr += 0.1), (cg += 0.13), (cb += 0.22); // cornice, moonlit
                        if (uu > bw - 0.7 / s - 0.2)
                            (cr += 0.04), (cg += 0.06), (cb += 0.12); // the corner toward the moon
                        const fi = Math.floor((f - 0.9) / 1.7);
                        const ff = (f - 0.9) - fi * 1.7;
                        const col = Math.floor((uu - 0.3) / 1.5);
                        const cu = uu - 0.3 - col * 1.5;
                        const fine = s * 1.7 >= 2.6;
                        const inWin = fi >= 0 && fi < b.floors && uu > 0.7 && uu < bw - 0.7 && (fine ? ff > 0.45 && ff < 1.35 && cu > 0.35 && cu < 1.15 : true);
                        if (inWin && !fine) {
                            // too far to count rooms: each storey reads as a band of light,
                            // broken where rooms are dark
                            const v = 0.04 + 0.26 * hash(bi * 13 + Math.floor(uu / 3.2), fi * 7 + 1) ** 2;
                            cr += v, cg += v * 0.8, cb += v * 0.55;
                            if (hash(x * 7 + 3, r * 11) < 0.035)
                                (cr += 0.4), (cg += 0.36), (cb += 0.28);
                        }
                        else if (inWin) {
                            const h = hash(bi * 97 + col, fi * 31 + 5);
                            const lit = h < (fine ? 0.3 : 0.2);
                            if (lit) {
                                const v = (0.35 + 0.3 * hash(bi * 13 + col, fi)) * (fine ? 1 : 0.7);
                                const kind = hash(bi * 7 + col, fi * 3 + 1);
                                let wr = 1, wg = 0.84, wb = 0.58; // tungsten, paler than the lamps
                                if (kind < 0.25)
                                    (wr = 0.82), (wg = 0.9), (wb = 1); // tube light
                                cr += v * wr, cg += v * wg, cb += v * wb;
                                const fk = hash(bi * 5 + col, fi * 11 + 7);
                                if (fk < 0.07)
                                    flick.push([k, v * wr, v * wg, v * wb, fk < 0.025 ? 1 : 0, 0.3 + fk * 9, fk * 400]);
                            }
                            else if (fine) {
                                (cr *= 0.7), (cg *= 0.7), (cb *= 0.8);
                            }
                        }
                        fl = 0.03;
                    }
                }
                if (y >= rt && y < wt) {
                    m = ROAD;
                    cr = 0.07, cg = 0.05, cb = 0.05;
                    fl = 0.1;
                    const lf = (y - rt) / (wt - rt);
                    lane[k] = wt - rt < 1.8 ? 3 : lf < 0.5 ? 1 : 2;
                }
                else if (y >= wt) {
                    m = WALL; // the sea wall and the promenade along it
                    cr = 0.1, cg = 0.09, cb = 0.1;
                    fl = 0.1;
                }
                for (const [lx, ly, ls] of lamps) {
                    if (ls > 1.15 && Math.abs(xc - lx) < 0.5 && y > ly && y < wt)
                        (m = POLE), (cr = 0.09), (cg = 0.08), (cb = 0.09), (fl = 0.1);
                }
            }
            if (m === SKY) {
                // navy overhead to a sodium haze on the horizon
                const v = y / HZ;
                // brighter over the point, so its towers stand dark against the haze
                const g = glowF(xc, y) * (1 + 0.6 * smooth(84, 98, xc) * smooth(186, 174, xc)) + 0.2 * Math.exp(-Math.max(0, HZ - y) / 14) * smooth(84, 104, xc) * smooth(188, 172, xc);
                const veil = 0.88 + 0.24 * fbm(x * 0.05, r * 0.08, 3, 0);
                // the last of the blue hour, deepening overhead
                const vv = Math.pow(v, 1.4);
                cr = (0.03 + 0.07 * vv) * veil + g * 0.42;
                cg = (0.05 + 0.12 * vv) * veil + g * 0.22;
                cb = (0.15 + 0.24 * vv) * veil + g * 0.1;
                // a pale sea haze on the open horizon, for the ships to sit against
                const hzn = Math.exp(-Math.max(0, HZ - y) / 3.5) * smooth(172, 186, xc) * 0.16;
                cr += hzn * 0.6, cg += hzn * 0.7, cb += hzn * 0.95;
                // a hazy moon over the open sea
                const dmx = xc - MOON[0], dmy = y - MOON[1];
                const dm = Math.sqrt(dmx * dmx + dmy * dmy);
                const halo = Math.exp(-dm / 22) * 0.13 + Math.exp(-dm / 6) * 0.26;
                cr += halo * 0.9, cg += halo * 0.86, cb += halo * 0.8;
                // a darker ring just off the limb, so the disc's edge pops
                const ring = 0.03 * smooth(4.6, 5.6, dm) * smooth(8.5, 6.5, dm);
                cr -= ring, cg -= ring, cb -= ring * 0.8;
                if (dm < MOON_R) {
                    let face = 0.9 + 0.1 * fbm(x * 0.6, r * 0.6, 2, 0);
                    for (const [mx, my, mr] of MARIA) {
                        const d2 = ((dmx - mx) ** 2 + (dmy - my) ** 2) / (mr * mr);
                        if (d2 < 1)
                            face -= 0.14 * (1 - d2);
                    }
                    const a = smooth(MOON_R, MOON_R - 0.8, dm);
                    cr = mix(cr, face, a), cg = mix(cg, face * 0.95, a), cb = mix(cb, face * 0.86, a);
                }
                skyGlow[k] = g;
            }
            mat[k] = m;
            sR[k] = cr, sG[k] = cg, sB[k] = cb, flo[k] = fl;
        }
    }
    // ships riding at anchor beyond the point
    // [x, row, r, g, b]: white mastheads, warm deck and cabin lights, a red port light
    // a long freighter with its bridge aft, and a smaller boat further out
    const shipLights = [
        [184, 35, 1, 1, 1], [190, 34, 1, 1, 1], [185, 37, 1, 0.78, 0.45], [187, 37, 1, 0.8, 0.5], [189, 36, 1, 0.82, 0.5], [191, 36, 1, 0.8, 0.5],
        [197, 36, 1, 1, 1], [196, 38, 1, 0.78, 0.45], [199, 38, 0.95, 0.22, 0.18],
    ];
    const hull = (x, r) => (r >= 38 && x >= 182 && x <= 192) || (r === 37 && x >= 183 && x <= 192) || (r >= 35 && r <= 36 && x >= 189 && x <= 191) || (r >= 35 && r <= 36 && x === 184) ||
        (r >= 38 && x >= 195 && x <= 199) || (r === 37 && x >= 196 && x <= 197);
    for (let r = 34; r < 40; r++) {
        for (let x = 180; x < W; x++) {
            if (!hull(x, r))
                continue;
            const k = r * W + x;
            mat[k] = SHIP, (sR[k] = 0.002), (sG[k] = 0.002), (sB[k] = 0.004), (flo[k] = 0);
        }
    }
    for (const [x, r, cr, cg, cb] of shipLights) {
        const k = r * W + x;
        mat[k] = SHIP, (sR[k] = cr), (sG[k] = cg), (sB[k] = cb), (flo[k] = 0.1);
    }
    // --- lamp light: a hot core, a halo, and a wide warm spill ----------------
    const lampI = new Float32Array(N);
    const lampW = new Float32Array(N); // the white-hot cores
    const flickI = new Float32Array(N);
    const flickW = new Float32Array(N);
    const refl = [new Float32Array(N), new Float32Array(N), new Float32Array(N)];
    const reflFl = new Float32Array(N);
    lamps.forEach(([lx, ly, s], j) => {
        const core = 0.34 + 0.3 * s, halo = 0.4 + 0.4 * s, spill = 1.2 + 1.5 * s;
        const R = Math.ceil(spill * 3.2);
        const into = j === FLICK ? flickI : lampI;
        const hot = j === FLICK ? flickW : lampW;
        for (let r = Math.max(0, Math.floor(ly - R)); r < Math.min(H, ly + R); r++) {
            for (let x = Math.max(0, Math.floor(lx - R)); x < Math.min(W, lx + R); x++) {
                const k = r * W + x;
                if (mat[k] === WATER)
                    continue;
                const dx = x + 0.5 - lx, dy = r + 0.5 - ly;
                const d = Math.sqrt(dx * dx + dy * dy);
                const c = Math.exp(-((d / core) ** 2)) * 2.2;
                into[k] += c * 0.7 + Math.exp(-d / halo) * 0.24 + Math.exp(-d / spill) * 0.02;
                hot[k] += c * 0.3;
            }
        }
        // its reflection: a long column broken by the swell, reaching toward us
        const sy = shoreF(lx);
        const wj = 0.4 + 0.7 * s, len = 2 + 8 * s;
        for (let r = Math.floor(sy); r < H; r++) {
            const dy = r + 0.5 - sy;
            if (dy < 0)
                continue;
            const a = Math.exp(-dy / (len * 1.7)) * (0.3 + 0.15 * s) * smooth(-0.5, 1.5, dy);
            if (a < 0.004)
                break;
            for (let x = Math.max(0, Math.floor(lx - 3 * wj - 1)); x < Math.min(W, lx + 3 * wj + 1); x++) {
                const k = r * W + x;
                if (mat[k] !== WATER)
                    continue;
                const g = a * Math.exp(-(((x + 0.5 - lx) / wj) ** 2));
                if (j === FLICK)
                    reflFl[k] += g;
                else
                    (refl[0][k] += g * SODIUM[0]), (refl[1][k] += g * SODIUM[1]), (refl[2][k] += g * SODIUM[2]);
            }
        }
    });
    for (let k = 0; k < N; k++) {
        const m = mat[k];
        if (m === WATER || m === SKY)
            continue;
        sR[k] += lampI[k] * SODIUM[0] + lampW[k], sG[k] += lampI[k] * SODIUM[1] + lampW[k] * 0.95, sB[k] += lampI[k] * SODIUM[2] + lampW[k] * 0.8;
    }
    // the ships' lights stretch down the water too
    for (const [x, r0, cr, cg, cb] of shipLights) {
        for (let r = HZ; r < HZ + 14; r++) {
            const a = Math.exp(-(r - HZ) / 5) * 0.35;
            for (let dx = -1; dx <= 1; dx++) {
                const k = r * W + x + dx;
                if (x + dx >= W || mat[k] !== WATER)
                    continue;
                const g = a * Math.exp(-dx * dx * 2.5);
                refl[0][k] += g * cr, refl[1][k] += g * cg, refl[2][k] += g * cb;
            }
        }
    }
    // The mirror: each water cell sees the picture above the shore, flipped and
    // stretched toward us, dimmed.
    for (let r = 0; r < H; r++) {
        for (let x = 0; x < W; x++) {
            const k = r * W + x;
            if (mat[k] !== WATER)
                continue;
            const sy = seaTop(x + 0.5), d = r + 0.5 - sy;
            let ar = 0, ag = 0, ab = 0, n = 0;
            // only the lights carry across: the sky, the towers' lit floors, ships
            for (let o = 0; o < 3; o++) {
                const ym = Math.floor(sy - d * 0.55 - 0.3 - o * 0.7);
                if (ym < 0)
                    continue;
                const q = ym * W + x;
                if (mat[q] === WATER)
                    continue;
                n++;
                if (mat[q] === SKY)
                    (ar += sR[q]), (ag += sG[q]), (ab += sB[q]);
                else if (mat[q] === TOWER || mat[q] === SHIP)
                    (ar += Math.max(0, sR[q] - 0.25) * 0.6), (ag += Math.max(0, sG[q] - 0.25) * 0.6), (ab += Math.max(0, sB[q] - 0.25) * 0.6);
            }
            const a = 0.32 * Math.exp(-d / 30);
            if (n)
                (refl[0][k] += (ar / n) * a), (refl[1][k] += (ag / n) * a), (refl[2][k] += (ab / n) * a);
            // and a soft warm sheen off the whole lit shore
            if (x + 0.5 <= TIP + 4) {
                const sh = 0.025 * Math.exp(-d / 5) * smooth(TIP + 4, TIP - 6, x + 0.5);
                refl[0][k] += sh * SODIUM[0], refl[1][k] += sh * SODIUM[1], refl[2][k] += sh * SODIUM[2];
            }
        }
    }
    // --- clouds: low stratus lit from beneath by the city, wrapping -----------
    const CW = 800;
    const cover = new Float32Array(CW * HZ);
    const clit = new Float32Array(CW * HZ);
    const density = (x, y) => {
        const q = fbm(x * 0.01, y * 0.05, 3, 8);
        const d = fbm(x * 0.025 + q * 2.6, y * 0.07 + q * 1.3, 5, 20);
        const yb = y + 14 * (fbm(x * 0.005 + 3, 7, 2, 4) - 0.5); // the bank's edge rises and falls
        return d + 0.05 * smooth(2, 14, yb) - 0.1 * smooth(6, 0, y) - 0.1 * smooth(22, HZ - 4, yb);
    };
    for (let r = 0; r < HZ; r++) {
        for (let x = 0; x < CW; x++) {
            const y = r + 0.5;
            const d = density(x, y);
            cover[r * CW + x] = smooth(0.47, 0.62, d) * 0.9;
            clit[r * CW + x] = clamp(0.5 + (d - density(x - 1, y + 2.5)) * 9 - (d - 0.6) * 1.4);
        }
    }
    // the sky behind the towers at the point is kept clear of low cloud, so the
    // dark glass reads against the city's haze
    const clear = new Float32Array(N);
    for (let k = 0; k < N; k++) {
        const x = (k % W) + 0.5, y = Math.floor(k / W) + 0.5;
        clear[k] = 1 - 0.9 * smooth(84, 96, x) * smooth(186, 176, x) * smooth(20, 28, y);
    }
    // --- cars ------------------------------------------------------------------
    const BIN = 0.2;
    const U0 = -6, NB = Math.ceil((UEND + 12) / BIN);
    const laneA = new Float32Array(NB), laneB = new Float32Array(NB);
    const cars = [];
    for (let i = 0; i < 26; i++)
        cars.push([hash(i, 51) * (UEND + 12), 4.2 + 1.6 * hash(i, 52), i & 1]);
    const binLo = new Int32Array(W), binHi = new Int32Array(W);
    for (let x = 0; x < W; x++) {
        binLo[x] = Math.max(0, Math.floor((Uof(x) - U0) / BIN));
        binHi[x] = Math.min(NB - 1, Math.max(binLo[x], Math.floor((Uof(x + 1) - U0) / BIN)));
    }
    const colA = new Float32Array(W), colB = new Float32Array(W);
    return (t, { color } = {}) => {
        const drift = t * 1.3;
        // cars: tail lights heading out to the point, headlights coming home
        laneA.fill(0), laneB.fill(0);
        const span = UEND + 12;
        for (const [p0, v, dir] of cars) {
            const p = (((p0 + (dir ? -v : v) * t) % span) + span) % span;
            const into = dir ? laneB : laneA;
            const head = Math.floor(p / BIN);
            for (let i = 0; i < 26; i++) {
                const b = dir ? head + i : head - i;
                if (b < 0 || b >= NB)
                    continue;
                const e = Math.exp(-i / 7) * (i < 2 ? 1.3 : 0.85);
                if (e > into[b])
                    into[b] = e;
            }
        }
        for (let x = 0; x < W; x++) {
            let a = 0, b = 0;
            for (let i = binLo[x]; i <= binHi[x]; i++)
                (a = Math.max(a, laneA[i])), (b = Math.max(b, laneB[i]));
            colA[x] = a, colB[x] = b;
        }
        // the failing lamp
        const sputter = Math.sin(t * 0.7) > 0.45;
        const lampOn = sputter ? (hash(Math.floor(t * 9), 77) > 0.45 ? 1 : 0.15) : 1;
        for (let r = 0; r < H; r++) {
            const y = r + 0.5;
            for (let x = 0; x < W; x++) {
                const k = r * W + x;
                const m = mat[k];
                let cr = sR[k], cg = sG[k], cb = sB[k], floor = flo[k], fade = 1;
                if (m === SKY) {
                    const sx = x + drift, ix = Math.floor(sx), fx = sx - ix;
                    const i0 = r * CW + (ix % CW), i1 = r * CW + ((ix + 1) % CW);
                    const c = (cover[i0] + (cover[i1] - cover[i0]) * fx) * clear[k];
                    if (c > 0.01) {
                        const l = clit[i0] + (clit[i1] - clit[i0]) * fx;
                        const g = skyGlow[k];
                        // grey-violet, warmed underneath by the city
                        const dmx = x + 0.5 - MOON[0], dmy = y - MOON[1];
                        const dm = Math.sqrt(dmx * dmx + dmy * dmy);
                        const near = Math.exp(-dm / 16);
                        const b = clamp(0.1 + l * (0.42 + 0.9 * g + 0.5 * near));
                        const kr = b < 0.5 ? mix(0.05, 0.22, b * 2) : mix(0.22, 0.9, b * 2 - 1);
                        const kg = b < 0.5 ? mix(0.06, 0.26, b * 2) : mix(0.26, 0.88, b * 2 - 1);
                        const kb = b < 0.5 ? mix(0.15, 0.44, b * 2) : mix(0.44, 0.92, b * 2 - 1);
                        // low cloud thins into the haze, so the horizon and the ships stay clear
                        const a = Math.min(1, c * 1.1) * smooth(MOON_R, MOON_R + 4, dm) * (1 - 0.8 * smooth(27, 37, y));
                        cr = mix(cr, kr, a), cg = mix(cg, kg, a), cb = mix(cb, kb, a);
                    }
                    else if (y < HZ - 14 && hash(x, r * 3 + 11) > 0.993) {
                        const tw = 0.3 + 0.2 * Math.sin(t * (1.3 + hash(x, r) * 2.5) + hash(r, x) * 6.28);
                        cr = Math.max(cr, tw * 0.9), cg = Math.max(cg, tw * 0.9), cb = Math.max(cb, tw);
                    }
                    const li = lampI[k], lw = lampW[k];
                    cr += li * SODIUM[0] + lw, cg += li * SODIUM[1] + lw * 0.95, cb += li * SODIUM[2] + lw * 0.8;
                    floor = 0.14;
                }
                else if (m === WATER) {
                    const v = (y - HZ) / (H - HZ);
                    const w = 0.6 * noise(x * 0.06 + t * 0.1, y * 0.5 - t * 0.5, 0) + 0.4 * noise(x * 0.18 - t * 0.2, y * 1.0 - t * 1.0, 0);
                    const swell = 0.45 + 0.95 * w;
                    // brighter toward the open sea and the moon
                    const open = 0.85 + 0.3 * (x / W);
                    cr = (0.05 - 0.01 * v) * swell * open, cg = (0.095 - 0.015 * v) * swell * open, cb = (0.23 - 0.03 * v) * swell * open;
                    {
                        // the moon's road on the open water
                        const road = Math.exp(-(((x + 0.5 - MOON[0]) / (0.8 + (y - HZ) * 0.12)) ** 2));
                        const glint = smooth(0.52, 0.8, 0.45 * w + 0.55 * noise(x * 0.3 + t * 0.3, y * 1.4 - t * 1.4, 0)) * road;
                        cr += 0.9 * glint + 0.03 * road, cg += 0.88 * glint + 0.035 * road, cb += 0.8 * glint + 0.05 * road;
                    }
                    // the reflections, pushed sideways by the swell and broken into dashes
                    const wob = (noise(x * 0.05 + 7, y * 0.32 - t * 0.7, 0) - 0.5) * (1.4 + 4.5 * v);
                    let sx = x + wob;
                    if (sx < 0)
                        sx = 0;
                    if (sx > W - 1.001)
                        sx = W - 1.001;
                    const i0 = r * W + (sx | 0), fx = sx - (sx | 0);
                    const dash = 0.45 + 0.9 * smooth(0.2, 0.55, noise(x * 0.16 + 3, y * 0.85 - t * 1.3, 0));
                    const ref = (a) => (a[i0] + (a[i0 + 1] - a[i0]) * fx) * dash;
                    const fl = ref(reflFl) * lampOn;
                    const rr = ref(refl[0]) + fl * SODIUM[0], rg = ref(refl[1]) + fl * SODIUM[1], rb = ref(refl[2]) + fl * SODIUM[2];
                    // where the warm light lies on the water it replaces the blue, so the
                    // streaks stay gold instead of mixing to pink
                    const kill = 1 - 0.9 * clamp((rr - rb) * 3);
                    cr = cr * kill + rr, cg = cg * kill + rg, cb = cb * kill + rb;
                    floor = 0.16;
                    fade = smooth(H + 6, H - 8, y);
                }
                else if (m === ROAD) {
                    const L = lane[k];
                    const a = L & 1 ? colA[x] : 0, b = L & 2 ? colB[x] : 0;
                    cr += a * 0.8 + b * 1.0, cg += a * 0.1 + b * 0.9, cb += a * 0.08 + b * 0.72;
                }
                if (m !== WATER) {
                    const f = flickI[k] * lampOn, fw = flickW[k] * lampOn;
                    if (f)
                        cr += f * SODIUM[0] + fw, cg += f * SODIUM[1] + fw * 0.95, cb += f * SODIUM[2] + fw * 0.8;
                }
                const peak = Math.max(cr, cg, cb, 1e-4);
                const level = clamp(floor + (1 - floor) * Math.pow(peak, 0.85) * 0.95) * fade;
                const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
                out[k] = DOTS[step];
                if (color) {
                    const want = step ? Math.min(1, (level + 0.06) / COVER[step]) : 0;
                    const s = (0.3 + 0.7 * want) / peak;
                    color[k] = nearest(clamp(cr * s), clamp(cg * s), clamp(cb * s));
                }
            }
        }
        // rooms whose light changes, and the aviation lights
        for (const [k, wr, wg, wb, kind, rate, ph] of flick) {
            if (kind) {
                // a television: cold light that jumps
                const f = 0.5 + 0.5 * Math.sin(t * 11 + ph) * Math.sin(t * 4.3 + ph * 2);
                paint(k, sR[k] - wr + f * wr * 0.45, sG[k] - wg + f * wr * 0.6, sB[k] - wb + f * wr, 0.08, color);
            }
            else {
                // a light switched off for a while, then on again
                const f = Math.sin(t * rate * 0.5 + ph) > -0.6 ? 1 : 0;
                paint(k, sR[k] - wr * (1 - f), sG[k] - wg * (1 - f), sB[k] - wb * (1 - f), 0.08, color);
            }
        }
        for (const [k, ph] of beacons) {
            if (k < 0)
                continue;
            const on = Math.sin(t * 2.4 + ph) > 0.3;
            paint(k, on ? 1 : 0.3, on ? 0.2 : 0.06, on ? 0.15 : 0.05, 0.1, color);
        }
        const lines = [];
        for (let r = 0; r < H; r++)
            lines.push(out.slice(r * W, (r + 1) * W).join(""));
        return lines.join("\n");
    };
    function paint(k, cr, cg, cb, floor, color) {
        cr = Math.max(0, cr), cg = Math.max(0, cg), cb = Math.max(0, cb);
        const r = (k / W) | 0, x = k % W;
        const peak = Math.max(cr, cg, cb, 1e-4);
        const level = clamp(floor + (1 - floor) * Math.pow(peak, 0.85) * 0.95);
        const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
        out[k] = DOTS[step];
        if (color) {
            const want = step ? Math.min(1, (level + 0.06) / COVER[step]) : 0;
            const s = (0.3 + 0.7 * want) / peak;
            color[k] = nearest(clamp(cr * s), clamp(cg * s), clamp(cb * s));
        }
    }
}

    return { meta: meta, make: marineDrive };
  })();

  // =============================================================
  // ASCII Canvas Atlas Renderer
  // =============================================================
  function createAsciiRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    const atlas = document.createElement('canvas');
    const actx = atlas.getContext('2d');
    const slots = new Map();

    let currentSceneId = null;
    let frameFn = null;
    let meta = null;
    let cols = 200, rows = 100, cell = 1;
    let palette = null, ground = '#05080f';
    let colorBuf = null;

    let w = 0, h = 0, sw = 0, sh = 0, pw = 0, ph = 0, width = -1;
    let xs = new Int32Array(0), ys = new Int32Array(0);
    let gx = new Int32Array(0), gy = new Int32Array(0);
    let last = '', full = true;
    let lastColor = null;

    let rafId = 0;
    let lastTime = 0;
    let t = 0;
    let isPlaying = true;
    let targetFps = 15;

    const rgb = (css) => (css && css[0] === '#' ? [1, 3, 5].map((i) => parseInt(css.slice(i, i + 2), 16)) : (css && css.match(/[d.]+/g) || []).map(Number));
    const dark = (css) => {
      const c = rgb(css);
      return (0.2126 * (c[0] || 0) + 0.7152 * (c[1] || 0) + 0.0722 * (c[2] || 0)) < 128;
    };
    const env = () => ({
      paper: false,
      color: colorBuf
    });

    const font = (px) => `${px}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;

    function resize() {
      // Scale canvas to cover screen area nicely
      const clientW = window.innerWidth || document.documentElement.clientWidth || 1200;
      const clientH = window.innerHeight || document.documentElement.clientHeight || 800;

      // Keep cell dimensions crisp
      w = Math.max(3, (clientW * (window.devicePixelRatio || 1)) / cols);
      h = w * cell;
      sw = Math.ceil(w);
      sh = Math.ceil(h);
      pw = sw + 2;
      ph = sh + 2;

      canvas.width = Math.round(w * cols);
      canvas.height = Math.round(h * rows);
      atlas.width = pw * 32;
      atlas.height = ph * 32;

      xs = Int32Array.from({ length: cols + 1 }, (_, x) => Math.round(x * w));
      ys = Int32Array.from({ length: rows + 1 }, (_, y) => Math.round(y * h));
      gx = Int32Array.from({ length: cols }, (_, x) => Math.round(x * w + (w - sw) / 2));
      gy = Int32Array.from({ length: rows }, (_, y) => Math.round(y * h + (h - sh) / 2));

      slots.clear();
      full = true;
    }

    function glyph(code, i) {
      const key = code * 256 + i;
      let s = slots.get(key);
      if (s !== undefined) return s;

      if (slots.size >= 1024) {
        actx.clearRect(0, 0, atlas.width, atlas.height);
        slots.clear();
      }
      s = slots.size;
      const x = (s % 32) * pw + 1;
      const y = Math.floor(s / 32) * ph + 1;

      actx.font = font(w / 0.6);
      actx.textAlign = 'center';
      actx.textBaseline = 'middle';
      actx.fillStyle = palette ? (palette[i] || palette[0]) : '#64748b';
      actx.fillText(String.fromCharCode(code), x + sw / 2, y + sh / 2);
      slots.set(key, s);
      return s;
    }

    function draw() {
      if (!frameFn) return;

      const text = frameFn(t, env());
      if (ground) {
        ctx.fillStyle = ground;
      }

      if (full) {
        if (ground) {
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      for (let k = 0, x = 0, y = 0; k < text.length; k++) {
        const c = text.charCodeAt(k);
        if (c === 10) {
          x = 0;
          y++;
          continue;
        }
        const i = y * cols + x;
        if (full || c !== last.charCodeAt(k) || (colorBuf && colorBuf[i] !== lastColor[i])) {
          const x0 = xs[x], y0 = ys[y], cw = xs[x + 1] - x0, ch = ys[y + 1] - y0;
          if (!full) {
            if (ground) {
              ctx.fillRect(x0, y0, cw, ch);
            } else {
              ctx.clearRect(x0, y0, cw, ch);
            }
          }
          if (c !== 32) {
            const s = glyph(c, colorBuf ? colorBuf[i] : 0);
            ctx.drawImage(
              atlas,
              (s % 32) * pw + 1 + x0 - gx[x],
              Math.floor(s / 32) * ph + 1 + y0 - gy[y],
              cw,
              ch,
              x0,
              y0,
              cw,
              ch
            );
          }
        }
        x++;
      }

      last = text;
      if (colorBuf && lastColor) {
        lastColor.set(colorBuf);
      }
      full = false;
    }

    let lastTickTime = performance.now();

    function tick(now) {
      if (!isPlaying) {
        rafId = 0;
        return;
      }
      lastTickTime = now || performance.now();
      rafId = requestAnimationFrame(tick);
      const dt = lastTickTime - lastTime;
      if (dt < 1000 / targetFps - 2) return;
      lastTime = lastTickTime;
      t += Math.min(dt, 100) / 1000;
      try {
        draw();
      } catch (err) {
        console.error('ASCII draw error:', err);
      }
    }

    function setScene(sceneId) {
      const piece = SCENES[sceneId] || SCENES['aurora-fjord'];
      if (!piece) return;

      currentSceneId = sceneId;
      meta = piece.meta;
      cols = meta.cols || 200;
      rows = meta.rows || 100;
      cell = meta.cell || 1;
      palette = meta.palette || null;
      ground = meta.ground || '#05080f';
      targetFps = meta.fps || 15;

      colorBuf = palette ? new Uint8Array(cols * rows) : null;
      lastColor = colorBuf ? new Uint8Array(cols * rows) : null;
      last = '';

      frameFn = piece.make({});
      resize();
      draw();
      start();
    }

    function start() {
      isPlaying = true;
      if (!rafId) {
        lastTime = performance.now();
        lastTickTime = lastTime;
        rafId = requestAnimationFrame(tick);
      }
    }

    function pause() {
      isPlaying = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    function togglePlay() {
      if (isPlaying) pause();
      else start();
      return isPlaying;
    }

    window.addEventListener('resize', () => {
      resize();
      draw();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      } else {
        start();
      }
    });

    window.addEventListener('focus', () => {
      start();
    });

    // Watchdog to guarantee the animation is running always
    setInterval(() => {
      if (isPlaying && !document.hidden) {
        const stalled = performance.now() - lastTickTime > 1500;
        if (!rafId || stalled) {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = 0;
          start();
        }
      }
    }, 1000);

    return {
      setScene,
      start,
      pause,
      togglePlay,
      get isPlaying() { return isPlaying; },
      get currentSceneId() { return currentSceneId; }
    };
  }

  // =============================================================
  // Initialization - Select Random Scene and Run Always
  // =============================================================
  function init() {
    const canvas = document.getElementById('ascii-bg-canvas');
    if (!canvas) return;

    const renderer = createAsciiRenderer(canvas);

    // Pick one random scene on every visit / page refresh
    const sceneKeys = Object.keys(SCENES);
    const randomScene = sceneKeys[Math.floor(Math.random() * sceneKeys.length)] || 'aurora-fjord';

    renderer.setScene(randomScene);
    renderer.start();

    // Expose global controller
    window.AsciiBackground = renderer;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
