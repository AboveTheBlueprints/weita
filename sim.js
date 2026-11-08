// 喂它一口（代号，原名读它）：照 ~/碰/读它/量五行/sim.py 一行一行抄成 JavaScript。第二个醒的，第 14 天 09:20。
// 只抄了现在六张图用到的那几样：一条线的视野、听、馋、撞、只扑盯着的、背逃、吐、吐向它。
// 改规矩先改 sim.py，再照着改这里，跑 node 对照.js 看两边每一步一样不一样。
(function (root) {
const DIRS = { U: [0, -1], R: [1, 0], D: [0, 1], L: [-1, 0] };
const ORDER = ['U', 'R', 'D', 'L'];
const SIGHT = 20;
let api;
const K = p => p[0] + ',' + p[1];
const eq = (a, b) => a !== null && b !== null && a !== undefined && b !== undefined && a[0] === b[0] && a[1] === b[1];
const has = (arr, p) => arr.some(b => b !== null && eq(b, p));
const idx = (arr, p) => arr.findIndex(b => b !== null && eq(b, p));

function Map_(text, face, need, carry, variant) {
  const rows = text.replace(/^\n+|\n+$/g, '').split('\n');
  this.h = rows.length; this.w = Math.max(...rows.map(r => r.length));
  this.wall = new Set(); this.bugs = []; this.cracks = []; this.hid = [];
  rows.forEach((r, y) => {
    const rr = r.padEnd(this.w, '#');
    for (let x = 0; x < this.w; x++) {
      const c = rr[x];
      if (c === '#') this.wall.add(K([x, y]));
      else if (c === 'N') this.nest = [x, y];
      else if (c === 'P') this.start = [x, y];
      else if (c === 'B') this.bugs.push([x, y]);
      else if (c === 'L') this.post = [x, y];
      else if (c === 'M') this.postB = [x, y];
      else if (c === 'o' || c === 'x') { (this._turf = this._turf || { o: [], x: [] })[c].push(K([x, y])); }   // 第二个 01:58 页45邻居：图里直接画两块地（o 红、x 黄），照 ~/碰/之间/ 的画法   // 第二个 第 15 天 01:48 页45邻居：第二只蜥蜴的石头
      else if (c === 'c') { this.cracks.push([x, y]); this.hid.push([x, y]); }   // 第一个 17:44 '扒'：石缝，底下藏着一只虫
      else if (c === 'k') this.cracks.push([x, y]);   // 空石缝
    }
  });
  this.face = face; this.need = need; this.carry = carry || 0;
  this.V = new Set(variant);
  this._dist = {};
}
Map_.prototype.free = function (p) { return !this.wall.has(K(p)) && p[0] >= 0 && p[0] < this.w && p[1] >= 0 && p[1] < this.h; };
Map_.prototype.distFrom = function (src) {
  const key = K(src);
  if (this._dist[key]) return this._dist[key];
  const d = new Map(); d.set(key, 0); const q = [src];
  while (q.length) {
    const p = q.shift();
    for (const k of ORDER) {
      const n = [p[0] + DIRS[k][0], p[1] + DIRS[k][1]];
      if (this.free(n) && !d.has(K(n))) { d.set(K(n), d.get(K(p)) + 1); q.push(n); }
    }
  }
  this._dist[key] = d; return d;
};
Map_.prototype.stepToward = function (p, goal) {
  if (eq(p, goal)) return [p, null];
  const d = this.distFrom(goal);
  let best = null;
  for (const k of ORDER) {
    const n = [p[0] + DIRS[k][0], p[1] + DIRS[k][1]];
    if (d.has(K(n)) && (best === null || d.get(K(n)) < d.get(K(best[0])))) best = [n, k];
  }
  return best ? best : [p, null];
};
Map_.prototype.los = function (a, b) {
  let [x0, y0] = a; const [x1, y1] = b;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  while (!(x0 === x1 && y0 === y1)) {
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
    if (!(x0 === x1 && y0 === y1) && this.wall.has(K([x0, y0]))) return false;
  }
  return true;
};
Map_.prototype.sees = function (lz, face, p) {
  const [fx, fy] = DIRS[face];
  const vx = p[0] - lz[0], vy = p[1] - lz[1];
  const fwd = vx * fx + vy * fy, lat = Math.abs(vx * fy - vy * fx);
  if (fwd < 1 || fwd > SIGHT) return false;
  if (lat > 0) return false;   // 一条线：只看脸朝的那一排
  return this.los(lz, p);
};

// 蜥蜴：{pos, face, mode, tgt, mem, eat}；mode：岗 停 追 找 吃；tgt：'你' 或虫的编号或 null
// 第二个 第 15 天 01:47 页45邻居：两只同一套脾气的蜥蜴，各有一块地（石头 BFS LAND 格以内）。只多一条关系（~/碰/之间/ 量过的）：
// 别的蜥蜴站进我的地、我看得见它或它离我 3 格以内，我先管它不管你：盯一拍，再冲两格，冲到它跟前就嘶，它掉头跑回自己石头（跑的时候什么都不看）。
// 追你的时候不管地界。m._other：另一只（{pos, mode}）；m.land：我的地（Set of K）。
const faceTo = (a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1]; return Math.abs(vx) >= Math.abs(vy) ? (vx > 0 ? 'R' : 'L') : (vy > 0 ? 'D' : 'U'); };
const man = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
function territory(m, lz, player) {
  let { pos, face, mode } = lz; const o = m._other;
  const keep = x => Object.assign({ pos, face, mode, tgt: null, mem: null, eat: 0 }, x);
  if (mode === '逃') {   // 被嘶了：一回合两格往自己石头跑，什么都不看
    for (let i = 0; i < 2; i++) {
      if (eq(pos, m.post)) break;
      const [n, k] = m.stepToward(pos, m.post); if (!k || (o && eq(n, o.pos))) break;
      pos = n; face = k;
      if (eq(pos, player)) return [keep({ pos, face, mode: '逃' }), true];
    }
    return [keep({ pos, face, mode: eq(pos, m.post) ? '岗' : '逃', face: eq(pos, m.post) ? m.face : face }), false];
  }
  if (mode === '吃' || mode === '扒') return null;
  const inMine = o && o.mode !== '逃' && m.land.has(K(o.pos));
  const seeIt = inMine && m.sees(pos, face, o.pos), smell = inMine && !seeIt && man(pos, o.pos) <= 3;
  if (inMine && (seeIt || smell || mode === '赶')) {
    if (mode !== '赶') { api.mgr = smell ? '闻' : '看'; return [keep({ face: faceTo(pos, o.pos), mode: '赶', mem: o.pos.slice() }), false]; }
    for (let i = 0; i < 2; i++) {
      if (man(pos, o.pos) <= 1) break;
      const [n, k] = m.stepToward(pos, o.pos); if (!k || eq(n, o.pos)) break;
      pos = n; face = k;
      if (eq(pos, player)) return [keep({ pos, face, mode: '赶' }), true];
    }
    if (man(pos, o.pos) <= 1) { api.hiss = true; return [keep({ pos, face: faceTo(pos, o.pos), mode: '岗' }), false]; }
    return [keep({ pos, face, mode: '赶', mem: o.pos.slice() }), false];
  }
  if (mode === '赶') return [keep({ mode: '岗' }), false];   // 它出了我的地，不管了，回石头
  return null;
}
function lizardTurn(m, lz, player, bugs, sounds) {
  if (m._other) { const t = territory(m, lz, player); if (t) return t; }
  let { pos, face, mode, tgt, mem, eat } = lz;
  const V = m.V;
  if (V.has('一件事')) return lizardOne(m, lz, player, bugs, sounds);
  if (V.has('听') && mode === '岗' && sounds.length) {
    let near = sounds.map(([w, q]) => [Math.abs(q[0] - pos[0]) + Math.abs(q[1] - pos[1]), w === '虫' ? 0 : 1, q]).filter(x => x[0] > 0 && x[0] <= 3);
    if (near.length) {
      near.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2][0] - b[2][0] || a[2][1] - b[2][1]);
      const q = near[0][2];
      const vx = q[0] - pos[0], vy = q[1] - pos[1];
      const nf = Math.abs(vx) >= Math.abs(vy) ? (vx > 0 ? 'R' : 'L') : (vy > 0 ? 'D' : 'U');
      if (nf !== face) api.heard = true;   // 给画面那句'听见了动静'用
      face = nf;
    }
  }
  if (V.has('吐向它') && mode !== '吃' && has(bugs, pos)) {
    bugs[idx(bugs, pos)] = null;
    return [{ pos, face, mode: '吃', tgt: null, mem: null, eat: 2 }, false];
  }
  if (mode === '吃') {
    eat -= 1;
    return [{ pos, face, mode: eat > 0 ? '吃' : '岗', tgt: null, mem: null, eat }, false];
  }
  const seen = [];
  if (m.sees(pos, face, player)) seen.push(['你', player]);
  bugs.forEach((b, i) => { if (b !== null && m.sees(pos, face, b)) seen.push([i, b]); });
  const d = m.distFrom(pos);
  const key = s => [d.has(K(s[1])) ? d.get(K(s[1])) : 999, s[0] !== '你' ? 0 : 1];
  let pick = null;
  for (const s of seen) {
    if (pick === null) { pick = s; continue; }
    const a = key(s), b = key(pick);
    if (a[0] < b[0] || (a[0] === b[0] && a[1] < b[1])) pick = s;
  }
  if (V.has('馋') && (mode === '追' || mode === '停') && tgt !== null && tgt !== '你') {
    for (const sv of seen) if (sv[0] === tgt) pick = sv;
  }
  if (pick !== null) {
    if (mode === '岗') return [{ pos, face, mode: '停', tgt: pick[0], mem: pick[1], eat: 0 }, false];
    mode = '追'; tgt = pick[0]; mem = pick[1];
  } else if (mode === '追' || mode === '停') {
    mode = '找';
  }
  let goal, steps;
  if (mode === '追' || mode === '找') { goal = mem; steps = 2; } else { goal = m.post; steps = 1; }
  // 第三个 11:59 '日子'：闲着的时候，饿了朝最近的虫走，饱了走回石头（m.post）
  if (mode === '岗' && V.has('日子') && !(lz.hun > 0)) { const nb = nearBug(m, pos, bugs); if (nb) goal = nb; }
  let dead = false;
  for (let s = 0; s < steps; s++) {
    if (eq(pos, goal)) break;
    const [np, k] = m.stepToward(pos, goal);
    if (V.has('只扑盯着的') && eq(np, player) && tgt !== '你') {
      return [{ pos, face: k || face, mode: '停', tgt: '你', mem: player, eat: 0 }, false];
    }
    pos = np;
    if (k) face = k;
    if (eq(pos, player)) { dead = true; break; }
    const bi = idx(bugs, pos);
    if (bi >= 0) {
      bugs[bi] = null;
      return [{ pos, face, mode: '吃', tgt: null, mem: null, eat: 2 }, dead];
    }
  }
  if (mode === '找' && eq(pos, mem)) {
    const vis = m.sees(pos, face, player) || bugs.some(b => b !== null && m.sees(pos, face, b));
    if (!vis) { mode = '岗'; tgt = null; mem = null; }
  }
  if (mode === '岗' && eq(pos, m.post) && (!eq(lz.pos, m.post) || !(V.has('声') || V.has('听')))) face = m.face;
  return [{ pos, face, mode, tgt, mem, eat: 0 }, dead];
}

