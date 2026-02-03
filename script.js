// Données des points d'intérêt
// Données des points d'intérêt
const poiData = {
    cabanon: {
        title: "LE CABANON",
        description: "Découvrez l'histoire de ce lieu emblématique."
    },
    huitre: {
        title: "PARCS À HUITRES",
        description: "Découvrez l'histoire de ce lieu emblématique."
    },
    quiz: {
        title: "LE JUSTE PRIX : DÉGUSTATION",
        question: "Quelle est la meilleure durée à attendre pour déguster une huître ?",
        options: [
            { id: 'A', text: "Jour 1", correct: false },
            { id: 'B', text: "Jour 2-3", correct: true },
            { id: 'C', text: "Jour 4-5", correct: false },
            { id: 'D', text: "Jour 6-7", correct: false }
        ],
        feedback: "L'huître est vivante ! Elle libère ses arômes et sa 'deuxième eau' optimale entre le 2ème et le 3ème jour."
    }
};

// Éléments DOM
const mapContainer = document.getElementById('map-container');
const mapWrapper = document.getElementById('map-wrapper');
const pinsContainer = document.getElementById('pins-container');
const navGreen = document.querySelector('.nav-green');
const navPink = document.querySelector('.nav-pink');
const listPanel = document.getElementById('list-panel');
const legalPanel = document.getElementById('legal-panel');
const popup = document.getElementById('popup');
const popupTitle = document.getElementById('popup-title');
const popupDescription = document.getElementById('popup-description');
const popupVideo = document.getElementById('popup-video');
const quizContainer = document.getElementById('quiz-container');
const quizOptions = document.getElementById('quiz-options');
const quizFeedback = document.getElementById('quiz-feedback');
const popupClose = document.getElementById('popup-close');
const closeListBtn = document.getElementById('close-list');
const closeLegalBtn = document.getElementById('close-legal');

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
let isLocked = true; // Verrouillage initial de la carte
let isBoatMoving = false; // Le bateau ne bouge pas au début

const smoothing = 0.05; // Plus petit = plus lent et fluide
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
function centerMap(smooth = false) {
    const containerWidth = mapContainer.offsetWidth;
    const containerHeight = mapContainer.offsetHeight;

    // Position du cabanon sur la carte (en pixels)
    const cabanonX = 1200 / 2000 * MAP_WIDTH;
    const cabanonY = 1350 / 2000 * MAP_HEIGHT;

    // Centrer la vue sur le cabanon
    targetX = -(cabanonX - containerWidth / 2);
    targetY = -(cabanonY - containerHeight / 2);

    // Appliquer les limites
    const limits = getLimits();
    targetX = Math.max(limits.minX, Math.min(limits.maxX, targetX));
    targetY = Math.max(limits.minY, Math.min(limits.maxY, targetY));

    // Si pas smooth (démarrage), on force la position actuelle tout de suite
    if (!smooth) {
        currentX = targetX;
        currentY = targetY;
    }
}

