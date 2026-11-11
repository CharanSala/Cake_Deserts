"""
ÉCLAT – The Art of Desserts
Programmatic Blender 3D Asset Pipeline (Blender 3.3 – 4.3+ compatible)

Generates genuine native .blend source files in /assets/blender/ and
exports optimized PBR .glb models in /public/models/ for all 10 desserts:
  1. cupcake
  2. brownie
  3. cake-pops
  4. cake-truffles
  5. swiss-roll
  6. pastry
  7. mousse
  8. cake-rusk
  9. eclair
  10. tiramisu

Usage:
  blender --background --python scripts/generate-models.py
  blender --background --python scripts/generate-models.py -- --only cupcake tiramisu
  blender --background --python scripts/generate-models.py -- --draco
"""

import argparse
import math
import os
import random
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector


ROOT_DIR = Path(__file__).resolve().parent.parent
BLEND_DIR = ROOT_DIR / "assets" / "blender"
GLB_DIR = ROOT_DIR / "public" / "models"


# ---------------------------------------------------------------------------
# Compatibility & Scene Helpers
# ---------------------------------------------------------------------------

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def ensure_collection(name, parent=None):
    if name in bpy.data.collections:
        return bpy.data.collections[name]
    col = bpy.data.collections.new(name)
    if parent is None:
        bpy.context.scene.collection.children.link(col)
    else:
        parent.children.link(col)
    return col


def link_obj(obj, col):
    for existing in list(obj.users_collection):
        existing.objects.unlink(obj)
    col.objects.link(obj)


def set_bsdf_input(bsdf, candidates, value):
    for name in candidates:
        if name in bsdf.inputs:
            bsdf.inputs[name].default_value = value
            return bsdf.inputs[name]
    return None


def make_pbr_material(
    name,
    base_color,
    roughness=0.45,
    metallic=0.0,
    coat=0.0,
    coat_roughness=0.08,
    subsurface=0.0,
    transmission=0.0,
    ior=1.45,
    specular=0.5,
    noise_scale=28.0,
    bump_strength=0.0,
    color_variation=0.06,
):
    """Create a Principled BSDF material with procedural Blender detail for .blend
    and direct scalar/color PBR channels for clean glTF 2.0 export."""
    if name in bpy.data.materials:
        return bpy.data.materials[name]

    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    out.location = (520, 0)

    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (200, 0)
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    rgba = (*base_color[:3], 1.0)
    set_bsdf_input(bsdf, ["Base Color"], rgba)
    set_bsdf_input(bsdf, ["Roughness"], roughness)
    set_bsdf_input(bsdf, ["Metallic"], metallic)
    set_bsdf_input(bsdf, ["IOR"], ior)
    set_bsdf_input(bsdf, ["Specular IOR Level", "Specular"], specular)
    set_bsdf_input(bsdf, ["Coat Weight", "Clearcoat"], coat)
    set_bsdf_input(bsdf, ["Coat Roughness", "Clearcoat Roughness"], coat_roughness)
    set_bsdf_input(bsdf, ["Subsurface Weight", "Subsurface"], subsurface)
    set_bsdf_input(bsdf, ["Transmission Weight", "Transmission"], transmission)

    # Keep Base Color directly on Principled BSDF so glTF 2.0 export preserves
    # exact luxury patisserie colors without procedural-node fallback to white.
    if bump_strength > 0.0:
        tex_coord = nodes.new("ShaderNodeTexCoord")
        tex_coord.location = (-560, -140)

        noise = nodes.new("ShaderNodeTexNoise")
        noise.location = (-340, -140)
        noise.inputs["Scale"].default_value = noise_scale
        noise.inputs["Detail"].default_value = 6.0
        noise.inputs["Roughness"].default_value = 0.65
        links.new(tex_coord.outputs["Object"], noise.inputs["Vector"])

        bump = nodes.new("ShaderNodeBump")
        bump.location = (-80, -140)
        bump.inputs["Strength"].default_value = bump_strength
        bump.inputs["Distance"].default_value = 0.01
        links.new(noise.outputs["Fac"], bump.inputs["Height"])
        links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    return mat


def create_palette_materials():
    """Shared luxury patisserie material library."""
    return {
        "dark_chocolate": make_pbr_material(
            "Mat_DarkChocolate",
            (0.085, 0.038, 0.024),
            roughness=0.22,
            coat=0.65,
            coat_roughness=0.06,
            noise_scale=35.0,
            bump_strength=0.04,
            color_variation=0.05,
        ),
        "gloss_glaze": make_pbr_material(
            "Mat_GlossGlaze",
            (0.062, 0.025, 0.018),
            roughness=0.07,
            coat=1.0,
            coat_roughness=0.03,
            specular=0.75,
            noise_scale=20.0,
            bump_strength=0.01,
            color_variation=0.0,
        ),
        "milk_chocolate": make_pbr_material(
            "Mat_MilkChocolate",
            (0.24, 0.11, 0.065),
            roughness=0.28,
            coat=0.45,
            coat_roughness=0.08,
            noise_scale=30.0,
            bump_strength=0.05,
            color_variation=0.08,
        ),
        "cocoa_dust": make_pbr_material(
            "Mat_CocoaDust",
            (0.14, 0.065, 0.04),
            roughness=0.92,
            specular=0.15,
            noise_scale=80.0,
            bump_strength=0.22,
            color_variation=0.18,
        ),
        "sponge_chocolate": make_pbr_material(
            "Mat_SpongeChocolate",
            (0.15, 0.072, 0.045),
            roughness=0.84,
            subsurface=0.06,
            noise_scale=65.0,
            bump_strength=0.24,
            color_variation=0.16,
        ),
        "sponge_vanilla": make_pbr_material(
            "Mat_SpongeVanilla",
            (0.84, 0.66, 0.39),
            roughness=0.82,
            subsurface=0.12,
            noise_scale=70.0,
            bump_strength=0.22,
            color_variation=0.14,
        ),
        "crust_golden": make_pbr_material(
            "Mat_CrustGolden",
            (0.68, 0.42, 0.17),
            roughness=0.66,
            noise_scale=52.0,
            bump_strength=0.18,
            color_variation=0.20,
        ),
        "buttercream_ivory": make_pbr_material(
            "Mat_ButtercreamIvory",
            (0.97, 0.94, 0.88),
            roughness=0.34,
            subsurface=0.22,
            coat=0.15,
            noise_scale=40.0,
            bump_strength=0.03,
            color_variation=0.04,
        ),
        "buttercream_rose": make_pbr_material(
            "Mat_ButtercreamRose",
            (0.87, 0.58, 0.52),
            roughness=0.34,
            subsurface=0.22,
            coat=0.15,
            noise_scale=40.0,
            bump_strength=0.03,
            color_variation=0.04,
        ),
        "mascarpone": make_pbr_material(
            "Mat_Mascarpone",
            (0.96, 0.91, 0.82),
            roughness=0.38,
            subsurface=0.25,
            noise_scale=45.0,
            bump_strength=0.04,
            color_variation=0.05,
        ),
        "espresso_soak": make_pbr_material(
            "Mat_EspressoSoak",
            (0.28, 0.16, 0.09),
            roughness=0.72,
            noise_scale=60.0,
            bump_strength=0.18,
            color_variation=0.18,
        ),
        "liner_parchment": make_pbr_material(
            "Mat_LinerParchment",
            (0.76, 0.61, 0.41),
            roughness=0.74,
            specular=0.25,
            noise_scale=45.0,
            bump_strength=0.06,
            color_variation=0.06,
        ),
        "gold_leaf": make_pbr_material(
            "Mat_GoldLeaf",
            (0.89, 0.71, 0.32),
            roughness=0.18,
            metallic=0.95,
            noise_scale=30.0,
            bump_strength=0.06,
            color_variation=0.0,
        ),
        "crystal_glass": make_pbr_material(
            "Mat_CrystalGlass",
            (0.97, 0.98, 0.99),
            roughness=0.04,
            transmission=0.92,
            ior=1.50,
            specular=0.85,
            coat=0.4,
            bump_strength=0.0,
            color_variation=0.0,
        ),
        "ceramic_espresso": make_pbr_material(
            "Mat_CeramicEspresso",
            (0.10, 0.065, 0.055),
            roughness=0.20,
            coat=0.6,
            coat_roughness=0.08,
            bump_strength=0.02,
            color_variation=0.03,
        ),
        "stick_ivory": make_pbr_material(
            "Mat_StickIvory",
            (0.91, 0.87, 0.80),
            roughness=0.55,
            bump_strength=0.04,
            color_variation=0.04,
        ),
        "sprinkle_rose": make_pbr_material(
            "Mat_SprinkleRose",
            (0.86, 0.50, 0.47),
            roughness=0.25,
            coat=0.5,
            color_variation=0.0,
        ),
        "sprinkle_pistachio": make_pbr_material(
            "Mat_SprinklePistachio",
            (0.55, 0.67, 0.42),
            roughness=0.28,
            coat=0.4,
            color_variation=0.0,
        ),
        "sprinkle_berry": make_pbr_material(
            "Mat_SprinkleBerry",
            (0.54, 0.14, 0.21),
            roughness=0.24,
            coat=0.5,
            color_variation=0.0,
        ),
        "hazelnut": make_pbr_material(
            "Mat_Hazelnut",
            (0.58, 0.36, 0.18),
            roughness=0.52,
            noise_scale=50.0,
            bump_strength=0.14,
            color_variation=0.12,
        ),
    }


