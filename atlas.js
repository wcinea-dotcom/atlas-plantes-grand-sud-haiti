(async function () {
  const status = document.getElementById("status");
  const list = document.getElementById("plants-list");
  const input = document.getElementById("search");

  if (!status || !list || !input) return;

  function safe(v) {
    return (v ?? "").toString();
  }

  function normalize(v) {
    return safe(v).toLowerCase();
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
      const maladies = safe(p.maladies || "");
      const systemes = safe(p.systemes_concernes || "");

      card.innerHTML = `
        <h3>${nomSci || id || "Plante"}</h3>
        ${nomFr ? `<p><b>Nom :</b> ${nomFr}</p>` : ""}
        ${famille ? `<p><b>Famille :</b> ${famille}</p>` : ""}
        ${systemes ? `<p><b>Systèmes :</b> ${systemes}</p>` : ""}
        ${maladies ? `<p><b>Maladies :</b> ${maladies}</p>` : ""}
      `;

      list.appendChild(card);
    });

    status.textContent = `${plants.length} plante(s) affichée(s)`;
  }

  let plants = [];

  try {
    const res = await fetch("/data/plants_index.json", { cache: "no-store" });
    if (!res.ok) throw new Error("plants_index.json introuvable");
    plants = await res.json();
    render(plants);
  } catch (e) {
    status.textContent =
      "Erreur : impossible de charger /data/plants_index.json. Vérifie que le fichier est bien dans GitHub à data/plants_index.json";
    console.error(e);
    return;
  }

  input.addEventListener("input", () => {
    const term = normalize(input.value);

    if (!term) {
      render(plants);
      return;
    }

    const filtered = plants.filter((p) => {
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
        .map(normalize)
        .join(" | ");

      return blob.includes(term);
    });

    render(filtered);
  });
})();
