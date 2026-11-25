/**
 * Exact Regular Glass WebGL 1 / GLSL ES 1.0 shader parameters and source.
 * Preserves the biconvex bevel height field, finite-difference normals,
 * dual-surface Snell refraction (IOR 1.5), RGB chromatic aberration,
 * Fresnel rim, inner stroke/glow, two-term shadow, and optional cycling neon rim.
 */

export const REGULAR_GLASS_PRESET = {
  cornerRadius: 40,
  zRadius: 40,
  refraction: 0.69,
  chromAberration: 0.05,
  edgeHighlight: 0.05,
  specular: 0.0,
  fresnel: 1.0,
  shadowOpacity: 0.0,
  shadowSpread: 10,
  shadowOffsetY: 1,
} as const;

export const LIQUID_GLASS_VS = `
attribute vec2 a_pos;
uniform vec2 u_res;
uniform vec4 u_quadRect; // x, y, w, h in top-left device px

void main() {
  vec2 pxPos = u_quadRect.xy + a_pos * u_quadRect.zw;
  vec2 ndc = vec2(
    (pxPos.x / max(u_res.x, 1.0)) * 2.0 - 1.0,
    1.0 - (pxPos.y / max(u_res.y, 1.0)) * 2.0
  );
  gl_Position = vec4(ndc, 0.0, 1.0);
}
`;

