/**
 * Three.js 3D Renderer
 *
 * Server-side 3D rendering using Puppeteer with Three.js.
 * Renders 3D scenes to video frames.
 */

// Dynamic imports
let puppeteerModule: typeof import('puppeteer') | null = null;

async function getPuppeteer() {
  if (!puppeteerModule) {
    try {
      puppeteerModule = await import('puppeteer');
    } catch {
      throw new Error('puppeteer module not available. Install with: npm install puppeteer');
    }
  }
  return puppeteerModule.default;
}

export interface ThreeSceneConfig {
  width: number;
  height: number;
  backgroundColor?: string;
  camera?: {
    type: 'perspective' | 'orthographic';
    position?: [number, number, number];
    lookAt?: [number, number, number];
    fov?: number; // For perspective
    zoom?: number; // For orthographic
  };
  lights?: Array<{
    type: 'ambient' | 'directional' | 'point' | 'spot';
    color?: string;
    intensity?: number;
    position?: [number, number, number];
  }>;
  objects?: ThreeObject[];
}

export interface ThreeObject {
  type: 'box' | 'sphere' | 'cylinder' | 'plane' | 'torus' | 'text' | 'gltf';
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color?: string;
  material?: 'basic' | 'standard' | 'phong' | 'lambert';
  opacity?: number;
  wireframe?: boolean;
  // Type-specific properties
  args?: number[]; // Geometry arguments
  text?: string; // For text type
  url?: string; // For gltf type
  animation?: {
    property: 'rotation' | 'position' | 'scale';
    axis: 'x' | 'y' | 'z';
    speed: number;
  };
}

export interface ThreeRenderOptions {
  fps?: number;
  duration?: number; // seconds
  antialias?: boolean;
  devicePixelRatio?: number;
}

const DEFAULT_SCENE: ThreeSceneConfig = {
  width: 1920,
  height: 1080,
  backgroundColor: '#000000',
  camera: {
    type: 'perspective',
    position: [0, 0, 5],
    lookAt: [0, 0, 0],
    fov: 75,
  },
  lights: [
    { type: 'ambient', color: '#ffffff', intensity: 0.5 },
    { type: 'directional', color: '#ffffff', intensity: 1, position: [5, 5, 5] },
  ],
};

/**
 * Generate Three.js scene code.
 */
function generateSceneCode(config: ThreeSceneConfig, frame: number, fps: number): string {
  const time = frame / fps;

  // Serialize objects
  const objectsCode = (config.objects || [])
    .map((obj, i) => {
      const pos = obj.position || [0, 0, 0];
      const rot = obj.rotation || [0, 0, 0];
      const scale = obj.scale || [1, 1, 1];
      const color = obj.color || '#ffffff';
      const material = obj.material || 'standard';

      let geometryCode = '';
      let meshCode = '';

      switch (obj.type) {
        case 'box':
          geometryCode = `new THREE.BoxGeometry(${(obj.args || [1, 1, 1]).join(', ')})`;
          break;
        case 'sphere':
          geometryCode = `new THREE.SphereGeometry(${(obj.args || [0.5, 32, 32]).join(', ')})`;
          break;
        case 'cylinder':
          geometryCode = `new THREE.CylinderGeometry(${(obj.args || [0.5, 0.5, 1, 32]).join(', ')})`;
          break;
        case 'plane':
          geometryCode = `new THREE.PlaneGeometry(${(obj.args || [1, 1]).join(', ')})`;
          break;
        case 'torus':
          geometryCode = `new THREE.TorusGeometry(${(obj.args || [0.5, 0.2, 16, 100]).join(', ')})`;
          break;
        default:
          geometryCode = `new THREE.BoxGeometry(1, 1, 1)`;
      }

      // Material
      let materialClass = 'MeshStandardMaterial';
      switch (material) {
        case 'basic':
          materialClass = 'MeshBasicMaterial';
          break;
        case 'phong':
          materialClass = 'MeshPhongMaterial';
          break;
        case 'lambert':
          materialClass = 'MeshLambertMaterial';
          break;
      }

      const materialOpts: string[] = [`color: '${color}'`];
      if (obj.opacity !== undefined && obj.opacity < 1) {
        materialOpts.push(`transparent: true`);
        materialOpts.push(`opacity: ${obj.opacity}`);
      }
      if (obj.wireframe) {
        materialOpts.push(`wireframe: true`);
      }

      meshCode = `
        const geometry${i} = ${geometryCode};
        const material${i} = new THREE.${materialClass}({ ${materialOpts.join(', ')} });
        const mesh${i} = new THREE.Mesh(geometry${i}, material${i});
        mesh${i}.position.set(${pos.join(', ')});
        mesh${i}.rotation.set(${rot.join(', ')});
        mesh${i}.scale.set(${scale.join(', ')});
      `;

      // Animation
      if (obj.animation) {
        const { property, axis, speed } = obj.animation;
        const delta = time * speed;
        meshCode += `mesh${i}.${property}.${axis} += ${delta};\n`;
      }

      meshCode += `scene.add(mesh${i});`;

      return meshCode;
    })
    .join('\n\n');

  // Camera setup
  const cam = config.camera || DEFAULT_SCENE.camera!;
  const camPos = cam.position || [0, 0, 5];
  const camLookAt = cam.lookAt || [0, 0, 0];

  let cameraCode = '';
  if (cam.type === 'orthographic') {
    const aspect = config.width / config.height;
    const zoom = cam.zoom || 1;
    cameraCode = `
      const camera = new THREE.OrthographicCamera(
        -${aspect * zoom}, ${aspect * zoom},
        ${zoom}, -${zoom},
        0.1, 1000
      );
    `;
  } else {
    cameraCode = `
      const camera = new THREE.PerspectiveCamera(
        ${cam.fov || 75},
        ${config.width} / ${config.height},
        0.1, 1000
      );
    `;
  }

  // Lights
  const lightsCode = (config.lights || DEFAULT_SCENE.lights!)
    .map((light, i) => {
      const color = light.color || '#ffffff';
      const intensity = light.intensity ?? 1;
      const pos = light.position || [0, 0, 0];

      switch (light.type) {
        case 'ambient':
          return `
            const light${i} = new THREE.AmbientLight('${color}', ${intensity});
            scene.add(light${i});
          `;
        case 'directional':
          return `
            const light${i} = new THREE.DirectionalLight('${color}', ${intensity});
            light${i}.position.set(${pos.join(', ')});
            scene.add(light${i});
          `;
        case 'point':
          return `
            const light${i} = new THREE.PointLight('${color}', ${intensity});
            light${i}.position.set(${pos.join(', ')});
            scene.add(light${i});
          `;
        case 'spot':
          return `
            const light${i} = new THREE.SpotLight('${color}', ${intensity});
            light${i}.position.set(${pos.join(', ')});
            scene.add(light${i});
          `;
        default:
          return '';
      }
    })
    .join('\n');

  return `
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('${config.backgroundColor || '#000000'}');

    ${cameraCode}
    camera.position.set(${camPos.join(', ')});
    camera.lookAt(${camLookAt.join(', ')});

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(${config.width}, ${config.height});
    renderer.setPixelRatio(window.devicePixelRatio || 2);
    document.body.appendChild(renderer.domElement);

    ${lightsCode}

    ${objectsCode}

    renderer.render(scene, camera);
  `;
}

