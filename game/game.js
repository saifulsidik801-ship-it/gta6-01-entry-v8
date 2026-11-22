// MARISOL BAY — take the city, district by district. v8, fresh build.
// Three.js scene + DOM HUD. Four staged shots selected with
// ?shot=cover|street|map|title|garage (no param: title screen, the start screen).
// ?still=1 freezes traffic/animation for deterministic screenshots.
// Three.js is vendored locally (game/vendor/three.module.min.js) so the game
// plays with no network request. Keys: WASD drive, SHIFT nitro, M map,
// ESC title, G garage, click to shoot on foot, 1-4 weapons, Z/X/C crew.
import * as THREE from './vendor/three.module.min.js';

const params = new URLSearchParams(location.search);
const SHOT = ['cover', 'street', 'map', 'title', 'garage'].includes(params.get('shot'))
  ? params.get('shot') : 'title';
const STILL = params.get('still') === '1';
document.body.classList.add('shot-' + SHOT);

// ---------- per-shot direction: location / camera / time all differ ----------
const SHOTS = {
  cover: {
    time: '16:00', skyTop: 0x2f7fd0, skyBot: 0xcfeaff, sun: 0xfff6d8, sunPos: [40, 55, -60],
    fog: 0xbfd9ee, hemi: 1.0, dir: 1.7, district: 'KUMALA STRAND', sub: 'Strand Boulevard · NEUTRAL · 58',
    kicker: "MISSION 6 · ORU'S FALL", title: 'WRECK THE REGENT', stage: 'STAGE 3/4', bar: 75,
    next: 'Vanish', obj: "Wreck Oru's Regent before it reaches the pier",
    stars: 4, cash: '₮18,450', air: 'AIR UNIT DEPLOYED', speed: 111, cond: '62% DENTED',
    who: 'MIRA KESANG · DRIVER', line: 'He’s making for Kumala Pier! Ram the Regent before it reaches the water!',
    cam: [1.5, 2.0, 12.8], look: [1.5, 1.0, -6], carPos: [1.5, 0, 6], carRotY: Math.PI + 0.35,
    heli: [-2, 16, -26], radio: '♪ OMBO 98.4 — “Island Pop”', rank: 'RANK B · FIXER', rp: '3,900 / 5,200 RP',
    health: 72, armour: 55,
  },
  street: {
    time: '19:31', skyTop: 0x0a1030, skyBot: 0x3a2a55, sun: 0xffd9a0, sunPos: [-30, 40, -60],
    fog: 0x1a1430, hemi: 0.95, dir: 0.7, district: 'OLD PASARU', sub: 'Night market · FRIENDLY · 74',
    kicker: 'MISSION 4 · MARKET SQUEEZE', title: 'TAKE OUT THE KERONO BOYS', stage: 'STAGE 2/3', bar: 40,
    next: 'Melt Away', obj: 'Take out the Kerono Boys 1/5',
    stars: 2, cash: '₮7,270', air: '', speed: 0, cond: 'ON FOOT',
    who: 'MIRA KESANG · DRIVER', line: 'The Kerono Boys run this market, Milo. Clear them out and the stalls are ours.',
    cam: [3.0, 2.0, 12.2], look: [-0.4, 1.15, -8], carPos: [1.5, 0, 6], carRotY: -Math.PI / 2,
    heli: null, radio: '', rank: 'RANK 9 · WHEELMAN', rp: '1,150 / 2,000 RP',
    health: 95, armour: 27,
  },
  map: {
    time: '16:00', skyTop: 0x7a4a9e, skyBot: 0xff8a4a, sun: 0xffc27a, sunPos: [0, 18, -70],
    fog: 0xe88a5a, hemi: 0.8, dir: 1.2, district: 'MARISOL BAY', sub: 'Whole island · 66.1% complete',
    kicker: '', title: '', stage: '', bar: 66, next: '', obj: '',
    stars: 0, cash: '', air: '', speed: 0, cond: '',
    who: '', line: '', cam: [0, 9, 34], look: [0, 3, -30], carPos: [1.5, 0, 6], carRotY: Math.PI + 0.35,
    heli: [-4, 14, -20], radio: '', rank: '', rp: '', health: 0, armour: 0,
  },
  title: {
    time: '18:45', skyTop: 0x3a2060, skyBot: 0xff7a3c, sun: 0xffd9a0, sunPos: [0, 8, -80],
    fog: 0xd86a4a, hemi: 0.75, dir: 1.1, district: 'MARISOL BAY', sub: 'Dusk over the bay',
    kicker: '', title: '', stage: '', bar: 0, next: '', obj: '',
    stars: 0, cash: '', air: '', speed: 0, cond: '',
    who: '', line: '', cam: [-1, 3.4, 26], look: [0, 4.5, -40], carPos: [1.5, 0, 6], carRotY: Math.PI + 0.35,
    heli: null, radio: '', rank: '', rp: '', health: 0, armour: 0,
  },
  garage: {
    time: '18:00', skyTop: 0x11131c, skyBot: 0x11131c, sun: 0xffe6b0, sunPos: [0, 8, 0],
    fog: 0x11131c, hemi: 0.6, dir: 0.4, district: 'PALM COURT', sub: 'Garage interior · SAFE · 0',
    kicker: "MISSION 6 · ORU'S FALL", title: 'WRECK THE REGENT', stage: 'STAGE 3/4', bar: 75,
    next: 'Vanish', obj: "Wreck Oru's Regent before it reaches the pier",
    stars: 0, cash: '₮18,450', air: 'NO AIR SUPPORT', speed: 0, cond: '62% DENTED',
    who: 'MIRA KESANG · DRIVER', line: 'He’s making for Kumala Pier! Ram the Regent before it reaches the water!',
    cam: [-6, 2.6, 4.5], look: [4, 0.8, -2], carPos: [0, 0, 0], carRotY: Math.PI + 0.35,
    heli: null, radio: '♪ OMBO 98.4 — “Island Pop”', rank: 'RANK B · FIXER', rp: '3,900 / 5,200 RP',
    health: 72, armour: 55,
  },
};
const S = SHOTS[SHOT];

// ---------- renderer / scene ----------
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = SHOT === 'street' ? 2.2 : 1.5;
renderer.domElement.className = 'webgl';
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(S.fog, 45, 150);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500);
camera.position.set(...S.cam);
camera.lookAt(...S.look);

// sky dome: vertical gradient + sun disc + clouds (outdoor shots)
{
  const geo = new THREE.SphereGeometry(220, 24, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(S.skyTop) }, bot: { value: new THREE.Color(S.skyBot) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 c = mix(bot, top, smoothstep(-0.08, 0.55, h)); gl_FragColor = vec4(c, 1.0); }',
  });
  scene.add(new THREE.Mesh(geo, mat));
  if (SHOT !== 'garage' && SHOT !== 'street') {
    const sun = new THREE.Mesh(new THREE.CircleGeometry(5, 24),
      new THREE.MeshBasicMaterial({ color: S.sun, fog: false }));
    sun.position.set(...S.sunPos); sun.lookAt(camera.position); scene.add(sun);
  }
  if (SHOT === 'cover' || SHOT === 'title') { // puffy white clouds
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, transparent: true, opacity: 0.92 });
    const cloudSpots = [[-40, 42, -90], [10, 50, -110], [55, 38, -80], [-70, 46, -60], [30, 55, -70], [-15, 44, -120]];
    for (const [cx, cy, cz] of cloudSpots) {
      const cl = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(4 + Math.random() * 3, 10, 8), cloudMat);
        puff.scale.y = 0.45; puff.position.set(i * 5 - 7, Math.random() * 1.5, Math.random() * 2);
        cl.add(puff);
      }
      cl.position.set(cx, cy, cz); cl.scale.setScalar(0.55); scene.add(cl);
    }
  }
  if (SHOT === 'street') { // stars over the market
    const g = new THREE.BufferGeometry(); const pts = [];
    for (let i = 0; i < 200; i++) {
      const a = Math.random() * Math.PI * 2, e = 0.3 + Math.random() * 1.1, r = 200;
      pts.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, fog: false })));
  }
}

scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x3a2a1a, S.hemi));
const sunLight = new THREE.DirectionalLight(0xfff1d6, S.dir);
sunLight.position.set(18, 30, 12);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -45; sunLight.shadow.camera.right = 45;
sunLight.shadow.camera.top = 45; sunLight.shadow.camera.bottom = -45;
scene.add(sunLight);
if (SHOT === 'cover') { // warm fill from behind the camera so the hero car pops
  const fill = new THREE.DirectionalLight(0xffe0b0, 0.6);
  fill.position.set(8, 18, 40); scene.add(fill);
}

// ---------- helpers ----------
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0.05, ...o });
function box(w, h, d, c, o = {}) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c, o)); m.castShadow = true; m.receiveShadow = true; return m; }
function cyl(rt, rb, h, c, o = {}) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 12), M(c, o)); m.castShadow = true; m.receiveShadow = true; return m; }
function place(mesh, x, y, z, ry = 0) { mesh.position.set(x, y, z); mesh.rotation.y = ry; scene.add(mesh); return mesh; }
function glowTexture(inner, outer) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, inner); grad.addColorStop(1, outer);
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); return t;
}
const glowWhite = glowTexture('rgba(255,244,200,0.95)', 'rgba(255,244,200,0)');
const glowRed = glowTexture('rgba(255,40,40,0.9)', 'rgba(255,40,40,0)');
const glowBlue = glowTexture('rgba(60,120,255,0.9)', 'rgba(60,120,255,0)');
function glowSprite(tex, scale, opacity) {
  const m = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity });
  const s = new THREE.Sprite(m); s.scale.set(scale, scale, 1); return s;
}
function buildingTexture(base, lit) {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 256;
  const g = cv.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 128, 256);
  for (let y = 10; y < 246; y += 22) for (let x = 10; x < 118; x += 20) {
    const on = Math.random() < lit;
    g.fillStyle = on ? (SHOT === 'street' ? '#ffd76a' : '#fff3c4') : 'rgba(20,24,44,0.85)';
    g.fillRect(x, y, 12, 14);
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function neonSignTexture(text, fg, bg) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 512, 128);
  g.font = '900 56px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = fg; g.shadowBlur = 26; g.fillStyle = fg;
  g.fillText(text, 256, 66);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- hero car: ONE smooth dome wedge + glass + spoiler + lights ----------
// Side profile: rounded tail, high dome roof, long slope to the nose. Rear face
// carries a ducktail spoiler, twin round taillights, a dark rear window and
// visible wheels — it must read as a sports car from the rear 3/4, never a slab.
function buildHeroCar(paint) {
  const car = new THREE.Group();
  const paintMat = new THREE.MeshStandardMaterial({ color: paint, roughness: 0.22, metalness: 0.6 });
  const s = new THREE.Shape();
  s.moveTo(-2.42, 0.30);
  s.quadraticCurveTo(-2.52, 0.62, -1.95, 0.78);
  s.bezierCurveTo(-1.1, 1.08, -0.3, 1.16, 0.4, 1.02);
  s.bezierCurveTo(1.1, 0.88, 1.8, 0.6, 2.35, 0.4);
  s.quadraticCurveTo(2.62, 0.32, 2.5, 0.22);
  s.quadraticCurveTo(2.2, 0.2, 1.9, 0.22);
  s.lineTo(-2.42, 0.3);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 1.95, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 3, steps: 1,
  });
  geo.translate(0, 0, -0.975);
  const body = new THREE.Mesh(geo, paintMat);
  body.castShadow = true; body.receiveShadow = true; car.add(body);
  // cabin glasshouse: dark glass panels on both flanks + light windshield + dark rear window
  const winShape = new THREE.Shape();
  winShape.moveTo(0.55, 0.86); winShape.lineTo(0.25, 1.12); winShape.lineTo(-0.7, 1.12); winShape.lineTo(-1.2, 0.88); winShape.closePath();
  const winGeo = new THREE.ShapeGeometry(winShape);
  const winMat = new THREE.MeshStandardMaterial({ color: 0x141c26, metalness: 0.9, roughness: 0.08, side: THREE.DoubleSide });
  for (const wz of [1.16, -1.16]) {
    const wp = new THREE.Mesh(winGeo, winMat);
    wp.position.set(0, 0, wz); if (wz < 0) wp.rotation.y = Math.PI; car.add(wp);
  }
  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.04, 1.7),
    new THREE.MeshStandardMaterial({ color: 0x8fb8d8, metalness: 0.9, roughness: 0.05 }));
  shield.position.set(0.27, 1.05, 0); shield.rotation.z = -0.4; car.add(shield);
  const rearWin = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 1.6),
    new THREE.MeshStandardMaterial({ color: 0x141c26, metalness: 0.9, roughness: 0.08 }));
  rearWin.position.set(-1.1, 1.05, 0); rearWin.rotation.z = 0.47; car.add(rearWin);
  // ducktail spoiler on the rear deck
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 1.9), paintMat);
  wing.position.set(-2.3, 0.98, 0); wing.rotation.z = 0.08; wing.castShadow = true; car.add(wing);
  // twin round taillights, glowing red, on the tail
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff1a1a, emissiveIntensity: 2.2 });
  for (const wz of [0.6, -0.6]) {
    const tl = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 16), tailMat);
    tl.rotation.z = Math.PI / 2; tl.position.set(-2.54, 0.5, wz); car.add(tl);
  }
  const tg = glowSprite(glowRed, 1.3, 0.35); tg.position.set(-2.75, 0.5, 0); car.add(tg);
  // slim LED headlights + glow at the nose
  const headMat = new THREE.MeshStandardMaterial({ color: 0x333322, emissive: 0xffe9b0, emissiveIntensity: 2.0 });
  for (const wz of [0.6, -0.6]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.55), headMat);
    hl.position.set(2.56, 0.5, wz); car.add(hl);
  }
  const hg = glowSprite(glowWhite, 1.5, 0.35); hg.position.set(2.85, 0.5, 0); car.add(hg);
  // gold pinstripe along the beltline + door handles
  for (const wz of [1.09, -1.09]) {
    const ps = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.03, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 }));
    ps.position.set(0, 0.7, wz); car.add(ps);
  }
  // wheels: tires r 0.42, silver discs r 0.28, x ±1.55 y 0.42 z ±0.95
  for (const x of [1.55, -1.55]) for (const z of [0.95, -0.95]) {
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 20), M(0x141414, { roughness: 0.9 }));
    tire.rotation.x = Math.PI / 2; tire.position.set(x, 0.42, z); tire.castShadow = true; car.add(tire);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.32, 20), M(0xd8dde2, { roughness: 0.25, metalness: 0.9 }));
    disc.rotation.x = Math.PI / 2; disc.position.set(x, 0.42, z); car.add(disc);
  }
  // twin centre exhausts
  for (const wz of [0.18, -0.18]) {
    const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.3, 10),
      new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.3 }));
    ex.rotation.z = Math.PI / 2; ex.position.set(-2.58, 0.32, wz); car.add(ex);
  }
  car.scale.setScalar(0.85);
  return car;
}

