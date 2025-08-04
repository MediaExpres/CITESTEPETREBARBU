import './style.css';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'; 

// ## 1. SCENE SETUP ##
const scene = new THREE.Scene();
const clock = new THREE.Clock();

// ## SKYBOX LOADER ##
const cubeLoader = new THREE.CubeTextureLoader();
cubeLoader.setPath('skybox/'); // Calea către folderul cu imaginile separate

// Se încarcă cele 6 imagini .png (asigură-te că numele corespund)
const skyboxTexture = cubeLoader.load([
    'px.png', 'nx.png',
    'py.png', 'ny.png',
    'pz.png', 'nz.png'
]);

scene.background = skyboxTexture;

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);


const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const textureLoader = new THREE.TextureLoader();
const brickTexture = textureLoader.load('https://threejs.org/examples/textures/brick_diffuse.jpg');
brickTexture.wrapS = THREE.RepeatWrapping;
brickTexture.wrapT = THREE.RepeatWrapping;
brickTexture.repeat.set(4, 2); // Repeat texture 4 times horizontally, 2 times vertically

// glass material definition

const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xadd8e6,  // A light blue color tint
    metalness: 0.1,
    roughness: 0,       // Set to 0 for a sharper, more mirror-like shine
    ior: 1.5,
    transmission: 1.0,
    transparent: true,
    thickness: 0.5,
    reflectivity: 1.0    // Max out the reflectivity
});

// ## 2. CONTROLS & LIGHTING ##
const controls = new PointerLockControls(camera, document.body);

// VVV ADD THIS BLOCK TO SET THE PLAYER'S STARTING POSITION VVV
controls.object.position.set(25, 5, 45); // x, y, z
// We start at y=5, which is our player's "eye level" from the ground.

// Add an event listener to lock the controls on click
document.body.addEventListener('click', () => {
    controls.lock();
});

// Add the controls to the scene so we can move it
scene.add(controls.object);

// A more robust way to handle keyboard input
const keysPressed = {};
document.addEventListener('keydown', (event) => { keysPressed[event.code] = true; });
document.addEventListener('keyup', (event) => { keysPressed[event.code] = false; });


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
    // VVV THIS FORMULA NOW MATCHES THE 1ST FLOOR COLUMNS VVV
    const xPos = (i - (numPillars - 1) / 2) * pillarSpacing;
    const yPos = 3; // Center of the pillar height

    // Create the front pillar
    const frontPillar = new THREE.Mesh(pillarGeometry, concreteMaterial);
    frontPillar.position.set(xPos, yPos, 14); // Pillar on the +z side
    frontPillar.castShadow = true;
    pillarGroup.add(frontPillar);

    // Create the back pillar
    const backPillar = new THREE.Mesh(pillarGeometry, concreteMaterial);
    backPillar.position.set(xPos, yPos, -14); // Mirrored pillar on the -z side
    backPillar.castShadow = true;
    pillarGroup.add(backPillar);
}
scene.add(pillarGroup);

const mainStructure = new THREE.Group();
const floorHeight = 7;
const numFloors = 1; // Reduced to 1 floor

function createFloor(level) {
    const floorGroup = new THREE.Group();
    const yPos = 6 + (level * floorHeight);

    // --- SLAB WITH HOLE START ---
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
    const extrudeSettings = {
        steps: 1,
        depth: slabThickness,
        bevelEnabled: false,
    };
    const slabGeometry = new THREE.ExtrudeGeometry(slabShape, extrudeSettings);
    const slab = new THREE.Mesh(slabGeometry, concreteMaterial);
    slab.position.y = yPos + slabThickness / 2;
    slab.rotation.x = -Math.PI / 2;
    slab.receiveShadow = true;
    slab.castShadow = true;
    floorGroup.add(slab);
    // --- SLAB WITH HOLE END ---

    const columnGeometry = new THREE.BoxGeometry(1, floorHeight, 1.5);
    
    // VVV DEFINE WINDOW GEOMETRY ONCE VVV
    const windowGeometry = new THREE.BoxGeometry(pillarSpacing - 1, floorHeight - 1, 0.2);

    for (let i = 0; i < numPillars; i++) {
        const xPos = (i - (numPillars - 1) / 2) * pillarSpacing;

        // Create columns as before
        const frontCol = new THREE.Mesh(columnGeometry, concreteMaterial);
        frontCol.position.set(xPos, yPos + floorHeight / 2 - 0.5, 14);
        frontCol.castShadow = true;
        floorGroup.add(frontCol);

        const backCol = new THREE.Mesh(columnGeometry, concreteMaterial);
        backCol.position.set(xPos, yPos + floorHeight / 2 - 0.5, -14);
        backCol.castShadow = true;
        floorGroup.add(backCol);

        // VVV ADD WINDOWS BETWEEN PILLARS VVV
        if (i < numPillars - 1) {
            const windowX = xPos + pillarSpacing / 2;
            const windowY = yPos + floorHeight / 2;

            // Front window
            const frontWindow = new THREE.Mesh(windowGeometry, glassMaterial);
            frontWindow.position.set(windowX, windowY, 14);
            floorGroup.add(frontWindow);

            // Back window
            const backWindow = new THREE.Mesh(windowGeometry, glassMaterial);
            backWindow.position.set(windowX, windowY, -14);
            floorGroup.add(backWindow);
        }
    }
    return floorGroup;
}

