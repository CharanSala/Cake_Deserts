import { MutableRefObject, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Shared PBR materials matching Blender Principled BSDF patisserie palette
function usePatisserieMaterials() {
  return useMemo(() => {
    return {
      darkChoc: new THREE.MeshPhysicalMaterial({
        color: '#2C140E',
        roughness: 0.24,
        clearcoat: 0.65,
        clearcoatRoughness: 0.08,
      }),
      glossGlaze: new THREE.MeshPhysicalMaterial({
        color: '#200D08',
        roughness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
      }),
      milkChoc: new THREE.MeshPhysicalMaterial({
        color: '#5B2C1B',
        roughness: 0.28,
        clearcoat: 0.45,
      }),
      cocoaDust: new THREE.MeshStandardMaterial({
        color: '#3B1C13',
        roughness: 0.92,
      }),
      spongeDark: new THREE.MeshStandardMaterial({
        color: '#462317',
        roughness: 0.85,
      }),
      spongeVanilla: new THREE.MeshStandardMaterial({
        color: '#D8AB6A',
        roughness: 0.82,
      }),
      crustGolden: new THREE.MeshStandardMaterial({
        color: '#B87836',
        roughness: 0.64,
      }),
      creamIvory: new THREE.MeshPhysicalMaterial({
        color: '#F7EFE2',
        roughness: 0.34,
        clearcoat: 0.15,
      }),
      creamRose: new THREE.MeshPhysicalMaterial({
        color: '#DF9B8F',
        roughness: 0.34,
        clearcoat: 0.15,
      }),
      mascarpone: new THREE.MeshStandardMaterial({
        color: '#F4E8D4',
        roughness: 0.38,
      }),
      espressoSoak: new THREE.MeshStandardMaterial({
        color: '#4E2C1B',
        roughness: 0.72,
      }),
      liner: new THREE.MeshStandardMaterial({
        color: '#C29A67',
        roughness: 0.74,
        side: THREE.DoubleSide,
      }),
      gold: new THREE.MeshStandardMaterial({
        color: '#DFB664',
        roughness: 0.2,
        metalness: 0.9,
      }),
      copper: new THREE.MeshStandardMaterial({
        color: '#C78556',
        roughness: 0.24,
        metalness: 0.85,
        side: THREE.DoubleSide,
      }),
      ceramic: new THREE.MeshPhysicalMaterial({
        color: '#1F1410',
        roughness: 0.22,
        clearcoat: 0.6,
      }),
      stickIvory: new THREE.MeshStandardMaterial({
        color: '#EAE2D6',
        roughness: 0.52,
      }),
      hazelnut: new THREE.MeshStandardMaterial({
        color: '#8E5A2E',
        roughness: 0.5,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: '#F4F7FA',
        roughness: 0.05,
        transmission: 0.86,
        transparent: true,
        opacity: 0.9,
        ior: 1.5,
        thickness: 0.25,
        side: THREE.DoubleSide,
      }),
    };
  }, []);
}

function makeRoundedBlockGeometry(w: number, h: number, d: number, r = 0.03) {
  const shape = new THREE.Shape();
  const hw = w / 2 - r;
  const hd = d / 2 - r;
  shape.moveTo(-hw, -d / 2);
  shape.lineTo(hw, -d / 2);
  shape.quadraticCurveTo(w / 2, -d / 2, w / 2, -hd);
  shape.lineTo(w / 2, hd);
  shape.quadraticCurveTo(w / 2, d / 2, hw, d / 2);
  shape.lineTo(-hw, d / 2);
  shape.quadraticCurveTo(-w / 2, d / 2, -w / 2, hd);
  shape.lineTo(-w / 2, -hd);
  shape.quadraticCurveTo(-w / 2, -d / 2, -hw, -d / 2);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: true,
    bevelThickness: r * 0.6,
    bevelSize: r * 0.6,
    bevelSegments: 3,
  });
  geo.rotateX(-Math.PI / 2);
  geo.center();
  return geo;
}