// ---------- traffic car: simple wedge + glass + wheels; police adds a light bar ----------
function buildTrafficCar(color, police = false) {
  const car = new THREE.Group();
  const paintMat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.4 });
  const s = new THREE.Shape();
  s.moveTo(-2.0, 0.3); s.lineTo(-2.0, 0.62); s.lineTo(-0.9, 0.95); s.lineTo(0.7, 0.95);
  s.lineTo(1.9, 0.62); s.lineTo(2.0, 0.3); s.lineTo(-2.0, 0.3);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 1.7, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1 });
  geo.translate(0, 0, -0.85);
  const body = new THREE.Mesh(geo, paintMat);
  body.castShadow = true; car.add(body);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x1a2836, metalness: 0.85, roughness: 0.1 }));
  glass.position.set(-0.1, 0.98, 0); car.add(glass);
  for (const x of [1.3, -1.3]) for (const z of [0.8, -0.8]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 14), M(0x141414, { roughness: 0.9 }));
    w.rotation.x = Math.PI / 2; w.position.set(x, 0.36, z); car.add(w);
  }
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff1a1a, emissiveIntensity: 1.8 });
  for (const wz of [0.55, -0.55]) {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.4), tailMat);
    tl.position.set(-2.02, 0.5, wz); car.add(tl);
  }
  if (police) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 1.3), M(0x222222, { roughness: 0.4 }));
    bar.position.set(-0.15, 1.06, 0); car.add(bar);
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff2222, emissiveIntensity: 3 }));
    r.position.set(-0.15, 1.16, 0.32); car.add(r);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x000033, emissive: 0x2244ff, emissiveIntensity: 3 }));
    b.position.set(-0.15, 1.16, -0.32); car.add(b);
    const pr = glowSprite(glowRed, 3.0, 0.5); pr.position.set(0, 0.3, 1.6); car.add(pr);
    const pb = glowSprite(glowBlue, 3.0, 0.5); pb.position.set(0, 0.3, -1.6); car.add(pb);
    const plR = new THREE.PointLight(0xff2222, 3, 9); plR.position.set(0, 1.2, 1.6); car.add(plR);
    const plB = new THREE.PointLight(0x2244ff, 3, 9); plB.position.set(0, 1.2, -1.6); car.add(plB);
    car.userData.copLights = [plR, plB];
    // siren light pools on the road beside the cruiser
    const poolR = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.4),
      new THREE.MeshBasicMaterial({ map: glowRed, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
    poolR.rotation.x = -Math.PI / 2; poolR.position.set(0, 0.05, 2.2); car.add(poolR);
    const poolB = poolR.clone(); poolB.material = new THREE.MeshBasicMaterial({ map: glowBlue, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
    poolB.position.z = -2.2; car.add(poolB);
  }
  return car;
}

// ---------- heli: lathe fuselage + spotlight cone that lands on the road ----------
let rotor = null;
function buildHeli() {
  const heli = new THREE.Group();
  const pts = [[0, -0.55], [0.55, -0.5], [0.85, -0.2], [0.9, 0.25], [0.6, 0.6], [0.25, 0.75], [0, 0.78]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), M(0xf2f4f6, { roughness: 0.35, metalness: 0.25 }));
  body.castShadow = true; heli.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 12), M(0x223344, { roughness: 0.5, metalness: 0.4 }));
  belly.scale.set(0.95, 0.4, 1.1); belly.position.set(0, -0.5, 0); heli.add(belly);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12), M(0x0a1424, { roughness: 0.1, metalness: 0.9 }));
  glass.scale.set(1.0, 0.75, 1.1); glass.position.set(0, 0.18, -0.85); heli.add(glass);
  const boom = cyl(0.16, 0.28, 3.4, 0xf2f4f6); boom.rotation.z = Math.PI / 2 - 0.12; boom.position.set(2.1, 0.35, 0); heli.add(boom);
  const fin = box(0.1, 1.0, 0.7, 0x223344); fin.position.set(3.7, 0.75, 0); heli.add(fin);
  const skidL = cyl(0.05, 0.05, 2.2, 0x333333); skidL.rotation.x = Math.PI / 2; skidL.position.set(0, -0.85, 0.7); heli.add(skidL);
  const skidR = skidL.clone(); skidR.position.z = -0.7; heli.add(skidR);
  rotor = new THREE.Group();
  const blade = box(5.6, 0.06, 0.34, 0x222222); rotor.add(blade);
  const blade2 = blade.clone(); blade2.rotation.y = Math.PI / 2; rotor.add(blade2);
  rotor.position.y = 0.95; heli.add(rotor);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.9, 28),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.96; heli.add(disc);
  // WIDE spotlight cone down to the road + a bright pool where it lands
  const cone = new THREE.Mesh(new THREE.ConeGeometry(2.8, 16, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  cone.position.y = -8.8; cone.rotation.x = Math.PI; heli.add(cone);
  const spot = new THREE.SpotLight(0xfff2b0, 80, 40, 0.5, 0.5);
  spot.position.set(0, -0.5, 0); spot.target.position.set(0, -12, 0);
  heli.add(spot); heli.add(spot.target);
  return heli;
}

// ---------- palms / people / buildings ----------
function palm(x, z, sc = 1) {
  const g = new THREE.Group();
  const trunk = cyl(0.14, 0.22, 5.4, 0x8a6b46); trunk.position.y = 2.7; trunk.rotation.z = 0.08; g.add(trunk);
  for (let i = 0; i < 6; i++) {
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.55, 3.2, 4), M(0x2fae5f, { roughness: 0.8 }));
    frond.scale.set(1, 1, 0.18);
    const a = (i / 6) * Math.PI * 2;
    frond.position.set(Math.cos(a) * 1.15, 5.5, Math.sin(a) * 1.15);
    frond.rotation.set(Math.sin(a) * 1.9, 0, -Math.cos(a) * 1.9);
    frond.castShadow = true; g.add(frond);
  }
  const nut = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), M(0x6b4a2a));
  nut.position.set(0.3, 5.3, 0); g.add(nut);
  g.position.set(x, 0, z); g.scale.setScalar(sc); scene.add(g); return g;
}
function person(x, z, shirt, ry = 0, scale = 1) {
  const g = new THREE.Group();
  const body = cyl(0.28, 0.34, 1.05, shirt); body.position.y = 0.85; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), M(0xe8b98a, { roughness: 0.6 }));
  head.position.y = 1.62; head.castShadow = true; g.add(head);
  const legs = box(0.4, 0.6, 0.3, 0x2a2f45); legs.position.y = 0.3; g.add(legs);
  g.position.set(x, 0, z); g.rotation.y = ry; g.scale.setScalar(scale); scene.add(g); return g;
}
function building(x, z, w, h, d, base, lit, ry = 0) {
  const tex = buildingTexture(base, lit);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: SHOT === 'street' ? 1.6 : 0.25, roughness: 0.9 }));
  m.position.set(x, h / 2, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true;
  scene.add(m); return m;
}
function roadStrip(len = 120, zc = 0, walkColor = 0xb98a68) {
  const road = new THREE.Mesh(new THREE.PlaneGeometry(9, len), M(SHOT === 'street' ? 0x14161f : 0x3c3a44, { roughness: SHOT === 'street' ? 0.25 : 0.85, metalness: SHOT === 'street' ? 0.4 : 0 }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, zc); road.receiveShadow = true; scene.add(road);
  for (let z = zc - len / 2 + 2; z < zc + len / 2; z += 5) {
    const d = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 2),
      new THREE.MeshStandardMaterial({ color: 0xffc93c, emissive: SHOT === 'street' ? 0x664400 : 0x000000 }));
    d.position.set(0, 0.03, z); scene.add(d);
  }
  for (const sx of [-5.2, 5.2]) {
    const walk = new THREE.Mesh(new THREE.PlaneGeometry(3.4, len), M(walkColor, { roughness: 0.9 }));
    walk.rotation.x = -Math.PI / 2; walk.position.set(sx, 0.02, zc); walk.receiveShadow = true; scene.add(walk);
  }
}
const traffic = [];
const copCars = [];

