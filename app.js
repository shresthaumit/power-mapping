const LABELS = ["Funding / Resources", "Decision-Making", "Knowledge / Expertise", "Implementation"];

const GROUPS = {
  "1": {
    title: "Group 1 — Funding and agenda-setting",
    subtitle: "Scenario: Maternal Health Initiative",
    scenario: "A large U.S.-based foundation provides $20 million for a maternal health initiative in a lower-income country. The foundation identifies maternal mortality as the funding priority and requires the program to focus primarily on improving facility-based maternity care. The country's Ministry of Health accepts the funding and works with an international NGO to manage the program. A local NGO and community health workers carry out much of the community-level work. Local women's groups participate in program activities but were not involved in selecting the funding priority or designing the program. The foundation requires annual results and retains approval over major changes to the program.",
    actors: ["U.S.-based Foundation", "Ministry of Health", "International NGO", "Local NGO", "Community Health Workers", "Local Women's Groups"]
  },
  "2": {
    title: "Group 2 — Research and knowledge production",
    subtitle: "Scenario: Infectious Disease Research Project",
    scenario: "A U.S. university receives a $5 million research grant to study an infectious disease in a lower-income country. Researchers at the U.S. university developed the research questions and study design and serve as the principal investigators. A local university helps adapt the study, recruits and supervises local research staff, and coordinates data collection. Local health workers help recruit participants and explain the study to communities. Community members provide biological samples, survey responses, and other study data. The U.S. university manages the grant and stores the final research dataset. Researchers from both universities contribute to publications, but the U.S. research team has final authority over the analysis and publication plan.",
    actors: ["Research Funder", "U.S. University/Researchers", "Local University/Researchers", "Ministry of Health", "Local Health Workers", "Community/Research Participants"]
  },
  "3": {
    title: "Group 3 — Global policy and local implementation",
    subtitle: "Scenario: National Vaccination Program",
    scenario: "An international health organization recommends that a lower-income country launch a nationwide vaccination campaign in response to increasing cases of a preventable infectious disease. A donor government provides most of the funding but requires the money to be used specifically for vaccination. The country's Ministry of Health agrees to participate and establishes national targets based partly on the international organization's recommendations. An international NGO receives funding to provide technical and logistical support. District health offices and frontline health workers are responsible for implementing the campaign. Community leaders are asked to encourage vaccination and address concerns among residents, but they were not involved in establishing the national targets or designing the campaign.",
    actors: ["Donor Government", "International Health Organization", "Ministry of Health", "International NGO", "District Health Offices/Frontline Health Workers", "Community Leaders/Community Members"]
  }
};

const ZONE_INFO = [
  { key: "high", name: "High power", desc: "Substantial control over priorities, resources, or major decisions." },
  { key: "moderate", name: "Moderate power", desc: "Meaningful influence but limited control over major decisions." },
  { key: "limited", name: "Limited power", desc: "Little control over major decisions, even if the actor plays an important role." }
];

const params = new URLSearchParams(location.search);
const groupId = params.get("g") || "1";
const group = GROUPS[groupId] || GROUPS["1"];

let state = {
  zones: {},
  arrows: [],
  imbalanceKey: "",
  imbalanceWhy: "",
  redesignGains: "",
  redesignGives: "",
  redesignChanges: ""
};

const incomingData = params.get("data");
if (incomingData) {
  try {
    const decoded = JSON.parse(decodeURIComponent(escape(atob(incomingData))));
    if (decoded && typeof decoded === "object") Object.assign(state, decoded);
  } catch (e) { /* ignore malformed data */ }
}

let selectedForConnect = null;
let armedForPlacement = null;

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else node.setAttribute(k, v);
  });
  (children || []).forEach(c => node.appendChild(c));
  return node;
}

