// 动.js（吹万·七天没有字，第 19 天 13:10）。梓韬 13:08："只能用视觉，用上一帧和下一帧之间、上一回合和下一回合之间有没有动画效果来表示一个事情发生状态的变化"；13:09"动画，音效，特效"。
// 这一份只管"这一步发生了什么"：每件事一个短动画 + 一个不同的声。index.html 在 act() 里把这一步的事塞进 FXEV，draw 带进 info.ev；画.js 每帧末尾叫 WeiDraw.fx(g, m, info, t)，t 从 0 走到 1（700ms）。
// 规矩一样没动；不写一个字。
(function (root) {
const C = 56;
const P = p => [p[0] * C + C / 2, p[1] * C + C / 2];
const ease = t => 1 - Math.pow(1 - t, 3);
const bell = t => Math.sin(Math.PI * Math.min(1, Math.max(0, t)));

function ring(g, x, y, r, col, a, w) { g.save(); g.globalAlpha = Math.max(0, a); g.strokeStyle = col; g.lineWidth = w || 3; g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, 7); g.stroke(); g.restore(); }
function dot(g, x, y, r, col, a) { g.save(); g.globalAlpha = Math.max(0, a); g.fillStyle = col; g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, 7); g.fill(); g.restore(); }
function rays(g, x, y, n, r0, r1, col, a, w, rot) { g.save(); g.globalAlpha = Math.max(0, a); g.strokeStyle = col; g.lineWidth = w || 2.5; g.lineCap = 'round'; for (let i = 0; i < n; i++) { const an = (rot || 0) + i * 2 * Math.PI / n; g.beginPath(); g.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0); g.lineTo(x + Math.cos(an) * r1, y + Math.sin(an) * r1); g.stroke(); } g.restore(); }
function bugHead(g, x, y, s, a) { g.save(); g.globalAlpha = Math.max(0, a); g.translate(x, y); g.scale(s, s); g.fillStyle = '#8fd16a'; g.beginPath(); g.ellipse(0, 3, 7, 9, 0, 0, 7); g.fill(); g.fillStyle = '#2e4d1f'; g.beginPath(); g.arc(0, -6, 4, 0, 7); g.fill(); g.strokeStyle = '#4d7a33'; g.lineWidth = 1.6; for (const s2 of [-1, 1]) { g.beginPath(); g.moveTo(s2 * 2, -9); g.lineTo(s2 * 6, -15); g.stroke(); } g.restore(); }
function puff(g, x, y, t, col, n, spread) { for (let i = 0; i < n; i++) { const an = i * 2.4 + 0.7, d = spread * ease(t) * (0.6 + 0.4 * ((i * 37) % 10) / 10); dot(g, x + Math.cos(an) * d, y + Math.sin(an) * d - 8 * t, 3.5 * (1 - t) + 1, col, 0.8 * (1 - t)); } }