def shade_smooth(obj):
    if obj.type != "MESH":
        return
    for poly in obj.data.polygons:
        poly.use_smooth = True


def add_subsurf(obj, levels=2):
    mod = obj.modifiers.new(name="Subsurf", type="SUBSURF")
    mod.levels = levels
    mod.render_levels = levels
    return mod


def add_displace(obj, strength=0.015, noise_scale=0.35, name="MicroDisplace"):
    tex = bpy.data.textures.new(name=f"Tex_{name}", type="CLOUDS")
    tex.noise_scale = noise_scale
    tex.noise_depth = 2
    mod = obj.modifiers.new(name=name, type="DISPLACE")
    mod.texture = tex
    mod.strength = strength
    mod.mid_level = 0.5
    return mod


def apply_all_modifiers(obj):
    if obj.type == "CURVE":
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.convert(target="MESH")
        obj.select_set(False)
        return
    if obj.type != "MESH" or len(obj.modifiers) == 0:
        return
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj.select_set(False)


def make_bmesh_object(name, bm, material, col):
    mesh = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    link_obj(obj, col)
    if material:
        obj.data.materials.append(material)
    shade_smooth(obj)
    return obj


def add_studio_rig(col_name="Studio"):
    """Add 3-point warm patisserie lighting in the .blend file (excluded from GLB)."""
    studio_col = ensure_collection(col_name)

    def add_light(name, kind, loc, rot_deg, energy, color, size=1.5):
        ldata = bpy.data.lights.new(name=name, type=kind)
        ldata.energy = energy
        ldata.color = color
        if kind == "AREA":
            ldata.size = size
        lobj = bpy.data.objects.new(name=name, object_data=ldata)
        lobj.location = loc
        lobj.rotation_euler = tuple(math.radians(a) for a in rot_deg)
        link_obj(lobj, studio_col)
        return lobj

    add_light("KeyLight_Warm", "AREA", (2.6, -2.4, 3.0), (54, 0, 44), 190, (1.0, 0.94, 0.86), 2.2)
    add_light("FillLight_Ivory", "AREA", (-2.8, -1.8, 1.8), (68, 0, -54), 65, (0.95, 0.96, 1.0), 2.8)
    add_light("RimLight_Champagne", "AREA", (0.4, 2.8, 2.4), (-62, 0, 170), 110, (1.0, 0.88, 0.70), 1.6)

    cam_data = bpy.data.cameras.new(name="StudioCamera")
    cam_data.lens = 55.0
    cam_obj = bpy.data.objects.new("StudioCamera", cam_data)
    cam_obj.location = (0.0, -3.4, 1.6)
    direction = Vector((0.0, 0.0, 0.45)) - cam_obj.location
    cam_obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    link_obj(cam_obj, studio_col)
    bpy.context.scene.camera = cam_obj

    if bpy.context.scene.world is None:
        bpy.context.scene.world = bpy.data.worlds.new("PatisserieWorld")
    bpy.context.scene.world.use_nodes = True
    bg = bpy.context.scene.world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.97, 0.95, 0.92, 1.0)
        bg.inputs[1].default_value = 0.65


def normalize_and_prepare(dessert_objects, target_max_dim=1.6):
    """Apply modifiers, center X/Y at 0, place base at Z=0, and normalize scale."""
    for obj in dessert_objects:
        apply_all_modifiers(obj)
        shade_smooth(obj)

    min_v = Vector((float("inf"), float("inf"), float("inf")))
    max_v = Vector((float("-inf"), float("-inf"), float("-inf")))

    bpy.context.view_layer.update()
    for obj in dessert_objects:
        if obj.type != "MESH":
            continue
        mw = obj.matrix_world
        for v in obj.data.vertices:
            wp = mw @ v.co
            min_v.x = min(min_v.x, wp.x)
            min_v.y = min(min_v.y, wp.y)
            min_v.z = min(min_v.z, wp.z)
            max_v.x = max(max_v.x, wp.x)
            max_v.y = max(max_v.y, wp.y)
            max_v.z = max(max_v.z, wp.z)

    size = max_v - min_v
    largest = max(size.x, size.y, size.z, 1e-5)
    scale_factor = target_max_dim / largest
    center_xy = Vector(((min_v.x + max_v.x) * 0.5, (min_v.y + max_v.y) * 0.5, min_v.z))

    for obj in dessert_objects:
        if obj.parent is not None:
            continue
        obj.location = (obj.location - center_xy) * scale_factor
        obj.scale = obj.scale * scale_factor

    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action="DESELECT")
    for obj in dessert_objects:
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bpy.ops.object.select_all(action="DESELECT")


def export_dessert_assets(slug, dessert_objects, use_draco=False):
    BLEND_DIR.mkdir(parents=True, exist_ok=True)
    GLB_DIR.mkdir(parents=True, exist_ok=True)

    blend_path = BLEND_DIR / f"{slug}.blend"
    glb_path = GLB_DIR / f"{slug}.glb"

    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))

    bpy.ops.object.select_all(action="DESELECT")
    for obj in dessert_objects:
        obj.select_set(True)

    export_kwargs = {
        "filepath": str(glb_path),
        "export_format": "GLB",
        "use_selection": True,
        "export_apply": True,
        "export_yup": True,
        "export_materials": "EXPORT",
    }
    if use_draco:
        export_kwargs["export_draco_mesh_compression_enable"] = True
        export_kwargs["export_draco_mesh_compression_level"] = 6

    try:
        bpy.ops.export_scene.gltf(**export_kwargs)
    except TypeError:
        # Fallback if specific exporter flags differ across Blender versions
        export_kwargs.pop("export_draco_mesh_compression_enable", None)
        export_kwargs.pop("export_draco_mesh_compression_level", None)
        bpy.ops.export_scene.gltf(**export_kwargs)

    print(f"[ÉCLAT] Generated {blend_path.name} and {glb_path.name}")


# ---------------------------------------------------------------------------
# Dessert 1: Cupcake
# ---------------------------------------------------------------------------

