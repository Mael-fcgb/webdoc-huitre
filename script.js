// Données des points d'intérêt
const poiData = {
    castle: {
        title: "Château de Valdoria",
        description: "Ancienne forteresse construite au XIIe siècle, le Château de Valdoria domine la vallée depuis plus de 800 ans. Ses murailles ont résisté à de nombreux sièges et abritent aujourd'hui un musée d'histoire médiévale."
    },
    village: {
        title: "Village de Miraflor",
        description: "Charmant village de pêcheurs et d'artisans, Miraflor est célèbre pour son marché hebdomadaire et ses maisons colorées. La population locale perpétue des traditions ancestrales de tissage et de poterie."
    },
    port: {
        title: "Port de Marévent",
        description: "Principal port commercial de la région, Marévent voit passer des navires du monde entier. C'est ici que les explorateurs partaient jadis à la découverte de nouvelles terres."
    },
    temple: {
        title: "Temple des Anciens",
        description: "Situé sur l'île mystérieuse de Lunara, ce temple millénaire est dédié aux divinités de la mer et du ciel. Les ruines recèlent encore de nombreux secrets à découvrir."
    },
    forest: {
        title: "Forêt d'Émeraude",
        description: "Cette forêt dense et luxuriante abrite une biodiversité exceptionnelle. On raconte que des créatures magiques s'y cachent et que certains arbres auraient plus de mille ans."
    },
    treasure: {
        title: "Île au Trésor",
        description: "Selon la légende, un pirate nommé Barbe-Rouge aurait enterré son trésor sur cette île il y a 300 ans. De nombreux chercheurs de fortune ont tenté leur chance... en vain."
    }
};

// Éléments DOM
const mapContainer = document.getElementById('map-container');
const mapWrapper = document.getElementById('map-wrapper');
const pinsContainer = document.getElementById('pins-container');
const popup = document.getElementById('popup');
const popupTitle = document.getElementById('popup-title');
const popupDescription = document.getElementById('popup-description');
const popupClose = document.getElementById('popup-close');
const listPanel = document.getElementById('list-panel');
const closeListBtn = document.getElementById('close-list');
const navGreen = document.querySelector('.nav-green');

// Dimensions du SVG (zoomé)
const MAP_WIDTH = 3000;
const MAP_HEIGHT = 3000;

// Variables pour le drag
let isDragging = false;
let startX, startY;
let currentX = 0;
let currentY = 0;
let targetX = currentX;
let targetY = currentY;
let velocityX = 0;
let velocityY = 0;

const smoothing = 0.15;
const friction = 0.85;

// Fonction pour calculer les limites
function getLimits() {
    const containerWidth = mapContainer.offsetWidth;
    const containerHeight = mapContainer.offsetHeight;

    let minX = Math.min(0, containerWidth - MAP_WIDTH);
    let minY = Math.min(0, containerHeight - MAP_HEIGHT - 50);
    let maxX = 0;
    let maxY = 0;

    return { minX, minY, maxX, maxY };
}

// Centrer la carte au démarrage
function centerMap() {
    const limits = getLimits();
    currentX = limits.minX / 2;
    currentY = limits.minY / 2;
    targetX = currentX;
    targetY = currentY;
}

// Support du scroll à deux doigts (trackpad)
mapContainer.addEventListener('wheel', (e) => {
    e.preventDefault();

    const limits = getLimits();

    targetX -= e.deltaX;
    targetY -= e.deltaY;

    targetX = Math.max(limits.minX, Math.min(limits.maxX, targetX));
    targetY = Math.max(limits.minY, Math.min(limits.maxY, targetY));
}, { passive: false });

// Animation loop
function animate() {
    currentX += (targetX - currentX) * smoothing;
    currentY += (targetY - currentY) * smoothing;

    const limits = getLimits();

    if (!isDragging) {
        targetX += velocityX;
        targetY += velocityY;
        velocityX *= friction;
        velocityY *= friction;

        targetX = Math.max(limits.minX, Math.min(limits.maxX, targetX));
        targetY = Math.max(limits.minY, Math.min(limits.maxY, targetY));
    }

    mapWrapper.style.left = currentX + 'px';
    mapWrapper.style.top = currentY + 'px';
    pinsContainer.style.left = currentX + 'px';
    pinsContainer.style.top = currentY + 'px';

    requestAnimationFrame(animate);
}

