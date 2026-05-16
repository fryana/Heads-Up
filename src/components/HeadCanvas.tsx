import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import HeadModel, { type HeadModelProps } from "./HeadModel";

export default function HeadCanvas(props: HeadModelProps = {}) {
  const { interactive = true } = props;
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 40 }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, 2, 2]} intensity={2} />
      <directionalLight position={[-2, 1, -2]} intensity={0.6} />

      <Suspense fallback={null}>
        <HeadModel {...props} />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom={interactive}
        minDistance={2.5}
        maxDistance={6}
      />
    </Canvas>
  );
}