// ---------- SCENE 1: cover — bright DAY beach boulevard chase, 16:00 ----------
function sceneCover() {
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(70, 130), M(0xe8c98f, { roughness: 1 }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(30, 0, 0); sand.receiveShadow = true; scene.add(sand);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(120, 130),
    new THREE.MeshStandardMaterial({ color: 0x2f9fd8, roughness: 0.15, metalness: 0.4 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(95, -0.15, 0); scene.add(sea);
  roadStrip(130, 0);
  // marina boats in the water to the east
  for (let i = 0; i < 5; i++) {
    const bx = 34 + i * 5, bz = -28 + i * 12;
    const hull = box(3.2, 0.9, 7, i % 2 ? 0xf2f2f2 : 0x2ea8ff); hull.position.set(bx, 0.35, bz); scene.add(hull);
    const mast = cyl(0.06, 0.06, 4.5, 0x888888); mast.position.set(bx, 2.6, bz); scene.add(mast);
  }
  // beach umbrellas + people on the sand (right side, like top-1)
  const umbCols = [0xff5a5a, 0xffd23e, 0x3ec6ff, 0xff7a3c, 0x7ee2a8, 0xff5ad2];
  for (let i = 0; i < 6; i++) {
    const ux = 13 + (i % 3) * 6, uz = -26 + Math.floor(i / 3) * 28;
    const um = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.9, 8), M(umbCols[i], { roughness: 0.7 }));
    um.position.set(ux, 1.7, uz); um.castShadow = true; scene.add(um);
    const pole = cyl(0.05, 0.05, 1.7, 0xeeeeee); pole.position.set(ux, 0.85, uz); scene.add(pole);
    person(ux + 1.8, uz + 1.2, [0xff5a7a, 0x7ee2a8, 0xffd23e][i % 3]);
    person(ux - 1.4, uz + 2.4, [0x2ea8ff, 0xff8a00, 0xb388ff][i % 3]);
  }
  // buildings west of the road, palms lining both sides, dense
  for (let i = 0; i < 6; i++) building(-13 - (i % 2) * 4, -36 + i * 15, 8, 9 + (i % 3) * 5, 8, '#c98f6a', 0.35);
  for (let z = -44; z <= 0; z += 9) { palm(-6.8, z, 1); palm(7.4, z + 4.5, 0.9); }
  // dense traffic ahead: 2 white police cruisers + red/white/pink cars + van
  const cop1 = buildTrafficCar(0xf2f2f2, true); cop1.position.set(-2.2, 0, -8); cop1.rotation.y = Math.PI + 0.12; scene.add(cop1); traffic.push(cop1); copCars.push(cop1);
  const cop2 = buildTrafficCar(0xf2f2f2, true); cop2.position.set(2.6, 0, -20); cop2.rotation.y = Math.PI - 0.15; scene.add(cop2); traffic.push(cop2); copCars.push(cop2);
  const civCols = [0xd21f26, 0xf2f2f2, 0xff7ab8, 0x2ea8ff, 0x22c55e];
  [[-2.2, -14, 0.1], [2.4, -30, 0], [-2.2, -40, 0.15], [2.4, -46, 0.05]].forEach(([x, z, ry], i) => {
    const c = buildTrafficCar(civCols[i]); c.position.set(x, 0, z); c.rotation.y = ry; scene.add(c); traffic.push(c);
  });
  const van = box(2.2, 2.2, 4.6, 0xf2f2f2, { roughness: 0.5, metalness: 0.2 }); van.position.set(-2.4, 1.1, -52); scene.add(van);
  // scooter rider on the right shoulder + sidewalk pedestrians
  const scoot = buildTrafficCar(0xff5a7a); scoot.scale.setScalar(0.45); scoot.position.set(4.2, 0, -8); scoot.rotation.y = Math.PI + 0.3; scene.add(scoot);
  person(4.4, -7.2, 0xffd23e, -0.6, 1.05);
  person(-6.4, 12, 0x2ea8ff, 1.2); person(6.6, -10, 0xff5a7a, -1.4); person(-6.2, -18, 0x7ee2a8, 0.6);
  person(6.8, 22, 0xb388ff, -2.2); person(-6.5, 30, 0xff8a00, 1.8);
  // explosion + fire glow ahead on the road (top-1 covers always have one)
  const fire = new THREE.PointLight(0xff6a00, 50, 22); fire.position.set(2.4, 1.6, -34); scene.add(fire);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.6, 8),
    new THREE.MeshBasicMaterial({ color: 0xff8a00, transparent: true, opacity: 0.9 }));
  flame.position.set(2.4, 1.5, -34); scene.add(flame);
  window.__flame = flame;
  const smoke = glowSprite(glowWhite, 5, 0.25); smoke.position.set(2.4, 3.2, -34); scene.add(smoke);
}

