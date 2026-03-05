(async function () {
  const status = document.getElementById("status");
  const list = document.getElementById("plants-list");
  const input = document.getElementById("search");

  const selFamille = document.getElementById("filter-famille");
  const selSystemes = document.getElementById("filter-systemes");
  const selMaladies = document.getElementById("filter-maladies");
  const btnClear = document.getElementById("clear-filters");

  function safe(v) {
    return (v ?? "").toString();
  }

  function normalize(v) {
    return safe(v).toLowerCase().trim();
  }

  function splitList(v) {
    // Supporte: "Digestif | Urinaire" ou "Digestif, Urinaire"
    const s = safe(v);
    if (!s) return [];
    return s
      .split(/[\|,]/g)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  function uniqueSorted(arr) {
    return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
  }

  function setOptions(selectEl, values) {
    selectEl.innerHTML = "";
    values.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      selectEl.appendChild(opt);
    });
  }

  function getSelected(selectEl) {
    return Array.from(selectEl.selectedOptions).map((o) => o.value);
  }

  function render(plants) {
    list.innerHTML = "";

    plants.forEach((p) => {
      const card = document.createElement("div");
      card.className = "plant-card";

      const id = safe(p.id || p.id_plante || "");
      const nomSci = safe(p.nom_scientifique || "");
      const nomFr = safe(p.nom_francais || "");
      const famille = safe(p.famille_fr || "");

      const systemes = safe(p.systemes_concernes || "");
      const maladies = safe(p.maladies || "");

      card.innerHTML = `
        <h3>${nomSci || id || "Plante"}</h3>
        ${nomFr ? `<p><b>Nom :</b> ${nomFr}</p>` : ""}
        ${famille ? `<p><b>Famille :</b> ${famille}</p>` : ""}
        ${systemes ? `<p><b>Systèmes :</b> ${systemes}</p>` : `<p><b>Systèmes :</b> -</p>`}
        ${maladies ? `<p><b>Maladies :</b> ${maladies}</p>` : `<p><b>Maladies :</b> -</p>`}
      `;

      list.appendChild(card);
    });

    status.textContent = `${plants.length} plante(s) affichée(s)`;
  }

  // --- Charger l’index ---
  let plants = [];
  try {
    const res = await fetch("/data/plants_index.json", { cache: "no-store" });
    if (!res.ok) throw new Error("plants_index.json introuvable");
    plants = await res.json();
  } catch (e) {
    if (status) {
      status.textContent =
        "Erreur : impossible de charger /data/plants_index.json. Vérifie que le fichier est bien dans GitHub à data/plants_index.json";
    }
    console.error(e);
    return;
  }

  // --- Construire les options des filtres depuis l’index ---
  if (selFamille && selSystemes && selMaladies) {
    const familles = uniqueSorted(
      plants.map((p) => safe(p.famille_fr)).filter(Boolean)
    );

    const systemes = uniqueSorted(
      plants.flatMap((p) => splitList(p.systemes_concernes))
    );

    const maladies = uniqueSorted(
      plants.flatMap((p) => splitList(p.maladies))
    );

    setOptions(selFamille, familles);
    setOptions(selSystemes, systemes);
    setOptions(selMaladies, maladies);
  }

  // --- Filtrer ---
  function applyFilters() {
    const term = normalize(input ? input.value : "");

    const selectedFamilles = selFamille ? getSelected(selFamille) : [];
    const selectedSystemes = selSystemes ? getSelected(selSystemes) : [];
    const selectedMaladies = selMaladies ? getSelected(selMaladies) : [];

    const filtered = plants.filter((p) => {
      // 1) Recherche texte globale
      if (term) {
        const blob = [
          p.id,
          p.id_plante,
          p.nom_scientifique,
          p.nom_francais,
          p.nom_creole,
          p.nom_anglais,
          p.famille_fr,
          p.genre,
          p.espece,
          p.maladies,
          p.systemes_concernes,
          p.tags_maladies,
          p.tags_systemes,
          p.tags_substances,
          p.tags_usages,
        ]
          .map((x) => normalize(x))
          .join(" | ");

        if (!blob.includes(term)) return false;
      }

      // 2) Famille (si au moins 1 sélectionnée)
      if (selectedFamilles.length > 0) {
        if (!selectedFamilles.includes(safe(p.famille_fr))) return false;
      }

      // 3) Systèmes (OU entre les systèmes sélectionnés)
      if (selectedSystemes.length > 0) {
        const pSys = splitList(p.systemes_concernes);
        const ok = selectedSystemes.some((s) => pSys.includes(s));
        if (!ok) return false;
      }

      // 4) Maladies (OU entre les maladies sélectionnées)
      if (selectedMaladies.length > 0) {
        const pMal = splitList(p.maladies);
        const ok = selectedMaladies.some((m) => pMal.includes(m));
        if (!ok) return false;
      }

      return true;
    });

    render(filtered);
  }

  // Events
  if (input) input.addEventListener("input", applyFilters);
  if (selFamille) selFamille.addEventListener("change", applyFilters);
  if (selSystemes) selSystemes.addEventListener("change", applyFilters);
  if (selMaladies) selMaladies.addEventListener("change", applyFilters);

  if (btnClear) {
    btnClear.addEventListener("click", () => {
      if (input) input.value = "";
      [selFamille, selSystemes, selMaladies].forEach((sel) => {
        if (!sel) return;
        Array.from(sel.options).forEach((o) => (o.selected = false));
      });
      applyFilters();
    });
  }

  // Premier rendu
  render(plants);
})();
