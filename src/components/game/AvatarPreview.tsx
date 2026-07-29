/** Prévia 3D ao vivo do avatar (usa o mesmo modelo do jogo). */
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { animateCharacter, createCharacter } from "@/game/character";
import type { AvatarConfig } from "@/game/profile";

export function AvatarPreview({ avatar, className }: { avatar: AvatarConfig; className?: string }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const dim = () => renderer.setSize(el.clientWidth, el.clientHeight || 260);
    dim();
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 1.35, 4.1);
    camera.lookAt(0, 1.05, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8fd06a, 1.5));
    const luz = new THREE.DirectionalLight(0xfff3d0, 1.4);
    luz.position.set(3, 5, 4);
    scene.add(luz);

    const p = createCharacter({
      skin: avatar.pele,
      shirt: avatar.camisa,
      pants: avatar.calca,
      hair: avatar.corCabelo,
      hairStyle: avatar.cabelo,
      hat: avatar.chapeu,
      glasses: avatar.oculos,
      scale: avatar.altura,
    });
    scene.add(p.root);

    const relogio = new THREE.Clock();
    let raf = 0;
    const loop = () => {
      const dt = relogio.getDelta();
      const t = relogio.elapsedTime;
      p.root.rotation.y = t * 0.6;
      animateCharacter(p, "idle", t, dt);
      const w = el.clientWidth || 240;
      const h = el.clientHeight || 260;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    const ro = new ResizeObserver(dim);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [avatar]);

  return <div ref={box} className={className} />;
}