// ---------- SCENE 2: street — BRIGHT night market shootout, 19:31 ----------
// The moment: protagonist from behind in a red jacket, arms extended aiming,
// tracer to an enemy, one enemy DOWN on the floor, red markers over enemies,
// warm stall lights + crowd. Night reads through WARM LIGHT, never murk.
let protagonist = null, muzzle = null, tracer = null, tracerTimer = 0;
const enemies = [];
let boysDown = 1;
function buildShooter(x, z, jacket, ry, aiming) {
  const g = new THREE.Group();
  const body = cyl(0.24, 0.29, 1.05, jacket); body.position.y = 0.88; g.add(body);
  const shoulders = box(0.56, 0.22, 0.34, jacket); shoulders.position.y = 1.32; g.add(shoulders);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), M(0xe8b98a, { roughness: 0.6 }));
  head.position.y = 1.6; head.castShadow = true; g.add(head);
  const cap = cyl(0.23, 0.23, 0.1, 0x14141a); cap.position.y = 1.78; g.add(cap);
  const legs = box(0.36, 0.6, 0.28, 0x2a2f45); legs.position.y = 0.3; g.add(legs);
  if (aiming) { // both arms extended forward, holding a pistol
    const armL = box(0.13, 0.13, 0.9, jacket); armL.position.set(-0.15, 1.28, 0.5); g.add(armL);
    const armR = box(0.13, 0.13, 0.9, jacket); armR.position.set(0.15, 1.28, 0.5); g.add(armR);
    const gun = box(0.08, 0.14, 0.42, 0x14141a); gun.position.set(0, 1.3, 1.0); g.add(gun);
  } else {
    const arm = box(0.14, 0.7, 0.14, jacket); arm.position.set(-0.32, 1.0, 0); g.add(arm);
    const arm2 = arm.clone(); arm2.position.x = 0.32; g.add(arm2);
  }
  g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); return g;
}
function sceneStreet() {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), M(0x45474f, { roughness: 0.3, metalness: 0.35 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  roadStrip(120, 0, 0x2a2c38);
  // market stalls on BOTH sides: warm canopies, glowing counters, string lights
  const stallCols = [0xff8a3c, 0xffd23e, 0xff5ad2, 0x37e6ff, 0x7ee2a8, 0xff6a5a];
  const signs = ['TACOS · 24H', 'MANGO & RYE', 'NEON TIDELINE', 'PIER 5 · ARCADE', 'SATAY KING', 'GECKO BAR'];
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? 1 : -1;
    const z = -30 + i * 12;
    const x = side * 8.6;
    const stall = box(1.6, 2.6, 5.2, 0x2a2038); stall.position.set(x, 1.3, z); scene.add(stall);
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.1, 4), M(stallCols[i], { roughness: 0.7 }));
    canopy.position.set(x, 3.1, z); canopy.rotation.y = Math.PI / 4; canopy.castShadow = true; scene.add(canopy);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.1),
      new THREE.MeshBasicMaterial({ map: neonSignTexture(signs[i], '#ffd23e', '#141428') }));
    sign.position.set(x - side * 0.85, 2.2, z); sign.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; scene.add(sign);
    const glow = new THREE.PointLight(new THREE.Color(stallCols[i]), 45, 16); glow.position.set(x - side * 1.5, 2.4, z); scene.add(glow);
    const counter = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 1.2),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(stallCols[i]), transparent: true, opacity: 0.6 }));
    counter.position.set(x - side * 0.85, 0.9, z); counter.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; scene.add(counter);
  }
  // warm pools of light down the middle of the market street
  for (const wz of [-6, -16]) {
    const mid = new THREE.PointLight(0xffb45e, 26, 15); mid.position.set(0, 3.2, wz); scene.add(mid);
  }
  // string lights across the street (warm bokeh dots)
  for (let z = -36; z <= 30; z += 11) {
    for (let k = 0; k < 7; k++) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffd76a }));
      bulb.position.set(-6.5 + k * 2.2, 4.6 + Math.sin(k * 1.2) * 0.35, z); scene.add(bulb);
    }
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 13.4, 4), M(0x111111));
    wire.rotation.z = Math.PI / 2; wire.position.set(0, 4.9, z); scene.add(wire);
  }
  // warm street lamps down the middle of the market
  for (let z = -28; z <= 28; z += 14) {
    const pole = cyl(0.07, 0.07, 4.4, 0x222222); pole.position.set(-4.6, 2.2, z); scene.add(pole);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffc46a }));
    lamp.position.set(-4.6, 4.5, z); scene.add(lamp);
    const pl = new THREE.PointLight(0xffc46a, 30, 14); pl.position.set(-4.6, 4.3, z); scene.add(pl);
  }
  for (let i = 0; i < 4; i++) building(-24, -30 + i * 20, 9, 18 + i * 4, 9, '#2a2f45', 0.6);
  for (let i = 0; i < 3; i++) building(17, -20 + i * 22, 8, 12 + i * 5, 8, '#232838', 0.5);
  // THE SHOOTING MOMENT: protagonist aiming from behind, centre frame,
  // turned a touch so the extended arms + pistol read from behind-right
  protagonist = buildShooter(0.2, 7, 0xd21f26, Math.PI - 0.25, true);
  // muzzle flash sprite at the gun tip (lit on fire)
  muzzle = glowSprite(glowWhite, 1.2, 0.0);
  muzzle.position.set(0.2, 1.28, 5.9); scene.add(muzzle);
  // tracer: bright line from the gun to the target enemy, shown on fire
  const tracerGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 6);
  tracer = new THREE.Mesh(tracerGeo, new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0 }));
  scene.add(tracer);
  // enemies: 4 standing with RED markers, 1 DOWN on the floor
  const enemyDefs = [[-2.2, -2, 0x7a4a9e], [1.8, -6, 0x2a5a3a], [-0.6, -11, 0x8a2f2f], [2.6, -13, 0x3a3a6a]];
  for (const [ex, ez, shirt] of enemyDefs) {
    const e = buildShooter(ex, ez, shirt, 0, true);
    const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.32),
      new THREE.MeshBasicMaterial({ color: 0xff2233 }));
    marker.position.set(ex, 2.5, ez); scene.add(marker);
    enemies.push({ group: e, marker, alive: true, x: ex, z: ez });
  }
  const down = buildShooter(0.8, 4.5, 0x5a2a6a, 0, false);
  down.rotation.x = -Math.PI / 2; down.position.y = 0.35; scene.add(down);
  const blood = new THREE.Mesh(new THREE.CircleGeometry(0.7, 16),
    new THREE.MeshBasicMaterial({ color: 0x8a1020, transparent: true, opacity: 0.8 }));
  blood.rotation.x = -Math.PI / 2; blood.position.set(0.8, 0.04, 4.5); scene.add(blood);
  // crowd: ~10 people in bright clothes on both sidewalks, some ducking
  const crowdCols = [0xb388ff, 0xffd23e, 0x7ee2a8, 0xff5a7a, 0x37e6ff, 0xff8a00];
  [[-6.4, 4], [6.6, -2], [-6.2, -12], [6.4, 8], [-6.5, 16], [6.7, -16], [-6.3, -24], [6.5, 22], [-6.6, 28], [6.3, -28]].forEach(([px, pz], i) => {
    person(px, pz, crowdCols[i % crowdCols.length], (i * 1.3) % 6.28, i % 3 === 0 ? 0.85 : 1);
  });
  // wet-road light streaks from the stalls
  for (let i = 0; i < 8; i++) {
    const streak = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 6),
      new THREE.MeshBasicMaterial({ color: [0xff5ad2, 0x37e6ff, 0xffd23e][i % 3], transparent: true, opacity: 0.3 }));
    streak.rotation.x = -Math.PI / 2; streak.position.set(-3 + (i % 4) * 2, 0.04, -30 + i * 8); scene.add(streak);
  }
}

