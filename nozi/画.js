// 喂它一口的画面（第二个醒的，第 14 天 09:50）。梓韬看完录像说"画面过于简陋""射线检测用了比较难以理解的方式，还不如之前明确地有格子的一个状态"。
// 改成一格一格的：它看得见的格子涂黄；每回合谁从哪动到哪画淡淡的拖影，动作用 0.25 秒滑过去；它头上冒字：! 盯上你、? 听见了转头、?? 在找你、嚼 2 在嚼。
(function (root) {
const C = 56;            // 一格多大
const COL = {
  floor: '#2b2d25', floor2: '#30322a', wall: '#14150f', wallTop: '#4a4b40',
  sight: 'rgba(245,215,130,0.20)', sightEdge: 'rgba(245,215,130,0.0)',   /* 无字：视线是一道淡光，不画格子边 */
  me: '#5fb3ff', liz: '#d9543a', lizBelly: '#f08a5d', bug: '#8fd16a', nest: '#5fb3ff',   /* 无字：窝跟你同一个颜色 */
  drop: 'rgba(143,209,106,0.9)', trail: 'rgba(255,255,255,0.18)', dead: '#ff3b3b'
};
const DV = { U: [0, -1], R: [1, 0], D: [0, 1], L: [-1, 0] };

function cx(x) { return x * C + C / 2; }

function drawFloor(g, m) {
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const wall = m.wall.has(x + ',' + y);
    g.fillStyle = wall ? COL.wall : ((x + y) % 2 ? COL.floor : COL.floor2);
    g.fillRect(x * C, y * C, C, C);
    if (wall) {   // 墙顶一条亮边，像有高度
      g.fillStyle = COL.wallTop; g.fillRect(x * C + 2, y * C + 2, C - 4, 6);
    }
  }
}

function drawNest(g, p) {
  const X = cx(p[0]), Y = cx(p[1]);
  g.strokeStyle = COL.nest; g.lineWidth = 4;
  g.beginPath(); g.arc(X, Y + 4, C * 0.32, Math.PI, 0); g.lineTo(X + C * 0.32, Y + C * 0.28); g.lineTo(X - C * 0.32, Y + C * 0.28); g.closePath(); g.stroke();
  g.fillStyle = '#0b0a10'; g.beginPath(); g.ellipse(X, Y + 12, C * 0.27, C * 0.14, 0, 0, 7); g.fill();   // 无字：窝是个洞
}

function drawSight(g, m, lz) {
  const [dx, dy] = DV[lz.face];
  let x = lz.pos[0] + dx, y = lz.pos[1] + dy;
  while (x >= 0 && y >= 0 && x < m.w && y < m.h && !m.wall.has(x + ',' + y)) {
    g.fillStyle = COL.sight; g.fillRect(x * C + 1, y * C + 1, C - 2, C - 2);
    g.strokeStyle = COL.sightEdge; g.lineWidth = 1; g.strokeRect(x * C + 1.5, y * C + 1.5, C - 3, C - 3);
    x += dx; y += dy;
  }
  // 到墙为止：在挡住的那面墙上画一道短线
  if (x >= 0 && y >= 0 && x < m.w && y < m.h) {
    g.strokeStyle = COL.sightEdge; g.lineWidth = 3; g.beginPath();
    const bx = cx(x) - dx * C / 2, by = cx(y) - dy * C / 2;
    if (dx) { g.moveTo(bx, by - C * 0.35); g.lineTo(bx, by + C * 0.35); } else { g.moveTo(bx - C * 0.35, by); g.lineTo(bx + C * 0.35, by); }
    g.stroke();
  }
}

function drawBug(g, X, Y, a, mine) {
  g.globalAlpha = a == null ? 1 : a;
  if (mine) { g.strokeStyle = COL.me; g.lineWidth = 3; g.beginPath(); g.arc(X, Y, 17, 0, 7); g.stroke(); }   // 第二个 第 16 天 01:46 页92你吐的：你吐出去的虫带一圈你的颜色，一直到被谁吃掉（多7b：'分不清吃掉的是我吐的还是原先那只'）
  g.strokeStyle = '#4d7a33'; g.lineWidth = 2;
  for (const s of [-1, 1]) for (const k of [-6, 0, 6]) { g.beginPath(); g.moveTo(X, Y + k); g.lineTo(X + s * 13, Y + k + (k ? Math.sign(k) * 3 : 0)); g.stroke(); }
  g.fillStyle = COL.bug; g.beginPath(); g.ellipse(X, Y, 8, 11, 0, 0, 7); g.fill();
  g.fillStyle = '#2e4d1f'; g.beginPath(); g.arc(X, Y - 10, 4, 0, 7); g.fill();
  g.globalAlpha = 1;
}

function drawMe(g, X, Y, belly, pf) {
  if (root.WeiDraw && root.WeiDraw.ghost) { g.save(); g.globalAlpha = 0.5; const c0 = COL.me; COL.me = '#9a9a9a'; root.WeiDraw.ghost = false; try { drawMe(g, X, Y, 0, pf); } finally { root.WeiDraw.ghost = true; COL.me = c0; g.restore(); } return; }   // 第四个 页168你是它：你那天的样子画成半透明的灰，肚子里的虫不画
  if (pf && false) {   // 无字：脸就是小蜥蜴的头，不另画尖  // 10:28 你的朝向（第一个并的'吐朝'：吐在你脸前一格）：圆边上一个小尖
    const [dx, dy] = DV[pf];
    g.fillStyle = COL.me; g.beginPath();
    g.moveTo(X + dx * C * 0.44, Y + dy * C * 0.44);
    g.lineTo(X + dx * C * 0.2 - dy * C * 0.16, Y + dy * C * 0.2 + dx * C * 0.16);
    g.lineTo(X + dx * C * 0.2 + dy * C * 0.16, Y + dy * C * 0.2 - dx * C * 0.16);
    g.closePath(); g.fill();
  }
  { const ang = { R: 0, D: Math.PI / 2, L: Math.PI, U: -Math.PI / 2 }[pf || 'R'];   // 无字：'我'画成一只蓝色小蜥蜴，肚子里的虫在肚子里鼓起来
    g.save(); g.translate(X, Y); g.rotate(ang); g.scale(0.82, 0.8 + 0.13 * belly);
    g.fillStyle = COL.me; g.strokeStyle = COL.me; g.lineWidth = 3.4;
    for (const s2 of [-1, 1]) { g.beginPath(); g.moveTo(4, s2 * 7); g.lineTo(11, s2 * 16); g.stroke(); g.beginPath(); g.moveTo(-10, s2 * 7); g.lineTo(-17, s2 * 16); g.stroke(); }
    g.beginPath(); g.moveTo(-22, 0); g.quadraticCurveTo(-34, -10, -30, 8); g.stroke();
    g.beginPath(); g.moveTo(-22, 0); g.quadraticCurveTo(-12, -11 - belly * 2, 6, -9); g.quadraticCurveTo(26, -6, 26, 0); g.quadraticCurveTo(26, 6, 6, 9); g.quadraticCurveTo(-12, 11 + belly * 2, -22, 0); g.fill();
    g.fillStyle = '#0d2236'; g.beginPath(); g.arc(16, -4.5, 2.6, 0, 7); g.arc(16, 4.5, 2.6, 0, 7); g.fill();
    for (let i = 0; i < belly; i++) { const bx = -6 - i * 9 + (belly - 1) * 4.5; g.fillStyle = COL.bug; g.beginPath(); g.ellipse(bx, 0, 4.2, 5.2, 0, 0, 7); g.fill(); g.strokeStyle = '#2e4d1f'; g.lineWidth = 1.2; g.stroke(); }
    g.restore(); }
}

function drawLiz(g, X, Y, face, a, eyes, hun) {   // 第二个·页11 20:15（页28肚子量过）：hun 给了就按它画肚子大小，吃饱 8 一回合瘪一格   // eyes：'眯' 吃饱了眯着眼 / '睁' 饱劲刚过、眼睛一下睁圆（第二个·页11 18:45，第一个'睁眼'要画到格子上）
  const ang = { R: 0, D: Math.PI / 2, L: Math.PI, U: -Math.PI / 2 }[face];
  g.save(); g.translate(X, Y); g.rotate(ang); g.globalAlpha = a == null ? 1 : a; if (hun != null) g.scale(1, 0.62 + hun * 0.11);   // 无字：饿了瘦成一条，吃饱鼓成一团
  g.fillStyle = COL.liz;
  g.beginPath(); g.moveTo(-24, 0); g.lineTo(-10, -9); g.lineTo(8, -10); g.lineTo(24, 0); g.lineTo(8, 10); g.lineTo(-10, 9); g.closePath(); g.fill();   // 身子，尖的一头是脸
  g.fillStyle = COL.lizBelly; g.beginPath(); if (hun == null) g.ellipse(-2, 0, 10, 5, 0, 0, 7); else g.ellipse(-2, 0, 5 + hun * 1.6, 2.5 + hun * 0.9, 0, 0, 7); g.fill();
  if (eyes === '眯') { g.strokeStyle = '#111'; g.lineWidth = 2.6; for (const s of [-5, 5]) { g.beginPath(); g.moveTo(10, s); g.lineTo(18, s + (s > 0 ? -1.5 : 1.5)); g.stroke(); } }   // 眯成两道缝
  else if (eyes === '睁') { g.fillStyle = '#fff4b0'; g.beginPath(); g.arc(14, -5, 5, 0, 7); g.arc(14, 5, 5, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(14, -5, 2.8, 0, 7); g.arc(14, 5, 2.8, 0, 7); g.fill(); }
  else { g.fillStyle = '#111'; g.beginPath(); g.arc(14, -5, 2.6, 0, 7); g.arc(14, 5, 2.6, 0, 7); g.fill(); }   // 眼睛
  g.strokeStyle = COL.liz; g.lineWidth = 3;
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(4, s * 8); g.lineTo(10, s * 17); g.stroke(); g.beginPath(); g.moveTo(-10, s * 8); g.lineTo(-16, s * 17); g.stroke(); }
  g.beginPath(); g.moveTo(-24, 0); g.quadraticCurveTo(-32, 8, -26, 14); g.stroke();   // 尾巴
  g.restore();
}

function bubble(g, X, Y, text, color) {
  if (text === '嚼' || text === '扒' || text === '逃') {   // 无字：头上不写字，画它在干嘛
    const T = (typeof performance !== 'undefined' ? performance.now() : 0) / 1000, by = Y - C * 0.62;
    g.save();
    if (text === '嚼') {   // 嘴边一只虫被咬掉一半，碎屑往外蹦
      g.fillStyle = COL.bug; g.beginPath(); g.ellipse(X, by, 6, 8, 0, 0, Math.PI); g.fill();
      g.fillStyle = '#c8e88a'; for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i - 1.5) * 0.7, r = 9 + 4 * ((T * 3 + i * 0.3) % 1); g.beginPath(); g.arc(X + Math.cos(a) * r, by + Math.sin(a) * r, 2, 0, 7); g.fill(); }
    } else if (text === '扒') {   // 三道爪印一下一下划
      g.strokeStyle = '#e0c070'; g.lineWidth = 3; g.lineCap = 'round'; const k = (T * 2) % 1;
      for (const d of [-7, 0, 7]) { g.beginPath(); g.moveTo(X + d - 4, by - 9); g.lineTo(X + d - 4 + 8 * k, by - 9 + 16 * k); g.stroke(); }
    } else {   // 逃：身后几道速度线
      g.strokeStyle = '#cccccc'; g.lineWidth = 2.5; g.lineCap = 'round';
      for (const d of [-8, 0, 8]) { g.beginPath(); g.moveTo(X - 14, by + d); g.lineTo(X + 10, by + d); g.stroke(); }
    }
    g.restore(); return;
  }
  g.font = 'bold 15px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const w = Math.max(24, g.measureText(text).width + 12);
  g.fillStyle = color; g.beginPath();
  if (g.roundRect) g.roundRect(X - w / 2, Y - C * 0.72, w, 22, 6); else g.rect(X - w / 2, Y - C * 0.72, w, 22);
  g.fill(); g.fillStyle = '#111'; g.fillText(text, X, Y - C * 0.72 + 11);
}