for (let i = 0; i < numFloors; i++) {
    const floor = createFloor(i);
    mainStructure.add(floor);
}
scene.add(mainStructure);

/// ## SIDE WALLS ##
const slabWidth = pillarSpacing * numPillars;
const wallHeight = 5 + (numFloors * floorHeight);
const wallDepth = 35;
const wallThickness = 1;

// 1. Create the new material using the loaded texture
const brickMaterial = new THREE.MeshStandardMaterial({
    map: brickTexture // Apply the texture here
});

// 2. Define the geometry for the walls
const wallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, wallDepth);

// 3. Create the walls using the NEW brick material
const leftWall = new THREE.Mesh(wallGeometry, brickMaterial); // <-- Use brickMaterial
leftWall.position.set(-slabWidth / 2, wallHeight / 2, 0);
leftWall.castShadow = true;
leftWall.receiveShadow = true;
scene.add(leftWall);

const rightWall = new THREE.Mesh(wallGeometry, brickMaterial); // <-- Use brickMaterial
rightWall.position.set(slabWidth / 2, wallHeight / 2, 0);
rightWall.castShadow = true;
rightWall.receiveShadow = true;
scene.add(rightWall);

// ## BANNER ##

// 1. Create a canvas element to draw the texture
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
canvas.width = 412;
canvas.height = 86;

// 2. Create the "dirty red" background
context.fillStyle = '#9B111E'; // A dark, crimson red
context.fillRect(0, 0, canvas.width, canvas.height);

