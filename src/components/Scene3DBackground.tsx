import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Scene3DBackgroundProps {
  interactive?: boolean;
}

export const Scene3DBackground: React.FC<Scene3DBackgroundProps> = ({ interactive = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Setup Three.js scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0c, 0.0018);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 85;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 1. Ambient Particle Constellation (Cybernetic Starfield)
    const particleCount = 280;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    const color1 = new THREE.Color(0x38bdf8); // Sky blue
    const color2 = new THREE.Color(0x818cf8); // Indigo
    const color3 = new THREE.Color(0xf59e0b); // Amber

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 220;
      positions[i3 + 1] = (Math.random() - 0.5) * 160;
      positions[i3 + 2] = (Math.random() - 0.5) * 140;

      // Random color blend
      const rand = Math.random();
      const chosenColor = rand < 0.6 ? color1 : rand < 0.85 ? color2 : color3;
      colors[i3] = chosenColor.r;
      colors[i3 + 1] = chosenColor.g;
      colors[i3 + 2] = chosenColor.b;

      scales[i] = Math.random() * 2.5 + 1.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Canvas particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: 2.5,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    // 2. Floating 3D Geometric Holographic Rings / Polyhedra
    const floatingGroup = new THREE.Group();
    scene.add(floatingGroup);

    // Ring 1: Cybernetic Orbit Ring
    const torusGeo = new THREE.TorusGeometry(26, 0.18, 16, 100);
    const torusMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const torus1 = new THREE.Mesh(torusGeo, torusMat);
    torus1.position.set(-45, 18, -30);
    torus1.rotation.x = Math.PI / 3;
    floatingGroup.add(torus1);

    // Ring 2: Amber Accent Ring
    const torusGeo2 = new THREE.TorusGeometry(18, 0.15, 16, 80);
    const torusMat2 = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const torus2 = new THREE.Mesh(torusGeo2, torusMat2);
    torus2.position.set(52, -22, -40);
    torus2.rotation.y = Math.PI / 4;
    floatingGroup.add(torus2);

    // Floating Icosahedron (Geometric Tech Node)
    const icoGeo = new THREE.IcosahedronGeometry(12, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const icosahedron = new THREE.Mesh(icoGeo, icoMat);
    icosahedron.position.set(48, 30, -50);
    floatingGroup.add(icosahedron);

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 2, 150);
    pointLight.position.set(0, 30, 40);
    scene.add(pointLight);

    // Mouse Move Listener for 3D Parallax
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      // Normalize mouse coordinates to -1 to 1
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.targetX = nx;
      mouseRef.current.targetY = ny;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Window Resize Listener
    const handleResize = () => {
      if (!container) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      // Parallax camera rotation
      camera.position.x = mouseRef.current.x * 12;
      camera.position.y = mouseRef.current.y * 8;
      camera.lookAt(0, 0, 0);

      // Subtle slow rotation of 3D objects
      particles.rotation.y = elapsedTime * 0.02 + mouseRef.current.x * 0.15;
      particles.rotation.x = Math.sin(elapsedTime * 0.015) * 0.08 + mouseRef.current.y * 0.1;

      torus1.rotation.x += 0.003;
      torus1.rotation.y += 0.004;

      torus2.rotation.y += 0.004;
      torus2.rotation.z += 0.003;

      icosahedron.rotation.x += 0.005;
      icosahedron.rotation.y += 0.007;

      floatingGroup.position.x = mouseRef.current.x * 6;
      floatingGroup.position.y = mouseRef.current.y * 4;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      particleMaterial.dispose();
      particleTexture.dispose();
      torusGeo.dispose();
      torusMat.dispose();
      torusGeo2.dispose();
      torusMat2.dispose();
      icoGeo.dispose();
      icoMat.dispose();
    };
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      id="devicex-3d-background-canvas"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-75"
      style={{ willChange: 'transform' }}
      aria-hidden="true"
    />
  );
};