def build_cupcake(mats, col):
    objs = []
    rng = random.Random(101)

    # 1. Fluted pleated paper liner
    bm = bmesh.new()
    rings = 8
    pleats = 48  # 24 ridges
    for r_idx in range(rings + 1):
        t = r_idx / rings
        z = t * 0.44
        base_r = 0.27 + 0.095 * t
        pleat_amp = 0.006 + 0.016 * t
        ring_verts = []
        for i in range(pleats):
            ang = (i / pleats) * math.tau
            rad = base_r + (pleat_amp if i % 2 == 0 else -pleat_amp * 0.6)
            ring_verts.append(bm.verts.new((rad * math.cos(ang), rad * math.sin(ang), z)))
        if r_idx == 0:
            bm.faces.new(list(reversed(ring_verts)))
        else:
            prev_ring = prev_verts
            for i in range(pleats):
                ni = (i + 1) % pleats
                bm.faces.new((prev_ring[i], prev_ring[ni], ring_verts[ni], ring_verts[i]))
        prev_verts = ring_verts

    # Subtle solid rim thickness
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    liner = make_bmesh_object("Cupcake_Liner", bm, mats["liner_parchment"], col)
    solidify = liner.modifiers.new("Solidify", "SOLIDIFY")
    solidify.thickness = 0.008
    add_subsurf(liner, 1)
    objs.append(liner)

    # 2. Baked sponge dome
    bpy.ops.mesh.primitive_uv_sphere_add(segments=36, ring_count=20, radius=0.355, location=(0, 0, 0.40))
    sponge = bpy.context.active_object
    sponge.name = "Cupcake_Sponge"
    sponge.scale = (1.0, 1.0, 0.56)
    link_obj(sponge, col)
    sponge.data.materials.append(mats["sponge_chocolate"])
    add_displace(sponge, strength=0.014, noise_scale=0.14, name="SpongeCrumb")
    objs.append(sponge)

    # 3. Piped helical star-tip buttercream swirl
    bm_swirl = bmesh.new()
    turns = 3.2
    steps = 110
    star_pts = 14
    prev_ring = None
    for s in range(steps + 1):
        t = s / steps
        theta = t * turns * math.tau
        # Taper spiral radius as it ascends
        spiral_r = 0.255 * (1.0 - 0.90 * (t ** 1.15))
        tube_r = 0.088 * (1.0 - 0.65 * t)
        cx = spiral_r * math.cos(theta)
        cy = spiral_r * math.sin(theta)
        cz = 0.52 + 0.44 * t

        tangent = Vector((
            -math.sin(theta) * max(spiral_r, 0.02),
            math.cos(theta) * max(spiral_r, 0.02),
            0.09,
        )).normalized()
        up = Vector((0, 0, 1))
        normal = tangent.cross(up).normalized()
        binorm = normal.cross(tangent).normalized()

        ring = []
        for k in range(star_pts):
            phi = (k / star_pts) * math.tau
            ridge = 1.0 + (0.16 if k % 2 == 0 else -0.10)
            local = (normal * math.cos(phi) + binorm * math.sin(phi)) * (tube_r * ridge)
            ring.append(bm_swirl.verts.new(Vector((cx, cy, cz)) + local))

        if s == 0:
            bm_swirl.faces.new(list(reversed(ring)))
        else:
            for k in range(star_pts):
                nk = (k + 1) % star_pts
                bm_swirl.faces.new((prev_ring[k], prev_ring[nk], ring[nk], ring[k]))
        if s == steps:
            bm_swirl.faces.new(ring)
        prev_ring = ring

    bmesh.ops.recalc_face_normals(bm_swirl, faces=bm_swirl.faces)
    frosting = make_bmesh_object("Cupcake_Frosting", bm_swirl, mats["buttercream_rose"], col)
    add_subsurf(frosting, 1)
    objs.append(frosting)

    # 4. Artisan sprinkles & gold sugar pearls
    sprinkle_mats = [mats["gold_leaf"], mats["sprinkle_rose"], mats["buttercream_ivory"], mats["dark_chocolate"]]
    for idx in range(28):
        t = rng.uniform(0.10, 0.85)
        theta = t * turns * math.tau + rng.uniform(-0.35, 0.35)
        spiral_r = 0.255 * (1.0 - 0.90 * (t ** 1.15)) + rng.uniform(0.03, 0.068) * (1.0 - 0.5 * t)
        z = 0.54 + 0.44 * t + rng.uniform(0.015, 0.045)
        x = spiral_r * math.cos(theta)
        y = spiral_r * math.sin(theta)
        mat_pick = sprinkle_mats[idx % len(sprinkle_mats)]

        if idx % 3 == 0:
            bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=8, radius=0.014, location=(x, y, z))
        else:
            bpy.ops.mesh.primitive_cylinder_add(
                vertices=8,
                radius=0.007,
                depth=0.034,
                location=(x, y, z),
                rotation=(rng.uniform(0, 3.14), rng.uniform(0, 3.14), rng.uniform(0, 3.14)),
            )
        sp = bpy.context.active_object
        sp.name = f"Cupcake_Sprinkle_{idx}"
        link_obj(sp, col)
        sp.data.materials.append(mat_pick)
        shade_smooth(sp)
        objs.append(sp)

    return objs


# ---------------------------------------------------------------------------
# Dessert 2: Brownie
# ---------------------------------------------------------------------------

def build_brownie(mats, col):
    objs = []
    rng = random.Random(202)

    def create_brownie_slab(name, loc, rot_z_deg):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
        slab = bpy.context.active_object
        slab.name = name
        slab.scale = (0.78, 0.72, 0.27)
        slab.rotation_euler = (0.0, 0.0, math.radians(rot_z_deg))
        link_obj(slab, col)

        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        bev = slab.modifiers.new("Bevel", "BEVEL")
        bev.width = 0.025
        bev.segments = 3

        sub = add_subsurf(slab, 3)
        sub.subdivision_type = "SIMPLE"
        apply_all_modifiers(slab)

        # Assign dense chocolate body vs flaky crinkle crust top
        slab.data.materials.append(mats["sponge_chocolate"])
        slab.data.materials.append(mats["dark_chocolate"])

        # Add organic crinkle displacement on upper surface
        for v in slab.data.vertices:
            if v.co.z > 0.085:
                crack = math.sin(v.co.x * 24.0) * math.cos(v.co.y * 22.0) * 0.009
                ripple = rng.uniform(-0.005, 0.007)
                v.co.z += crack + ripple

        for poly in slab.data.polygons:
            if poly.normal.z > 0.62:
                poly.material_index = 1
            else:
                poly.material_index = 0

        shade_smooth(slab)
        return slab

    slab_bottom = create_brownie_slab("Brownie_Slab_Base", (0.0, 0.0, 0.135), -8.0)
    slab_top = create_brownie_slab("Brownie_Slab_Top", (0.04, -0.02, 0.405), 16.0)
    objs.extend([slab_bottom, slab_top])

    # Embedded chocolate chunks on top slab
    chunk_positions = [
        (-0.14, 0.11, 0.545),
        (0.15, -0.08, 0.542),
        (0.02, 0.16, 0.540),
        (-0.18, -0.14, 0.538),
        (0.19, 0.14, 0.535),
        (-0.02, -0.04, 0.548),
    ]
    for idx, pos in enumerate(chunk_positions):
        bpy.ops.mesh.primitive_cube_add(size=0.075, location=pos)
        chunk = bpy.context.active_object
        chunk.name = f"Brownie_Chunk_{idx}"
        chunk.scale = (rng.uniform(0.85, 1.35), rng.uniform(0.75, 1.2), rng.uniform(0.45, 0.7))
        chunk.rotation_euler = (rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), rng.uniform(0, 3.14))
        link_obj(chunk, col)
        chunk.data.materials.append(mats["gloss_glaze"])
        bev = chunk.modifiers.new("Bevel", "BEVEL")
        bev.width = 0.008
        bev.segments = 2
        objs.append(chunk)

    # Gold leaf garnish
    bpy.ops.mesh.primitive_plane_add(size=0.11, location=(0.05, 0.02, 0.562))
    leaf = bpy.context.active_object
    leaf.name = "Brownie_GoldLeaf"
    link_obj(leaf, col)
    leaf.data.materials.append(mats["gold_leaf"])
    add_displace(leaf, strength=0.018, noise_scale=0.08, name="LeafCrumple")
    objs.append(leaf)

    return objs


# ---------------------------------------------------------------------------
# Dessert 3: Cake Pops
# ---------------------------------------------------------------------------