function arrowTrail(g, a, b) {
  if (!a || !b || (a[0] === b[0] && a[1] === b[1])) return;
  g.strokeStyle = COL.trail; g.lineWidth = 8; g.lineCap = 'round';
  g.beginPath(); g.moveTo(cx(a[0]), cx(a[1])); g.lineTo(cx(b[0]), cx(b[1])); g.stroke(); g.lineCap = 'butt';
}

const lerp = (a, b, t) => a + (b - a) * t;
function at(a, b, t) { return b ? [lerp(cx(a[0]), cx(b[0]), t), lerp(cx(a[1]), cx(b[1]), t)] : [cx(a[0]), cx(a[1])]; }

// 画一帧。info：{prev, st, dead, drop, over, heard, spit}；t：0..1 动画进度
// 第 14 天 10:00 梓韬："哪怕只有一两帧，动画还有这种识别的表现是有必要存在的，包括方向它是如何变化的"；
// 又问第一关为什么第一次丢了又看见、第二次没看见。所以加了：脚步声的一圈（3 格内它听得见）、转头的过程、
// 盯上你那一下的红线、它去找你时你刚才那格画一个淡淡的你、找到那格没看见时冒"没了"。
const ANG = { R: 0, D: Math.PI / 2, L: Math.PI, U: -Math.PI / 2 };
const cl = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => 1 - (1 - v) * (1 - v);
function seg(t, a, b) { return cl((t - a) / (b - a)); }
function turn(a, b, k) { let d = b - a; while (d > Math.PI + 1e-6) d -= 2 * Math.PI; while (d < -Math.PI + 1e-6) d += 2 * Math.PI; return a + d * k; }
const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];

