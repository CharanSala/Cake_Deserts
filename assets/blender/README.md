# Blender Source Files (`.blend`)

Run `scripts/generate-models.py` using Blender 3.3+ or 4.x to generate all ten native `.blend` source files with procedural Principled BSDF materials, studio lighting, and optimized mesh topology:

- `cupcake.blend`
- `brownie.blend`
- `cake-pops.blend`
- `cake-truffles.blend`
- `swiss-roll.blend`
- `pastry.blend`
- `mousse.blend`
- `cake-rusk.blend`
- `eclair.blend`
- `tiramisu.blend`

Command:

```bash
blender --background --python scripts/generate-models.py
```
