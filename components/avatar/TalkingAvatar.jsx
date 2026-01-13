"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import { VISEMES } from "wawa-lipsync";
import { getLipsyncManager } from "@/lib/lipsyncManager";
import * as THREE from "three";

const MODEL_URLS = {
  female: "/models/female.glb",
  male: "/models/male.glb",
};

const resolveModelUrl = (modelKey) => MODEL_URLS[modelKey] || MODEL_URLS.female;

function AvatarModel({ modelKey, lipsyncManager, onReady, onVisemeChange }) {
  const modelUrl = resolveModelUrl(modelKey);
  const { scene } = useGLTF(modelUrl);
  const headRef = useRef(null);
  const readyRef = useRef(false);
  const idleTiltRef = useRef(-0.04);
  const [blink, setBlink] = useState(false);
  const smoothMovements = true;

  const morphMeshes = useMemo(() => {
    const list = [];
    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) list.push(child);
    });
    return list;
  }, [scene]);

  const lerpMorphTarget = useCallback(
    (target, value, speed = 0.1) => {
      morphMeshes.forEach((mesh) => {
        const idx = mesh.morphTargetDictionary?.[target];
        if (idx === undefined) return;
        const current = mesh.morphTargetInfluences[idx] || 0;
        mesh.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
          current,
          value,
          speed
        );
      });
    },
    [morphMeshes]
  );

  useEffect(() => {
    headRef.current =
      scene.getObjectByName("Head") ||
      scene.getObjectByName("Wolf3D_Head") ||
      scene.getObjectByName("Neck");

    if (!readyRef.current) {
      readyRef.current = true;
      onReady?.();
    }
  }, [scene, morphMeshes, onReady]);

  useEffect(() => {
    let timeoutId;
    const scheduleBlink = () => {
      const delay = 1200 + Math.random() * 2500;
      timeoutId = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          scheduleBlink();
        }, 180);
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(timeoutId);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.6) * 0.04;
      headRef.current.rotation.x =
        Math.sin(t * 0.35) * 0.02 + idleTiltRef.current;
    }

    if (!lipsyncManager) return;
    lipsyncManager.processAudio?.();
    const viseme = lipsyncManager.viseme || VISEMES.sil;
    const state = lipsyncManager.state;

    onVisemeChange?.({ viseme, state });

    // Lipsync morphs
    const visemeStrength = 0.55;
    lerpMorphTarget(
      viseme,
      visemeStrength,
      smoothMovements ? (state === "vowel" ? 0.08 : 0.16) : 1
    );

    Object.values(VISEMES).forEach((value) => {
      if (viseme === value) return;
      lerpMorphTarget(
        value,
        0,
        smoothMovements ? (state === "vowel" ? 0.04 : 0.08) : 1
      );
    });

    // Blink morphs
    lerpMorphTarget("eyeBlinkLeft", blink ? 1 : 0, 0.25);
    lerpMorphTarget("eyeBlinkRight", blink ? 1 : 0, 0.25);

    // Light brow motion during speech (demo)
    const isSpeaking = state === "vowel";
    const amp = 0.04 * (isSpeaking ? 1 : 0);
    const pulse = (Math.sin(t * 6) + 1) / 2;
    lerpMorphTarget("browInnerUp", amp * pulse, 0.2);
    lerpMorphTarget("browDownLeft", amp * (1 - pulse) * 0.3, 0.15);
    lerpMorphTarget("browDownRight", amp * (1 - pulse) * 0.3, 0.15);
  });

  return <primitive object={scene} dispose={null} />;
}

useGLTF.preload(resolveModelUrl("female"));
useGLTF.preload(resolveModelUrl("male"));

function CameraRig({ position, target, fov = 35 }) {
  const { camera } = useThree();
  useEffect(() => {
    if (!camera || !position || !target) return;
    camera.position.set(...position);
    camera.lookAt(...target);
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }, [camera, fov, position, target]);
  return null;
}

export function TalkingAvatar({
  model = "female",
  messageText,
  className = "",
  initialCamera = null,
  audioRef = null,
  isLoading = false,
}) {
  const [lipsyncManager, setLipsyncManager] = useState(null);
  const lastSrcRef = useRef(null);
  const cameraState = useMemo(() => {
    const presets = {
      male: { position: [0, 1.68, 1.25], target: [0, 1.68, 0], fov: 20 },
      female: { position: [0, 1.60, 1.25], target: [0, 1.60, 0], fov: 20 },
    };
    return initialCamera || presets[model] || presets.male;
  }, [initialCamera, model]);
  const [isModelReady, setIsModelReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    getLipsyncManager().then((mgr) => {
      if (mounted) {
        setLipsyncManager(mgr);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef?.current;
    if (!lipsyncManager || !audio) return;

    const resetAndConnect = () => {
      if (!audio.src) return;
      if (audio.src !== lastSrcRef.current) {
        lastSrcRef.current = audio.src;
        audio._wawaConnected = false;
      }
      if (audio._wawaConnected) return;
      try {
        lipsyncManager.connectAudio(audio);
        audio._wawaConnected = true;
      } catch {
        // ignore repeated connect attempts
      }
    };

    // Try immediately if a source already exists
    resetAndConnect();

    audio.addEventListener("loadedmetadata", resetAndConnect);
    audio.addEventListener("canplay", resetAndConnect);

    return () => {
      audio.removeEventListener("loadedmetadata", resetAndConnect);
      audio.removeEventListener("canplay", resetAndConnect);
    };
  }, [audioRef, lipsyncManager]);

  return (
    <div className={`relative w-full h-full bg-slate-900 overflow-hidden ${className}`}>
      <Canvas className="w-full h-full" camera={{ position: cameraState.position, fov: cameraState.fov }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 2, 2]} intensity={1.4} />
          <directionalLight position={[-2, 1, -1]} intensity={0.6} />
          <Environment preset="sunset" />
          <AvatarModel
            modelKey={model}
            lipsyncManager={lipsyncManager}
            onReady={() => setIsModelReady(true)}
          />
          <CameraRig
            position={cameraState.position}
            target={cameraState.target}
            fov={cameraState.fov}
          />
        </Suspense>
      </Canvas>
      {(messageText || isLoading) && (
        <div className="absolute bottom-3 left-3 right-3 flex justify-center">
          <div
            className="relative bg-black/80 text-white text-base p-3 px-4 backdrop-blur flex items-center justify-center"
            style={{
              width: isLoading ? 120 : "100%",
              maxWidth: isLoading ? 140 : "100%",
              textAlign: "center",
              minHeight: 56,
              borderRadius: isLoading ? 999 : 18,
              flex: "1 1 auto",
            }}
          >
            {isLoading ? (
              <img
                src="/wdots.gif"
                alt="loading"
                className="h-4 mx-auto block"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            ) : (
              <span className="block" style={{ width: "100%" }}>
                {messageText}
              </span>
            )}
          </div>
        </div>
      )}
      {!isModelReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 text-white text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-white animate-ping" />
            <span>Loading avatar...</span>
          </div>
        </div>
      )}
    </div>
  );
}
