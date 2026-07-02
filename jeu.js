// ════════════════════════════════════════════════════════════
// 1. CONSTANTS & CONFIG
// ════════════════════════════════════════════════════════════

const CONFIG = {
  cathouse: {
    coutBase:            5,
    croissance:          3,
    reductionParSeconde: 1
  },
  woodcatting:      { secondesParUnite: 60 },
  basicWoodcatting: { secondesParUnite: 600 },
  grasscatting:     { secondesParUnite: 60 },
  pebblegathering: { deblocageA: 7,  secondesParUnite: 60 },
  sawmill: {
    deblocageA:           10,
    secondesParPlanche:   600,
    secondesParCardboard: 60
  },
  brickfactory: {
    deblocageA:        10,
    secondesParBrique: 600,
    secondesParPebble: 60
  },
  catchen: {
    deblocageA:        10,
    secondesParSalad:  600,
    secondesParCatnip: 60
  },
  ameliorations: {
    purrfectCathouse: { cout: 1, bonusParCathouse: 0.5 },
    sharpClaws:       { cout: 5, bonusParChaton:   0.5 }
  }
};

const TIERS_KITTIES = [
  "Kitten", "Great Kitten", "Cat", "Great Cat",
  "General Cat", "Emperor Cat", "Godly Cat"
];

const NOMS_KITTIES = [
  "Bernardo", "Mochi", "Luna", "Whiskers", "Felix",
  "Cléopatra", "Biscuit", "Cosmo", "Zelda", "Napoléon",
  "Duchess", "Rascal", "Aurora", "Chester", "Pumpkin"
];

const VITESSES = [1, 2, 5, 10];

const OBJECTIFS = [
  {
    id: "firstKitty",   label: "Catch your first kitty",
    visible:  function(e) { return true; },
    accompli: function(e) { return e.chatons >= 1; }
  },
  {
    id: "secondKitty",  label: "Catch a second kitty",
    visible:  function(e) { return e.chatons >= 1; },
    accompli: function(e) { return e.chatons >= 2; }
  },
  {
    id: "firstWoodcatter", label: "Put a kitty to work gathering cardboard",
    visible:  function(e) { return e.chatons >= 2; },
    accompli: function(e) { return e.allocation.woodcatting >= 1; }
  },
  {
    id: "unlockBuildings", label: "Collect 5 cardboard to unlock Buildings",
    visible:  function(e) { return e.allocation.woodcatting >= 1; },
    accompli: function(e) { return e.cardboardTotalRecolte >= 5; }
  },
  {
    id: "firstCathouse", label: "Build your first Cardboard Box",
    visible:  function(e) { return e.cardboardTotalRecolte >= 5; },
    accompli: function(e) { return e.cathouses.length >= 1; }
  },
  {
    id: "fiveKitties", label: "Catch 5 kitties to unlock Grasscatting",
    visible:  function(e) { return e.chatons >= 2; },
    accompli: function(e) { return e.chatons >= 5; }
  },
  {
    id: "firstGrasscatter", label: "Put a kitty to gather catnip",
    visible:  function(e) { return e.chatons >= 5; },
    accompli: function(e) { return e.allocation.grasscatting >= 1; }
  },
  {
    id: "unlockSawmill", label: "Collect 10 cardboard to unlock the Sawmill",
    visible:  function(e) { return e.cardboardTotalRecolte >= 5; },
    accompli: function(e) { return e.cardboardTotalRecolte >= 10; }
  },
  {
    id: "firstSawmillWorker", label: "Assign a kitty to the Sawmill",
    visible:  function(e) { return e.cardboardTotalRecolte >= 10; },
    accompli: function(e) { return e.allocation.sawmill >= 1; }
  },
  {
    id: "firstPlank", label: "Craft your first Cardboard Plank",
    visible:  function(e) { return e.allocation.sawmill >= 1; },
    accompli: function(e) { return e.cardboardPlanks >= 1 || e.ameliorations.purrfectCathouse || e.ameliorations.sharpClaws; }
  },
  {
    id: "unlockCatchen", label: "Collect 10 catnip to unlock The Catchen",
    visible:  function(e) { return e.allocation.grasscatting >= 1; },
    accompli: function(e) { return e.catnipTotalRecolte >= 10; }
  },
  {
    id: "firstSalad", label: "Cook your first Salad",
    visible:  function(e) { return e.catnipTotalRecolte >= 10; },
    accompli: function(e) { return e.salads >= 1; }
  },
  {
    id: "firstPurrk", label: "Unlock your first Purrk",
    visible:  function(e) { return e.cardboardPlanks >= 1 || e.ameliorations.purrfectCathouse || e.ameliorations.sharpClaws; },
    accompli: function(e) { return e.ameliorations.purrfectCathouse || e.ameliorations.sharpClaws; }
  }
];


// ════════════════════════════════════════════════════════════
// 2. GAME STATE
// ════════════════════════════════════════════════════════════

const etat = {
  // Resources
  chatons:              0,
  cardboard:            0,  cardboardTotalRecolte: 0,
  basicWood:            0,  basicWoodTotalRecolte: 0,
  catnip:               0,  catnipTotalRecolte:    0,
  pebbles:              0,  pebblesTotalRecolte:   0,
  cardboardPlanks:      0,
  pebbleBricks:         0,
  salads:               0,
  purrfection:          0,

  // Catch sequence
  sequenceEnCours:         false,
  sequenceDebutTs:         0,
  sequenceDuree:           0,
  clicCount:               0,
  reductionAuMomentDuClic: 0,

  // Production accumulators
  secondesCardboardCumulees:          0,
  secondesBasicWoodCumulees:          0,
  secondesGrassCumulees:              0,
  secondesPebbleCumulees:             0,
  secondesCardboardPlankCumulees:     0,
  secondesPebbleBrickCumulees:        0,
  secondesSaladCumulees:              0,

  // Processing blocked flags
  scieriBloquee:  false,
  brickBloquee:   false,
  catchenBloquee: false,

  // Cathouse reduction accumulator (virtual seconds)
  reductionCumulee: 0,

  // Kitty allocation per job
  allocation: {
    woodcatting: 0, basicWoodcatting: 0, grasscatting: 0, pebblegathering: 0,
    sawmill: 0, brickfactory: 0, catchen: 0
  },

  ameliorations: { purrfectCathouse: false, sharpClaws: false },
  cathouses:     [],
  kittiesData:   [],   // { nom, metier, niveau, tier, catchTs }
  objectifsComplis: [],
  logs:          [],

  // Last real-world timestamp the game state was saved (for offline progress)
  dernierTimestamp: Date.now()
};


// ════════════════════════════════════════════════════════════
// 3. DERIVED VALUES & CALCULATIONS
// ════════════════════════════════════════════════════════════

function totalAlloue() {
  return Object.values(etat.allocation).reduce(function(s, n) { return s + n; }, 0);
}
function chatonsLibres() { return etat.chatons - totalAlloue(); }

function reductionParCathouse() {
  const bonus = etat.ameliorations.purrfectCathouse
    ? CONFIG.ameliorations.purrfectCathouse.bonusParCathouse : 0;
  return CONFIG.cathouse.reductionParSeconde + bonus;
}

function reductionTotale() {
  return etat.reductionCumulee;
}

function productionParChaton(action) {
  return 1 + (etat.ameliorations.sharpClaws && action === "woodcatting"
    ? CONFIG.ameliorations.sharpClaws.bonusParChaton : 0);
}

function dureeBrute()     { return Math.pow(5, etat.clicCount); }
function dureeEffective() { return Math.max(1, dureeBrute() - reductionTotale()); }

function tempsRestantSequence() {
  if (!etat.sequenceEnCours) return 0;
  const reductionDepuis = reductionTotale() - etat.reductionAuMomentDuClic;
  const ecouleBrut = (Date.now() - etat.sequenceDebutTs) / 1000;
  return Math.max(0, etat.sequenceDuree - ecouleBrut - reductionDepuis);
}

function progressionSequence() {
  if (!etat.sequenceEnCours) return 0;
  const reductionDepuis = reductionTotale() - etat.reductionAuMomentDuClic;
  const ecouleBrut = (Date.now() - etat.sequenceDebutTs) / 1000;
  return Math.min(1, (ecouleBrut + reductionDepuis) / etat.sequenceDuree);
}

