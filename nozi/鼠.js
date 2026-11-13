// 鼠.js —— 吹万（13:02 换段那一处）第 19 天 13:12。梓韬 13:09："完全视觉和听觉，还有鼠标操作"。
// 只调 index.html 里现成的 act(k) / itAct(k)，不碰规矩。
//   点紧挨着的一格：往那边走一步；点远处一格：朝它走一步（一下一步）
//   点自己：等一步
//   点朽木（站在上面或紧挨着、里头有虫）：掏
//   从自己身上按住往一个方向拖、松手：往那边吐（拖着的时候虚线框画出会落在哪）
//   悬停：要走的那一格亮一下；能掏的木头亮手；拖着时显出落点
(function () {
  const cv = document.getElementById('board');
  if (!cv) return;
  const ov = document.createElement('canvas');
  ov.style.cssText = 'position:fixed;pointer-events:none;z-index:5;left:0;top:0';
  document.body.appendChild(ov);
  const g = ov.getContext('2d');
  const C = () => (window.WeiDraw && WeiDraw.C) || 56;
  const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
  let hover = null, down = null, dragDir = null, lastT = 0;

  function G(name) { try { return eval(name); } catch (e) { return undefined; } }   // index.html 顶层 let（st、m、IT、over）
  function me() {
    const st = G('st'), IT = G('IT');
    if (!st) return null;
    if (IT) return IT.who === 'B' ? (st.lzB && st.lzB.pos) : (st.lz && st.lz.pos);
    return st.pl;
  }
  function cellAt(e) {
    const r = cv.getBoundingClientRect();
    if (e.clientX < r.left || e.clientY < r.top || e.clientX >= r.right || e.clientY >= r.bottom) return null;
    const sx = cv.width / r.width, sy = cv.height / r.height;
    return [Math.floor((e.clientX - r.left) * sx / C()), Math.floor((e.clientY - r.top) * sy / C())];
  }
  function eq(a, b) { return a && b && a[0] === b[0] && a[1] === b[1]; }
  function canDig(c) {
    const st = G('st'), m = G('m'), IT = G('IT'); const p = me();
    if (IT || !m || !m.logAt || !p || !eq(c, m.logAt)) return false;
    if (Math.abs(p[0] - c[0]) + Math.abs(p[1] - c[1]) > 1) return false;
    return st.bugs.some(q => q && eq(q, m.logAt));
  }
  function canSpit() {
    const st = G('st'), m = G('m'), IT = G('IT'), L = G('LEVELS'), li = G('li');
    if (IT || !st || !m || st.ate < 1) return false;
    if (L && L[li] && L[li].V && !L[li].V.includes('吐')) return false;
    return m.V.has('吐');
  }
  // 点一格 → 这一下按什么
  function keyFor(c) {
    const p = me(); if (!p || !c) return null;
    if (canDig(c)) return 'F';
    const dx = c[0] - p[0], dy = c[1] - p[1];
    if (!dx && !dy) return '.';
    const m = G('m');
    const free = k => { const d = DIRS[k], q = [p[0] + d[0], p[1] + d[1]]; return !m || !m.free || m.free(q); };
    const kx = dx > 0 ? 'R' : 'L', ky = dy > 0 ? 'D' : 'U';
    const first = Math.abs(dx) >= Math.abs(dy) ? (dx ? kx : ky) : (dy ? ky : kx);
    const second = first === kx ? (dy ? ky : null) : (dx ? kx : null);
    if (free(first) || !second) return first;
    return free(second) ? second : first;
  }
  function press(k) {
    if (!k || G('over')) return;
    const IT = G('IT');
    if (G('aim')) { try { aim = false; } catch (e) {} }
    if (IT) { if (k === 'F' || k[0] === 'X') return; itAct(k); } else act(k);
  }

  function place() {
    const r = cv.getBoundingClientRect();
    if (ov.width !== cv.width || ov.height !== cv.height) { ov.width = cv.width; ov.height = cv.height; }
    ov.style.left = r.left + 'px'; ov.style.top = r.top + 'px'; ov.style.width = r.width + 'px'; ov.style.height = r.height + 'px';
  }
  function box(c, col, w, dash) {
    const s = C(); g.save(); g.strokeStyle = col; g.lineWidth = w; if (dash) g.setLineDash(dash);
    g.strokeRect(c[0] * s + w / 2 + 2, c[1] * s + w / 2 + 2, s - w - 4, s - w - 4); g.restore();
  }
  function frame(t) {
    place(); g.clearRect(0, 0, ov.width, ov.height);
    const p = me(), s = C(), pulse = 0.55 + 0.35 * Math.sin(t / 180);
    if (!G('over') && p) {
      if (down && dragDir && canSpit()) {
        // 拖着：箭头 + 落点虚线框
        const d = DIRS[dragDir], cx = p[0] * s + s / 2, cy = p[1] * s + s / 2;
        g.save(); g.strokeStyle = `rgba(120,200,255,${pulse})`; g.lineWidth = 4; g.lineCap = 'round';
        g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + d[0] * s * 0.9, cy + d[1] * s * 0.9); g.stroke();
        g.beginPath(); const hx = cx + d[0] * s * 0.9, hy = cy + d[1] * s * 0.9;
        g.moveTo(hx - d[1] * 9 - d[0] * 9, hy + d[0] * 9 - d[1] * 9); g.lineTo(hx, hy); g.lineTo(hx + d[1] * 9 - d[0] * 9, hy - d[0] * 9 - d[1] * 9); g.stroke(); g.restore();
        let at = null; try { at = WeiSim.dropAt(G('m'), G('st'), dragDir); } catch (e) {}
        if (at) box(at, `rgba(120,200,255,${pulse})`, 3, [6, 5]);
      } else if (hover) {
        const k = keyFor(hover);
        if (k === 'F') { box(hover, `rgba(240,200,90,${pulse})`, 4); }
        else if (k === '.') {
          g.save(); g.strokeStyle = `rgba(242,242,234,${pulse * 0.8})`; g.lineWidth = 3;
          g.beginPath(); g.arc(p[0] * s + s / 2, p[1] * s + s / 2, s * 0.44, 0, Math.PI * 2); g.stroke(); g.restore();
        } else if (k) {
          const d = DIRS[k], q = [p[0] + d[0], p[1] + d[1]];
          box(q, `rgba(242,242,234,${pulse * 0.9})`, 3);
          if (!eq(q, hover)) box(hover, 'rgba(242,242,234,0.25)', 2, [4, 6]);
        }
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  cv.addEventListener('mousemove', e => {
    hover = cellAt(e);
    if (down) {
      const r = cv.getBoundingClientRect(), dx = e.clientX - down.x, dy = e.clientY - down.y, lim = r.width / (cv.width / C()) * 0.45;
      dragDir = (Math.abs(dx) < lim && Math.abs(dy) < lim) ? null : (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'));
    }
    const k = keyFor(hover);
    cv.style.cursor = !hover ? 'default' : (k === 'F' ? 'grab' : 'pointer');
  });
  cv.addEventListener('mouseleave', () => { hover = null; });
  cv.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    const c = cellAt(e);
    down = { x: e.clientX, y: e.clientY, onMe: eq(c, me()) }; dragDir = null; e.preventDefault();
  });
  window.addEventListener('mouseup', e => {
    if (!down) return;
    const d = down; down = null;
    if (d.onMe && dragDir) { const k = dragDir; dragDir = null; if (canSpit()) press('X' + k); return; }
    dragDir = null;
    if (performance.now() - lastT < 60) return;   // 防双击连按
    lastT = performance.now();
    press(keyFor(cellAt(e)));
  });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  // 触屏：同一套
  cv.addEventListener('touchstart', e => { const t = e.touches[0]; hover = cellAt(t); down = { x: t.clientX, y: t.clientY, onMe: eq(hover, me()) }; dragDir = null; e.preventDefault(); }, { passive: false });
  cv.addEventListener('touchmove', e => { const t = e.touches[0]; const r = cv.getBoundingClientRect(), dx = t.clientX - down.x, dy = t.clientY - down.y, lim = r.width / (cv.width / C()) * 0.45; dragDir = (Math.abs(dx) < lim && Math.abs(dy) < lim) ? null : (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U')); e.preventDefault(); }, { passive: false });
  cv.addEventListener('touchend', e => { const t = e.changedTouches[0]; const d = down; down = null; if (!d) return; if (d.onMe && dragDir) { const k = dragDir; dragDir = null; if (canSpit()) press('X' + k); return; } dragDir = null; press(keyFor(cellAt(t))); hover = null; e.preventDefault(); }, { passive: false });
  window.WeiMouse = { keyFor };
})();