def build_cake_pops(mats, col):
    objs = []

    # Minimalist stone display base
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.48, depth=0.075, location=(0, 0, 0.0375))
    plinth = bpy.context.active_object
    plinth.name = "CakePops_Plinth"
    link_obj(plinth, col)
    plinth.data.materials.append(mats["ceramic_espresso"])
    bev = plinth.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.015
    bev.segments = 3
    shade_smooth(plinth)
    objs.append(plinth)

    specs = [
        ("Dark", (0.0, 0.0, 1.02), (0.0, 0.0, 0.0), 0.22, mats["gloss_glaze"], mats["gold_leaf"]),
        ("Rose", (-0.28, 0.08, 0.84), (0.04, -0.14, 0.0), 0.19, mats["buttercream_rose"], mats["buttercream_ivory"]),
        ("Milk", (0.29, -0.06, 0.78), (-0.05, 0.16, 0.0), 0.19, mats["milk_chocolate"], mats["dark_chocolate"]),
    ]

    for label, head_loc, tilt, radius, shell_mat, accent_mat in specs:
        # Stick anchored into plinth
        base_pt = Vector((head_loc[0] * 0.45, head_loc[1] * 0.45, 0.06))
        top_pt = Vector(head_loc)
        stick_vec = top_pt - base_pt
        mid = (base_pt + top_pt) * 0.5
        bpy.ops.mesh.primitive_cylinder_add(vertices=18, radius=0.018, depth=stick_vec.length, location=mid)
        stick = bpy.context.active_object
        stick.name = f"CakePop_Stick_{label}"
        stick.rotation_euler = stick_vec.to_track_quat("Z", "Y").to_euler()
        link_obj(stick, col)
        stick.data.materials.append(mats["stick_ivory"])
        shade_smooth(stick)
        objs.append(stick)

        # Spherical cake pop head
        bpy.ops.mesh.primitive_uv_sphere_add(segments=36, ring_count=24, radius=radius, location=head_loc)
        pop = bpy.context.active_object
        pop.name = f"CakePop_Head_{label}"
        pop.rotation_euler = tilt
        link_obj(pop, col)
        pop.data.materials.append(shell_mat)
        shade_smooth(pop)
        objs.append(pop)

        # Decorative glaze drizzle ring / pearls around upper hemisphere
        curve_data = bpy.data.curves.new(f"CakePop_Drizzle_{label}", type="CURVE")
        curve_data.dimensions = "3D"
        curve_data.bevel_depth = 0.011
        curve_data.bevel_resolution = 3
        spline = curve_data.splines.new("NURBS")
        pts = 20
        spline.points.add(pts - 1)
        for i in range(pts):
            t = i / (pts - 1)
            ang = t * math.tau * 1.4
            lat = 0.35 + 0.38 * math.sin(t * math.pi * 3.0)
            r_lat = (radius + 0.004) * math.cos(lat)
            px = head_loc[0] + r_lat * math.cos(ang)
            py = head_loc[1] + r_lat * math.sin(ang)
            pz = head_loc[2] + (radius + 0.004) * math.sin(lat)
            spline.points[i].co = (px, py, pz, 1.0)
        spline.use_endpoint_u = True
        drizzle = bpy.data.objects.new(f"CakePop_DrizzleObj_{label}", curve_data)
        link_obj(drizzle, col)
        drizzle.data.materials.append(accent_mat)
        objs.append(drizzle)

    return objs


# ---------------------------------------------------------------------------
# Dessert 4: Cake Truffles
# ---------------------------------------------------------------------------

def build_cake_truffles(mats, col):
    objs = []
    rng = random.Random(404)

    # Ceramic tasting platter
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.68, depth=0.045, location=(0, 0, 0.0225))
    plate = bpy.context.active_object
    plate.name = "Truffles_Plate"
    link_obj(plate, col)
    plate.data.materials.append(mats["ceramic_espresso"])
    bev = plate.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.015
    bev.segments = 4
    shade_smooth(plate)
    objs.append(plate)

    truffle_configs = [
        ("CocoaDusted", (0.0, 0.22, 0.23), 0.19, mats["cocoa_dust"], "cocoa"),
        ("Hazelnut", (-0.25, -0.17, 0.21), 0.175, mats["milk_chocolate"], "hazelnut"),
        ("RoseGold", (0.25, -0.17, 0.21), 0.175, mats["buttercream_rose"], "gold"),
    ]

    for name, loc, rad, body_mat, style in truffle_configs:
        # Pleated mini bonbon cup
        bm = bmesh.new()
        pleats = 32
        r0 = rad * 0.78
        r1 = rad * 1.06
        h = rad * 0.62
        ring0, ring1 = [], []
        for i in range(pleats):
            ang = (i / pleats) * math.tau
            amp = 0.008 if i % 2 == 0 else -0.006
            ring0.append(bm.verts.new((loc[0] + r0 * math.cos(ang), loc[1] + r0 * math.sin(ang), 0.046)))
            ring1.append(bm.verts.new((loc[0] + (r1 + amp) * math.cos(ang), loc[1] + (r1 + amp) * math.sin(ang), 0.046 + h)))
        bm.faces.new(list(reversed(ring0)))
        for i in range(pleats):
            ni = (i + 1) % pleats
            bm.faces.new((ring0[i], ring0[ni], ring1[ni], ring1[i]))
        cup = make_bmesh_object(f"Truffle_Cup_{name}", bm, mats["liner_parchment"], col)
        solid = cup.modifiers.new("Solidify", "SOLIDIFY")
        solid.thickness = 0.005
        objs.append(cup)

        # Hand-rolled organic truffle sphere
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, radius=rad, location=loc)
        truffle = bpy.context.active_object
        truffle.name = f"Truffle_{name}"
        link_obj(truffle, col)
        truffle.data.materials.append(body_mat)
        add_displace(truffle, strength=0.012 if style == "cocoa" else 0.006, noise_scale=0.08, name=f"Disp_{name}")
        objs.append(truffle)

        # Signature toppings
        if style == "cocoa":
            for j in range(18):
                phi = rng.uniform(0.1, 1.2)
                theta = rng.uniform(0, math.tau)
                px = loc[0] + rad * math.sin(phi) * math.cos(theta)
                py = loc[1] + rad * math.sin(phi) * math.sin(theta)
                pz = loc[2] + rad * math.cos(phi)
                bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.013, location=(px, py, pz))
                nib = bpy.context.active_object
                nib.name = f"Truffle_Nib_{j}"
                link_obj(nib, col)
                nib.data.materials.append(mats["dark_chocolate"])
                objs.append(nib)
        elif style == "hazelnut":
            for j in range(10):
                phi = rng.uniform(0.15, 1.1)
                theta = (j / 10.0) * math.tau + rng.uniform(-0.2, 0.2)
                px = loc[0] + rad * math.sin(phi) * math.cos(theta)
                py = loc[1] + rad * math.sin(phi) * math.sin(theta)
                pz = loc[2] + rad * math.cos(phi)
                bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.022, location=(px, py, pz))
                nut = bpy.context.active_object
                nut.name = f"Truffle_Nut_{j}"
                link_obj(nut, col)
                nut.data.materials.append(mats["hazelnut"])
                objs.append(nut)
        elif style == "gold":
            bpy.ops.mesh.primitive_plane_add(size=0.09, location=(loc[0], loc[1], loc[2] + rad + 0.005))
            foil = bpy.context.active_object
            foil.name = "Truffle_GoldFoil"
            link_obj(foil, col)
            foil.data.materials.append(mats["gold_leaf"])
            add_displace(foil, strength=0.015, noise_scale=0.06, name="GoldLeafFold")
            objs.append(foil)

    return objs


# ---------------------------------------------------------------------------
# Dessert 5: Swiss Roll
# ---------------------------------------------------------------------------