// ---------- SCENE 3: map — dusk city backdrop behind the full MAP menu ----------
function sceneMap() {
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(220, 220),
    new THREE.MeshStandardMaterial({ color: 0x2a6f9e, roughness: 0.2, metalness: 0.5 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, -2.2, -20); scene.add(sea);
  roadStrip(130, -10);
  for (let i = 0; i < 8; i++) building(-22 - (i % 3) * 6, -60 + i * 10, 9, 12 + (i % 4) * 6, 9, '#d98a6a', 0.5);
  for (let i = 0; i < 8; i++) building(24 + (i % 2) * 5, -55 + i * 11, 9, 10 + (i % 3) * 6, 9, '#c98f6a', 0.45);
  for (let z = -40; z <= 30; z += 12) { palm(-6.8, z, 1); palm(7.2, z + 6, 0.9); }
  const civ = buildTrafficCar(0xd21f26); civ.position.set(-2.2, 0, -16); civ.rotation.y = Math.PI; scene.add(civ);
  const cop = buildTrafficCar(0xf2f2f2, true); cop.position.set(2.4, 0, -26); cop.rotation.y = Math.PI; scene.add(cop); copCars.push(cop);
}

// ---------- SCENE 4: title — dusk skyline + beach + palms, wide shot ----------
function sceneTitle() {
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(90, 130), M(0xd8a86a, { roughness: 1 }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(10, 0, 10); sand.receiveShadow = true; scene.add(sand);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(140, 130),
    new THREE.MeshStandardMaterial({ color: 0x9e4a6a, roughness: 0.2, metalness: 0.5 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(80, -0.15, -10); scene.add(sea);
  roadStrip(120, -6);
  // dense dusk skyline across the bay, lit windows everywhere
  const skyCols = ['#8a5a6a', '#6a4a7a', '#7a5a5a', '#5a4a6a', '#9a6a5a'];
  for (let i = 0; i < 12; i++) {
    const bx = -48 + (i % 6) * 16, bz = -58 - Math.floor(i / 6) * 12;
    building(bx, bz, 10 + (i % 3) * 3, 16 + (i % 5) * 7, 10, skyCols[i % skyCols.length], 0.65);
  }
  // hotel sign glowing over the skyline, up high in a gap between towers
  const hotel = new THREE.Mesh(new THREE.PlaneGeometry(12, 3),
    new THREE.MeshBasicMaterial({ map: neonSignTexture('HOTEL MARISOL', '#ffd23e', '#1a1030') }));
  hotel.position.set(30, 30, -52); scene.add(hotel);
  const hotelGlow = new THREE.PointLight(0xffd23e, 30, 30); hotelGlow.position.set(30, 28, -46); scene.add(hotelGlow);
  // beach foreground: umbrellas + palms + a parked hero-coloured car
  for (let i = 0; i < 4; i++) {
    const ux = 12 + i * 7, uz = 8 - i * 3;
    const um = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.9, 8), M([0xff5a5a, 0xffd23e, 0x3ec6ff, 0xff7a3c][i], { roughness: 0.7 }));
    um.position.set(ux, 1.7, uz); um.castShadow = true; scene.add(um);
    const pole = cyl(0.05, 0.05, 1.7, 0xeeeeee); pole.position.set(ux, 0.85, uz); scene.add(pole);
  }
  for (let z = -20; z <= 0; z += 10) { palm(-7.2, z, 0.85); palm(8.4, z + 5, 0.85); }
  person(14, 2, 0xff5a7a, -1.2); person(18, -4, 0x7ee2a8, 2.4); person(11, -10, 0xffd23e, 0.5);
}

// ---------- SCENE 5: garage — actual interior, car on a lift pad ----------
function sceneGarage() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), M(0x3a3a40, { roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), M(0x24242c, { roughness: 0.95 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.y = 5.5; scene.add(ceil);
  const wallMat = M(0x4a4a55, { roughness: 0.9 });
  const mkWall = (w, h, x, y, z, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
    m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; scene.add(m); return m;
  };
  mkWall(16, 5.5, 0, 2.75, -6, 0); mkWall(16, 5.5, 0, 2.75, 6, Math.PI);
  mkWall(12, 5.5, -8, 2.75, 0, Math.PI / 2); mkWall(12, 5.5, 8, 2.75, 0, -Math.PI / 2);
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(16, 0.7), new THREE.MeshBasicMaterial({ color: 0xffd23e }));
  stripe.position.set(0, 4.6, -5.98); scene.add(stripe);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(6, 4),
    new THREE.MeshStandardMaterial({ color: 0x2c2f3a, roughness: 0.6, metalness: 0.6 }));
  door.position.set(-3.5, 2, -5.95); scene.add(door);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.75),
    new THREE.MeshBasicMaterial({ map: neonSignTexture('PALM COURT', '#ff5ad2', '#141428') }));
  sign.position.set(2.5, 3.6, -5.9); scene.add(sign);
  const signGlow = new THREE.PointLight(0xff5ad2, 14, 10); signGlow.position.set(2.5, 3.4, -4.5); scene.add(signGlow);
  for (const [x, z] of [[-4, -2], [4, -2], [0, 3]]) {
    const lamp = box(1.6, 0.12, 0.4, 0xffffff, { emissive: 0xfff2c0, emissiveIntensity: 2.2 });
    lamp.position.set(x, 5.3, z); scene.add(lamp);
    const pl = new THREE.PointLight(0xffe6b0, 22, 12); pl.position.set(x, 4.6, z); scene.add(pl);
  }
  const bench = box(3.4, 0.9, 1.1, 0x6b4a2a); bench.position.set(7.2, 0.45, -2); scene.add(bench);
  const benchTop = box(3.6, 0.1, 1.3, 0x2c2f3a); benchTop.position.set(7.2, 0.95, -2); scene.add(benchTop);
  for (let i = 0; i < 4; i++) {
    const tool = box(0.5, 0.25, 0.3, [0xff2233, 0xffd23e, 0x2ea8ff, 0x7ee2a8][i]);
    tool.position.set(6.2 + i * 0.7, 1.12, -2); scene.add(tool);
  }
  for (let s = 0; s < 2; s++) {
    const shelf = box(0.5, 0.08, 4, 0x6b4a2a); shelf.position.set(7.7, 2.2 + s * 1.1, 1); scene.add(shelf);
    for (let i = 0; i < 3; i++) {
      const can = cyl(0.18, 0.18, 0.5, [0xff7a3c, 0x2ea8ff, 0xffd23e][i]);
      can.position.set(7.7, 2.5 + s * 1.1, -0.4 + i * 1.2); scene.add(can);
    }
  }
  for (let i = 0; i < 3; i++) {
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.32, 18), M(0x141414, { roughness: 0.9 }));
    tire.position.set(-1.5, 0.16 + i * 0.34, -5.2); tire.castShadow = true; scene.add(tire);
  }
  const pad = box(5.4, 0.14, 3.2, 0x2c2f3a, { roughness: 0.5, metalness: 0.4 });
  pad.position.set(0, 0.07, 0); scene.add(pad);
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3),
    new THREE.MeshBasicMaterial({ map: neonSignTexture('RUKAN', '#37e6ff', '#101828') }));
  poster.position.set(-7.95, 2.6, 2); poster.rotation.y = Math.PI / 2; scene.add(poster);
}

// ---------- build the chosen scene ----------
({ cover: sceneCover, street: sceneStreet, map: sceneMap, title: sceneTitle, garage: sceneGarage })[SHOT]();

const hero = buildHeroCar(SHOT === 'cover' ? 0xef6a33 : 0xd21f26);
hero.position.set(...S.carPos);
hero.rotation.y = S.carRotY;
if (SHOT === 'street' || SHOT === 'title') hero.visible = false; // on foot / title: no car in frame
scene.add(hero);

let heli = null;
if (S.heli) {
  heli = buildHeli();
  heli.position.set(...S.heli);
  scene.add(heli);
}

// ---------- HUD ----------
const $ = id => document.getElementById(id);
function setHud() {
  if (SHOT === 'map' || SHOT === 'title') return;
  $('mKicker').textContent = S.kicker; $('mTitle').textContent = S.title;
  $('mStage').textContent = S.stage; $('mBar').style.width = S.bar + '%';
  $('mNext').textContent = S.next; $('mObj').textContent = S.obj;
  $('clock').textContent = S.time; $('mCash').textContent = S.cash;
  $('mStars').innerHTML = '★'.repeat(S.stars) + '<span class="off">' + '★'.repeat(5 - S.stars) + '</span>';
  $('mAir').textContent = S.air; $('mAir').style.display = S.air ? 'block' : 'none';
  $('dName').textContent = S.district; $('dSub').textContent = S.sub;
  $('dlgWho').textContent = S.who; $('dlgLine').textContent = S.line;
  $('radio').textContent = S.radio; $('radio').style.display = S.radio ? 'block' : 'none';
  $('spd').textContent = S.speed; $('spdCond').textContent = S.cond;
  $('lRank').textContent = S.rank; $('lRp').textContent = S.rp;
  $('vHealth').textContent = S.health; $('vArmour').textContent = S.armour;
  document.querySelectorAll('#vitals .vbar i')[0].style.width = S.health + '%';
  document.querySelectorAll('#vitals .vbar i')[1].style.width = S.armour + '%';
  if (SHOT === 'street') {
    $('dHead').innerHTML = 'KPD RESPONSE <span>2 UNITS</span>';
    $('dTable').innerHTML =
      '<tr><td>▲ FOOT ×2 · FOOT CHASE</td><td>21 m<span class="tag ram">FOOT CHASE</span></td></tr>' +
      '<tr><td>▲ CORAL-48 · IN PURSUIT</td><td>33 m<span class="tag flk">IN PURSUIT</span></td></tr>';
    $('dNote').textContent = 'CORAL-48: shots fired in the Pasaru night market';
    $('crewBox').innerHTML =
      '<div class="crew"><div class="face" style="background:#2ea8ff">M</div><div><b>SWAP PLATES</b><br>Mira · Driver</div><span class="key">Z</span></div>' +
      '<div class="crew"><div class="face" style="background:#b388ff">K</div><div><b>EYES OUT</b><br>Kiki · Lookout</div><span class="key">C</span></div>';
    $('help').textContent = 'W A S D move on foot · CLICK shoot · M map · ESC title';
  }
  if (SHOT === 'garage') {
    $('garagePanel').style.display = 'block';
    $('dispatch').style.display = 'none'; $('loadout').style.display = 'none';
    $('minimap').style.display = 'none'; $('vitals').style.display = 'none';
    $('help').textContent = 'G or BACK TO THE STREET to drive out';
  }
}
setHud();
$('backBtn').addEventListener('click', () => { location.search = '?shot=cover'; });