// Support du scroll à deux doigts (trackpad)
mapContainer.addEventListener('wheel', (e) => {
    if (isLocked) return; // Bloquer le scroll si verrouillé
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

    // Mise à jour de la mini-map
    updateMinimap();

    // Animation du bateau
    updateBoat();

    requestAnimationFrame(animate);
}

// ==========================================
// ANIMATION DU BATEAU
// ==========================================
const boat = document.getElementById('boat');
let boatProgress = 0;
let boatDirection = 1; // 1 = vers parc, -1 = vers cabanon
const boatSpeed = 0.0005; // Très lent

const points = {
    cabanon: { x: 1300, y: 1400 },
    parc: { x: 400, y: 400 }
};

function updateBoat() {
    if (!boat || !isBoatMoving) return;

    boatProgress += boatSpeed * boatDirection;

    if (boatProgress >= 1) {
        boatProgress = 1;
        boatDirection = -1;
    } else if (boatProgress <= 0) {
        boatProgress = 0;
        boatDirection = 1;
    }

    // Interpolation linéaire
    const x = points.cabanon.x + (points.parc.x - points.cabanon.x) * boatProgress;
    const y = points.cabanon.y + (points.parc.y - points.cabanon.y) * boatProgress;

    // Calcul de l'angle
    const angle = Math.atan2(points.parc.y - points.cabanon.y, points.parc.x - points.cabanon.x);
    let rotation = angle * (180 / Math.PI);

    // Si on rentre, on fait demi-tour
    if (boatDirection === -1) rotation += 180;

    boat.style.setProperty('--pin-x', x);
    boat.style.setProperty('--pin-y', y);
    boat.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
}


// Fonction pour mettre à jour la mini-map
function updateMinimap() {
    const minimapImage = document.getElementById('minimap-image');
    const minimapDot = document.getElementById('minimap-dot');

    if (!minimapImage || !minimapDot) return;

    // Calculer le vrai centre de l'écran visible (en tenant compte des sidebars)
    const sidebarLeftWidth = 140;
    const sidebarRightWidth = 140;
    const bottomNavHeight = 80;
    const visibleWidth = window.innerWidth - sidebarLeftWidth - sidebarRightWidth;
    const visibleHeight = window.innerHeight - bottomNavHeight;
    const screenCenterX = sidebarLeftWidth + visibleWidth / 2;
    const screenCenterY = visibleHeight / 2;
    const mapCenterX = -currentX + screenCenterX;
    const mapCenterY = -currentY + screenCenterY;

    // La carte de la mini-map reste fixe (remplit tout le conteneur)
    const minimapSize = 200;
    minimapImage.style.left = '0px';
    minimapImage.style.top = '0px';
    minimapImage.style.width = '100%';
    minimapImage.style.height = '100%';

    // Le point se déplace pour indiquer la position
    const dotX = (mapCenterX / MAP_WIDTH) * minimapSize;
    const dotY = (mapCenterY / MAP_HEIGHT) * minimapSize;

    minimapDot.style.left = dotX + 'px';
    minimapDot.style.top = dotY + 'px';
}

centerMap();
animate();

// Gestion du déplacement de la carte - DÉSACTIVÉ
/*
mapContainer.addEventListener('mousedown', (e) => {
    if (e.target.closest('.pin')) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    velocityX = 0;
    velocityY = 0;
    mapContainer.style.cursor = "url('cursor.svg') 16 18, auto";
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
        mapContainer.style.cursor = "url('cursor.svg') 16 18, auto";
    }
});
*/

// Gestion des clics sur les pins
document.querySelectorAll('.pin').forEach(pin => {
    pin.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = pin.dataset.id;
        if (id) {
            showPopup(id);
        }
    });
});

// Gestion du clic sur le cabanon
const cabanon = document.querySelector('.cabanon');
if (cabanon) {
    cabanon.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();

        // Supprimé le déverrouillage immédiat ici pour attendre la fermeture de la popup
        /*
        if (isLocked) {
            isLocked = false;
            const onboardingBox = document.getElementById('onboarding-box');
            if (onboardingBox) onboardingBox.classList.add('hidden');
        }
        */

        const data = poiData.cabanon;
        if (data) {
            showPopup('cabanon');
        }
    });

    // Empêcher le drag sur le cabanon
    cabanon.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });
}

// Gestion des clics sur les items de la liste
document.querySelectorAll('.list-item').forEach(item => {
    item.addEventListener('click', () => {
        const id = item.dataset.id;
        if (id) {
            showPopup(id);
        }
    });
});

// Afficher la popup
function showPopup(id) {
    const data = poiData[id];
    if (!data) return;

    popupTitle.textContent = data.title;

    // Reset display
    if (popupVideo) popupVideo.classList.add('hidden');
    if (quizContainer) quizContainer.classList.add('hidden');
    if (popupDescription) popupDescription.classList.add('hidden');
    if (quizFeedback) quizFeedback.classList.add('hidden');
    if (quizOptions) quizOptions.innerHTML = '';

    if (id === 'quiz') {
        quizContainer.classList.remove('hidden');
        popupTitle.textContent = data.title; // "LE JUSTE PRIX : DÉGUSTATION"
        popupDescription.textContent = data.question; // La question
        popupDescription.classList.remove('hidden');

        data.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.textContent = `${opt.id}: ${opt.text}`;
            btn.onclick = () => handleQuizAnswer(btn, opt.correct, data.feedback);
            quizOptions.appendChild(btn);
        });
    } else {
        if (popupVideo) popupVideo.classList.remove('hidden');
        popupTitle.textContent = data.title;
        popupDescription.textContent = data.description;
        popupDescription.classList.remove('hidden');
    }

    popup.classList.remove('hidden');

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'overlay';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', closePopup);
}

function handleQuizAnswer(button, isCorrect, feedbackText) {
    // Disable all buttons
    const buttons = quizOptions.querySelectorAll('.quiz-option');
    buttons.forEach(btn => btn.disabled = true);

    if (isCorrect) {
        button.classList.add('correct');
    } else {
        button.classList.add('incorrect');
        // Show correct answer too
        const options = poiData.quiz.options;
        const correctIndex = options.findIndex(o => o.correct);
        buttons[correctIndex].classList.add('correct');
    }

    quizFeedback.textContent = feedbackText;
    quizFeedback.classList.remove('hidden');
}