centerMap();
animate();

// Gestion du déplacement de la carte
mapContainer.addEventListener('mousedown', (e) => {
    if (e.target.closest('.pin')) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    velocityX = 0;
    velocityY = 0;
    mapContainer.style.cursor = 'grabbing';
});

let lastMouseX = 0;
let lastMouseY = 0;

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    velocityX = (e.clientX - lastMouseX) * 0.3;
    velocityY = (e.clientY - lastMouseY) * 0.3;

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    let newX = currentX + deltaX;
    let newY = currentY + deltaY;

    const limits = getLimits();
    targetX = Math.max(limits.minX, Math.min(limits.maxX, newX));
    targetY = Math.max(limits.minY, Math.min(limits.maxY, newY));

    startX = e.clientX;
    startY = e.clientY;
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        mapContainer.style.cursor = 'grab';
    }
});

// Gestion des clics sur les pins
document.querySelectorAll('.pin').forEach(pin => {
    pin.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = pin.dataset.id;
        const data = poiData[id];

        if (data) {
            showPopup(data.title, data.description);
        }
    });
});

// Gestion des clics sur les items de la liste
document.querySelectorAll('.list-item').forEach(item => {
    item.addEventListener('click', () => {
        const id = item.dataset.id;
        const data = poiData[id];

        if (data) {
            showPopup(data.title, data.description);
        }
    });
});

// Afficher la popup
function showPopup(title, description) {
    popupTitle.textContent = title;
    popupDescription.textContent = description;
    popup.classList.remove('hidden');

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'overlay';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', closePopup);
}

// Fermer la popup
function closePopup() {
    popup.classList.add('hidden');
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.remove();
    }
}

popupClose.addEventListener('click', closePopup);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePopup();
        listPanel.classList.add('hidden');
    }
});

// Gestion du bouton "Tous les médias"
if (navGreen) {
    navGreen.addEventListener('click', () => {
        listPanel.classList.toggle('hidden');
    });
}

// Fermer la liste
if (closeListBtn) {
    closeListBtn.addEventListener('click', () => {
        listPanel.classList.add('hidden');
    });
}

// Support tactile
let lastTouchX = 0;
let lastTouchY = 0;

mapContainer.addEventListener('touchstart', (e) => {
    if (e.target.closest('.pin')) return;
    isDragging = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    lastTouchX = startX;
    lastTouchY = startY;
    velocityX = 0;
    velocityY = 0;
});

document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;

    const deltaX = e.touches[0].clientX - startX;
    const deltaY = e.touches[0].clientY - startY;

    velocityX = (e.touches[0].clientX - lastTouchX) * 0.3;
    velocityY = (e.touches[0].clientY - lastTouchY) * 0.3;

    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;

    let newX = currentX + deltaX;
    let newY = currentY + deltaY;

    const limits = getLimits();
    targetX = Math.max(limits.minX, Math.min(limits.maxX, newX));
    targetY = Math.max(limits.minY, Math.min(limits.maxY, newY));

    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});

document.addEventListener('touchend', () => {
    if (isDragging) {
        isDragging = false;
    }
});

window.addEventListener('resize', () => {
    const limits = getLimits();
    targetX = Math.max(limits.minX, Math.min(limits.maxX, targetX));
    targetY = Math.max(limits.minY, Math.min(limits.maxY, targetY));
});