function drawSightCells(g, m, pos, face, upto, alpha, block) {   // upto：画到第几格（动画里一格一格往外伸）；block：另一只站的格子，视线画到它身上就停（第二个 11:27 页69穿身）
  const [dx, dy] = DV[face]; let x = pos[0] + dx, y = pos[1] + dy, k = 0;
  g.globalAlpha = alpha;
  while (x >= 0 && y >= 0 && x < m.w && y < m.h && !m.wall.has(x + ',' + y)) {
    if (k >= upto) { g.globalAlpha = 1; return; }
    g.fillStyle = COL.sight; g.fillRect(x * C + 1, y * C + 1, C - 2, C - 2);
    g.strokeStyle = COL.sightEdge; g.lineWidth = 1; g.strokeRect(x * C + 1.5, y * C + 1.5, C - 3, C - 3);
    if (block && x === block[0] && y === block[1]) { g.globalAlpha = 1; return; }
    x += dx; y += dy; k++;
  }
  if (x >= 0 && y >= 0 && x < m.w && y < m.h) {
    g.strokeStyle = COL.sightEdge; g.lineWidth = 3; g.beginPath();
    const bx = cx(x) - dx * C / 2, by = cx(y) - dy * C / 2;
    if (dx) { g.moveTo(bx, by - C * 0.35); g.lineTo(bx, by + C * 0.35); } else { g.moveTo(bx - C * 0.35, by); g.lineTo(bx + C * 0.35, by); }
    g.stroke();
  }
  g.globalAlpha = 1;
}

// 一圈声音：离出声那格 1、2、3 格（横竖加起来算）的格子一层一层亮一下。它在这圈里、又闲着，就会转头。
function drawSound(g, m, q, t, color) {   // 无字：一圈菱形的波往外荡三格（隔着墙也荡），不再每格画一个圈
  const X = cx(q[0]), Y = cx(q[1]);
  for (let d = 1; d <= 3; d++) {
    const a = Math.sin(Math.PI * seg(t, (d - 1) * 0.1, (d - 1) * 0.1 + 0.35));
    if (a <= 0) continue;
    const r = C * (d + 0.45);
    g.globalAlpha = 0.5 * a; g.strokeStyle = color; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(X, Y - r); g.lineTo(X + r, Y); g.lineTo(X, Y + r); g.lineTo(X - r, Y); g.closePath(); g.stroke();
  }
  g.globalAlpha = 1;
}

function drawEar(g, p, t, color, k = 1) {   // 第二个 13:05 页72耳朵：它听见了，身上亮一圈
  const a = k * Math.sin(Math.PI * t); if (a <= 0) return;
  g.save(); g.globalAlpha = 0.9 * a; g.strokeStyle = color; g.lineWidth = 4;
  g.beginPath(); g.arc(cx(p[0]), cx(p[1]), C * (0.5 + 0.12 * t), 0, 7); g.stroke();
  g.lineWidth = 2; g.globalAlpha = 0.5 * a;
  g.beginPath(); g.arc(cx(p[0]), cx(p[1]), C * (0.66 + 0.12 * t), 0, 7); g.stroke();
  g.restore();
}

function ghostMe(g, p, a) {   // 它记得你在这儿
  const X = cx(p[0]), Y = cx(p[1]);
  g.globalAlpha = a * 0.45; g.fillStyle = COL.me; g.beginPath(); g.arc(X, Y, C * 0.3, 0, 7); g.fill();
  g.globalAlpha = a; g.setLineDash([4, 4]); g.strokeStyle = '#bfe3ff'; g.lineWidth = 2.5;
  g.beginPath(); g.arc(X, Y, C * 0.3, 0, 7); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#e8f4ff'; g.font = 'bold 20px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', X, Y + 1);
  g.globalAlpha = 1;
}

function drawLizA(g, X, Y, ang, a, sc, eyes, hun) {   // drawLiz 按角度画，sc 是放大（盯上你那一下跳一下）
  g.save(); g.translate(X, Y); g.scale((sc || 1) * 1.22, (sc || 1) * 1.22);   // 无字：它比你大一号
  g.translate(-X, -Y);
  const f = 'R'; const save = drawLiz;
  // 借 drawLiz 的样子：先转到 ang 再按朝右画
  g.translate(X, Y); g.rotate(ang); g.translate(-X, -Y);
  save(g, X, Y, f, a, eyes, hun);
  g.restore();
}


function key(g, x, y, w, h, lab, a) {   // 无字：粉笔画的一个键帽
  g.save(); g.globalAlpha = a; g.strokeStyle = '#e8e4d8'; g.lineWidth = 1.6;
  if (g.roundRect) { g.beginPath(); g.roundRect(x, y, w, h, 4); g.stroke(); } else g.strokeRect(x, y, w, h);
  g.fillStyle = '#e8e4d8'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(lab, x + w / 2, y + h / 2 + 1);
  g.restore();
}
function drawChalk(g, m, a) {   // 无字：第 1 天开局，起点头顶那排墙上用粉笔画着按键（以撒第一间屋子），走开就淡掉
  if (!(a > 0) || !m.start) return;
  const X = m.start[0] * C + C / 2, Y = m.start[1] * C - C + 4, k = 17;
  key(g, X - k / 2, Y, k, k, '↑', a); key(g, X - k * 1.5 - 2, Y + k + 2, k, k, '←', a); key(g, X - k / 2, Y + k + 2, k, k, '↓', a); key(g, X + k / 2 + 2, Y + k + 2, k, k, '→', a);
  key(g, X + k * 2.2, Y + k + 2, k * 2.4, k, '', a);   // 空格：等一下
  g.save(); g.globalAlpha = a; g.strokeStyle = '#e8e4d8'; g.lineWidth = 1.4; const zx = X + k * 3.4, zy = Y + k * 0.45; g.beginPath(); g.arc(zx, zy, 6, 0, 7); g.moveTo(zx, zy); g.lineTo(zx, zy - 4); g.moveTo(zx, zy); g.lineTo(zx + 3, zy); g.stroke(); g.restore();   // 空格上面画个小钟：等
}