export const LIQUID_GLASS_FS = `
precision highp float;

uniform sampler2D u_bg;        // live captured SeatEase viewport texture
uniform vec2  u_res;           // canvas size in device px
uniform vec2  u_center;        // panel centre, device px (top-left origin)
uniform vec2  u_half;          // panel half-size, device px
uniform float u_radius;        // corner radius, device px
uniform float u_zR;            // bevel depth, device px
uniform float u_refract;
uniform float u_chroma;
uniform float u_edgeHL;
uniform float u_fresnel;
uniform float u_spec;
uniform float u_shadowAlpha;
uniform float u_shadowSpread;  // device px
uniform float u_shadowOffY;    // device px
uniform float u_neon;          // 0 = pure clear glass, 1 = neon rim + halo
uniform float u_time;
uniform vec3  u_tintCol;       // subtle theme-aware optical tint for text legibility
uniform float u_tintAlpha;
uniform float u_isDark;        // 0.0 light, 1.0 dark

// Rounded-rectangle signed distance (negative inside)
float rrSDF(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return min(max(q.x, q.y), 0.0) + length(max(q, vec2(0.0))) - r;
}

// Pill / biconvex height field: smooth peak at centre, steep at edges.
float bevelH(float d, float zR) {
  if (d <= 0.0) return 0.0;
  if (d >= zR)  return zR;
  return sqrt(d * (2.0 * zR - d));
}

// Sample the live viewport background texture in screen-UV space (y = 1 at top).
vec3 bgSample(vec2 suv) {
  vec2 clamped = clamp(suv, vec2(0.001), vec2(0.999));
  return texture2D(u_bg, clamped).rgb;
}

// Smooth iq-style cosine palette used for the neon colour cycle.
vec3 neonPalette(float t) {
  return 0.5 + 0.5 * cos(6.2831853 * (vec3(0.0, 0.33, 0.67) + t));
}

void main() {
  // Device-pixel coordinates with a top-left origin.
  vec2 px  = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  vec2 suv = vec2(px.x / u_res.x, 1.0 - px.y / u_res.y);
  vec2 lp  = px - u_center;
  vec2 hf  = u_half;
  float r  = min(u_radius, min(hf.x, hf.y));
  float sdf = rrSDF(lp, hf, r);
  float maxD = max(min(hf.x, hf.y), 1.0);
  float zR = min(u_zR, maxD * 1.15);

  // Neon colour, slowly cycling; varies gently across the screen.
  vec3 neonCol = neonPalette(u_time * 0.08 + suv.x * 0.35 + suv.y * 0.2);
  neonCol = mix(vec3(1.0), neonCol, 0.9);

  // ── Outside the panel: completely transparent unless neon halo is active (zero black shadow) ──
  float haloStrength = exp(-max(sdf, 0.0) * 0.065) * u_neon * 0.55;
  vec3 outsideRGB = neonCol * haloStrength;
  float outsideAlpha = clamp(haloStrength * 0.85, 0.0, 0.85);

  // Early discard when completely invisible outside bounds
  if (sdf > 0.5 && outsideAlpha < 0.002) {
    discard;
  }

  // ── Inside the panel: height field -> normal -> dual-surface Snell refraction ──
  float inside = max(-sdf, 0.0);
  float depth  = smoothstep(0.0, max(zR, 1.0), inside);
  float edge   = smoothstep(maxD * 0.35, 0.0, inside);

  float e = 2.0;
  float hC = bevelH(inside, zR);
  float hR = bevelH(-rrSDF(lp + vec2(e, 0.0), hf, r), zR);
  float hL = bevelH(-rrSDF(lp - vec2(e, 0.0), hf, r), zR);
  float hU = bevelH(-rrSDF(lp + vec2(0.0, e), hf, r), zR);
  float hD = bevelH(-rrSDF(lp - vec2(0.0, e), hf, r), zR);
  vec2 hGrad = vec2(hR - hL, hU - hD) / (2.0 * e);
  vec3 N = normalize(vec3(-hGrad, 1.0));

  // Dual-surface refraction (biconvex model, IOR = 1.5).
  float ior = 1.5;
  float refrPow = 1.0 - 1.0 / ior; // ~0.3333
  float thickNorm = (hC * 2.0) / max(zR * 2.0, 1.0);
  vec2 exitRefr    = hGrad * refrPow;
  vec2 entryRefr   = hGrad * refrPow;
  vec2 throughRefr = entryRefr * thickNorm * 0.5;
  vec2 refrPx = (exitRefr + entryRefr + throughRefr) * u_refract * 30.0;
  vec2 centerDir = -lp / max(hf, vec2(1.0));
  refrPx += centerDir * u_refract * 4.0 * depth;

  vec2 pxToUV = vec2(1.0, -1.0) / u_res;
  vec2 base = suv + refrPx * pxToUV;

  // Chromatic aberration: R/G/B sampled with a normal-driven offset.
  float caS = u_chroma * 18.0 * (edge * 0.7 + 0.3) * 2.0;
  vec2 caD = N.xy * caS * pxToUV;
  vec3 col = vec3(
    bgSample(base + caD).r,
    bgSample(base).g,
    bgSample(base - caD).b
  );

  // Subtle core clarity & theme-aware optical tint for readable foreground controls
  col *= 1.0 + 0.04 * depth;
  col = mix(col, u_tintCol, u_tintAlpha);

  // Fresnel (grazing-angle reflection)
  float fres = pow(1.0 - abs(N.z), 4.0) * u_fresnel;

  // Specular (Blinn-Phong; 0.0 by default in Regular Glass preset)
  vec3 V  = vec3(0.0, 0.0, 1.0);
  vec3 H1 = normalize(normalize(vec3(0.4, 0.7, 1.0)) + V);
  float sp1 = pow(max(dot(N, H1), 0.0), 90.0);
  float totalSpec = sp1 * u_spec;

  // Inner stroke + rim + inner glow + environment reflection (crystal clear, no dark outline)
  float borderWidth = 1.5;
  float innerStroke = smoothstep(-borderWidth - 1.0, -borderWidth, sdf)
                    * (1.0 - smoothstep(-1.0, 0.0, sdf));
  float topBias = 0.5 + 0.5 * (-lp.y / max(hf.y, 1.0));
  innerStroke *= (0.45 + 0.55 * topBias);
  float rim = edge * u_edgeHL * 0.25;
  float innerGlow = smoothstep(5.0, 0.0, inside) * u_edgeHL * 0.18;
  float envRefl = (N.y * 0.5 + 0.5) * fres * 0.1;

  // Luminous crystal glass border highlight in both light & dark modes (zero black/dark stroke)
  float strokeBoost = mix(0.45, 0.58, u_isDark);
  vec3 strokeCol = mix(vec3(0.84, 0.91, 0.98), vec3(1.0), u_isDark);

  vec3 glass = col;
  glass += vec3(totalSpec);
  glass += vec3(rim + innerGlow);
  glass = mix(glass, strokeCol, clamp(innerStroke * strokeBoost, 0.0, 0.52));
  glass += vec3(innerStroke * u_edgeHL * 0.6);
  glass += vec3(envRefl);
  glass = mix(glass, vec3(1.0), fres * mix(0.22, 0.24, u_isDark));

  // Neon: cycling coloured rim band along the bevel edge (0 when off)
  float band = exp(-abs(sdf + 1.0) * 0.35);
  glass += neonCol * band * u_neon * 0.55;
  glass  = mix(glass, glass + neonCol * 0.18, u_neon * edge);

  // ── Anti-aliased premultiplied composite ──
  float mask = 1.0 - smoothstep(-1.5, 0.5, sdf);
  vec3 finalRGB = mix(outsideRGB, clamp(glass, 0.0, 1.0), mask);
  float finalAlpha = mix(outsideAlpha, 1.0, mask);
  gl_FragColor = vec4(finalRGB, finalAlpha);
}
`;
