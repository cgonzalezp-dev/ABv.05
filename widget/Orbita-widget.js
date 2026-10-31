// ═══════════════════════════════════════════════════════════
// ÓRBITA — Widget para Scriptable (v2)
// Aurora de 6:00 a 18:00 · Grafito vivo de 18:00 a 6:00
// Tamaños: pequeño, mediano, grande + pantalla de bloqueo
// Al tocarlo abre la app.
// ═══════════════════════════════════════════════════════════
//
// CONFIGURACIÓN — pega aquí la misma anon key que usas en la app:
const SUPABASE_ANON_KEY = "PEGA_TU_ANON_KEY_AQUI";
//
const SUPABASE_URL = "https://etywvylitxmspxxavvon.supabase.co";
const APP_URL = "https://cgonzalezp-dev.github.io/ABv.05/";
const ICON_URL = APP_URL + "icons/";
// Al tocar: ejecuta el atajo "Abrir Órbita" (app Atajos → acción "Abrir app" → Órbita),
// así abre la app instalada con tus datos, no Safari.
const SHORTCUT_NAME = "Abrir Órbita";
const TAP_URL = "shortcuts://run-shortcut?name=" + encodeURIComponent(SHORTCUT_NAME);
// ═══════════════════════════════════════════════════════════

// ── Hábitos (mismo orden y bloques que la app) ──
const BLOCKS = [
  { id: "manana",   name: "Arranque" },
  { id: "carrera",  name: "Empleo" },
  { id: "mente",    name: "Aprendizaje" },
  { id: "hogar",    name: "Hogar" },
  { id: "conexion", name: "Conexión" },
];
const CORE = [
  { id: "wake",   b: "manana",   n: "Levantada temprana",     p: "daily" },
  { id: "gym",    b: "manana",   n: "Actividad física",       p: "daily" },
  { id: "medit",  b: "manana",   n: "Meditar 10–15 min",      p: "daily" },
  { id: "agenda", b: "manana",   n: "Revisar agenda",         p: "daily" },
  { id: "tests",  b: "carrera",  n: "Pruebas pendientes",     p: "daily" },
  { id: "follow", b: "carrera",  n: "Seguimiento vacantes",   p: "daily" },
  { id: "apply",  b: "carrera",  n: "Aplicar a 3 vacantes",   p: "daily" },
  { id: "course", b: "mente",    n: "Módulo de curso",        p: "daily" },
  { id: "read",   b: "mente",    n: "Lectura + Claude",       p: "daily" },
  { id: "mentor", b: "mente",    n: "Idea de un mentor",      p: "daily" },
  { id: "house",  b: "hogar",    n: "Quehaceres",             p: "daily" },
  { id: "money",  b: "hogar",    n: "Revisar gastos",         p: "daily" },
  { id: "fplan",  b: "hogar",    n: "Plan financiero",        p: "weekly" },
  { id: "rel1",   b: "conexion", n: "Tiempo con mi esposa",   p: "daily" },
  { id: "family", b: "conexion", n: "Llamar a un familiar",   p: "weekly" },
  { id: "piano",  b: "conexion", n: "Piano 10 min",           p: "daily" },
  { id: "emo",    b: "conexion", n: "Anotar emociones",       p: "daily" },
];

// ── Tiempo Colombia (UTC-5) ──
function colNow() { return new Date(Date.now() - 5 * 3600000); }
function colDate(d) { return (d || colNow()).toISOString().slice(0, 10); }
function colHour() { return colNow().getUTCHours(); }
function mondayStr() {
  const n = colNow(); const off = (n.getUTCDay() + 6) % 7;
  return colDate(new Date(n.getTime() - off * 86400000));
}

// ── Tema: Aurora (día) / Grafito vivo (noche) ──
const IS_NIGHT = colHour() < 6 || colHour() >= 18;
const T = IS_NIGHT ? {
  grad: ["#1C1C1E", "#121214", "#0B0B0D"],
  accent: new Color("#0A84FF"),
  accent2: new Color("#64D2FF"),
  glass: new Color("#FFFFFF", 0.07),
  track: new Color("#FFFFFF", 0.12),
} : {
  grad: ["#3634A3", "#5E5CE6", "#9B4FD6"],
  accent: new Color("#FFFFFF"),
  accent2: new Color("#FF9F0A"),
  glass: new Color("#FFFFFF", 0.14),
  track: new Color("#FFFFFF", 0.22),
};
const WHITE = Color.white();
const TXT2 = new Color("#FFFFFF", 0.72);
const TXT3 = new Color("#FFFFFF", 0.48);
const GREEN = new Color("#30D158");
const GOLD = new Color("#FFD60A");