function coutProchaineCathouse() {
  return Math.ceil(CONFIG.cathouse.coutBase * Math.pow(CONFIG.cathouse.croissance, etat.cathouses.length));
}


// ════════════════════════════════════════════════════════════
// 4. UNLOCK CONDITIONS
// ════════════════════════════════════════════════════════════

function catheringDebloquee()       { return etat.chatons >= 2; }
function grasscattingDebloquee()    { return etat.chatons >= 5; }
function pebblegatheringDebloquee() { return etat.chatons >= CONFIG.pebblegathering.deblocageA; }
function basicWoodDebloquee()       { return etat.cardboardPlanks >= 10; }
function buildingsDebloques()       { return etat.cardboardTotalRecolte >= 5; }
function scierieDebloquee()         { return etat.cardboardTotalRecolte >= CONFIG.sawmill.deblocageA; }
function brickfactoryDebloquee()    { return etat.pebblesTotalRecolte >= CONFIG.brickfactory.deblocageA; }
function pawcessingDebloquee()      { return scierieDebloquee(); }
function catchenDebloquee()         { return etat.catnipTotalRecolte >= CONFIG.catchen.deblocageA; }
function purrksDebloques()          { return etat.cardboardPlanks >= 1 || etat.ameliorations.purrfectCathouse || etat.ameliorations.sharpClaws; }


// ════════════════════════════════════════════════════════════
// 5. FORMATTING HELPERS
// ════════════════════════════════════════════════════════════

function formaterNombre(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.floor(n).toString();
}