def build_swiss_roll(mats, col):
    objs = []

    def create_roll_segment(name, length, location, rot_z_deg=0.0):
        # Build true spiral cross-section extruded along Y axis
        bm_sponge = bmesh.new()
        bm_cream = bmesh.new()

        turns = 2.4
        steps = 120
        thickness_sponge = 0.052
        thickness_cream = 0.036

        def spiral_strip(bm_target, r_offset, half_thick):
            front_outer, front_inner = [], []
            back_outer, back_inner = [], []
            y0, y1 = -length * 0.5, length * 0.5
            for i in range(steps + 1):
                t = i / steps
                theta = 0.4 + t * turns * math.tau
                r_mid = 0.035 + 0.145 * t + r_offset
                nx, nz = math.cos(theta), math.sin(theta)
                ro = r_mid + half_thick
                ri = max(0.005, r_mid - half_thick)
                front_outer.append(bm_target.verts.new((ro * nx, y0, ro * nz)))
                front_inner.append(bm_target.verts.new((ri * nx, y0, ri * nz)))
                back_outer.append(bm_target.verts.new((ro * nx, y1, ro * nz)))
                back_inner.append(bm_target.verts.new((ri * nx, y1, ri * nz)))

            for i in range(steps):
                # Front spiral face
                bm_target.faces.new((front_inner[i], front_outer[i], front_outer[i + 1], front_inner[i + 1]))
                # Back spiral face
                bm_target.faces.new((back_outer[i], back_inner[i], back_inner[i + 1], back_outer[i + 1]))
                # Outer wall
                bm_target.faces.new((front_outer[i], back_outer[i], back_outer[i + 1], front_outer[i + 1]))
                # Inner wall
                bm_target.faces.new((back_inner[i], front_inner[i], front_inner[i + 1], back_inner[i + 1]))

            # End caps of ribbon
            bm_target.faces.new((front_inner[0], back_inner[0], back_outer[0], front_outer[0]))
            bm_target.faces.new((front_outer[-1], back_outer[-1], back_inner[-1], front_inner[-1]))
            bmesh.ops.recalc_face_normals(bm_target, faces=bm_target.faces)

        spiral_strip(bm_sponge, 0.0, thickness_sponge * 0.5)
        spiral_strip(bm_cream, -0.044, thickness_cream * 0.5)

        sponge_obj = make_bmesh_object(f"{name}_Sponge", bm_sponge, mats["sponge_vanilla"], col)
        cream_obj = make_bmesh_object(f"{name}_Cream", bm_cream, mats["buttercream_ivory"], col)

        for o in (sponge_obj, cream_obj):
            o.location = location
            o.rotation_euler = (0.0, 0.0, math.radians(rot_z_deg))

        return [sponge_obj, cream_obj]

    # Main log + freshly cut angled slice in front
    objs.extend(create_roll_segment("SwissRoll_Log", 0.85, (0.0, 0.14, 0.42), 14.0))
    objs.extend(create_roll_segment("SwissRoll_Slice", 0.22, (0.08, -0.45, 0.42), -12.0))

    # Chocolate ganache ribbons drizzled across main log
    for i in range(5):
        y_pos = -0.18 + i * 0.16
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.415,
            minor_radius=0.014,
            major_segments=40,
            minor_segments=10,
            location=(0.0, y_pos + 0.14, 0.42),
            rotation=(math.radians(90), 0.0, math.radians(14)),
        )
        ribbon = bpy.context.active_object
        ribbon.name = f"SwissRoll_GanacheRibbon_{i}"
        link_obj(ribbon, col)
        ribbon.data.materials.append(mats["gloss_glaze"])
        shade_smooth(ribbon)
        objs.append(ribbon)

    return objs


# ---------------------------------------------------------------------------
# Dessert 6: French Layered Pastry (Mille-Feuille / Tartlet)
# ---------------------------------------------------------------------------

def build_pastry(mats, col):
    objs = []

    layer_heights = [0.04, 0.24, 0.44]
    for idx, z in enumerate(layer_heights):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, z))
        sheet = bpy.context.active_object
        sheet.name = f"Pastry_Sheet_{idx}"
        sheet.scale = (0.96, 0.44, 0.068)
        link_obj(sheet, col)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        bev = sheet.modifiers.new("Bevel", "BEVEL")
        bev.width = 0.015
        bev.segments = 3
        sheet.data.materials.append(mats["crust_golden"])
        add_displace(sheet, strength=0.012, noise_scale=0.18, name=f"PuffTexture_{idx}")
        objs.append(sheet)

    # Piped diplomat cream rows between layers
    cream_z_levels = [0.14, 0.34]
    for lvl_idx, cz in enumerate(cream_z_levels):
        mat_cream = mats["buttercream_ivory"] if lvl_idx == 0 else mats["buttercream_rose"]
        for ix in range(6):
            for iy in range(3):
                px = -0.35 + ix * 0.14
                py = -0.12 + iy * 0.12
                bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=12, radius=0.072, location=(px, py, cz))
                dollop = bpy.context.active_object
                dollop.name = f"Pastry_Cream_{lvl_idx}_{ix}_{iy}"
                dollop.scale = (1.0, 1.0, 0.85)
                link_obj(dollop, col)
                dollop.data.materials.append(mat_cream)
                shade_smooth(dollop)
                objs.append(dollop)

    # Top chocolate glaze cap & piped Chantilly crown
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.482))
    glaze = bpy.context.active_object
    glaze.name = "Pastry_ChocolateTop"
    glaze.scale = (0.93, 0.41, 0.022)
    link_obj(glaze, col)
    bev = glaze.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.008
    bev.segments = 2
    glaze.data.materials.append(mats["gloss_glaze"])
    shade_smooth(glaze)
    objs.append(glaze)

    # Top decorative Chantilly peaks + gold leaf
    for ix in range(3):
        px = -0.22 + ix * 0.22
        bpy.ops.mesh.primitive_cone_add(vertices=20, radius1=0.085, radius2=0.01, depth=0.14, location=(px, 0.0, 0.56))
        peak = bpy.context.active_object
        peak.name = f"Pastry_CrownPeak_{ix}"
        link_obj(peak, col)
        peak.data.materials.append(mats["buttercream_ivory"])
        add_subsurf(peak, 1)
        shade_smooth(peak)
        objs.append(peak)

    bpy.ops.mesh.primitive_plane_add(size=0.11, location=(0.0, 0.0, 0.645))
    leaf = bpy.context.active_object
    leaf.name = "Pastry_GoldLeaf"
    link_obj(leaf, col)
    leaf.data.materials.append(mats["gold_leaf"])
    add_displace(leaf, strength=0.02, noise_scale=0.07, name="PastryLeafCurl")
    objs.append(leaf)

    return objs


# ---------------------------------------------------------------------------
# Dessert 7: Mousse in Transparent Dessert Glass
# ---------------------------------------------------------------------------