// minimap (2D canvas, different map per shot)
{
  const cv = $('minimap'), g = cv.getContext('2d');
  g.fillStyle = '#10182e'; g.fillRect(0, 0, 150, 150);
  if (SHOT === 'cover' || SHOT === 'title') {
    g.fillStyle = '#2f9fd8'; g.fillRect(96, 0, 54, 150);
    g.fillStyle = '#e8c98f'; g.fillRect(78, 0, 18, 150);
    g.strokeStyle = '#5a6a8a'; g.lineWidth = 8; g.beginPath(); g.moveTo(60, 0); g.lineTo(60, 150); g.stroke();
    g.strokeStyle = '#ffd23e'; g.lineWidth = 2; g.setLineDash([6, 4]);
    g.beginPath(); g.moveTo(60, 150); g.lineTo(60, 40); g.stroke(); g.setLineDash([]);
  } else if (SHOT === 'street') {
    g.strokeStyle = '#3a4a6a'; g.lineWidth = 7;
    for (let i = 1; i < 4; i++) {
      g.beginPath(); g.moveTo(i * 37, 0); g.lineTo(i * 37, 150); g.stroke();
      g.beginPath(); g.moveTo(0, i * 37); g.lineTo(150, i * 37); g.stroke();
    }
    g.fillStyle = '#ff5ad2'; g.fillRect(66, 30, 18, 10); g.fillStyle = '#37e6ff'; g.fillRect(30, 100, 18, 10);
    g.strokeStyle = '#ffd23e'; g.lineWidth = 2; g.beginPath(); g.moveTo(75, 140); g.lineTo(75, 40); g.stroke();
  } else {
    g.fillStyle = '#2a6f9e'; g.fillRect(0, 0, 150, 150);
    g.strokeStyle = '#3a3a46'; g.lineWidth = 12; g.beginPath(); g.moveTo(75, 20); g.lineTo(75, 130); g.stroke();
  }
  g.fillStyle = '#fff'; g.font = 'bold 13px Arial'; g.fillText('N', 8, 16);
  g.fillStyle = '#ff5a3c'; g.beginPath(); g.arc(75, 100, 5, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(75, 92); g.lineTo(70, 102); g.lineTo(80, 102); g.fill();
}

// ---------- MAP screen: checklist + big city map canvas ----------
const CHECKLIST = [
  ['Story missions', 5, 6], ['Street races', 1, 4], ['Stunt jumps', 5, 8],
  ['Golden Geckos', 12, 20], ['Export list', 3, 5], ['District jobs', 5, 7],
  ['Districts FRIENDLY', 3, 7], ['Crew recruited', 3, 3], ['Gold mission ratings', 2, 6],
];
{
  const el = $('mapChecklist');
  if (el) el.innerHTML = CHECKLIST.map(([name, a, b]) =>
    `<div class="row"><span>${name}</span><span>${a}/${b}</span></div><div class="bar"><i style="width:${Math.round(a / b * 100)}%"></i></div>`).join('');
}
function drawBigMap() {
  const cv = $('mapCanvas'); if (!cv) return;
  const g = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  g.fillStyle = '#0e1a2e'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#1d5a8a'; g.fillRect(0, 0, W, H); // sea
  // island landmass
  g.fillStyle = '#3a5a3a';
  g.beginPath(); g.moveTo(70, 60); g.bezierCurveTo(180, 10, 480, 20, 580, 90);
  g.bezierCurveTo(620, 200, 560, 420, 430, 480); g.bezierCurveTo(280, 520, 90, 450, 60, 300);
  g.bezierCurveTo(40, 180, 40, 110, 70, 60); g.fill();
  g.fillStyle = '#e8c98f'; // thin beach rim on the east edge
  g.beginPath(); g.moveTo(568, 88); g.bezierCurveTo(592, 200, 545, 390, 448, 462);
  g.bezierCurveTo(500, 380, 528, 200, 568, 88); g.fill();
  // districts
  const districts = [
    ['KUMALA STRAND', 480, 260, '#ff7a3c'], ['MARINA ROW', 330, 120, '#2ea8ff'],
    ['NEON ROW', 220, 230, '#ff5ad2'], ['TARPON BRIDGE', 300, 420, '#b388ff'],
    ['PALM COURT', 150, 360, '#7ee2a8'], ['OLD PASARU', 380, 330, '#ffd23e'],
  ];
  g.font = 'bold 15px Arial';
  for (const [name, x, y, col] of districts) {
    g.fillStyle = col; g.globalAlpha = 0.35;
    g.beginPath(); g.arc(x, y, 52, 0, 7); g.fill(); g.globalAlpha = 1;
    g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 52, 0, 7); g.stroke();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(name, x, y - 62);
  }
  // roads
  g.strokeStyle = '#d8d2c0'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(120, 90); g.lineTo(520, 120); g.lineTo(500, 400); g.lineTo(180, 430); g.lineTo(120, 90); g.stroke();
  g.beginPath(); g.moveTo(300, 120); g.lineTo(320, 420); g.stroke();
  // race route (dashed gold)
  g.strokeStyle = '#ffd23e'; g.lineWidth = 3; g.setLineDash([10, 7]);
  g.beginPath(); g.moveTo(480, 260); g.lineTo(380, 330); g.lineTo(300, 420); g.lineTo(180, 430); g.stroke();
  g.setLineDash([]);
  g.font = 'bold 12px Arial'; g.fillStyle = '#ffd23e'; g.textAlign = 'left';
  g.fillText('Terrace Climb · 0.79 km', 218, 388);
  // markers: H safehouse, G garage, R race, D jobs
  const marks = [['H', 150, 360, '#7ee2a8'], ['G', 220, 230, '#ff5ad2'], ['R', 480, 260, '#ff7a3c'], ['D', 380, 330, '#ffd23e'], ['✓', 330, 120, '#2ea8ff']];
  g.font = 'bold 14px Arial';
  for (const [t, x, y, col] of marks) {
    g.fillStyle = col; g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill();
    g.fillStyle = '#123'; g.textAlign = 'center'; g.fillText(t, x, y + 5);
  }
  // player arrow
  g.fillStyle = '#ff5a3c'; g.beginPath(); g.moveTo(480, 240); g.lineTo(472, 256); g.lineTo(488, 256); g.fill();
  g.fillStyle = '#fff'; g.font = 'bold 12px Arial'; g.textAlign = 'left';
  g.fillText('YOU — KUMALA STRAND', 330, 500);
  g.fillText('Waypoint: Terrace Climb start', 330, 518);
}
drawBigMap();
$('mapCanvas').addEventListener('click', e => {
  const r = e.target.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * 640, y = (e.clientY - r.top) / r.height * 520;
  drawBigMap();
  const g = $('mapCanvas').getContext('2d');
  g.fillStyle = '#ffd23e'; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill();
  g.fillStyle = '#123'; g.font = 'bold 12px Arial'; g.textAlign = 'center'; g.fillText('◆', x, y + 4);
  toast('WAYPOINT SET');
});

