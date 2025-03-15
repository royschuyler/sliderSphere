// Get canvas and context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Object to hold our slider parameters
let params = {
  a: parseFloat(document.getElementById('aSlider').value),                  // MASTER d7, a
  wrapSizeBandD: parseFloat(document.getElementById('wrapSizeBandDSlider').value), // MASTER d13
  startAdd: parseFloat(document.getElementById('startAddSlider').value),       // MASTER d15
  f: parseFloat(document.getElementById('fSlider').value),                     // MASTER f7
  n: parseFloat(document.getElementById('nSlider').value),                     // MASTER f9
  totalStart: parseFloat(document.getElementById('totalStartSlider').value),   // New: total start offset in degrees
  tilt: parseFloat(document.getElementById('tiltSlider').value)                // New: tilt angle in degrees
};

// Helper function to update slider displays and parameter values
function setupSlider(sliderId, valueId, paramName) {
  const slider = document.getElementById(sliderId);
  const display = document.getElementById(valueId);
  slider.addEventListener('input', () => {
    display.textContent = slider.value;
    params[paramName] = parseFloat(slider.value);
    draw();
  });
}

// Initialize sliders
setupSlider('aSlider', 'aValue', 'a');
setupSlider('wrapSizeBandDSlider', 'wrapSizeBandDValue', 'wrapSizeBandD');
setupSlider('startAddSlider', 'startAddValue', 'startAdd');
setupSlider('fSlider', 'fValue', 'f');
setupSlider('nSlider', 'nValue', 'n');
setupSlider('totalStartSlider', 'totalStartValue', 'totalStart');
setupSlider('tiltSlider', 'tiltValue', 'tilt');

// Utility function to convert degrees to radians
function toRadians(deg) {
  return deg * Math.PI / 180;
}

function draw() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // --- Spreadsheet constants and computed constants ---
  const dPoints = 100;            // Number of plot points (a2)
  const aVal = params.a;          // slider 'a'
  const a4 = dPoints / 2;         // a4 = dPoints/2
  const a10 = Math.PI / dPoints;  // a10 = PI / dPoints
  const a12 = 1 / aVal;           // a12 = 1 / a
  const a14 = Math.PI / dPoints;  // a14 = PI / dPoints (same as a10)
  
  // f2 is calculated from MASTER B5. With MASTER A2=1, A5=1, B2=30: f2 = 360 + 30 = 390°
  const f2 = 390;
  // Apply totalStart offset (in degrees) to the starting angle for all bands
  const totalStartRad = toRadians(params.totalStart);
  const a16 = toRadians(f2) + totalStartRad;                  // For bands A & B
  const a18 = toRadians(f2 + params.startAdd) + totalStartRad;  // For bands C & D
  
  // c10 is calculated from MASTER D9 = sqrt(a^2 - 1) / a (assuming exponent D11 is 2)
  const c10 = Math.sqrt(aVal * aVal - 1) / aVal;
  // c13 is the wrapSizeBandD parameter
  const c13 = params.wrapSizeBandD;
  
  // f and n from the sliders (f corresponds to MASTER f7, n to MASTER f9)
  const fVal = params.f;
  const nVal = params.n;
  
  // --- Prepare arrays to store the points for each curve ---
  // Each point will include an (x, y) coordinate.
  let pointsA = [];
  let pointsB = [];
  let pointsC = [];
  let pointsD = [];
  
  // s will be our cumulative sum variable (starting at 0)
  let s = 0;
  
  // Loop over each index (0 to dPoints) to compute the necessary values
  for (let i = 0; i <= dPoints; i++) {
    // g is the index (i)
    // h = a10 * i
    let h = a10 * i;
    // j = 1 - cos(h)    (using c2 = 1)
    let j = 1 - Math.cos(h);
    // l = a4 * j
    let l = a4 * j;
    // m = a10 * l
    let m = a10 * l;
    // n_col = sin(m)   (renamed to avoid conflict with slider n)
    let n_col = Math.sin(m);
    // o_val = c10 * cos(m)
    let o_val = c10 * Math.cos(m);
    
    // p = a14 * i
    let p = a14 * i;
    // q = nVal * (sin(p))^fVal
    let q = nVal * Math.pow(Math.sin(p), fVal);
    // r = (if q is zero then 0, else convert 1/q to radians)
    let r = (q === 0 ? 0 : (1 / q) * (Math.PI / 180));
    // Accumulate s
    s += r;
    
    // --- Calculate coordinates for the four curves ---
    // Line A (offset a16)
    let xA = Math.sin(s + a16) * n_col;
    let yA = (n_col * a12 * Math.cos(s + a16)) + o_val;
    
    // Line B (like A, but with wrap factor c13)
    let xB = Math.sin(s + a16) * n_col * c13;
    let yB = (n_col * a12 * c13 * Math.cos(s + a16)) + o_val;
    
    // Line C (offset a18)
    let xC = Math.sin(s + a18) * n_col;
    let yC = (n_col * a12 * Math.cos(s + a18)) + o_val;
    
    // Line D (like C, but with wrap factor c13)
    let xD = Math.sin(s + a18) * n_col * c13;
    let yD = (n_col * a12 * c13 * Math.cos(s + a18)) + o_val;
    
    // Save the computed points
    pointsA.push({ x: xA, y: yA });
    pointsB.push({ x: xB, y: yB });
    pointsC.push({ x: xC, y: yC });
    pointsD.push({ x: xD, y: yD });
  }
  
  // --- Draw the curves on the canvas with tilt transformation ---
  const scale = 200;             // Scale factor for visibility
  const offsetX = canvas.width / 2;
  const offsetY = canvas.height / 2;
  const tiltRad = toRadians(params.tilt);  // Convert tilt to radians
  
  // Function to rotate a point by tilt angle
  function applyTilt(x, y) {
    let rx = x * Math.cos(tiltRad) - y * Math.sin(tiltRad);
    let ry = x * Math.sin(tiltRad) + y * Math.cos(tiltRad);
    return { x: rx, y: ry };
  }
  
  // Function to draw a line given an array of points and a stroke color
  function drawLine(points, color) {
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      // Apply tilt to each computed point
      let tilted = applyTilt(points[i].x, points[i].y);
      // Map the transformed (x, y) to canvas coordinates.
      let screenX = offsetX + tilted.x * scale;
      let screenY = offsetY - tilted.y * scale; // Invert y-axis for canvas
      if (i === 0) {
        ctx.moveTo(screenX, screenY);
      } else {
        ctx.lineTo(screenX, screenY);
      }
    }
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  
  // Draw each line in a distinct color
  drawLine(pointsA, 'red');    // Line A
  drawLine(pointsB, 'green');  // Line B
  drawLine(pointsC, 'blue');   // Line C
  drawLine(pointsD, 'orange'); // Line D
  
  // Optionally, display current parameter values on the canvas
  ctx.font = '16px Arial';
  ctx.fillStyle = 'black';
  const text = `a: ${aVal.toFixed(3)}, wrapSizeBandD: ${c13.toFixed(3)}, startAdd: ${params.startAdd}, f: ${fVal.toFixed(3)}, n: ${nVal.toFixed(3)}, totalStart: ${params.totalStart}, tilt: ${params.tilt}`;
  ctx.fillText(text, 10, 20);
}

// Initial drawing
draw();
