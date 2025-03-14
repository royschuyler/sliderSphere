// SETUP THREE.JS SCENE
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff); // White background
document.body.appendChild(renderer.domElement);

// LIGHTING (for smooth visuals)
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// SPIRAL VARIABLES
let spiralLine;
function createSpiral(tiltX = 0, tiltY = 0, totalDegrees = 1440, rate = 2, res = 500) {
  if (spiralLine) scene.remove(spiralLine); // Remove previous spiral

  const points = [];
  const tiltXRadians = THREE.MathUtils.degToRad(tiltX);
  const tiltYRadians = THREE.MathUtils.degToRad(tiltY);
  const radius = 5; // Spiral radius

  // Generate theta values (North to South Pole)
  const theta = Array.from({ length: res }, (_, i) => Math.PI / 2 - (i / res) * Math.PI);

  // New function to emphasize wrapping near poles
  function wrapDistribution(t, rate) {
    const k = Math.pow(t, rate) / (Math.pow(t, rate) + Math.pow(1 - t, rate));
    //return (1 - k) * 0.75 + k * 0.25; // Adjusts spiral accumulation near poles
    return (1 - k) * 1 + k * -1; // Adjusts spiral accumulation near poles
  }

  const adjustedT = theta.map(t => wrapDistribution((t + Math.PI / 2) / Math.PI, rate));
  const phi = adjustedT.map(t => (totalDegrees / 360) * t * Math.PI * 2);

  // Convert spherical to Cartesian coordinates
  for (let i = 0; i < res; i++) {
    let x = radius * Math.cos(phi[i]) * Math.cos(theta[i]);
    let y = radius * Math.sin(theta[i]);
    let z = radius * Math.sin(phi[i]) * Math.cos(theta[i]);

    // Apply tilt transformation in both X and Y directions
    let tempX = x * Math.cos(tiltXRadians) - y * Math.sin(tiltXRadians);
    let tempY = x * Math.sin(tiltXRadians) + y * Math.cos(tiltXRadians);

    let finalX = tempX * Math.cos(tiltYRadians) - z * Math.sin(tiltYRadians);
    let finalZ = tempX * Math.sin(tiltYRadians) + z * Math.cos(tiltYRadians);

    points.push(new THREE.Vector3(finalX, tempY, finalZ));
  }

  const curve = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 5 }); // Black, thick line
  spiralLine = new THREE.Line(curve, material);
  scene.add(spiralLine);
}

// CAMERA POSITION
camera.position.z = 15;

// ANIMATION LOOP
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// EVENT LISTENERS FOR SLIDERS
document.getElementById("tiltX").addEventListener("input", (e) => {
  document.getElementById("tiltXValue").textContent = e.target.value;
  updateSpiral();
});

document.getElementById("tiltY").addEventListener("input", (e) => {
  document.getElementById("tiltYValue").textContent = e.target.value;
  updateSpiral();
});

document.getElementById("degrees").addEventListener("input", (e) => {
  document.getElementById("degreesValue").textContent = e.target.value;
  updateSpiral();
});

document.getElementById("rate").addEventListener("input", (e) => {
  document.getElementById("rateValue").textContent = e.target.value;
  updateSpiral();
});

document.getElementById("res").addEventListener("input", (e) => {
  document.getElementById("resValue").textContent = e.target.value;
  updateSpiral();
});

function updateSpiral() {
  createSpiral(
    parseFloat(document.getElementById("tiltX").value),
    parseFloat(document.getElementById("tiltY").value),
    parseFloat(document.getElementById("degrees").value),
    parseFloat(document.getElementById("rate").value),
    parseInt(document.getElementById("res").value)
  );
}

// INITIAL SPIRAL CREATION
createSpiral();

// DOWNLOAD FUNCTION
document.getElementById("download").addEventListener("click", () => {
  const link = document.createElement("a");
  link.href = renderer.domElement.toDataURL("image/png");
  link.download = "spiral.png";
  link.click();
});
