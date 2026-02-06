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
    boat: {
        title: "LE BATEAU",
        description: "Suivez le trajet du bateau vers les parcs à huîtres."
    },
    quiz: {
        title: "LE JUSTE PRIX : DÉGUSTATION",
        question: "Pour vous c'est combien l'attente conseillée pour manger une huître qui sort du bassin ?",
        options: [
            { id: 'A', text: "1 jour", correct: false },
            { id: 'B', text: "2-3 jours", correct: true },
            { id: 'C', text: "4-5 jours", correct: false },
            { id: 'D', text: "6-7 jours", correct: false }
        ],
        feedback: "L'huître est vivante ! Elle libère ses arômes et sa 'deuxième eau' optimale entre le 2ème et le 3ème jour."
    },
    quizVersPlats: {
        title: "DANGER : VERS PLATS",
        question: "Les gars je viens d'apprendre l'existence des vers plats, vous savez ce que c'est ?",
        options: [
            { id: 'A', text: "Un type d'huitre", correct: false },
            { id: 'B', text: "Une maladie", correct: false },
            { id: 'C', text: "Un parasite", correct: true },
            { id: 'D', text: "Un plat", correct: false }
        ],
        feedback: "C'est un parasite redoutable ! Il s'introduit dans l'huître et la dévore de l'intérieur."
    }
};

let currentMessengerQuizId = 'quiz'; // 'quiz' ou 'quizVersPlats'

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

// Éléments Intro
const cinematicOverlay = document.getElementById('cinematic-overlay');
const introVideo = document.getElementById('intro-video');
const skipIntroBtn = document.getElementById('skip-intro');
const playIntroBtn = document.getElementById('play-intro-btn');

// Fonction pour démarrer le site
function startSite() {
    if (cinematicOverlay) {
        cinematicOverlay.style.display = 'none';
        if (introVideo) {
            introVideo.pause();
            introVideo.currentTime = 0; // Optionnel : reset
        }
    }
}

// Gestion de l'intro
if (introVideo) {
    // On essaye de jouer avec le son
    const playVideo = () => {
        const playPromise = introVideo.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Vidéo lancée avec succès
                if (cinematicOverlay) cinematicOverlay.onclick = null;
                if (playIntroBtn) playIntroBtn.classList.add('hidden');
            }).catch(error => {
                console.warn("Autoplay bloqué. En attente d'un clic.");
                // Optionnel : on pourrait montrer un bouton ou un texte ici
            });
        }
    };

    playVideo();

    // Fallback : au premier clic sur l'overlay, on essaye de lancer
    if (cinematicOverlay) {
        cinematicOverlay.style.cursor = 'pointer';
        cinematicOverlay.onclick = () => {
            playVideo();
        };
    }

    // Quand la vidéo finit
    introVideo.onended = startSite;
}

if (skipIntroBtn) {
    skipIntroBtn.onclick = startSite;
}

if (playIntroBtn) {
    playIntroBtn.onclick = () => {
        const playVideo = () => {
            const playPromise = introVideo.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    if (cinematicOverlay) cinematicOverlay.onclick = null;
                    if (playIntroBtn) playIntroBtn.classList.add('hidden');
                }).catch(error => {
                    console.warn("Play manual bloqué.");
                });
            }
        };
        playVideo();
    };
}

// Éléments Messenger
const messengerNotif = document.getElementById('messenger-notification');
const messengerContainer = document.getElementById('messenger-container');
const messengerChat = document.getElementById('messenger-chat');
const messengerOptions = document.getElementById('messenger-options');
const closeMessengerBtn = document.getElementById('close-messenger');

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
let boatPos = { x: 1950, y: 2100 }; // Position initiale du bateau (Cabanon en base 3000)

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
let boatProgress = 0.12; // Un peu plus loin du cabanon (12% du trajet)
let boatDirection = 1; // 1 = vers parc, -1 = vers cabanon
const boatSpeed = 0.0005; // Très lent

const points = {
    cabanon: { x: 1300, y: 1400 },
    parc: { x: 400, y: 400 }
};

// Variables pour la nouvelle manœuvre
let boatState = 'moving'; // 'moving', 'waiting', 'turning'
let boatWaitStartTime = 0;
let boatRotationOffset = 0; // Rotation supplémentaire pendant le demi-tour (0 à 180)
const BOAT_WAIT_MS = 5000;
const BOAT_TURN_SPEED = 1; // Degrés par frame (pour un demi-tour en ~3s à 60fps)