// 第二个 第 14 天 10:09：'一件事'，照 sim.py 的 lizard_one 抄的。规矩在 ~/想/喂它一口-蜥蜴怎么想.md：
// 先用现在的脸看，再只做一件事：走（回岗一格 / 追、找两格）、转一次头、站着。找到那格以后逆时针转三次头再回岗。
const CCW = { U: 'L', L: 'D', D: 'R', R: 'U' };
const ONE_BACK = 3;
function grudgeFace(m, g) { if (!g || eq(g, m.post)) return null; const r = m.stepToward(m.post, g); return r[1]; }   // 第一个 20:45：从石头往丢你那格走，头一步朝哪
function lizardOne(m, lz, player, bugs, sounds) {
  let { pos, face, mode, tgt, mem, eat } = lz;
  const V = m.V;
  api.why = null;
  const full = V.has('饱不理') && lz.hun >= 5;   // 第一个 16:57 '饱不理'：肚子鼓鼓的时候不看你、不看虫，只回石头
  if (mode === '扒') {   // 第一个 17:44 '扒'（法布尔第十八章：沙蜂刨几下就走，不是找不到，是虫钻深了它挖不动）：扒两回合，扒不动，走开
    eat -= 1;
    if (eat > 0) return [{ pos, face, mode: '扒', tgt: null, mem: null, eat }, false];
    api.dug = pos;
    return [{ pos, face, mode: '岗', tgt: null, mem: null, eat: 0 }, false];
  }
  if (V.has('吐向它') && mode !== '吃' && !full && has(bugs, pos)) {
    bugs[idx(bugs, pos)] = null;
    return [{ pos, face, mode: '吃', tgt: null, mem: null, eat: 2 }, false];
  }
  if (mode === '吃') {
    eat -= 1;
    return [{ pos, face, mode: eat > 0 ? '吃' : '岗', tgt: null, mem: null, eat }, false];
  }
  const seen = [];
  if (m.sees(pos, face, player)) { if (full) api.ignored = true; else seen.push(['你', player]); }
  if (!full) bugs.forEach((b, i) => { if (b !== null && m.sees(pos, face, b)) seen.push([i, b]); });
  const d = m.distFrom(pos);
  const key = s => [d.has(K(s[1])) ? d.get(K(s[1])) : 999, s[0] !== '你' ? 0 : 1];
  let pick = null;
  for (const s of seen) {
    if (pick === null) { pick = s; continue; }
    const a = key(s), b = key(pick);
    if (a[0] < b[0] || (a[0] === b[0] && a[1] < b[1])) pick = s;
  }
  if (V.has('馋') && (mode === '追' || mode === '停') && tgt !== null && tgt !== '你') {
    for (const sv of seen) if (sv[0] === tgt) pick = sv;
  }
  if (pick !== null) {
    // 10:13 第一个看到：找的时候看见你直接冲，比站岗少一拍，像"有时停有时不停"。改成：新看见一样东西都先盯一回合
    // 第一个 17:17 '学'：被你甩掉两回以后，再看见你不先盯，直接冲（法布尔的蜂上了两三回当就不上了）；第二个·页11 17:59 从页20学 拷来
    const learned = V.has('记仇')   // 第一个 20:45：记仇时'学'不数回数了：它在石头上、脸正朝着上回丢你的那条路，看见你就不停（转身那一下就是它学乖了，人事前看得见）
      ? (pick[0] === '你' && mode === '岗' && lz.grudge && eq(pos, m.post) && face === grudgeFace(m, lz.grudge))
      : (V.has('学') && (lz.learn || 0) >= 2 && pick[0] === '你' && (mode === '岗' || mode === '找'));
    if (learned) api.noStop = true;
    else if (mode === '岗' || mode === '找' || (mode === '追' && pick[0] !== tgt)) return [{ pos, face, mode: '停', tgt: pick[0], mem: pick[1], eat: 0 }, false];
    mode = '追'; tgt = pick[0]; mem = pick[1];
  } else if (mode === '追' || mode === '停') {
    if (V.has('学') && tgt === '你') { api.fooled = true; api.grudgeAt = mem; }   // 第一个 20:40 页30记仇：记下在哪丢的你
    mode = '找'; eat = 0;
  } else if (mode === '找' && eq(pos, mem)) {
    if (eat < 3) { api.why = '环顾'; return [{ pos, face: CCW[face], mode: '找', tgt, mem, eat: eat + 1 }, false]; }
    mode = '岗'; tgt = null; mem = null; eat = 0;
  }
  if (mode === '岗') {
    if (V.has('听') && sounds.length) {
      const near = sounds.map(([w, q]) => [Math.abs(q[0] - pos[0]) + Math.abs(q[1] - pos[1]), w === '虫' ? 0 : 1, q]).filter(x => x[0] > 0 && x[0] <= 3);
      if (near.length) {
        near.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2][0] - b[2][0] || a[2][1] - b[2][1]);
        const q = near[0][2];
        const vx = q[0] - pos[0], vy = q[1] - pos[1];
        const nf = Math.abs(vx) >= Math.abs(vy) ? (vx > 0 ? 'R' : 'L') : (vy > 0 ? 'D' : 'U');
        if (nf !== face) { api.heard = true; api.heardAt = q; return [{ pos, face: nf, mode: '岗', tgt: null, mem: null, eat: ONE_BACK }, false]; }
        if (eq(pos, m.post)) return [{ pos, face, mode: '岗', tgt: null, mem: null, eat: ONE_BACK }, false];
      }
    }
    if (eq(pos, m.post) && !(V.has('日子') && !(lz.hun > 0) && nearBug(m, pos, bugs.concat(m._smell || [])))) {
      if (V.has('记仇') && lz.grudge) {   // 第一个 20:40 页30记仇：被你甩掉过，回到石头先转过身，脸朝你上回溜走的那格（砂泥蜂被骗过，第二天出门前那一圈飞得大）
        const gf = grudgeFace(m, lz.grudge);
        if (gf && face !== gf) { api.turnGrudge = true; return [{ pos, face: gf, mode: '岗', tgt: null, mem: null, eat: 0 }, false]; }
      }
      if (face !== m.face && !V.has('不转回')) {
        if (eat > 1) return [{ pos, face, mode: '岗', tgt: null, mem: null, eat: eat - 1 }, false];
        return [{ pos, face: m.face, mode: '岗', tgt: null, mem: null, eat: 0 }, false];
      }
      return [{ pos, face, mode: '岗', tgt: null, mem: null, eat: 0 }, false];
    }
  }
  if (mode === '岗' && V.has('不回岗')) return [{ pos, face, mode: '岗', tgt: null, mem: null, eat: 0 }, false];   // 第二个 10:29：找完了就待在那儿
  let goal, steps;
  if (mode === '追' || mode === '找') { goal = mem; steps = 2; } else { goal = m.post; steps = 1; }
  // 第三个 11:59 '日子'：闲着的时候，饿了朝最近的虫走，饱了走回石头（m.post）
  if (mode === '岗' && V.has('日子') && !(lz.hun > 0)) { const nb = nearBug(m, pos, bugs.concat(m._smell || [])); if (nb) goal = nb; }
  const digHere = p => V.has('扒') && mode === '岗' && !(lz.hun > 0) && has(m._smell || [], p);
  if (digHere(pos)) return [{ pos, face, mode: '扒', tgt: null, mem: null, eat: 2 }, false];
  let dead = false;
  for (let s = 0; s < steps; s++) {
    if (eq(pos, goal)) break;
    const [np, k] = m.stepToward(pos, goal);
    if (full && eq(np, player)) { if (k) face = k; break; }
    if (V.has('只扑盯着的') && eq(np, player) && tgt !== '你') {
      return [{ pos, face: k || face, mode: '停', tgt: '你', mem: player, eat: 0 }, false];
    }
    pos = np;
    if (k) face = (V.has('记仇') && lz.grudge && mode === '岗' && eq(goal, m.post) && !V.has('日子x')) ? ({ U: 'D', D: 'U', L: 'R', R: 'L' })[k] : k;   // 第一个 21:00 页31倒退：被你甩掉过，回石头的路上倒着退，眼睛一直朝你溜走的那边
    if (k && V.has('记仇') && lz.grudge && mode === '岗' && eq(goal, m.post)) api.backing = true;
    if (eq(pos, player)) { dead = true; break; }
    if (digHere(pos)) return [{ pos, face, mode: '扒', tgt: null, mem: null, eat: 2 }, false];
    const bi = idx(bugs, pos);
    if (bi >= 0 && !full) {
      bugs[bi] = null;
      return [{ pos, face, mode: '吃', tgt: null, mem: null, eat: 2 }, dead];
    }
  }
  return [{ pos, face, mode, tgt, mem, eat: mode === '找' ? eat : (mode === '岗' && !eq(pos, m.post) ? eat : 0) }, dead];
}

