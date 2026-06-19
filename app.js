let state = 1;
let wishOpened = false;
let carouselTarget = 0;
let celebration = 0;
let passValue = "";
let isDragging = false;
let lastPointerX = 0;
let dragVelocity = 0;

const photoPaths = Array.from({ length: 6 }, (_, i) => `carousel-images/g${i + 1}.jpg`);
const timelinePaths = Array.from({ length: 18 }, (_, i) => `images/g${i + 1}.jpg`);
const pages = document.querySelectorAll(".page");
const canvas = document.getElementById("scene");
const passDots = document.querySelectorAll(".pass-display span");
const glitterLayer = document.getElementById("glitterLayer");
let lastGlitterTime = 0;

function showPage(id) {
  const current = document.querySelector(".page.active");
  const next = document.getElementById("page" + id);

  if (!next || current === next) return;
  document.body.classList.add("is-transitioning");

  if (current) {
    current.animate(
      [
        { opacity: 1, transform: "translateY(0) scale(1)" },
        { opacity: 0, transform: "translateY(-16px) scale(1.02)" }
      ],
      { duration: 360, easing: "ease", fill: "forwards" }
    );
  }

  window.setTimeout(() => {
    pages.forEach((page) => {
      page.classList.remove("active");
      page.style.opacity = "";
      page.style.transform = "";
    });

    next.classList.add("active");
    next.animate(
      [
        { opacity: 0, transform: "translateY(18px) scale(0.98)" },
        { opacity: 1, transform: "translateY(0) scale(1)" }
      ],
      { duration: 620, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" }
    );

    state = id;
    updateSceneMode();
    window.setTimeout(() => document.body.classList.remove("is-transitioning"), 520);
  }, 280);
}

function unlock() {
  const pass = document.getElementById("pass").value.trim();

  if (pass === "21062001") {
    const music = document.getElementById("music");
    if (music) music.play().catch(() => { });
    showPage(2);
  } else {
    document.getElementById("error").innerText = "Wrong date, but the love is still correct.";
    passValue = "";
    updatePassDisplay();
  }
}

function showSecretPassword() {
  const secret = "21062001";
  document.getElementById("universe").style.display = "none";

  // Show Password
  document.getElementById("showpass").style.display = "block";
  document.getElementById("showpass").textContent = secret;

}


function tapKey(number) {
  if (passValue.length >= 8) return;
  passValue += number;
  updatePassDisplay();

  if (passValue.length === 8) {
    window.setTimeout(unlock, 180);
  }
}

function deleteKey() {
  passValue = passValue.slice(0, -1);
  updatePassDisplay();
  document.getElementById("error").innerText = "";
}

function updatePassDisplay() {
  const input = document.getElementById("pass");
  input.value = passValue;
  passDots.forEach((dot, index) => {
    dot.classList.toggle("filled", index < passValue.length);
  });
}

function goToWishes() {
  showPage(3);
}

function goToTimeline() {
  showPage(5);
}

function revealWish() {
  if (wishOpened) return;
  wishOpened = true;

  const seal = document.querySelector(".letter-seal");
  const heading = document.querySelector(".letter-heading");
  if (seal) seal.classList.add("is-hidden");
  if (heading) heading.classList.add("is-compact");

  const box = document.getElementById("wishText");
  box.classList.add("poster");
  box.innerHTML = `
    <span class="poster-title">To My Geet</span>
    <span class="poster-lines">You are my peace, my favorite smile, and the softest part of my world.

I hope this birthday feels as loved as you make me feel every day.

Happy Birthday, my love.</span>
    <span class="floating-heart">♥</span>
    <span class="floating-heart">♥</span>
    <span class="floating-heart">♥</span>
  `;

  const btn = document.createElement("button");
  btn.className = "primary-btn";
  btn.type = "button";
  btn.innerText = "Continue";
  btn.onclick = () => showPage(4);
  box.appendChild(btn);
}

function spawnGlitter(x, y) {
  if (!glitterLayer) return;

  const sparkle = document.createElement("span");
  const size = 7 + Math.random() * 10;
  const driftX = (Math.random() - 0.5) * 90;
  const driftY = -34 - Math.random() * 70;
  const hue = Math.random() > 0.5 ? "var(--rose)" : "var(--gold)";

  sparkle.className = "glitter";
  sparkle.style.left = x + "px";
  sparkle.style.top = y + "px";
  sparkle.style.width = size + "px";
  sparkle.style.height = size + "px";
  sparkle.style.color = hue;
  sparkle.style.setProperty("--glitter-x", driftX + "px");
  sparkle.style.setProperty("--glitter-y", driftY + "px");

  glitterLayer.appendChild(sparkle);
  window.setTimeout(() => sparkle.remove(), 900);
}

function glitterFromPointer(event) {
  const now = performance.now();
  if (now - lastGlitterTime < 5) return;
  lastGlitterTime = now;

  const points = event.touches ? Array.from(event.touches) : [event];
  points.forEach((point) => {
    spawnGlitter(point.clientX, point.clientY);
    if (Math.random() > 0.45) {
      spawnGlitter(point.clientX + (Math.random() - 0.5) * 28, point.clientY + (Math.random() - 0.5) * 28);
    }
  });
}

function celebrate() {
  const heart = document.getElementById("heart");
  if (heart) heart.play().catch(() => { });
  celebration = 1;
  resetHeartFireworks();
  showPage(4);
}

function rotateMemories(direction) {
  carouselTarget += direction * (Math.PI * 2 / photoPaths.length);
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && state === 1) unlock();
  if (/^\d$/.test(event.key) && state === 1) tapKey(event.key);
  if (event.key === "Backspace" && state === 1) deleteKey();
  if (event.key === "ArrowLeft" && state === 2) rotateMemories(-1);
  if (event.key === "ArrowRight" && state === 2) rotateMemories(1);
});

