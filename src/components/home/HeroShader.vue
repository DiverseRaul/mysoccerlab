<template>
  <!-- Organic flowing-aurora backdrop rendered by a raw-WebGL fragment shader.
       No external dependency. If WebGL is unavailable, the .heroshader--fallback
       class paints a static brand gradient so the hero never looks empty. -->
  <div ref="rootEl" class="heroshader" :class="{ 'heroshader--fallback': failed }" aria-hidden="true">
    <canvas ref="canvasEl" class="heroshader__canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  // 'desktop' = broad diagonal drift behind the pitch; 'mobile' = vertical aurora curtains.
  variant: { type: String, default: 'desktop' },
  // 0 = full cloud density; 1 = thinned right out (raises the noise thresholds so
  // the clouds shrink, not just fade). Driven by the hero scroll progress.
  fade: { type: Number, default: 0 }
})

const rootEl = ref(null)
const canvasEl = ref(null)
const failed = ref(false)

let gl = null
let program = null
let raf = 0
let startTime = 0
let running = false
let io = null
let ro = null
let visible = true
let onScreen = true
const uniforms = {}

// --- GLSL ---------------------------------------------------------------
const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

// Domain-warped value-noise FBM mapped to a green→teal→violet aurora. The
// `u_mode` uniform tilts the flow vertical (mobile) or broad-diagonal (desktop).
const FRAG = `
precision highp float;
uniform vec2  u_res;
uniform float u_time;
uniform vec3  u_accent;   // brand green, linear-ish 0..1
uniform float u_mode;     // 0 = desktop, 1 = mobile
uniform float u_dpr;
uniform float u_fade;     // 0 = full clouds, 1 = thinned out

// hash + value noise
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i+vec2(0.0,0.0)), hash(i+vec2(1.0,0.0)), u.x),
             mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  float aspect = u_res.x / max(u_res.y, 1.0);
  vec2 p = uv;
  p.x *= aspect;

  float t = u_time * 0.06;

  // Flow direction differs per device: mobile rises (curtains), desktop drifts.
  vec2 flow = mix(vec2(0.18, -1.0), vec2(1.0, -0.25), step(0.5, u_mode));

  // Domain warp — two layers of fbm offset by time give the "living" motion.
  vec2 q = vec2(fbm(p*1.6 + flow*t),
                fbm(p*1.6 + flow*t + vec2(5.2, 1.3)));
  vec2 r = vec2(fbm(p*2.2 + q*1.4 + flow*t*1.3 + vec2(1.7, 9.2)),
                fbm(p*2.2 + q*1.4 + flow*t*1.3 + vec2(8.3, 2.8)));
  float n = fbm(p*1.9 + r*1.6 + flow*t);

  // Palette: deep base → brand green → teal → soft violet highlight.
  vec3 base   = vec3(0.018, 0.027, 0.035);
  vec3 green  = u_accent;
  vec3 teal   = vec3(0.098, 0.776, 0.753);
  vec3 violet = vec3(0.486, 0.361, 1.0);

  // Raising the thresholds with u_fade shrinks the coloured zones so the clouds
  // thin out (less density), independent of the element's opacity.
  float fs = u_fade * 0.55;
  float dens = 1.0 - u_fade * 0.6;

  vec3 col = base;
  col = mix(col, green,  smoothstep(0.30 + fs, 0.78 + fs, n) * dens);
  col = mix(col, teal,   smoothstep(0.55 + fs, 0.95 + fs, n) * 0.7 * dens);
  col = mix(col, violet, smoothstep(0.74 + fs, 1.05 + fs, n) * 0.45 * dens);

  // Bright filaments along the warp ridges for that energetic shimmer.
  float ridge = smoothstep(0.62 + fs, 0.9 + fs, n) * (0.6 + 0.4*sin(u_time*0.7 + r.x*6.0));
  col += green * ridge * 0.35 * dens;

  // Gentle radial falloff so edges sink into the page background.
  vec2 c = uv - vec2(0.5, mix(0.42, 0.3, u_mode));
  c.x *= aspect;
  float vig = smoothstep(1.15, 0.15, length(c));
  col *= 0.35 + 0.65*vig;

  // Subtle film grain — kills banding on dark gradients, reads premium.
  float g = (hash(gl_FragCoord.xy + u_time) - 0.5) * 0.035;
  col += g;

  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`

// --- helpers ------------------------------------------------------------
function accentRGB () {
  // Read the live brand accent so a Pro custom accent recolours the shader too.
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim()
    const m = raw.match(/^#([0-9a-f]{6})$/i)
    if (m) {
      const int = parseInt(m[1], 16)
      return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255]
    }
  } catch (e) { /* fall through to default */ }
  return [0.298, 0.855, 0.612] // #4cda9c
}

function compile (type, src) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh)
    return null
  }
  return sh
}