def build_mousse(mats, col):
    objs = []

    # 1. Lathed crystal-clear dessert glass (inner & outer wall)
    bm_glass = bmesh.new()
    profile = [
        (0.0, 0.0),
        (0.24, 0.0),
        (0.24, 0.055),
        (0.26, 0.14),
        (0.35, 0.72),
        (0.37, 0.80),
        (0.35, 0.80),
        (0.33, 0.72),
        (0.235, 0.15),
        (0.21, 0.075),
        (0.0, 0.075),
    ]
    segs = 48
    rings = []
    for r, z in profile:
        if r == 0.0:
            v_center = bm_glass.verts.new((0.0, 0.0, z))
            rings.append([v_center])
        else:
            ring = []
            for s in range(segs):
                ang = (s / segs) * math.tau
                ring.append(bm_glass.verts.new((r * math.cos(ang), r * math.sin(ang), z)))
            rings.append(ring)

    for idx in range(len(rings) - 1):
        r_a = rings[idx]
        r_b = rings[idx + 1]
        if len(r_a) == 1:
            for s in range(segs):
                ns = (s + 1) % segs
                bm_glass.faces.new((r_a[0], r_b[ns], r_b[s]))
        elif len(r_b) == 1:
            for s in range(segs):
                ns = (s + 1) % segs
                bm_glass.faces.new((r_a[s], r_a[ns], r_b[0]))
        else:
            for s in range(segs):
                ns = (s + 1) % segs
                bm_glass.faces.new((r_a[s], r_a[ns], r_b[ns], r_b[s]))

    bmesh.ops.recalc_face_normals(bm_glass, faces=bm_glass.faces)
    glass = make_bmesh_object("Mousse_CrystalGlass", bm_glass, mats["crystal_glass"], col)
    add_subsurf(glass, 1)
    objs.append(glass)

    # 2. Inner mousse layers (inset slightly from inner glass wall)
    def add_frustum_layer(name, r_bot, r_top, z_bot, z_top, mat):
        bpy.ops.mesh.primitive_cone_add(
            vertices=40,
            radius1=r_bot,
            radius2=r_top,
            depth=z_top - z_bot,
            location=(0.0, 0.0, (z_bot + z_top) * 0.5),
        )
        obj = bpy.context.active_object
        obj.name = name
        link_obj(obj, col)
        obj.data.materials.append(mat)
        shade_smooth(obj)
        return obj

    objs.append(add_frustum_layer("Mousse_Layer_Dark", 0.21, 0.258, 0.08, 0.34, mats["dark_chocolate"]))
    objs.append(add_frustum_layer("Mousse_Layer_Milk", 0.258, 0.295, 0.34, 0.56, mats["milk_chocolate"]))
    objs.append(add_frustum_layer("Mousse_Layer_RoseCream", 0.295, 0.318, 0.56, 0.70, mats["buttercream_rose"]))

    # 3. Whipped Chantilly crown + chocolate curl
    bpy.ops.mesh.primitive_uv_sphere_add(segments=28, ring_count=16, radius=0.17, location=(0.0, 0.0, 0.74))
    chantilly = bpy.context.active_object
    chantilly.name = "Mousse_ChantillyCrown"
    chantilly.scale = (1.0, 1.0, 0.65)
    link_obj(chantilly, col)
    chantilly.data.materials.append(mats["buttercream_ivory"])
    add_displace(chantilly, strength=0.016, noise_scale=0.12, name="CreamPeak")
    objs.append(chantilly)

    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.095,
        minor_radius=0.018,
        major_segments=28,
        minor_segments=10,
        location=(0.02, 0.0, 0.87),
        rotation=(math.radians(52), math.radians(24), 0.0),
    )
    curl = bpy.context.active_object
    curl.name = "Mousse_ChocolateCurl"
    link_obj(curl, col)
    curl.data.materials.append(mats["gloss_glaze"])
    shade_smooth(curl)
    objs.append(curl)

    return objs


# ---------------------------------------------------------------------------
# Dessert 8: Cake Rusk
# ---------------------------------------------------------------------------

def build_cake_rusk(mats, col):
    objs = []

    def create_rusk(name, loc, rot_deg):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
        rusk = bpy.context.active_object
        rusk.name = name
        rusk.scale = (0.86, 0.32, 0.16)
        link_obj(rusk, col)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

        bev = rusk.modifiers.new("Bevel", "BEVEL")
        bev.width = 0.032
        bev.segments = 4
        add_subsurf(rusk, 2)
        apply_all_modifiers(rusk)

        # Gentle baked dome rise along top edge
        for v in rusk.data.vertices:
            if v.co.z > 0.02:
                arch = 0.028 * math.cos((v.co.x / 0.45) * 1.1)
                v.co.z += max(0.0, arch)

        rusk.data.materials.append(mats["crust_golden"])
        rusk.data.materials.append(mats["sponge_vanilla"])
        for poly in rusk.data.polygons:
            if abs(poly.normal.y) > 0.65:
                poly.material_index = 1  # porous crumb face
            else:
                poly.material_index = 0  # toasted outer edge

        add_displace(rusk, strength=0.014, noise_scale=0.08, name=f"RuskCrumb_{name}")
        rusk.rotation_euler = tuple(math.radians(a) for a in rot_deg)
        shade_smooth(rusk)
        return rusk

    objs.append(create_rusk("CakeRusk_Base", (0.0, 0.05, 0.085), (0.0, 0.0, -8.0)))
    objs.append(create_rusk("CakeRusk_Mid", (0.04, -0.04, 0.245), (4.0, -3.0, 11.0)))
    objs.append(create_rusk("CakeRusk_Top", (-0.06, -0.14, 0.33), (28.0, 6.0, -22.0)))

    return objs


# ---------------------------------------------------------------------------
# Dessert 9: Éclair
# ---------------------------------------------------------------------------

def build_eclair(mats, col):
    objs = []

    # 1. Elongated choux pastry body
    bpy.ops.mesh.primitive_uv_sphere_add(segments=44, ring_count=26, radius=0.22, location=(0.0, 0.0, 0.19))
    choux = bpy.context.active_object
    choux.name = "Eclair_ChouxBody"
    choux.scale = (2.65, 1.0, 0.86)
    link_obj(choux, col)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    choux.data.materials.append(mats["crust_golden"])
    add_displace(choux, strength=0.012, noise_scale=0.14, name="ChouxTexture")
    objs.append(choux)

    # 2. Cream filling visible via subtle piped center seam & ends
    bpy.ops.mesh.primitive_uv_sphere_add(segments=28, ring_count=16, radius=0.16, location=(0.0, 0.0, 0.175))
    filling = bpy.context.active_object
    filling.name = "Eclair_VanillaFilling"
    filling.scale = (3.45, 0.92, 0.32)
    link_obj(filling, col)
    filling.data.materials.append(mats["buttercream_ivory"])
    shade_smooth(filling)
    objs.append(filling)

    # 3. Glossy chocolate fondant glaze cap hugging top half
    bm_glaze = bmesh.new()
    bmesh.ops.create_uvsphere(bm_glaze, u_segments=44, v_segments=22, radius=0.226)
    for v in bm_glaze.verts:
        v.co.x *= 2.66
        v.co.z *= 0.88
        if v.co.z < 0.02:
            # Wave skirt edge along the sides
            wave = 0.025 * math.sin(v.co.x * 16.0)
            v.co.z = 0.015 + wave
        v.co.z += 0.195

    glaze = make_bmesh_object("Eclair_ChocolateGlaze", bm_glaze, mats["gloss_glaze"], col)
    add_subsurf(glaze, 1)
    objs.append(glaze)

    # 4. Gold chocolate filigree zig-zag on glaze
    curve_data = bpy.data.curves.new("Eclair_Filigree", type="CURVE")
    curve_data.dimensions = "3D"
    curve_data.bevel_depth = 0.008
    curve_data.bevel_resolution = 3
    spline = curve_data.splines.new("NURBS")
    pts = 28
    spline.points.add(pts - 1)
    for i in range(pts):
        t = i / (pts - 1)
        px = -0.44 + 0.88 * t
        py = 0.11 * math.sin(t * math.pi * 7.0)
        # Follow curved glaze top
        pz = 0.388 * math.sqrt(max(0.05, 1.0 - (px / 0.62) ** 2))
        spline.points[i].co = (px, py, max(0.24, pz), 1.0)
    spline.use_endpoint_u = True
    filigree = bpy.data.objects.new("Eclair_GoldFiligree", curve_data)
    link_obj(filigree, col)
    filigree.data.materials.append(mats["gold_leaf"])
    objs.append(filigree)

    return objs


# ---------------------------------------------------------------------------
# Dessert 10: Tiramisu
# ---------------------------------------------------------------------------