function cssEscape(s) { return s.replace(/["\\]/g, "\\$&"); }

function init() {
  document.getElementById("groupTitle").textContent = group.title;
  document.getElementById("groupSubtitle").textContent = group.subtitle;
  document.getElementById("scenarioText").textContent = group.scenario;
  const actorList = document.getElementById("actorList");
  group.actors.forEach(a => actorList.appendChild(el("span", { text: a })));

  const zonesEl = document.getElementById("zones");
  ZONE_INFO.forEach(z => {
    const dropZone = el("div", { class: "drop", "data-zone": z.key });
    const zoneEl = el("div", { class: "zone " + z.key }, [
      el("h3", { text: z.name }),
      el("div", { class: "desc", text: z.desc }),
      dropZone
    ]);
    zonesEl.appendChild(zoneEl);
    dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("dragover"); });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
    dropZone.addEventListener("drop", e => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      const name = e.dataTransfer.getData("text/plain");
      if (name) placeActor(name, z.key);
    });
    dropZone.addEventListener("click", () => {
      if (armedForPlacement) {
        placeActor(armedForPlacement, z.key);
        armedForPlacement = null;
        renderPool();
      }
    });
  });

  const pool = document.getElementById("pool");
  pool.addEventListener("dragover", e => e.preventDefault());
  pool.addEventListener("drop", e => {
    e.preventDefault();
    const name = e.dataTransfer.getData("text/plain");
    if (name) unplaceActor(name);
  });

  renderPool();
  renderZones();
  drawArrows();
  buildAnalyzeSelect();
  updateStepIndicator();

  document.getElementById("resetBtn").addEventListener("click", resetAll);
  document.getElementById("undoArrowBtn").addEventListener("click", () => { state.arrows.pop(); drawArrows(); buildAnalyzeSelect(); updateStepIndicator(); });
  document.getElementById("shareBtn").addEventListener("click", generateShareLink);
  document.getElementById("copyLinkBtn").addEventListener("click", copyShareLink);

  document.getElementById("relationshipSelect").addEventListener("change", e => {
    state.imbalanceKey = e.target.value;
    highlightSelectedRelationship();
    updateStepIndicator();
  });

  const whyField = document.getElementById("imbalanceWhy");
  whyField.value = state.imbalanceWhy || "";
  whyField.addEventListener("input", e => { state.imbalanceWhy = e.target.value; updateStepIndicator(); });

  ["redesignGains", "redesignGives", "redesignChanges"].forEach(id => {
    const field = document.getElementById(id);
    field.value = state[id] || "";
    field.addEventListener("input", e => { state[id] = e.target.value; updateStepIndicator(); });
  });

  window.addEventListener("resize", drawArrows);
}

function makeChip(name, placed) {
  const chip = el("div", { class: "chip", draggable: "true", "data-name": name, text: name });
  chip.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", name));
  chip.addEventListener("click", () => {
    if (placed) onPlacedChipClick(chip, name);
    else onPoolChipClick(chip, name);
  });
  return chip;
}

function onPoolChipClick(chip, name) {
  document.querySelectorAll("#pool .chip").forEach(c => c.classList.remove("selected"));
  if (armedForPlacement === name) { armedForPlacement = null; return; }
  armedForPlacement = name;
  chip.classList.add("selected");
}

function onPlacedChipClick(chip, name) {
  if (!selectedForConnect) {
    selectedForConnect = name;
    chip.classList.add("selected");
    return;
  }
  if (selectedForConnect === name) {
    chip.classList.remove("selected");
    selectedForConnect = null;
    return;
  }
  openLabelPanel(selectedForConnect, name, chip);
}

function openLabelPanel(from, to, anchorChip) {
  document.querySelectorAll(".label-panel").forEach(p => p.remove());
  const rect = anchorChip.getBoundingClientRect();
  const panel = el("div", { class: "label-panel" });
  panel.style.left = Math.min(window.scrollX + rect.left, window.scrollX + document.body.clientWidth - 240) + "px";
  panel.style.top = (window.scrollY + rect.bottom + 8) + "px";
  panel.appendChild(el("div", { text: from + " → " + to, style: "font-size:13px;margin-bottom:6px;" }));
  const select = el("select");
  LABELS.forEach(l => select.appendChild(el("option", { value: l, text: l })));
  panel.appendChild(select);
  const confirmBtn = el("button", { class: "primary", text: "Add arrow" });
  const cancelBtn = el("button", { text: "Cancel" });
  const row = el("div", { style: "display:flex;gap:8px;" }, [confirmBtn, cancelBtn]);
  panel.appendChild(row);
  document.body.appendChild(panel);

  confirmBtn.addEventListener("click", () => {
    state.arrows.push({ from, to, label: select.value });
    panel.remove();
    clearConnectSelection();
    drawArrows();
    buildAnalyzeSelect();
    updateStepIndicator();
  });
  cancelBtn.addEventListener("click", () => {
    panel.remove();
    clearConnectSelection();
  });
}

function clearConnectSelection() {
  selectedForConnect = null;
  document.querySelectorAll(".zone .chip").forEach(c => c.classList.remove("selected"));
}

