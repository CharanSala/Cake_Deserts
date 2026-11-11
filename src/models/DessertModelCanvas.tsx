import React, {
  Component,
  ComponentRef,
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
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  useGLTF,
} from '@react-three/drei';
import * as THREE from 'three';
import { DessertItem } from '../data/desserts';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useWebGLSupport } from '../hooks/useWebGLSupport';
import { useInViewLazy } from '../hooks/useInViewLazy';
import { ProceduralDessert3D } from './ProceduralDessert3D';

const failedGlbPaths = new Set<string>();

interface ModelErrorBoundaryProps {
  fallback: ReactNode;
  onError?: () => void;
  resetKey: string;
  children: ReactNode;
}

interface ModelErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends Component<
  ModelErrorBoundaryProps,
  ModelErrorBoundaryState
> {
  state: ModelErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ModelErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: ModelErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

class InternalR3FErrorBoundary extends Component<
  { resetKey: string; onError: () => void; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

interface LoadedModelProps {
  modelPath: string;
  autoRotate: boolean;
  rotateSpeed: number;
  enableParallax: boolean;
  scaleMultiplier: number;
  scrollProgressRef?: MutableRefObject<number>;
  scrollSpinTurns: number;
  dragYawRef?: MutableRefObject<number>;
  onReady: () => void;
}

function LoadedDessertModel({
  modelPath,
  autoRotate,
  rotateSpeed,
  enableParallax,
  scaleMultiplier,
  scrollProgressRef,
  scrollSpinTurns,
  dragYawRef,
  onReady,
}: LoadedModelProps) {
  const gltf = useGLTF(modelPath, true);
  const groupRef = useRef<THREE.Group>(null);
  const idleAngleRef = useRef(0);
  const prefersReduced = useReducedMotion();
  const { pointer } = useThree();

  const normalizedScene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxAxis = Math.max(size.x, size.y, size.z, 0.001);
    const normScale = (1.65 / maxAxis) * scaleMultiplier;

    clone.scale.setScalar(normScale);
    clone.position.set(
      -center.x * normScale,
      -box.min.y * normScale - 0.62,
      -center.z * normScale,
    );

    return clone;
  }, [gltf.scene, scaleMultiplier]);

  useEffect(() => {
    onReady();
  }, [onReady, modelPath]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group || prefersReduced) return;

    if (autoRotate) {
      idleAngleRef.current += delta * rotateSpeed;
    }

    const scrollAngle = scrollProgressRef
      ? scrollProgressRef.current * Math.PI * 2 * scrollSpinTurns
      : 0;
    const targetRotY =
      idleAngleRef.current + scrollAngle + (dragYawRef?.current ?? 0);
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotY, 0.12);

    if (scrollProgressRef) {
      const floatY = Math.sin(scrollProgressRef.current * Math.PI * 2) * 0.05;
      group.position.y = THREE.MathUtils.lerp(group.position.y, floatY, 0.1);
    }

    if (enableParallax) {
      const targetRotX = pointer.y * 0.1;
      const targetRotZ = -pointer.x * 0.06;
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRotX, 0.05);
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, targetRotZ, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={normalizedScene} />
    </group>
  );
}

function CameraController({
  zoomDelta,
  resetSignal,
  defaultPosition,
  controlsRef,
}: {
  zoomDelta: number;
  resetSignal: number;
  defaultPosition: [number, number, number];
  controlsRef: React.RefObject<ComponentRef<typeof OrbitControls>>;
}) {
  const { camera } = useThree();
  const prevZoomDelta = useRef(zoomDelta);
  const prevReset = useRef(resetSignal);

  useEffect(() => {
    if (zoomDelta !== prevZoomDelta.current) {
      const diff = zoomDelta - prevZoomDelta.current;
      prevZoomDelta.current = zoomDelta;
      const dir = camera.position.clone().normalize();
      const nextDist = THREE.MathUtils.clamp(
        camera.position.length() - diff * 0.45,
        1.85,
        5.2,
      );
      camera.position.copy(dir.multiplyScalar(nextDist));
      controlsRef.current?.update();
    }
  }, [zoomDelta, camera, controlsRef]);

  useEffect(() => {
    if (resetSignal !== prevReset.current) {
      prevReset.current = resetSignal;
      camera.position.set(...defaultPosition);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, -0.05, 0);
        controlsRef.current.update();
      }
    }
  }, [resetSignal, camera, defaultPosition, controlsRef]);

  return null;
}