// Tipografía: redondeada del sistema (lo más cercano a Figtree disponible en widgets)
const F = {
  hero: (s) => Font.boldRoundedSystemFont(s),
  semi: (s) => Font.semiboldRoundedSystemFont(s),
  med: (s) => Font.mediumRoundedSystemFont(s),
  reg: (s) => Font.regularRoundedSystemFont(s),
};

// ── Caché local (funciona sin conexión) ──
const fm = FileManager.local();
const DIR = fm.joinPath(fm.documentsDirectory(), "orbita-widget");
if (!fm.fileExists(DIR)) fm.createDirectory(DIR, true);

async function icon(key) {
  const path = fm.joinPath(DIR, "ic-" + key + ".png");
  if (fm.fileExists(path)) return fm.readImage(path);
  try {
    const img = await new Request(ICON_URL + key + ".png").loadImage();
    fm.writeImage(path, img);
    return img;
  } catch (e) { return null; }
}

async function sb(path) {
  const req = new Request(SUPABASE_URL + "/rest/v1/" + path);
  req.headers = { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY };
  req.timeoutInterval = 10;
  return await req.loadJSON();
}

async function loadData() {
  const cache = fm.joinPath(DIR, "data.json");
  const configured = SUPABASE_ANON_KEY.length > 20 && !SUPABASE_ANON_KEY.startsWith("PEGA_");
  if (configured) {
    try {
      const [week, prof] = await Promise.all([
        sb("sop_daily?fecha=gte." + mondayStr() + "&select=fecha,habits,done_count,total_count,xp_day&order=fecha.asc"),
        sb("sop_profile?id=eq.main&select=xp,streak,user_name,budget"),
      ]);
      const data = { week: Array.isArray(week) ? week : [], prof: (prof && prof[0]) || {}, at: Date.now() };
      fm.writeString(cache, JSON.stringify(data));
      return { ...data, configured, offline: false };
    } catch (e) { console.log("Supabase: " + e); }
  }
  if (fm.fileExists(cache)) {
    try { return { ...JSON.parse(fm.readString(cache)), configured, offline: true }; } catch (e) {}
  }
  return { week: [], prof: {}, configured, offline: true };
}

// ── Cálculos ──
function compute(d) {
  const today = colDate();
  const row = d.week.find((r) => r.fecha === today) || {};
  const h = row.habits || {};
  const doneWeek = (id) => d.week.some((r) => r.fecha < today && r.habits && r.habits[id]);
  const list = CORE.map((x) => ({ ...x, st: h[x.id] || null, due: x.p === "daily" || !doneWeek(x.id) }))
    .filter((x) => x.due || x.st);
  const done = list.filter((x) => x.st).length;
  const total = list.length;
  const pending = list.filter((x) => !x.st);
  const blocks = BLOCKS.map((b) => {
    const hs = list.filter((x) => x.b === b.id);
    return { ...b, done: hs.filter((x) => x.st).length, total: hs.length };
  });
  const bud = d.prof.budget || null;
  return {
    done, total, pct: total ? done / total : 0, pending, blocks,
    xpDay: row.xp_day || 0, streak: d.prof.streak || 1, name: d.prof.user_name || "Cristian",
    budget: bud && bud.max ? { name: bud.name || "Presupuesto", spent: bud.spent || 0, max: bud.max } : null,
  };
}
function k(v) {
  v = Math.round(v || 0);
  if (v >= 1000000) return (Math.round(v / 100000) / 10).toString().replace(".", ",") + "M";
  if (v >= 1000) return (Math.round(v / 100) / 10).toString().replace(".", ",") + "k";
  return String(v);
}