const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('.list-row');

        rows.forEach(row => {
            const title = row.querySelector('.row-title').textContent.toLowerCase();
            if (title.includes(searchTerm)) {
                row.style.display = 'flex';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

// ==========================================
// PARTICULES ÉTAPE 5 : GRILLE + HARD REPULSION + FALLBACK
// ==========================================

let svgContainer;
let particles = [];
let mouse = { x: -9999, y: -9999 };
const ns = "http://www.w3.org/2000/svg";

window.addEventListener('mousemove', (e) => {
    if (!svgContainer) svgContainer = document.getElementById('bg-particles');
    if (!svgContainer) return;

    const rect = svgContainer.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

class Particle {
    constructor(x, y, radius, color) {
        this.baseX = x;
        this.baseY = y;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.density = (Math.random() * 30) + 1;

        this.element = document.createElementNS(ns, 'circle');
        this.element.setAttribute('r', radius);
        this.element.setAttribute('cx', x);
        this.element.setAttribute('cy', y);
        this.element.setAttribute('fill', color);

        svgContainer.appendChild(this.element);
    }

    update() {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 60; // Rayon du "trou" réduit

        // Calcul de la position cible (positions de base)
        const baseDx = this.baseX - this.x;
        const baseDy = this.baseY - this.y;

        // Force de retour vers la position d'origine
        let returnForceX = baseDx * 0.05;
        let returnForceY = baseDy * 0.05;

        // Force de répulsion (souris)
        let pushForceX = 0;
        let pushForceY = 0;

        if (distance < maxDistance) {
            // "Hard" repulsion : on veut éjecter le point hors du cercle
            const force = (maxDistance - distance) / maxDistance;

            // On pousse très fort pour créer le vide
            // L'exponentielle permet d'avoir un bord très net (mur)
            const strength = Math.pow(force, 2) * 50;

            pushForceX = -(dx / distance) * strength;
            pushForceY = -(dy / distance) * strength;
        }

        // Application des forces
        this.x += returnForceX + pushForceX;
        this.y += returnForceY + pushForceY;

        this.element.setAttribute('cx', this.x);
        this.element.setAttribute('cy', this.y);
    }
}

function spawnParticles(pixelData) {
    svgContainer = document.getElementById('bg-particles');
    if (!svgContainer) return;

    while (svgContainer.firstChild) {
        svgContainer.removeChild(svgContainer.firstChild);
    }

    particles = [];
    const blueColor = '#29abe2';

    // Grille régulière
    const gridStep = 18;

    // On parcourt la grille
    for (let y = 0; y < MAP_HEIGHT; y += gridStep) {
        for (let x = 0; x < MAP_WIDTH; x += gridStep) {

            let isWater = true;

            if (pixelData) {
                const index = (Math.floor(y) * MAP_WIDTH + Math.floor(x)) * 4;
                const r = pixelData[index];
                const b = pixelData[index + 2];
                const a = pixelData[index + 3];

                // Si on a de la donnée
                if (a > 50) {
                    if (r > b) {
                        isWater = false;
                    }
                } else if (!a) {
                    // transparent ou non chargé -> on ignore
                    // Sauf si on veut absolument remplir les trous
                }
            } else {
                isWater = false;
            }

            if (isWater) {
                const size = 4;
                particles.push(new Particle(x, y, size, blueColor));
            }
        }
    }

    // FALLBACK : Si 0 particule (bug scan), on remplit tout
    if (particles.length === 0) {
        console.warn("Scan pixel échoué. Mode Fallback activé.");
        for (let y = 0; y < MAP_HEIGHT; y += gridStep) {
            for (let x = 0; x < MAP_WIDTH; x += gridStep) {
                particles.push(new Particle(x, y, 4, blueColor));
            }
        }
    }

    console.log(`Particles spawned: ${particles.length}`);
    animateSVG();
}

function initSVGParticles() {
    svgContainer = document.getElementById('bg-particles');
    // Suppression de la rotation CSS qui décalait tout par rapport à la carte
    // On garde le conteneur neutre.

    const imgInfo = new Image();
    imgInfo.src = 'map.svg?' + new Date().getTime();

    // CROSS-ORIGIN : IMPORTANT si on charge depuis localhost vers canvas
    imgInfo.crossOrigin = "Anonymous";

    imgInfo.onload = function () {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = MAP_WIDTH;
        offCanvas.height = MAP_HEIGHT;
        const offCtx = offCanvas.getContext('2d');

        try {
            offCtx.drawImage(imgInfo, 0, 0, MAP_WIDTH, MAP_HEIGHT);
            const imageData = offCtx.getImageData(0, 0, MAP_WIDTH, MAP_HEIGHT);
            spawnParticles(imageData.data);
        } catch (e) {
            console.error("Erreur sampling map", e);
            spawnParticles(null); // Déclenchera le fallback
        }
    };

    imgInfo.onerror = function () {
        console.error("Erreur chargement map.svg");
        spawnParticles(null); // Déclenchera le fallback
    }
}

function animateSVG() {
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
    }
    requestAnimationFrame(animateSVG);
}

window.addEventListener('load', () => {
    setTimeout(initSVGParticles, 100);
});