function resize () {
  if (!gl || !canvasEl.value) return
  const cap = props.variant === 'mobile' ? 1.5 : 2
  const dpr = Math.min(window.devicePixelRatio || 1, cap)
  const w = Math.max(1, Math.round(rootEl.value.clientWidth * dpr))
  const h = Math.max(1, Math.round(rootEl.value.clientHeight * dpr))
  if (canvasEl.value.width !== w || canvasEl.value.height !== h) {
    canvasEl.value.width = w
    canvasEl.value.height = h
    gl.viewport(0, 0, w, h)
  }
  gl.uniform2f(uniforms.u_res, w, h)
  gl.uniform1f(uniforms.u_dpr, dpr)
}

function frame (now) {
  if (!running) return
  if (!startTime) startTime = now
  resize()
  gl.uniform1f(uniforms.u_time, (now - startTime) / 1000)
  gl.uniform3fv(uniforms.u_accent, accentRGB())
  gl.uniform1f(uniforms.u_mode, props.variant === 'mobile' ? 1 : 0)
  gl.uniform1f(uniforms.u_fade, Math.min(Math.max(props.fade || 0, 0), 1))
  gl.drawArrays(gl.TRIANGLES, 0, 6)
  raf = requestAnimationFrame(frame)
}

function play () {
  if (running || !gl) return
  if (!visible || !onScreen) return
  running = true
  raf = requestAnimationFrame(frame)
}
function pause () {
  running = false
  if (raf) cancelAnimationFrame(raf)
  raf = 0
}

function onVisibility () { visible = !document.hidden; visible ? play() : pause() }

// When the GL context is lost — whether we release it ourselves on unmount, the
// GPU resets, or the browser evicts the oldest of too many contexts — the canvas
// would otherwise paint the browser's gray "context lost" placeholder (a
// sad-face / broken-image box). Swallow the event and swap to the static CSS
// fallback gradient so that gray box never flashes on screen.
function onContextLost (e) {
  e.preventDefault()
  pause()
  failed.value = true
}

function init () {
  const canvas = canvasEl.value
  gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'low-power' })
    || canvas.getContext('experimental-webgl')
  if (!gl) { failed.value = true; return }

  canvas.addEventListener('webglcontextlost', onContextLost, false)

  const vs = compile(gl.VERTEX_SHADER, VERT)
  const fs = compile(gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) { failed.value = true; gl = null; return }

  program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { failed.value = true; gl = null; return }
  gl.useProgram(program)

  // Fullscreen triangle pair.
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1
  ]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(program, 'a_pos')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  uniforms.u_res = gl.getUniformLocation(program, 'u_res')
  uniforms.u_time = gl.getUniformLocation(program, 'u_time')
  uniforms.u_accent = gl.getUniformLocation(program, 'u_accent')
  uniforms.u_mode = gl.getUniformLocation(program, 'u_mode')
  uniforms.u_dpr = gl.getUniformLocation(program, 'u_dpr')
  uniforms.u_fade = gl.getUniformLocation(program, 'u_fade')

  resize()

  ro = new ResizeObserver(() => { if (running) resize() })
  ro.observe(rootEl.value)

  io = new IntersectionObserver((entries) => {
    onScreen = entries[0]?.isIntersecting ?? true
    onScreen ? play() : pause()
  }, { threshold: 0 })
  io.observe(rootEl.value)

  document.addEventListener('visibilitychange', onVisibility)
  play()
}

onMounted(() => {
  // Defer one frame so layout (hero height) is settled before sizing the canvas.
  requestAnimationFrame(init)
})

onBeforeUnmount(() => {
  pause()
  document.removeEventListener('visibilitychange', onVisibility)
  io?.disconnect()
  ro?.disconnect()
  if (gl && canvasEl.value) {
    // Hide the canvas BEFORE releasing the context. The route-leave transition
    // (mode="out-in") keeps this element painted for a frame or two while we
    // tear down; losing the context while it's still visible flashes the gray
    // "context lost" placeholder. A hidden canvas can't paint that placeholder.
    canvasEl.value.removeEventListener('webglcontextlost', onContextLost, false)
    canvasEl.value.style.visibility = 'hidden'
    const lose = gl.getExtension('WEBGL_lose_context')
    lose?.loseContext()
  }
  gl = null
})
</script>

<style scoped>
.heroshader {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.heroshader__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* WebGL unavailable → a static but on-brand flowing gradient so the hero
   still reads as designed rather than flat black. */
.heroshader--fallback {
  background:
    radial-gradient(120% 90% at 18% 8%, color-mix(in srgb, var(--color-accent) 36%, transparent), transparent 55%),
    radial-gradient(90% 80% at 88% 22%, color-mix(in srgb, #7c5cff 30%, transparent), transparent 60%),
    radial-gradient(120% 120% at 50% 120%, color-mix(in srgb, #19c6c0 24%, transparent), transparent 60%),
    #050608;
}
.heroshader--fallback .heroshader__canvas { display: none; }
</style>