// ── Anillo de progreso ──
function ring(pct, size, line, color, track) {
  const dc = new DrawContext();
  dc.size = new Size(size, size); dc.opaque = false; dc.respectScreenScale = true;
  const c = size / 2, r = c - line / 2 - 1;
  const arc = (from, to, col) => {
    const p = new Path(); const steps = Math.max(2, Math.ceil((to - from) * 120));
    for (let i = 0; i <= steps; i++) {
      const a = -Math.PI / 2 + 2 * Math.PI * (from + (to - from) * (i / steps));
      const pt = new Point(c + r * Math.cos(a), c + r * Math.sin(a));
      if (i === 0) p.move(pt); else p.addLine(pt);
    }
    dc.addPath(p); dc.setStrokeColor(col); dc.setLineWidth(line); dc.strokePath();
  };
  arc(0, 1, track);
  if (pct > 0.003) {
    arc(0, Math.min(1, pct), color);
    const end = -Math.PI / 2 + 2 * Math.PI * Math.min(1, pct);
    dc.setFillColor(color);
    [[c, c - r], [c + r * Math.cos(end), c + r * Math.sin(end)]].forEach(([x, y]) =>
      dc.fillEllipse(new Rect(x - line / 2, y - line / 2, line, line)));
  }
  return dc.getImage();
}
function bar(pct, w, h, color, track) {
  const dc = new DrawContext();
  dc.size = new Size(w, h); dc.opaque = false; dc.respectScreenScale = true;
  const pth = (ww) => { const p = new Path(); p.addRoundedRect(new Rect(0, 0, ww, h), h / 2, h / 2); return p; };
  dc.addPath(pth(w)); dc.setFillColor(track); dc.fillPath();
  if (pct > 0) { dc.addPath(pth(Math.max(h, w * Math.min(1, pct)))); dc.setFillColor(color); dc.fillPath(); }
  return dc.getImage();
}

// ── Piezas reutilizables ──
function txt(stack, s, font, color, opts = {}) {
  const t = stack.addText(String(s)); t.font = font; t.textColor = color || WHITE;
  t.lineLimit = opts.lines || 1; t.minimumScaleFactor = opts.min || 0.7;
  return t;
}
async function wordmark(stack, size) {
  const row = stack.addStack(); row.layoutHorizontally(); row.centerAlignContent();
  const lg = await icon("logo");
  if (lg) { const i = row.addImage(lg); i.imageSize = new Size(size + 2, size + 2); i.tintColor = WHITE; row.addSpacer(5); }
  txt(row, "Órbita", F.semi(size), TXT2);
  return row;
}
async function ringBlock(stack, c, size, line) {
  const z = stack.addStack(); z.size = new Size(size, size);
  z.backgroundImage = ring(c.pct, size, line, c.pct >= 1 ? GREEN : T.accent, T.track);
  z.layoutVertically(); z.centerAlignContent(); z.addSpacer();
  const inner = z.addStack(); inner.layoutVertically(); inner.centerAlignContent();
  const r1 = inner.addStack(); r1.addSpacer(); txt(r1, Math.round(c.pct * 100) + "%", F.hero(size * 0.24), WHITE); r1.addSpacer();
  const r2 = inner.addStack(); r2.addSpacer(); txt(r2, c.done + " de " + c.total, F.med(size * 0.1), TXT2); r2.addSpacer();
  z.addSpacer();
  return z;
}
async function stat(stack, key, value, label) {
  const s = stack.addStack(); s.layoutHorizontally(); s.centerAlignContent();
  const im = await icon(key);
  if (im) { const i = s.addImage(im); i.imageSize = new Size(13, 13); i.tintColor = key === "flame" ? GOLD : WHITE; s.addSpacer(4); }
  txt(s, value, F.hero(13), WHITE); s.addSpacer(3); txt(s, label, F.med(11), TXT2);
  return s;
}
async function habitRow(stack, h, compact) {
  const r = stack.addStack(); r.layoutHorizontally(); r.centerAlignContent();
  r.backgroundColor = T.glass; r.cornerRadius = compact ? 10 : 12;
  r.setPadding(compact ? 5 : 7, 8, compact ? 5 : 7, 10);
  const chip = r.addStack(); chip.size = new Size(compact ? 20 : 24, compact ? 20 : 24);
  chip.cornerRadius = compact ? 6 : 7; chip.backgroundColor = new Color("#FFFFFF", 0.16); chip.centerAlignContent();
  const im = await icon(h.id);
  if (im) { const i = chip.addImage(im); i.imageSize = new Size(compact ? 13 : 15, compact ? 13 : 15); i.tintColor = WHITE; }
  r.addSpacer(8);
  txt(r, h.n, F.semi(compact ? 12 : 13), WHITE);
  r.addSpacer();
  return r;
}
function bg(w) {
  const g = new LinearGradient();
  g.colors = T.grad.map((x) => new Color(x)); g.locations = [0, 0.55, 1];
  g.startPoint = new Point(0, 0); g.endPoint = new Point(1, 1);
  w.backgroundGradient = g;
}

