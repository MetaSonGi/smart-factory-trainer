import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* 스마트공장 검증 장비 3D 씬 */
const F = {
  power: false, conveyorOn: false, robotOn: false, inspectOn: false,
  count: 0, moved: 0, inspected: 0, good: 0, bad: 0,
  results: [], armPhase: 0, inspTimer: 0, lampTimer: 0,
};
window.__factory = F;
F.onEvent = null;
const emit = (type, data) => { if (F.onEvent) F.onEvent(type, data); };

const viewport = document.getElementById('viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070c);
scene.fog = new THREE.Fog(0x05070c, 34, 80);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
camera.position.set(13, 11, 15);
const renderer = new THREE.WebGLRenderer({ antialias: true });
viewport.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.maxPolarAngle = Math.PI / 2.05;

scene.add(new THREE.AmbientLight(0x8899bb, 0.75));
const key = new THREE.DirectionalLight(0xffffff, 1.5);
key.position.set(10, 18, 8); scene.add(key);
const rim = new THREE.DirectionalLight(0x2f81f7, 0.5);
rim.position.set(-12, 8, -10); scene.add(rim);

/* 바닥 & 베이스 테이블 */
const floor = new THREE.Mesh(new THREE.PlaneGeometry(70, 70),
  new THREE.MeshStandardMaterial({ color: 0x11161d, roughness: 0.95 }));
floor.rotation.x = -Math.PI / 2; scene.add(floor);
scene.add(new THREE.GridHelper(70, 70, 0x2f81f7, 0x1a2230));
const table = new THREE.Mesh(new THREE.BoxGeometry(24, 0.6, 12),
  new THREE.MeshStandardMaterial({ color: 0x2a3340, roughness: 0.6, metalness: 0.3 }));
table.position.y = 0.3; scene.add(table);
const tableTop = new THREE.Mesh(new THREE.BoxGeometry(24, 0.08, 12),
  new THREE.MeshStandardMaterial({ color: 0x39424f, roughness: 0.5 }));
tableTop.position.y = 0.64; scene.add(tableTop);

/* 컨베이어 */
const railMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.6, roughness: 0.4 });
const belt = new THREE.Mesh(new THREE.BoxGeometry(15, 0.25, 2.2),
  new THREE.MeshStandardMaterial({ color: 0x232b38, roughness: 0.7 }));
belt.position.set(-2, 1.35, -2.5); scene.add(belt);
[-3.6, -1.4].forEach((z) => {
  const rail = new THREE.Mesh(new THREE.BoxGeometry(15, 0.2, 0.12), railMat);
  rail.position.set(-2, 1.6, z); scene.add(rail);
});
const rollers = [];
for (let i = 0; i < 11; i++) {
  const r = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.0, 10), railMat);
  r.rotation.x = Math.PI / 2; r.position.set(-8.8 + i * 1.36, 1.4, -2.5);
  scene.add(r); rollers.push(r);
}

/* 제품 */
const products = [];
for (let i = 0; i < 6; i++) {
  const p = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85),
    new THREE.MeshStandardMaterial({ color: 0x00d4aa, roughness: 0.5 }));
  p.position.set(-9 + i * 2.6, 1.9, -2.5);
  scene.add(p); products.push(p);
}

/* 로봇팔 */
const armMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, metalness: 0.4, roughness: 0.35 });
const armDark = new THREE.MeshStandardMaterial({ color: 0x222831, metalness: 0.5, roughness: 0.4 });
const armBase = new THREE.Group(); armBase.position.set(2.5, 0.68, 0.5);
const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 1.0, 20), armDark);
ped.position.y = 0.5; armBase.add(ped);
const shoulder = new THREE.Group(); shoulder.position.y = 1.0; armBase.add(shoulder);
const upper = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.2, 0.45), armMat);
upper.position.y = 1.1; shoulder.add(upper);
const elbow = new THREE.Group(); elbow.position.y = 2.2; shoulder.add(elbow);
const fore = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.9, 0.38), armMat);
fore.position.y = 0.95; elbow.add(fore);
const grip = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.65),
  new THREE.MeshStandardMaterial({ color: 0xd29922, metalness: 0.5, roughness: 0.4 }));
grip.position.y = 2.0; elbow.add(grip);
scene.add(armBase);

/* 비전 검사 스테이션 */
const inspX = 7.5, inspZ = 0.5;
const inspBase = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 2.6),
  new THREE.MeshStandardMaterial({ color: 0x2a3340, roughness: 0.6 }));
inspBase.position.set(inspX, 0.93, inspZ); scene.add(inspBase);
const camPole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.6, 10), railMat);
camPole.position.set(inspX, 2.4, inspZ - 0.9); scene.add(camPole);
const camHead = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), armDark);
camHead.position.set(inspX, 3.7, inspZ - 0.9); scene.add(camHead);
const camEye = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12),
  new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xaa0000 }));
camEye.position.set(inspX, 3.7, inspZ - 0.5); scene.add(camEye);
const lampGood = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 14),
  new THREE.MeshStandardMaterial({ color: 0x1a3a24, emissive: 0x0a1f12 }));
lampGood.position.set(inspX - 0.7, 3.1, inspZ - 0.9); scene.add(lampGood);
const lampBad = lampGood.clone();
lampBad.material = new THREE.MeshStandardMaterial({ color: 0x3a1a1a, emissive: 0x1f0a0a });
lampBad.position.x = inspX + 0.7; scene.add(lampBad);

