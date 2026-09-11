"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import RealisticEngine from "./RealisticEngine";

type DigitalTwinProps = {
  rpm: number;
  health: number;
  fault: string;
};

export default function DigitalTwin({
  rpm,
  health,
  fault,
}: DigitalTwinProps) {
  return (
    <div className="digital-twin-container">
      <Canvas
       camera={{
  position: [6.5, 4.2, 7.5],
  fov: 38,
}}
      >
        <color
          attach="background"
          args={["#07111f"]}
        />

        <ambientLight intensity={1.5} />

        <directionalLight
          position={[5, 7, 5]}
          intensity={3}
        />

        <directionalLight
          position={[-5, 3, -3]}
          intensity={2}
        />

        <pointLight
          position={[0, 3, 4]}
          intensity={2}
        />

        <RealisticEngine
          rpm={rpm}
          health={health}
          fault={fault}
        />

        <gridHelper
          args={[
            12,
            24,
            "#1e40af",
            "#172554",
          ]}
          position={[0, -1.8, 0]}
        />

        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={10}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>

      <div className="digital-twin-overlay">
        <div>
          <span>ENGINE DIGITAL TWIN</span>
          <strong>LIVE</strong>
        </div>

        <div className="twin-live-data">
          <span>
            RPM <b>{Math.round(rpm)}</b>
          </span>

          <span>
            HEALTH <b>{Math.round(health)}%</b>
          </span>
        </div>
      </div>
    </div>
  );
}