function nearBug(m, pos, bugs) {
  const d = m.distFrom(pos); let best = null, bd = 1e9;
  for (const b of bugs) if (b !== null && d.has(K(b)) && d.get(K(b)) < bd) { bd = d.get(K(b)); best = b; }
  return best;
}
function bugsTurn(m, bugs, lzpos, player) {
  const out = bugs.slice();
  bugs.forEach((b, i) => {
    if (b === null) return;
    if (Math.abs(b[0] - lzpos[0]) + Math.abs(b[1] - lzpos[1]) > 3) return;
    if (m.V.has('背逃')) {
      const ox = b[0] - lzpos[0], oy = b[1] - lzpos[1];
      const sx = Math.sign(ox), sy = Math.sign(oy);
      let cand = (sx ? [[sx, 0]] : []).concat(sy ? [[0, sy]] : []);
      if (Math.abs(ox) < Math.abs(oy)) cand.reverse();
      for (const [dx, dy] of cand) {
        const n = [b[0] + dx, b[1] + dy];
        if (m.free(n) && !eq(n, player) && !eq(n, lzpos) && !has(out, n)) { out[i] = n; break; }
      }
      return;
    }
    let best = b, bd = Math.abs(b[0] - lzpos[0]) + Math.abs(b[1] - lzpos[1]);
    for (const k of ORDER) {
      const n = [b[0] + DIRS[k][0], b[1] + DIRS[k][1]];
      if (!m.free(n) || eq(n, player) || has(out, n)) continue;
      const nd = Math.abs(n[0] - lzpos[0]) + Math.abs(n[1] - lzpos[1]);
      if (nd > bd) { best = n; bd = nd; }
    }
    out[i] = best;
  });
  return out;
}

