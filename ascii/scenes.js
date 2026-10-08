// Registry of ASCII rest scenes
export const SCENES = [
  {
    id: "aurora-fjord",
    name: "aurora fjord",
    title: "Aurora Fjord",
    note: "aurora curtains rippling over a still fjord, a cabin lit on the shore",
    icon: "🌌",
    category: "Nature & Aurora",
    cols: 200,
    rows: 100,
    fps: 15,
    ground: "#05080f"
  },
  {
    id: "alpine-dawn",
    name: "alpine dawn",
    title: "Alpine Dawn",
    note: "snow peaks catching first light above a still, misty mountain lake",
    icon: "🏔️",
    category: "Mountains",
    cols: 200,
    rows: 100,
    fps: 15,
    ground: "#090c18"
  },
  {
    id: "kyoto-dusk",
    name: "kyoto dusk",
    title: "Kyoto Dusk",
    note: "a pagoda at dusk behind a cherry tree lit by a stone lantern",
    icon: "⛩️",
    category: "Architecture",
    cols: 200,
    rows: 100,
    fps: 15,
    ground: "#0b0a16"
  },
  {
    id: "night-coast",
    name: "night coast",
    title: "Night Coast",
    note: "a lighthouse turning its beam under moonlit clouds over a dark sea",
    icon: "🌊",
    category: "Ocean & Coastal",
    cols: 200,
    rows: 100,
    fps: 15,
    ground: "#080b12"
  },
  {
    id: "earthrise",
    name: "earthrise",
    title: "Earthrise",
    note: "the earth rising over a cratered lunar horizon in long low sunlight",
    icon: "🌍",
    category: "Space & Orbit",
    cols: 200,
    rows: 100,
    fps: 15,
    ground: "#030408"
  },
  {
    id: "ocean-sunset",
    name: "ocean sunset",
    title: "Ocean Sunset",
    note: "the sun sets past a pine headland, lit cloud, glitter on rolling sea",
    icon: "🌅",
    category: "Ocean & Coastal",
    cols: 200,
    rows: 100,
    fps: 15,
    ground: "#0b0817"
  },
  {
    id: "deep-reef",
    name: "deep reef",
    title: "Deep Reef",
    note: "light shafts, swaying kelp and a turning school of fish over a reef",
    icon: "🪸",
    category: "Aquatic",
    cols: 200,
    rows: 100,
    fps: 15,
    ground: "#03101a"
  },
  {
    id: "misty-forest",
    name: "misty forest",
    title: "Misty Forest",
    note: "pine ridges fading into morning fog, sunbeams slanting through",
    icon: "🌲",
    category: "Nature & Forest",
    cols: 200,
    rows: 100,
    fps: 15,
    ground: "#090f0e"
  },
  {
    id: "storm-plains",
    name: "storm plains",
    title: "Storm Plains",
    note: "an anvil thunderhead at dusk flickering over a wheat field",
    icon: "⚡",
    category: "Weather & Atmosphere",
    cols: 200,
    rows: 100,
    fps: 15,
    ground: "#0b0912"
  },
  {
    id: "desert-night",
    name: "desert night",
    title: "Desert Night",
    note: "the milky way over a lone acacia on moonless dunes, meteors falling",
    icon: "🏜️",
    category: "Night & Desert",
    cols: 200,
    rows: 100,
    fps: 15,
    ground: "#04060c"
  },
  {
    id: "taj-dawn",
    name: "taj dawn",
    title: "Taj Dawn",
    note: "the taj mahal in pale morning mist over the yamuna",
    icon: "🕌",
    category: "Architecture",
    cols: 200,
    rows: 100,
    fps: 15,
    ground: "#0a0a14"
  },
  {
    id: "varanasi-ghats",
    name: "varanasi ghats",
    title: "Varanasi Ghats",
    note: "the steps of manikarnika at dawn, smoke rising over riverboats",
    icon: "🕯️",
    category: "Cultural & Spiritual",
    cols: 200,
    rows: 100,
    fps: 15,
    ground: "#0d0a14"
  },
  {
    id: "marine-drive",
    name: "marine drive",
    title: "Marine Drive",
    note: "cars passing on the sweeping arc of bombay's queen's necklace at night",
    icon: "🚗",
    category: "Urban & Night",
    cols: 200,
    rows: 100,
    fps: 15,
    ground: "#060810"
  }
];

export async function loadPiece(id, basePath = './pieces/') {
  const mod = await import(`${basePath}${id}.js`);
  return mod;
}
