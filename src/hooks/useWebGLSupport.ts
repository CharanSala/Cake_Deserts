import { useEffect, useState } from 'react';

let cachedSupport: boolean | null = null;

export function useWebGLSupport(): boolean {
  const [supported, setSupported] = useState<boolean>(() => cachedSupport ?? true);

  useEffect(() => {
    if (cachedSupport !== null) {
      setSupported(cachedSupport);
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ||
        canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
        canvas.getContext('experimental-webgl');
      cachedSupport = Boolean(gl);
    } catch {
      cachedSupport = false;
    }
    setSupported(cachedSupport);
  }, []);

  return supported;
}
