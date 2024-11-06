import * as THREE from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createParametricGeometry } from "./parametricGeometry.js"; // Import the function
import { BackgroundMusic } from "./music.js";

// Configuration constants
let dt = 1 / 60;
const R = 0.2;
const clothMass = 1;
const clothSize = 1;
const Nx = 12;
const Ny = 12;
const mass = clothMass / (Nx * Ny);
const restDistance = clothSize / Nx;
const ballSize = 0.1;

let camera, scene, renderer, controls;
let clothGeometry, sphereMesh, sphereBody;
let world;
const particles = [];

// Initialize physics and graphics
initCannon();
init();
animate();

function plane(width, height) {
  return (u, v) => new THREE.Vector3((u - 0.5) * width, (v + 0.5) * height, 0);
}

function initCannon() {
  world = new CANNON.World();
  world.broadphase = new CANNON.NaiveBroadphase();
  world.gravity.set(0, -9.82, 0);
  world.solver.iterations = 20;

  const clothMaterial = new CANNON.Material();
  const sphereMaterial = new CANNON.Material();
  const contactMaterial = new CANNON.ContactMaterial(
    clothMaterial,
    sphereMaterial,
    { friction: 0, restitution: 0 }
  );
  contactMaterial.contactEquationStiffness = 1e9;
  contactMaterial.contactEquationRelaxation = 3;
  world.addContactMaterial(contactMaterial);

  sphereBody = new CANNON.Body({ mass: 0 });
  sphereBody.addShape(new CANNON.Sphere(ballSize * 1.3));
  sphereBody.position.set(0, 0, 0);
  world.addBody(sphereBody);

  const clothFunction = plane(restDistance * Nx, restDistance * Ny);
  for (let i = 0; i <= Nx; i++) {
    particles.push([]);
    for (let j = 0; j <= Ny; j++) {
      const p = clothFunction(i / (Nx + 1), j / (Ny + 1));
      const particle = new CANNON.Body({
        mass: j === Ny ? 0 : mass,
      });
      particle.addShape(new CANNON.Particle());
      particle.position.set(p.x, p.y - Ny * 0.9 * restDistance, p.z);
      particles[i].push(particle);
      world.addBody(particle);
    }
  }

  const connect = (i1, j1, i2, j2) => {
    world.addConstraint(
      new CANNON.DistanceConstraint(
        particles[i1][j1],
        particles[i2][j2],
        restDistance
      )
    );
  };

  for (let i = 0; i <= Nx; i++) {
    for (let j = 0; j <= Ny; j++) {
      if (i < Nx) connect(i, j, i + 1, j);
      if (j < Ny) connect(i, j, i, j + 1);
    }
  }
}

function init() {
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 500, 10000);

  camera = new THREE.PerspectiveCamera(
    30,
    window.innerWidth / window.innerHeight,
    0.5,
    10000
  );
  camera.position.set(Math.cos(Math.PI / 4) * 3, 0, Math.sin(Math.PI / 4) * 3);
  scene.add(camera);

  controls = new TrackballControls(camera, document.body);
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;

  scene.add(new THREE.AmbientLight(0x666666));
  const light = new THREE.DirectionalLight(0xffffff, 1.75);
  light.position.set(5, 5, 5);
  scene.add(light);

  // Load the sky model
  const loader = new GLTFLoader();
  loader.load(
    "assets/models/LightBlueSky.glb",
    function (gltf) {
      scene.add(gltf.scene);
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );

  // Load the cloth texture
  const clothTexture = new THREE.TextureLoader().load("assets/pix01.png");
  clothTexture.wrapS = THREE.RepeatWrapping;
  clothTexture.wrapT = THREE.RepeatWrapping;

  // Use Toon material for the cloth
  const clothMaterial = new THREE.MeshToonMaterial({
    color: 0xffffff,
    map: clothTexture,
    gradientMap: createGradientTexture(),
  });

  // Cloth geometry creation using custom parametric geometry function
  clothGeometry = createParametricGeometry(
    plane(restDistance * Nx, restDistance * Ny),
    Nx,
    Ny
  );
  const clothMesh = new THREE.Mesh(clothGeometry, clothMaterial);
  clothMesh.castShadow = true;
  scene.add(clothMesh);

  // Sphere object
  sphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(ballSize, 20, 20),
    new THREE.MeshPhysicalMaterial({
      color: 0xff69b4,
      opacity: 0.9,
      transparent: true,
      roughness: 0.1,
      metalness: 0.2,
    })
  );

  sphereMesh.castShadow = true;
  scene.add(sphereMesh);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(scene.fog.color);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  window.addEventListener("resize", onWindowResize);
}

// Gradient texture function for toon shading
function createGradientTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1;
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 256, 0);
  gradient.addColorStop(0, "#000000");
  gradient.addColorStop(0.5, "#FFFFFF");
  gradient.addColorStop(1, "#000000");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 1);
  return new THREE.CanvasTexture(canvas);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  world.step(dt);
  sphereBody.position.set(
    R * Math.sin(world.time),
    0,
    R * Math.cos(world.time)
  );

  // Check for collision and change color of the sphere if colliding
  if (sphereBody.position.y < 0) {
    sphereMesh.material.color.set(0xff0000); // Change color to red on collision
  } else {
    sphereMesh.material.color.set(0xff69b4); // Reset to original color
  }

  // Update cloth geometry with particle positions
  const positions = clothGeometry.attributes.position.array;
  for (let i = 0; i <= Nx; i++) {
    for (let j = 0; j <= Ny; j++) {
      const idx = (i * (Ny + 1) + j) * 3;
      positions[idx] = particles[i][j].position.x;
      positions[idx + 1] = particles[i][j].position.y;
      positions[idx + 2] = particles[i][j].position.z;
    }
  }
  clothGeometry.attributes.position.needsUpdate = true;
  clothGeometry.computeVertexNormals();

  sphereMesh.position.copy(sphereBody.position);
  renderer.render(scene, camera);
}

document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("startButton");
  const welcomeOverlay = document.getElementById("welcomeOverlay");

  const bgMusic = new BackgroundMusic("./assets/audio/lonly_long.mp3");
  const maleVoiceover = new BackgroundMusic(
    "./assets/audio/male_voiceover.mp3"
  );

  startButton.addEventListener("click", () => {
    // Play the music after user clicks
    bgMusic.play();
    bgMusic.setVolume(0.3); // Set Volume to 30%

    maleVoiceover.play();
    maleVoiceover.noloop();
    maleVoiceover.setVolume(0.8); //Set volume to 80%

    welcomeOverlay.style.display = "none"; // Hide the welcome screen
  });
});