def build_tiramisu(mats, col):
    objs = []

    # 1. Thin espresso-ceramic presentation plate
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.02))
    saucer = bpy.context.active_object
    saucer.name = "Tiramisu_Saucer"
    saucer.scale = (1.06, 0.86, 0.04)
    link_obj(saucer, col)
    bev = saucer.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.015
    bev.segments = 3
    saucer.data.materials.append(mats["ceramic_espresso"])
    shade_smooth(saucer)
    objs.append(saucer)

    # 2. Alternating Savoiardi ladyfinger biscuit tiers & mascarpone layers
    def add_tier(name, z_center, height, mat):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, z_center))
        tier = bpy.context.active_object
        tier.name = name
        tier.scale = (0.86, 0.66, height)
        link_obj(tier, col)
        bev = tier.modifiers.new("Bevel", "BEVEL")
        bev.width = 0.012
        bev.segments = 2
        tier.data.materials.append(mat)
        shade_smooth(tier)
        return tier

    objs.append(add_tier("Tiramisu_Savoiardi_1", 0.095, 0.11, mats["espresso_soak"]))
    objs.append(add_tier("Tiramisu_Mascarpone_1", 0.210, 0.12, mats["mascarpone"]))
    objs.append(add_tier("Tiramisu_Savoiardi_2", 0.325, 0.11, mats["espresso_soak"]))
    objs.append(add_tier("Tiramisu_Mascarpone_2", 0.435, 0.11, mats["mascarpone"]))

    # 3. Exposed ladyfinger cross-section biscuits along front/back edge
    for idx in range(5):
        px = -0.32 + idx * 0.16
        for tz in (0.095, 0.325):
            bpy.ops.mesh.primitive_cylinder_add(
                vertices=20,
                radius=0.058,
                depth=0.675,
                location=(px, 0.0, tz),
                rotation=(math.radians(90), 0.0, 0.0),
            )
            finger = bpy.context.active_object
            finger.name = f"Tiramisu_Ladyfinger_{tz}_{idx}"
            link_obj(finger, col)
            finger.data.materials.append(mats["sponge_vanilla"])
            shade_smooth(finger)
            objs.append(finger)

    # 4. Piped mascarpone cream clouds on top (5 x 4 pillows)
    for ix in range(5):
        for iy in range(4):
            px = -0.32 + ix * 0.16
            py = -0.225 + iy * 0.15
            bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=14, radius=0.085, location=(px, py, 0.51))
            pillow = bpy.context.active_object
            pillow.name = f"Tiramisu_MascarponePeak_{ix}_{iy}"
            pillow.scale = (1.0, 1.0, 0.85)
            link_obj(pillow, col)
            pillow.data.materials.append(mats["mascarpone"])
            shade_smooth(pillow)
            objs.append(pillow)

    # 5. Velvety cocoa powder veil dusting the upper pillow contours
    for ix in range(5):
        for iy in range(4):
            px = -0.32 + ix * 0.16
            py = -0.225 + iy * 0.15
            bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=10, radius=0.0865, location=(px, py, 0.518))
            veil = bpy.context.active_object
            veil.name = f"Tiramisu_CocoaVeil_{ix}_{iy}"
            veil.scale = (0.94, 0.94, 0.78)
            link_obj(veil, col)
            veil.data.materials.append(mats["cocoa_dust"])
            shade_smooth(veil)
            objs.append(veil)

    # 6. Delicate chocolate curl & gold leaf accent
    bpy.ops.mesh.primitive_plane_add(size=0.095, location=(0.04, 0.02, 0.595))
    leaf = bpy.context.active_object
    leaf.name = "Tiramisu_GoldLeaf"
    link_obj(leaf, col)
    leaf.data.materials.append(mats["gold_leaf"])
    add_displace(leaf, strength=0.018, noise_scale=0.06, name="TiramisuLeaf")
    objs.append(leaf)

    return objs


# ---------------------------------------------------------------------------
# Scroll Recipe Experience: Layered Cake Assembly (Stages 00 - 05)
# ---------------------------------------------------------------------------