// ---------- gameplay ----------
const keys = {};
let toastTimer = 0;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(toastTimer); toastTimer = setTimeout(() => t.style.display = 'none', 1800); }
function goShot(shot) { location.search = '?shot=' + shot + (STILL ? '&still=1' : ''); }
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === 'g') goShot(SHOT === 'garage' ? 'cover' : 'garage');
  if (k === 'm') goShot(SHOT === 'map' ? 'cover' : 'map');
  if (k === 'escape') goShot(SHOT === 'title' ? 'cover' : 'title');
  if (k === 'enter' && SHOT === 'title') goShot('cover');
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
$('btnContinue').addEventListener('click', () => goShot('cover'));
$('btnNew').addEventListener('click', () => goShot('cover'));
$('btnLoad').addEventListener('click', () => goShot('cover'));
$('btnSettings').addEventListener('click', () => toast('SETTINGS — SOUND ON · MUSIC ON'));

// shooting (street shot): click fires at the nearest alive enemy ahead
function fireShot() {
  if (SHOT !== 'street' || !protagonist) return;
  const target = enemies.find(e => e.alive);
  if (!target) { toast('MARKET CLEAR — KERONO BOYS DOWN'); return; }
  const from = new THREE.Vector3(0.2, 1.28, 5.9);
  const to = new THREE.Vector3(target.x, 1.1, target.z);
  const mid = from.clone().add(to).multiplyScalar(0.5);
  tracer.position.copy(mid);
  tracer.scale.set(1, from.distanceTo(to), 1);
  tracer.lookAt(to.x, to.y, to.z); tracer.rotateX(Math.PI / 2);
  tracer.material.opacity = 0.95; tracerTimer = 0.12;
  muzzle.material.opacity = 0.95;
  target.alive = false;
  target.group.rotation.x = -Math.PI / 2; target.group.position.y = 0.35;
  target.marker.visible = false;
  boysDown++;
  $('mObj').textContent = `Take out the Kerono Boys ${Math.min(boysDown, 5)}/5`;
  $('mTitle').textContent = boysDown >= 5 ? 'MARKET SQUEEZE — CLEAR' : 'TAKE OUT THE KERONO BOYS';
  toast(boysDown >= 5 ? 'MARKET CLEAR — OLD PASARU IS YOURS' : `KERONO BOY DOWN — ${boysDown}/5`);
}
addEventListener('mousedown', e => { if (SHOT === 'street' && !e.target.closest('button')) fireShot(); });

let speed = S.speed, carX = S.carPos[0], carZ = S.carPos[2], stage = S.bar;
const checkpoints = (SHOT === 'cover' ? [-14, -34, -54] : []).map(z => {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.18, 10, 28),
    new THREE.MeshBasicMaterial({ color: 0xffd23e }));
  ring.position.set(0, 2.2, z); ring.rotation.y = Math.PI / 2; scene.add(ring); return ring;
});
let cpIndex = 0;

// ---------- animate ----------
const clock = new THREE.Clock();
let elapsed = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!STILL) elapsed += dt;
  const t = STILL ? 1.2 : elapsed;
  if (rotor) rotor.rotation.y = t * 22;
  if (window.__flame) window.__flame.scale.y = 1 + Math.sin(t * 13) * 0.25;
  for (const cop of copCars) {
    if (!cop.userData.copLights) continue;
    const on = Math.sin(t * 9) > 0;
    cop.userData.copLights[0].intensity = on ? 3 : 0.4;
    cop.userData.copLights[1].intensity = on ? 0.4 : 3;
  }
  if (tracerTimer > 0 && !STILL) { tracerTimer -= dt; if (tracerTimer <= 0) { tracer.material.opacity = 0; muzzle.material.opacity = 0; } }
  // driving (open scenes only, not in still screenshot mode)
  if ((SHOT === 'cover' || SHOT === 'map') && !STILL) {
    const nitro = keys['shift'] ? 1.6 : 1;
    if (keys['w'] || keys['arrowup']) speed = Math.min(168, speed + 42 * dt * nitro);
    else if (keys['s'] || keys['arrowdown']) speed = Math.max(0, speed - 60 * dt);
    else speed = Math.max(0, speed - 8 * dt);
    if (keys['a'] || keys['arrowleft']) carX = Math.max(-3.4, carX - 6 * dt);
    if (keys['d'] || keys['arrowright']) carX = Math.min(3.4, carX + 6 * dt);
    carZ -= speed * 0.045 * dt;
    hero.position.set(carX, 0, carZ);
    hero.rotation.y = S.carRotY + (keys['a'] || keys['arrowleft'] ? 0.12 : keys['d'] || keys['arrowright'] ? -0.12 : 0);
    if (SHOT === 'cover') { camera.position.set(carX, 2.3, carZ + 7.8); camera.lookAt(carX, 1, carZ - 12); }
    else { camera.position.set(carX * 0.7 + 3.1, 2.5, carZ + 9.5); camera.lookAt(carX, 1, carZ - 10); }
    $('spd').textContent = Math.round(speed);
    if (cpIndex < checkpoints.length && carZ < checkpoints[cpIndex].position.z) {
      checkpoints[cpIndex].visible = false; cpIndex++;
      stage = Math.min(100, stage + 12); $('mBar').style.width = stage + '%';
      toast(cpIndex === checkpoints.length ? 'DISTRICT TAKEN — KUMALA STRAND' : 'CHECKPOINT — STAGE UP');
    }
    for (const c of traffic) { c.position.z += speed * 0.02 * dt; if (c.position.z > carZ + 30) c.position.z -= 90; }
  }
  // on-foot movement (street shot)
  if (SHOT === 'street' && protagonist && !STILL) {
    let px = protagonist.position.x, pz = protagonist.position.z;
    if (keys['w'] || keys['arrowup']) pz -= 5 * dt;
    if (keys['s'] || keys['arrowdown']) pz += 5 * dt;
    if (keys['a'] || keys['arrowleft']) px -= 5 * dt;
    if (keys['d'] || keys['arrowright']) px += 5 * dt;
    px = Math.max(-4, Math.min(4, px)); pz = Math.max(-16, Math.min(12, pz));
    protagonist.position.set(px, 0, pz);
    muzzle.position.set(px, 1.28, pz - 1.1);
    camera.position.set(px * 0.7 + 2.8, 2.0, pz + 5.2);
    camera.lookAt(px - 0.4, 1.15, pz - 15);
  }
  if (heli && !STILL) { heli.position.y = S.heli[1] + Math.sin(t * 0.8) * 0.4; heli.rotation.y = Math.sin(t * 0.2) * 0.2; }
  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

window.__gameReady = true;
console.log('[marisol-bay] shot=' + SHOT + ' ready');