function updateBoat() {
    if (!boat) return;

    // Calcul de la distance totale pour les 200px d'arrêt
    const dx = points.parc.x - points.cabanon.x;
    const dy = points.parc.y - points.cabanon.y;
    const totalDist2000 = Math.sqrt(dx * dx + dy * dy);
    // 200px en base 3000 => 133.3 en base 2000
    const stopProgressRange = 133.3 / totalDist2000;

    if (isBoatMoving) {
        if (boatState === 'moving') {
            boatProgress += boatSpeed * boatDirection;

            // Vérification des points d'arrêt
            if (boatDirection === 1 && boatProgress >= (1 - stopProgressRange)) {
                boatProgress = 1 - stopProgressRange;
                boatState = 'waiting';
                boatWaitStartTime = Date.now();
            } else if (boatDirection === -1 && boatProgress <= stopProgressRange) {
                boatProgress = stopProgressRange;
                boatState = 'waiting';
                boatWaitStartTime = Date.now();
            }
        } else if (boatState === 'waiting') {
            if (Date.now() - boatWaitStartTime >= BOAT_WAIT_MS) {
                boatState = 'turning';
                boatRotationOffset = 0;
            }
        } else if (boatState === 'turning') {
            boatRotationOffset += BOAT_TURN_SPEED;
            if (boatRotationOffset >= 180) {
                boatRotationOffset = 180;
                boatDirection *= -1; // On inverse la direction
                boatState = 'moving';
                boatRotationOffset = 0; // On reset pour le prochain tour
            }
        }
    }

    // Interpolation de position
    const x = points.cabanon.x + (points.parc.x - points.cabanon.x) * boatProgress;
    const y = points.cabanon.y + (points.parc.y - points.cabanon.y) * boatProgress;

    // Calcul de l'angle de base (cabanon vers parc)
    const baseAngle = Math.atan2(points.parc.y - points.cabanon.y, points.parc.x - points.cabanon.x) * (180 / Math.PI);

    // Rotation finale
    // Si boatState == 'turning', on ajoute le décalage progressif à l'orientation actuelle
    let rotation = baseAngle + (boatDirection === -1 ? 180 : 0);

    if (boatState === 'turning') {
        // Si on tournait vers le parc, on part de baseAngle et on va vers baseAngle + 180
        // Si on tournait vers la cabane, on part de baseAngle + 180 et on va vers baseAngle + 360
        rotation += boatRotationOffset;
    }

    // Ajustement de l'offset SVG (+90)
    rotation += 90;

    boat.style.setProperty('--pin-x', x);
    boat.style.setProperty('--pin-y', y);
    boat.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;

    // Mettre à jour boatPos pour les particules et la mini-map (base 3000)
    boatPos.x = (x / 2000) * MAP_WIDTH;
    boatPos.y = (y / 2000) * MAP_HEIGHT;
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

    // Mettre à jour les points d'intérêt sur la mini-map
    const pins = document.querySelectorAll('.pin:not(.boat)');
    pins.forEach(pin => {
        let dotId = '';
        if (pin.classList.contains('cabanon')) dotId = 'minimap-dot-cabanon';
        else if (pin.classList.contains('huitre')) dotId = 'minimap-dot-huitre';

        const dot = document.getElementById(dotId);
        if (dot) {
            // Récupérer les coordonnées CSS (base 2000)
            const pinX = parseFloat(getComputedStyle(pin).getPropertyValue('--pin-x'));
            const pinY = parseFloat(getComputedStyle(pin).getPropertyValue('--pin-y'));

            // Convertir base 2000 -> base 3000 (MAP_WIDTH/HEIGHT) -> Minimap
            // (pinX / 2000 * MAP_WIDTH) / MAP_WIDTH * minimapSize  = (pinX / 2000) * minimapSize
            const minimapX = (pinX / 2000) * minimapSize;
            const minimapY = (pinY / 2000) * minimapSize;

            dot.style.left = minimapX + 'px';
            dot.style.top = minimapY + 'px';
        }
    });

    // Mettre à jour le point du bateau sur la mini-map
    const boatDot = document.getElementById('minimap-boat-dot');
    if (boatDot) {
        // boatPos est déjà en base 3000 (MAP_WIDTH/HEIGHT)
        const boatMinimapX = (boatPos.x / MAP_WIDTH) * minimapSize;
        const boatMinimapY = (boatPos.y / MAP_HEIGHT) * minimapSize;
        boatDot.style.left = boatMinimapX + 'px';
        boatDot.style.top = boatMinimapY + 'px';
    }
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
document.querySelectorAll('.pin, .boat').forEach(pin => {
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
        if (id === 'quiz') {
            // Pour le quiz, on ouvre la messagerie
            if (typeof openMessenger === 'function') {
                openMessenger();
                if (listPanel) listPanel.classList.add('hidden');
            }
        } else if (id) {
            showPopup(id);
        }
    });
});

