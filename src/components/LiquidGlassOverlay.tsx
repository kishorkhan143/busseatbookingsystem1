import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLiquidGlass, GlassPanelDescriptor, GlassPanelId } from '../context/LiquidGlassContext';
import {
  LIQUID_GLASS_VS,
  LIQUID_GLASS_FS,
  REGULAR_GLASS_PRESET,
} from '../utils/liquidGlassShader';
import { captureLiveMainScene } from '../utils/liveSceneCapture';

interface LiquidGlassOverlayProps {
  mainRef: React.RefObject<HTMLElement | null>;
  activeTab: string;
}

export const LiquidGlassOverlay: React.FC<LiquidGlassOverlayProps> = ({
  mainRef,
  activeTab,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const {
    neonEnabled,
    setWebglActive,
    getPanelDescriptors,
    markSceneDirty,
    consumeSceneDirty,
  } = useLiquidGlass();

  const themeRef = useRef(theme);
  const neonTargetRef = useRef(neonEnabled ? 1 : 0);

  useEffect(() => {
    themeRef.current = theme;
    markSceneDirty();
  }, [theme, markSceneDirty]);

  useEffect(() => {
    neonTargetRef.current = neonEnabled ? 1 : 0;
  }, [neonEnabled]);

  useEffect(() => {
    // Re-capture across tab entrance transition so refracted UI stays synchronized
    markSceneDirty();
    const t1 = window.setTimeout(markSceneDirty, 160);
    const t2 = window.setTimeout(markSceneDirty, 380);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [activeTab, markSceneDirty]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      setWebglActive(false);
      return;
    }

    function compile(type: number, src: string): WebGLShader | null {
      if (!gl) return null;
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('[LiquidGlass] Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compile(gl.VERTEX_SHADER, LIQUID_GLASS_VS);
    const fs = compile(gl.FRAGMENT_SHADER, LIQUID_GLASS_FS);
    if (!vs || !fs) {
      setWebglActive(false);
      return;
    }

    const prog = gl.createProgram();
    if (!prog) {
      setWebglActive(false);
      return;
    }

    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[LiquidGlass] Program link error:', gl.getProgramInfoLog(prog));
      setWebglActive(false);
      return;
    }

    gl.useProgram(prog);

    const uniformNames = [
      'u_bg',
      'u_res',
      'u_quadRect',
      'u_center',
      'u_half',
      'u_radius',
      'u_zR',
      'u_refract',
      'u_chroma',
      'u_edgeHL',
      'u_fresnel',
      'u_spec',
      'u_shadowAlpha',
      'u_shadowSpread',
      'u_shadowOffY',
      'u_neon',
      'u_time',
      'u_tintCol',
      'u_tintAlpha',
      'u_isDark',
    ] as const;

    const U = {} as Record<(typeof uniformNames)[number], WebGLUniformLocation | null>;
    for (const name of uniformNames) {
      U[name] = gl.getUniformLocation(prog, name);
    }

    // Unit quad [0, 1] x [0, 1] positioned per panel via u_quadRect
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Live UI background texture
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // Enable premultiplied alpha blending for transparent canvas + stacked pill lens
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const sceneCanvas = document.createElement('canvas');

    let dpr = 1;
    let vw = window.innerWidth;
    let vh = window.innerHeight;
    let W = 1;
    let H = 1;

    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = window.innerWidth;
      vh = window.innerHeight;
      W = Math.max(1, Math.floor(vw * dpr));
      H = Math.max(1, Math.floor(vh * dpr));
      canvas.width = W;
      canvas.height = H;
      gl.viewport(0, 0, W, H);
      markSceneDirty();
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Observe DOM mutations inside <main> so route/seat/filter updates reflect in glass
    let mutationObserver: MutationObserver | null = null;
    if (mainRef.current) {
      mutationObserver = new MutationObserver(() => {
        markSceneDirty();
      });
      mutationObserver.observe(mainRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
    }

    setWebglActive(true);

    let rafId = 0;
    const t0 = performance.now();
    let smoothNeon = neonTargetRef.current;
    let lastCaptureTime = 0;

    const drawPanel = (
      desc: GlassPanelDescriptor,
      isDark: boolean,
      t: number,
      neonVal: number,
      isNestedLens: boolean
    ) => {
      const halfW = (desc.w * dpr) / 2;
      const halfH = (desc.h * dpr) / 2;
      const cx = desc.x * dpr;
      const cy = desc.y * dpr;

      // Tightly bounded quad around panel + optional neon halo margin (no black shadow)
      const pad = (neonVal > 0.01 ? (isNestedLens ? 18 : 28) : 4) * dpr;
      const qx = Math.max(0, cx - halfW - pad);
      const qy = Math.max(0, cy - halfH - pad);
      const qRight = Math.min(W, cx + halfW + pad);
      const qBottom = Math.min(H, cy + halfH + pad);
      const qw = qRight - qx;
      const qh = qBottom - qy;
      if (qw <= 0 || qh <= 0) return;

      const cornerR = (desc.cornerRadius ?? REGULAR_GLASS_PRESET.cornerRadius) * dpr;
      const zR = (desc.zRadius ?? REGULAR_GLASS_PRESET.zRadius) * dpr;
      const refract = desc.refraction ?? REGULAR_GLASS_PRESET.refraction;
      const shadowOpacity = desc.shadowOpacity ?? 0.0;

      // Subtle optical tint preserving clear glass optics & WCAG text contrast
      const defaultTintAlpha = isNestedLens
        ? isDark
          ? 0.17
          : 0.28
        : isDark
        ? 0.2
        : 0.24;
      const tintAlpha = desc.tintAlpha ?? defaultTintAlpha;

      if (desc.tintCol) {
        gl.uniform3f(U.u_tintCol, desc.tintCol[0], desc.tintCol[1], desc.tintCol[2]);
      } else if (isDark) {
        gl.uniform3f(
          U.u_tintCol,
          isNestedLens ? 0.16 : 0.06,
          isNestedLens ? 0.23 : 0.09,
          isNestedLens ? 0.35 : 0.17
        );
      } else {
        gl.uniform3f(U.u_tintCol, 0.99, 0.995, 1.0);
      }

      gl.uniform4f(U.u_quadRect, qx, qy, qw, qh);
      gl.uniform2f(U.u_center, cx, cy);
      gl.uniform2f(U.u_half, halfW, halfH);
      gl.uniform1f(U.u_radius, cornerR);
      gl.uniform1f(U.u_zR, zR);
      gl.uniform1f(U.u_refract, refract);
      gl.uniform1f(U.u_chroma, REGULAR_GLASS_PRESET.chromAberration);
      gl.uniform1f(U.u_edgeHL, REGULAR_GLASS_PRESET.edgeHighlight);
      gl.uniform1f(U.u_fresnel, REGULAR_GLASS_PRESET.fresnel);
      gl.uniform1f(U.u_spec, REGULAR_GLASS_PRESET.specular);
      gl.uniform1f(U.u_shadowAlpha, shadowOpacity);
      gl.uniform1f(U.u_shadowSpread, REGULAR_GLASS_PRESET.shadowSpread * dpr);
      gl.uniform1f(U.u_shadowOffY, REGULAR_GLASS_PRESET.shadowOffsetY * dpr);
      gl.uniform1f(U.u_neon, neonVal);
      gl.uniform1f(U.u_time, t);
      gl.uniform1f(U.u_tintAlpha, tintAlpha);
      gl.uniform1f(U.u_isDark, isDark ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const renderFrame = (now: number) => {
      const t = (now - t0) / 1000;
      const isDark = themeRef.current === 'dark';

      // Smooth Apple-like neon fade interpolation
      const targetNeon = neonTargetRef.current;
      smoothNeon += (targetNeon - smoothNeon) * 0.14;
      if (Math.abs(targetNeon - smoothNeon) < 0.002) {
        smoothNeon = targetNeon;
      }

      // Re-rasterize live <main> UI only when dirty (throttled safely to 60fps)
      if (now - lastCaptureTime >= 16 && consumeSceneDirty()) {
        const captureScale = Math.min(dpr, 1.15);
        captureLiveMainScene(sceneCanvas, mainRef.current, isDark, vw, vh, captureScale);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sceneCanvas);
        lastCaptureTime = now;
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(prog);
      gl.uniform1i(U.u_bg, 0);
      gl.uniform2f(U.u_res, W, H);

      const panels = getPanelDescriptors();
      const drawOrder: GlassPanelId[] = [
        'header',
        'hdr-neon',
        'hdr-theme',
        'hdr-search',
        'hdr-account',
        'capsule',
        'pill',
      ];
      for (const id of drawOrder) {
        const desc = panels[id];
        if (!desc) continue;
        const isNested = id !== 'header' && id !== 'capsule';
        drawPanel(desc, isDark, t, smoothNeon, isNested);
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      mutationObserver?.disconnect();
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [mainRef, setWebglActive, getPanelDescriptors, markSceneDirty, consumeSceneDirty]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-20"
    />
  );
};
