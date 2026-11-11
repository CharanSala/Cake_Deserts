import {
  Component,
  ErrorInfo,
  MutableRefObject,
  ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  useGLTF,
} from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useWebGLSupport } from '../hooks/useWebGLSupport';
import { useInViewLazy } from '../hooks/useInViewLazy';
import { ProceduralRecipeCake3D } from './ProceduralDessert3D';

const RECIPE_GLB_PATH = '/models/recipe-cake.glb';
let recipeGlbFailed = false;

class RecipeErrorBoundary extends Component<
  { fallback: ReactNode; onError: () => void; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

class InternalSceneBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

interface TrackedPart {
  obj: THREE.Object3D;
  name: string;
  stage: number;
  restPos: THREE.Vector3;
  restScale: THREE.Vector3;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function smoothWindow(p: number, start: number, end: number): number {
  const t = clamp01((p - start) / Math.max(0.0001, end - start));
  return t * t * (3 - 2 * t);
}

function RecipeCakeAssembly({
  scrollProgressRef,
  fixedProgress,
  dragYawRef,
  onReady,
}: {
  scrollProgressRef?: MutableRefObject<number>;
  fixedProgress?: number;
  dragYawRef?: MutableRefObject<number>;
  onReady: () => void;
}) {
  const gltf = useGLTF(RECIPE_GLB_PATH, true);
  const rootRef = useRef<THREE.Group>(null);
  const idleSpinRef = useRef(0);
  const prefersReduced = useReducedMotion();

  const { normalizedRoot, trackedParts } = useMemo(() => {
    const clone = gltf.scene.clone(true);
    const parts: TrackedPart[] = [];

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }

      const name = child.name || '';
      let stage = -1;
      if (name.startsWith('Stage_00_')) stage = 0;
      else if (name.startsWith('Stage_01_')) stage = 1;
      else if (name.startsWith('Stage_02_')) stage = 2;
      else if (name.startsWith('Stage_03_')) stage = 3;
      else if (name.startsWith('Stage_04_')) stage = 4;
      else if (name.startsWith('Stage_05_')) stage = 5;

      if (stage >= 0) {
        parts.push({
          obj: child,
          name,
          stage,
          restPos: child.position.clone(),
          restScale: child.scale.clone(),
        });
      }
    });

    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxAxis = Math.max(size.x, size.y, size.z, 0.001);
    const normScale = 1.85 / maxAxis;

    clone.scale.setScalar(normScale);
    clone.position.set(
      -center.x * normScale,
      -box.min.y * normScale - 0.68,
      -center.z * normScale,
    );

    return { normalizedRoot: clone, trackedParts: parts };
  }, [gltf.scene]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  useFrame((_, delta) => {
    const group = rootRef.current;
    if (!group) return;

    const rawProgress =
      fixedProgress !== undefined
        ? fixedProgress
        : scrollProgressRef?.current ?? 0;
    const p = clamp01(rawProgress);

    if (!prefersReduced) {
      idleSpinRef.current += delta * 0.14;
      const targetRotY =
        idleSpinRef.current + p * Math.PI * 2.2 + (dragYawRef?.current ?? 0);
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotY, 0.1);
    }

    for (const part of trackedParts) {
      let amount = 1;
      let dropY = 0;

      if (part.stage === 0) {
        amount = 1;
      } else if (part.stage === 1) {
        const enter = smoothWindow(p, 0.0, 0.08);
        const exit = 1 - smoothWindow(p, 0.19, 0.25);
        amount = enter * exit;
        dropY = (1 - enter) * 0.28 + (1 - exit) * 0.22;
      } else if (part.stage === 2) {
        const enter = smoothWindow(p, 0.19, 0.27);
        const exit = 1 - smoothWindow(p, 0.41, 0.47);
        amount = enter * exit;
        dropY = (1 - enter) * 0.35 + (1 - exit) * 0.25;

        if (part.name.includes('Whisk') && !prefersReduced) {
          const whiskSpin = p * Math.PI * 10;
          part.obj.position.x = part.restPos.x + Math.cos(whiskSpin) * 0.035;
          part.obj.position.z = part.restPos.z + Math.sin(whiskSpin) * 0.035;
        }
      } else if (part.stage === 3) {
        let start = 0.42;
        if (part.name.includes('Middle')) start = 0.49;
        else if (part.name.includes('Top')) start = 0.56;
        amount = smoothWindow(p, start, start + 0.08);
        dropY = (1 - amount) * 0.55;
      } else if (part.stage === 4) {
        let start = 0.63;
        if (part.name.includes('Ganache')) start = 0.70;
        else if (part.name.includes('Rosette')) start = 0.76;
        amount = smoothWindow(p, start, start + 0.08);
        dropY = (1 - amount) * 0.48;
      } else if (part.stage === 5) {
        amount = smoothWindow(p, 0.83, 0.94);
        dropY = (1 - amount) * 0.6;
      }

      const safeScale = Math.max(0.0001, amount);
      part.obj.visible = amount > 0.015;
      part.obj.scale.set(
        part.restScale.x * safeScale,
        part.restScale.y * safeScale,
        part.restScale.z * safeScale,
      );
      part.obj.position.y = part.restPos.y + dropY;
    }
  });

  return (
    <group ref={rootRef}>
      <primitive object={normalizedRoot} />
    </group>
  );
}

