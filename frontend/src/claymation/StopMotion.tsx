import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Steps the R3F clock so animations feel like stop-motion (~10 fps).
 * Must sit inside the Canvas tree.
 */
export function StopMotionClock({ fps = 10 }: { fps?: number }) {
  const acc = useRef(0);
  const last = useRef(0);

  useFrame((state) => {
    const dt = state.clock.getDelta();
    acc.current += dt;
    const step = 1 / fps;
    if (acc.current >= step) {
      acc.current %= step;
      last.current += step;
    }
    // Freeze continuous clock reads used by animations to stepped time.
    // Consumers should prefer useStopMotionTime() via the shared ref below.
    (state as unknown as { stopMotionTime: number }).stopMotionTime = last.current;
  });

  return null;
}

/** Read stepped time; falls back to continuous clock. */
export function readStopMotionTime(state: {
  clock: { elapsedTime: number };
  stopMotionTime?: number;
}): number {
  return state.stopMotionTime ?? state.clock.elapsedTime;
}