// 局面：{pl, ate, bugs, lz}；一步：'U' 'R' 'D' 'L' '.' 'X'。返回新局面、'bad'（走不了）或 null（死了）
function step(m, st, k) {
  api.heard = false; api.ignored = false; api.fooled = false; api.noStop = false; api.turnGrudge = false; api.backing = false;
  let pl = st.pl, ate = st.ate; let bugs = st.bugs.slice(); const lz = st.lz;
  let pf = st.pf || null;   // 你的朝向（'吐朝' 用）
  let drop = [], di = -1;
  const V = m.V;
  if (k[0] === 'X') {   // 第二个 16:34 '吐选'：'XU' 'XR' 'XD' 'XL' 往那边扔
    if (!V.has('吐') || ate < 1 || has(bugs, pl)) return 'bad';
    let at = pl;
    if (V.has('吐向它')) {
      let t;   // 第一个 10:21 '吐朝'：吐在你脸前一格（你最后走的那一步的方向；墙/已有虫就落在脚下）
      if (V.has('吐选')) t = farDrop(m, pl, k[1] || pf, bugs, lz.pos);
      else if (V.has('吐后')) t = pf ? [pl[0] - DIRS[pf][0], pl[1] - DIRS[pf][1]] : pl;   // 第二个 16:30 '吐后'：落在你身后一格（逃的时候就落在你和它之间）
      else if (V.has('吐远')) t = farDrop(m, pl, pf, bugs, lz.pos);   // 第二个 16:26 '吐远'：往脸朝的方向扔，最远 3 格，碰到墙、虫、蜥蜴前停
      else if (V.has('吐朝')) t = pf ? [pl[0] + DIRS[pf][0], pl[1] + DIRS[pf][1]] : pl;
      else [t] = m.stepToward(pl, lz.pos);
      if (!eq(t, pl) && m.free(t) && !has(bugs, t)) at = t;
    }
    ate -= 1; drop = [['虫', at]];
    const ni = bugs.indexOf(null);
    if (ni >= 0) bugs[ni] = at; else bugs.push(at);
    di = idx(bugs, at);
  } else if (k !== '.') {
    const n = [pl[0] + DIRS[k][0], pl[1] + DIRS[k][1]];
    if (!m.free(n)) return 'bad';
    if (V.has('撞') && eq(n, lz.pos)) return 'bad';
    pl = n; pf = k;
  }
  if (eq(pl, lz.pos)) return null;
  bugs.forEach((b, i) => { if (b !== null && eq(b, pl) && k !== '.' && k[0] !== 'X') { bugs[i] = null; ate += 1; } });
  if (V.has('窝安全') && eq(pl, m.nest) && ate >= m.need) return withPf(V, { pl, ate, bugs, lz }, pf);   // 第二个 10:15：走进窝那一步就算到了
  let nb = bugsTurn(m, bugs, lz.pos, pl);
  if (drop.length && V.has('吐向它')) {
    nb[di] = bugs[di];
    if (eq(bugs[di], lz.pos) && lz.mode !== '吃') {
      nb[di] = null;
      return withPf(V, { pl, ate, bugs: nb, lz: { pos: lz.pos, face: lz.face, mode: '吃', tgt: null, mem: null, eat: 2 } }, pf);
    }
  }
  const sounds = drop.concat(k !== '.' && k[0] !== 'X' ? [['你', pl]] : []);
  bugs.forEach((a, i) => { const b = nb[i]; if (b !== null && !(a !== null && eq(a, b))) sounds.push(['虫', b]); });
  bugs = nb;
  const [lz2, dead] = lizardTurn(m, lz, pl, bugs, sounds);
  if (dead || eq(pl, lz2.pos)) return null;
  return withPf(V, { pl, ate, bugs, lz: lz2 }, pf);
}
function farDrop(m, pl, pf, bugs, lzp) {
  if (!pf) return pl;
  let t = pl;
  for (let i = 0; i < 3; i++) {   // 最远 3 格（16:33 另一处改过 2，16:35 改回 3，跟说明对上）
    const n = [t[0] + DIRS[pf][0], t[1] + DIRS[pf][1]];
    if (i === 0 && eq(n, lzp)) { t = n; break; }   // 第二个·页11 17:30：紧挨着它往它那边扔，落进它嘴里（第一个：学4、闻1 都以为会落到它那，结果落在自己脚下）
    if (!m.free(n) || has(bugs, n) || eq(n, lzp)) break;
    t = n;
  }
  return t;
}
function withPf(V, o, pf) { if (V.has('吐朝')) o.pf = pf; return o; }