export interface DessertModelCanvasProps {
  dessert: DessertItem;
  className?: string;
  interactive?: boolean;
  enableZoom?: boolean;
  enableParallax?: boolean;
  autoRotate?: boolean;
  rotateSpeed?: number;
  scaleMultiplier?: number;
  lightingMood?: 'ivory' | 'espresso';
  eager?: boolean;
  keepMounted?: boolean;
  zoomDelta?: number;
  resetSignal?: number;
  scrollProgressRef?: MutableRefObject<number>;
  scrollSpinTurns?: number;
}

export function DessertModelCanvas({
  dessert,
  className = '',
  interactive = false,
  enableZoom = false,
  enableParallax = false,
  autoRotate = true,
  rotateSpeed = 0.28,
  scaleMultiplier = 1.0,
  lightingMood = 'ivory',
  eager = false,
  keepMounted = false,
  zoomDelta = 0,
  resetSignal = 0,
  scrollProgressRef,
  scrollSpinTurns = 1.25,
}: DessertModelCanvasProps) {
  const webglSupported = useWebGLSupport();
  const prefersReduced = useReducedMotion();
  const { ref, isVisible } = useInViewLazy('150px 0px', keepMounted || eager);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [useProceduralFallback, setUseProceduralFallback] = useState(() =>
    failedGlbPaths.has(dessert.modelPath),
  );
  const [webglCrashed, setWebglCrashed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const dragYawRef = useRef(0);
  const swipeStartRef = useRef<{ x: number; y: number; locked?: 'x' | 'y' } | null>(null);

  const handleModelReady = useCallback(() => {
    setModelLoaded(true);
  }, []);

  useEffect(() => {
    setModelLoaded(false);
    setUseProceduralFallback(failedGlbPaths.has(dessert.modelPath));
    setWebglCrashed(false);
    dragYawRef.current = 0;
  }, [dessert.modelPath]);

  const shouldMountCanvas = webglSupported && (eager || isVisible) && !webglCrashed;
  const isEspressoMood = lightingMood === 'espresso';

  const StaticFallback = (
    <div className="relative flex h-full w-full flex-col items-center justify-center p-4 sm:p-6">
      <img
        src={dessert.fallbackImage}
        alt={`${dessert.name} — ${dessert.frenchSubtitle}`}
        className="h-full max-h-[82%] w-auto object-contain drop-shadow-sm transition-transform duration-700"
        loading="lazy"
      />
    </div>
  );

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
      className={`relative h-full w-full select-none overflow-hidden ${className}`}
      aria-label={`Interactive 3D view of ${dessert.name}`}
    >
      {/* Loading indicator while .glb streams in */}
      {shouldMountCanvas && !modelLoaded && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5">
          <div className="h-8 w-8 animate-spin rounded-full border border-gold/30 border-t-gold" />
          <span
            className={`text-[10px] uppercase tracking-editorial ${
              isEspressoMood ? 'text-ivory/70' : 'text-chocolate/75'
            }`}
          >
            Preparing {dessert.frenchSubtitle}
          </span>
        </div>
      )}

      {!webglSupported || webglCrashed ? (
        StaticFallback
      ) : eager || isVisible ? (
        <ModelErrorBoundary
          resetKey={dessert.modelPath}
          fallback={StaticFallback}
          onError={() => setWebglCrashed(true)}
        >
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
              toneMappingExposure: isEspressoMood ? 1.15 : 1.05,
            }}
            camera={{
              position: dessert.cameraPosition,
              fov: 35,
              near: 0.1,
              far: 40,
            }}
          >
            {/* Warm patisserie studio lighting */}
            <ambientLight intensity={isEspressoMood ? 0.32 : 0.52} color="#FFF4E6" />
            <hemisphereLight
              args={[
                isEspressoMood ? '#FFE7C9' : '#FFFDF8',
                isEspressoMood ? '#231612' : '#E7D8C5',
                isEspressoMood ? 0.45 : 0.65,
              ]}
            />
            <directionalLight
              position={[3.6, 5.2, 3.8]}
              intensity={isEspressoMood ? 2.6 : 2.15}
              color="#FFF1DC"
              castShadow
              shadow-mapSize={[1024, 1024]}
              shadow-bias={-0.0004}
            />
            <directionalLight
              position={[-3.8, 2.2, -2.5]}
              intensity={isEspressoMood ? 1.15 : 0.72}
              color={isEspressoMood ? '#C6A46C' : '#E6ECEF'}
            />
            <spotLight
              position={[0.5, 3.6, -3.5]}
              angle={0.55}
              penumbra={0.9}
              intensity={isEspressoMood ? 3.2 : 1.6}
              color="#DFAE9B"
            />

            {/* Procedural studio reflections (zero external HDRI requests) */}
            <Environment resolution={256}>
              <group rotation={[-Math.PI / 4, 0, 0]}>
                <Lightformer
                  form="rect"
                  intensity={isEspressoMood ? 2.2 : 2.8}
                  color="#FFF7EA"
                  scale={[8, 4, 1]}
                  position={[0, 4, 3]}
                />
                <Lightformer
                  form="circle"
                  intensity={1.5}
                  color="#F5D9B5"
                  scale={[3, 3, 1]}
                  position={[4, 1, -2]}
                />
                <Lightformer
                  form="rect"
                  intensity={0.9}
                  color="#DFAE9B"
                  scale={[6, 2, 1]}
                  position={[-4, 2, 1]}
                />
              </group>
            </Environment>

            {useProceduralFallback ? (
              <ProceduralDessert3D
                slug={dessert.slug}
                autoRotate={autoRotate && !isDragging && !prefersReduced}
                rotateSpeed={rotateSpeed}
                enableParallax={enableParallax}
                scaleMultiplier={scaleMultiplier}
                scrollProgressRef={scrollProgressRef}
                scrollSpinTurns={scrollSpinTurns}
                dragYawRef={dragYawRef}
                onReady={handleModelReady}
              />
            ) : (
              <InternalR3FErrorBoundary
                resetKey={dessert.modelPath}
                onError={() => {
                  failedGlbPaths.add(dessert.modelPath);
                  setUseProceduralFallback(true);
                }}
              >
                <Suspense fallback={null}>
                  <LoadedDessertModel
                    modelPath={dessert.modelPath}
                    autoRotate={autoRotate && !isDragging && !prefersReduced}
                    rotateSpeed={rotateSpeed}
                    enableParallax={enableParallax}
                    scaleMultiplier={scaleMultiplier}
                    scrollProgressRef={scrollProgressRef}
                    scrollSpinTurns={scrollSpinTurns}
                    dragYawRef={dragYawRef}
                    onReady={handleModelReady}
                  />
                </Suspense>
              </InternalR3FErrorBoundary>
            )}

            <ContactShadows
              position={[0, -0.63, 0]}
              opacity={isEspressoMood ? 0.55 : 0.34}
              scale={4.5}
              blur={2.1}
              far={2.4}
              color={isEspressoMood ? '#140B08' : '#38251F'}
            />

            {interactive && (
              <>
                <OrbitControls
                  ref={controlsRef}
                  makeDefault
                  enablePan={false}
                  enableZoom={enableZoom}
                  enableDamping
                  dampingFactor={0.07}
                  minDistance={1.85}
                  maxDistance={5.2}
                  minPolarAngle={Math.PI * 0.18}
                  maxPolarAngle={Math.PI * 0.54}
                  target={[0, -0.05, 0]}
                  onStart={() => setIsDragging(true)}
                  onEnd={() => setIsDragging(false)}
                />
                <CameraController
                  zoomDelta={zoomDelta}
                  resetSignal={resetSignal}
                  defaultPosition={dessert.cameraPosition}
                  controlsRef={controlsRef}
                />
              </>
            )}
          </Canvas>
        </ModelErrorBoundary>
      ) : null}
    </div>
  );
}
