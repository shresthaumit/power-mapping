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

const ZONE_RANK = { high: 0, moderate: 1, limited: 2 };
const ZONE_STROKE = { high: "#2c2a4a", moderate: "#17685c", limited: "#a8672f" };
const ZONE_FILL = { high: "#e4e3ec", moderate: "#dcece8", limited: "#f2e3d0" };

const params = new URLSearchParams(location.search);
const groupId = params.get("g") || "1";
const group = GROUPS[groupId] || GROUPS["1"];

let state = {
  zones: {},
  arrows: [],
  imbalanceFrom: "",
  imbalanceTo: "",
  imbalanceWhy: ""
};

const incomingData = params.get("data");
if (incomingData) {
  try {
    const decoded = JSON.parse(decodeURIComponent(escape(atob(incomingData))));
    if (decoded && typeof decoded === "object") Object.assign(state, decoded);
  } catch (e) { /* ignore malformed data */ }
}

let armedForPlacement = null;
let gNames = [], gPos = {};

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
  buildAnalyzeSelects();

  document.getElementById("resetBtn").addEventListener("click", resetAll);
  document.getElementById("generateBtn").addEventListener("click", onGenerateClick);
  document.getElementById("undoArrowBtn").addEventListener("click", () => { state.arrows.pop(); renderGraph(); buildAnalyzeSelects(); });
  document.getElementById("adjustBtn").addEventListener("click", () => {
    document.getElementById("graphSection").style.display = "none";
    document.querySelector(".block").style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  document.getElementById("shareBtn").addEventListener("click", generateShareLink);
  document.getElementById("copyLinkBtn").addEventListener("click", copyShareLink);

  ["imbalanceFrom", "imbalanceTo"].forEach(id => {
    document.getElementById(id).addEventListener("change", e => { state[id] = e.target.value; });
  });
  const whyField = document.getElementById("imbalanceWhy");
  whyField.value = state.imbalanceWhy || "";
  whyField.addEventListener("input", e => { state.imbalanceWhy = e.target.value; });

  attachDrawing();

  const placedCount = Object.keys(state.zones).length;
  if (placedCount >= 2) {
    document.querySelector(".wrap .block").style.display = "block";
    generateGraph();
    document.getElementById("graphSection").style.display = "block";
  }

  window.addEventListener("resize", renderGraph);
}

function makeChip(name) {
  const chip = el("div", { class: "chip", draggable: "true", "data-name": name, text: name });
  chip.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", name));
  chip.addEventListener("click", () => {
    document.querySelectorAll("#pool .chip").forEach(c => c.classList.remove("selected"));
    if (armedForPlacement === name) { armedForPlacement = null; return; }
    armedForPlacement = name;
    chip.classList.add("selected");
  });
  return chip;
}

function placeActor(name, zoneKey) {
  state.zones[name] = zoneKey;
  renderPool();
  renderZones();
  buildAnalyzeSelects();
}

function unplaceActor(name) {
  delete state.zones[name];
  state.arrows = state.arrows.filter(a => a.from !== name && a.to !== name);
  renderPool();
  renderZones();
  buildAnalyzeSelects();
}

function renderPool() {
  const pool = document.getElementById("pool");
  pool.innerHTML = "";
  group.actors.filter(a => !state.zones[a]).forEach(a => pool.appendChild(makeChip(a)));
}

function renderZones() {
  document.querySelectorAll(".drop").forEach(d => (d.innerHTML = ""));
  group.actors.filter(a => state.zones[a]).forEach(a => {
    const zoneKey = state.zones[a];
    const drop = document.querySelector('.drop[data-zone="' + zoneKey + '"]');
    if (drop) {
      const chip = el("div", { class: "chip", draggable: "true", "data-name": a, text: a });
      chip.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", a));
      drop.appendChild(chip);
    }
  });
}

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
  state = { zones: {}, arrows: [], imbalanceFrom: "", imbalanceTo: "", imbalanceWhy: "" };
  document.getElementById("imbalanceWhy").value = "";
  document.getElementById("graphSection").style.display = "none";
  renderPool();
  renderZones();
  buildAnalyzeSelects();
}