/**
 * Generate HTML page for Three.js rendering.
 */
function generateHtml(sceneCode: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; }
    body { overflow: hidden; }
    canvas { display: block; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
  <script>
    ${sceneCode}
  </script>
</body>
</html>`;
}

/**
 * Render a single frame of a Three.js scene.
 */
export async function renderThreeFrame(
  config: ThreeSceneConfig,
  frame: number,
  fps: number = 30
): Promise<Buffer> {
  const puppeteer = await getPuppeteer();

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      `--window-size=${config.width},${config.height}`,
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: config.width,
      height: config.height,
      deviceScaleFactor: 2,
    });

    const sceneCode = generateSceneCode(config, frame, fps);
    const html = generateHtml(sceneCode);

    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Wait for Three.js to render
    await page.waitForFunction(() => {
      const canvas = document.querySelector('canvas');
      return canvas && canvas.width > 0;
    });

    const screenshot = await page.screenshot({
      type: 'png',
      omitBackground: true,
    });

    return screenshot as Buffer;
  } finally {
    await browser.close();
  }
}

/**
 * Generate all frames for a 3D animation.
 */
export async function* generateThreeFrames(
  config: ThreeSceneConfig,
  options: ThreeRenderOptions = {}
): AsyncGenerator<{ frame: number; png: Buffer }> {
  const fps = options.fps || 30;
  const duration = options.duration || 5;
  const totalFrames = Math.ceil(fps * duration);

  const puppeteer = await getPuppeteer();

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      `--window-size=${config.width},${config.height}`,
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: config.width,
      height: config.height,
      deviceScaleFactor: options.devicePixelRatio || 2,
    });

    for (let frame = 0; frame <= totalFrames; frame++) {
      const sceneCode = generateSceneCode(config, frame, fps);
      const html = generateHtml(sceneCode);

      await page.setContent(html, { waitUntil: 'networkidle0' });

      await page.waitForFunction(() => {
        const canvas = document.querySelector('canvas');
        return canvas && canvas.width > 0;
      });

      const screenshot = await page.screenshot({
        type: 'png',
        omitBackground: true,
      });

      yield { frame, png: screenshot as Buffer };
    }
  } finally {
    await browser.close();
  }
}

/**
 * Create a Three.js renderer for video integration.
 */
export function createThreeRenderer(baseConfig: Partial<ThreeSceneConfig> = {}) {
  const config: ThreeSceneConfig = {
    ...DEFAULT_SCENE,
    ...baseConfig,
  };

  return {
    /**
     * Update scene configuration.
     */
    setConfig(updates: Partial<ThreeSceneConfig>) {
      Object.assign(config, updates);
    },

    /**
     * Add an object to the scene.
     */
    addObject(object: ThreeObject) {
      config.objects = config.objects || [];
      config.objects.push(object);
    },

    /**
     * Clear all objects.
     */
    clearObjects() {
      config.objects = [];
    },

    /**
     * Render a single frame.
     */
    async renderFrame(frame: number, fps: number = 30): Promise<Buffer> {
      return renderThreeFrame(config, frame, fps);
    },

    /**
     * Generate all animation frames.
     */
    generateFrames(options?: ThreeRenderOptions) {
      return generateThreeFrames(config, options);
    },

    /**
     * Get the scene code (for debugging).
     */
    getSceneCode(frame: number = 0, fps: number = 30): string {
      return generateSceneCode(config, frame, fps);
    },

    /**
     * Get full HTML (for debugging).
     */
    getHtml(frame: number = 0, fps: number = 30): string {
      const sceneCode = generateSceneCode(config, frame, fps);
      return generateHtml(sceneCode);
    },
  };
}

/**
 * Preset 3D scenes.
 */
export const THREE_PRESETS = {
  rotatingCube: (): ThreeSceneConfig => ({
    width: 1920,
    height: 1080,
    backgroundColor: '#1a1a2e',
    camera: {
      type: 'perspective',
      position: [3, 3, 3],
      lookAt: [0, 0, 0],
      fov: 50,
    },
    lights: [
      { type: 'ambient', intensity: 0.4 },
      { type: 'directional', position: [5, 5, 5], intensity: 1 },
    ],
    objects: [
      {
        type: 'box',
        color: '#e94560',
        material: 'standard',
        animation: { property: 'rotation', axis: 'y', speed: 1 },
      },
    ],
  }),

  floatingSpheres: (): ThreeSceneConfig => ({
    width: 1920,
    height: 1080,
    backgroundColor: '#0f0f23',
    camera: {
      type: 'perspective',
      position: [0, 0, 10],
      fov: 60,
    },
    lights: [
      { type: 'ambient', intensity: 0.3 },
      { type: 'point', position: [5, 5, 5], color: '#ff6b6b', intensity: 1 },
      { type: 'point', position: [-5, -5, 5], color: '#4ecdc4', intensity: 1 },
    ],
    objects: [
      {
        type: 'sphere',
        args: [1, 32, 32],
        position: [-2, 0, 0],
        color: '#ff6b6b',
        material: 'standard',
        animation: { property: 'position', axis: 'y', speed: 0.5 },
      },
      {
        type: 'sphere',
        args: [0.7, 32, 32],
        position: [0, 1, 0],
        color: '#4ecdc4',
        material: 'standard',
        animation: { property: 'rotation', axis: 'x', speed: 1 },
      },
      {
        type: 'sphere',
        args: [0.5, 32, 32],
        position: [2, -1, 0],
        color: '#ffe66d',
        material: 'standard',
        animation: { property: 'position', axis: 'y', speed: -0.7 },
      },
    ],
  }),

  wireframeTorus: (): ThreeSceneConfig => ({
    width: 1920,
    height: 1080,
    backgroundColor: '#16213e',
    camera: {
      type: 'perspective',
      position: [0, 0, 5],
      fov: 75,
    },
    lights: [
      { type: 'ambient', intensity: 1 },
    ],
    objects: [
      {
        type: 'torus',
        args: [1.5, 0.5, 16, 100],
        color: '#00fff5',
        material: 'basic',
        wireframe: true,
        animation: { property: 'rotation', axis: 'x', speed: 0.5 },
      },
      {
        type: 'torus',
        args: [1.5, 0.5, 16, 100],
        color: '#ff00ff',
        material: 'basic',
        wireframe: true,
        rotation: [Math.PI / 2, 0, 0],
        animation: { property: 'rotation', axis: 'y', speed: 0.5 },
      },
    ],
  }),

  productShowcase: (): ThreeSceneConfig => ({
    width: 1920,
    height: 1080,
    backgroundColor: '#ffffff',
    camera: {
      type: 'perspective',
      position: [3, 2, 3],
      lookAt: [0, 0, 0],
      fov: 45,
    },
    lights: [
      { type: 'ambient', intensity: 0.6 },
      { type: 'directional', position: [5, 10, 5], intensity: 0.8 },
      { type: 'directional', position: [-5, 5, -5], intensity: 0.3 },
    ],
    objects: [
      {
        type: 'box',
        args: [1, 1, 1],
        position: [0, 0.5, 0],
        color: '#333333',
        material: 'standard',
        animation: { property: 'rotation', axis: 'y', speed: 0.3 },
      },
      {
        type: 'plane',
        args: [10, 10],
        position: [0, 0, 0],
        rotation: [-Math.PI / 2, 0, 0],
        color: '#f5f5f5',
        material: 'standard',
      },
    ],
  }),
};
