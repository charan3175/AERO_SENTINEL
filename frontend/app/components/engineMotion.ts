import * as THREE from "three";

export type EngineMotionState = {
  crankAngle: number;
  camAngle: number;
  pistonPositions: number[];
  valvePositions: number[];
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/**
 * Updates the mechanical state of the aircraft piston engine.
 *
 * RPM is the primary input.
 *
 * crankshaft → pistons → camshaft → valves → propeller
 */
export function updateEngineMotion(
  rpm: number,
  delta: number,
  cylinderCount = 4
): EngineMotionState {
  const safeRPM = clamp(rpm, 0, 5000);

  // Convert RPM to radians/second.
  const crankAngularVelocity =
    (safeRPM * Math.PI * 2) / 60;

  // Advance crankshaft angle.
  const crankAngle =
    crankAngularVelocity * delta;

  // Four-stroke engine:
  // camshaft rotates at half crankshaft speed.
  const camAngle = crankAngle * 0.5;

  const pistonPositions: number[] = [];
  const valvePositions: number[] = [];

  for (let cylinder = 0; cylinder < cylinderCount; cylinder++) {
    /*
     * Phase difference between cylinders.
     *
     * This is a prototype firing arrangement.
     * We can change the firing order later according
     * to the actual selected engine model.
     */
    const phase =
      (cylinder * Math.PI * 2) / cylinderCount;

    const cylinderAngle =
      crankAngle + phase;

    /*
     * Slider-crank approximation.
     *
     * Gives realistic reciprocating piston motion
     * instead of independent random animation.
     */
    const pistonTravel =
      Math.cos(cylinderAngle);

    pistonPositions.push(pistonTravel);

    /*
     * Valve motion.
     *
     * Camshaft rotates at half crankshaft speed.
     * The squared sine produces an opening/closing
     * style motion.
     */
    const valveMotion =
      Math.max(
        0,
        Math.sin(camAngle + phase)
      );

    valvePositions.push(valveMotion);
  }

  return {
    crankAngle,
    camAngle,
    pistonPositions,
    valvePositions,
  };
}