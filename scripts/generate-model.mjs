// scripts/generate-model.mjs
//
// Builds a procedural "fashion tote" handbag out of Three.js primitives and
// exports it as a GLB file that the app loads with useGLTF.
//
// Run with:  npm run model:generate
//
// Why a generated asset? It keeps the repo self-contained (no large binary
// checked in, no external CDN), produces a ~tens-of-KB optimised model, and
// demonstrates the full "GLB asset -> useGLTF -> customize" pipeline that you
// can later swap for a real scanned/CAD fashion product.

import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// GLTFExporter is written for browsers and uses FileReader to convert the
// GLB Blob into an ArrayBuffer. Node 18+ ships Blob#arrayBuffer(), so we
// provide a tiny FileReader shim to make the exporter run server-side.
if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class {
    result = null;
    onloadend = null;
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buffer) => {
        this.result = buffer;
        if (typeof this.onloadend === "function") this.onloadend();
      });
    }
  };
}

const group = new THREE.Group();
group.name = "FashionTote";

// Leather-like body material. The app swaps these out for
// MeshPhysicalMaterial clones at runtime, so only the base colour matters.
const leather = new THREE.MeshStandardMaterial({
  name: "LeatherBody",
  color: 0xf4f4f4,
  roughness: 0.55,
  metalness: 0.02,
});

// Gold hardware keeps a permanent metallic look in the base asset.
const hardware = new THREE.MeshStandardMaterial({
  name: "GoldHardware",
  color: 0xc8a24a,
  roughness: 0.25,
  metalness: 1.0,
});

// Main bag body (rounded-box so it looks soft/padded like a leather tote).
// Segment counts are kept low (4 curves / 5 sub-divisions) so the exported
// GLB stays small - the smooth corner shading is faked by the high-poly-ish
// look of physical materials + lights, not raw vertex count.
const body = new THREE.Mesh(new RoundedBoxGeometry(2.2, 1.4, 0.85, 4, 0.18, 5), leather);
body.name = "Body";
group.add(body);

// Handle: a half-torus arch spanning the top of the bag.
// TorusGeometry(radius, tube, radial, tubular, arc) with arc = PI yields an
// arch in the XY plane whose apex points up (+Y) - perfect for a top handle.
const handle = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.06, 8, 32, Math.PI), leather);
handle.name = "Handle";
handle.position.y = 0.76;
group.add(handle);

// Metal collars where the handle meets the bag.
for (const side of [-1, 1]) {
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 12), hardware);
  collar.name = "HandleCollar";
  collar.position.set(side * 0.85, 0.76, 0);
  group.add(collar);
}

// Front clasp: a rounded plate + forward-facing knob.
const plate = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.22, 0.06, 3, 0.02), hardware);
plate.name = "ClaspPlate";
plate.position.set(0, 0.06, 0.46);
group.add(plate);

const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.08, 12), hardware);
knob.name = "ClaspKnob";
knob.rotation.x = Math.PI / 2; // axis along Z -> reads as a front-facing disc
knob.position.set(0, 0.06, 0.52);
group.add(knob);

// Four feet so the bag sits off the ground.
for (const sx of [-1, 1]) {
  for (const sz of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 12), hardware);
    foot.name = "Foot";
    foot.position.set(sx * 0.75, -0.74, sz * 0.28);
    group.add(foot);
  }
}

// Thin gold "zipper rail" along the top-front edge.
const rail = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.035, 0.035), hardware);
rail.name = "ZipperRail";
rail.position.set(0, 0.7, 0.43);
group.add(rail);

// Center the model at the origin and normalise its size so the camera
// framing in the app stays consistent no matter the model dimensions.
const box = new THREE.Box3().setFromObject(group);
const size = box.getSize(new THREE.Vector3());
const center = box.getCenter(new THREE.Vector3());
group.position.sub(center);

const maxDim = Math.max(size.x, size.y, size.z);
const targetDim = 2.6;
group.scale.setScalar(targetDim / maxDim);
group.updateMatrixWorld(true);

// Export to binary GLB.
const exporter = new GLTFExporter();
const outPath = join(__dirname, "..", "public", "models", "fashion-bag.glb");
mkdirSync(dirname(outPath), { recursive: true });

exporter.parse(
  group,
  (result) => {
    writeFileSync(outPath, Buffer.from(result));
    console.log(
      `✓ Model written to ${outPath} (${(Buffer.byteLength(result) / 1024).toFixed(1)} KB)`,
    );
  },
  (error) => {
    console.error("✗ Export failed:", error);
    process.exit(1);
  },
  { binary: true },
);
