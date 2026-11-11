# ÉCLAT – The Art of Desserts

Luxury 3D artisan patisserie static showroom crafted with React, TypeScript, Tailwind CSS, Three.js / React Three Fiber, GSAP, Framer Motion, and a programmatic Blender 3D asset pipeline.

## Project Structure

```text
eclat-desserts/
├── assets/blender/       # Native Blender .blend source files (generated via Blender script)
├── public/
│   ├── images/           # Bespoke static SVG fallback illustrations & Open Graph artwork
│   ├── models/           # Exported PBR .glb models for Three.js (generated via Blender script)
│   ├── _headers          # Cloudflare Pages cache & security headers
│   ├── favicon.svg
│   ├── robots.txt
│   └── sitemap.xml
├── scripts/
│   ├── generate-models.py   # Blender Python 3.3–4.x script for all 10 desserts
│   └── generate-models.ps1  # Windows helper to locate Blender and run the generator
└── src/
    ├── components/
    ├── data/
    ├── hooks/
    ├── models/
    ├── sections/
    ├── styles/
    ├── App.tsx
    └── main.tsx
```

## 1. Generate the 10 Blender 3D Assets (`.blend` & `.glb`)

Requires Blender 3.3+ or 4.x installed locally.

```bash
# Generate all 10 .blend and .glb files
blender --background --python scripts/generate-models.py

# Optional: enable Draco mesh compression for smaller .glb payloads
blender --background --python scripts/generate-models.py -- --draco

# Optional: regenerate specific desserts only
blender --background --python scripts/generate-models.py -- --only cupcake tiramisu
```

On Windows PowerShell:

```powershell
.\scripts\generate-models.ps1 -Draco
```

This creates:
- `assets/blender/<dessert>.blend`
- `public/models/<dessert>.glb`

for all ten signature desserts (`cupcake`, `brownie`, `cake-pops`, `cake-truffles`, `swiss-roll`, `pastry`, `mousse`, `cake-rusk`, `eclair`, `tiramisu`) plus the multi-stage scroll-recipe assembly (`recipe-cake`).

## 2. Install Dependencies & Build Frontend

```bash
npm install
npm run dev       # Local development server
npm run typecheck # TypeScript verification
npm run build     # Production static bundle in dist/
```

## 3. Deploy to Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- `public/_headers` configures `model/gltf-binary` content type and long-lived immutable caching for `.glb` models.