/* 분류 박스 */
function bin(x, color, label) {
  const g = new THREE.Group(); g.position.set(x, 0.68, 3.6);
  const walls = new THREE.MeshStandardMaterial({ color, roughness: 0.6, transparent: true, opacity: 0.85 });
  const b = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 2.2), walls); b.position.y = 0.08; g.add(b);
  [[0, 1.05], [0, -1.05]].forEach(([px, pz]) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 0.12), walls);
    w.position.set(px, 0.55, pz); g.add(w);
  });
  [[1.05, 0], [-1.05, 0]].forEach(([px, pz]) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 2.2), walls);
    w.position.set(px, 0.55, pz); g.add(w);
  });
  scene.add(g); return g;
}
const binGood = bin(6.2, 0x1f7a4d); const binBad = bin(9.0, 0x8a2a2a);
const binItems = [];

/* 제어 패널 */
const panelBox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 0.8),
  new THREE.MeshStandardMaterial({ color: 0x39424f, roughness: 0.5, metalness: 0.3 }));
panelBox.position.set(-10.5, 1.98, 2.5); scene.add(panelBox);
const powerLampMat = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0x000000 });
const powerLamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), powerLampMat);
powerLamp.position.set(-10.5, 2.9, 2.95); scene.add(powerLamp);
const runLampMat = powerLampMat.clone();
const runLamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), runLampMat);
runLamp.position.set(-10.1, 2.9, 2.95); scene.add(runLamp);

/* 동작 API */
F.powerOn = () => { if (F.power) return; F.power = true;
  powerLampMat.color.setHex(0x3fb950); powerLampMat.emissive.setHex(0x1a5c2a);
  emit('power'); };
F.conveyorStart = () => { if (!F.power || F.conveyorOn) return; F.conveyorOn = true;
  runLampMat.color.setHex(0x2f81f7); runLampMat.emissive.setHex(0x0a2a5e); emit('conveyor'); };
F.robotStart = () => { if (!F.power || F.robotOn) return; F.robotOn = true; emit('robot'); };
F.inspectStart = () => { if (!F.power || F.inspectOn) return; F.inspectOn = true; emit('inspect'); };
F.reset = () => {
  Object.assign(F, { power: false, conveyorOn: false, robotOn: false, inspectOn: false,
    count: 0, moved: 0, inspected: 0, good: 0, bad: 0, results: [], inspTimer: 0 });
  products.forEach((p, i) => { p.position.set(-9 + i * 2.6, 1.9, -2.5); p.visible = true;
    p.material.color.setHex(0x00d4aa); });
  binItems.forEach((b) => scene.remove(b)); binItems.length = 0;
  powerLampMat.color.setHex(0x333333); powerLampMat.emissive.setHex(0x000000);
  runLampMat.color.setHex(0x333333); runLampMat.emissive.setHex(0x000000);
  lampGood.material.emissive.setHex(0x0a1f12); lampBad.material.emissive.setHex(0x1f0a0a);
  emit('reset');
};

function flashLamp(ok) {
  const lamp = ok ? lampGood : lampBad;
  lamp.material.emissive.setHex(ok ? 0x2aff5a : 0xff2a2a);
  F.lampTimer = 1.2; F._lampOk = ok;
}

/* 시뮬레이션 루프 */
let last = performance.now();
function step(dt) {
  if (F.power && F.conveyorOn) {
    products.forEach((p) => {
      if (!p.visible) return;
      p.position.x += 2.4 * dt;
      if (p.position.x > 5.6) { p.position.x = -9.5; F.count++; emit('fed', { count: F.count }); }
    });
    rollers.forEach((r) => { r.rotation.y += 5 * dt; });
  }
  if (F.power && F.robotOn) {
    F.armPhase += dt * 1.6;
    const ph = F.armPhase % (Math.PI * 2);
    shoulder.rotation.y = Math.sin(ph) * 1.1;
    elbow.rotation.x = -0.6 - Math.abs(Math.sin(ph)) * 0.45;
    grip.position.y = 2.0 - Math.abs(Math.sin(ph * 2)) * 0.8;
    if (ph < 0.08 && F._armTick !== Math.floor(F.armPhase / (Math.PI * 2))) {
      F._armTick = Math.floor(F.armPhase / (Math.PI * 2));
      F.moved++; emit('moved', { moved: F.moved });
    }
  }
  if (F.power && F.inspectOn) {
    F.inspTimer += dt;
    camEye.material.emissive.setHex(0xaa0000 + Math.floor(Date.now() / 200) % 2 * 0x440000);
    if (F.inspTimer > 1.6) {
      F.inspTimer = 0;
      const ok = Math.random() > 0.15;
      F.inspected++; ok ? F.good++ : F.bad++;
      F.results.push(ok ? 1 : 0);
      flashLamp(ok);
      const item = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6),
        new THREE.MeshStandardMaterial({ color: ok ? 0x3fb950 : 0xf85149, roughness: 0.5 }));
      const bx = ok ? 6.2 : 9.0;
      item.position.set(bx + (Math.random() - 0.5) * 1.2, 1.6 + binItems.length * 0.02, 3.6 + (Math.random() - 0.5) * 1.2);
      scene.add(item); binItems.push(item);
      emit('inspected', { inspected: F.inspected, good: F.good, bad: F.bad, ok });
    }
  }
  if (F.lampTimer > 0) {
    F.lampTimer -= dt;
    if (F.lampTimer <= 0) {
      lampGood.material.emissive.setHex(0x0a1f12);
      lampBad.material.emissive.setHex(0x1f0a0a);
    }
  }
}

function onResize() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  if (!w || !h) return;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', onResize);
onResize();

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (!document.getElementById('simulator').classList.contains('hidden')) step(dt);
  controls.update();
  renderer.render(scene, camera);
}
loop(last);
