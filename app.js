// El sitio funciona con datos de demostración hasta que conectes Google Sheets.
const SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbznlRbDULUHugxsXr2Een8UyXq4pIMHQyTlyFYnx2Wl0EVVFyW1_952fQbKWsYEKHuTTA/exec"; // Conexión con Google Sheets

const demoActivities = [
  {titulo:"Armamos palabras", area:"Prácticas del Lenguaje", contenido:"Lectura y escritura", tipo:"Wordwall", enlace:"https://wordwall.net/es", descripcion:"Jugá con letras, sonidos y palabras.", icono:"🔤", destacado:"Sí", activo:"Sí"},
  {titulo:"Leemos y descubrimos", area:"Prácticas del Lenguaje", contenido:"Comprensión lectora", tipo:"Actividad", enlace:"https://wordwall.net/es", descripcion:"Leé con atención y resolvé el desafío.", icono:"📖", destacado:"Sí", activo:"Sí"},
  {titulo:"Llegamos al 100", area:"Matemática", contenido:"Numeración", tipo:"Juego", enlace:"https://wordwall.net/es", descripcion:"Contá, compará y explorá los números.", icono:"🔢", destacado:"Sí", activo:"Sí"},
  {titulo:"La fábrica de cálculos", area:"Matemática", contenido:"Sumas y restas", tipo:"Educaplay", enlace:"https://www.educaplay.com/", descripcion:"Pensá estrategias para resolver cálculos.", icono:"🧮", destacado:"No", activo:"Sí"},
  {titulo:"Un cuento para imaginar", area:"Literatura", contenido:"Cuentos", tipo:"Lectura", enlace:"https://www.educ.ar/", descripcion:"Prepará tus oídos y dejá volar la imaginación.", icono:"📚", destacado:"Sí", activo:"Sí"},
  {titulo:"Personajes en acción", area:"Literatura", contenido:"Personajes y escenarios", tipo:"Desafío", enlace:"https://www.educ.ar/", descripcion:"Recordá quiénes aparecen y dónde sucede la historia.", icono:"🦊", destacado:"No", activo:"Sí"}
];

const colors = {
  "Prácticas del Lenguaje": ["#25866e","#e8f5ed","🔤"],
  "Matemática": ["#ee9638","#fff0dc","🔢"],
  "Literatura": ["#70bad8","#e7f6fb","📚"],
  "Desafíos semanales": ["#8b83cf","#f0effc","⭐"]
};
let allActivities = [];
let currentFilter = "Todas";

const grid = document.getElementById("activityGrid");
const statusMessage = document.getElementById("statusMessage");
const count = document.getElementById("activityCount");
const searchInput = document.getElementById("searchInput");
const emptyState = document.getElementById("emptyState");