window.addEventListener("pointermove", glitterFromPointer, { passive: true });
window.addEventListener("pointerdown", glitterFromPointer, { passive: true });
window.addEventListener("touchmove", glitterFromPointer, { passive: true });
window.addEventListener("touchstart", glitterFromPointer, { passive: true });

let renderer;
let scene;
let camera;
let carousel;
let starField;
let burst;
let frameLights = [];
let sceneMode = 0;
let heartFireworks = [];

function initScene() {
  if (!window.THREE || !canvas) return;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.2, 8);

  const ambient = new THREE.AmbientLight(0xffe0d2, 1.5);
  const key = new THREE.PointLight(0xff7ba7, 18, 24);
  key.position.set(-4, 3, 6);
  const rim = new THREE.PointLight(0x64e4d1, 9, 18);
  rim.position.set(4, -1, 4);
  scene.add(ambient, key, rim);

  carousel = new THREE.Group();
  scene.add(carousel);
  createPhotoCarousel();
  createStars();
  createBurst();
  updateSceneMode();

  window.addEventListener("resize", resizeScene);
  addDragControls();
  animateScene();
}

function addDragControls() {
  canvas.addEventListener("pointerdown", (event) => {
    isDragging = true;
    lastPointerX = event.clientX;
    dragVelocity = 0;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    const delta = event.clientX - lastPointerX;
    lastPointerX = event.clientX;
    dragVelocity = delta * 0.006;
    carouselTarget += dragVelocity;
  });

  canvas.addEventListener("pointerup", (event) => {
    isDragging = false;
    canvas.releasePointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointercancel", () => {
    isDragging = false;
  });
}