function formaterTemps(sec) {
  if (sec <= 0) return "";
  sec = Math.ceil(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return h + "h " + m + "m " + s + "s";
  if (m > 0) return m + "m " + s + "s";
  return s + "s";
}

function formaterCatchTime(ts) {
  if (!ts) return "Unknown";
  const d    = new Date(ts);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const h    = String(d.getHours()).padStart(2, "0");
  const m    = String(d.getMinutes()).padStart(2, "0");
  return date + " · " + h + ":" + m;
}


// ════════════════════════════════════════════════════════════
// 6. SAVE / LOAD / RESET
// ════════════════════════════════════════════════════════════

function sauvegarder() {
  etat.dernierTimestamp = Date.now();
  localStorage.setItem("chatonClicker", JSON.stringify({
    dernierTimestamp:     etat.dernierTimestamp,
    chatons:                etat.chatons,
    cardboard:              etat.cardboard,         cardboardTotalRecolte: etat.cardboardTotalRecolte,
    basicWood:              etat.basicWood,         basicWoodTotalRecolte: etat.basicWoodTotalRecolte,
    catnip:                 etat.catnip,            catnipTotalRecolte:    etat.catnipTotalRecolte,
    pebbles:                etat.pebbles,           pebblesTotalRecolte:   etat.pebblesTotalRecolte,
    cardboardPlanks:        etat.cardboardPlanks,
    pebbleBricks:           etat.pebbleBricks,
    salads:                 etat.salads,
    purrfection:          etat.purrfection,
    sequenceEnCours:         etat.sequenceEnCours,
    sequenceDebutTs:         etat.sequenceDebutTs,
    sequenceDuree:           etat.sequenceDuree,
    clicCount:               etat.clicCount,
    reductionAuMomentDuClic: etat.reductionAuMomentDuClic,
    secondesCardboardCumulees:      etat.secondesCardboardCumulees,
    secondesBasicWoodCumulees:      etat.secondesBasicWoodCumulees,
    secondesGrassCumulees:          etat.secondesGrassCumulees,
    secondesPebbleCumulees:         etat.secondesPebbleCumulees,
    secondesCardboardPlankCumulees: etat.secondesCardboardPlankCumulees,
    secondesPebbleBrickCumulees:    etat.secondesPebbleBrickCumulees,
    secondesSaladCumulees:          etat.secondesSaladCumulees,
    scieriBloquee:    etat.scieriBloquee,
    brickBloquee:     etat.brickBloquee,
    catchenBloquee:   etat.catchenBloquee,
    reductionCumulee: etat.reductionCumulee,
    allocation:    etat.allocation,
    ameliorations: etat.ameliorations,
    cathouses:     etat.cathouses,
    kittiesData:   etat.kittiesData,
    objectifsComplis: etat.objectifsComplis,
    logs:          etat.logs
  }));
}

function charger() {
  const raw = localStorage.getItem("chatonClicker");
  if (!raw) return false;
  const d = JSON.parse(raw);

  etat.dernierTimestamp       = d.dernierTimestamp       || Date.now();
  etat.chatons                = d.chatons                || 0;
  // Migration: wood → cardboard
  etat.cardboard              = d.cardboard              !== undefined ? d.cardboard              : (d.wood || 0);
  etat.cardboardTotalRecolte  = d.cardboardTotalRecolte  !== undefined ? d.cardboardTotalRecolte  : (d.woodTotalRecolte || 0);
  etat.basicWood              = d.basicWood              || 0;
  etat.basicWoodTotalRecolte  = d.basicWoodTotalRecolte  || 0;
  etat.catnip                 = d.catnip                 || 0;
  etat.catnipTotalRecolte     = d.catnipTotalRecolte     || 0;
  etat.pebbles                = d.pebbles                || 0;
  etat.pebblesTotalRecolte    = d.pebblesTotalRecolte    || 0;
  // Migration: planks → cardboardPlanks, bricks → pebbleBricks
  etat.cardboardPlanks        = d.cardboardPlanks        !== undefined ? d.cardboardPlanks        : (d.planks || 0);
  etat.pebbleBricks           = d.pebbleBricks           !== undefined ? d.pebbleBricks           : (d.bricks || 0);
  etat.salads                 = d.salads                 || 0;
  etat.purrfection         = d.purrfection         || 0;

  etat.sequenceEnCours         = d.sequenceEnCours         || false;
  etat.sequenceDebutTs         = d.sequenceDebutTs         || 0;
  etat.sequenceDuree           = d.sequenceDuree           || 0;
  etat.clicCount               = d.clicCount               || 0;
  etat.reductionAuMomentDuClic = d.reductionAuMomentDuClic || 0;

  etat.secondesCardboardCumulees      = d.secondesCardboardCumulees      || (d.secondesWoodCumulees   || 0);
  etat.secondesBasicWoodCumulees      = d.secondesBasicWoodCumulees      || 0;
  etat.secondesGrassCumulees          = d.secondesGrassCumulees          || 0;
  etat.secondesPebbleCumulees         = d.secondesPebbleCumulees         || 0;
  etat.secondesCardboardPlankCumulees = d.secondesCardboardPlankCumulees || (d.secondesPlanCumulees  || 0);
  etat.secondesPebbleBrickCumulees    = d.secondesPebbleBrickCumulees    || (d.secondesBrickCumulees || 0);
  etat.secondesSaladCumulees          = d.secondesSaladCumulees          || 0;

  etat.scieriBloquee    = d.scieriBloquee    || false;
  etat.brickBloquee     = d.brickBloquee     || false;
  etat.catchenBloquee   = d.catchenBloquee   || false;
  // Migration: compute reduction from old timestamp-based saves
  etat.reductionCumulee = d.reductionCumulee !== undefined
    ? d.reductionCumulee
    : (d.cathouses || []).reduce(function(total, ts) {
        return total + Math.floor((Date.now() - ts) / 1000) * (d.ameliorations && d.ameliorations.purrfectCathouse ? 1.5 : 1);
      }, 0);

  etat.allocation = d.allocation || {
    woodcatting: 0, basicWoodcatting: 0, grasscatting: 0, pebblegathering: 0,
    sawmill: 0, brickfactory: 0, catchen: 0
  };
  // Migration: add allocation keys added in later versions
  if (etat.allocation.pebblegathering  === undefined) etat.allocation.pebblegathering  = 0;
  if (etat.allocation.brickfactory     === undefined) etat.allocation.brickfactory     = 0;
  if (etat.allocation.basicWoodcatting === undefined) etat.allocation.basicWoodcatting = 0;

  etat.ameliorations   = d.ameliorations   || { purrfectCathouse: false, sharpClaws: false };
  etat.cathouses       = d.cathouses       || [];
  etat.objectifsComplis = d.objectifsComplis || [];
  etat.logs            = d.logs            || [];
  etat.kittiesData     = d.kittiesData     || [];

  // Migration: backfill kittiesData if save predates the feature
  while (etat.kittiesData.length < etat.chatons) {
    const nom = NOMS_KITTIES[etat.kittiesData.length] || ("Kitty #" + (etat.kittiesData.length + 1));
    etat.kittiesData.push({ nom: nom, metier: null, niveau: 1, tier: 0, catchTs: null });
  }
  return true;
}

function reset() {
  if (!confirm("Start over from scratch?")) return;
  localStorage.removeItem("chatonClicker");
  localStorage.removeItem("introVue");
  localStorage.removeItem("story1Vue");
  localStorage.removeItem("story2Vue");
  Object.assign(etat, {
    chatons: 0, cardboard: 0, cardboardTotalRecolte: 0,
    basicWood: 0, basicWoodTotalRecolte: 0,
    catnip: 0, catnipTotalRecolte: 0,
    pebbles: 0, pebblesTotalRecolte: 0,
    cardboardPlanks: 0, pebbleBricks: 0, salads: 0, purrfection: 0,
    sequenceEnCours: false, sequenceDebutTs: 0, sequenceDuree: 0,
    clicCount: 0, reductionAuMomentDuClic: 0,
    secondesCardboardCumulees: 0, secondesBasicWoodCumulees: 0, secondesGrassCumulees: 0, secondesPebbleCumulees: 0,
    secondesCardboardPlankCumulees: 0, secondesPebbleBrickCumulees: 0, secondesSaladCumulees: 0,
    scieriBloquee: false, brickBloquee: false, catchenBloquee: false, reductionCumulee: 0,
    allocation: { woodcatting: 0, basicWoodcatting: 0, grasscatting: 0, pebblegathering: 0, sawmill: 0, brickfactory: 0, catchen: 0 },
    ameliorations: { purrfectCathouse: false, sharpClaws: false },
    cathouses: [], kittiesData: [], objectifsComplis: [], logs: [],
    dernierTimestamp: Date.now()
  });
  rendu(); renduLogs(); renduObjectifs(); renduManagement();
}


// ════════════════════════════════════════════════════════════
// 7. NOTIFICATIONS & LOGS
// ════════════════════════════════════════════════════════════

function afficherNotification(message) {
  const el = document.createElement("div");
  el.textContent = message;
  el.className   = "notification";
  document.body.appendChild(el);
  setTimeout(function() { el.classList.add("visible"); }, 10);
  setTimeout(function() {
    el.classList.remove("visible");
    setTimeout(function() { el.remove(); }, 500);
  }, 3000);
}

const LOG_MAX = 60;

function ajouterLog(type, lignes) {
  const now = new Date();
  const h   = String(now.getHours()).padStart(2, "0");
  const m   = String(now.getMinutes()).padStart(2, "0");
  etat.logs.unshift({ type: type, lignes: Array.isArray(lignes) ? lignes : [lignes], heure: h + ":" + m });
  if (etat.logs.length > LOG_MAX) etat.logs.pop();
  renduLogs();
}

const logFiltres = { dialogue: true, event: true, unlock: true };

function renduLogs() {
  const conteneur = document.getElementById("logs-liste");
  if (!conteneur) return;
  conteneur.innerHTML = "";
  etat.logs.forEach(function(entry) {
    if (!logFiltres[entry.type]) return;
    const el    = document.createElement("div");
    el.className = "log-entry log-" + entry.type;
    const heure = document.createElement("span");
    heure.className   = "log-heure";
    heure.textContent = entry.heure;
    const bloc  = document.createElement("span");
    bloc.className = "log-texte";
    const lignes = entry.lignes || (entry.texte ? [entry.texte] : []);
    lignes.forEach(function(ligne, i) {
      if (i > 0) bloc.appendChild(document.createElement("br"));
      bloc.appendChild(document.createTextNode(ligne));
    });
    el.appendChild(heure);
    el.appendChild(bloc);
    conteneur.appendChild(el);
  });
}

function toggleFiltreLogs(type) {
  logFiltres[type] = !logFiltres[type];
  const btn = document.getElementById("filtre-" + type);
  if (btn) btn.classList.toggle("filtre-inactif", !logFiltres[type]);
  renduLogs();
}


// ════════════════════════════════════════════════════════════
// 8. OBJECTIVES
// ════════════════════════════════════════════════════════════

function verifierObjectifs() {
  let changed = false;
  OBJECTIFS.forEach(function(obj) {
    if (etat.objectifsComplis.indexOf(obj.id) === -1 && obj.accompli(etat)) {
      etat.objectifsComplis.push(obj.id);
      etat.purrfection += 1;
      ajouterLog("unlock", "🎯 Objective complete: " + obj.label);
      changed = true;
    }
  });
  if (changed) { renduObjectifs(); rendu(); sauvegarder(); }
}

function renduObjectifs() {
  const elActifs  = document.getElementById("objectifs-actifs");
  const elComplis = document.getElementById("objectifs-complis");
  const elSection = document.getElementById("section-complis");
  if (!elActifs || !elComplis) return;

  const actifs  = [];
  const complis = [];
  OBJECTIFS.forEach(function(obj) {
    const done = etat.objectifsComplis.indexOf(obj.id) !== -1;
    if (done)                        complis.push(obj);
    else if (obj.visible(etat))      actifs.push(obj);
  });

  elActifs.innerHTML = "";
  actifs.forEach(function(obj) {
    const el = document.createElement("div");
    el.className   = "obj-entry obj-actif";
    el.textContent = obj.label;
    elActifs.appendChild(el);
  });

  elSection.style.display = complis.length > 0 ? "block" : "none";
  elComplis.innerHTML = "";
  complis.slice().reverse().forEach(function(obj) {
    const el = document.createElement("div");
    el.className   = "obj-entry obj-compli";
    el.textContent = "✓ " + obj.label;
    elComplis.appendChild(el);
  });
}


// ════════════════════════════════════════════════════════════
// 9. RENDER
// ════════════════════════════════════════════════════════════

// Track previous bar values to detect resets
const _barreProgres = {};

function setBarreProgress(id, ratio) {
  const el = document.getElementById(id);
  if (!el) return;
  const pct    = Math.min(ratio * 100, 100);
  const ancien = _barreProgres[id] || 0;
  if (pct < ancien - 5) {
    // Reset: jump instantly to avoid backward animation
    el.style.transition = "none";
    el.style.width      = pct + "%";
    el.getBoundingClientRect();
    el.style.transition = "";
  } else {
    el.style.width = pct + "%";
  }
  _barreProgres[id] = pct;
}

// Helper: compute all unlock flags once per render cycle
function unlocks() {
  return {
    libres:       chatonsLibres(),
    cathering:    catheringDebloquee(),
    grasscat:     grasscattingDebloquee(),
    pebblecat:    pebblegatheringDebloquee(),
    basicWood:    basicWoodDebloquee(),
    buildings:    buildingsDebloques(),
    scierie:      scierieDebloquee(),
    brickfact:    brickfactoryDebloquee(),
    pawcessing:   pawcessingDebloquee(),
    catchen:      catchenDebloquee(),
    purrks:       purrksDebloques()
  };
}

// ── 9a. Resources bar
function renduRessources(u) {
  document.getElementById("val-purrfection").textContent = etat.purrfection;
  document.getElementById("val-chatons").textContent     = formaterNombre(etat.chatons);
  document.getElementById("val-cardboard").textContent        = formaterNombre(etat.cardboard);
  document.getElementById("val-basic-wood").textContent       = formaterNombre(etat.basicWood);
  document.getElementById("val-catnip").textContent           = formaterNombre(etat.catnip);
  document.getElementById("val-pebbles").textContent          = formaterNombre(etat.pebbles);
  document.getElementById("val-cardboard-planks").textContent = formaterNombre(etat.cardboardPlanks);
  document.getElementById("val-pebble-bricks").textContent    = formaterNombre(etat.pebbleBricks);
  document.getElementById("val-salads").textContent           = formaterNombre(etat.salads);

  document.getElementById("onglet-work").style.display      = u.cathering  ? "inline-block" : "none";
  document.getElementById("onglet-buildings").style.display = u.buildings  ? "inline-block" : "none";
  document.getElementById("onglet-purrks").style.display    = u.purrks     ? "inline-block" : "none";
  document.getElementById("row-cardboard").style.display        = u.cathering  ? "flex" : "none";
  document.getElementById("row-basic-wood").style.display       = u.basicWood  ? "flex" : "none";
  document.getElementById("row-catnip").style.display           = u.grasscat   ? "flex" : "none";
  document.getElementById("row-pebbles").style.display           = u.pebblecat ? "flex" : "none";
  document.getElementById("row-cardboard-planks").style.display  = u.scierie   ? "flex" : "none";
  document.getElementById("row-pebble-bricks").style.display     = u.brickfact ? "flex" : "none";
  document.getElementById("row-salads").style.display            = u.catchen   ? "flex" : "none";

  const prodCardboard  = u.cathering ? etat.allocation.woodcatting * productionParChaton("woodcatting") / CONFIG.woodcatting.secondesParUnite : 0;
  const consCardboard  = (!etat.scieriBloquee) ? etat.allocation.sawmill / CONFIG.sawmill.secondesParCardboard : 0;
  afficherTauxNet("taux-cardboard", prodCardboard - consCardboard);

  const prodBasicWood = u.basicWood ? etat.allocation.basicWoodcatting / CONFIG.basicWoodcatting.secondesParUnite : 0;
  afficherTauxNet("taux-basic-wood", prodBasicWood);

  const prodCatnip  = u.grasscat ? etat.allocation.grasscatting * productionParChaton("grasscatting") / CONFIG.grasscatting.secondesParUnite : 0;
  const consCatnip  = (!etat.catchenBloquee) ? etat.allocation.catchen / CONFIG.catchen.secondesParCatnip : 0;
  afficherTauxNet("taux-catnip", prodCatnip - consCatnip);

  const prodPebble  = u.pebblecat ? etat.allocation.pebblegathering * productionParChaton("pebblegathering") / CONFIG.pebblegathering.secondesParUnite : 0;
  const consPebble  = (!etat.brickBloquee) ? etat.allocation.brickfactory / CONFIG.brickfactory.secondesParPebble : 0;
  afficherTauxNet("taux-pebbles", prodPebble - consPebble);

  const prodCardboardPlanks  = (u.scierie && !etat.scieriBloquee) ? etat.allocation.sawmill / CONFIG.sawmill.secondesParPlanche : 0;
  afficherTauxNet("taux-cardboard-planks", prodCardboardPlanks);

  const prodPebbleBricks  = (u.brickfact && !etat.brickBloquee) ? etat.allocation.brickfactory / CONFIG.brickfactory.secondesParBrique : 0;
  afficherTauxNet("taux-pebble-bricks", prodPebbleBricks);

  const prodSalads  = (u.catchen && !etat.catchenBloquee) ? etat.allocation.catchen / CONFIG.catchen.secondesParSalad : 0;
  afficherTauxNet("taux-salads", prodSalads);
}

function afficherTauxNet(elementId, net) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (Math.abs(net) < 0.0005) {
    el.textContent = "";
    el.classList.remove("ressource-taux-positif", "ressource-taux-negatif");
    return;
  }
  el.textContent = (net > 0 ? "+" : "") + net.toFixed(2) + "/s";
  el.classList.toggle("ressource-taux-positif", net > 0);
  el.classList.toggle("ressource-taux-negatif", net < 0);
}