function onGenerateClick() {
  const placedCount = Object.keys(state.zones).length;
  const errEl = document.getElementById("genError");
  if (placedCount < 2) {
    errEl.textContent = "Place at least 2 actors into zones first.";
    return;
  }
  errEl.textContent = "";
  generateGraph();
  document.querySelector(".wrap .block").style.display = "none";
  document.getElementById("graphSection").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function currentEdges() {
  return state.arrows.filter(c => state.zones[c.from] && state.zones[c.to]);
}

function generateGraph() {
  const names = Object.keys(state.zones);
  gNames = names;

  const edges = currentEdges();
  const degree = {};
  names.forEach(n => degree[n] = 0);
  edges.forEach(c => { degree[c.from]++; degree[c.to]++; });
  let hub = names[0];
  names.forEach(n => { if (degree[n] > degree[hub]) hub = n; });

  const cx = 340, cy = 260;
  const others = names.filter(n => n !== hub).sort((a, b) => ZONE_RANK[state.zones[a]] - ZONE_RANK[state.zones[b]]);
  const R = 190;
  const pos = {};
  pos[hub] = { x: cx, y: cy };
  others.forEach((n, i) => {
    const angle = (i / Math.max(others.length, 1)) * Math.PI * 2 - Math.PI / 2;
    pos[n] = { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  });
  gPos = pos;
  renderGraph();
}

function nodeRadius(n, edges) {
  const deg = edges.filter(e => e.from === n || e.to === n).length;
  return 10 + deg * 3;
}

function edgeColor(c) {
  const r1 = ZONE_RANK[state.zones[c.from]], r2 = ZONE_RANK[state.zones[c.to]];
  if (r1 < r2) return "#2c2a4a";
  if (r1 > r2) return "#a8672f";
  return "#8a877d";
}

function shortLabel(n) { return n.length > 20 ? n.slice(0, 18) + "…" : n; }

function renderGraph() {
  const gsvg = document.getElementById("graphSvg");
  if (!gsvg || gNames.length === 0) return;
  const edges = currentEdges();
  let markers = '<defs><marker id="ah2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#55534c"/></marker></defs>';

  let edgesSvg = "";
  edges.forEach((c, idx) => {
    const p1 = gPos[c.from], p2 = gPos[c.to];
    if (!p1 || !p2) return;
    const color = edgeColor(c);
    const mx = (p1.x + p2.x) / 2 + (p2.y - p1.y) * 0.08;
    const my = (p1.y + p2.y) / 2 - (p2.x - p1.x) * 0.08;
    edgesSvg += '<path data-idx="' + idx + '" class="edgeLine" d="M ' + p1.x + ' ' + p1.y + ' Q ' + mx + ' ' + my + ' ' + p2.x + ' ' + p2.y + '" fill="none" stroke="' + color + '" stroke-width="1.6" opacity="0.9" marker-end="url(#ah2)" style="cursor:pointer;"/>';
    const lx = mx, ly = my - 6;
    edgesSvg += '<rect x="' + (lx - (c.label.length * 3.2)) + '" y="' + (ly - 10) + '" width="' + (c.label.length * 6.4) + '" height="16" rx="3" fill="#fffefb" stroke="#ddd8c8" stroke-width="0.5"/>';
    edgesSvg += '<text x="' + lx + '" y="' + ly + '" text-anchor="middle" dominant-baseline="central" font-size="11" fill="#201f1c">' + c.label + '</text>';
  });

  let nodesSvg = "";
  gNames.forEach(n => {
    const p = gPos[n];
    const r = nodeRadius(n, edges);
    const zone = state.zones[n];
    const labelY = p.y - r - 8;
    nodesSvg += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + r + '" fill="' + ZONE_FILL[zone] + '" stroke="' + ZONE_STROKE[zone] + '" stroke-width="1.4"/>';
    nodesSvg += '<text x="' + p.x + '" y="' + labelY + '" text-anchor="middle" font-size="12" fill="#201f1c">' + shortLabel(n) + '</text>';
  });

  gsvg.innerHTML = markers + edgesSvg + nodesSvg;

  gsvg.querySelectorAll(".edgeLine").forEach(path => {
    path.addEventListener("click", () => {
      const idx = parseInt(path.getAttribute("data-idx"), 10);
      const edgeList = currentEdges();
      const target = edgeList[idx];
      const realIdx = state.arrows.indexOf(target);
      if (realIdx > -1) state.arrows.splice(realIdx, 1);
      renderGraph();
      buildAnalyzeSelects();
    });
  });
}

function toSvgPoint(svg, evt) {
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX; pt.y = evt.clientY;
  const ctm = svg.getScreenCTM();
  return pt.matrixTransform(ctm.inverse());
}

function hitTestNode(pt) {
  let found = null;
  const edges = currentEdges();
  gNames.forEach(n => {
    const p = gPos[n];
    const dx = pt.x - p.x, dy = pt.y - p.y;
    if (Math.sqrt(dx * dx + dy * dy) <= nodeRadius(n, edges) + 10) found = n;
  });
  return found;
}

function pointsToPath(pts) {
  return "M " + pts[0].x + " " + pts[0].y + " " + pts.slice(1).map(p => "L " + p.x + " " + p.y).join(" ");
}

function attachDrawing() {
  const gsvg = document.getElementById("graphSvg");
  let dragging = false, dragStart = null, dragPoints = [], tempPath = null;

  gsvg.addEventListener("pointerdown", e => {
    const pt = toSvgPoint(gsvg, e);
    const hit = hitTestNode(pt);
    if (!hit) return;
    dragging = true;
    dragStart = hit;
    dragPoints = [pt];
    tempPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    tempPath.setAttribute("fill", "none");
    tempPath.setAttribute("stroke", "#b5432f");
    tempPath.setAttribute("stroke-width", "2");
    tempPath.setAttribute("stroke-dasharray", "4 4");
    gsvg.appendChild(tempPath);
    gsvg.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  gsvg.addEventListener("pointermove", e => {
    if (!dragging) return;
    const pt = toSvgPoint(gsvg, e);
    dragPoints.push(pt);
    tempPath.setAttribute("d", pointsToPath(dragPoints));
  });

  gsvg.addEventListener("pointerup", e => {
    if (!dragging) return;
    dragging = false;
    const pt = toSvgPoint(gsvg, e);
    const hit = hitTestNode(pt);
    if (tempPath) tempPath.remove();
    if (hit && hit !== dragStart) {
      openLabelPanel(dragStart, hit, e.clientX, e.clientY);
    }
    dragStart = null; dragPoints = [];
  });
}

function openLabelPanel(from, to, clientX, clientY) {
  document.querySelectorAll(".label-panel").forEach(p => p.remove());
  const panel = el("div", { class: "label-panel" });
  panel.style.left = Math.min(window.scrollX + clientX, window.scrollX + document.body.clientWidth - 240) + "px";
  panel.style.top = (window.scrollY + clientY + 12) + "px";
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
    renderGraph();
    buildAnalyzeSelects();
  });
  cancelBtn.addEventListener("click", () => panel.remove());
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
