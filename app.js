const GROUPS = {
  "1": {
    title: "Group 1 — Funding and agenda-setting",
    subtitle: "Scenario: Maternal Health Initiative",
    scenario: "A large U.S.-based foundation provides $20 million for a maternal health initiative in a lower-income country. The foundation identifies maternal mortality as the funding priority and requires the program to focus primarily on improving facility-based maternity care. The country's Ministry of Health accepts the funding and works with an international NGO to manage the program. A local NGO and community health workers carry out much of the community-level work. Local women's groups participate in program activities but were not involved in selecting the funding priority or designing the program. The foundation requires annual results and retains approval over major changes to the program.",
    actors: ["U.S.-based Foundation", "Ministry of Health", "International NGO", "Local NGO", "Community Health Workers", "Local Women's Groups"],
    labels: ["Funding", "Decision-Making", "Program Design", "Implementation", "Accountability"]
  },
  "2": {
    title: "Group 2 — Research and knowledge production",
    subtitle: "Scenario: Infectious Disease Research Project",
    scenario: "A U.S. university receives a $5 million research grant to study an infectious disease in a lower-income country. Researchers at the U.S. university developed the research questions and study design and serve as the principal investigators. A local university helps adapt the study, recruits and supervises local research staff, and coordinates data collection. Local health workers help recruit participants and explain the study to communities. Community members provide biological samples, survey responses, and other study data. The U.S. university manages the grant and stores the final research dataset. Researchers from both universities contribute to publications, but the U.S. research team has final authority over the analysis and publication plan.",
    actors: ["Research Funder", "U.S. University/Researchers", "Local University/Researchers", "Ministry of Health", "Local Health Workers", "Community/Research Participants"],
    labels: ["Funding", "Decision-Making", "Knowledge/Data", "Implementation", "Accountability"]
  },
  "3": {
    title: "Group 3 — Global policy and local implementation",
    subtitle: "Scenario: National Vaccination Program",
    scenario: "An international health organization recommends that a lower-income country launch a nationwide vaccination campaign in response to increasing cases of a preventable infectious disease. A donor government provides most of the funding but requires the money to be used specifically for vaccination. The country's Ministry of Health agrees to participate and establishes national targets based partly on the international organization's recommendations. An international NGO receives funding to provide technical and logistical support. District health offices and frontline health workers are responsible for implementing the campaign. Community leaders are asked to encourage vaccination and address concerns among residents, but they were not involved in establishing the national targets or designing the campaign.",
    actors: ["Donor Government", "International Health Organization", "Ministry of Health", "International NGO", "District Health Offices/Frontline Health Workers", "Community Leaders/Community Members"],
    labels: ["Funding", "Decision-Making", "Technical Expertise", "Implementation", "Accountability"]
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
  imbalanceFrom: "",
  imbalanceTo: "",
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

  renderPool();
  renderZones();
  drawArrows();
  buildLabelOptions();
  buildAnalyzeSelects();

  document.getElementById("resetBtn").addEventListener("click", resetAll);
  document.getElementById("undoArrowBtn").addEventListener("click", () => { state.arrows.pop(); drawArrows(); });
  document.getElementById("shareBtn").addEventListener("click", generateShareLink);
  document.getElementById("copyLinkBtn").addEventListener("click", copyShareLink);

  ["imbalanceFrom", "imbalanceTo"].forEach(id => {
    document.getElementById(id).addEventListener("change", e => { state[id] = e.target.value; });
  });
  ["imbalanceWhy", "redesignGains", "redesignGives", "redesignChanges"].forEach(id => {
    const field = document.getElementById(id);
    field.value = state[id] || "";
    field.addEventListener("input", e => { state[id] = e.target.value; });
  });
  document.getElementById("imbalanceFrom").value = state.imbalanceFrom || "";
  document.getElementById("imbalanceTo").value = state.imbalanceTo || "";

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
  group.labels.forEach(l => select.appendChild(el("option", { value: l, text: l })));
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
    if (drop) {
      const chip = makeChip(a, true);
      chip.draggable = true;
      chip.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", a));
      drop.appendChild(chip);
    }
  });
}