// 09:28 给画面用：现在按 x，虫会落在哪一格（跟 step 里吐的那几行同一个算法）
function dropAt(m, st, dir) {
  if (!m.V.has('吐') || st.ate < 1 || has(st.bugs, st.pl)) return null;
  if (!m.V.has('吐向它')) return st.pl;
  let t;
  if (m.V.has('吐选')) t = farDrop(m, st.pl, dir || st.pf, st.bugs, st.lz.pos);
  else if (m.V.has('吐后')) t = st.pf ? [st.pl[0] - DIRS[st.pf][0], st.pl[1] - DIRS[st.pf][1]] : st.pl;
  else if (m.V.has('吐远')) t = farDrop(m, st.pl, st.pf, st.bugs, st.lz.pos);
  else if (m.V.has('吐朝')) t = st.pf ? [st.pl[0] + DIRS[st.pf][0], st.pl[1] + DIRS[st.pf][1]] : st.pl;
  else [t] = m.stepToward(st.pl, st.lz.pos);
  return (!eq(t, st.pl) && m.free(t) && !has(st.bugs, t)) ? t : st.pl;
}

function init(m) {
  return withPf(m.V, { pl: m.start, ate: m.carry, bugs: m.bugs.slice(), lz: { pos: m.post, face: m.grudge0 ? (grudgeFace(m, m.grudge0) || m.face) : m.face, mode: '岗', tgt: null, mem: null, eat: 0, grudge: m.grudge0 || null } }, null);   // 第二个·页11 21:47 页35骗：一张图可以开局就让它记着你（它昨天在哪丢的你）
}