let activePopupId = null;

// Afficher la popup
function showPopup(id) {
    activePopupId = id;
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

    // Suite onboarding : Déclenchement Messenger ou Bateau
    if (isLocked && activePopupId === 'cabanon') {
        isLocked = false;
        const onboardingBox = document.getElementById('onboarding-box');
        if (onboardingBox) onboardingBox.classList.add('hidden');

        // Au lieu de lancer le bateau direct, on lance la notif de Manon
        setTimeout(triggerMessengerNotification, 1000);
    } else if (activePopupId === 'boat') {
        // Arrivée au parc à huitres
        boatProgress = 1; // Position finale (ou presque, selon stopProgressRange)
        isBoatMoving = false;

        // Centrer la carte sur le parc à huitres
        const containerWidth = mapContainer.offsetWidth;
        const containerHeight = mapContainer.offsetHeight;
        const parcX = points.parc.x / 2000 * MAP_WIDTH;
        const parcY = points.parc.y / 2000 * MAP_HEIGHT;

        targetX = -(parcX - containerWidth / 2);
        targetY = -(parcY - containerHeight / 2);

        // Appliquer les limites
        const limits = getLimits();
        targetX = Math.max(limits.minX, Math.min(limits.maxX, targetX));
        targetY = Math.max(limits.minY, Math.min(limits.maxY, targetY));

        // Cacher la box onboarding du bateau
        const onboardingBox = document.getElementById('onboarding-box');
        if (onboardingBox) onboardingBox.classList.add('hidden');

        // Déclencher la DEUXIÈME notification Messenger
        currentMessengerQuizId = 'quizVersPlats';
        setTimeout(triggerMessengerNotification, 2000);
    } else if (isLocked) {
        // Fallback si c'est pas le cabanon (ne devrait pas arriver en onboarding normal)
        isLocked = false;
        isBoatMoving = true;
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
        // OPTIMISATION : Calcule d'abord les distances simplifiées
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;

        const bdx = boatPos ? (boatPos.x - this.x) : 9999;
        const bdy = boatPos ? (boatPos.y - this.y) : 9999;

        // On ne fait rien si loin de tout
        if (Math.abs(dx) > 250 && Math.abs(dy) > 250 && Math.abs(bdx) > 250 && Math.abs(bdy) > 250) {
            if (this.x === this.baseX && this.y === this.baseY) {
                return;
            }
        }

        const distance = Math.sqrt(dx * dx + dy * dy);
        const boatDistance = Math.sqrt(bdx * bdx + bdy * bdy);

        const maxDistance = 60;
        const boatMaxDistance = 120; // Plus large pour le bateau

        // Force de retour
        const baseDx = this.baseX - this.x;
        const baseDy = this.baseY - this.y;
        let forceX = baseDx * 0.1;
        let forceY = baseDy * 0.1;

        // Force souris
        if (distance < maxDistance) {
            const force = (maxDistance - distance) / maxDistance;
            const strength = Math.pow(force, 2) * 50;
            forceX -= (dx / distance) * strength;
            forceY -= (dy / distance) * strength;
        }

        // Force bateau (uniquement s'il se déplace)
        if (isBoatMoving && boatDistance < boatMaxDistance) {
            const force = (boatMaxDistance - boatDistance) / boatMaxDistance;
            const strength = Math.pow(force, 2) * 80;
            forceX -= (bdx / boatDistance) * strength;
            forceY -= (bdy / boatDistance) * strength;
        }

        this.x += forceX;
        this.y += forceY;

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
            // Zone d'exclusion autour de l'huître (pin-x: 400, pin-y: 400 en base 2000 => 600, 600 en base 3000)
            const oysterX = (400 / 2000) * MAP_WIDTH;
            const oysterY = (400 / 2000) * MAP_HEIGHT;
            const dx = x - oysterX;
            const dy = y - oysterY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Si on est trop proche de l'huître, on ne spawn pas de particule
            if (dist < 160) continue;

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

/* --- MESSENGER LOGIC --- */

function triggerMessengerNotification() {
    if (!messengerNotif) return;
    messengerNotif.classList.remove('hidden');

    // Jouer un petit son ? (Optionnel)

    messengerNotif.onclick = () => {
        messengerNotif.classList.add('hidden');
        openMessenger();
    };
}

function openMessenger() {
    if (!messengerContainer) return;
    messengerContainer.classList.remove('hidden');
    messengerChat.innerHTML = '';
    messengerOptions.classList.add('hidden');
    messengerChat.dataset.lastSender = ""; // Réinitialiser le dernier expéditeur

    // Sequence de messages
    setTimeout(() => {
        addChatBubble("Manon", "Les gars devinez je viens d'apprendre quoi ?");
    }, 500);

    setTimeout(() => {
        showMessengerQuiz();
    }, 2000);
}

function addChatBubble(sender, text) {
    const bubbleWrapper = document.createElement('div');
    bubbleWrapper.className = `chat-bubble-wrapper ${sender.toLowerCase() === 'manon' ? 'manon' : 'user'}`;

    // On n'affiche le nom que si c'est un nouvel expéditeur
    if (messengerChat.dataset.lastSender !== sender) {
        const senderName = document.createElement('div');
        senderName.className = 'chat-sender-name';
        senderName.textContent = sender;
        bubbleWrapper.appendChild(senderName);
    } else {
        bubbleWrapper.classList.add('same-sender');
    }

    messengerChat.dataset.lastSender = sender;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender.toLowerCase() === 'manon' ? 'manon' : 'user'}`;
    bubble.textContent = text;

    bubbleWrapper.appendChild(bubble);
    messengerChat.appendChild(bubbleWrapper);
    messengerChat.scrollTop = messengerChat.scrollHeight;
}

function showMessengerQuiz() {
    const data = poiData[currentMessengerQuizId];
    addChatBubble("Manon", data.question);

    messengerOptions.innerHTML = '';
    messengerOptions.classList.remove('hidden');

    data.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'messenger-option';
        btn.textContent = opt.text;
        btn.onclick = () => handleMessengerAnswer(opt);
        messengerOptions.appendChild(btn);
    });
}

function handleMessengerAnswer(option) {
    // Désactiver les options
    messengerOptions.classList.add('hidden');

    // Message de l'utilisateur
    addChatBubble("Moi", option.text);

    setTimeout(() => {
        if (option.correct) {
            addChatBubble("Manon", "Bravo ! C'est exactement ça. 🎉");
        } else {
            addChatBubble("Manon", "Mmmh, pas tout à fait...");
        }

        setTimeout(() => {
            addChatBubble("Manon", poiData[currentMessengerQuizId].feedback);
        }, 1200);

        setTimeout(() => {
            if (currentMessengerQuizId === 'quiz') {
                addChatBubble("Manon", "Bon, je te laisse filer au parc ! Le bateau t'attend. Bon voyage ! 👋");
            } else {
                addChatBubble("Manon", "Fais bien attention à tes huîtres ! À plus tard ! 👋");
            }

            // Ajouter un bouton "Fermer" final ou fermer auto
            const closeBtn = document.createElement('button');
            closeBtn.className = 'messenger-option';
            closeBtn.textContent = "C'est parti !";
            closeBtn.style.marginTop = "10px";
            closeBtn.onclick = closeMessenger;
            messengerOptions.innerHTML = '';
            messengerOptions.appendChild(closeBtn);
            messengerOptions.classList.remove('hidden');
        }, 3000);

    }, 800);
}

function closeMessenger() {
    messengerContainer.classList.add('hidden');

    // Mettre à jour et afficher la box d'onboarding pour le bateau
    const onboardingBox = document.getElementById('onboarding-box');
    if (onboardingBox) {
        if (currentMessengerQuizId === 'quiz') {
            onboardingBox.textContent = "Le bateau part vers le parc à huitres. Cliquez dessus pour suivre son trajet !";
        } else if (currentMessengerQuizId === 'quizVersPlats') {
            onboardingBox.textContent = "Voici le parc. Cliquez dessus pour voir les huitres de plus près";
        }
        onboardingBox.classList.remove('hidden');
    }

    // Rendre le bateau cliquable
    if (boat) {
        boat.classList.add('boat-clickable');
    }

    // Déclencher le mouvement du bateau si on est en onboarding
    if (!isBoatMoving && currentMessengerQuizId === 'quiz') {
        isBoatMoving = true;
    }
}

if (closeMessengerBtn) {
    closeMessengerBtn.onclick = closeMessenger;
}