function createPhotoCarousel() {
  const loader = new THREE.TextureLoader();
  const radius = 2.7;

  photoPaths.forEach((path, index) => {
    const texture = loader.load(path);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 15;

    const group = new THREE.Group();
    const angle = index / photoPaths.length * Math.PI * 2;
    group.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
    group.rotation.y = angle;

    const imageWidth = 1.72;
    const imageHeight = 2.3;
    const frameThickness = 0.1;

    const imageGeometry = new THREE.PlaneGeometry(imageWidth, imageHeight);
    const imageMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.44,
      metalness: 0.02,
      emissive: new THREE.Color(0x1a0711),
      emissiveIntensity: 0.08
    });

    const image = new THREE.Mesh(imageGeometry, imageMaterial);
    image.position.z = 0.05;

    const backImage = new THREE.Mesh(imageGeometry.clone(), imageMaterial.clone());
    backImage.position.z = -0.07;
    backImage.rotation.y = Math.PI;

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0xffc86b,
      roughness: 0.26,
      metalness: 0.72,
      emissive: 0x2a1205,
      emissiveIntensity: 0.18
    });

    const backing = new THREE.Mesh(
      new THREE.BoxGeometry(imageWidth + 0.22, imageHeight + 0.22, 0.06),
      new THREE.MeshStandardMaterial({
        color: 0x160d1c,
        roughness: 0.38,
        metalness: 0.1
      })
    );
    backing.position.z = -0.035;

    const topFrame = new THREE.Mesh(
      new THREE.BoxGeometry(imageWidth + 0.22, frameThickness, 0.12),
      frameMaterial
    );
    topFrame.position.set(0, imageHeight / 2 + frameThickness / 2, 0.04);

    const bottomFrame = topFrame.clone();
    bottomFrame.position.y = -imageHeight / 2 - frameThickness / 2;

    const leftFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, imageHeight + 0.2, 0.12),
      frameMaterial
    );
    leftFrame.position.set(-imageWidth / 2 - frameThickness / 2, 0, 0.04);

    const rightFrame = leftFrame.clone();
    rightFrame.position.x = imageWidth / 2 + frameThickness / 2;

    const backTopFrame = topFrame.clone();
    backTopFrame.position.z = -0.08;
    const backBottomFrame = bottomFrame.clone();
    backBottomFrame.position.z = -0.08;
    const backLeftFrame = leftFrame.clone();
    backLeftFrame.position.z = -0.08;
    const backRightFrame = rightFrame.clone();
    backRightFrame.position.z = -0.08;

    const cutout = new THREE.Mesh(
      new THREE.PlaneGeometry(1.98, 2.56),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.05,
        depthWrite: false
      })
    );
    cutout.position.z = 0.06;

    const light = new THREE.PointLight(index % 2 ? 0x64e4d1 : 0xff6f9f, 2.2, 4);
    light.position.set(0, 0, 0.8);
    frameLights.push(light);

    group.add(
      backing,
      topFrame,
      bottomFrame,
      leftFrame,
      rightFrame,
      backTopFrame,
      backBottomFrame,
      backLeftFrame,
      backRightFrame,
      image,
      backImage,
      cutout,
      light
    );
    carousel.add(group);
  });
}

function createStars() {
  const count = 3000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const colorA = new THREE.Color(0xffc86b);
  const colorB = new THREE.Color(0x64e4d1);

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 22;
    positions[i3 + 1] = (Math.random() - 0.5) * 14;
    positions[i3 + 2] = -Math.random() * 14;

    const mixed = colorA.clone().lerp(colorB, Math.random());
    colors[i3] = mixed.r;
    colors[i3 + 1] = mixed.g;
    colors[i3 + 2] = mixed.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  starField = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      depthWrite: false
    })
  );
  scene.add(starField);
}

function createBurst() {
  const heartCount = 180;
  const fireworkCount = heartCount * 3;
  const positions = new Float32Array(fireworkCount * 3);
  const colors = new Float32Array(fireworkCount * 3);
  const colorA = new THREE.Color(0xff2f83);
  const colorB = new THREE.Color(0xffc86b);

  for (let i = 0; i < fireworkCount; i += 1) {
    const i3 = i * 3;
    positions[i3] = 0;
    positions[i3 + 1] = 0;
    positions[i3 + 2] = 0;

    const mixed = colorA.clone().lerp(colorB, Math.random() * 0.5);
    colors[i3] = mixed.r;
    colors[i3 + 1] = mixed.g;
    colors[i3 + 2] = mixed.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  burst = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.085,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  burst.position.set(0, 0, 1.2);
  scene.add(burst);
  resetHeartFireworks();
}

function heartPoint(t, scale) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return new THREE.Vector3(x * scale, y * scale, (Math.random() - 0.5) * 0.45);
}

function resetHeartFireworks() {
  if (!burst) return;

  heartFireworks = [];
  const positions = burst.geometry.attributes.position.array;
  const perHeart = 180;
  const origins = [
    new THREE.Vector3(-1.6, 0.2, 0.7),
    new THREE.Vector3(1.45, -0.15, 0.45),
    new THREE.Vector3(0, 0.75, 0.2)
  ];

  origins.forEach((origin, burstIndex) => {
    for (let i = 0; i < perHeart; i += 1) {
      const globalIndex = burstIndex * perHeart + i;
      const i3 = globalIndex * 3;
      const point = heartPoint((i / perHeart) * Math.PI * 2, 0.055 + burstIndex * 0.006);
      point.y += 0.18;

      positions[i3] = origin.x;
      positions[i3 + 1] = origin.y;
      positions[i3 + 2] = origin.z;

      heartFireworks[globalIndex] = {
        origin,
        target: origin.clone().add(point),
        drift: new THREE.Vector3((Math.random() - 0.5) * 0.35, Math.random() * 0.4, (Math.random() - 0.5) * 0.35),
        delay: burstIndex * 0.16 + Math.random() * 0.15
      };
    }
  });

  burst.geometry.attributes.position.needsUpdate = true;
  burst.material.opacity = 0;
}