function isYes(value) {
  return ["sí","si","yes","true","1","x"].includes(String(value ?? "").trim().toLowerCase());
}
function normalizeActivity(row) {
  return {
    titulo: String(row.titulo || row.Título || row.title || "").trim(),
    area: String(row.area || row.Área || row.Area || "").trim(),
    contenido: String(row.contenido || row.Contenido || "").trim(),
    tipo: String(row.tipo || row.Tipo || "Actividad").trim(),
    enlace: String(row.enlace || row.Enlace || row.url || row.URL || "").trim(),
    descripcion: String(row.descripcion || row.Descripción || row.Descripcion || "").trim(),
    icono: String(row.icono || row.Icono || "").trim(),
    destacado: row.destacado ?? row.Destacado ?? "",
    activo: row.activo ?? row.Activo ?? "Sí"
  };
}
function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["https:","http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}
function createCard(item) {
  const palette = colors[item.area] || colors["Desafíos semanales"];
  const card = document.createElement("article");
  card.className = "activity-card";
  card.style.setProperty("--card-color", palette[0]);
  card.style.setProperty("--card-tint", palette[1]);

  const top = document.createElement("div"); top.className = "card-top";
  const body = document.createElement("div"); body.className = "card-body";
  const meta = document.createElement("div"); meta.className = "card-meta";
  const icon = document.createElement("span"); icon.className = "card-icon"; icon.textContent = item.icono || palette[2];
  const area = document.createElement("span"); area.className = "card-area"; area.textContent = item.area;
  const type = document.createElement("span"); type.className = "card-type"; type.textContent = item.tipo;
  meta.append(icon, area, type);
  const title = document.createElement("h3"); title.textContent = item.titulo;
  const desc = document.createElement("p"); desc.textContent = item.descripcion || item.contenido || "¡Entrá y descubrí esta actividad!";
  const footer = document.createElement("div"); footer.className = "card-footer";
  const tag = document.createElement("span"); tag.className = "tag"; tag.textContent = item.contenido || "¡A practicar!";
  const link = document.createElement("a"); link.className = "open-activity"; link.textContent = item.area === "Literatura" ? "¡A LEER! ↗" : "IR A JUGAR ↗";
  link.href = safeUrl(item.enlace) || "#";
  link.target = "_blank"; link.rel = "noopener noreferrer";
  if (!safeUrl(item.enlace)) { link.removeAttribute("target"); link.textContent = "ENLACE PENDIENTE"; link.setAttribute("aria-disabled","true"); link.style.opacity=".65"; }
  footer.append(tag,link); body.append(meta,title,desc,footer); card.append(top,body);
  return card;
}
function render() {
  const term = searchInput.value.trim().toLocaleLowerCase("es");
  const visible = allActivities.filter(item => {
    const areaMatches = currentFilter === "Todas" || item.area === currentFilter;
    const haystack = [item.titulo,item.area,item.contenido,item.tipo,item.descripcion].join(" ").toLocaleLowerCase("es");
    return areaMatches && haystack.includes(term);
  });
  grid.replaceChildren(...visible.map(createCard));
  count.textContent = `${visible.length} ${visible.length === 1 ? "ACTIVIDAD" : "ACTIVIDADES"}`;
  emptyState.hidden = visible.length > 0;
}
async function loadActivities() {
  if (!SHEETS_API_URL) {
    allActivities = demoActivities.map(normalizeActivity).filter(item => item.titulo && !["no","false","0"].includes(String(item.activo).trim().toLowerCase()));
    statusMessage.textContent = "Vista inicial de ejemplo: reemplazá estos enlaces por tus recursos y conectá la planilla para publicar tu catálogo.";
    render();
    return;
  }
  try {
    const response = await fetch(SHEETS_API_URL, {cache:"no-store"});
    if (!response.ok) throw new Error("No se pudo leer el catálogo");
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Formato de catálogo inesperado");
    allActivities = data.map(normalizeActivity).filter(item => item.titulo && !["no","false","0"].includes(String(item.activo).trim().toLowerCase()));
    statusMessage.textContent = allActivities.length ? "¡Elegí una actividad y empezá a explorar!" : "Pronto vamos a sumar nuevas actividades.";
    render();
  } catch (error) {
    allActivities = demoActivities.map(normalizeActivity);
    statusMessage.textContent = "No pudimos cargar la planilla todavía. Mostramos actividades de ejemplo mientras se revisa la conexión.";
    render();
    console.error(error);
  }
}
document.querySelectorAll(".filter-button").forEach(button => button.addEventListener("click", () => {
  currentFilter = button.dataset.filter;
  document.querySelectorAll(".filter-button").forEach(b => b.classList.toggle("active", b === button));
  render();
}));
document.querySelectorAll("[data-jump]").forEach(link => link.addEventListener("click", () => {
  currentFilter = link.dataset.jump;
  document.querySelectorAll(".filter-button").forEach(b => b.classList.toggle("active", b.dataset.filter === currentFilter));
  render();
}));
searchInput.addEventListener("input", render);
document.getElementById("backToTop").addEventListener("click", event => {
  event.preventDefault(); window.scrollTo({top:0,behavior:"smooth"});
});
loadActivities();