function drawArrows() {
  const layer = document.getElementById("arrowLayer");
  const board = document.getElementById("board");
  const boardRect = board.getBoundingClientRect();
  layer.innerHTML = '<defs><marker id="ah" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#55534c"/></marker></defs>';
  state.arrows = state.arrows.filter(a => state.zones[a.from] && state.zones[a.to]);
  state.arrows.forEach((a, idx) => {
    const fromEl = document.querySelector('.zone .chip[data-name="' + cssEscape(a.from) + '"]');
    const toEl = document.querySelector('.zone .chip[data-name="' + cssEscape(a.to) + '"]');
    if (!fromEl || !toEl) return;
    const fr = fromEl.getBoundingClientRect();
    const tr = toEl.getBoundingClientRect();
    const x1 = fr.left + fr.width / 2 - boardRect.left;
    const y1 = fr.top + fr.height / 2 - boardRect.top;
    const x2 = tr.left + tr.width / 2 - boardRect.left;
    const y2 = tr.top + tr.height / 2 - boardRect.top;
    const midx = (x1 + x2) / 2;
    const midy = (y1 + y2) / 2;
    const zr1 = zoneRank(state.zones[a.from]);
    const zr2 = zoneRank(state.zones[a.to]);
    let color = "#8a877d";
    if (zr1 < zr2) color = "#2c2a4a";
    else if (zr1 > zr2) color = "#a8672f";
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1); line.setAttribute("y1", y1);
    line.setAttribute("x2", x2); line.setAttribute("y2", y2);
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", "1.6");
    line.setAttribute("marker-end", "url(#ah)");
    line.style.pointerEvents = "stroke";
    line.style.cursor = "pointer";
    line.addEventListener("click", () => { state.arrows.splice(idx, 1); drawArrows(); });
    layer.appendChild(line);

    const labelBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", midx); text.setAttribute("y", midy);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "11");
    text.setAttribute("fill", "#201f1c");
    text.textContent = a.label;
    layer.appendChild(text);
    const bbox = text.getBBox ? tryBBox(text) : null;
    if (bbox) {
      labelBg.setAttribute("x", bbox.x - 4);
      labelBg.setAttribute("y", bbox.y - 2);
      labelBg.setAttribute("width", bbox.width + 8);
      labelBg.setAttribute("height", bbox.height + 4);
      labelBg.setAttribute("fill", "#f6f3ec");
      layer.insertBefore(labelBg, text);
    }
  });
  buildAnalyzeSelects();
}

function tryBBox(node) {
  try { return node.getBBox(); } catch (e) { return null; }
}

function zoneRank(z) { return { high: 0, moderate: 1, limited: 2 }[z]; }

function cssEscape(s) { return s.replace(/["\\]/g, "\\$&"); }

function buildLabelOptions() {}

function buildAnalyzeSelects() {
  const placed = group.actors.filter(a => state.zones[a]);
  ["imbalanceFrom", "imbalanceTo"].forEach(id => {
    const select = document.getElementById(id);
    const current = state[id];
    select.innerHTML = '<option value="">Choose an actor…</option>';
    placed.forEach(a => select.appendChild(el("option", { value: a, text: a })));
    select.value = current || "";
  });
}

function resetAll() {
  state = { zones: {}, arrows: [], imbalanceFrom: "", imbalanceTo: "", imbalanceWhy: "", redesignGains: "", redesignGives: "", redesignChanges: "" };
  ["imbalanceWhy", "redesignGains", "redesignGives", "redesignChanges"].forEach(id => (document.getElementById(id).value = ""));
  renderPool();
  renderZones();
  drawArrows();
}

function generateShareLink() {
  const payload = { g: groupId, ...state };
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  const url = location.origin + location.pathname + "?g=" + groupId + "&data=" + encoded;
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