// ── 9b. Catch sequence (header)
function renduSequence() {
  const enCours = etat.sequenceEnCours;
  const restant = tempsRestantSequence();
  document.getElementById("bouton-sequence").disabled    = enCours;
  document.getElementById("bouton-sequence").textContent = enCours
    ? "Catching... " + formaterTemps(restant) : "Catch a kitty 🐾";
  document.getElementById("conteneur-barre-sequence").style.display = enCours ? "block" : "none";
  setBarreProgress("barre-sequence", progressionSequence());
  document.getElementById("info-sequence").textContent   = enCours ? ""
    : (etat.clicCount === 0 ? "First kitty: 1s" : "Next cooldown: " + formaterTemps(dureeEffective()));

  renduStatsAttrapage();
}

// ── 9b-bis. Catching stats popover
let statsAttrapageOuvert = false;

function toggleStatsAttrapage() {
  statsAttrapageOuvert = !statsAttrapageOuvert;
  document.getElementById("popover-stats-attrapage").style.display = statsAttrapageOuvert ? "flex" : "none";
  if (statsAttrapageOuvert) renduStatsAttrapage();
}

function formaterTempsStat(sec) {
  return sec <= 0 ? "0s" : formaterTemps(sec);
}

function renduStatsAttrapage() {
  if (!statsAttrapageOuvert) return;

  const raw  = dureeBrute();
  const taux = 1 + etat.cathouses.length * reductionParCathouse();

  let rawRestant;
  if (etat.sequenceEnCours) {
    const ecouleBrut = (Date.now() - etat.sequenceDebutTs) / 1000;
    rawRestant = Math.max(0, raw - ecouleBrut);
  } else {
    rawRestant = raw;
  }
  const adjusted = rawRestant / taux;

  document.getElementById("stat-raw").textContent      = formaterTempsStat(raw);
  document.getElementById("stat-taux").textContent      = taux.toFixed(2) + "s/s";
  document.getElementById("stat-adjusted").textContent = formaterTempsStat(adjusted);
}

document.addEventListener("click", function(e) {
  if (!statsAttrapageOuvert) return;
  const wrapper = document.getElementById("stats-attrapage-wrapper");
  if (wrapper && !wrapper.contains(e.target)) {
    statsAttrapageOuvert = false;
    document.getElementById("popover-stats-attrapage").style.display = "none";
  }
});

// ── 9c. Cathering section
function renduCathering(u) {
  if (!u.cathering) return;

  const lib = u.libres;

  // WOOD family
  // Tier 1: Cardboard
  setBarreProgress("barre-woodcatting", etat.secondesCardboardCumulees / CONFIG.woodcatting.secondesParUnite);
  document.getElementById("alloues-woodcatting").textContent    = etat.allocation.woodcatting;
  document.getElementById("libres-woodcatting").textContent     = lib;
  document.getElementById("btn-allouer-woodcatting").disabled   = lib <= 0;
  document.getElementById("btn-deallouer-woodcatting").disabled = etat.allocation.woodcatting <= 0;

  // Tier 2: Basic Wood
  document.getElementById("sep-basicWoodcatting").style.display = u.basicWood ? "block" : "none";
  if (u.basicWood) {
    setBarreProgress("barre-basicWoodcatting", etat.secondesBasicWoodCumulees / CONFIG.basicWoodcatting.secondesParUnite);
    document.getElementById("alloues-basicWoodcatting").textContent    = etat.allocation.basicWoodcatting;
    document.getElementById("libres-basicWoodcatting").textContent     = lib;
    document.getElementById("btn-allouer-basicWoodcatting").disabled   = lib <= 0;
    document.getElementById("btn-deallouer-basicWoodcatting").disabled = etat.allocation.basicWoodcatting <= 0;
  }

  // FOOD family
  document.getElementById("famille-food").style.display = u.grasscat ? "block" : "none";
  if (u.grasscat) {
    setBarreProgress("barre-grasscatting", etat.secondesGrassCumulees / CONFIG.grasscatting.secondesParUnite);
    document.getElementById("alloues-grasscatting").textContent    = etat.allocation.grasscatting;
    document.getElementById("libres-grasscatting").textContent     = lib;
    document.getElementById("btn-allouer-grasscatting").disabled   = lib <= 0;
    document.getElementById("btn-deallouer-grasscatting").disabled = etat.allocation.grasscatting <= 0;
  }

  // ROCK family
  document.getElementById("famille-rock").style.display = u.pebblecat ? "block" : "none";
  if (u.pebblecat) {
    setBarreProgress("barre-pebblegathering", etat.secondesPebbleCumulees / CONFIG.pebblegathering.secondesParUnite);
    document.getElementById("alloues-pebblegathering").textContent    = etat.allocation.pebblegathering;
    document.getElementById("libres-pebblegathering").textContent     = lib;
    document.getElementById("btn-allouer-pebblegathering").disabled   = lib <= 0;
    document.getElementById("btn-deallouer-pebblegathering").disabled = etat.allocation.pebblegathering <= 0;
  }
}