function frame(cv, m, info, t) {
  const g = cv.getContext('2d');
  cv.width = m.w * C; cv.height = m.h * C;
  drawFloor(g, m); drawNest(g, m.nest);
  drawChalk(g, m, root.WeiDraw && root.WeiDraw.chalk);
  { const X = cx(m.nest[0]), Y = cx(m.nest[1]) - 1, n = m.need || 0;   // 无字：窝口上面几个虚线小圈，要带回去几只
    g.save(); g.setLineDash([3, 3]); g.strokeStyle = COL.bug; g.lineWidth = 1.6;
    for (let i = 0; i < n; i++) { g.beginPath(); g.ellipse(X - (n - 1) * 7 + i * 14, Y, 4.5, 6, 0, 0, 7); g.stroke(); }
    g.restore(); }
  const { prev, st, dead, drop } = info;
  // 第二个 第 15 天 01:52 页45邻居：两只的时候，各自的地淡淡涂一层它的颜色，石头画一块灰石（之间三：地画成跟它同一个记号，人才读出'谁在自家附近谁横'）
  if (st.lzB && root.WeiSim && root.WeiSim.lands) {
    const L = root.WeiSim.lands(m);
    [[L.a, 'rgba(217,84,58,0.16)'], [L.b, 'rgba(63,184,168,0.18)']].forEach(([set, c]) => { g.fillStyle = c; set.forEach(k => { const [x, y] = k.split(',').map(Number); g.fillRect(x * C, y * C, C, C); }); });
  }
  [m.post, m.postB].forEach(p => { if (!p) return; g.fillStyle = '#77776a'; g.beginPath(); g.ellipse(cx(p[0]), cx(p[1]) + 4, C * 0.44, C * 0.32, 0, 0, 7); g.fill(); g.fillStyle = '#93938a'; g.beginPath(); g.ellipse(cx(p[0]) - 4, cx(p[1]) - 1, C * 0.3, C * 0.18, 0, 0, 7); g.fill(); });   // 第二个 第 15 天 09:50：一只的张也画石头（以前只有两只的张画），大一点、亮一点，它蹲着也露一圈边。仇1、仇3、仇4 都说'石头认不出来，靠字才知道它回石头了'
  (m.cracks || []).forEach(q => {   // 第一个 17:48 '扒'：石缝画成几道深色裂纹；它扒过的缝上加三道爪印
    const X = q[0] * C, Y = q[1] * C;
    g.strokeStyle = '#3b3326'; g.lineWidth = 3; g.beginPath();
    g.moveTo(X + C * 0.2, Y + C * 0.35); g.lineTo(X + C * 0.45, Y + C * 0.55); g.lineTo(X + C * 0.8, Y + C * 0.45);
    g.moveTo(X + C * 0.45, Y + C * 0.55); g.lineTo(X + C * 0.5, Y + C * 0.8); g.stroke();
    if ((st.marks || []).some(r => r[0] === q[0] && r[1] === q[1])) {
      g.strokeStyle = '#c96a4a'; g.lineWidth = 2; g.beginPath();
      for (let i = 0; i < 3; i++) { g.moveTo(X + C * (0.3 + i * 0.15), Y + C * 0.15); g.lineTo(X + C * (0.22 + i * 0.15), Y + C * 0.35); }
      g.stroke();
    }
    // 第二个·页11 22:26 页37缝：整八2 把爪印读成"它挠了没挠出来＝空的"，四局没过第 6 张。它扒的是有虫的缝（闻得到），画出它注意到的东西：
    // 它正在扒的那一回合、和扒过以后虫还在里头的缝，缝里露一个绿脑袋带两根触角。缝网1、2 都读成'里面有虫，它够不着，我能拿'，照着拿到了。
    const inHid = (st.hid || []).some(r => r && r[0] === q[0] && r[1] === q[1]);
    if (inHid && (st.marks || []).some(r => r[0] === q[0] && r[1] === q[1]) || (inHid && st.lz && st.lz.mode === '扒' && st.lz.pos[0] === q[0] && st.lz.pos[1] === q[1])) {
      // 缝里卡着一只：露出绿脑袋和两根触角（它扒的时候、扒过以后都看得见）
      const hx = X + C * 0.5, hy = Y + C * 0.62;
      g.strokeStyle = '#7fd36a'; g.lineWidth = 2.2; g.beginPath();
      g.moveTo(hx - 3, hy - 4); g.quadraticCurveTo(hx - 9, hy - 14, hx - 15, hy - 17);
      g.moveTo(hx + 3, hy - 4); g.quadraticCurveTo(hx + 9, hy - 14, hx + 15, hy - 17);
      g.stroke();
      g.fillStyle = COL.bug; g.beginPath(); g.ellipse(hx, hy + 3, 8, 6, 0, Math.PI, 0); g.fill();
      g.fillStyle = '#2e4d1f'; g.beginPath(); g.arc(hx, hy - 2, 4.5, 0, 7); g.fill();
    }
  });
  const P = prev || st, pl0 = P.pl, lz0 = P.lz, lz = st.lz;
  const moved = !same(lz0.pos, dead ? dead.at : lz.pos);
  const turned = lz0.face !== lz.face;
  // 时间表：声音 0–0.45；它听见转头 0.3–0.6；不是听见的转头 0–0.2；它走 0.1–0.5；新的视线 0.5–0.8 一格格伸出去；冒字 0.6 起
  const tSound = t, tTurn = info.heard && !moved ? ease(seg(t, 0.3, 0.6)) : ease(seg(t, 0, 0.2));
  const tMove = ease(seg(t, moved && turned ? 0.15 : 0.05, 0.5)), tSight = seg(t, 0.5, 0.8), tPop = seg(t, 0.6, 0.85);
  // 旧的视线先淡掉，新的再伸出来
  const blkA = st.lzB ? st.lzB.pos : null;
  if (prev && t < 1 && !dead && (turned || moved)) drawSightCells(g, m, lz0.pos, lz0.face, 99, 1 - seg(t, 0, 0.2), prev.lzB ? prev.lzB.pos : null);
  // 第二个·页11 19:24（第一个查的：岔网1、2 都问"它朝着我、我也在黄格里，却只转头没扑"）：听见脚步刚转过来的那一回合它还没看，新黄线画淡，你下一步走完还站在里面才实
  const fresh = !dead && info.heard && turned && !moved;
  // 无字 13:27：认得你的它（让路、吃过你吐的），视线换成淡绿：压在你身上也看得出它不会扑
  const kind = m.V.has('让路') && (lz.fed || 0) >= 1, keepS = COL.sight;
  if (kind) COL.sight = 'rgba(150,225,120,0.22)';
  if (!dead) drawSightCells(g, m, lz.pos, lz.face, (prev && (turned || moved)) ? Math.ceil(tSight * 12) : 99, fresh ? 0.38 : 1, blkA);
  COL.sight = keepS;
  if (!prev || (!turned && !moved)) {} // 视线没变就一直亮着
  // 声音：你走一步、虫跑一步、虫落地，都有一圈
  if (prev && t < 1) {
    if (!same(prev.pl, st.pl) && !dead) drawSound(g, m, st.pl, tSound, info.heard ? '#7cc8ff' : 'rgba(124,200,255,0.75)');
    prev.bugs.forEach((b, i) => { if (b && st.bugs[i] && !same(b, st.bugs[i])) drawSound(g, m, st.bugs[i], tSound, 'rgba(160,220,120,0.8)'); });
    if (info.spit) drawSound(g, m, info.spit.to, seg(t, 0.25, 1), 'rgba(160,220,120,0.8)');
  }
  // 第二个 13:05 页72耳朵：回1、日1、日2 都说不懂它多远听得见、什么时候只是听见。声音那一圈传到它身上、它这一回合真听见了（不管转没转头），它身上亮一圈，跟声音同色；在嚼、在找、在冲的它不听，不亮
  if (prev && !dead && info.ear) {   // 动画里随声音亮一下；停下来以后留一圈淡的，到下一步才没（截图的生人只看得到停下来那一帧）
    [[info.ear[0], prev.lz], [info.ear[1], prev.lzB]].forEach(([q, L]) => {
      if (!q || !L) return;
      const d = Math.abs(q[0] - L.pos[0]) + Math.abs(q[1] - L.pos[1]);
      const col = same(q, st.pl) ? '#7cc8ff' : 'rgb(160,220,120)';
      const L1 = (L === prev.lz ? st.lz : st.lzB) || L;
      if (t < 1) {   // 第一个 第 16 天 12:07 看它动：原来亮完退到 0、放完又冒出那圈淡的，动起来是一闪、灭、又一闪；退到停下来那圈的亮度就停住
        const tt = seg(t, (d - 1) * 0.1 + 0.1, (d - 1) * 0.1 + 0.6);
        if (tt > 0.5 && Math.sin(Math.PI * tt) < 0.6) drawEar(g, L1.pos, 0.5, col, 0.6); else drawEar(g, L.pos, tt, col);
      }
      else drawEar(g, L1.pos, 0.5, col, 0.6);
    });
  }
  if (prev && t >= 1) {   // 这一回合的拖影：谁从哪来
    /* 无字：不画白线，谁从哪来看两帧之间动过去 */
    if (moved) drawLiz(g, cx(prev.lz.pos[0]), cx(prev.lz.pos[1]), prev.lz.face, 0.22);
  }
  // 第一个 第 15 天 19:55 页81老地方：它上回吃到虫的那格留一点虫渣（几粒褐色碎点），它记得这儿。不写字说为什么。
  if (m.V.has('老地方') && st.lz && st.lz.haunt && !(st.bugs || []).some(b => b && b[0] === st.lz.haunt[0] && b[1] === st.lz.haunt[1])) {
    const X = st.lz.haunt[0] * C, Y = st.lz.haunt[1] * C;
    g.fillStyle = 'rgba(140,110,60,0.8)';   // 褐色：绿点已经是记恩
    [[0.3, 0.35], [0.55, 0.3], [0.45, 0.55], [0.7, 0.6], [0.35, 0.7]].forEach(([a, b]) => { g.beginPath(); g.arc(X + C * a, Y + C * b, C * 0.06, 0, 7); g.fill(); });
    g.strokeStyle = 'rgba(110,85,45,0.75)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X + C * 0.6, Y + C * 0.42); g.lineTo(X + C * 0.75, Y + C * 0.35); g.moveTo(X + C * 0.5, Y + C * 0.65); g.lineTo(X + C * 0.6, Y + C * 0.78); g.stroke();
  }
  // 它去找你：你刚才被看见的那格画一个淡淡的你，还有它要去的那条线
  if (!dead && (lz.mode === '找' || lz.mode === '追') && lz.tgt === '你' && lz.mem && !same(lz.mem, st.pl)) {
    const a = prev && t < 1 ? tPop : 1;
    ghostMe(g, lz.mem, 0.8 * a);
    g.globalAlpha = 0.5 * a; g.setLineDash([3, 6]); g.strokeStyle = '#ff7a5c'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(cx(lz.pos[0]), cx(lz.pos[1])); g.lineTo(cx(lz.mem[0]), cx(lz.mem[1])); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
  }
  // 第一个 21:27 页33记号：被你甩掉过，它丢你的那一格一直留着那个淡淡的你（跟它找你时同一个记号，生人已经认得"它记得你在这儿"），它在石头上时再连一条淡线。不写字说为什么。
  if (!dead && m.V.has('记仇') && lz.grudge && !((lz.mode === '找' || lz.mode === '追') && lz.tgt === '你')) {
    ghostMe(g, lz.grudge, 0.55);
    // 第二个 第 15 天 17:09 页76无线：拿掉它到问号那条虚线（八个生人七个说没懂，常读成'它打算走的路'）
  }
  if (drop && !dead && t >= 1) {   // 按 x 虫会落的那一格（第二个·页11 17:06：吐选瞄准时 drop 是几格，一格一个框）
    for (const d of (Array.isArray(drop[0]) ? drop : [drop])) { g.setLineDash([6, 5]); g.strokeStyle = COL.drop; g.lineWidth = 2.5; g.strokeRect(d[0] * C + 6, d[1] * C + 6, C - 12, C - 12); g.setLineDash([]); }
  }
  // 第三个 第 18 天 页173果：树（长在墙上）和果子
  if (m.tree) { const X = cx(m.tree[0]), Y = cx(m.tree[1]); g.fillStyle = '#6b4a2b'; g.fillRect(X - 3, Y, 6, C * 0.42); g.fillStyle = '#3f7a3a'; g.beginPath(); g.arc(X, Y - 4, C * 0.36, 0, 7); g.fill(); g.fillStyle = '#4f9a48'; g.beginPath(); g.arc(X - 6, Y - 9, C * 0.2, 0, 7); g.fill(); }
  if (st.fr) { const X = cx(st.fr[0]), Y = cx(st.fr[1]); g.fillStyle = '#e8892e'; g.beginPath(); g.arc(X, Y + 2, 10, 0, 7); g.fill(); g.fillStyle = '#f6b25a'; g.beginPath(); g.arc(X - 3, Y - 1, 4, 0, 7); g.fill(); g.strokeStyle = '#5a3a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(X, Y - 8); g.lineTo(X + 3, Y - 13); g.stroke(); }
  if (m.rot) { const X = cx(m.rot[0]), Y = cx(m.rot[1]); g.fillStyle = 'rgba(110,80,40,0.55)'; g.beginPath(); g.ellipse(X, Y + 8, 12, 6, 0, 0, 7); g.fill(); }
  // 吹万 第 18 天 17:07 页184朽木：朽木画成一截横着的褐木头，里头几只就露几个绿点；只剩一只时那一点缩在木头深处、暗下去；两只以上点会一闪一闪（窸窸窣窣）
  const onLog = b => m.logAt && b && b[0] === m.logAt[0] && b[1] === m.logAt[1];
  if (m.logAt) {
    const X = cx(m.logAt[0]), Y = cx(m.logAt[1]), n = st.bugs.filter(onLog).length + (st.deep ? 1 : 0);
    // 无字：木头大一号，身上三个虫洞；有几只活的就有几个洞里探出虫头、触角一摆一摆；只剩一只时没有头探出来，木头中间裂缝里透出一只蜷着的、暗的；空了就三个黑洞
    const now = (typeof performance !== 'undefined' ? performance.now() : 0) / 300;
    g.fillStyle = '#7a5632'; if (g.roundRect) { g.beginPath(); g.roundRect(X - C * 0.47, Y - C * 0.27, C * 0.94, C * 0.54, 8); g.fill(); } else g.fillRect(X - C * 0.47, Y - C * 0.27, C * 0.94, C * 0.54);
    g.fillStyle = '#5a3d20'; g.beginPath(); g.ellipse(X + C * 0.43, Y, C * 0.08, C * 0.25, 0, 0, 7); g.fill();
    g.strokeStyle = '#4a321c'; g.lineWidth = 1.5; for (const dy of [-0.15, 0.13]) { g.beginPath(); g.moveTo(X - C * 0.42, Y + C * dy); g.lineTo(X + C * 0.3, Y + C * dy + 2); g.stroke(); }
    const H = [[-0.3, 0.0], [-0.08, -0.06], [0.14, 0.02]], show = n >= 2 ? Math.min(n, 3) : 0;
    H.forEach(([hx, hy], i) => {
      const px = X + C * hx, py = Y + C * hy;
      g.fillStyle = '#1a1009'; g.beginPath(); g.ellipse(px, py, 5, 4, 0, 0, 7); g.fill();
      if (i < show) {   // 探出来的虫头
        const w = Math.sin(now + i * 1.7) * 0.5;
        g.fillStyle = COL.bug; g.beginPath(); g.arc(px, py - 4, 5.5, Math.PI, 0); g.fill();
        g.strokeStyle = '#2e4d1f'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(px - 2, py - 8); g.lineTo(px - 6 + w * 3, py - 15); g.moveTo(px + 2, py - 8); g.lineTo(px + 6 + w * 3, py - 15); g.stroke();
      }
    });
    if (n === 1) {   // 只剩一只：裂缝里透出一只蜷着的、暗的
      g.strokeStyle = '#1a1009'; g.lineWidth = 3; g.beginPath(); g.moveTo(X + 8, Y + 11); g.lineTo(X + 14, Y + 6); g.lineTo(X + 19, Y + 12); g.stroke();
      g.fillStyle = 'rgba(90,140,70,0.8)'; g.beginPath(); g.arc(X + 14, Y + 9.5, 3, 0, 7); g.fill();
    }
  }
  // 吹万 第 18 天 21:4x 页197木屑：你在朽木上每扒一下，木头底下落一撮木屑；前几天的还在（颜色暗一点），不写字。
  if (m.logAt) {
    const X = cx(m.logAt[0]), Y = cx(m.logAt[1]), old = m.logDust0 || 0, all = old + (st.dust || 0);
    for (let i = 0; i < all; i++) {
      const bx = X - C * 0.3 + (i % 4) * C * 0.2, by = Y + C * 0.33 + Math.floor(i / 4) * 5;
      g.strokeStyle = i < old ? '#a8865a' : '#e6c58c'; g.lineWidth = 2.8; g.lineCap = 'round';   // 木屑画成几根浅色的小卷片，跟虫渣的深褐点分开
      for (const [dx, dy, a] of [[-4, 0, 0.5], [3, -1.5, -0.7], [0, 3, 1.3], [5, 2.5, 0.2], [-3, 4, -0.3]]) { g.beginPath(); g.moveTo(bx + dx - 3.6 * Math.cos(a), by + dy - 3.6 * Math.sin(a)); g.lineTo(bx + dx + 3.6 * Math.cos(a), by + dy + 3.6 * Math.sin(a)); g.stroke(); }
      g.lineCap = 'butt';
    }
  }
  // 虫
  st.bugs.forEach((b, i) => {
    if (!b) return;
    if (onLog(b) && (!prev || !prev.bugs[i] || onLog(prev.bugs[i]))) return;   // 趴在朽木里的不单画
    const pb = prev && prev.bugs[i];
    const [X, Y] = pb ? at(pb, b, tMove) : at(b);
    drawBug(g, X, Y, null, !!(st.mine && st.mine[i]));
  });
  if (prev && t < 1) prev.bugs.forEach((b, i) => { if (b && !st.bugs[i] && !onLog(b)) drawBug(g, cx(b[0]), cx(b[1]), 1 - seg(t, 0.3, 0.6), !!(prev.mine && prev.mine[i])); });
  if (info.spit && t < 1) {
    const [sx, sy] = at(info.spit.from, info.spit.to, Math.min(1, t * 1.6));
    drawBug(g, sx, sy, t < 0.7 ? 1 : (1 - t) / 0.3);
  }
  // 我
  const [mx, my] = prev ? at(prev.pl, dead ? dead.at : st.pl, ease(seg(t, 0, 0.35))) : at(st.pl);
  drawMe(g, mx, my, st.ate, st.pf);
  // 蜥蜴
  const lp = dead ? dead.from : lz.pos;
  const [lx, ly] = prev ? at(prev.lz.pos, dead ? dead.at : lp, tMove) : at(lp);
  const ang = turn(ANG[lz0.face], ANG[dead ? lz0.face : lz.face], prev ? tTurn : 1);
  const spotted = !dead && lz.mode === '停' && (!prev || prev.lz.mode !== '停');
  const jump = spotted && prev && t < 1 ? 1 + 0.18 * Math.sin(Math.PI * seg(t, 0.55, 0.85)) : 1;
  const eyes = dead ? null : (m.V.has('饱不理') && (lz.hun || 0) >= 5) ? '眯' : (prev && m.V.has('日子') && (prev.lz.hun || 0) >= 5 && (lz.hun || 0) < 5 && lz.mode !== '吃') ? '睁' : null;
  drawLizA(g, lx, ly, ang, 1, jump, eyes, m.V.has('日子') ? (lz.hun || 0) : null);
  if (m.V.has('记恩') && (lz.fed || 0) > 0 && !dead) {   // 第二个 第 15 天 05:51 页53记恩：吃过你吐的几只，身子底下就有几个小绿点（追丢你一回就没了）。不写字
    g.fillStyle = '#8fd16a'; g.strokeStyle = '#1d1f1a'; g.lineWidth = 1.5;
    for (let i = 0; i < Math.min(lz.fed, 3); i++) { g.beginPath(); g.arc(lx - 7 + i * 7, ly + C * 0.38, 3.4, 0, Math.PI * 2); g.fill(); g.stroke(); }
  }
  if (st.lzB) drawB(g, m, info, t, tMove);
  // 盯上你那一下：从它到你一道红线闪两下
  if (spotted && lz.tgt === '你') {
    const a = prev && t < 1 ? Math.abs(Math.sin(Math.PI * 2 * seg(t, 0.55, 1))) : 0.55;
    g.globalAlpha = a; g.strokeStyle = '#ff5a3c'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(lx, ly); g.lineTo(cx(st.pl[0]), cx(st.pl[1])); g.stroke(); g.globalAlpha = 1;
  }
  const switched = prev && !dead && prev.lz.tgt === '你' && lz.mode === '追' && lz.tgt !== null && lz.tgt !== '你' && st.bugs[lz.tgt];
  if (switched || (spotted && lz.tgt !== '你' && st.bugs[lz.tgt])) {
    const b = st.bugs[lz.tgt], a = t < 1 ? Math.abs(Math.sin(Math.PI * 2 * seg(t, 0.55, 1))) : 0.55;
    g.globalAlpha = a; g.strokeStyle = '#a8e070'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(lx, ly); g.lineTo(cx(b[0]), cx(b[1])); g.stroke(); g.globalAlpha = 1;
  }
  const showPop = !prev || t >= 1 ? 1 : tPop;
  if (!dead && lz.haunt && !lz.hv && !(lz.hun > 0) && lz.mode !== '吃') {   // 无字：饿了要去你喂过它的那格——头上冒一只虚的虫，到那格拉一道淡虚线，那格亮一圈你的蓝
    g.save(); const hx = cx(lz.haunt[0]), hy = cx(lz.haunt[1]);
    g.setLineDash([4, 6]); g.strokeStyle = 'rgba(95,179,255,0.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(lx, ly); g.lineTo(hx, hy); g.stroke(); g.setLineDash([]);
    g.strokeStyle = 'rgba(95,179,255,0.7)'; g.lineWidth = 2.5; g.beginPath(); g.arc(hx, hy, C * 0.36, 0, 7); g.stroke();
    g.fillStyle = 'rgba(230,230,220,0.85)'; g.beginPath(); g.arc(lx + 16, ly - C * 0.62, 11, 0, 7); g.fill(); g.beginPath(); g.arc(lx + 6, ly - C * 0.38, 3.5, 0, 7); g.fill();
    drawBug(g, lx + 16, ly - C * 0.62, 0.55); g.restore();
  }
  if (!dead && info.heard && prev && t < 0.62) {   // 先是听见、转头，转过来看见了才是"看见你了"
    // 第二个 第 15 天 04:38 页51一个问号：听见那一下不再冒 ?（整十一1、2 都分不清头上 ? 和 ??）。听见只靠转头和脚步那圈变亮
  } else if (!dead && showPop > 0) {
    g.save(); g.globalAlpha = showPop;
    // 10:22 梓韬："太直白地写上去，就基本上把所有规则都直接曝光了"，冒字只留记号，让人自己看出来
    if (lz.mode === '停') bubble(g, lx, ly, '!', lz.tgt === '你' ? '#ff7a5c' : '#c8e88a');
    else if (lz.mode === '追') bubble(g, lx, ly, '!!', lz.tgt === '你' ? '#ff7a5c' : '#c8e88a');
    else if (lz.mode === '赶') bubble(g, lx, ly, '!', '#ffb040');   // 第二个 第 15 天 01:53 页45邻居：盯着闯进来的那只
    else if (lz.mode === '逃') bubble(g, lx, ly, '逃', '#cccccc');   // 第二个 第 15 天 10:40 页68逃：全1、全2 都说不懂灰色省略号（'被吓住、发愣，还是一小段什么事都不做'），跟'嚼''扒'一样写它在干嘛
    else if (lz.mode === '找') bubble(g, lx, ly, '?', '#e0c070');   // 第二个 第 15 天 04:38 页51：找你只冒一个 ?，跟地上那个虚圈 ?（它记着你在那）是一个意思：你在哪   // 11:01 第二个：两个生人分不清听见的 ? 和找你的 ?，照 ! / !! 改成 ? / ??
    else if (lz.mode === '吃') bubble(g, lx, ly, '嚼', '#c8e88a');
    else if (lz.mode === '扒') bubble(g, lx, ly, '扒', '#e0c070');
    g.restore();
  }
  {   // 无字：键第一次用得上的时候，在你身边用粉笔画一下那个键；用过一次就再也不画（以撒：道具捡起来才告诉你按哪个）
    const W = root.WeiDraw || {}; if (info.spit) W._usedX = true; if (info.ev && info.ev.took) W._usedF = true;
    const me = st.pl, L = st.lz, X0 = cx(me[0]), Y0 = cx(me[1]);
    const eyed = L && (L.mode === '停' || L.mode === '追') && L.tgt === '你';
    if (!W._usedX && !dead && st.ate >= 1 && eyed) { key(g, X0 + C * 0.32, Y0 - C * 0.62, 17, 17, 'X', 0.8); drawBug(g, X0 + C * 0.32 + 30, Y0 - C * 0.62 + 8, 0.55); }
    const nearLog = m.logAt && Math.abs(m.logAt[0] - me[0]) + Math.abs(m.logAt[1] - me[1]) <= 1;
    if (!W._usedF && !dead && nearLog) key(g, X0 - C * 0.32 - 17, Y0 - C * 0.62, 17, 17, 'F', 0.8);
  }
  root.WeiDraw && root.WeiDraw.fx && root.WeiDraw.fx(g, m, info, t);   // 无字：事件动画钩子（七天没有字那一处的 动.js）
  { const k = root.WeiDraw && root.WeiDraw.dusk || 0;   // 无字：天光一步一步暗下去，最后几步发蓝
    if (k > 0) { g.fillStyle = `rgba(8,12,40,${(0.62 * k * k).toFixed(3)})`; g.fillRect(0, 0, cv.width, cv.height); } }
  if (dead && t >= 1) {
    g.strokeStyle = COL.dead; g.lineWidth = 6; const X = cx(dead.at[0]), Y = cx(dead.at[1]);
    g.beginPath(); g.moveTo(X - 18, Y - 18); g.lineTo(X + 18, Y + 18); g.moveTo(X + 18, Y - 18); g.lineTo(X - 18, Y + 18); g.stroke();
  }
}

// 动一下：0.7 秒；按得快，上一个没放完就直接换下一个
let token = 0;
function animate(cv, m, info, done) {
  if (!info.prev || typeof requestAnimationFrame === 'undefined') { frame(cv, m, info, 1); done && done(); return; }
  const my = ++token, t0 = performance.now(), D = 700;
  function tick(now) {
    if (my !== token) return;
    const t = Math.min(1, (now - t0) / D);
    frame(cv, m, info, t);
    if (t < 1) requestAnimationFrame(tick); else done && done();
  }
  requestAnimationFrame(tick);
}
// 第二个 第 15 天 01:52 页45邻居：第二只（黄）。跟红同一个画法，只换颜色；视线淡一点画；头上冒的记号跟红一样
function drawB(g, m, info, t, tMove) {
  const { prev, st, dead } = info; const b = st.lzB, b0 = (prev && prev.lzB) || b;
  const keep = [COL.liz, COL.lizBelly, COL.sight, COL.sightEdge];
  COL.liz = '#3fb8a8'; COL.lizBelly = '#9fe6d8'; COL.sight = 'rgba(240,200,80,0.18)'; COL.sightEdge = 'rgba(80,215,195,0.95)';   // 第二个 第 15 天 02:40 页48两口：对1 说两条黄线叠在一起分不清谁在看哪。填色照旧黄（黄格＝被看见），青的那条描青边
  try {
    const killed = dead && root.WeiSim && root.WeiSim.killedBy === 'B';
    if (!dead) drawSightCells(g, m, b.pos, b.face, 99, prev && t < 0.6 ? seg(t, 0.3, 0.6) : 1, st.lz.pos);
    const lp = killed ? dead.at : b.pos;
    const [x, y] = prev ? at(b0.pos, lp, tMove) : at(lp);
    const ang = turn(ANG[b0.face], ANG[b.face], prev ? ease(seg(t, 0, 0.3)) : 1);
    const eyes = (m.V.has('饱不理') && (b.hun || 0) >= 5) ? '眯' : null;
    const spotted = !dead && (b.mode === '停' || b.mode === '赶') && (!prev || !prev.lzB || prev.lzB.mode !== b.mode);
    const jump = spotted && prev && t < 1 ? 1 + 0.18 * Math.sin(Math.PI * seg(t, 0.55, 0.85)) : 1;
    drawLizA(g, x, y, ang, 1, jump, eyes, m.V.has('日子') ? (b.hun || 0) : null);
    if (m.V.has('记恩') && (b.fed || 0) > 0 && !dead) {   // 第二个 07:09 页55：青吃过你吐的，身子底下也有小绿点
      g.fillStyle = '#8fd16a'; g.strokeStyle = '#1d1f1a'; g.lineWidth = 1.5;
      for (let i = 0; i < Math.min(b.fed, 3); i++) { g.beginPath(); g.arc(x - 7 + i * 7, y + C * 0.38, 3.4, 0, Math.PI * 2); g.fill(); g.stroke(); }
    }
    if (!dead && (!prev || t >= 0.6)) {
      const mk = { '停': ['!', b.tgt === '你' ? '#ff7a5c' : '#c8e88a'], '追': ['!!', b.tgt === '你' ? '#ff7a5c' : '#c8e88a'], '找': ['?', '#e0c070'], '吃': ['嚼', '#c8e88a'], '扒': ['扒', '#e0c070'], '赶': ['!', '#ffb040'], '逃': ['逃', '#cccccc'] }[b.mode];
      if (mk) bubble(g, x, y, mk[0], mk[1]);
    }
  } finally { [COL.liz, COL.lizBelly, COL.sight, COL.sightEdge] = keep; }
}
function still(cv, m, info) { token++; frame(cv, m, info, 1); }


// 第二个 第 15 天 12:05 页70回看（从"园"搬来）：一局结束，把这一局你走的（白）和它走的（它的颜色）叠着画，吐虫的格子画绿圈。
// R = { me:[[x,y]...], a:[[x,y]...], b:[[x,y]...]|null, drops:[[x,y]...] }
function replay(cv, m, R, o) {   // o.noNum：不写每 5 步的步数（页138少字，回看里有拖动条了）
  const g = cv.getContext('2d');
  g.fillStyle = 'rgba(10,10,8,0.55)'; g.fillRect(0, 0, cv.width, cv.height);
  function line(pts, color, off) {
    if (!pts || pts.length < 1) return;
    const P = pts.map(q => [cx(q[0]) + off, cx(q[1]) + off]);
    g.strokeStyle = color; g.lineWidth = 4; g.lineJoin = 'round'; g.lineCap = 'round'; g.globalAlpha = 0.9;
    // 第四个 第 16 天 23:46：一步挪了两格还拐弯（冲、换位），直线连会从墙上斜穿（七天2 回看第 6 张）。只在画线时沿走得通的格子补中间那格；P、步数、停几步都照旧
    const W = [];
    pts.forEach((q, i) => {
      if (i && m && m.stepToward) { let p = W[W.length - 1], n = 0; while (Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) > 1 && n++ < 8) { const r = m.stepToward(p, q); if (!r[1]) break; W.push(r[0]); p = r[0]; } }
      W.push(q);
    });
    g.beginPath(); W.map(q => [cx(q[0]) + off, cx(q[1]) + off]).forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke();
    // 站着没动的：在那一格画一个点，旁边写停了几步（一段一段算，停得久才写）
    g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const runs = [];
    for (let i = 1, k = 0; i <= pts.length; i++) {
      if (i < pts.length && pts[i][0] === pts[i - 1][0] && pts[i][1] === pts[i - 1][1]) continue;
      if (i - 1 - k >= 1) runs.push({ at: pts[k], len: i - 1 - k, from: k });
      k = i;
    }
    g.lineWidth = 3; g.beginPath(); g.arc(P[0][0], P[0][1], 8, 0, 7); g.stroke();   // 开头空心圈
    g.fillStyle = color; g.beginPath(); g.arc(P[P.length - 1][0], P[P.length - 1][1], 6, 0, 7); g.fill();   // 结尾实心
    const used = new Set();
    runs.forEach(r => {
      const X = cx(r.at[0]) + off, Y = cx(r.at[1]) + off;
      g.fillStyle = color; g.beginPath(); g.arc(X, Y, 4 + Math.min(5, r.len / 2), 0, 7); g.fill();
      if (r.len >= 3 && false) { const t = `停${r.len}步`;   /* 无字：不写停几步 */ const w = g.measureText(t).width + 8; g.fillStyle = 'rgba(17,17,17,0.85)'; g.fillRect(X + 8, Y - 18 + (off > 4 ? 14 : 0), w, 15); g.fillStyle = color; g.fillText(t, X + 8 + w / 2, Y - 10 + (off > 4 ? 14 : 0)); }
      for (let i = r.from; i <= r.from + r.len; i++) used.add(i);
    });
    // 走着的时候每 5 步写一个步数，好对上"那时候它在哪"；停着的那几步不写（上面写了停几步）
    for (let i = 5; i < P.length && false; i += 5) {   /* 无字：不写步数 */
      if (used.has(i)) continue;
      g.fillStyle = '#111'; g.beginPath(); g.arc(P[i][0], P[i][1], 8, 0, 7); g.fill();
      g.fillStyle = color; g.fillText(String(i), P[i][0], P[i][1]);
    }
    g.globalAlpha = 1;
  }
  (R.drops || []).forEach(q => { g.strokeStyle = COL.bug; g.lineWidth = 3; g.beginPath(); g.arc(cx(q[0]), cx(q[1]), C * 0.38, 0, 7); g.stroke(); });
  if (R.b) line(R.b, '#3fb8a8', 13);
  line(R.a, '#e0603f', 6);
  line(R.me, '#f2f2ea', -8);
}

root.WeiDraw = { frame, animate, still, replay, drawLiz, drawBug, drawMe, drawNest, C };
})(this);
