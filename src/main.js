import './style.css';
import * as THREE from 'three';
// Se importa AMBELE tipuri de controale
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'; 
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// #############################################
// ## DEVICE DETECTOR ##
// #############################################
const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);


// ## 1. SCENE SETUP ##
const scene = new THREE.Scene();
const clock = new THREE.Clock();

// ## PHYSICAL SKYBOX MESH ##
const skyboxImagePaths = [
    'skybox/px.png', 'skybox/nx.png',
    'skybox/py.png', 'skybox/ny.png',
    'skybox/pz.png', 'skybox/nz.png'
];
const skyboxMaterials = skyboxImagePaths.map(image => {
    return new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(image),
        side: THREE.BackSide
    });
});
const skyboxGeometry = new THREE.BoxGeometry(950, 950, 950);
const skyboxMesh = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
scene.add(skyboxMesh);


const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const textureLoader = new THREE.TextureLoader();
const brickTexture = textureLoader.load('https://threejs.org/examples/textures/brick_diffuse.jpg');
brickTexture.wrapS = THREE.RepeatWrapping;
brickTexture.wrapT = THREE.RepeatWrapping;
brickTexture.repeat.set(4, 2);

const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xadd8e6, metalness: 0.1, roughness: 0, ior: 1.5,
    transmission: 1.0, transparent: true, thickness: 0.5, reflectivity: 1.0
});

// #############################################
// ## 2. AUDIO, CONTROLS, LIGHTING & RESPONSIVENESS ##
// #############################################

// =================== MODIFICARE: SETUP AUDIO PENTRU VOLUM GRADUAL ===================
const listener = new THREE.AudioListener();
camera.add(listener); // Atașăm "urechea" de cameră
const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

// Definim constantele pentru volum și distanța de fade
const MIN_VOLUME = 0.1; // Volumul minim, auzit de la distanță
const MAX_VOLUME = 1.0; // Volumul maxim, în interiorul clădirii
const FADE_DISTANCE = 25.0; // Distanța pe care se face tranziția de volum

// Încarcă fișierul audio
audioLoader.load('muzica.mp3', function(buffer) { // Asigură-te că ai un fișier 'muzica.mp3'
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(MIN_VOLUME); // Inițial, sunetul este setat la volumul minim
});
// =================== SFÂRȘIT MODIFICARE ===================

let controls;
let keysPressed = {
  'KeyW': false,
  'KeyA': false,
  'KeyS': false,
  'KeyD': false,
  'Space': false
};

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(50, 50, 25);
directionalLight.castShadow = true;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
scene.add(directionalLight);

const concreteMaterial = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.1, roughness: 0.8 });