function placeActor(name, zoneKey) {
  state.zones[name] = zoneKey;
  renderPool();
  renderZones();
  drawArrows();
  buildAnalyzeSelect();
  updateStepIndicator();
}

function unplaceActor(name) {
  delete state.zones[name];
  state.arrows = state.arrows.filter(a => a.from !== name && a.to !== name);
  renderPool();
  renderZones();
  drawArrows();
  buildAnalyzeSelect();
  updateStepIndicator();
}

function renderPool() {
  const pool = document.getElementById("pool");
  pool.innerHTML = "";
  group.actors.filter(a => !state.zones[a]).forEach(a => pool.appendChild(makeChip(a, false)));
}

function renderZones() {
  document.querySelectorAll(".drop").forEach(d => (d.innerHTML = ""));
  group.actors.filter(a => state.zones[a]).forEach(a => {
    const zoneKey = state.zones[a];
    const drop = document.querySelector('.drop[data-zone="' + zoneKey + '"]');
    if (drop) drop.appendChild(makeChip(a, true));
  });
}

function pairKey(a, b) { return [a, b].slice().sort().join("|||"); }

function drawArrows() {
  const layer = document.getElementById("arrowLayer");
  const board = document.getElementById("board");
  const boardRect = board.getBoundingClientRect();
  layer.innerHTML = '<defs><marker id="ah" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#55534c"/></marker></defs>';
  state.arrows = state.arrows.filter(a => state.zones[a.from] && state.zones[a.to]);

  const groups = {};
  state.arrows.forEach((a, idx) => {
    const k = pairKey(a.from, a.to);
    if (!groups[k]) groups[k] = [];
    groups[k].push(idx);
  });

  state.arrows.forEach((a, idx) => {
    const fromEl = document.querySelector('.zone .chip[data-name="' + cssEscape(a.from) + '"]');
    const toEl = document.querySelector('.zone .chip[data-name="' + cssEscape(a.to) + '"]');
    if (!fromEl || !toEl) return;
    const fr = fromEl.getBoundingClientRect();
    const tr = toEl.getBoundingClientRect();
    const c1x = fr.left + fr.width / 2 - boardRect.left;
    const c1y = fr.top + fr.height / 2 - boardRect.top;
    const c2x = tr.left + tr.width / 2 - boardRect.left;
    const c2y = tr.top + tr.height / 2 - boardRect.top;

    const k = pairKey(a.from, a.to);
    const siblings = groups[k];
    const posInGroup = siblings.indexOf(idx);
    const count = siblings.length;
    const curveOffset = (posInGroup - (count - 1) / 2) * 30;

    const p1 = clipToEdge(c1x, c1y, fr.width, fr.height, c2x, c2y);
    const p2 = clipToEdge(c2x, c2y, tr.width, tr.height, c1x, c1y);
    const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;

    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const cx = (x1 + x2) / 2 + nx * curveOffset;
    const cy = (y1 + y2) / 2 + ny * curveOffset;

    const zr1 = zoneRank(state.zones[a.from]);
    const zr2 = zoneRank(state.zones[a.to]);
    let color = "#8a877d";
    if (zr1 < zr2) color = "#2c2a4a";
    else if (zr1 > zr2) color = "#a8672f";

    const isHighlighted = state.imbalanceKey === (a.from + "|||" + a.to + "|||" + a.label);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = count === 1
      ? "M " + x1 + " " + y1 + " L " + x2 + " " + y2
      : "M " + x1 + " " + y1 + " Q " + cx + " " + cy + " " + x2 + " " + y2;
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", isHighlighted ? "#b5432f" : color);
    path.setAttribute("stroke-width", isHighlighted ? "3" : "1.6");
    path.setAttribute("marker-end", "url(#ah)");
    path.style.pointerEvents = "stroke";
    path.style.cursor = "pointer";
    path.addEventListener("click", () => { state.arrows.splice(idx, 1); drawArrows(); buildAnalyzeSelect(); updateStepIndicator(); });
    layer.appendChild(path);

    const t = 0.5;
    const mt = 1 - t;
    const labelX = count === 1 ? (x1 + x2) / 2 : (mt * mt * x1 + 2 * mt * t * cx + t * t * x2);
    const labelY = count === 1 ? (y1 + y2) / 2 : (mt * mt * y1 + 2 * mt * t * cy + t * t * y2);
    const finalLabelX = labelX + nx * 10;
    const finalLabelY = labelY + ny * 10 - 2;

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", finalLabelX); text.setAttribute("y", finalLabelY);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "11");
    text.setAttribute("fill", "#201f1c");
    text.textContent = a.label;
    layer.appendChild(text);
    const bbox = tryBBox(text);
    if (bbox) {
      const labelBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      labelBg.setAttribute("x", bbox.x - 4);
      labelBg.setAttribute("y", bbox.y - 2);
      labelBg.setAttribute("width", bbox.width + 8);
      labelBg.setAttribute("height", bbox.height + 4);
      labelBg.setAttribute("rx", "3");
      labelBg.setAttribute("fill", "#fffefb");
      labelBg.setAttribute("stroke", isHighlighted ? "#b5432f" : "#ddd8c8");
      labelBg.setAttribute("stroke-width", isHighlighted ? "1.2" : "0.5");
      layer.insertBefore(labelBg, text);
    }
  });
}