// ── 9d. Buildings section
function renduBuildings(u) {
  if (!u.buildings) return;
  const cout = coutProchaineCathouse();
  document.getElementById("possede-cathouse").textContent = etat.cathouses.length;
  document.getElementById("cout-cathouse").textContent    = cout;
  document.getElementById("bouton-cathouse").disabled     = etat.cardboard < cout;
  document.getElementById("reduction-active").textContent = etat.cathouses.length > 0
    ? "Reduction: " + formaterTemps(reductionTotale()) : "";
}

// ── 9e. Paw-cessing section
function renduPawcessing(u) {
  document.getElementById("section-pawcessing").style.display = u.pawcessing ? "flex" : "none";
  if (!u.pawcessing) return;

  const lib = u.libres;

  // Sawmill
  const barreSaw = document.getElementById("barre-sawmill");
  setBarreProgress("barre-sawmill", etat.secondesCardboardPlankCumulees / CONFIG.sawmill.secondesParPlanche);
  barreSaw.classList.toggle("barre-bloquee", etat.scieriBloquee);
  barreSaw.classList.toggle("barre-marron",  !etat.scieriBloquee);
  document.getElementById("statut-sawmill").textContent      = etat.scieriBloquee ? "⏸ Waiting for cardboard..." : "";
  document.getElementById("alloues-sawmill").textContent     = etat.allocation.sawmill;
  document.getElementById("libres-sawmill").textContent      = lib;
  document.getElementById("btn-allouer-sawmill").disabled    = lib <= 0;
  document.getElementById("btn-deallouer-sawmill").disabled  = etat.allocation.sawmill <= 0;

  // Brick Factory
  document.getElementById("sep-brickfactory").style.display = u.brickfact ? "block" : "none";
  if (u.brickfact) {
    const barreBrick = document.getElementById("barre-brickfactory");
    setBarreProgress("barre-brickfactory", etat.secondesPebbleBrickCumulees / CONFIG.brickfactory.secondesParBrique);
    barreBrick.classList.toggle("barre-bloquee", etat.brickBloquee);
    barreBrick.classList.toggle("barre-bleue",   !etat.brickBloquee);
    document.getElementById("statut-brickfactory").textContent     = etat.brickBloquee ? "⏸ Waiting for pebbles..." : "";
    document.getElementById("alloues-brickfactory").textContent    = etat.allocation.brickfactory;
    document.getElementById("libres-brickfactory").textContent     = lib;
    document.getElementById("btn-allouer-brickfactory").disabled   = lib <= 0;
    document.getElementById("btn-deallouer-brickfactory").disabled = etat.allocation.brickfactory <= 0;
  }

  // Catchen
  document.getElementById("sep-catchen").style.display = u.catchen ? "block" : "none";
  if (u.catchen) {
    const barreCat = document.getElementById("barre-catchen");
    setBarreProgress("barre-catchen", etat.secondesSaladCumulees / CONFIG.catchen.secondesParSalad);
    barreCat.classList.toggle("barre-bloquee", etat.catchenBloquee);
    barreCat.classList.toggle("barre-verte",   !etat.catchenBloquee);
    document.getElementById("statut-catchen").textContent     = etat.catchenBloquee ? "⏸ Waiting for catnip..." : "";
    document.getElementById("alloues-catchen").textContent    = etat.allocation.catchen;
    document.getElementById("libres-catchen").textContent     = lib;
    document.getElementById("btn-allouer-catchen").disabled   = lib <= 0;
    document.getElementById("btn-deallouer-catchen").disabled = etat.allocation.catchen <= 0;
  }
}

// ── 9f. Purrks section
function renduPurrks(u) {
  if (!u.purrks) return;
  const am    = etat.ameliorations;
  const btnPC = document.getElementById("bouton-purrfect-cathouse");
  btnPC.disabled    = am.purrfectCathouse || etat.cardboardPlanks < CONFIG.ameliorations.purrfectCathouse.cout;
  btnPC.textContent = am.purrfectCathouse ? "✓ Unlocked" : "1 📋";
  const btnSC = document.getElementById("bouton-sharp-claws");
  btnSC.disabled    = am.sharpClaws || etat.cardboardPlanks < CONFIG.ameliorations.sharpClaws.cout;
  btnSC.textContent = am.sharpClaws ? "✓ Unlocked" : "5 📋";
}

// ── 9g. Management tab
let kittySelectionnee = null;

function selectionnerKitty(index) {
  kittySelectionnee = index;
  renduManagement();
}

function deselectionnerKitty() {
  kittySelectionnee = null;
  renduManagement();
}

function renduManagement() {
  const liste  = document.getElementById("liste-kitties");
  const detail = document.getElementById("detail-kitty");
  const layout = document.getElementById("management-layout");
  if (!liste || !detail) return;

  if (layout) layout.classList.toggle("affiche-detail-mobile", kittySelectionnee !== null);

  // Left: kitty list
  liste.innerHTML = "";
  if (etat.kittiesData.length === 0) {
    const vide = document.createElement("p");
    vide.className   = "management-vide";
    vide.textContent = "No kitties yet... go catch some! 🐾";
    liste.appendChild(vide);
    detail.innerHTML = "<p class=\"management-vide\">No kitty selected.</p>";
    return;
  }

  etat.kittiesData.forEach(function(kitty, i) {
    const carte  = document.createElement("div");
    carte.className = "kitty-carte" + (kittySelectionnee === i ? " kitty-carte-active" : "");
    carte.onclick   = function() { selectionnerKitty(i); };

    const photo = document.createElement("div");
    photo.className   = "kitty-photo";
    photo.textContent = "🐱";

    const infos = document.createElement("div");
    infos.className = "kitty-infos";

    const tierIdx = kitty.tier || 0;

    const spans = [
      { cls: "kitty-nom",    txt: kitty.nom },
      { cls: "kitty-metier" + (kitty.metier ? "" : " kitty-vagabond"), txt: kitty.metier || "Stray Cat" },
      { cls: "kitty-niveau" + (kitty.metier ? "" : " kitty-niveau-bloque"), txt: kitty.metier ? "Lvl " + kitty.niveau : "Lvl — 🔒" },
      { cls: "kitty-tier kitty-tier-" + tierIdx, txt: "T" + tierIdx + " · " + TIERS_KITTIES[tierIdx] }
    ];
    spans.forEach(function(s) {
      const el = document.createElement("span");
      el.className   = s.cls;
      el.textContent = s.txt;
      infos.appendChild(el);
    });

    carte.appendChild(photo);
    carte.appendChild(infos);
    liste.appendChild(carte);
  });

  // Right: detail panel
  if (kittySelectionnee === null || !etat.kittiesData[kittySelectionnee]) {
    detail.innerHTML = "<p class=\"management-vide\">Select a kitty to see details.</p>";
    return;
  }

  const k       = etat.kittiesData[kittySelectionnee];
  const tierIdx = k.tier || 0;
  detail.innerHTML = "";

  const retour = document.createElement("button");
  retour.className   = "bouton-retour-mobile";
  retour.textContent = "← Back";
  retour.onclick      = deselectionnerKitty;
  detail.appendChild(retour);

  // Left third: General Info
  const gauche = document.createElement("div");
  gauche.className = "detail-gauche";
  gauche.innerHTML =
    "<h3 class=\"detail-titre\">General Info</h3>" +
    "<div class=\"kitty-photo detail-photo\">🐱</div>" +
    "<div class=\"detail-champ\"><span class=\"detail-label\">Name</span><span class=\"detail-val\">" + k.nom + "</span></div>" +
    "<div class=\"detail-champ\"><span class=\"detail-label\">Caught</span><span class=\"detail-val\">" + formaterCatchTime(k.catchTs) + "</span></div>" +
    "<div class=\"detail-champ\"><span class=\"detail-label\">Level</span><span class=\"detail-val" + (k.metier ? "" : " detail-bloque") + "\">" + (k.metier ? "Level " + k.niveau : "— 🔒") + "</span></div>" +
    "<div class=\"detail-champ\"><span class=\"detail-label\">Tier</span><span class=\"detail-val kitty-tier kitty-tier-" + tierIdx + "\">T" + tierIdx + " · " + TIERS_KITTIES[tierIdx] + "</span></div>";

  // Right two-thirds: Job Details
  const droite = document.createElement("div");
  droite.className = "detail-droite";
  droite.innerHTML =
    "<h3 class=\"detail-titre\">Job Details</h3>" +
    "<div class=\"detail-job-nom" + (k.metier ? "" : " kitty-vagabond") + "\">" + (k.metier || "Stray Cat") + "</div>";

  const corps = document.createElement("div");
  corps.className = "detail-corps";
  corps.appendChild(gauche);
  corps.appendChild(droite);
  detail.appendChild(corps);
}