// ── Tamaños ──
async function small(w, c) {
  w.setPadding(12, 12, 12, 12);
  await wordmark(w, 11);
  w.addSpacer();
  const r = w.addStack(); r.addSpacer(); await ringBlock(r, c, 78, 8); r.addSpacer();
  w.addSpacer();
  const b = w.addStack(); b.layoutHorizontally(); b.centerAlignContent();
  await stat(b, "flame", c.streak, "días"); b.addSpacer(); txt(b, "+" + c.xpDay + " XP", F.hero(12), GOLD);
}

async function medium(w, c) {
  w.setPadding(14, 14, 14, 14);
  const main = w.addStack(); main.layoutHorizontally();
  const L = main.addStack(); L.layoutVertically(); L.size = new Size(112, 0);
  await wordmark(L, 11); L.addSpacer(8);
  await ringBlock(L, c, 84, 8); L.addSpacer(8);
  const sr = L.addStack(); sr.layoutHorizontally(); await stat(sr, "flame", c.streak, "días"); sr.addSpacer(8); txt(sr, "+" + c.xpDay, F.hero(12), GOLD);
  main.addSpacer(12);
  const R = main.addStack(); R.layoutVertically();
  txt(R, c.pending.length ? "Siguiente" : "Día completo", F.semi(12), TXT2); R.addSpacer(6);
  if (!c.pending.length) {
    const ok = R.addStack(); ok.backgroundColor = T.glass; ok.cornerRadius = 12; ok.setPadding(10, 10, 10, 10);
    txt(ok, "Cumpliste todos tus hábitos de hoy.", F.semi(13), WHITE, { lines: 2 });
  } else {
    for (const h of c.pending.slice(0, 3)) { await habitRow(R, h, true); R.addSpacer(5); }
    if (c.pending.length > 3) txt(R, "+" + (c.pending.length - 3) + " más pendientes", F.med(10), TXT3);
  }
  R.addSpacer();
}

async function large(w, c) {
  w.setPadding(16, 16, 16, 16);
  const head = w.addStack(); head.layoutHorizontally(); head.centerAlignContent();
  await wordmark(head, 12); head.addSpacer();
  txt(head, IS_NIGHT ? "Cierre del día" : "Hola, " + c.name, F.med(12), TXT2);
  w.addSpacer(12);
  const top = w.addStack(); top.layoutHorizontally(); top.centerAlignContent();
  await ringBlock(top, c, 104, 10); top.addSpacer(16);
  const st = top.addStack(); st.layoutVertically();
  await stat(st, "flame", c.streak, "días de racha"); st.addSpacer(6);
  await stat(st, "spark", "+" + c.xpDay, "XP hoy"); st.addSpacer(10);
  for (const b of c.blocks) {
    const r = st.addStack(); r.layoutHorizontally(); r.centerAlignContent();
    const l = r.addStack(); l.size = new Size(74, 0); txt(l, b.name, F.med(10), TXT2);
    const bi = r.addImage(bar(b.total ? b.done / b.total : 0, 70, 5, b.total && b.done === b.total ? GREEN : WHITE, T.track));
    bi.imageSize = new Size(70, 5);
    r.addSpacer(6); txt(r, b.done + "/" + b.total, F.semi(10), TXT2);
    st.addSpacer(4);
  }
  w.addSpacer(14);
  txt(w, c.pending.length ? "Siguiente" : "Día completo", F.semi(12), TXT2); w.addSpacer(6);
  if (!c.pending.length) {
    const ok = w.addStack(); ok.backgroundColor = T.glass; ok.cornerRadius = 12; ok.setPadding(10, 12, 10, 12);
    txt(ok, "Cumpliste todos tus hábitos de hoy.", F.semi(13), WHITE);
  } else {
    for (const h of c.pending.slice(0, 4)) { await habitRow(w, h, false); w.addSpacer(5); }
  }
  w.addSpacer();
  if (c.budget) {
    const bx = w.addStack(); bx.layoutVertically(); bx.backgroundColor = T.glass; bx.cornerRadius = 12; bx.setPadding(8, 12, 9, 12);
    const r = bx.addStack(); r.layoutHorizontally(); r.centerAlignContent();
    const mi = await icon("money"); if (mi) { const i = r.addImage(mi); i.imageSize = new Size(13, 13); i.tintColor = WHITE; r.addSpacer(6); }
    txt(r, c.budget.name, F.semi(12), WHITE); r.addSpacer();
    const left = Math.max(0, c.budget.max - c.budget.spent);
    txt(r, k(left) + " de " + k(c.budget.max), F.semi(12), TXT2);
    bx.addSpacer(6);
    const p = c.budget.spent / c.budget.max;
    const bi = bx.addImage(bar(p, 290, 5, p >= 1 ? new Color("#FF453A") : p >= 0.75 ? new Color("#FF9F0A") : GOLD, T.track));
    bi.imageSize = new Size(290, 5);
  }
}