function clipToEdge(cx, cy, w, h, tx, ty) {
  const dx = tx - cx, dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const halfW = w / 2 + 4, halfH = h / 2 + 4;
  const scaleX = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);
  return { x: cx + dx * scale, y: cy + dy * scale };
}

function tryBBox(node) { try { return node.getBBox(); } catch (e) { return null; } }
function zoneRank(z) { return { high: 0, moderate: 1, limited: 2 }[z]; }

function buildAnalyzeSelect() {
  const select = document.getElementById("relationshipSelect");
  const current = state.imbalanceKey;
  select.innerHTML = '<option value="">Choose a relationship from your map…</option>';
  state.arrows.forEach(a => {
    const key = a.from + "|||" + a.to + "|||" + a.label;
    const label = a.from + " → " + a.to + "  (" + a.label + ")";
    select.appendChild(el("option", { value: key, text: label }));
  });
  const stillExists = state.arrows.some(a => (a.from + "|||" + a.to + "|||" + a.label) === current);
  select.value = stillExists ? current : "";
  if (!stillExists) state.imbalanceKey = "";
}

function highlightSelectedRelationship() { drawArrows(); }

function resetAll() {
  state = { zones: {}, arrows: [], imbalanceKey: "", imbalanceWhy: "", redesignGains: "", redesignGives: "", redesignChanges: "" };
  document.getElementById("imbalanceWhy").value = "";
  ["redesignGains", "redesignGives", "redesignChanges"].forEach(id => (document.getElementById(id).value = ""));
  renderPool();
  renderZones();
  drawArrows();
  buildAnalyzeSelect();
  updateStepIndicator();
}

function updateStepIndicator() {
  const placedCount = Object.keys(state.zones).length;
  const totalActors = group.actors.length;
  const hasArrows = state.arrows.length > 0;
  const hasAnalysis = !!(state.imbalanceKey && state.imbalanceWhy && state.imbalanceWhy.trim());
  const hasRedesign = !!(state.redesignGains.trim() || state.redesignGives.trim() || state.redesignChanges.trim());

  const steps = ["bcPosition", "bcConnect", "bcLabel", "bcAnalyze", "bcRedesign"];
  const doneFlags = [
    placedCount >= totalActors,
    hasArrows,
    hasArrows,
    hasAnalysis,
    hasRedesign
  ];

  let currentIdx = doneFlags.findIndex(f => !f);
  if (currentIdx === -1) currentIdx = steps.length - 1;

  steps.forEach((id, i) => {
    const node = document.getElementById(id);
    node.classList.remove("done", "current");
    if (doneFlags[i] && i !== currentIdx) node.classList.add("done");
    if (i === currentIdx) node.classList.add("current");
  });
}

function generateShareLink() {
  const payload = { g: groupId, ...state };
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  const url = location.origin + location.pathname + "?g=" + groupId + "&data=" + encodeURIComponent(encoded);
  const box = document.getElementById("shareBox");
  const textarea = document.getElementById("shareLink");
  textarea.value = url;
  box.style.display = "block";
  const mailBtn = document.getElementById("emailLinkBtn");
  mailBtn.href = "mailto:?subject=" + encodeURIComponent(group.title + " — finished power map") + "&body=" + encodeURIComponent("Here is our finished power map: " + url);
}

function copyShareLink() {
  const textarea = document.getElementById("shareLink");
  textarea.select();
  document.execCommand("copy");
  const btn = document.getElementById("copyLinkBtn");
  const original = btn.textContent;
  btn.textContent = "Copied";
  setTimeout(() => (btn.textContent = original), 1500);
}

document.addEventListener("DOMContentLoaded", init);