// ── 9h. Master render dispatcher
function rendu() {
  const u = unlocks();
  renduRessources(u);
  renduSequence();
  renduCathering(u);
  renduBuildings(u);
  renduPawcessing(u);
  renduPurrks(u);
}


// ════════════════════════════════════════════════════════════
// 10. ACTIONS
// ════════════════════════════════════════════════════════════

// ── 10a. Catch sequence
document.getElementById("bouton-sequence").addEventListener("click", function() {
  if (etat.sequenceEnCours) return;
  etat.sequenceEnCours         = true;
  etat.sequenceDebutTs         = Date.now();
  etat.sequenceDuree           = etat.clicCount === 0 ? 1 : dureeEffective();
  etat.reductionAuMomentDuClic = reductionTotale();
  sauvegarder(); rendu();
});

function terminerSequence() {
  etat.sequenceEnCours = false;
  etat.chatons        += 1;
  etat.clicCount      += 1;
  const nom = NOMS_KITTIES[etat.kittiesData.length] || ("Kitty #" + (etat.kittiesData.length + 1));
  etat.kittiesData.push({ nom: nom, metier: null, niveau: 1, tier: 0, catchTs: Date.now() });
  afficherNotification("🐱 " + nom + " joined the gang!");
  ajouterLog("event", "🐱 " + nom + " caught!");
  renduManagement();
  if (etat.chatons === 2) {
    afficherNotification("🐾 Cathering unlocked! Put your kitties to work.");
    ajouterLog("unlock", "🐾 Cathering unlocked — put your kitties to work.");
  }
  if (etat.chatons === 5) {
    afficherNotification("🌿 Grasscatting unlocked!");
    ajouterLog("unlock", "🌿 Grasscatting unlocked!");
  }
  verifierStoryModals();
  sauvegarder(); rendu();
}

// ── 10b. Allocation
function makeAllocHandlers(action, btnPlusId, btnMinusId) {
  document.getElementById(btnPlusId).addEventListener("click", function() {
    if (chatonsLibres() <= 0) return;
    etat.allocation[action] += 1;
    verifierObjectifs(); sauvegarder(); rendu();
  });
  document.getElementById(btnMinusId).addEventListener("click", function() {
    if (etat.allocation[action] <= 0) return;
    etat.allocation[action] -= 1;
    sauvegarder(); rendu();
  });
}

makeAllocHandlers("woodcatting",      "btn-allouer-woodcatting",      "btn-deallouer-woodcatting");
makeAllocHandlers("basicWoodcatting", "btn-allouer-basicWoodcatting", "btn-deallouer-basicWoodcatting");
makeAllocHandlers("grasscatting",     "btn-allouer-grasscatting",     "btn-deallouer-grasscatting");
makeAllocHandlers("pebblegathering", "btn-allouer-pebblegathering", "btn-deallouer-pebblegathering");
makeAllocHandlers("sawmill",         "btn-allouer-sawmill",         "btn-deallouer-sawmill");
makeAllocHandlers("brickfactory",    "btn-allouer-brickfactory",    "btn-deallouer-brickfactory");
makeAllocHandlers("catchen",         "btn-allouer-catchen",         "btn-deallouer-catchen");

// ── 10c. Buildings, Purrks, Boosts
function acheterCathouse() {
  const cout = coutProchaineCathouse();
  if (etat.cardboard < cout) return;
  etat.cardboard -= cout;
  etat.cathouses.push(Date.now());
  afficherNotification("📦 Cardboard Box built!");
  ajouterLog("event", "📦 Cardboard Box #" + etat.cathouses.length + " built!");
  verifierObjectifs(); sauvegarder(); rendu();
}

function acheterPurrk(id) {
  const cfg = CONFIG.ameliorations[id];
  if (etat.ameliorations[id] || etat.cardboardPlanks < cfg.cout) return;
  etat.cardboardPlanks -= cfg.cout;
  etat.ameliorations[id] = true;
  afficherNotification("✨ Purrk unlocked!");
  ajouterLog("unlock", "✨ Purrk unlocked: " + id + ".");
  verifierObjectifs(); sauvegarder(); rendu();
}



// ════════════════════════════════════════════════════════════
// 11. GAME LOOP (TICK)
// ════════════════════════════════════════════════════════════

let vitesse  = 1;
const TICK_DT = 0.1; // seconds per tick

function tickGathering(action, stockKey, totalKey, cumulKey, cfg, onUnlockCheck, dt) {
  if (etat.allocation[action] <= 0) return;
  if (dt === undefined) dt = vitesse * TICK_DT;
  etat[cumulKey] += etat.allocation[action] * productionParChaton(action) * dt;
  const prod = Math.floor(etat[cumulKey] / cfg.secondesParUnite);
  if (prod <= 0) return;
  etat[stockKey] += prod;
  etat[totalKey] += prod;
  etat[cumulKey] -= prod * cfg.secondesParUnite;
  if (onUnlockCheck) onUnlockCheck(prod);
}

