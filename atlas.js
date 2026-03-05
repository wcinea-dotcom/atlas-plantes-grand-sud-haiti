async function loadPlants() {

const response = await fetch('/data/plants_index.json')
const plants = await response.json()

displayPlants(plants)

setupSearch(plants)

}

function displayPlants(plants){

const container = document.getElementById("plants-list")
container.innerHTML = ""

plants.forEach(p => {

const card = document.createElement("div")

card.innerHTML = `
<div class="plant-card">
<h3>${p.nom_scientifique || p.id}</h3>
<p>${p.nom_francais || ""}</p>
<p><b>Famille :</b> ${p.famille_fr || ""}</p>
<a href="/plante.html?id=${p.id}">Voir fiche</a>
</div>
`

container.appendChild(card)

})

}

function setupSearch(plants){

const input = document.getElementById("search")

input.addEventListener("input", e => {

const term = e.target.value.toLowerCase()

const filtered = plants.filter(p =>

(p.nom_scientifique || "").toLowerCase().includes(term) ||
(p.nom_francais || "").toLowerCase().includes(term) ||
(p.famille_fr || "").toLowerCase().includes(term)

)

displayPlants(filtered)

})

}

loadPlants()
