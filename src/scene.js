import * as THREE from '../vendor/three.module.js';

// Texture-free soft points: a small luminous centre, not square sprites.
const POINT_VERTEX = `
  attribute float aSize;
  uniform float uPixelRatio;
  varying float vDepth;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vDepth = clamp(9.2 / max(1.0, -viewPosition.z), 0.55, 1.4);
    gl_PointSize = aSize * uPixelRatio * vDepth;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const POINT_FRAGMENT = `
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    float radius = length(gl_PointCoord - vec2(0.5)) * 2.0;
    if (radius > 1.0) discard;
    float halo = pow(1.0 - radius, 2.4);
    float core = 1.0 - smoothstep(0.10, 0.38, radius);
    vec3 color = mix(uColor, vec3(1.0, 0.72, 0.78), core * 0.32);
    gl_FragColor = vec4(color, (halo * 0.40 + core * 0.80) * uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const HALO_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = -viewPosition.xyz;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const HALO_FRAGMENT = `
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(vView)));
    float rim = pow(1.0 - clamp(facing, 0.0, 1.0), 3.8);
    gl_FragColor = vec4(uColor, rim * uStrength);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * Decorative red/obsidian hero, backed exclusively by the local Three.js build.
 * The host supplies its sizing, positioning, background and non-WebGL fallback.
 *
 * Status: ready on initialization; paused/running after motion controls;
 * unsupported when WebGL2 is unavailable; lost until the context is restored.
 * Reduced motion starts paused. Explicit play may override that preference.
 * pulse() is a bounded, interruptible one-shot; it does not animate while paused.
 *
 * @param {HTMLElement} container
 * @param {{ onStatus?: (status: string) => void }} options
 * @returns {{ togglePause: () => boolean, pulse: () => void, dispose: () => void } | null}
 */
export function initScene(container, { onStatus = () => {} } = {}) {
  const doc = container?.ownerDocument;
  const view = doc?.defaultView;
  let status;

  function report(next) {
    if (status === next) return;
    status = next;
    if (container?.dataset) container.dataset.scene = next;
    onStatus(next);
  }

  if (!doc || !view || typeof container.appendChild !== 'function'
      || typeof view.requestAnimationFrame !== 'function') {
    report('unsupported');
    return null;
  }

  const canvas = doc.createElement('canvas');
  const contextOptions = {
    alpha: true,
    antialias: true,
    depth: true,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: 'low-power',
  };
  let context;
  let renderer;

  // Check before constructing Three's renderer, which logs failed context creation.
  // An unavailable GPU must simply leave the host's static fallback untouched.
  try {
    context = canvas.getContext('webgl2', contextOptions);
    if (!context || context.isContextLost()) {
      report('unsupported');
      return null;
    }
    renderer = new THREE.WebGLRenderer({ canvas, context, ...contextOptions });
  } catch {
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    report('unsupported');
    return null;
  }

  canvas.className = 'hero-scene-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('role', 'presentation');
  canvas.tabIndex = -1;
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    display: 'block',
    pointerEvents: 'none',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const resources = new Set();
  const pointMaterials = [];
  const track = (resource) => { resources.add(resource); return resource; };
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
  camera.position.set(0, 0.12, 9.2);
  const focus = new THREE.Vector3(0, 0, 0);
  const artifact = new THREE.Group();
  artifact.name = 'CTF artifact';
  scene.add(artifact);

  // Fixed lights reveal the facets as the dark nucleus gently turns.
  scene.add(new THREE.HemisphereLight(0xa4adc8, 0x210008, 1.15));
  const keyLight = new THREE.DirectionalLight(0xffe3eb, 3.0);
  keyLight.position.set(-3, 4, 5);
  scene.add(keyLight);
  const redLight = new THREE.DirectionalLight(0xe81b49, 4.8);
  redLight.position.set(4, -1, 2);
  scene.add(redLight);
  const rimLight = new THREE.DirectionalLight(0xff2454, 5.2);
  rimLight.position.set(-2, 1, -4);
  scene.add(rimLight);

  const nucleusGeometry = track(new THREE.IcosahedronGeometry(1.22, 0));
  const nucleus = new THREE.Mesh(nucleusGeometry, track(new THREE.MeshStandardMaterial({
    color: 0x211924,
    emissive: 0x240008,
    emissiveIntensity: 0.16,
    metalness: 0.48,
    roughness: 0.36,
    flatShading: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })));
  nucleus.name = 'Obsidian nucleus';
  artifact.add(nucleus);
  const facetEdges = new THREE.LineSegments(
    track(new THREE.EdgesGeometry(nucleusGeometry, 15)),
    track(new THREE.LineBasicMaterial({
      color: 0xae3652,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })),
  );
  facetEdges.scale.setScalar(1.003);
  nucleus.add(facetEdges);

  function pointMaterial(color, opacity) {
    const material = track(new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
        uPixelRatio: { value: 1 },
      },
      vertexShader: POINT_VERTEX,
      fragmentShader: POINT_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }));
    pointMaterials.push(material);
    return material;
  }

  const nodeMaterial = pointMaterial(0xff365b, 0.91);
  const shell = new THREE.Group();
  shell.name = 'Signal shell';
  artifact.add(shell);
  const shellGeometry = track(new THREE.IcosahedronGeometry(1.92, 1));
  const wire = new THREE.LineSegments(
    track(new THREE.WireframeGeometry(shellGeometry)),
    track(new THREE.LineBasicMaterial({
      color: 0xf13a59,
      transparent: true,
      opacity: 0.29,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })),
  );
  shell.add(wire);

  // PolyhedronGeometry is non-indexed: merge positions to avoid tripled bright dots.
  const uniqueNodes = new Map();
  const shellPositions = shellGeometry.getAttribute('position');
  for (let i = 0; i < shellPositions.count; i++) {
    const x = shellPositions.getX(i);
    const y = shellPositions.getY(i);
    const z = shellPositions.getZ(i);
    const key = `${Math.round(x * 1e5)},${Math.round(y * 1e5)},${Math.round(z * 1e5)}`;
    if (!uniqueNodes.has(key)) uniqueNodes.set(key, [x, y, z]);
  }
  const nodeGeometry = track(new THREE.BufferGeometry());
  nodeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(
    [...uniqueNodes.values()].flat(), 3,
  ));
  nodeGeometry.setAttribute('aSize', new THREE.Float32BufferAttribute(
    [...uniqueNodes.keys()].map((_, i) => i % 9 === 0 ? 10.5 : 6.6 + (i % 4) * 0.65), 1,
  ));
  const nodes = new THREE.Points(nodeGeometry, nodeMaterial);
  nodes.name = 'Signal nodes';
  shell.add(nodes);

  // Only a faint grazing-angle glow; the black centre stays transparent/obsidian.
  const haloMaterial = track(new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0xff1d4d) },
      uStrength: { value: 0.12 },
    },
    vertexShader: HALO_VERTEX,
    fragmentShader: HALO_FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }));
  const halo = new THREE.Mesh(track(new THREE.SphereGeometry(2.03, 40, 28)), haloMaterial);
  halo.name = 'Fresnel halo';
  artifact.add(halo);

  const orbitalPaths = new THREE.Group();
  orbitalPaths.name = 'Orbital paths';
  artifact.add(orbitalPaths);
  const orbitRunners = [];

  function addOrbit(radius, tilt, phase, speed, opacity) {
    const orbit = new THREE.Group();
    orbit.rotation.set(...tilt);
    const points = [];
    for (let i = 0; i < 180; i++) {
      const angle = i / 180 * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
    }
    const path = new THREE.LineLoop(
      track(new THREE.BufferGeometry().setFromPoints(points)),
      track(new THREE.LineBasicMaterial({
        color: 0xff395b,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      })),
    );
    orbit.add(path);
    const runner = new THREE.Group();
    const arcLength = 0.95;
    const arc = new THREE.Mesh(
      track(new THREE.TorusGeometry(radius, 0.007, 5, 48, arcLength)),
      track(new THREE.MeshBasicMaterial({
        color: 0xff5570,
        transparent: true,
        opacity: opacity * 2.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      })),
    );
    const arcGlow = new THREE.Mesh(
      track(new THREE.TorusGeometry(radius, 0.023, 5, 48, arcLength)),
      track(new THREE.MeshBasicMaterial({
        color: 0xff234b,
        transparent: true,
        opacity: opacity * 0.23,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      })),
    );
    const beaconGeometry = track(new THREE.BufferGeometry());
    beaconGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
      Math.cos(arcLength) * radius, Math.sin(arcLength) * radius, 0,
    ], 3));
    beaconGeometry.setAttribute('aSize', new THREE.Float32BufferAttribute([9], 1));
    runner.add(arcGlow, arc, new THREE.Points(beaconGeometry, nodeMaterial));
    runner.rotation.z = phase;
    orbit.add(runner);
    orbitalPaths.add(orbit);
    orbitRunners.push({ runner, phase, speed });
  }

  addOrbit(2.61, [1.12, 0.22, -0.32], 0.58, 0.11, 0.32);
  addOrbit(2.38, [0.38, 0.87, 0.70], 2.72, -0.085, 0.24);
  addOrbit(2.25, [1.79, -0.61, 0.19], 4.36, 0.07, 0.16);

  // Deterministic, spacious outer dust rather than a noisy starfield.
  let randomSeed = 173;
  const random = () => {
    randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) >>> 0;
    return randomSeed / 4294967296;
  };
  const coarseMedia = view.matchMedia?.('(pointer: coarse)');
  const motionMedia = view.matchMedia?.('(prefers-reduced-motion: reduce)');
  const particleCount = coarseMedia?.matches || view.innerWidth < 768 ? 42 : 64;
  const particlePositions = [];
  const particleSizes = [];
  for (let i = 0; i < particleCount; i++) {
    const angle = i * 2.399963229728653;
    const radius = 2.66 + random() * 1.03;
    particlePositions.push(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * 0.84,
      -1.85 + random() * 2.35,
    );
    particleSizes.push(2.1 + random() * 2.8);
  }
  const dustGeometry = track(new THREE.BufferGeometry());
  dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
  dustGeometry.setAttribute('aSize', new THREE.Float32BufferAttribute(particleSizes, 1));
  const particles = new THREE.Points(dustGeometry, pointMaterial(0xe55770, 0.46));
  particles.name = 'Drift particles';
  scene.add(particles);

  let disposed = false;
  let contextLost = false;
  let paused = Boolean(motionMedia?.matches);
  let userPaused = false;
  let explicitPlay = false;
  let frameId = null;
  let lastFrameTime = null;
  let elapsed = 0;
  let hasSize = false;
  let lastWidth = 0;
  let lastHeight = 0;
  let lastPixelRatio = 0;
  let resizeObserver = null;
  let intersectionObserver = null;
  let pulseElapsed = Infinity;
  let pulseStart = 0;
  let pulseValue = 0;
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

  function withinViewport() {
    const rect = container.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < view.innerHeight
      && rect.right > 0 && rect.left < view.innerWidth;
  }
  let inViewport = withinViewport();

  function canRender() {
    return !disposed && !contextLost && !doc.hidden && inViewport && hasSize;
  }

  function stopAnimation() {
    if (frameId !== null) view.cancelAnimationFrame(frameId);
    frameId = null;
    lastFrameTime = null;
  }

  function scheduleAnimation() {
    if (!canRender() || paused) {
      stopAnimation();
      return;
    }
    if (frameId === null) frameId = view.requestAnimationFrame(animate);
  }

  function update(delta) {
    artifact.rotation.set(
      0.06 + Math.sin(elapsed * 0.19) * 0.035,
      elapsed * 0.035,
      -0.025 + Math.sin(elapsed * 0.14) * 0.018,
    );
    nucleus.rotation.set(0.19, 0.42 - elapsed * 0.105, 0.16);
    shell.rotation.set(0.10 + Math.sin(elapsed * 0.21) * 0.035, 0.18 + elapsed * 0.055, 0);
    orbitalPaths.rotation.y = -0.08 + elapsed * 0.024;
    particles.rotation.z = -elapsed * 0.009;
    for (const { runner, phase, speed } of orbitRunners) runner.rotation.z = phase + elapsed * speed;

    if (Number.isFinite(pulseElapsed)) {
      pulseElapsed += delta;
      if (pulseElapsed < 0.26) {
        const attack = THREE.MathUtils.smoothstep(pulseElapsed, 0, 0.26);
        pulseValue = THREE.MathUtils.lerp(pulseStart, 1, attack);
      } else if (pulseElapsed < 1.36) {
        pulseValue = 1 - THREE.MathUtils.smoothstep(pulseElapsed, 0.26, 1.36);
      } else {
        pulseValue = 0;
        pulseElapsed = Infinity;
      }
    }
    shell.scale.setScalar(1 + pulseValue * 0.055);
    halo.scale.setScalar(1 + pulseValue * 0.095);
    haloMaterial.uniforms.uStrength.value = 0.12 + pulseValue * 0.13;

    const damping = 1 - Math.exp(-delta * 4.2);
    pointer.x += (pointer.targetX - pointer.x) * damping;
    pointer.y += (pointer.targetY - pointer.y) * damping;
    camera.position.x = pointer.x * 0.34;
    camera.position.y = 0.12 - pointer.y * 0.22;
    camera.lookAt(focus);
  }

  function draw() {
    if (canRender()) renderer.render(scene, camera);
  }

  function refresh() {
    if (!canRender()) {
      stopAnimation();
      return;
    }
    draw();
    scheduleAnimation();
  }

  function animate() {
    frameId = null;
    if (!canRender() || paused) {
      stopAnimation();
      return;
    }
    // One monotonic timestamp per frame. Background/offscreen resumptions reset it.
    const now = view.performance.now();
    const delta = lastFrameTime === null ? 0
      : THREE.MathUtils.clamp((now - lastFrameTime) / 1000, 0, 0.05);
    lastFrameTime = now;
    elapsed += delta;
    update(delta);
    draw();
    scheduleAnimation();
  }

  function resize(force = false) {
    if (disposed) return;
    const width = Math.round(container.clientWidth);
    const height = Math.round(container.clientHeight);
    hasSize = width > 0 && height > 0;
    if (!hasSize) {
      stopAnimation();
      return;
    }
    const mobile = coarseMedia?.matches || view.innerWidth < 768;
    const pixelRatio = Math.min(view.devicePixelRatio || 1, mobile ? 1.5 : 2);
    if (pixelRatio !== lastPixelRatio) {
      renderer.setPixelRatio(pixelRatio);
      for (const material of pointMaterials) material.uniforms.uPixelRatio.value = pixelRatio;
      lastPixelRatio = pixelRatio;
    }
    if (force || width !== lastWidth || height !== lastHeight) {
      renderer.setSize(width, height, false);
      lastWidth = width;
      lastHeight = height;
    }
    camera.aspect = width / height;
    // Protect the outer orbit in a narrow host without shrinking the desktop hero.
    const halfFov = THREE.MathUtils.degToRad(camera.fov * 0.5);
    camera.position.z = Math.max(9.2, 3.0 / (Math.tan(halfFov) * camera.aspect));
    camera.updateProjectionMatrix();
    camera.lookAt(focus);
    if (!intersectionObserver) inViewport = withinViewport();
    refresh();
  }

  function resetPointer() {
    pointer.targetX = 0;
    pointer.targetY = 0;
  }

  function onPointerMove(event) {
    if (event.pointerType !== 'mouse' || paused || contextLost || coarseMedia?.matches) return;
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.targetX = THREE.MathUtils.clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
    pointer.targetY = THREE.MathUtils.clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
  }

  function onVisibilityChange() {
    lastFrameTime = null;
    if (doc.hidden) resetPointer();
    refresh();
  }

  function onViewportResize() { resize(); }

  function onViewportScroll() {
    const next = withinViewport();
    if (next === inViewport) return;
    inViewport = next;
    lastFrameTime = null;
    refresh();
  }

  function onMotionChange() {
    if (motionMedia.matches) {
      if (!explicitPlay) paused = true;
    } else {
      explicitPlay = false;
      paused = userPaused;
    }
    if (!contextLost) report(paused ? 'paused' : 'running');
    lastFrameTime = null;
    if (paused) resetPointer();
    refresh();
  }

  function onContextLost(event) {
    event.preventDefault();
    contextLost = true;
    stopAnimation();
    report('lost');
  }

  function onContextRestored() {
    if (disposed) return;
    contextLost = false;
    lastFrameTime = null;
    // Three registered its restoration listener first and has rebuilt GPU state.
    resize(true);
    report('ready');
    report(paused ? 'paused' : 'running');
  }

  container.addEventListener('pointermove', onPointerMove, { passive: true });
  container.addEventListener('pointerleave', resetPointer, { passive: true });
  view.addEventListener('blur', resetPointer);
  view.addEventListener('resize', onViewportResize, { passive: true });
  doc.addEventListener('visibilitychange', onVisibilityChange);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);
  if (motionMedia?.addEventListener) motionMedia.addEventListener('change', onMotionChange);
  else motionMedia?.addListener?.(onMotionChange);

  if (typeof view.ResizeObserver === 'function') {
    resizeObserver = new view.ResizeObserver(() => resize());
    resizeObserver.observe(container);
  }
  if (typeof view.IntersectionObserver === 'function') {
    intersectionObserver = new view.IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target !== container) continue;
        inViewport = entry.isIntersecting;
        lastFrameTime = null;
        refresh();
      }
    }, { threshold: 0 });
    intersectionObserver.observe(container);
  } else {
    // Capture also observes nested scrolling containers on older browsers.
    view.addEventListener('scroll', onViewportScroll, { passive: true, capture: true });
  }

  container.appendChild(canvas);
  update(0);
  resize();
  report('ready');
  if (paused) report('paused');

  return {
    togglePause() {
      if (disposed) return true;
      paused = !paused;
      userPaused = paused;
      explicitPlay = !paused && Boolean(motionMedia?.matches);
      lastFrameTime = null;
      if (!contextLost) report(paused ? 'paused' : 'running');
      if (paused) resetPointer();
      refresh();
      return paused;
    },

    pulse() {
      if (disposed || contextLost || paused) return;
      // Retrigger from the current envelope rather than snapping back to zero.
      pulseStart = pulseValue;
      pulseElapsed = 0;
      scheduleAnimation();
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      paused = true;
      stopAnimation();
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', resetPointer);
      view.removeEventListener('blur', resetPointer);
      view.removeEventListener('resize', onViewportResize);
      view.removeEventListener('scroll', onViewportScroll, true);
      doc.removeEventListener('visibilitychange', onVisibilityChange);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      if (motionMedia?.removeEventListener) motionMedia.removeEventListener('change', onMotionChange);
      else motionMedia?.removeListener?.(onMotionChange);
      for (const resource of resources) resource.dispose();
      resources.clear();
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      delete container.dataset.scene;
    },
  };
}