function tick() {
  // Cathouse reduction accumulation (speed-aware)
  if (etat.cathouses.length > 0) {
    etat.reductionCumulee += etat.cathouses.length * reductionParCathouse() * vitesse * TICK_DT;
  }

  // Speed-up: advance sequence timestamp
  if (vitesse > 1 && etat.sequenceEnCours) {
    etat.sequenceDebutTs -= (vitesse - 1) * 100;
  }

  // Check sequence completion
  if (etat.sequenceEnCours && tempsRestantSequence() <= 0) {
    terminerSequence(); return;
  }

  // Gathering
  tickGathering("woodcatting", "cardboard", "cardboardTotalRecolte", "secondesCardboardCumulees", CONFIG.woodcatting, function(prod) {
    const avant = etat.cardboardTotalRecolte - prod;
    if (avant < 5 && etat.cardboardTotalRecolte >= 5) {
      afficherNotification("🏗️ Buildings unlocked! Build your first Cardboard Box.");
      ajouterLog("unlock", "🏗️ Buildings unlocked — build your first Cardboard Box.");
    }
    if (avant < CONFIG.sawmill.deblocageA && etat.cardboardTotalRecolte >= CONFIG.sawmill.deblocageA) {
      afficherNotification("🪚 Sawmill unlocked! Paw-cessing is now available.");
      ajouterLog("unlock", "🪚 Sawmill unlocked — Paw-cessing is now available.");
    }
  });

  tickGathering("basicWoodcatting", "basicWood", "basicWoodTotalRecolte", "secondesBasicWoodCumulees", CONFIG.basicWoodcatting, null);

  tickGathering("grasscatting", "catnip", "catnipTotalRecolte", "secondesGrassCumulees", CONFIG.grasscatting, function(prod) {
    const avant = etat.catnipTotalRecolte - prod;
    if (avant < CONFIG.catchen.deblocageA && etat.catnipTotalRecolte >= CONFIG.catchen.deblocageA) {
      afficherNotification("🍳 The Catchen is open!");
      ajouterLog("unlock", "🍳 The Catchen is open — cook your first salad!");
    }
  });

  tickGathering("pebblegathering", "pebbles", "pebblesTotalRecolte", "secondesPebbleCumulees", CONFIG.pebblegathering, function(prod) {
    const avant = etat.pebblesTotalRecolte - prod;
    if (avant < CONFIG.brickfactory.deblocageA && etat.pebblesTotalRecolte >= CONFIG.brickfactory.deblocageA) {
      afficherNotification("🪨 Pawsonry unlocked!");
      ajouterLog("unlock", "🪨 Pawsonry unlocked — process pebbles into bricks.");
    }
  });

  // Processing: Sawmill (cardboard → cardboard planks)
  if (etat.allocation.sawmill > 0) {
    if (etat.cardboard >= 1) {
      etat.scieriBloquee = false;
      const avant = etat.secondesCardboardPlankCumulees;
      etat.secondesCardboardPlankCumulees += etat.allocation.sawmill * vitesse * TICK_DT;
      const cardboardCons = Math.floor(etat.secondesCardboardPlankCumulees / CONFIG.sawmill.secondesParCardboard)
                          - Math.floor(avant / CONFIG.sawmill.secondesParCardboard);
      if (cardboardCons > 0) etat.cardboard = Math.max(0, etat.cardboard - cardboardCons);
      const planks = Math.floor(etat.secondesCardboardPlankCumulees / CONFIG.sawmill.secondesParPlanche);
      if (planks > 0) {
        const first = etat.cardboardPlanks === 0;
        etat.cardboardPlanks               += planks;
        etat.secondesCardboardPlankCumulees -= planks * CONFIG.sawmill.secondesParPlanche;
        afficherNotification("📋 " + planks + " cardboard plank(s) produced!");
        ajouterLog("event", "📋 " + planks + " cardboard plank(s) produced by the Sawmill.");
        if (first) {
          afficherNotification("✨ Purrks unlocked! Spend your planks wisely.");
          ajouterLog("unlock", "✨ Purrks unlocked — spend your planks wisely.");
        }
      }
    } else {
      etat.scieriBloquee = true;
    }
  }

  // Processing: Pawsonry (pebbles → pebble bricks)
  if (etat.allocation.brickfactory > 0) {
    if (etat.pebbles >= 1) {
      etat.brickBloquee = false;
      const avant = etat.secondesPebbleBrickCumulees;
      etat.secondesPebbleBrickCumulees += etat.allocation.brickfactory * vitesse * TICK_DT;
      const pebblesCons = Math.floor(etat.secondesPebbleBrickCumulees / CONFIG.brickfactory.secondesParPebble)
                        - Math.floor(avant / CONFIG.brickfactory.secondesParPebble);
      if (pebblesCons > 0) etat.pebbles = Math.max(0, etat.pebbles - pebblesCons);
      const bricks = Math.floor(etat.secondesPebbleBrickCumulees / CONFIG.brickfactory.secondesParBrique);
      if (bricks > 0) {
        etat.pebbleBricks                += bricks;
        etat.secondesPebbleBrickCumulees -= bricks * CONFIG.brickfactory.secondesParBrique;
        afficherNotification("🪨 " + bricks + " pebble brick(s) produced!");
        ajouterLog("event", "🪨 " + bricks + " pebble brick(s) produced by the Pawsonry.");
      }
    } else {
      etat.brickBloquee = true;
    }
  }

  // Processing: Catchen (catnip → salads)
  if (etat.allocation.catchen > 0) {
    if (etat.catnip >= 1) {
      etat.catchenBloquee = false;
      const avant = etat.secondesSaladCumulees;
      etat.secondesSaladCumulees += etat.allocation.catchen * vitesse * TICK_DT;
      const catnipCons = Math.floor(etat.secondesSaladCumulees / CONFIG.catchen.secondesParCatnip)
                       - Math.floor(avant / CONFIG.catchen.secondesParCatnip);
      if (catnipCons > 0) etat.catnip = Math.max(0, etat.catnip - catnipCons);
      const salads = Math.floor(etat.secondesSaladCumulees / CONFIG.catchen.secondesParSalad);
      if (salads > 0) {
        etat.salads               += salads;
        etat.secondesSaladCumulees -= salads * CONFIG.catchen.secondesParSalad;
        afficherNotification("🥗 Salad ready!");
        ajouterLog("event", "🥗 Salad served by the Catchen.");
      }
    } else {
      etat.catchenBloquee = true;
    }
  }

  verifierObjectifs();
  rendu();
}

setInterval(tick, 100);
setInterval(sauvegarder, 30000);


// ════════════════════════════════════════════════════════════
// 11b. OFFLINE PROGRESS
// ════════════════════════════════════════════════════════════

const VITESSE_HORS_LIGNE  = 0.1;  // production catches up at 10% of real elapsed time
const ABSENCE_MIN_MS      = 60000; // ignore gaps shorter than 1 minute

// One simulated step of gathering/processing, no notifications/logs (used for offline catch-up)
function simulerTickHorsLigne(dt) {
  if (etat.cathouses.length > 0) {
    etat.reductionCumulee += etat.cathouses.length * reductionParCathouse() * dt;
  }

  tickGathering("woodcatting",      "cardboard",  "cardboardTotalRecolte",  "secondesCardboardCumulees",  CONFIG.woodcatting,      null, dt);
  tickGathering("basicWoodcatting", "basicWood",  "basicWoodTotalRecolte",  "secondesBasicWoodCumulees",  CONFIG.basicWoodcatting, null, dt);
  tickGathering("grasscatting",     "catnip",     "catnipTotalRecolte",     "secondesGrassCumulees",      CONFIG.grasscatting,     null, dt);
  tickGathering("pebblegathering", "pebbles", "pebblesTotalRecolte", "secondesPebbleCumulees", CONFIG.pebblegathering, null, dt);

  if (etat.allocation.sawmill > 0) {
    if (etat.cardboard >= 1) {
      etat.scieriBloquee = false;
      const avant = etat.secondesCardboardPlankCumulees;
      etat.secondesCardboardPlankCumulees += etat.allocation.sawmill * dt;
      const cardboardCons = Math.floor(etat.secondesCardboardPlankCumulees / CONFIG.sawmill.secondesParCardboard)
                          - Math.floor(avant / CONFIG.sawmill.secondesParCardboard);
      if (cardboardCons > 0) etat.cardboard = Math.max(0, etat.cardboard - cardboardCons);
      const planks = Math.floor(etat.secondesCardboardPlankCumulees / CONFIG.sawmill.secondesParPlanche);
      if (planks > 0) {
        etat.cardboardPlanks                += planks;
        etat.secondesCardboardPlankCumulees -= planks * CONFIG.sawmill.secondesParPlanche;
      }
    } else {
      etat.scieriBloquee = true;
    }
  }

  if (etat.allocation.brickfactory > 0) {
    if (etat.pebbles >= 1) {
      etat.brickBloquee = false;
      const avant = etat.secondesPebbleBrickCumulees;
      etat.secondesPebbleBrickCumulees += etat.allocation.brickfactory * dt;
      const pebblesCons = Math.floor(etat.secondesPebbleBrickCumulees / CONFIG.brickfactory.secondesParPebble)
                        - Math.floor(avant / CONFIG.brickfactory.secondesParPebble);
      if (pebblesCons > 0) etat.pebbles = Math.max(0, etat.pebbles - pebblesCons);
      const bricks = Math.floor(etat.secondesPebbleBrickCumulees / CONFIG.brickfactory.secondesParBrique);
      if (bricks > 0) {
        etat.pebbleBricks                += bricks;
        etat.secondesPebbleBrickCumulees -= bricks * CONFIG.brickfactory.secondesParBrique;
      }
    } else {
      etat.brickBloquee = true;
    }
  }

  if (etat.allocation.catchen > 0) {
    if (etat.catnip >= 1) {
      etat.catchenBloquee = false;
      const avant = etat.secondesSaladCumulees;
      etat.secondesSaladCumulees += etat.allocation.catchen * dt;
      const catnipCons = Math.floor(etat.secondesSaladCumulees / CONFIG.catchen.secondesParCatnip)
                       - Math.floor(avant / CONFIG.catchen.secondesParCatnip);
      if (catnipCons > 0) etat.catnip = Math.max(0, etat.catnip - catnipCons);
      const salads = Math.floor(etat.secondesSaladCumulees / CONFIG.catchen.secondesParSalad);
      if (salads > 0) {
        etat.salads                += salads;
        etat.secondesSaladCumulees -= salads * CONFIG.catchen.secondesParSalad;
      }
    } else {
      etat.catchenBloquee = true;
    }
  }
}