// Fermer la popup
function closePopup() {
    popup.classList.add('hidden');
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.remove();
    }

    // Suite onboarding : déverrouiller la carte et lancer le bateau
    if (isLocked) {
        isLocked = false;
        isBoatMoving = true;
        const onboardingBox = document.getElementById('onboarding-box');
        if (onboardingBox) {
            onboardingBox.textContent = "le bateau se rend vers le parc à huitre, cliquez dessus pour suivre son trajet.";
            onboardingBox.classList.remove('hidden'); // S'assurer qu'il est visible
        }
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
        if (!legalPanel.classList.contains('hidden')) {
            legalPanel.classList.add('hidden');
        }
    });
}

// Gestion du bouton "Mentions légales"
if (navPink) {
    navPink.addEventListener('click', () => {
        legalPanel.classList.toggle('hidden');
        if (!listPanel.classList.contains('hidden')) {
            listPanel.classList.add('hidden');
        }
    });
}

// Gestion du bouton "CARTE" (Centrer la carte)
const btnCarte = document.getElementById('btn-carte');
if (btnCarte) {
    btnCarte.addEventListener('click', () => {
        centerMap(true);
        // Optionnel : fermer les autres panneaux si ouverts
        listPanel.classList.add('hidden');
        closePopup();
    });
}

// Fermer la liste
if (closeListBtn) {
    closeListBtn.addEventListener('click', () => {
        listPanel.classList.add('hidden');
    });
}

// Fermer les mentions légales
if (closeLegalBtn) {
    closeLegalBtn.addEventListener('click', () => {
        legalPanel.classList.add('hidden');
    });
}

// Fermer les panneaux au clic en dehors
document.addEventListener('click', (e) => {
    // Pour le panneau Mentions Légales
    if (!legalPanel.classList.contains('hidden') &&
        !legalPanel.contains(e.target) &&
        (navPink && !navPink.contains(e.target))) {
        legalPanel.classList.add('hidden');
    }

    // Pour le panneau Tous les médias (optionnel mais cohérent)
    if (!listPanel.classList.contains('hidden') &&
        !listPanel.contains(e.target) &&
        (navGreen && !navGreen.contains(e.target))) {
        listPanel.classList.add('hidden');
    }
});

// Support tactile - DÉSACTIVÉ
/*
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
*/

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
        // OPTIMISATION : Calcule d'abord la distance sans racine carrée
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;

        // Si la particule est loin de la souris (> 250px) ET qu'elle est déjà à sa place
        // On ne fait RIEN (pas de calcul, pas d'accès DOM = énorme gain de perf)
        if (Math.abs(dx) > 250 || Math.abs(dy) > 250) {
            if (this.x === this.baseX && this.y === this.baseY) {
                return;
            }
        }

        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 60; // Rayon du "trou" réduit

        // Calcul de la position cible (positions de base)
        const baseDx = this.baseX - this.x;
        const baseDy = this.baseY - this.y;

        // Force de retour vers la position d'origine
        let returnForceX = baseDx * 0.1;
        let returnForceY = baseDy * 0.1;

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

        // On arrondit pour éviter les micro-mouvements sub-pixel inutiles et stabiliser
        if (Math.abs(this.x - this.baseX) < 0.1) this.x = this.baseX;
        if (Math.abs(this.y - this.baseY) < 0.1) this.y = this.baseY;

        this.element.setAttribute('cx', this.x);
        this.element.setAttribute('cy', this.y);
    }
}

function spawnParticles() {
    svgContainer = document.getElementById('bg-particles');
    if (!svgContainer) return;

    while (svgContainer.firstChild) {
        svgContainer.removeChild(svgContainer.firstChild);
    }

    particles = [];
    const blueColor = '#29abe2';

    // Grille pour couvrir toute la carte (le masque SVG s'occupe de cacher la terre)
    // gridStep 18 pour être assez dense pour les petits bassins
    const gridStep = 18;

    for (let y = 0; y < MAP_HEIGHT; y += gridStep) {
        for (let x = 0; x < MAP_WIDTH; x += gridStep) {
            particles.push(new Particle(x, y, 2.5, blueColor));
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
        // Le scan pixel est désactivé car on utilise le masquage SVG (plus fiable)
        spawnParticles();
    };

    imgInfo.onerror = function () {
        console.error("Erreur chargement map.svg");
        spawnParticles();
    }
}

let frameCount = 0;

function animateSVG() {
    // OPTIMISATION : On retire le frameCount pour la fluidité (revert de la demande "tous les points hyper lents")
    // Le distance check suffit à alléger le CPU.
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
    }
    requestAnimationFrame(animateSVG);
}

window.addEventListener('load', () => {
    setTimeout(initSVGParticles, 100);
});
