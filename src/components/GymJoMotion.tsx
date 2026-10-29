"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

export function GymJoMotion() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.z = 7;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    scene.add(new THREE.AmbientLight(0xffffff, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3);
    keyLight.position.set(3, 4, 6);
    scene.add(keyLight);

    const green = new THREE.MeshStandardMaterial({ color: 0x21834f, roughness: 0.28, metalness: 0.18 });
    const lime = new THREE.MeshStandardMaterial({ color: 0x9bd6a4, roughness: 0.34, metalness: 0.08 });
    const white = new THREE.MeshStandardMaterial({ color: 0xf7fff5, roughness: 0.3, metalness: 0.12 });

    const heroGroup = new THREE.Group();
    scene.add(heroGroup);

    const torus = new THREE.Mesh(new THREE.TorusKnotGeometry(0.92, 0.23, 112, 14, 2, 3), green);
    torus.position.set(0.1, 0.05, 0);
    heroGroup.add(torus);

    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 1), lime);
    orb.position.set(-1.3, 0.8, 0.2);
    heroGroup.add(orb);

    const smallOrb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), white);
    smallOrb.position.set(1.25, -0.9, 0.25);
    heroGroup.add(smallOrb);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.018, 8, 100), lime);
    ring.rotation.set(0.7, 0.3, -0.42);
    heroGroup.add(ring);

    const resize = () => {
      const width = Math.max(canvas.clientWidth, 1);
      const height = Math.max(canvas.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width < 420 ? 8 : 7;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    let revealObserver: IntersectionObserver | undefined;
    const context = gsap.context(() => {
      if (reducedMotion) return;

      gsap.fromTo(heroGroup.scale, { x: 0.78, y: 0.78, z: 0.78 }, { x: 1, y: 1, z: 1, duration: 1.1, ease: "back.out(1.7)" });
      gsap.to(torus.rotation, { x: Math.PI * 2, y: Math.PI * 2, duration: 18, ease: "none", repeat: -1 });
      gsap.to(orb.position, { y: "+=0.25", duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.to(smallOrb.position, { y: "-=0.2", duration: 1.8, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.to(ring.rotation, { z: "+=0.55", duration: 8, ease: "sine.inOut", yoyo: true, repeat: -1 });

      const revealTargets = Array.from(document.querySelectorAll<HTMLElement>(
        "[data-gymjo-reveal], main article, main > div > section:not(:first-child)"
      ));
      const seen = new WeakSet<Element>();
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || seen.has(entry.target)) return;
          seen.add(entry.target);
          const element = entry.target as HTMLElement;
          const isHero = element.hasAttribute("data-gymjo-reveal");
          gsap.fromTo(element,
            { autoAlpha: 0, y: isHero ? 18 : 22 },
            {
              autoAlpha: 1,
              y: 0,
              duration: isHero ? 0.65 : 0.55,
              ease: "power2.out",
              clearProps: "transform,opacity,visibility",
              onComplete: () => revealObserver?.unobserve(element)
            }
          );
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -35px 0px" });

      revealTargets.forEach((element) => revealObserver?.observe(element));
    }, canvas);

    let frame = 0;
    const render = () => {
      frame = requestAnimationFrame(render);
      renderer.render(scene, camera);
    };
    if (!reducedMotion) render();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      revealObserver?.disconnect();
      context.revert();
      torus.geometry.dispose();
      orb.geometry.dispose();
      smallOrb.geometry.dispose();
      ring.geometry.dispose();
      green.dispose();
      lime.dispose();
      white.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-45" />;
}