function CupcakeMesh({ mats }: { mats: ReturnType<typeof usePatisserieMaterials> }) {
  const { linerGeo, swirlGeo } = useMemo(() => {
    // Fluted 24-ridge liner
    const liner = new THREE.CylinderGeometry(0.42, 0.31, 0.5, 48, 4, false);
    const pos = liner.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const r = Math.hypot(x, z);
      if (r > 0.05) {
        const ang = Math.atan2(z, x);
        const t = (y + 0.25) / 0.5;
        const amp = 0.015 * (0.4 + 0.6 * t);
        const flute = Math.sin(ang * 24) * amp;
        const factor = (r + flute) / r;
        pos.setX(i, x * factor);
        pos.setZ(i, z * factor);
      }
    }
    liner.computeVertexNormals();

    // Helical tapered buttercream frosting swirl
    const pts: THREE.Vector3[] = [];
    const turns = 3.1;
    const steps = 64;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const theta = t * turns * Math.PI * 2;
      const radius = 0.30 * (1 - 0.92 * Math.pow(t, 1.15));
      pts.push(
        new THREE.Vector3(
          Math.cos(theta) * radius,
          0.32 + t * 0.56,
          Math.sin(theta) * radius,
        ),
      );
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const swirl = new THREE.TubeGeometry(curve, 72, 0.11, 14, false);
    const sPos = swirl.attributes.position;
    for (let i = 0; i < sPos.count; i++) {
      const sy = sPos.getY(i);
      const t = Math.max(0, Math.min(1, (sy - 0.32) / 0.56));
      const scale = 1 - 0.55 * t;
      const sx = sPos.getX(i);
      const sz = sPos.getZ(i);
      sPos.setX(i, sx * (0.75 + 0.25 * scale));
      sPos.setZ(i, sz * (0.75 + 0.25 * scale));
    }
    swirl.computeVertexNormals();

    return { linerGeo: liner, swirlGeo: swirl };
  }, []);

  const sprinkles = useMemo(
    () => [
      { pos: [0.22, 0.45, 0.18] as [number, number, number], gold: true },
      { pos: [-0.24, 0.48, 0.12] as [number, number, number], gold: false },
      { pos: [0.08, 0.62, -0.21] as [number, number, number], gold: true },
      { pos: [-0.14, 0.66, -0.14] as [number, number, number], gold: false },
      { pos: [0.16, 0.74, 0.09] as [number, number, number], gold: true },
      { pos: [-0.06, 0.83, 0.08] as [number, number, number], gold: false },
      { pos: [0.01, 0.92, 0.01] as [number, number, number], gold: true },
    ],
    [],
  );

  return (
    <group position={[0, -0.35, 0]}>
      <mesh geometry={linerGeo} material={mats.liner} position={[0, 0.25, 0]} castShadow receiveShadow />
      <mesh material={mats.spongeDark} position={[0, 0.42, 0]} scale={[1, 0.55, 1]} castShadow>
        <sphereGeometry args={[0.41, 28, 18]} />
      </mesh>
      <mesh geometry={swirlGeo} material={mats.creamRose} castShadow receiveShadow />
      {sprinkles.map((s, i) => (
        <mesh
          key={i}
          position={s.pos}
          material={s.gold ? mats.gold : mats.creamIvory}
          castShadow
        >
          <sphereGeometry args={[0.022, 10, 8]} />
        </mesh>
      ))}
    </group>
  );
}

function BrownieMesh({ mats }: { mats: ReturnType<typeof usePatisserieMaterials> }) {
  const slabGeo = useMemo(() => makeRoundedBlockGeometry(0.84, 0.24, 0.78, 0.028), []);
  const topCrustGeo = useMemo(() => makeRoundedBlockGeometry(0.82, 0.035, 0.76, 0.015), []);

  return (
    <group position={[0, -0.28, 0]}>
      {/* Bottom brownie */}
      <group position={[0, 0.14, 0]} rotation={[0, -0.14, 0]}>
        <mesh geometry={slabGeo} material={mats.spongeDark} castShadow receiveShadow />
        <mesh geometry={topCrustGeo} material={mats.darkChoc} position={[0, 0.13, 0]} castShadow />
      </group>
      {/* Top angled brownie */}
      <group position={[0.05, 0.43, -0.02]} rotation={[0, 0.3, 0]}>
        <mesh geometry={slabGeo} material={mats.spongeDark} castShadow receiveShadow />
        <mesh geometry={topCrustGeo} material={mats.darkChoc} position={[0, 0.13, 0]} castShadow />
        {/* Chocolate chunks */}
        {[
          [-0.16, 0.17, 0.12],
          [0.18, 0.17, -0.1],
          [0.02, 0.17, 0.18],
          [-0.18, 0.17, -0.16],
        ].map((pos, i) => (
          <mesh
            key={i}
            position={pos as [number, number, number]}
            rotation={[0.2, i * 0.8, 0.1]}
            material={mats.glossGlaze}
            castShadow
          >
            <boxGeometry args={[0.1, 0.06, 0.09]} />
          </mesh>
        ))}
        {/* Gold leaf */}
        <mesh position={[0.04, 0.19, 0.02]} rotation={[0.1, 0.5, 0.15]} material={mats.gold} castShadow>
          <boxGeometry args={[0.11, 0.01, 0.09]} />
        </mesh>
      </group>
    </group>
  );
}

