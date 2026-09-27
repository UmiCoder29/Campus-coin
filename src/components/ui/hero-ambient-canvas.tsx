"use client";

import React, { useEffect, useRef } from "react";

interface HeroAmbientCanvasProps {
  className?: string;
  intensity?: number;
}

/**
 * Lightweight, high-performance ambient backdrop canvas
 * Renders a slow, serene chromatic gradient wave in Campus Coin's warm palette.
 * Pauses automatically via IntersectionObserver when offscreen (0% CPU/GPU overhead).
 */
export function HeroAmbientCanvas({
  className = "opacity-40 dark:opacity-25",
  intensity = 0.35,
}: HeroAmbientCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext("webgl", { alpha: true, antialias: false, powerPreference: "low-power" });
    } catch {
      return;
    }
    if (!gl) return;

    const vsSource = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        v_uv = (a_pos + 1.0) * 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_res;
      uniform float u_intensity;
      varying vec2 v_uv;

      void main() {
        vec2 p = v_uv;
        float t = u_time * 0.25;

        // Fluid organic waves inspired by Mercury/Stripe hero atmospheres
        float w1 = sin(p.x * 2.5 + t) * 0.4 + cos(p.y * 3.0 - t * 0.8) * 0.4;
        float w2 = cos(p.x * 3.5 - t * 1.2) * 0.3 + sin(p.y * 2.0 + t) * 0.3;
        float w = (w1 + w2) * 0.5;

        // Brand colors: warm terracotta/orange (#FF722B) and golden amber (#FFA64D)
        vec3 colOrange = vec3(1.0, 0.447, 0.169);
        vec3 colAmber  = vec3(1.0, 0.720, 0.320);
        vec3 colDark   = vec3(0.055, 0.071, 0.106);

        float mask = smoothstep(0.1, 0.9, p.y + w * 0.2);
        vec3 grad = mix(colOrange, colAmber, p.x + w * 0.3);
        vec3 finalCol = mix(colDark, grad, mask * u_intensity);

        float alpha = clamp(mask * u_intensity * 0.65, 0.0, 0.6);
        gl_FragColor = vec4(finalCol, alpha);
      }
    `;

    const createShader = (type: number, src: string) => {
      if (!gl) return null;
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uIntensity = gl.getUniformLocation(prog, "u_intensity");

    let isVisible = true;
    let animId: number | null = null;
    const startTime = performance.now();

    const resize = () => {
      if (!canvas || !gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.floor(canvas.clientWidth * dpr) || 300;
      const h = Math.floor(canvas.clientHeight * dpr) || 150;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();

    const render = () => {
      if (!gl || !isVisible) return;
      const elapsed = (performance.now() - startTime) * 0.001;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uIntensity, intensity);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animId = requestAnimationFrame(render);
    };

    // IntersectionObserver to pause render loop when off-screen
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      isVisible = entry.isIntersecting;
      if (isVisible) {
        animId = requestAnimationFrame(render);
      } else if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    });

    observer.observe(canvas);
    window.addEventListener("resize", resize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      if (animId) cancelAnimationFrame(animId);
      if (gl && prog) {
        gl.deleteProgram(prog);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      }
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none select-none absolute inset-0 w-full h-full -z-0 ${className}`}
      aria-hidden="true"
    />
  );
}
