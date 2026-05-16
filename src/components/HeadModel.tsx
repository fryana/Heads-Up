import { useGLTF } from "@react-three/drei";
import { useMemo, useState } from "react";
import * as THREE from "three";
import { HEAD_REGIONS } from "@/lib/regions";

export type HeadModelProps = {
  selectedRegions?: string[];
  intensity?: number;
  interactive?: boolean;
  onToggleRegion?: (id: string) => void;
};

// Ellipsoid envelope used to project region direction-vectors onto the head surface.
const HEAD_SCALE: [number, number, number] = [1, 1.25, 1.05];
// Tiny outward offset so caps sit on the surface without z-fighting.
const DECAL_OFFSET = 0.9;
// Hit-sphere radius — slightly larger than the head so clicks always land.
const HIT_RADIUS = 1.02;
// Multiplier on each region's footprint so neighbouring caps overlap and
// leave no visible gaps between zones.
const CAP_OVERLAP = 1.15;
// The fitted GLB's facial features sit higher than the mathematical ellipsoid
// center, so lift region anchors before projecting them onto the surface.
const REGION_Y_LIFT = 0.32;
// Per-region extra Y lift to nudge specific decals onto the right facial
// features of the fitted GLB (the mesh isn't a perfect ellipsoid).
const REGION_EXTRA_Y_LIFT: Record<string, number> = {
  forehead: 0.28,
  "around-eyes": 0.28,
};

function alignRegionPosition(
  pos: [number, number, number],
  id?: string,
): [number, number, number] {
  const extra = id ? (REGION_EXTRA_Y_LIFT[id] ?? 0) : 0;
  return [pos[0], pos[1] + REGION_Y_LIFT + extra, pos[2]];
}

function projectToSurface(
  pos: [number, number, number],
  offset = 1,
  id?: string,
): [number, number, number] {
  const aligned = alignRegionPosition(pos, id);
  const v = new THREE.Vector3(
    aligned[0] / HEAD_SCALE[0],
    aligned[1] / HEAD_SCALE[1],
    aligned[2] / HEAD_SCALE[2],
  ).normalize();
  return [v.x * HEAD_SCALE[0] * offset, v.y * HEAD_SCALE[1] * offset, v.z * HEAD_SCALE[2] * offset];
}

// For a given world-space hit point, find the region whose direction vector
// is closest (largest dot product) — Voronoi-style coverage with no gaps.
function nearestRegionId(hit: THREE.Vector3): string {
  const dir = new THREE.Vector3(
    hit.x / HEAD_SCALE[0],
    hit.y / HEAD_SCALE[1],
    hit.z / HEAD_SCALE[2],
  ).normalize();

  let bestId = HEAD_REGIONS[0].id;
  let bestDot = -Infinity;
  for (const r of HEAD_REGIONS) {
    const aligned = alignRegionPosition(r.position, r.id);
    const rd = new THREE.Vector3(
      aligned[0] / HEAD_SCALE[0],
      aligned[1] / HEAD_SCALE[1],
      aligned[2] / HEAD_SCALE[2],
    ).normalize();
    const d = dir.dot(rd);
    if (d > bestDot) {
      bestDot = d;
      bestId = r.id;
    }
  }
  return bestId;
}

export default function HeadModel({
  selectedRegions: external,
  intensity = 5,
  interactive = true,
  onToggleRegion,
}: HeadModelProps = {}) {
  const { scene } = useGLTF("/models/head.glb");

  // Clone so multiple <HeadModel /> instances don't share mutated state.
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Auto-fit the GLB into the HEAD_SCALE ellipsoid.
  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x / HEAD_SCALE[0], size.y / HEAD_SCALE[1], size.z / HEAD_SCALE[2]);
    const scale = maxDim > 0 ? 2 / maxDim : 1;
    return {
      scale,
      position: [-center.x * scale, -center.y * scale, -center.z * scale] as [
        number,
        number,
        number,
      ],
    };
  }, [cloned]);

  const [internal, setInternal] = useState<string[]>([]);
  const selected = external ?? internal;

  const toggleRegion = (id: string) => {
    if (!interactive) return;
    onToggleRegion?.(id);
    if (external === undefined) {
      setInternal((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
    }
  };

  const emissiveBoost = Math.max(0.2, Math.min(1, intensity / 10));

  // Pre-compute orientation for each region so a spherical-cap mesh sits
  // tangent to the ellipsoid surface (its pole points outward along the
  // region direction).
  const decals = useMemo(() => {
    return HEAD_REGIONS.map((r) => {
      // Push the back-of-head and crown caps further out so they read clearly
      // against the silhouette (otherwise they hide behind the head's curve).
      const perRegionOffset =
        r.id === "back-of-head" || r.id === "crown" ? DECAL_OFFSET + 0.18 : DECAL_OFFSET;
      const surfacePoint = projectToSurface(r.position, perRegionOffset, r.id);
      const normal = new THREE.Vector3(
        surfacePoint[0],
        surfacePoint[1],
        surfacePoint[2],
      ).normalize();
      // Cap geometry is built around +Y, so align +Y to the outward normal.
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      const halfAngle = Math.min(Math.PI / 2, r.radius * CAP_OVERLAP);
      return { id: r.id, color: r.color, halfAngle, quat, offset: perRegionOffset };
    });
  }, []);

  return (
    <>
      {/* Rotate only the GLB so the region overlays stay in the same +Z-front
          coordinate system used by the data labels. */}
      <group rotation={[0, Math.PI, 0]}>
        <primitive object={cloned} scale={fit.scale} position={fit.position} />
      </group>

      {/* Invisible full-coverage hit sphere — every click on the head maps
          to the nearest region, so there are no gaps between zones. */}
      {interactive && (
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            toggleRegion(nearestRegionId(e.point));
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "auto";
          }}
        >
          <sphereGeometry args={[HIT_RADIUS, 48, 48]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Spherical-cap patches that hug the head surface for selected regions. */}
      {decals.map((d) => {
        const isSelected = selected.includes(d.id);
        if (!isSelected) return null;
        return (
          <mesh
            key={d.id}
            quaternion={d.quat}
            scale={[
              HEAD_SCALE[0] * d.offset,
              HEAD_SCALE[1] * d.offset,
              HEAD_SCALE[2] * d.offset,
            ]}
            raycast={() => null}
          >
            <sphereGeometry args={[1, 48, 32, 0, Math.PI * 2, 0, d.halfAngle]} />
            <meshBasicMaterial
              color={d.color}
              transparent
              opacity={0.55 + 0.35 * emissiveBoost}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </>
  );
}

export { HeadModel };

useGLTF.preload("/models/head.glb");