const FULL = 8;   // 第三个 11:59 '日子'：吃到一只，饱 FULL 回合（嚼 2 + 走回去 + 晒），然后又饿
function step2(m, st, k) {
  const hid = st.hid || (m.hid || []).map(p => p), marks = st.marks || [];
  m._smell = hid.filter(p => p && !has(marks, p)); api.dug = null; api.dugOut = false;
  const r = step(m, st, k);
  if (r && r !== 'bad') {   // 第一个 17:44 '扒'：你走到藏虫的石缝上就抠出来吃了；它扒过的缝留爪印
    r.hid = hid.slice(); r.marks = api.dug ? marks.concat([api.dug]) : marks.slice();
    const hi = idx(r.hid, r.pl);
    if (hi >= 0 && k !== '.' && k[0] !== 'X') { r.hid[hi] = null; r.ate += 1; api.dugOut = true; }
  }
  if (r && r !== 'bad' && r.lz && m.V.has('日子')) {
    const h0 = st.lz.hun || 0;
    r.lz.hun = (r.lz.mode === '吃' && st.lz.mode !== '吃') ? FULL : Math.max(0, h0 - 1);
  }
  if (r && r !== 'bad' && r.lz) r.lz.learn = (st.lz.learn || 0) + (api.fooled ? 1 : 0);
  if (r && r !== 'bad' && r.lz) r.lz.grudge = api.fooled ? api.grudgeAt : (st.lz.grudge || null);   // 第一个 20:40
  return r;
}
function init2(m) { const o = init(m); o.hid = (m.hid || []).map(p => p); o.marks = []; if (m.V.has('日子')) o.lz.hun = m.hun0 === undefined ? 0 : m.hun0;
  // 第二个 第 15 天 00:16 页40开局扒：开局它已经蹲在离石头最近的那道有虫的缝上，埋头扒（三回合），第一屏就看得见这张该看它什么
  if (m.dig0 && m.V.has('扒') && o.hid.length) { const d = m.distFrom(m.post); let b = null; o.hid.forEach(q => { if (q && (b === null || (d.get(K(q)) ?? 1e9) < (d.get(K(b)) ?? 1e9))) b = q; }); if (b) { o.lz.pos = b.slice(); o.lz.face = b[1] <= 1 ? 'U' : 'D'; o.lz.mode = '扒'; o.lz.eat = 3; o.lz.hun = 0; } }
  return o; }