// —— 声 ——：每件事一个短而不同的声（第 11 天围唱："点击和演奏的音效一样，分不清发生了什么"）
let AC = null;
function ac() { if (!AC) { try { AC = new (root.AudioContext || root.webkitAudioContext)(); } catch (e) { AC = false; } } return AC || null; }
function tone(f0, f1, dur, type, vol, delay) { const a = ac(); if (!a) return; const t0 = a.currentTime + (delay || 0); const o = a.createOscillator(), v = a.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur); v.gain.setValueAtTime(0.0001, t0); v.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.012); v.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(v); v.connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.02); }
function noise(dur, vol, hp, delay) { const a = ac(); if (!a) return; const t0 = a.currentTime + (delay || 0); const n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); const s = a.createBufferSource(); s.buffer = b; const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 1500; const v = a.createGain(); v.gain.value = vol || 0.12; s.connect(f); f.connect(v); v.connect(a.destination); s.start(t0); }
const SND = {
  ateMe:   () => { tone(520, 880, 0.09, 'triangle', 0.14); tone(880, 1320, 0.08, 'triangle', 0.1, 0.07); },   // 你吃到：两下往上的"啵啵"
  spit:    () => { tone(300, 160, 0.12, 'square', 0.06); noise(0.05, 0.05, 2500); },                         // 吐：低一点的"噗"
  lizAte:  () => { noise(0.07, 0.1, 900); noise(0.07, 0.1, 900, 0.11); },                                     // 它嚼：两下嚓嚓
  took:    () => { noise(0.1, 0.09, 600); tone(600, 900, 0.08, 'triangle', 0.1, 0.08); },                    // 掏到：刨一下 + 小啵
  digFail: () => { noise(0.1, 0.09, 600); tone(220, 150, 0.14, 'sine', 0.1, 0.09); },                        // 掏空：刨一下 + 往下掉的闷声
  born:    () => { noise(0.18, 0.05, 3000); tone(700, 1000, 0.06, 'triangle', 0.07, 0.12); },                 // 木头里窸窣 + 冒头
  wake:    () => { [523, 659, 784].forEach((f, i) => tone(f, f * 1.01, 0.16, 'triangle', 0.1, i * 0.07)); },  // 唤醒：三个音往上
  stop:    () => { tone(330, 110, 0.35, 'sine', 0.1); },                                                     // 缩进深处：一声往下沉
  empty:   () => { noise(0.25, 0.06, 400); },                                                                // 空了：一口灰
  swap:    () => { tone(392, 392, 0.12, 'sine', 0.1); tone(523, 523, 0.18, 'sine', 0.1, 0.1); },             // 让路：两个软音
  pounce:  () => { tone(180, 60, 0.25, 'sawtooth', 0.14); noise(0.12, 0.15, 300); },                         // 被扑
  win:     () => { [392, 494, 587, 784].forEach((f, i) => tone(f, f, 0.22, 'triangle', 0.11, i * 0.09)); },   // 回窝过关
  dusk:    () => { tone(220, 196, 0.8, 'sine', 0.08); },                                                     // 天黑
  heard:   () => { tone(1200, 1500, 0.05, 'sine', 0.05); },                                                  // 它听见了：一声细的
  bump:    () => { tone(140, 110, 0.06, 'square', 0.06); }                                                   // 撞墙
};
function play(ev) { if (!ev || ev._played) return; ev._played = true; for (const k of ev.snd || []) SND[k] && SND[k](); }