if (isMobile) {
    document.getElementById('instructions-desktop')?.remove();
    camera.position.set(25, 10, 60);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.target.set(0, 5, 0);
} else {
    document.getElementById('instructions-mobile')?.remove();
    controls = new PointerLockControls(camera, document.body);
    const instructions = document.createElement('div');
    instructions.id = 'instructions-desktop';
    instructions.innerHTML = 'Click pentru a începe<br>(W, A, S, D = Mișcare, MOUSE = Privire, SPACE = Săritură)';
    instructions.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:white; font-size:24px; text-align:center; background:rgba(0,0,0,0.5); padding:20px; border-radius:10px; cursor:pointer;';
    document.body.appendChild(instructions);

    instructions.addEventListener('click', () => {
        controls.lock();
    });

    controls.addEventListener('lock', () => {
        instructions.style.display = 'none';
        
        // =================== MODIFICARE: ACTIVARE AUDIO LA CLICK ===================
        // Pornim contextul audio și redarea sunetului la primul click
        if (listener.context.state === 'suspended') {
            listener.context.resume();
        }
        if (!sound.isPlaying) {
            sound.play(); // Pornim sunetul, care are deja volumul setat la minim
        }
        // =================== SFÂRȘIT MODIFICARE ===================
    });

    controls.addEventListener('unlock', () => {
        instructions.style.display = '';
    });

    controls.object.position.set(25, 5, 45);
    scene.add(controls.object);

    document.addEventListener('keydown', (event) => { keysPressed[event.code] = true; });
    document.addEventListener('keyup', (event) => { keysPressed[event.code] = false; });
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ## 4. BUILDING COMPONENTS ##
const groundGeometry = new THREE.PlaneGeometry(200, 200);
const ground = new THREE.Mesh(groundGeometry, concreteMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.05;
ground.receiveShadow = true;
scene.add(ground);
const pillarGroup = new THREE.Group();
const pillarGeometry = new THREE.BoxGeometry(1, 6, 1);
const numPillars = 14;
const pillarSpacing = 4;
for (let i = 0; i < numPillars; i++) {
    const xPos = (i - (numPillars - 1) / 2) * pillarSpacing;
    const yPos = 3;
    const frontPillar = new THREE.Mesh(pillarGeometry, concreteMaterial);
    frontPillar.position.set(xPos, yPos, 14);
    frontPillar.castShadow = true;
    pillarGroup.add(frontPillar);
    const backPillar = new THREE.Mesh(pillarGeometry, concreteMaterial);
    backPillar.position.set(xPos, yPos, -14);
    backPillar.castShadow = true;
    pillarGroup.add(backPillar);
}
scene.add(pillarGroup);
const mainStructure = new THREE.Group();
const floorHeight = 7;
const numFloors = 1;

function createFloor(level) {
    const floorGroup = new THREE.Group();
    const yPos = 6 + (level * floorHeight);
    const slabWidth = pillarSpacing * numPillars;
    const slabDepth = 35;
    const slabThickness = 1;
    const holeWidth = slabWidth - 25;
    const holeDepth = slabDepth - 10;
    const slabShape = new THREE.Shape();
    slabShape.moveTo(-slabWidth / 2, -slabDepth / 2);
    slabShape.lineTo(-slabWidth / 2, slabDepth / 2);
    slabShape.lineTo(slabWidth / 2, slabDepth / 2);
    slabShape.lineTo(slabWidth / 2, -slabDepth / 2);
    slabShape.lineTo(-slabWidth / 2, -slabDepth / 2);
    const holePath = new THREE.Path();
    holePath.moveTo(-holeWidth / 2, -holeDepth / 2);
    holePath.lineTo(-holeWidth / 2, holeDepth / 2);
    holePath.lineTo(holeWidth / 2, holeDepth / 2);
    holePath.lineTo(holeWidth / 2, -holeDepth / 2);
    holePath.lineTo(-holeWidth / 2, -holeDepth / 2);
    slabShape.holes.push(holePath);
    const extrudeSettings = { steps: 1, depth: slabThickness, bevelEnabled: false };
    const slabGeometry = new THREE.ExtrudeGeometry(slabShape, extrudeSettings);
    const slab = new THREE.Mesh(slabGeometry, concreteMaterial);
    slab.position.y = yPos + slabThickness / 2;
    slab.rotation.x = -Math.PI / 2;
    slab.receiveShadow = true;
    slab.castShadow = true;
    floorGroup.add(slab);
    const columnGeometry = new THREE.BoxGeometry(1, floorHeight, 1.5);
    const windowGeometry = new THREE.BoxGeometry(pillarSpacing - 1, floorHeight - 1, 0.2);
    for (let i = 0; i < numPillars; i++) {
        const xPos = (i - (numPillars - 1) / 2) * pillarSpacing;
        const frontCol = new THREE.Mesh(columnGeometry, concreteMaterial);
        frontCol.position.set(xPos, yPos + floorHeight / 2 - 0.5, 14);
        frontCol.castShadow = true;
        floorGroup.add(frontCol);
        const backCol = new THREE.Mesh(columnGeometry, concreteMaterial);
        backCol.position.set(xPos, yPos + floorHeight / 2 - 0.5, -14);
        backCol.castShadow = true;
        floorGroup.add(backCol);
        if (i < numPillars - 1) {
            const windowX = xPos + pillarSpacing / 2;
            const windowY = yPos + floorHeight / 2;
            const frontWindow = new THREE.Mesh(windowGeometry, glassMaterial);
            frontWindow.position.set(windowX, windowY, 14);
            floorGroup.add(frontWindow);
            const backWindow = new THREE.Mesh(windowGeometry, glassMaterial);
            backWindow.position.set(windowX, windowY, -14);
            floorGroup.add(backWindow);
        }
    }
    return floorGroup;
}
for (let i = 0; i < numFloors; i++) {
    mainStructure.add(createFloor(i));
}
scene.add(mainStructure);
const slabWidth = pillarSpacing * numPillars;
const wallHeight = 5 + (numFloors * floorHeight);
const wallDepth = 35;
const wallThickness = 1;
const brickMaterial = new THREE.MeshStandardMaterial({ map: brickTexture });
const wallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, wallDepth);
const leftWall = new THREE.Mesh(wallGeometry, brickMaterial);
leftWall.position.set(-slabWidth / 2, wallHeight / 2, 0);
leftWall.castShadow = true;
leftWall.receiveShadow = true;
scene.add(leftWall);
const rightWall = new THREE.Mesh(wallGeometry, brickMaterial);
rightWall.position.set(slabWidth / 2, wallHeight / 2, 0);
rightWall.castShadow = true;
rightWall.receiveShadow = true;
scene.add(rightWall);
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
canvas.width = 412; canvas.height = 86;
context.fillStyle = '#9B111E';
context.fillRect(0, 0, canvas.width, canvas.height);
for (let i = 0; i < 5000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = Math.random() * 2;
    context.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.1})`;
    context.fillRect(x, y, radius, radius);
    context.fillStyle = `rgba(40, 26, 13, ${Math.random() * 0.1})`;
    context.fillRect(x, y, radius, radius);
}
context.fillStyle = 'white';
context.font = 'bold 40px Arial';
context.textAlign = 'center';
context.textBaseline = 'middle';
context.fillText('HYPERMARKET', canvas.width / 2, canvas.height / 2);
const bannerTexture = new THREE.CanvasTexture(canvas);
const bannerMaterial = new THREE.MeshStandardMaterial({
    map: bannerTexture, side: THREE.DoubleSide, metalness: 0, roughness: 1
});
const bannerWidth = (pillarSpacing * numPillars) / 2;
const roofBaseY = 5 + (numFloors * floorHeight);
const firstFloorTopY = 6 + (0 * floorHeight) + 0.5;
const bannerHeight = roofBaseY - firstFloorTopY;
const bannerCenterY = (roofBaseY + firstFloorTopY) / 2;
const bannerGeometry = new THREE.PlaneGeometry(bannerWidth, bannerHeight);
const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
banner.position.set(0, bannerCenterY, 17.6);
scene.add(banner);
const roofWidth = pillarSpacing * numPillars;
const roofDepth = 35;
const roofThickness = 1;
const domeRadius = 12;
const roofShape = new THREE.Shape();
roofShape.moveTo(-roofWidth / 2, -roofDepth / 2);
roofShape.lineTo(-roofWidth / 2, roofDepth / 2);
roofShape.lineTo(roofWidth / 2, roofDepth / 2);
roofShape.lineTo(roofWidth / 2, -roofDepth / 2);
roofShape.lineTo(-roofWidth / 2, -roofDepth / 2);
const roofHolePath = new THREE.Path();
roofHolePath.absellipse(0, 0, domeRadius, domeRadius, 0, Math.PI * 2, false, 0);
roofShape.holes.push(roofHolePath);
const roofExtrudeSettings = { steps: 1, depth: roofThickness, bevelEnabled: false };
const roofGeometry = new THREE.ExtrudeGeometry(roofShape, roofExtrudeSettings);
const roofMaterial = new THREE.MeshStandardMaterial({ color: 'red', metalness: 0.1, roughness: 0.8, side: THREE.DoubleSide });
const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
roofMesh.position.y = 5 + (numFloors * floorHeight);
roofMesh.rotation.x = -Math.PI / 2;
roofMesh.receiveShadow = true;
roofMesh.castShadow = true;
scene.add(roofMesh);
const domeSegments = 25; const domeRings = 6;
const domeGroup = new THREE.Group();
const domeColor = 'blue'; const tubeRadius = 0.25;
const metalMaterial = new THREE.MeshStandardMaterial({ color: domeColor, metalness: 1, roughness: 0.3 });
for (let i = 1; i <= domeRings; i++) {
    const phi = (Math.PI / 2.2) * (i / domeRings);
    const y = Math.sin(phi) * domeRadius;
    const r = Math.cos(phi) * domeRadius;
    let prevPoint = null;
    for (let j = 0; j <= domeSegments; j++) {
        const theta = (j / domeSegments) * Math.PI * 2;
        const point = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r);
        if (prevPoint) {
            const dir = new THREE.Vector3().subVectors(point, prevPoint);
            const length = dir.length();
            const mid = new THREE.Vector3().addVectors(prevPoint, point).multiplyScalar(0.5);
            const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(tubeRadius, tubeRadius, length, 8), metalMaterial);
            cylinder.position.copy(mid);
            cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
            domeGroup.add(cylinder);
        }
        prevPoint = point;
    }
}
for (let i = 0; i < domeSegments; i++) {
    const theta = (i / domeSegments) * Math.PI * 2;
    let prevPoint = null;
    for (let j = 1; j <= domeRings; j++) {
        const phi = (Math.PI / 2.2) * (j / domeRings);
        const y = Math.sin(phi) * domeRadius;
        const r = Math.cos(phi) * domeRadius;
        const point = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r);
        if (prevPoint) {
            const dir = new THREE.Vector3().subVectors(point, prevPoint);
            const length = dir.length();
            const mid = new THREE.Vector3().addVectors(prevPoint, point).multiplyScalar(0.5);
            const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(tubeRadius, tubeRadius, length, 8), metalMaterial);
            cylinder.position.copy(mid);
            cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
            domeGroup.add(cylinder);
        }
        prevPoint = point;
    }
}
domeGroup.position.y = 10.5;
scene.add(domeGroup);
const welcomePanelGroup = new THREE.Group();
const welcomeCanvas = document.createElement('canvas');
const welcomeContext = welcomeCanvas.getContext('2d');
welcomeCanvas.width = 1536; welcomeCanvas.height = 1024;
welcomeContext.fillStyle = '#CC0000';
welcomeContext.fillRect(0, 0, welcomeCanvas.width, welcomeCanvas.height);
welcomeContext.textAlign = 'center'; welcomeContext.textBaseline = 'middle'; welcomeContext.fillStyle = 'white';
welcomeContext.font = 'bold 70px Sans-serif';
welcomeContext.fillText('BUN VENIT ÎN UNIVERSUL LITERAR', welcomeCanvas.width / 2, welcomeCanvas.height * 0.12);
welcomeContext.font = '50px Sans-serif';
welcomeContext.fillText('PETRE BARBU', welcomeCanvas.width / 2, welcomeCanvas.height * 0.22);
welcomeContext.font = '40px Sans-serif';
welcomeContext.fillText('PAGINA ESTE ÎN CONSTRUCȚIE', welcomeCanvas.width / 2, welcomeCanvas.height * 0.30);
welcomeContext.font = '30px Sans-serif';
welcomeContext.fillText('petrecenume@gmail.com', welcomeCanvas.width / 2, welcomeCanvas.height * 0.38);
welcomeContext.font = '35px Sans-serif';
welcomeContext.fillText('NOTA: priviți în jur cu mouse-ul, navigați cu tastele W, A, S, D.', welcomeCanvas.width / 2, welcomeCanvas.height * 0.50);
welcomeContext.font = '35px Sans-serif';
welcomeContext.fillText('Cu SPACEBAR săriți în sus de bucurie!', welcomeCanvas.width / 2, welcomeCanvas.height * 0.58);
welcomeContext.font = 'bold 45px Sans-serif';
welcomeContext.fillText('TRĂIASCĂ LITERATURA! TRĂIASCĂ POPORUL!', welcomeCanvas.width / 2, welcomeCanvas.height * 0.72);
welcomeContext.font = 'bold 45px Sans-serif';
welcomeContext.fillText('ÎN FRUNTE CU SCRIITORUL LUI IUBIT!', welcomeCanvas.width / 2, welcomeCanvas.height * 0.82);

const welcomeTexture = new THREE.CanvasTexture(welcomeCanvas);
const welcomeMaterial = new THREE.MeshStandardMaterial({
    map: welcomeTexture,
});

const panelWidth = 15;
const panelHeight = 10;
const welcomePanelGeometry = new THREE.PlaneGeometry(panelWidth, panelHeight);

const welcomePanel = new THREE.Mesh(welcomePanelGeometry, welcomeMaterial);
welcomePanel.castShadow = true;
welcomePanel.receiveShadow = true;
welcomePanel.position.y = 1.5;

const graffitiCanvas = document.createElement('canvas');
const graffitiContext = graffitiCanvas.getContext('2d');
graffitiCanvas.width = 750;
graffitiCanvas.height = 500;
graffitiContext.fillStyle = '#CC0000';
graffitiContext.fillRect(0, 0, graffitiCanvas.width, graffitiCanvas.height);
graffitiContext.fillStyle = '#FFFF99';
graffitiContext.strokeStyle = '#FFFF99';
graffitiContext.lineWidth = 8;
graffitiContext.font = 'bold 50px cursive';
graffitiContext.textAlign = 'center';
graffitiContext.textBaseline = 'middle';
graffitiContext.fillText('Petre + Geta', graffitiCanvas.width / 2, graffitiCanvas.height * 0.3);
graffitiContext.fillText('= LOVE', graffitiCanvas.width / 2, graffitiCanvas.height * 0.45);
const centerX = graffitiCanvas.width / 2;
const centerY = graffitiCanvas.height * 0.7;
const size = 75;
graffitiContext.save();
graffitiContext.translate(centerX, centerY);
graffitiContext.beginPath();
graffitiContext.moveTo(0, size * 0.25);
graffitiContext.bezierCurveTo(size * 0.5, -size * 0.5, size, 0, 0, size);
graffitiContext.bezierCurveTo(-size, 0, -size * 0.5, -size * 0.5, 0, size * 0.25);
graffitiContext.closePath();
graffitiContext.fill();
graffitiContext.rotate(-Math.PI / 4);
graffitiContext.beginPath();
graffitiContext.moveTo(-size * 1.5, 0);
graffitiContext.lineTo(size * 1.5, 0);
graffitiContext.stroke();
graffitiContext.beginPath();
graffitiContext.moveTo(size * 1.5, 0);
graffitiContext.lineTo(size * 1.3, -size * 0.3);
graffitiContext.lineTo(size * 1.3, size * 0.3);
graffitiContext.closePath();
graffitiContext.fill();
graffitiContext.restore();
const graffitiTexture = new THREE.CanvasTexture(graffitiCanvas);
graffitiTexture.wrapS = THREE.RepeatWrapping;
graffitiTexture.repeat.x = -1;
const backPanelMaterial = new THREE.MeshStandardMaterial({
    map: graffitiTexture,
    side: THREE.BackSide
});

const backPanel = new THREE.Mesh(welcomePanelGeometry, backPanelMaterial);
backPanel.position.y = 1.5;
backPanel.position.z = -0.01;
backPanel.receiveShadow = true;

welcomePanelGroup.add(welcomePanel);
welcomePanelGroup.add(backPanel);

const barHeight = 8; const barRadius = 0.15;
const barGeometry = new THREE.CylinderGeometry(barRadius, barRadius, barHeight, 16);
const barMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
const leftBar = new THREE.Mesh(barGeometry, barMaterial);
leftBar.position.set(-panelWidth / 2, -1, -0.1);
leftBar.castShadow = true;
welcomePanelGroup.add(leftBar);
const rightBar = new THREE.Mesh(barGeometry, barMaterial);
rightBar.position.set(panelWidth / 2, -1, -0.1);
rightBar.castShadow = true;
welcomePanelGroup.add(rightBar);
welcomePanelGroup.position.set(29, 5, 33);
scene.add(welcomePanelGroup);
const playerCollider = new THREE.Box3();
const playerSize = new THREE.Vector3(1, 5, 1);
const leftWallCollider = new THREE.Box3().setFromObject(leftWall);
const rightWallCollider = new THREE.Box3().setFromObject(rightWall);

// =================== MODIFICARE: ZONA DE VOLUM MAXIM ===================
const maxVolumeZone = new THREE.Box3(
    new THREE.Vector3(-slabWidth / 2, -10, -wallDepth / 2),
    new THREE.Vector3(slabWidth / 2, 50, wallDepth / 2)
);
// =================== SFÂRȘIT MODIFICARE ===================

renderer.compile(scene, camera);
const playerVelocity = new THREE.Vector3();
const jumpHeight = 20;
const gravity = -20;


// ## 5. ANIMATION LOOP ##
function animate() {
    requestAnimationFrame(animate);

    if (isMobile) {
        if (controls) controls.update();
    } else {
        const deltaTime = clock.getDelta();

        if (controls && controls.isLocked === true) {
            playerVelocity.x -= playerVelocity.x * 10.0 * deltaTime;
            playerVelocity.z -= playerVelocity.z * 10.0 * deltaTime;
            playerVelocity.y += gravity * deltaTime;

            const direction = new THREE.Vector3();
            direction.z = Number(keysPressed['KeyS']) - Number(keysPressed['KeyW']);
            direction.x = Number(keysPressed['KeyA']) - Number(keysPressed['KeyD']);

            if (direction.lengthSq() > 0) {
                direction.normalize();
                const speed = 400.0;
                playerVelocity.x += direction.x * speed * deltaTime;
                playerVelocity.z += direction.z * speed * deltaTime;
            }

            // Aplicăm mișcarea pe orizontală
            controls.moveRight(-playerVelocity.x * deltaTime);
            controls.moveForward(-playerVelocity.z * deltaTime);
            
            // Aplicăm mișcarea pe verticală (săritura)
            controls.object.position.y += playerVelocity.y * deltaTime;

            const playerPos = controls.object.position;
            playerCollider.setFromCenterAndSize(playerPos, playerSize);

            // Verificăm coliziunile cu pereții laterali
            const colliders = [leftWallCollider, rightWallCollider];
            for (const collider of colliders) {
                if (playerCollider.intersectsBox(collider)) {
                    // Logica simplă de resetare a poziției pe axa X în caz de coliziune
                    // Oprește mișcarea pe X pentru a nu rămâne blocat
                    playerPos.x -= -playerVelocity.x * deltaTime; // Anulează mișcarea pe X
                    playerVelocity.x = 0;
                }
            }
            
            // Verificăm coliziunea cu solul
            if (playerPos.y < 5) {
                playerVelocity.y = 0;
                playerPos.y = 5;
                if (keysPressed['Space']) {
                    playerVelocity.y = jumpHeight;
                }
            }
            
            // =================== MODIFICARE: LOGICA DE FADE AUDIO ===================
            // Am eliminat vechea logică binară și am înlocuit-o cu cea nouă
            if (sound.isPlaying) {
                let volume = MIN_VOLUME;
                
                // Calculăm cea mai scurtă distanță de la jucător la "cutia" de volum maxim
                const distanceToZone = maxVolumeZone.distanceToPoint(playerPos);
                
                if (distanceToZone < FADE_DISTANCE) {
                    // Jucătorul este în zona de tranziție sau în interior
                    // Calculăm progresul (0.0 la marginea zonei de fade, 1.0 la marginea zonei de volum maxim)
                    const progress = 1.0 - (distanceToZone / FADE_DISTANCE);
                    // Calculăm volumul prin interpolare liniară
                    volume = MIN_VOLUME + progress * (MAX_VOLUME - MIN_VOLUME);
                }
                
                // Setăm volumul, asigurându-ne că nu depășește limitele
                sound.setVolume(Math.max(MIN_VOLUME, Math.min(MAX_VOLUME, volume)));
            }
            // =================== SFÂRȘIT MODIFICARE ===================
        }
    }
    
    renderer.render(scene, camera);
}

animate();