function CakePopsMesh({ mats }: { mats: ReturnType<typeof usePatisserieMaterials> }) {
  const pops = [
    { pos: [0, 0.96, 0] as [number, number, number], r: 0.24, mat: mats.glossGlaze, ring: mats.gold, tilt: [0, 0, 0] as [number, number, number] },
    { pos: [-0.32, 0.78, 0.08] as [number, number, number], r: 0.2, mat: mats.creamRose, ring: mats.creamIvory, tilt: [0.06, 0, 0.22] as [number, number, number] },
    { pos: [0.32, 0.74, -0.06] as [number, number, number], r: 0.2, mat: mats.milkChoc, ring: mats.darkChoc, tilt: [-0.05, 0, -0.24] as [number, number, number] },
  ];

  return (
    <group position={[0, -0.52, 0]}>
      <mesh material={mats.ceramic} position={[0, 0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.52, 0.54, 0.08, 40]} />
      </mesh>
      {pops.map((p, idx) => (
        <group key={idx}>
          <mesh
            position={[p.pos[0] * 0.55, p.pos[1] * 0.5, p.pos[2] * 0.55]}
            rotation={p.tilt}
            material={mats.stickIvory}
            castShadow
          >
            <cylinderGeometry args={[0.018, 0.018, p.pos[1], 14]} />
          </mesh>
          <group position={p.pos}>
            <mesh material={p.mat} castShadow>
              <sphereGeometry args={[p.r, 32, 24]} />
            </mesh>
            <mesh rotation={[0.45, idx, 0.2]} material={p.ring}>
              <torusGeometry args={[p.r * 0.92, 0.014, 10, 32]} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

function CakeTrufflesMesh({ mats }: { mats: ReturnType<typeof usePatisserieMaterials> }) {
  const truffles = [
    { pos: [0, 0.22, -0.2] as [number, number, number], r: 0.2, mat: mats.cocoaDust, style: 'cocoa' },
    { pos: [-0.26, 0.2, 0.16] as [number, number, number], r: 0.185, mat: mats.milkChoc, style: 'nut' },
    { pos: [0.26, 0.2, 0.16] as [number, number, number], r: 0.185, mat: mats.creamRose, style: 'gold' },
  ];

  return (
    <group position={[0, -0.26, 0]}>
      <mesh material={mats.ceramic} position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.68, 0.64, 0.05, 48]} />
      </mesh>
      {truffles.map((t, idx) => (
        <group key={idx} position={t.pos}>
          {/* Pleated bonbon cup */}
          <mesh position={[0, -0.07, 0]} material={mats.liner} castShadow>
            <cylinderGeometry args={[t.r * 1.05, t.r * 0.82, 0.14, 24]} />
          </mesh>
          <mesh material={t.mat} castShadow>
            <sphereGeometry args={[t.r, 28, 20]} />
          </mesh>
          {t.style === 'gold' && (
            <mesh position={[0, t.r, 0]} rotation={[0.2, 0.6, 0.1]} material={mats.gold}>
              <boxGeometry args={[0.09, 0.012, 0.08]} />
            </mesh>
          )}
          {t.style === 'nut' && (
            <mesh position={[0, t.r * 0.92, 0.04]} material={mats.hazelnut} castShadow>
              <sphereGeometry args={[0.045, 12, 10]} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

function SwissRollMesh({ mats }: { mats: ReturnType<typeof usePatisserieMaterials> }) {
  const spiralPoints = useMemo(() => {
    const pts: { x: number; y: number; r: number }[] = [];
    for (let i = 0; i < 42; i++) {
      const t = i / 41;
      const ang = t * Math.PI * 4.4;
      const rad = 0.04 + t * 0.28;
      pts.push({ x: Math.cos(ang) * rad, y: Math.sin(ang) * rad, r: 0.045 });
    }
    return pts;
  }, []);

  return (
    <group position={[0, -0.18, 0]}>
      {/* Main Roll Log */}
      <group position={[0, 0.34, -0.15]} rotation={[Math.PI / 2, 0, 0.22]}>
        <mesh material={mats.spongeVanilla} castShadow receiveShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.78, 36]} />
        </mesh>
        {[-0.22, -0.08, 0.08, 0.22].map((yPos, idx) => (
          <mesh key={idx} position={[0, yPos, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.glossGlaze}>
            <torusGeometry args={[0.382, 0.014, 10, 36]} />
          </mesh>
        ))}
        {/* Spiral end cap */}
        {spiralPoints.map((pt, i) => (
          <mesh key={i} position={[pt.x, 0.392, pt.y]} material={mats.creamIvory}>
            <sphereGeometry args={[0.032, 8, 8]} />
          </mesh>
        ))}
      </group>

      {/* Cut Hero Slice forward */}
      <group position={[0.1, 0.26, 0.42]} rotation={[Math.PI / 2, 0, -0.25]}>
        <mesh material={mats.spongeVanilla} castShadow>
          <cylinderGeometry args={[0.36, 0.36, 0.16, 36]} />
        </mesh>
        {spiralPoints.map((pt, i) => (
          <mesh key={i} position={[pt.x, 0.082, pt.y]} material={mats.creamIvory}>
            <sphereGeometry args={[0.032, 8, 8]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function PastryMesh({ mats }: { mats: ReturnType<typeof usePatisserieMaterials> }) {
  const sheetGeo = useMemo(() => makeRoundedBlockGeometry(1.05, 0.06, 0.5, 0.018), []);
  const glazeGeo = useMemo(() => makeRoundedBlockGeometry(1.02, 0.025, 0.46, 0.012), []);

  return (
    <group position={[0, -0.34, 0]}>
      {[0.08, 0.3, 0.52].map((y, idx) => (
        <mesh key={idx} geometry={sheetGeo} material={mats.crustGolden} position={[0, y, 0]} castShadow receiveShadow />
      ))}

      {/* Diplomat cream pearls between tiers */}
      {[0.19, 0.41].map((y, lvl) =>
        [-0.36, -0.18, 0, 0.18, 0.36].map((x, ix) =>
          [-0.13, 0.13].map((z, iz) => (
            <mesh
              key={`${lvl}-${ix}-${iz}`}
              position={[x, y, z]}
              scale={[1, 0.82, 1]}
              material={lvl === 0 ? mats.creamIvory : mats.creamRose}
              castShadow
            >
              <sphereGeometry args={[0.075, 16, 12]} />
            </mesh>
          )),
        ),
      )}

      {/* Mirror glaze top + Chantilly cones + gold leaf */}
      <mesh geometry={glazeGeo} material={mats.glossGlaze} position={[0, 0.57, 0]} castShadow />
      {[-0.24, 0, 0.24].map((x, i) => (
        <mesh key={i} position={[x, 0.67, 0]} material={mats.creamIvory} castShadow>
          <coneGeometry args={[0.09, 0.16, 20]} />
        </mesh>
      ))}
      <mesh position={[0, 0.76, 0]} rotation={[0.15, 0.6, 0.2]} material={mats.gold} castShadow>
        <boxGeometry args={[0.11, 0.012, 0.09]} />
      </mesh>
    </group>
  );
}

function MousseMesh({ mats }: { mats: ReturnType<typeof usePatisserieMaterials> }) {
  const glassGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.28, 0),
      new THREE.Vector2(0.29, 0.08),
      new THREE.Vector2(0.39, 0.85),
      new THREE.Vector2(0.41, 0.92),
    ];
    return new THREE.LatheGeometry(pts, 44);
  }, []);

  return (
    <group position={[0, -0.48, 0]}>
      <mesh geometry={glassGeo} material={mats.glass} castShadow receiveShadow />
      {/* Inner mousse layers */}
      <mesh position={[0, 0.22, 0]} material={mats.darkChoc}>
        <cylinderGeometry args={[0.31, 0.26, 0.28, 36]} />
      </mesh>
      <mesh position={[0, 0.47, 0]} material={mats.milkChoc}>
        <cylinderGeometry args={[0.34, 0.31, 0.22, 36]} />
      </mesh>
      <mesh position={[0, 0.67, 0]} material={mats.creamRose}>
        <cylinderGeometry args={[0.36, 0.34, 0.18, 36]} />
      </mesh>
      {/* Chantilly crown & chocolate curl */}
      <mesh position={[0, 0.8, 0]} scale={[1, 0.68, 1]} material={mats.creamIvory} castShadow>
        <sphereGeometry args={[0.2, 24, 16]} />
      </mesh>
      <mesh position={[0.02, 0.94, 0]} rotation={[0.85, 0.4, 0]} material={mats.glossGlaze} castShadow>
        <torusGeometry args={[0.1, 0.022, 10, 28]} />
      </mesh>
    </group>
  );
}

function CakeRuskMesh({ mats }: { mats: ReturnType<typeof usePatisserieMaterials> }) {
  const ruskGeo = useMemo(() => makeRoundedBlockGeometry(0.92, 0.16, 0.36, 0.032), []);

  return (
    <group position={[0, -0.25, 0]}>
      <mesh geometry={ruskGeo} material={mats.crustGolden} position={[0, 0.1, 0.08]} rotation={[0, -0.14, 0]} castShadow receiveShadow />
      <mesh geometry={ruskGeo} material={mats.spongeVanilla} position={[0.04, 0.28, -0.02]} rotation={[0.06, 0.18, -0.05]} castShadow receiveShadow />
      <mesh geometry={ruskGeo} material={mats.crustGolden} position={[-0.08, 0.42, -0.14]} rotation={[0.45, -0.35, 0.12]} castShadow receiveShadow />
    </group>
  );
}

function EclairMesh({ mats }: { mats: ReturnType<typeof usePatisserieMaterials> }) {
  const filigreeGeo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 32; i++) {
      const t = i / 32;
      const x = -0.48 + t * 0.96;
      const z = Math.sin(t * Math.PI * 7) * 0.11;
      const y = 0.35 + Math.sqrt(Math.max(0.05, 1 - (x / 0.65) ** 2)) * 0.13;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.011, 8, false);
  }, []);

  return (
    <group position={[0, -0.2, 0]}>
      {/* Choux body */}
      <mesh position={[0, 0.22, 0]} scale={[2.75, 0.88, 1]} material={mats.crustGolden} castShadow receiveShadow>
        <sphereGeometry args={[0.24, 36, 24]} />
      </mesh>
      {/* Cream seam */}
      <mesh position={[0, 0.21, 0]} scale={[3.4, 0.34, 0.94]} material={mats.creamIvory}>
        <sphereGeometry args={[0.18, 24, 16]} />
      </mesh>
      {/* Mirror chocolate top cap */}
      <mesh position={[0, 0.26, 0]} scale={[2.72, 0.84, 1.02]} material={mats.glossGlaze} castShadow>
        <sphereGeometry args={[0.24, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
      </mesh>
      {/* Gold chocolate filigree */}
      <mesh geometry={filigreeGeo} material={mats.gold} castShadow />
    </group>
  );
}

function TiramisuMesh({ mats }: { mats: ReturnType<typeof usePatisserieMaterials> }) {
  const saucerGeo = useMemo(() => makeRoundedBlockGeometry(1.12, 0.045, 0.9, 0.02), []);
  const tierGeo = useMemo(() => makeRoundedBlockGeometry(0.92, 0.11, 0.72, 0.015), []);

  return (
    <group position={[0, -0.34, 0]}>
      <mesh geometry={saucerGeo} material={mats.ceramic} position={[0, 0.03, 0]} castShadow receiveShadow />
      <mesh geometry={tierGeo} material={mats.espressoSoak} position={[0, 0.11, 0]} castShadow />
      <mesh geometry={tierGeo} material={mats.mascarpone} position={[0, 0.23, 0]} castShadow />
      <mesh geometry={tierGeo} material={mats.espressoSoak} position={[0, 0.35, 0]} castShadow />
      <mesh geometry={tierGeo} material={mats.mascarpone} position={[0, 0.47, 0]} castShadow />

      {/* Piped mascarpone clouds + cocoa dust */}
      {[-0.3, -0.1, 0.1, 0.3].map((x, ix) =>
        [-0.2, 0, 0.2].map((z, iz) => (
          <group key={`${ix}-${iz}`} position={[x, 0.56, z]}>
            <mesh scale={[1, 0.8, 1]} material={mats.mascarpone} castShadow>
              <sphereGeometry args={[0.1, 18, 14]} />
            </mesh>
            <mesh position={[0, 0.02, 0]} scale={[0.92, 0.72, 0.92]} material={mats.cocoaDust}>
              <sphereGeometry args={[0.101, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            </mesh>
          </group>
        )),
      )}

      <mesh position={[0.04, 0.67, 0.02]} rotation={[0.15, 0.4, 0.2]} material={mats.gold} castShadow>
        <boxGeometry args={[0.11, 0.012, 0.09]} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Public Single-Dessert 3D Fallback (used automatically when .glb 404s)
// ---------------------------------------------------------------------------

export function ProceduralDessert3D({
  slug,
  autoRotate,
  rotateSpeed,
  enableParallax,
  scaleMultiplier,
  scrollProgressRef,
  scrollSpinTurns,
  onReady,
}: {
  slug: string;
  autoRotate: boolean;
  rotateSpeed: number;
  enableParallax: boolean;
  scaleMultiplier: number;
  scrollProgressRef?: MutableRefObject<number>;
  scrollSpinTurns: number;
  onReady: () => void;
}) {
  const mats = usePatisserieMaterials();
  const groupRef = useRef<THREE.Group>(null);
  const idleAngleRef = useRef(0);
  const prefersReduced = useReducedMotion();
  const { pointer } = useThree();

  useEffect(() => {
    onReady();
  }, [onReady, slug]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group || prefersReduced) return;

    if (autoRotate) {
      idleAngleRef.current += delta * rotateSpeed;
    }

    const scrollAngle = scrollProgressRef
      ? scrollProgressRef.current * Math.PI * 2 * scrollSpinTurns
      : 0;
    const targetRotY = idleAngleRef.current + scrollAngle;
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotY, 0.12);

    if (scrollProgressRef) {
      const floatY = Math.sin(scrollProgressRef.current * Math.PI * 2) * 0.05;
      group.position.y = THREE.MathUtils.lerp(group.position.y, floatY, 0.1);
    }

    if (enableParallax) {
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, pointer.y * 0.1, 0.05);
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, -pointer.x * 0.06, 0.05);
    }
  });

  const renderBySlug = () => {
    switch (slug) {
      case 'cupcake':
        return <CupcakeMesh mats={mats} />;
      case 'brownie':
        return <BrownieMesh mats={mats} />;
      case 'cake-pops':
        return <CakePopsMesh mats={mats} />;
      case 'cake-truffles':
        return <CakeTrufflesMesh mats={mats} />;
      case 'swiss-roll':
        return <SwissRollMesh mats={mats} />;
      case 'pastry':
        return <PastryMesh mats={mats} />;
      case 'mousse':
        return <MousseMesh mats={mats} />;
      case 'cake-rusk':
        return <CakeRuskMesh mats={mats} />;
      case 'eclair':
        return <EclairMesh mats={mats} />;
      case 'recipe-cake':
        return (
          <ProceduralRecipeCake3D
            fixedProgress={1}
            disableSelfRotation
            onReady={onReady}
          />
        );
      case 'tiramisu':
      default:
        return <TiramisuMesh mats={mats} />;
    }
  };

  return (
    <group
      ref={groupRef}
      scale={scaleMultiplier * (slug === 'recipe-cake' ? 0.94 : 1.15)}
    >
      {renderBySlug()}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Public Scroll-Driven 5-Stage Recipe Cake 3D Fallback
// ---------------------------------------------------------------------------

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function smoothWindow(p: number, start: number, end: number) {
  const t = clamp01((p - start) / Math.max(0.0001, end - start));
  return t * t * (3 - 2 * t);
}

export function ProceduralRecipeCake3D({
  scrollProgressRef,
  fixedProgress,
  disableSelfRotation = false,
  onReady,
}: {
  scrollProgressRef?: MutableRefObject<number>;
  fixedProgress?: number;
  disableSelfRotation?: boolean;
  onReady: () => void;
}) {
  const mats = usePatisserieMaterials();
  const rootRef = useRef<THREE.Group>(null);
  const stage1Ref = useRef<THREE.Group>(null);
  const stage2Ref = useRef<THREE.Group>(null);
  const whiskRef = useRef<THREE.Group>(null);
  const sponge1Ref = useRef<THREE.Group>(null);
  const sponge2Ref = useRef<THREE.Group>(null);
  const sponge3Ref = useRef<THREE.Group>(null);
  const creamRef = useRef<THREE.Group>(null);
  const glazeRef = useRef<THREE.Group>(null);
  const garnishRef = useRef<THREE.Group>(null);
  const idleSpinRef = useRef(0);
  const prefersReduced = useReducedMotion();

  const bowlGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.24, 0),
      new THREE.Vector2(0.38, 0.14),
      new THREE.Vector2(0.45, 0.34),
    ];
    return new THREE.LatheGeometry(pts, 40);
  }, []);

  const dripAngles = useMemo(
    () => Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2),
    [],
  );
  const rosetteAngles = useMemo(
    () => Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2),
    [],
  );

  useEffect(() => {
    onReady();
  }, [onReady]);

  useFrame((_, delta) => {
    const raw =
      fixedProgress !== undefined
        ? fixedProgress
        : scrollProgressRef?.current ?? 0;
    const p = clamp01(raw);

    if (!disableSelfRotation && rootRef.current && !prefersReduced) {
      idleSpinRef.current += delta * 0.16;
      const targetRot = idleSpinRef.current + p * Math.PI * 2.2;
      rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, targetRot, 0.1);
    }

    // Stage 1: Raw ingredients (0 -> 0.24)
    if (stage1Ref.current) {
      const enter = smoothWindow(p, 0, 0.08);
      const exit = 1 - smoothWindow(p, 0.19, 0.25);
      const s = Math.max(0.0001, enter * exit);
      stage1Ref.current.visible = s > 0.015;
      stage1Ref.current.scale.setScalar(s);
      stage1Ref.current.position.y = (1 - enter) * 0.25;
    }

    // Stage 2: Copper bowl & whisk (0.19 -> 0.46)
    if (stage2Ref.current) {
      const enter = smoothWindow(p, 0.19, 0.27);
      const exit = 1 - smoothWindow(p, 0.41, 0.47);
      const s = Math.max(0.0001, enter * exit);
      stage2Ref.current.visible = s > 0.015;
      stage2Ref.current.scale.setScalar(s);
      stage2Ref.current.position.y = (1 - enter) * 0.32;

      if (whiskRef.current && !prefersReduced) {
        const spin = p * Math.PI * 10;
        whiskRef.current.position.x = Math.cos(spin) * 0.04;
        whiskRef.current.position.z = Math.sin(spin) * 0.04;
      }
    }

    // Stage 3: Sponge tiers dropping sequentially (0.42 -> 1.0)
    const setTier = (ref: THREE.Group | null, start: number, restY: number) => {
      if (!ref) return;
      const a = smoothWindow(p, start, start + 0.08);
      const s = Math.max(0.0001, a);
      ref.visible = a > 0.015;
      ref.scale.setScalar(s);
      ref.position.y = restY + (1 - a) * 0.55;
    };
    setTier(sponge1Ref.current, 0.42, 0.25);
    setTier(sponge2Ref.current, 0.49, 0.46);
    setTier(sponge3Ref.current, 0.56, 0.67);

    // Stage 4: Cream & mirror drip + rosettes (0.64 -> 1.0)
    if (creamRef.current) {
      const a = smoothWindow(p, 0.63, 0.72);
      creamRef.current.visible = a > 0.015;
      creamRef.current.scale.setScalar(Math.max(0.0001, a));
    }
    if (glazeRef.current) {
      const a = smoothWindow(p, 0.71, 0.82);
      glazeRef.current.visible = a > 0.015;
      glazeRef.current.scale.setScalar(Math.max(0.0001, a));
      glazeRef.current.position.y = 0.77 + (1 - a) * 0.42;
    }

    // Stage 5: Curls, pearls & gold leaf (0.83 -> 1.0)
    if (garnishRef.current) {
      const a = smoothWindow(p, 0.83, 0.94);
      garnishRef.current.visible = a > 0.015;
      garnishRef.current.scale.setScalar(Math.max(0.0001, a));
      garnishRef.current.position.y = 0.94 + (1 - a) * 0.55;
    }
  });

  return (
    <group ref={rootRef} position={[0, -0.58, 0]} scale={1.18}>
      {/* Stage 00: Marble & Gold Cake Stand */}
      <mesh material={mats.gold} position={[0, 0.055, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.26, 0.11, 36]} />
      </mesh>
      <mesh material={mats.ceramic} position={[0, 0.135, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.05, 48]} />
      </mesh>

      {/* Stage 01: Raw Ingredients */}
      <group ref={stage1Ref} position={[0, 0, 0]}>
        <mesh position={[0, 0.22, 0.04]} scale={[1.3, 0.58, 1.3]} material={mats.mascarpone} castShadow>
          <sphereGeometry args={[0.18, 22, 14]} />
        </mesh>
        <mesh position={[-0.29, 0.22, -0.15]} rotation={[0, 0.4, 0]} material={mats.spongeVanilla} castShadow>
          <boxGeometry args={[0.24, 0.12, 0.16]} />
        </mesh>
        <mesh position={[0.28, 0.22, -0.12]} rotation={[0, -0.45, 0]} scale={[1.55, 0.82, 0.9]} material={mats.darkChoc} castShadow>
          <sphereGeometry args={[0.1, 18, 12]} />
        </mesh>
        <mesh position={[-0.22, 0.2, 0.25]} material={mats.hazelnut} castShadow>
          <sphereGeometry args={[0.055, 12, 10]} />
        </mesh>
        <mesh position={[0.15, 0.2, 0.24]} material={mats.hazelnut} castShadow>
          <sphereGeometry args={[0.05, 12, 10]} />
        </mesh>
      </group>

      {/* Stage 02: Copper Bowl, Chocolate Batter & Whisk */}
      <group ref={stage2Ref} position={[0, 0.16, 0]}>
        <mesh geometry={bowlGeo} material={mats.copper} castShadow receiveShadow />
        <mesh position={[0, 0.19, 0]} material={mats.glossGlaze}>
          <cylinderGeometry args={[0.38, 0.3, 0.1, 36]} />
        </mesh>
        <group ref={whiskRef} position={[0.06, 0.24, 0]}>
          <mesh position={[0.12, 0.28, -0.04]} rotation={[0.35, 0, -0.42]} material={mats.ceramic} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.36, 14]} />
          </mesh>
          {[0, 1, 2].map((w) => (
            <mesh key={w} position={[0, 0.08, 0]} rotation={[0.35, w * 1.05, -0.42]} material={mats.gold}>
              <torusGeometry args={[0.1, 0.009, 8, 24]} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Stage 03: Three Cocoa Sponge Tiers */}
      <group ref={sponge1Ref} position={[0, 0.25, 0]}>
        <mesh material={mats.spongeDark} castShadow receiveShadow>
          <cylinderGeometry args={[0.48, 0.48, 0.16, 44]} />
        </mesh>
      </group>
      <group ref={sponge2Ref} position={[0, 0.46, 0]}>
        <mesh material={mats.spongeDark} castShadow receiveShadow>
          <cylinderGeometry args={[0.48, 0.48, 0.16, 44]} />
        </mesh>
      </group>
      <group ref={sponge3Ref} position={[0, 0.67, 0]}>
        <mesh material={mats.spongeDark} castShadow receiveShadow>
          <cylinderGeometry args={[0.48, 0.48, 0.16, 44]} />
        </mesh>
      </group>

      {/* Stage 04: Rose Cream Fillings, Mirror Glaze Drip & Rosettes */}
      <group ref={creamRef}>
        <mesh position={[0, 0.355, 0]} material={mats.creamRose}>
          <cylinderGeometry args={[0.495, 0.495, 0.05, 44]} />
        </mesh>
        <mesh position={[0, 0.565, 0]} material={mats.creamRose}>
          <cylinderGeometry args={[0.495, 0.495, 0.05, 44]} />
        </mesh>
      </group>

      <group ref={glazeRef} position={[0, 0.77, 0]}>
        <mesh material={mats.glossGlaze} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.06, 44]} />
        </mesh>
        {dripAngles.map((ang, i) => {
          const dropLen = 0.14 + Math.sin(i * 2.2) * 0.07;
          return (
            <mesh
              key={i}
              position={[Math.cos(ang) * 0.49, -dropLen * 0.45, Math.sin(ang) * 0.49]}
              scale={[0.75, dropLen / 0.08, 0.75]}
              material={mats.glossGlaze}
              castShadow
            >
              <sphereGeometry args={[0.042, 12, 10]} />
            </mesh>
          );
        })}
        {rosetteAngles.map((ang, i) => (
          <mesh
            key={i}
            position={[Math.cos(ang) * 0.33, 0.09, Math.sin(ang) * 0.33]}
            material={mats.creamIvory}
            castShadow
          >
            <coneGeometry args={[0.085, 0.12, 18]} />
          </mesh>
        ))}
      </group>

      {/* Stage 05: Curls, Pearls & 24k Gold Leaf Crown */}
      <group ref={garnishRef} position={[0, 0.94, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[Math.cos(i * 2.1) * 0.06, -0.05, Math.sin(i * 2.1) * 0.06]}
            rotation={[1.0, i * 2.1, 0.2]}
            material={mats.darkChoc}
            castShadow
          >
            <torusGeometry args={[0.08, 0.016, 10, 22]} />
          </mesh>
        ))}
        {rosetteAngles.map((ang, i) => (
          <mesh
            key={i}
            position={[Math.cos(ang + 0.38) * 0.35, -0.09, Math.sin(ang + 0.38) * 0.35]}
            material={mats.gold}
          >
            <sphereGeometry args={[0.022, 10, 8]} />
          </mesh>
        ))}
        <mesh position={[0, 0.04, 0]} rotation={[0.15, 0.5, 0.2]} material={mats.gold} castShadow>
          <boxGeometry args={[0.12, 0.012, 0.1]} />
        </mesh>
      </group>
    </group>
  );
}