function fx(g, m, info, t) {
  const e = info && info.ev; if (!e) return;
  play(e);
  // 你吃到一只：身上一圈绿星往外散
  if (e.ateMe) { const [x, y] = P(e.ateMe); rays(g, x, y, 8, 14 + 10 * ease(t), 22 + 16 * ease(t), '#b6f08f', 1 - t, 3); ring(g, x, y, 16 + 14 * ease(t), '#8fd16a', 0.9 * (1 - t), 2.5); }
  // 它吃到一只：它嘴边橙色两下
  if (e.lizAte) { const [x, y] = P(e.lizAte); rays(g, x, y, 6, 12 + 8 * ease(t), 18 + 10 * ease(t), '#ffb36b', 1 - t, 3, 0.5); }
  // 掏到：你的手（一道蓝）伸进木头，叼着一只虫抽回来
  const same = e.log && e.pl && e.pl[0] === e.log[0] && e.pl[1] === e.log[1];
  // 站在木头上掏到：虫从木头里蹦起来，在头顶亮一下，落进你肚子
  if (e.took && same) { const [x, y] = P(e.log); const q = ease(t); const yy = y - 34 * bell(q) + 14 * q; bugHead(g, x, yy, 0.9 - 0.4 * q, 1 - 0.5 * q); if (t > 0.25 && t < 0.7) rays(g, x, y - 34, 7, 10, 18, '#b6f08f', bell((t - 0.25) / 0.45), 2.5); shake(g, x, y, t); }
  // 站在木头上掏空：手往下一探，木头里冒出一小口灰，深处那点闪一下暗
  if (e.digFail && same) { const [x, y] = P(e.log); puff(g, x, y - 6, t, '#8a8270', 7, 20); if (e.deep) ring(g, x, y, 10 + 6 * bell(t * 2), '#2a1a0c', 0.9, 4); }
  if (e.took && e.log && !same) { const [x0, y0] = P(e.pl), [x1, y1] = P(e.log); const k = t < 0.45 ? ease(t / 0.45) : 1 - ease((t - 0.45) / 0.55); arm(g, x0, y0, x1, y1, k); if (t >= 0.45) { const q = ease((t - 0.45) / 0.55); bugHead(g, x1 + (x0 - x1) * q, y1 + (y0 - y1) * q - 10 * bell(q), 0.8, 1 - 0.3 * q); } shake(g, x1, y1, t); }
  // 掏空：手伸进去，空着抽回来；木头里那个暗点一下一下闪暗
  if (e.digFail && e.log && !same) { const [x0, y0] = P(e.pl), [x1, y1] = P(e.log); const k = t < 0.45 ? ease(t / 0.45) : 1 - ease((t - 0.45) / 0.55); arm(g, x0, y0, x1, y1, k); if (e.deep) { ring(g, x1, y1, 7 + 4 * bell(t * 2), '#5a3a20', 0.9, 3); dot(g, x1, y1, 4, '#3d6a2a', 0.5 + 0.5 * bell(t)); } else puff(g, x1, y1, t, '#8a8270', 6, 18); }
  // 木头里又爬出一只：木头抖一下，一个虫头从木头里钻出来
  if (e.born && e.log) { const [x, y] = P(e.log); shake(g, x, y, t); bugHead(g, x + 10, y - 8 - 14 * ease(t), 0.5 + 0.5 * ease(t), 1); rays(g, x + 10, y - 22, 5, 6, 12, '#b6f08f', bell(t), 2); }
  // 吐进木头、深处那只醒了：一圈亮绿从木头中心炸开，两个虫头冒出来
  if (e.wake && e.log) { const [x, y] = P(e.log); ring(g, x, y, 6 + 40 * ease(t), '#b6f08f', 1 - t, 4); rays(g, x, y, 10, 10 + 12 * ease(t), 20 + 24 * ease(t), '#d8ffb8', 1 - t, 3); shake(g, x, y, t); bugHead(g, x - 10, y - 6 - 10 * ease(t), 0.7, ease(t)); bugHead(g, x + 10, y - 6 - 14 * ease(t), 0.7, ease(t)); }
  // 剩最后一只：它往深处一缩，一圈暗的往里收
  if (e.stop && e.log) { const [x, y] = P(e.log); ring(g, x, y, 30 * (1 - ease(t)) + 4, '#2a1a0c', 0.9, 4); bugHead(g, x, y - 6 + 10 * ease(t), 0.7 * (1 - ease(t)) + 0.2, 1 - t); }
  // 木头空了：一口灰
  if (e.empty && e.log) { const [x, y] = P(e.log); puff(g, x, y, t, '#8a8270', 9, 26); }
  // 认得你的让你过去：它身上一圈暖绿慢慢亮开，你们俩之间一道弧
  if (e.swap) { const [x, y] = P(e.swap), [a, b] = P(e.pl); const q = ease(t); ring(g, x, y, 18 + 12 * q, '#8fd16a', bell(t) * 0.9, 3); g.save(); g.globalAlpha = bell(t) * 0.7; g.strokeStyle = '#d8ffb8'; g.lineWidth = 2.5; g.setLineDash([4, 5]); g.beginPath(); const mx = (x + a) / 2 + (b - y) * 0.35, my = (y + b) / 2 - (a - x) * 0.35; g.moveTo(x, y); g.quadraticCurveTo(mx, my, a, b); g.stroke(); g.restore(); for (let i = 0; i < 3; i++) dot(g, x - 8 + i * 8, y - 22 - 16 * q - i * 3, 3, '#b6f08f', 1 - t); }
  // 被扑：整块红闪一下，扑到的那格一个红圈收紧
  if (e.dead) { g.save(); g.globalAlpha = 0.35 * (1 - t); g.fillStyle = '#ff2a1a'; g.fillRect(0, 0, m.w * C, m.h * C); g.restore(); const [x, y] = P(e.dead); ring(g, x, y, 40 * (1 - ease(t)) + 14, '#ff3b3b', 1, 5); }
  // 回窝过关：窝上一圈一圈金色往外，窝口亮
  if (e.win) { const [x, y] = P(e.win); for (let i = 0; i < 3; i++) { const q = Math.max(0, Math.min(1, t * 1.4 - i * 0.2)); ring(g, x, y, 14 + 70 * ease(q), '#ffd970', 1 - q, 4 - i); } dot(g, x, y + 6, 12, '#ffe9a8', 0.6 * bell(t)); }
}
function arm(g, x0, y0, x1, y1, k) { if (k <= 0) return; const x = x0 + (x1 - x0) * k * 0.85, y = y0 + (y1 - y0) * k * 0.85; g.save(); g.strokeStyle = '#5fb3ff'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x, y); g.stroke(); g.fillStyle = '#9fd3ff'; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); g.restore(); }
function shake(g, x, y, t) { const a = bell(t); g.save(); g.globalAlpha = 0.8 * a; g.strokeStyle = '#d9a86a'; g.lineWidth = 2; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x + s * 24, y - 6); g.lineTo(x + s * 30, y - 9); g.moveTo(x + s * 24, y + 4); g.lineTo(x + s * 31, y + 5); g.stroke(); } g.restore(); }

root.WeiDraw = root.WeiDraw || {};
root.WeiDraw.fx = fx;
root.WeiFX = { SND, play };
})(typeof window !== 'undefined' ? window : globalThis);