// Add some "dirt" smudges for a weathered look
for (let i = 0; i < 5000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = Math.random() * 2;
    // Add semi-transparent black and brown smudges
    context.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.1})`;
    context.fillRect(x, y, radius, radius);
    context.fillStyle = `rgba(40, 26, 13, ${Math.random() * 0.1})`;
    context.fillRect(x, y, radius, radius);
}


// 3. Add the white text "HYPERMARKET"
context.fillStyle = 'white';
context.font = 'bold 40px Arial';
context.textAlign = 'center';
context.textBaseline = 'middle';
context.fillText('HYPERMARKET', canvas.width / 2, canvas.height / 2);

// 4. Create a texture from the canvas
const bannerTexture = new THREE.CanvasTexture(canvas);

// 5. Create the banner material
const bannerMaterial = new THREE.MeshStandardMaterial({
    map: bannerTexture,
    side: THREE.DoubleSide, // Make sure it's visible from both sides
    metalness: 0,
    roughness: 1
});

// Define the banner's geometry and position based on floor/roof edges
const bannerWidth = (pillarSpacing * numPillars) / 2;

// Get the exact Y positions of the roof's base and the floor's top
const roofBaseY = 5 + (numFloors * floorHeight);      // Top edge of the banner
const firstFloorTopY = 6 + (0 * floorHeight) + 0.5; // Bottom edge of the banner

// Calculate the banner's height and its new center position
const bannerHeight = roofBaseY - firstFloorTopY;
const bannerCenterY = (roofBaseY + firstFloorTopY) / 2;

const bannerGeometry = new THREE.PlaneGeometry(bannerWidth, bannerHeight);
const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);

// Position it in the front, precisely aligned
banner.position.set(
    0,              // Centered horizontally
    bannerCenterY,  // Centered vertically between the roof and floor
    17.6            // Slightly in front of the floor plane
);
scene.add(banner);

// ---- RECTANGULAR ROOF WITH ROUND HOLE FOR DOME ----

const roofWidth = pillarSpacing * numPillars; // same as floor slab
const roofDepth = 35; // same as floor slab
const roofThickness = 1; // same as floor slab
const domeRadius = 12; // Dome base fits within roof rectangle

// Create a rectangular shape with a circular hole
const roofShape = new THREE.Shape();
roofShape.moveTo(-roofWidth / 2, -roofDepth / 2);
roofShape.lineTo(-roofWidth / 2, roofDepth / 2);
roofShape.lineTo(roofWidth / 2, roofDepth / 2);
roofShape.lineTo(roofWidth / 2, -roofDepth / 2);
roofShape.lineTo(-roofWidth / 2, -roofDepth / 2);

// Add circular hole in the center
const holePath = new THREE.Path();
holePath.absellipse(0, 0, domeRadius, domeRadius, 0, Math.PI * 2, false, 0);
roofShape.holes.push(holePath);

// Extrude the shape to give the roof thickness
const extrudeSettings = {
    steps: 1,
    depth: roofThickness,
    bevelEnabled: false
};
const roofGeometry = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
const roofMaterial = new THREE.MeshStandardMaterial({ color: 'red', metalness: 0.1, roughness: 0.8, side: THREE.DoubleSide });
const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
// Position the roof at the top of the last floor, thickness/2 above
roofMesh.position.y = 5 + (numFloors * floorHeight);
roofMesh.position.z = 0;
roofMesh.position.x = 0;
roofMesh.rotation.x = -Math.PI / 2;
roofMesh.receiveShadow = true;
roofMesh.castShadow = true;
scene.add(roofMesh);

// ---- DOME WITH ONLY VERTICAL AND HORIZONTAL METAL TUBES, RESTING ON ROOF ----

const domeSegments = 25; // longitude lines
const domeRings = 6;     // latitude lines
const domeGroup = new THREE.Group();
const domeColor = 'blue'; // metallic gray
const tubeRadius = 0.25;    // thickness of the tubes
const roofY = 6 + (numFloors * floorHeight) + roofThickness / 2; // Dome sits on top of roof

const metalMaterial = new THREE.MeshStandardMaterial({
    color: domeColor,
    metalness: 1,
    roughness: 0.3
});

// Horizontal (latitude) tubes
for (let i = 1; i <= domeRings; i++) {
    const phi = (Math.PI / 2.2) * (i / domeRings);
    const y = Math.sin(phi) * domeRadius;
    const r = Math.cos(phi) * domeRadius;
    let prevPoint = null;
    for (let j = 0; j <= domeSegments; j++) {
        const theta = (j / domeSegments) * Math.PI * 2;
        const point = new THREE.Vector3(
            Math.cos(theta) * r,
            y,
            Math.sin(theta) * r
        );
        if (prevPoint) {
            // Create a tube (cylinder) between prevPoint and point
            const dir = new THREE.Vector3().subVectors(point, prevPoint);
            const length = dir.length();
            const mid = new THREE.Vector3().addVectors(prevPoint, point).multiplyScalar(0.5);
            const cylinder = new THREE.Mesh(
                new THREE.CylinderGeometry(tubeRadius, tubeRadius, length, 8),
                metalMaterial
            );
            // Orient the cylinder
            cylinder.position.copy(mid);
            cylinder.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                dir.clone().normalize()
            );
            domeGroup.add(cylinder);
        }
        prevPoint = point;
    }
}

// Vertical (longitude) tubes
for (let i = 0; i < domeSegments; i++) {
    const theta = (i / domeSegments) * Math.PI * 2;
    let prevPoint = null;
    for (let j = 1; j <= domeRings; j++) {
        const phi = (Math.PI / 2.2) * (j / domeRings);
        const y = Math.sin(phi) * domeRadius;
        const r = Math.cos(phi) * domeRadius;
        const point = new THREE.Vector3(
            Math.cos(theta) * r,
            y,
            Math.sin(theta) * r
        );
        if (prevPoint) {
            const dir = new THREE.Vector3().subVectors(point, prevPoint);
            const length = dir.length();
            const mid = new THREE.Vector3().addVectors(prevPoint, point).multiplyScalar(0.5);
            const cylinder = new THREE.Mesh(
                new THREE.CylinderGeometry(tubeRadius, tubeRadius, length, 8),
                metalMaterial
            );
            cylinder.position.copy(mid);
            cylinder.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                dir.clone().normalize()
            );
            domeGroup.add(cylinder);
        }
        prevPoint = point;
    }
}

// Position the dome so its base sits on the roof
domeGroup.position.y = 10.5; // <-- set your custom height here
scene.add(domeGroup);

// #############################################
// ## WELCOME PANEL (EDITED) ##
// #############################################

// 1. Create a group to hold the panel and its supports
const welcomePanelGroup = new THREE.Group();

// 2. Create a canvas for the text texture
const welcomeCanvas = document.createElement('canvas');
const welcomeContext = welcomeCanvas.getContext('2d');
// Increased width for the long text and height for the new lines
welcomeCanvas.width = 1536;
welcomeCanvas.height = 1024; 

// 3. Draw the background and text
welcomeContext.fillStyle = '#CC0000'; // Red background
welcomeContext.fillRect(0, 0, welcomeCanvas.width, welcomeCanvas.height);

welcomeContext.textAlign = 'center';
welcomeContext.textBaseline = 'middle';
welcomeContext.fillStyle = 'white'; // White text

// --- Y positions are recalculated for tighter spacing and new lines ---
// Line 1
welcomeContext.font = 'bold 70px Sans-serif';
welcomeContext.fillText('BUN VENIT ÎN UNIVERSUL LITERAR', welcomeCanvas.width / 2, welcomeCanvas.height * 0.12);

// Line 2
welcomeContext.font = '50px Sans-serif';
welcomeContext.fillText('PETRE BARBU', welcomeCanvas.width / 2, welcomeCanvas.height * 0.22);

// Line 3
welcomeContext.font = '40px Sans-serif';
welcomeContext.fillText('PAGINA ESTE ÎN CONSTRUCȚIE', welcomeCanvas.width / 2, welcomeCanvas.height * 0.30);

// Line 4
welcomeContext.font = '30px Sans-serif';
welcomeContext.fillText('petrecenume@gmail.com', welcomeCanvas.width / 2, welcomeCanvas.height * 0.38);

// --- NEW INSTRUCTIONAL TEXT ADDED HERE ---
// Line 5
welcomeContext.font = '35px Sans-serif';
welcomeContext.fillText('NOTA: priviți în jur cu mouse-ul, navigați cu tastele W, A, S, D.', welcomeCanvas.width / 2, welcomeCanvas.height * 0.50);

// Line 6
welcomeContext.font = '35px Sans-serif';
welcomeContext.fillText('Cu SPACEBAR săriți în sus de bucurie!', welcomeCanvas.width / 2, welcomeCanvas.height * 0.58);


// --- SLOGAN ---
// Line 7
welcomeContext.font = 'bold 45px Sans-serif';
welcomeContext.fillText('TRĂIASCĂ LITERATURA! TRĂIASCĂ POPORUL!', welcomeCanvas.width / 2, welcomeCanvas.height * 0.72);

// Line 8
welcomeContext.font = 'bold 45px Sans-serif';
welcomeContext.fillText('ÎN FRUNTE CU SCRIITORUL LUI IUBIT!', welcomeCanvas.width / 2, welcomeCanvas.height * 0.82);


// 4. Create material from canvas
const welcomeTexture = new THREE.CanvasTexture(welcomeCanvas);
const welcomeMaterial = new THREE.MeshStandardMaterial({
    map: welcomeTexture,
    side: THREE.DoubleSide
});

// 5. Create the panel geometry and mesh
const panelWidth = 15; // Increased width
const panelHeight = 10; // Increased height to match canvas aspect ratio
const welcomePanelGeometry = new THREE.PlaneGeometry(panelWidth, panelHeight);
const welcomePanel = new THREE.Mesh(welcomePanelGeometry, welcomeMaterial);
welcomePanel.castShadow = true;
welcomePanel.receiveShadow = true;
// The panel itself is positioned higher on the bars
welcomePanel.position.y = 1.5;
welcomePanelGroup.add(welcomePanel); // Add panel to the group

// 6. Create the support bars
const barHeight = 8; // Made taller to reach the ground
const barRadius = 0.15;
const barGeometry = new THREE.CylinderGeometry(barRadius, barRadius, barHeight, 16);
const barMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });

const leftBar = new THREE.Mesh(barGeometry, barMaterial);
// Repositioned to account for new height and to touch the ground
leftBar.position.set(-panelWidth / 2, -1, -0.1); 
leftBar.castShadow = true;
welcomePanelGroup.add(leftBar);

const rightBar = new THREE.Mesh(barGeometry, barMaterial);
// Repositioned to account for new height and to touch the ground
rightBar.position.set(panelWidth / 2, -1, -0.1); 
rightBar.castShadow = true;
welcomePanelGroup.add(rightBar);

// 7. Position the entire group in the scene
// Positioned closer to the player's starting point
welcomePanelGroup.position.set(29, 5, 33);
scene.add(welcomePanelGroup);


// ## COLLISION SETUP ##
const playerCollider = new THREE.Box3();
const playerSize = new THREE.Vector3(1, 5, 1); // Width, Height, Depth of player's box
const leftWallCollider = new THREE.Box3().setFromObject(leftWall);
const rightWallCollider = new THREE.Box3().setFromObject(rightWall);
leftWall.updateMatrixWorld();  // Don't forget to update the matrix
rightWall.updateMatrixWorld(); // Don't forget to update the matrix


// Pre-compile the scene and all its materials to prevent the initial lag spike.
// This will freeze the page for a moment, but it happens BEFORE the animation starts.
renderer.compile(scene, camera);


// Variables to control player physics
const playerVelocity = new THREE.Vector3();
const jumpHeight = 20;
const gravity = -20;

// ## 5. ANIMATION LOOP ##
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    if (controls.isLocked === true) {
        // --- Physics and Input (Unchanged) ---
        playerVelocity.x -= playerVelocity.x * 10.0 * deltaTime;
        playerVelocity.z -= playerVelocity.z * 10.0 * deltaTime;
        playerVelocity.y += gravity * deltaTime;

        const direction = new THREE.Vector3();
        direction.z = Number(keysPressed['KeyW']) - Number(keysPressed['KeyS']);
        direction.x = Number(keysPressed['KeyD']) - Number(keysPressed['KeyA']);

        if (direction.lengthSq() > 0) {
            direction.normalize();
            if (keysPressed['KeyW'] || keysPressed['KeyS']) playerVelocity.z -= direction.z * 400.0 * deltaTime;
            if (keysPressed['KeyD'] || keysPressed['KeyA']) playerVelocity.x -= direction.x * 400.0 * deltaTime;
        }

        // --- Apply Movement (Unchanged) ---
        controls.moveRight(-playerVelocity.x * deltaTime);
        controls.moveForward(-playerVelocity.z * deltaTime);
        controls.object.position.y += playerVelocity.y * deltaTime;

        // --- Definitive Collision Correction ---
        const playerPos = controls.object.position;
        playerCollider.setFromCenterAndSize(playerPos, playerSize);

        const colliders = [leftWallCollider, rightWallCollider];

        for (const collider of colliders) {
            if (playerCollider.intersectsBox(collider)) {
                // Calculate penetration on both sides of the wall
                const penetrationLeft = playerCollider.max.x - collider.min.x;
                const penetrationRight = collider.max.x - playerCollider.min.x;

                // The player is pushed back by the smaller of the two penetration values
                if (penetrationLeft < penetrationRight) {
                    playerPos.x -= penetrationLeft; // Push left
                } else {
                    playerPos.x += penetrationRight; // Push right
                }
                playerVelocity.x = 0; // Stop sideways momentum
            }
        }
        
        // --- Ground Check (Unchanged) ---
        if (playerPos.y < 5) {
            playerVelocity.y = 0;
            playerPos.y = 5;
            if (keysPressed['Space']) {
                playerVelocity.y = jumpHeight;
            }
        }
    }
    
    renderer.render(scene, camera);
}// End of animate function

// Start the animation loop!
animate();