def build_recipe_cake(mats, col):
    """Multi-stage Blender assembly named Stage_00..Stage_05 for scroll-driven
    cake baking & decorating animation in Three.js."""
    objs = []

    # Stage 00: Marble & Gold Cake Stand (base at Z=0, top surface at Z=0.14)
    bpy.ops.mesh.primitive_cylinder_add(vertices=56, radius=0.64, depth=0.045, location=(0, 0, 0.118))
    stand_plate = bpy.context.active_object
    stand_plate.name = "Stage_00_StandPlate"
    link_obj(stand_plate, col)
    stand_plate.data.materials.append(mats["ceramic_espresso"])
    bev = stand_plate.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.012
    bev.segments = 3
    shade_smooth(stand_plate)
    objs.append(stand_plate)

    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.22, depth=0.095, location=(0, 0, 0.048))
    stand_foot = bpy.context.active_object
    stand_foot.name = "Stage_00_StandFoot"
    link_obj(stand_foot, col)
    stand_foot.data.materials.append(mats["gold_leaf"])
    shade_smooth(stand_foot)
    objs.append(stand_foot)

    # Stage 01: Raw Ingredients (cacao, butter, vanilla, flour, hazelnuts)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=28, ring_count=16, radius=0.16, location=(0.0, 0.04, 0.21))
    flour = bpy.context.active_object
    flour.name = "Stage_01_FlourMound"
    flour.scale = (1.35, 1.35, 0.55)
    link_obj(flour, col)
    flour.data.materials.append(mats["mascarpone"])
    add_displace(flour, strength=0.01, noise_scale=0.12, name="FlourSoft")
    objs.append(flour)

    bpy.ops.mesh.primitive_cube_add(size=0.16, location=(-0.26, -0.14, 0.205))
    butter = bpy.context.active_object
    butter.name = "Stage_01_ButterCube"
    butter.scale = (1.25, 0.85, 0.68)
    butter.rotation_euler = (0.0, 0.0, math.radians(22))
    link_obj(butter, col)
    bev = butter.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.014
    bev.segments = 3
    butter.data.materials.append(mats["sponge_vanilla"])
    shade_smooth(butter)
    objs.append(butter)

    for idx, (loc, rot) in enumerate([((0.26, -0.12, 0.205), -24), ((0.22, 0.22, 0.205), 35)]):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, radius=0.085, location=loc)
        cocoa = bpy.context.active_object
        cocoa.name = f"Stage_01_CocoaPod_{idx}"
        cocoa.scale = (1.55, 0.88, 0.78)
        cocoa.rotation_euler = (0.0, 0.0, math.radians(rot))
        link_obj(cocoa, col)
        cocoa.data.materials.append(mats["dark_chocolate"])
        shade_smooth(cocoa)
        objs.append(cocoa)

    for idx, pos in enumerate([(-0.22, 0.22, 0.175), (-0.08, -0.26, 0.175), (0.08, -0.24, 0.175)]):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.042, location=pos)
        nut = bpy.context.active_object
        nut.name = f"Stage_01_Hazelnut_{idx}"
        link_obj(nut, col)
        nut.data.materials.append(mats["hazelnut"])
        shade_smooth(nut)
        objs.append(nut)

    # Stage 02: Mixing Bowl, Swirled Batter & Wire Whisk
    bm_bowl = bmesh.new()
    bowl_profile = [
        (0.0, 0.145),
        (0.20, 0.145),
        (0.32, 0.26),
        (0.38, 0.42),
        (0.36, 0.42),
        (0.30, 0.27),
        (0.18, 0.17),
        (0.0, 0.17),
    ]
    segs = 44
    rings = []
    for r, z in bowl_profile:
        if r == 0.0:
            rings.append([bm_bowl.verts.new((0.0, 0.0, z))])
        else:
            rings.append([
                bm_bowl.verts.new((r * math.cos((s / segs) * math.tau), r * math.sin((s / segs) * math.tau), z))
                for s in range(segs)
            ])
    for idx in range(len(rings) - 1):
        ra, rb = rings[idx], rings[idx + 1]
        if len(ra) == 1:
            for s in range(segs):
                bm_bowl.faces.new((ra[0], rb[(s + 1) % segs], rb[s]))
        elif len(rb) == 1:
            for s in range(segs):
                bm_bowl.faces.new((ra[s], ra[(s + 1) % segs], rb[0]))
        else:
            for s in range(segs):
                ns = (s + 1) % segs
                bm_bowl.faces.new((ra[s], ra[ns], rb[ns], rb[s]))
    bmesh.ops.recalc_face_normals(bm_bowl, faces=bm_bowl.faces)
    bowl = make_bmesh_object("Stage_02_MixingBowl", bm_bowl, mats["gold_leaf"], col)
    add_subsurf(bowl, 1)
    objs.append(bowl)

    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=0.325, depth=0.12, location=(0, 0, 0.28))
    batter = bpy.context.active_object
    batter.name = "Stage_02_ChocolateBatter"
    link_obj(batter, col)
    batter.data.materials.append(mats["gloss_glaze"])
    add_displace(batter, strength=0.018, noise_scale=0.14, name="BatterSwirl")
    objs.append(batter)

    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.022, depth=0.34, location=(0.14, -0.05, 0.56))
    whisk_handle = bpy.context.active_object
    whisk_handle.name = "Stage_02_WhiskHandle"
    whisk_handle.rotation_euler = (math.radians(22), math.radians(-24), 0.0)
    link_obj(whisk_handle, col)
    whisk_handle.data.materials.append(mats["ceramic_espresso"])
    shade_smooth(whisk_handle)
    objs.append(whisk_handle)

    for w_idx in range(3):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.09,
            minor_radius=0.008,
            major_segments=28,
            minor_segments=8,
            location=(0.04, -0.01, 0.36),
            rotation=(math.radians(22), math.radians(-24), math.radians(w_idx * 60)),
        )
        wire = bpy.context.active_object
        wire.name = f"Stage_02_WhiskLoop_{w_idx}"
        link_obj(wire, col)
        wire.data.materials.append(mats["gold_leaf"])
        shade_smooth(wire)
        objs.append(wire)

    # Stage 03: Three Baked Chocolate Sponge Tiers
    sponge_specs = [
        ("Stage_03_SpongeBottom", 0.22, 0.14),
        ("Stage_03_SpongeMiddle", 0.40, 0.14),
        ("Stage_03_SpongeTop", 0.58, 0.14),
    ]
    for s_name, sz, sh in sponge_specs:
        bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.44, depth=sh, location=(0, 0, sz))
        sp = bpy.context.active_object
        sp.name = s_name
        link_obj(sp, col)
        bev = sp.modifiers.new("Bevel", "BEVEL")
        bev.width = 0.014
        bev.segments = 3
        sp.data.materials.append(mats["sponge_chocolate"])
        add_displace(sp, strength=0.009, noise_scale=0.14, name=f"Crumb_{s_name}")
        objs.append(sp)

    # Stage 04: Cream Filling Layers, Glossy Mirror Drip & Piped Rosettes
    for c_idx, cz in enumerate((0.31, 0.49)):
        bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.455, depth=0.045, location=(0, 0, cz))
        cream_layer = bpy.context.active_object
        cream_layer.name = f"Stage_04_CreamFilling_{c_idx}"
        link_obj(cream_layer, col)
        cream_layer.data.materials.append(mats["buttercream_rose"])
        shade_smooth(cream_layer)
        objs.append(cream_layer)

    # Mirror chocolate ganache top cap with organic drip ring
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.455, depth=0.055, location=(0, 0, 0.665))
    drip_cap = bpy.context.active_object
    drip_cap.name = "Stage_04_GanacheCap"
    link_obj(drip_cap, col)
    bev = drip_cap.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.018
    bev.segments = 3
    drip_cap.data.materials.append(mats["gloss_glaze"])
    shade_smooth(drip_cap)
    objs.append(drip_cap)

    for d_idx in range(12):
        ang = (d_idx / 12.0) * math.tau
        drop_len = 0.11 + 0.07 * math.sin(d_idx * 2.3)
        dx = 0.445 * math.cos(ang)
        dy = 0.445 * math.sin(ang)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=10, radius=0.036, location=(dx, dy, 0.65 - drop_len * 0.5))
        drip = bpy.context.active_object
        drip.name = f"Stage_04_GanacheDrip_{d_idx}"
        drip.scale = (0.75, 0.75, drop_len / 0.065)
        link_obj(drip, col)
        drip.data.materials.append(mats["gloss_glaze"])
        shade_smooth(drip)
        objs.append(drip)

    for r_idx in range(8):
        ang = (r_idx / 8.0) * math.tau
        rx = 0.30 * math.cos(ang)
        ry = 0.30 * math.sin(ang)
        bpy.ops.mesh.primitive_cone_add(vertices=18, radius1=0.078, radius2=0.012, depth=0.11, location=(rx, ry, 0.745))
        ros = bpy.context.active_object
        ros.name = f"Stage_04_CreamRosette_{r_idx}"
        link_obj(ros, col)
        ros.data.materials.append(mats["buttercream_ivory"])
        add_subsurf(ros, 1)
        shade_smooth(ros)
        objs.append(ros)

    # Stage 05: Artisan Chocolate Curls, Gold Pearls & 24k Gold Leaf Crown
    for c_idx in range(3):
        ang = c_idx * 2.09
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.075,
            minor_radius=0.014,
            major_segments=24,
            minor_segments=8,
            location=(0.05 * math.cos(ang), 0.05 * math.sin(ang), 0.76),
            rotation=(math.radians(58), math.radians(15), ang),
        )
        curl = bpy.context.active_object
        curl.name = f"Stage_05_ChocolateCurl_{c_idx}"
        link_obj(curl, col)
        curl.data.materials.append(mats["dark_chocolate"])
        shade_smooth(curl)
        objs.append(curl)

    for p_idx in range(8):
        ang = ((p_idx + 0.5) / 8.0) * math.tau
        px = 0.32 * math.cos(ang)
        py = 0.32 * math.sin(ang)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.018, location=(px, py, 0.715))
        pearl = bpy.context.active_object
        pearl.name = f"Stage_05_GoldPearl_{p_idx}"
        link_obj(pearl, col)
        pearl.data.materials.append(mats["gold_leaf"])
        shade_smooth(pearl)
        objs.append(pearl)

    bpy.ops.mesh.primitive_plane_add(size=0.11, location=(0.0, 0.0, 0.84))
    crown_leaf = bpy.context.active_object
    crown_leaf.name = "Stage_05_GoldLeaf"
    link_obj(crown_leaf, col)
    crown_leaf.data.materials.append(mats["gold_leaf"])
    add_displace(crown_leaf, strength=0.022, noise_scale=0.07, name="CakeCrownLeaf")
    objs.append(crown_leaf)

    return objs


# ---------------------------------------------------------------------------
# Registry & CLI Entrypoint
# ---------------------------------------------------------------------------

BUILDERS = {
    "cupcake": build_cupcake,
    "brownie": build_brownie,
    "cake-pops": build_cake_pops,
    "cake-truffles": build_cake_truffles,
    "swiss-roll": build_swiss_roll,
    "pastry": build_pastry,
    "mousse": build_mousse,
    "cake-rusk": build_cake_rusk,
    "eclair": build_eclair,
    "tiramisu": build_tiramisu,
    "recipe-cake": build_recipe_cake,
}


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    parser = argparse.ArgumentParser(description="Generate ÉCLAT 3D dessert .blend and .glb files.")
    parser.add_argument("--only", nargs="+", choices=list(BUILDERS.keys()), help="Build specific models only.")
    parser.add_argument("--draco", action="store_true", help="Enable Draco mesh compression during GLB export.")
    return parser.parse_args(argv)


def main():
    args = parse_args()
    targets = args.only if args.only else list(BUILDERS.keys())

    print(f"[ÉCLAT] Starting 3D pipeline for {len(targets)} dessert(s)...")
    for slug in targets:
        clear_scene()
        dessert_col = ensure_collection(f"Dessert_{slug}")
        add_studio_rig("Studio")
        mats = create_palette_materials()
        dessert_objs = BUILDERS[slug](mats, dessert_col)
        normalize_and_prepare(dessert_objs, target_max_dim=1.6)
        export_dessert_assets(slug, dessert_objs, use_draco=args.draco)

    print("[ÉCLAT] Completed all requested 3D dessert assets.")


if __name__ == "__main__":
    main()