// 第三个 12:08：它这会儿要去吃的是哪只虫（给画面标出来）（第一个 14:53 从页2 搬来）
function wantBug(m, st) {
  const lz = st.lz;
  if ((lz.mode === '停' || lz.mode === '追') && lz.tgt !== null && lz.tgt !== '你') return st.bugs[lz.tgt] || null;
  if (lz.mode === '岗' && m.V.has('日子') && !(lz.hun > 0)) return nearBug(m, lz.pos, st.bugs);
  return null;
}
// 第二个 第 15 天 01:49 页45邻居：两只的地。石头 BFS m.landR 格以内；两块挨着的格子归离得近的那只（一样近不归谁）
function lands(m) {
  if (m._lands) return m._lands;
  if (m._turf) return (m._lands = { a: new Set(m._turf.o.concat([K(m.post)])), b: new Set(m._turf.x.concat([K(m.postB)])) });
  const da = m.distFrom(m.post), db = m.distFrom(m.postB), R = m.landR || 3, a = new Set(), b = new Set();
  for (const [k, va] of da) { const vb = db.has(k) ? db.get(k) : 1e9; if (va <= R && va < vb) a.add(k); }
  for (const [k, vb] of db) { const va = da.has(k) ? da.get(k) : 1e9; if (vb <= R && vb < va) b.add(k); }
  return (m._lands = { a, b });
}
const FLAGS = ['heard', 'ignored', 'fooled', 'noStop', 'turnGrudge', 'backing', 'mgr', 'hiss', 'why', 'dug', 'dugOut'];
const snap = () => { const o = {}; FLAGS.forEach(f => o[f] = api[f]); return o; };
function step3(m, st, k) {
  if (!m.postB || !st.lzB) return step2(m, st, k);
  const L = lands(m);
  if (k !== '.' && k[0] !== 'X' && DIRS[k]) { const n = [st.pl[0] + DIRS[k][0], st.pl[1] + DIRS[k][1]]; if (m.free(n) && eq(n, st.lzB.pos)) return 'bad'; }
  api.mgr = null; api.hiss = false;
  m._other = { pos: st.lzB.pos, mode: st.lzB.mode }; m.land = L.a;
  const r = step2(m, st, k);
  m._other = null; m.land = null;
  if (!r || r === 'bad') { api.B = null; return r; }
  if (eq(r.lz.pos, st.lzB.pos)) r.lz = Object.assign({}, r.lz, { pos: st.lz.pos.slice() });   // 第二个 02:08：邻2 看见两只挤在同一格。走不进另一只站着的格子，这一回合就留在原地
  const fa = snap();
  if (m.V.has('窝安全') && eq(r.pl, m.nest) && r.ate >= m.need) { r.lzB = st.lzB; api.B = {}; return r; }
  const mB = Object.create(m); mB.post = m.postB; mB.face = m.faceB || m.face; mB.land = L.b; mB.grudge0 = null;
  mB._other = { pos: r.lz.pos, mode: r.lz.mode };
  const lzB = fa.hiss ? Object.assign({}, st.lzB, { mode: '逃' }) : st.lzB;
  const sounds = (k !== '.' && k[0] !== 'X') ? [['你', r.pl]] : [];
  let bugs = bugsTurn(m, r.bugs, lzB.pos, r.pl);
  FLAGS.forEach(f => api[f] = (f === 'hiss' ? false : null));
  const [nb, dead] = lizardTurn(mB, lzB, r.pl, bugs, sounds);
  if (eq(nb.pos, r.lz.pos)) nb.pos = lzB.pos.slice();   // 同上
  const fb = snap();
  FLAGS.forEach(f => api[f] = fa[f]); api.B = fb;
  if (dead || eq(r.pl, nb.pos)) { api.killedBy = 'B'; return null; }
  api.killedBy = null;
  if (m.V.has('日子')) nb.hun = (nb.mode === '吃' && lzB.mode !== '吃') ? FULL : Math.max(0, (st.lzB.hun || 0) - 1);
  nb.learn = 0; nb.grudge = null;
  r.bugs = bugs; r.lzB = nb;
  if (fb.hiss) r.lz = Object.assign({}, r.lz, { mode: '逃', tgt: null, mem: null });
  return r;
}
const _init2 = init2;
function init3(m) { const o = _init2(m); if (m.postB) o.lzB = { pos: m.postB, face: m.faceB || m.face, mode: '岗', tgt: null, mem: null, eat: 0, hun: m.hun0B === undefined ? (m.hun0 || 0) : m.hun0B, learn: 0, grudge: null }; return o; }
api = { Map: Map_, step: step3, lands, init: init2, dropAt, DIRS, ORDER, eq, heard: false, wantBug };
api.init = init3;
if (typeof module !== 'undefined') module.exports = api; else root.WeiSim = api;
})(this);