function updateSceneMode() {
  sceneMode = state;
  if (!carousel || !camera) return;

  if (state === 1) {
    carouselTarget = -0.55;
  }

  if (state === 3) {
    carouselTarget = Math.PI * 0.2;
  }
}

function resizeScene() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function renderTimeline() {
  const list = document.getElementById("timelineList");
  if (!list) return;
  if (list.dataset.rendered === "true") return;
  list.dataset.rendered = "true";

  const fragment = document.createDocumentFragment();

  timelinePaths.forEach((src, index) => {
    const idx = index + 1;
    const side = index % 2 === 0 ? "left" : "right";
    const label = `Memory ${String(idx).padStart(2, "0")}`;

    const item = document.createElement("article");
    item.className = `timeline-item ${side}`;
    item.setAttribute("aria-label", label);

    const bubble = document.createElement("div");
    bubble.className = "timeline-bubble";

    const dot = document.createElement("div");
    dot.className = "timeline-dot";
    dot.setAttribute("aria-hidden", "true");

    const year = document.createElement("div");
    year.className = "timeline-year";
    year.textContent = label;

    const card = document.createElement("div");
    card.className = "timeline-card";

    const img = document.createElement("img");
    img.src = src;
    img.alt = label;

    const caption = document.createElement("div");
    caption.className = "timeline-caption";
    caption.innerHTML = `<span class="timeline-caption-strong">${label}</span><span class="timeline-caption-muted">— placed in order</span>`;

    card.appendChild(img);
    card.appendChild(caption);

    bubble.appendChild(year);
    bubble.appendChild(card);
    item.appendChild(bubble);
    item.appendChild(dot);

    fragment.appendChild(item);
  });

  list.appendChild(fragment);
}

function animateScene(time = 0) {
  requestAnimationFrame(animateScene);

  const t = time * 0.001;
  const mobile = window.innerWidth < 760;
  const desiredZ = mobile ? 8.8 : 7.4;
  const desiredX = state === 1 && !mobile ? 1.9 : 0;

  camera.position.x += (desiredX - camera.position.x) * 0.035;
  camera.position.z += (desiredZ - camera.position.z) * 0.035;
  camera.lookAt(0, 0, 0);

  if (carousel) {
    const idleSpin = state === 2 ? 0.001 : 0.00035;
    carouselTarget += isDragging ? 0 : idleSpin + dragVelocity;
    dragVelocity *= 0.94;
    carousel.rotation.y += (carouselTarget - carousel.rotation.y) * 0.055;
    carousel.rotation.x = Math.sin(t * 0.55) * 0.045;
    carousel.position.y = Math.sin(t * 0.8) * 0.08 + (mobile ? 0.5 : 0);
    carousel.scale.setScalar(state === 1 ? 0.92 : 1);
  }

  if (starField) {
    starField.rotation.y = t * 0.025;
    starField.rotation.x = Math.sin(t * 0.2) * 0.05;
  }

  frameLights.forEach((light, index) => {
    light.intensity = 1.6 + Math.sin(t * 1.8 + index) * 0.55;
  });

  if (burst && celebration > 0) {
    celebration = Math.max(0, celebration - 0.006);
    const progress = 1 - celebration;
    burst.material.opacity = Math.sin(progress * Math.PI) * 0.95;
    const positions = burst.geometry.attributes.position.array;

    for (let i = 0; i < heartFireworks.length; i += 1) {
      const i3 = i * 3;
      const firework = heartFireworks[i];
      const localProgress = Math.max(0, Math.min(1, (progress - firework.delay) / 0.62));
      const ease = 1 - Math.pow(1 - localProgress, 3);
      const fadeDrift = Math.max(0, localProgress - 0.55);
      const position = firework.origin.clone().lerp(firework.target, ease).addScaledVector(firework.drift, fadeDrift);

      positions[i3] = position.x;
      positions[i3 + 1] = position.y;
      positions[i3 + 2] = position.z;
    }
    burst.geometry.attributes.position.needsUpdate = true;
  }

  renderer.render(scene, camera);
}

initScene();
renderTimeline();

window.addEventListener("transitionend", () => {
  const timelinePage = document.getElementById("page5");
  if (timelinePage && timelinePage.classList.contains("active")) {
    renderTimeline();
  }
});