// Applies offline progress since the last save. Returns a summary object, or null if nothing to report.
function appliquerProgressionHorsLigne() {
  const maintenant   = Date.now();
  const ecouleReelMs = maintenant - (etat.dernierTimestamp || maintenant);
  if (ecouleReelMs < ABSENCE_MIN_MS) {
    etat.dernierTimestamp = maintenant;
    return null;
  }

  const avant = {
    cardboard: etat.cardboard, basicWood: etat.basicWood, catnip: etat.catnip, pebbles: etat.pebbles,
    cardboardPlanks: etat.cardboardPlanks, pebbleBricks: etat.pebbleBricks, salads: etat.salads,
    reductionCumulee: etat.reductionCumulee
  };

  const dtSimTotal = (ecouleReelMs / 1000) * VITESSE_HORS_LIGNE;
  const nbChunks    = Math.min(2000, Math.max(1, Math.ceil(dtSimTotal)));
  const tailleChunk = dtSimTotal / nbChunks;
  for (let i = 0; i < nbChunks; i++) simulerTickHorsLigne(tailleChunk);

  // The catch sequence cooldown runs on real wall-clock time already (tempsRestantSequence
  // reads Date.now() directly), now also benefiting from the cathouse reduction caught up above.
  let kittyAttrapeNom = null;
  if (etat.sequenceEnCours && tempsRestantSequence() <= 0) {
    kittyAttrapeNom = NOMS_KITTIES[etat.kittiesData.length] || ("Kitty #" + (etat.kittiesData.length + 1));
    etat.sequenceEnCours = false;
    etat.chatons        += 1;
    etat.clicCount      += 1;
    etat.kittiesData.push({ nom: kittyAttrapeNom, metier: null, niveau: 1, tier: 0, catchTs: maintenant });
    ajouterLog("event", "🐱 " + kittyAttrapeNom + " was caught while you were away!");
    verifierStoryModals();
  }

  etat.dernierTimestamp = maintenant;
  verifierObjectifs();
  sauvegarder();

  return {
    dureeReelleSec: ecouleReelMs / 1000,
    cardboard:       etat.cardboard      - avant.cardboard,
    basicWood:       etat.basicWood      - avant.basicWood,
    catnip:          etat.catnip         - avant.catnip,
    pebbles:         etat.pebbles        - avant.pebbles,
    cardboardPlanks: etat.cardboardPlanks - avant.cardboardPlanks,
    pebbleBricks:    etat.pebbleBricks   - avant.pebbleBricks,
    salads:          etat.salads         - avant.salads,
    kittyAttrape:    kittyAttrapeNom,
    reductionGagnee: etat.reductionCumulee - avant.reductionCumulee
  };
}

function afficherResumeAbsence(resume) {
  const conteneur = document.getElementById("absence-contenu");
  if (!conteneur) return;
  conteneur.innerHTML = "";

  function ligne(label, valeur) {
    const el = document.createElement("div");
    el.className = "absence-ligne";
    const lbl = document.createElement("span");
    lbl.textContent = label;
    const val = document.createElement("span");
    val.className   = "absence-val";
    val.textContent = valeur;
    el.appendChild(lbl);
    el.appendChild(val);
    conteneur.appendChild(el);
  }

  ligne("⏱ Time away", formaterTemps(resume.dureeReelleSec));

  const ressources = [
    ["📦 Cardboard",        resume.cardboard],
    ["🪵 Basic Wood",       resume.basicWood],
    ["🌿 Catnip",           resume.catnip],
    ["🪨 Pebbles",          resume.pebbles],
    ["📋 Cardboard Planks", resume.cardboardPlanks],
    ["🪨 Pebble Bricks",    resume.pebbleBricks],
    ["🥗 Salads",           resume.salads]
  ];
  let produit = false;
  ressources.forEach(function(r) {
    if (r[1] > 0) { ligne(r[0], "+" + formaterNombre(r[1])); produit = true; }
  });
  if (!produit) ligne("🐾 Production", "Nothing produced");

  if (resume.kittyAttrape) {
    ligne("🐱 New kitty", resume.kittyAttrape + " joined the gang!");
  } else if (resume.reductionGagnee > 0.5) {
    ligne("⏱ Cooldown reduced", "-" + formaterTemps(resume.reductionGagnee) + " (Cardboard Boxes)");
  }

  afficherModal("ecran-absence");
}


// ════════════════════════════════════════════════════════════
// 12. STORY MODALS
// ════════════════════════════════════════════════════════════

function fermerModal(id) { document.getElementById(id).style.display = "none"; }
function afficherModal(id) { document.getElementById(id).style.display = "flex"; }

function verifierStoryModals() {
  if (etat.chatons === 1 && !localStorage.getItem("story1Vue")) {
    localStorage.setItem("story1Vue", "1");
    afficherModal("ecran-story-1");
    ajouterLog("dialogue", [
      "Kid: \"Caught you kitty! Let's put you in our garden, you'll sure have lots of fun there!\"",
      "Kid: \"Another kitty in front of the house! Two won't make a lot of difference!\""
    ]);
  }
  if (etat.chatons === 2 && !localStorage.getItem("story2Vue")) {
    localStorage.setItem("story2Vue", "1");
    afficherModal("ecran-story-2");
    ajouterLog("dialogue", [
      "Kid: \"Phew, this one was harder to catch, but it seems there's another kitty across the street.\"",
      "Kid: \"I'll go get it as well — we can never have enough KITTIES!\""
    ]);
  }
}

document.getElementById("bouton-intro").addEventListener("click", function() {
  fermerModal("ecran-intro");
  localStorage.setItem("introVue", "1");
  ajouterLog("dialogue", [
    "Kid: \"Mom, look at that cute little cat. Can we keep it?\"",
    "Mom: \"Come on, the groceries won't put themselves away!\"",
    "Kid: \"I want a cat, I want a cat, I WANT A CAT.\"",
    "Mom: \"Fine, but you'll be the one taking care of it.\""
  ]);
});

if (!localStorage.getItem("introVue")) afficherModal("ecran-intro");


// ════════════════════════════════════════════════════════════
// 13. UI CONTROLS  (tabs · speed · panel toggles)
// ════════════════════════════════════════════════════════════

function changerOnglet(id) {
  ["gang", "work", "buildings", "purrks", "logs"].forEach(function(tab) {
    document.getElementById("contenu-" + tab).style.display  = id === tab ? "block" : "none";
    document.getElementById("onglet-" + tab).classList.toggle("onglet-actif", id === tab);
  });
}

function cyclerVitesse() {
  const idx = VITESSES.indexOf(vitesse);
  vitesse = VITESSES[(idx + 1) % VITESSES.length];
  const btn = document.getElementById("bouton-vitesse");
  btn.textContent = vitesse === 1 ? "1×" : "⚡ " + vitesse + "×";
  btn.classList.toggle("vitesse-active", vitesse > 1);
}

function toggleObjectifs() {
  const panneau = document.getElementById("panneau-objectifs");
  const btn     = document.getElementById("objectifs-toggle");
  btn.textContent = panneau.classList.toggle("reduit") ? "+" : "−";
}


// ════════════════════════════════════════════════════════════
// 14. INITIALIZATION
// ════════════════════════════════════════════════════════════

const partieExistante = charger();
const resumeAbsence    = partieExistante ? appliquerProgressionHorsLigne() : null;
rendu();
renduLogs();
renduObjectifs();
verifierObjectifs();
renduManagement();
if (resumeAbsence) afficherResumeAbsence(resumeAbsence);

if (window.matchMedia("(max-width: 768px)").matches) {
  document.getElementById("panneau-objectifs").classList.add("reduit");
  document.getElementById("objectifs-toggle").textContent = "+";
}

// Mobile browsers suspend timers (and even unload the tab) when backgrounded —
// catch up offline progress as soon as the tab becomes visible again, not just on full reload.
document.addEventListener("visibilitychange", function() {
  if (document.visibilityState === "hidden") {
    sauvegarder();
  } else if (document.visibilityState === "visible") {
    const resume = appliquerProgressionHorsLigne();
    rendu(); renduLogs(); renduObjectifs(); renduManagement();
    if (resume) afficherResumeAbsence(resume);
  }
});