// ── Pantalla de bloqueo ──
async function lockCircular(w, c) {
  w.addAccessoryWidgetBackground = true;
  const z = w.addStack(); z.size = new Size(60, 60);
  z.backgroundImage = ring(c.pct, 60, 5, WHITE, new Color("#FFFFFF", 0.3));
  z.layoutVertically(); z.centerAlignContent(); z.addSpacer();
  const r = z.addStack(); r.addSpacer(); txt(r, c.done + "/" + c.total, F.hero(13), WHITE); r.addSpacer();
  z.addSpacer();
}
async function lockRect(w, c) {
  const r = w.addStack(); r.layoutHorizontally(); r.centerAlignContent();
  const lg = await icon("logo"); if (lg) { const i = r.addImage(lg); i.imageSize = new Size(12, 12); i.tintColor = WHITE; r.addSpacer(4); }
  txt(r, "Órbita · " + Math.round(c.pct * 100) + "%", F.semi(12), WHITE);
  w.addSpacer(2);
  const bi = w.addImage(bar(c.pct, 140, 4, WHITE, new Color("#FFFFFF", 0.3))); bi.imageSize = new Size(140, 4);
  w.addSpacer(2);
  txt(w, c.pending.length ? "Sigue: " + c.pending[0].n : "Día completo", F.med(11), WHITE);
}

// ── Main ──
const data = await loadData();
const c = compute(data);
const fam = config.widgetFamily || "medium";
const w = new ListWidget();
w.url = TAP_URL;
w.refreshAfterDate = new Date(Date.now() + 15 * 60000);

if (fam === "accessoryCircular") await lockCircular(w, c);
else if (fam === "accessoryRectangular") await lockRect(w, c);
else if (fam === "accessoryInline") { txt(w, "Órbita " + c.done + "/" + c.total + " · racha " + c.streak, F.semi(12), WHITE); }
else {
  bg(w);
  if (!data.configured) {
    w.setPadding(14, 14, 14, 14);
    await wordmark(w, 12); w.addSpacer(8);
    txt(w, "Pega tu anon key de Supabase al inicio del script.", F.semi(13), WHITE, { lines: 3 });
  } else if (fam === "small") await small(w, c);
  else if (fam === "large") await large(w, c);
  else await medium(w, c);
  if (data.configured && data.offline && data.at) {
    // marca discreta si los datos vienen de caché
    w.addSpacer(2);
    const o = w.addStack(); o.addSpacer(); txt(o, "sin conexión", F.reg(8), TXT3);
  }
}

if (config.runsInWidget) Script.setWidget(w);
else {
  const pick = new Alert();
  pick.title = "Vista previa"; ["Pequeño", "Mediano", "Grande"].forEach((x) => pick.addAction(x));
  const i = await pick.presentSheet();
  if (i === 0) { const s = new ListWidget(); s.url = TAP_URL; bg(s); await small(s, c); await s.presentSmall(); }
  else if (i === 2) { const s = new ListWidget(); s.url = TAP_URL; bg(s); await large(s, c); await s.presentLarge(); }
  else await w.presentMedium();
}
Script.complete();