export interface RecipeCakeCanvasProps {
  scrollProgressRef?: MutableRefObject<number>;
  fixedProgress?: number;
  interactive?: boolean;
  enableZoom?: boolean;
  activeStepIdx: number;
  stepTitle: string;
}

export function RecipeCakeCanvas({
  scrollProgressRef,
  fixedProgress,
  interactive = false,
  enableZoom = false,
  activeStepIdx,
  stepTitle,
}: RecipeCakeCanvasProps) {
  const webglSupported = useWebGLSupport();
  const { ref, isVisible } = useInViewLazy('160px 0px', false);
  const [loaded, setLoaded] = useState(false);
  const [useProceduralFallback, setUseProceduralFallback] = useState(() => recipeGlbFailed);
  const [webglCrashed, setWebglCrashed] = useState(false);
  const dragYawRef = useRef(0);
  const swipeStartRef = useRef<{ x: number; y: number; locked?: 'x' | 'y' } | null>(null);

  const handleReady = useCallback(() => setLoaded(true), []);
  const handleGlbError = useCallback(() => {
    recipeGlbFailed = true;
    setUseProceduralFallback(true);
  }, []);
  const handleWebGLError = useCallback(() => setWebglCrashed(true), []);

  const stepImageIdx = Math.min(5, Math.max(1, activeStepIdx + 1));
  const fallbackSrc = `/images/recipe-step-${stepImageIdx}.svg`;

  const StaticRecipeFallback = (
    <div className="relative flex h-full w-full flex-col items-center justify-center p-4">
      <img
        src={fallbackSrc}
        alt={`Cake recipe stage ${stepImageIdx}: ${stepTitle}`}
        className="h-full max-h-[88%] w-auto object-contain transition-all duration-500"
      />
    </div>
  );

  const shouldRender3D = webglSupported && isVisible && !webglCrashed;

  return (
    <div
      ref={ref}
      onPointerDown={(e) => {
        if (!interactive) swipeStartRef.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (interactive || !swipeStartRef.current) return;
        const dx = e.clientX - swipeStartRef.current.x;
        const dy = e.clientY - swipeStartRef.current.y;
        if (!swipeStartRef.current.locked) {
          if (Math.hypot(dx, dy) < 5) return;
          swipeStartRef.current.locked = Math.abs(dx) > Math.abs(dy) * 1.15 ? 'x' : 'y';
        }
        if (swipeStartRef.current.locked === 'y') {
          swipeStartRef.current = null;
          return;
        }
        dragYawRef.current += dx * 0.011;
        swipeStartRef.current.x = e.clientX;
        swipeStartRef.current.y = e.clientY;
      }}
      onPointerUp={() => {
        swipeStartRef.current = null;
      }}
      onPointerCancel={() => {
        swipeStartRef.current = null;
      }}
      onPointerLeave={() => {
        swipeStartRef.current = null;
      }}
      style={{ touchAction: interactive ? 'none' : 'pan-y' }}
      className="relative h-full w-full select-none overflow-hidden"
      aria-label={`Interactive 3D cake recipe stage: ${stepTitle}`}
    >
      {shouldRender3D && !loaded && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border border-gold/30 border-t-gold" />
          <span className="text-[10px] uppercase tracking-editorial text-gold">
            Loading 3D Kitchen
          </span>
        </div>
      )}

      {!webglSupported || webglCrashed ? (
        StaticRecipeFallback
      ) : isVisible ? (
        <RecipeErrorBoundary fallback={StaticRecipeFallback} onError={handleWebGLError}>
          <Canvas
            shadows="soft"
            dpr={[1, 1.75]}
            style={
              interactive
                ? { touchAction: 'none' }
                : { pointerEvents: 'none', touchAction: 'pan-y' }
            }
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.15,
            }}
            camera={{ position: [2.25, 1.55, 2.45], fov: 35, near: 0.1, far: 40 }}
          >
            <ambientLight intensity={0.4} color="#FFF0DA" />
            <hemisphereLight args={['#FFEAD0', '#1C100C', 0.55]} />
            <directionalLight
              position={[3.6, 5.4, 3.8]}
              intensity={2.65}
              color="#FFF1DC"
              castShadow
              shadow-mapSize={[1024, 1024]}
              shadow-bias={-0.0004}
            />
            <directionalLight position={[-3.6, 2.2, -2.5]} intensity={1.1} color="#C6A46C" />
            <spotLight position={[0.5, 3.8, -3.5]} angle={0.55} penumbra={0.9} intensity={3.0} color="#DFAE9B" />

            <Environment resolution={256}>
              <group rotation={[-Math.PI / 4, 0, 0]}>
                <Lightformer form="rect" intensity={2.4} color="#FFF7EA" scale={[8, 4, 1]} position={[0, 4, 3]} />
                <Lightformer form="circle" intensity={1.8} color="#F5D9B5" scale={[3, 3, 1]} position={[4, 1, -2]} />
                <Lightformer form="rect" intensity={1.1} color="#DFAE9B" scale={[6, 2, 1]} position={[-4, 2, 1]} />
              </group>
            </Environment>

            {useProceduralFallback ? (
              <ProceduralRecipeCake3D
                scrollProgressRef={scrollProgressRef}
                fixedProgress={fixedProgress}
                dragYawRef={dragYawRef}
                onReady={handleReady}
              />
            ) : (
              <InternalSceneBoundary onError={handleGlbError}>
                <Suspense fallback={null}>
                  <RecipeCakeAssembly
                    scrollProgressRef={scrollProgressRef}
                    fixedProgress={fixedProgress}
                    dragYawRef={dragYawRef}
                    onReady={handleReady}
                  />
                </Suspense>
              </InternalSceneBoundary>
            )}

            <ContactShadows
              position={[0, -0.69, 0]}
              opacity={0.6}
              scale={4.6}
              blur={2.1}
              far={2.4}
              color="#080403"
            />

            {interactive && (
              <OrbitControls
                makeDefault
                enablePan={false}
                enableZoom={enableZoom}
                enableDamping
                dampingFactor={0.07}
                minDistance={1.9}
                maxDistance={4.8}
                minPolarAngle={Math.PI * 0.18}
                maxPolarAngle={Math.PI * 0.52}
                target={[0, -0.05, 0]}
              />
            )}
          </Canvas>
        </RecipeErrorBoundary>
      ) : null}
    </div>
  );
}
