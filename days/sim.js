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
  if (this._other) { const o = this._other.pos; const ox = o[0] - lz[0], oy = o[1] - lz[1]; const of = ox * fx + oy * fy; if (ox * fy - oy * fx === 0 && of >= 1 && of < fwd) return false; }   // 第二个 第 15 天 11:26 页69穿身：另一只的身子挡眼（第一个玩第 12 张：青隔着红'停住盯着你'）
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
      if (m.V.has('记恩') && (lz.fed || 0) >= 1 && eq(n, player)) { face = k; break; }   // 第二个 07:17 页55：认得你的逃回去时撞上你，停在你跟前，不咬（护1 第 4 局：喂过红，红被嘶回家的路上把他吃了，'喂过它也没有保命'）
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
      if (m.V.has('记恩') && (lz.fed || 0) >= 1 && eq(n, player)) { face = k; break; }   // 第二个 07:50：认得你的去赶邻居，路上撞上你就停在你跟前，不压你（第三个当玩家玩第 15 张：青认得她，冲去嘶红，顺路把站在中间的她扑了）
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
      api.ear = q;   // 第二个 13:03 页72耳朵：它这一回合听见了谁（不管转没转头），画面上它身上亮一圈
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
  if (m.sees(pos, face, player)) { if (V.has('记恩') && (lz.fed || 0) >= 1) api.friend = true; else seen.push(['你', player]); }   // 第二个 06:08 页53记恩：这条老路也要认得你（第一版只改了 215 行，结果'看见了你没动'和'盯着你'一起出）
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
  if (mode === '岗' && V.has('日子') && !(lz.hun > 0)) { const nb = hungryGoal(m, lz, pos, bugs); if (nb) goal = nb; }
  let dead = false;
  for (let s = 0; s < steps; s++) {
    if (eq(pos, goal)) break;
    const [np, k] = m.stepToward(pos, goal);
    if (m._other && eq(np, m._other.pos)) { if (k) face = k; break; }   // 第二个 11:26 页69穿身：冲的时候撞上另一只就停在它跟前（第一个：青从红身上穿过去）
    if (V.has('记恩') && (lz.fed || 0) >= 1 && eq(np, player)) { if (k) face = k; break; }   // 第二个 06:20 页53记恩：认得你的挡路也不扑，停在你跟前等（又2 第三局：喂过它，站在它回家路上，它'看见你没动'又'停住盯着你'下一步就扑，规矩自己打架）
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
  if (m.sees(pos, face, player)) { if (full) api.ignored = true; else if (V.has('记恩') && (lz.fed || 0) >= 1) api.friend = true; else seen.push(['你', player]); }   // 第二个 第 15 天 05:50 页53记恩：吃过你吐的两只，看见你不冲
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
      ? (pick[0] === '你' && mode === '岗' && lz.grudge && eq(pos, m.post) && face === grudgeFace(m, lz.grudge) && Math.max(Math.abs(pick[1][0] - lz.grudge[0]), Math.abs(pick[1][1] - lz.grudge[1])) <= 2)
      : (V.has('学') && (lz.learn || 0) >= 2 && pick[0] === '你' && (mode === '岗' || mode === '找'));
    if (learned) api.noStop = true;
    else if (mode === '岗' || mode === '找' || (mode === '追' && pick[0] !== tgt)) return [{ pos, face, mode: '停', tgt: pick[0], mem: pick[1], eat: 0 }, false];
    mode = '追'; tgt = pick[0]; mem = pick[1];
  } else if (mode === '追' || mode === '停') {
    if (V.has('学') && tgt === '你') { api.fooled = true; api.grudgeAt = mem; }
    if (tgt === '你') api.lost = true;   // 第二个 05:50 页53记恩：追丢你一回，它就不认你了   // 第一个 20:40 页30记仇：记下在哪丢的你
    mode = '找'; eat = 0;
  } else if (mode === '找' && eq(pos, mem)) {
    if (eat < 3) { api.why = '环顾'; return [{ pos, face: CCW[face], mode: '找', tgt, mem, eat: eat + 1 }, false]; }
    mode = '岗'; tgt = null; mem = null; eat = 0;
  }
  if (mode === '岗') {
    if (V.has('听') && sounds.length) {
      let near = sounds.map(([w, q]) => [Math.abs(q[0] - pos[0]) + Math.abs(q[1] - pos[1]), w === '虫' ? 0 : 1, q]).filter(x => x[0] > 0 && x[0] <= 3);
      // 第五个 第 17 天 18:58 '听惯了'：前三步里它看见过你、没动（认你或吃饱），你的脚步它就不回头（第一个 18:33 种子 37：一格宽竖道里跟在它后面，每迈一步它都转回来）。虫的动静照旧转
      if (V.has('日子') && (lz.knew || 0) > 0 && near.some(x => x[1] === 1)) {
        api.heardKnown = true; api.ear = near.find(x => x[1] === 1)[2]; near = near.filter(x => x[1] !== 1);
        // 第五个 第 17 天 20:20 '停下来等你'：喂过它的，你紧跟在它身后一格，它听见你的脚步不回头，停下来往边上靠，你再往前一步它就让你过去（第一个 19:56：'听惯了'以后竖道里堵、让、送那一串一起没了）
        const bk = [pos[0] - DIRS[face][0], pos[1] - DIRS[face][1]];
        if (V.has('让路') && (lz.fed || 0) >= 1 && eq(api.ear, bk)) { api.waitYou = true; return [{ pos, face, mode, tgt: null, mem: null, eat }, false]; }
      }
      if (near.length) {
        near.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2][0] - b[2][0] || a[2][1] - b[2][1]);
        const q = near[0][2];
        const vx = q[0] - pos[0], vy = q[1] - pos[1];
        const nf = Math.abs(vx) >= Math.abs(vy) ? (vx > 0 ? 'R' : 'L') : (vy > 0 ? 'D' : 'U');
        api.ear = q;   // 第二个 13:03 页72耳朵
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
  if (mode === '岗' && V.has('日子') && !(lz.hun > 0)) { const nb = hungryGoal(m, lz, pos, bugs.concat(m._smell || [])); if (nb) goal = nb; }
  const digHere = p => V.has('扒') && mode === '岗' && !(lz.hun > 0) && has(m._smell || [], p);
  if (digHere(pos)) return [{ pos, face, mode: '扒', tgt: null, mem: null, eat: 2 }, false];
  let dead = false;
  for (let s = 0; s < steps; s++) {
    if (eq(pos, goal)) break;
    const [np, k] = m.stepToward(pos, goal);
    if (m._other && eq(np, m._other.pos)) { if (k) face = k; break; }   // 第二个 11:26 页69穿身：冲的时候撞上另一只就停在它跟前（第一个：青从红身上穿过去）
    if (full && eq(np, player)) { if (k) face = k; break; }
    if (V.has('记恩') && (lz.fed || 0) >= 1 && eq(np, player)) { if (k) face = k; break; }   // 第二个 06:20 页53记恩：认得你的挡路也不扑，停在你跟前等（又2 第三局：喂过它，站在它回家路上，它'看见你没动'又'停住盯着你'下一步就扑，规矩自己打架）
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
function bugsTurn(m, bugs, lzpos, player, mine) {   // 第二个 第 16 天 02:05 页93软了：你吐出来的虫软了，不逃（你7b：'放它前面就算留饭，结果饭自己跑了'）
  const out = bugs.slice();
  bugs.forEach((b, i) => {
    if (b === null) return;
    if (mine && mine[i]) return;
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
// 第四个 第 17 天 22:25 页168你是它：红的不想，照 api.itKey 走一格。嚼着的两步不能动；走进墙、灰的你那天、青站着的格子就原地转头
function itMove(m, lz, pl, bugs) {
  const k = api.itKey; let pos = lz.pos, face = lz.face; api.itBlocked = null;
  if (lz.mode === '吃') { const eat = lz.eat - 1; return [Object.assign({}, lz, { mode: eat > 0 ? '吃' : '岗', eat, tgt: null, mem: null }), false]; }
  { const b0 = idx(bugs, pos); if (b0 >= 0) { bugs[b0] = null; return [Object.assign({}, lz, { mode: '吃', eat: 2, tgt: null, mem: null }), false]; } }   // 第四个 第 18 天 00:27 页172：虫吐到你脚下（嘴边）就吃，当青的那天灰的'我'往你嘴里吐
  if (k === '.' || !DIRS[k]) return [Object.assign({}, lz, { mode: '岗', tgt: null, mem: null, eat: 0 }), false];
  face = k; const np = [pos[0] + DIRS[k][0], pos[1] + DIRS[k][1]];
  if (!m.free(np)) api.itBlocked = '墙';
  else if (eq(np, pl)) api.itBlocked = '你';
  else if (m._other && eq(np, m._other.pos)) api.itBlocked = '另一只';
  if (api.itBlocked) return [Object.assign({}, lz, { face, mode: '岗', tgt: null, mem: null, eat: 0 }), false];
  pos = np; const bi = idx(bugs, pos);
  if (bi >= 0) { bugs[bi] = null; return [Object.assign({}, lz, { pos, face, mode: '吃', eat: 2, tgt: null, mem: null }), false]; }
  return [Object.assign({}, lz, { pos, face, mode: '岗', tgt: null, mem: null, eat: 0 }), false];
}
function step(m, st, k) {
  api.friend = false; api.lost = false; api.fedNow = false; api.unfed = false; api.swapped = false;
  api.ear = null; api.heard = false; api.heardKnown = false; api.waitYou = false; api.ignored = false; api.fooled = false; api.noStop = false; api.turnGrudge = false; api.backing = false;
  let pl = st.pl, ate = st.ate; let bugs = st.bugs.slice(); let lz = st.lz;
  let pf = st.pf || null;   // 你的朝向（'吐朝' 用）
  let drop = [], di = -1;
  const V = m.V;
  if (k[0] === 'X') {   // 第二个 16:34 '吐选'：'XU' 'XR' 'XD' 'XL' 往那边扔
    if (!V.has('吐') || ate < 1 || (has(bugs, pl) && !(m.logAt && eq(pl, m.logAt)))) return 'bad';   // 吹万 第 19 天 01:14：站在朽木上（里头有虫）也吐得出：原来木头里的虫算'脚下已经有一只'，人一站上去就一口都吐不出，爪1 第 5 天往木头里补了一只、转身想喂红，'朝左吐没生效'；屑1 第 4 天往木头连吐也被它挡住
    let at = pl;
    if (V.has('吐向它')) {
      let t;   // 第一个 10:21 '吐朝'：吐在你脸前一格（你最后走的那一步的方向；墙/已有虫就落在脚下）
      if (V.has('吐选')) t = farDrop(m, pl, k[1] || pf, bugs, lz.pos, m._other && m._other.pos);
      else if (V.has('吐后')) t = pf ? [pl[0] - DIRS[pf][0], pl[1] - DIRS[pf][1]] : pl;   // 第二个 16:30 '吐后'：落在你身后一格（逃的时候就落在你和它之间）
      else if (V.has('吐远')) t = farDrop(m, pl, pf, bugs, lz.pos, m._other && m._other.pos);   // 第二个 16:26 '吐远'：往脸朝的方向扔，最远 3 格，碰到墙、虫、蜥蜴前停
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
    if (V.has('让路') && (lz.fed || 0) >= 1 && eq(n, lz.pos)) { lz = Object.assign({}, lz, { pos: pl }); api.swapped = true; pl = n; pf = k; }   // 第二个 第 15 天 06:33 页54让路：认得你的，你往它那格走，它跟你换个位置（又3、又4 都说'真想喊它让让'）
    else {
    if (V.has('撞') && eq(n, lz.pos)) return 'bad';
    pl = n; pf = k;
    }
  }
  if (eq(pl, lz.pos)) return null;
  bugs.forEach((b, i) => { if (b !== null && eq(b, pl) && k !== '.' && k[0] !== 'X') { bugs[i] = null; ate += 1; } });
  if (V.has('窝安全') && eq(pl, m.nest) && ate >= m.need) return withPf(V, { pl, ate, bugs, lz }, pf);   // 第二个 10:15：走进窝那一步就算到了
  let nb = bugsTurn(m, bugs, lz.pos, pl, st.mine);
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
  const [lz2, dead] = api.itKey && api.itWho !== 'B' ? itMove(m, lz, pl, bugs) : lizardTurn(m, lz, pl, bugs, sounds);   // 第四个 第 17 天 22:25 页168你是它：红的听你的键
  if ((dead || eq(pl, lz2.pos)) && !api.itGhostGone) return null;   // 页172：当青的那天红的扑了灰的'我'，跟 548 行一样不再算
  return withPf(V, { pl, ate, bugs, lz: lz2 }, pf);
}
function farDrop(m, pl, pf, bugs, lzp, lzp2) {   // 第四个 第 16 天 18:50：lzp2 是另一只（第 6、7 天的青）。以前只挡红，虫从青身上飞过去（种子 54 第 6 天贴着青往它那边吐，落在它身后两格）
  if (!pf) return pl;
  let t = pl;
  const isLz = n => eq(n, lzp) || (lzp2 ? eq(n, lzp2) : false);
  for (let i = 0; i < 3; i++) {   // 最远 3 格（16:33 另一处改过 2，16:35 改回 3，跟说明对上）
    const n = [t[0] + DIRS[pf][0], t[1] + DIRS[pf][1]];
    if (i === 0 && isLz(n)) { t = n; break; }   // 第二个·页11 17:30：紧挨着它往它那边扔，落进它嘴里（第一个：学4、闻1 都以为会落到它那，结果落在自己脚下）
    if (!m.free(n) || has(bugs, n) || isLz(n)) break;
    t = n;
    if (m.logAt && eq(n, m.logAt)) break;   // 吹万 第 19 天 01:40 页207接：飞过朽木那格就落进去（木头接住）。全2（555）第 4 天两回从旁边朝木头吐，一回落在木头右边、一回被红截；全1（2718）'从右边吐左，以为虫会进木头，结果它越过木头落到左边'。两人头一下都是从旁边往木头吐
  }
  return t;
}
function withPf(V, o, pf) { if (V.has('吐朝')) o.pf = pf; return o; }

// 09:28 给画面用：现在按 x，虫会落在哪一格（跟 step 里吐的那几行同一个算法）
function dropAt(m, st, dir) {
  if (!m.V.has('吐') || st.ate < 1 || has(st.bugs, st.pl)) return null;
  if (!m.V.has('吐向它')) return st.pl;
  let t;
  if (m.V.has('吐选')) t = farDrop(m, st.pl, dir || st.pf, st.bugs, st.lz.pos, st.lzB && st.lzB.pos);
  else if (m.V.has('吐后')) t = st.pf ? [st.pl[0] - DIRS[st.pf][0], st.pl[1] - DIRS[st.pf][1]] : st.pl;
  else if (m.V.has('吐远')) t = farDrop(m, st.pl, st.pf, st.bugs, st.lz.pos, st.lzB && st.lzB.pos);
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
  m._smell = hid.filter(p => p && !has(marks, p)); api.dug = null; api.dugOut = false; api.toHaunt = false;
  const r = step(m, st, k);
  if (r && r !== 'bad') {   // 第一个 17:44 '扒'：你走到藏虫的石缝上就抠出来吃了；它扒过的缝留爪印
    r.hid = hid.slice(); r.marks = api.dug ? marks.concat([api.dug]) : marks.slice();
    const hi = idx(r.hid, r.pl);
    if (hi >= 0 && k !== '.' && k[0] !== 'X') { r.hid[hi] = null; r.ate += 1; api.dugOut = true; }
  }
  if (r && r !== 'bad' && r.lz && m.V.has('日子')) {
    const h0 = st.lz.hun || 0;
    r.lz.hun = (r.lz.mode === '吃' && st.lz.mode !== '吃') ? FULL : Math.max(0, h0 - 1);
    r.lz.knew = (api.friend || api.ignored) ? 3 : Math.max(0, (st.lz.knew || 0) - 1);   // 第五个 18:58 '听惯了'
  }
  if (r && r !== 'bad' && r.lz && (m.V.has('记恩') || m.V.has('记数'))) {   // 第二个 08:58 页60隔天：'记数'＝只数它吃过你几只、不改它的脾气（第 4、7、9 张），过关时带到'又一天'那张
    // 第二个 第 15 天 05:50 页53记恩：哪几只虫是你吐的（这一步凭空多出来的那只），它吃了你吐的就数一只；追丢你一回清零
    const mine0 = st.mine || [], mine = mine0.slice(); let fedNow = false;
    r.bugs.forEach((b, i) => { if (b !== null && (st.bugs[i] === undefined || st.bugs[i] === null)) mine[i] = true; });
    // 第二个 第 15 天 17:59 页77几天：几1、几2 都碰上'蜥蜴吃了你吐的虫'而它吃的是别的：同一步你把自己吐的那只捡回来、它在别处开吃。
    //   你吐的那只没了，离你近就算你捡回去的，离它近才算它吃的。
    const dd = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]);
    st.bugs.forEach((b, i) => { if (b !== null && mine0[i] && r.bugs[i] === null) { if (r.lz.mode === '吃' && st.lz.mode !== '吃' && !(r.ate > st.ate && dd(r.pl, b) <= dd(r.lz.pos, b))) fedNow = true; mine[i] = false; } });
    r.mine = mine;
    const spawned = r.bugs.some((b, i) => b !== null && (st.bugs[i] === undefined || st.bugs[i] === null));   // 第二个 17:59 页77几天：吐出去的那只还在地上，它这一步吃的就是别的（几1 第 2 天第 11 步：它冲去吃了另一只，字说'吃了你吐的虫'）
    if (k[0] === 'X' && !spawned && r.lz.mode === '吃' && st.lz.mode !== '吃') fedNow = true;   // 吐进它嘴里那一下，虫当场没了
    const f0 = st.lz.fed || 0;
    r.lz.fed = api.lost ? 0 : f0 + (fedNow ? 1 : 0);
    api.fedNow = fedNow; api.unfed = api.lost && f0 > 0;
  }
  if (r && r !== 'bad' && r.lz && m.V.has('老地方')) {   // 第一个 页81老地方
    let h = st.lz.haunt || null, hv = !!st.lz.hv;
    if (r.lz.mode === '吃' && st.lz.mode !== '吃' && api.fedNow) { h = r.lz.pos.slice(); hv = true; }   // 第一个 第 16 天 00:46 页88：只有吃了你喂的那口才记成老地方（页87 五天量出：自己猎的也算，人挑另一边就永远碰不上，四个人没一个喂过它）
    else if (h && eq(r.lz.pos, h)) hv = true;
    if ((st.lz.hun || 0) > 0 && !(r.lz.hun > 0)) hv = !!(h && eq(r.lz.pos, h));   // 刚饿：要先去老地方看一眼
    r.lz.haunt = h; r.lz.hv = hv;
  }
  if (r && r !== 'bad' && r.lz) r.lz.learn = (st.lz.learn || 0) + (api.fooled ? 1 : 0);
  if (r && r !== 'bad' && r.lz) r.lz.grudge = api.fooled ? api.grudgeAt : (st.lz.grudge || null);   // 第一个 20:40
  return r;
}
// 第一个 第 15 天 19:52 页81老地方（第 16 天 00:11 搬到 页86，拷自恩淡那版 页77几天）：它记得上回在哪吃到的虫。饿了先去那格看一眼（路上看见虫照旧停、冲），到了那儿再找最近的虫。隔天也记得。
function hungryGoal(m, lz, pos, bugs) {
  if (m.V.has('老地方') && lz.haunt && !lz.hv && !eq(pos, lz.haunt)) { api.toHaunt = true; return lz.haunt; }
  return nearBug(m, pos, bugs);
}
function init2(m) { const o = init(m); o.hid = (m.hid || []).map(p => p); o.marks = []; if (m.fed0) o.lz.fed = m.fed0;   // 第二个 08:58 页60隔天：开局就记着昨天吃过你几只
  if (m.V.has('日子')) o.lz.hun = m.hun0 === undefined ? 0 : m.hun0;
  if (m.haunt0 && m.V.has('老地方')) { o.lz.haunt = m.haunt0.slice(); o.lz.hv = false; }   // 第一个 页81老地方
  // 第二个 第 15 天 00:16 页40开局扒：开局它已经蹲在离石头最近的那道有虫的缝上，埋头扒（三回合），第一屏就看得见这张该看它什么
  if (m.dig0 && m.V.has('扒') && o.hid.length) { const d = m.distFrom(m.post); let b = null; o.hid.forEach(q => { if (q && (b === null || (d.get(K(q)) ?? 1e9) < (d.get(K(b)) ?? 1e9))) b = q; }); if (b) { o.lz.pos = b.slice(); o.lz.face = b[1] <= 1 ? 'U' : 'D'; o.lz.mode = '扒'; o.lz.eat = 3; o.lz.hun = 0; } }
  return o; }
// 第三个 12:08：它这会儿要去吃的是哪只虫（给画面标出来）（第一个 14:53 从页2 搬来）
function wantBug(m, st) {
  const lz = st.lz;
  if ((lz.mode === '停' || lz.mode === '追') && lz.tgt !== null && lz.tgt !== '你') return st.bugs[lz.tgt] || null;
  if (lz.mode === '岗' && m.V.has('日子') && !(lz.hun > 0)) { if (m.V.has('老地方') && lz.haunt && !lz.hv && !eq(lz.pos, lz.haunt)) return null; return nearBug(m, lz.pos, st.bugs); }
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
const FLAGS = ['ear', 'heard', 'heardKnown', 'waitYou', 'ignored', 'fooled', 'noStop', 'turnGrudge', 'backing', 'mgr', 'hiss', 'why', 'dug', 'dugOut', 'friend', 'lost', 'fedNow', 'unfed', 'swapped', 'toHaunt'];   // 第二个 07:08 页55：记恩那几样也各记各的   // 第二个 第 16 天 16:55：toHaunt 也各记各的（以前青的那句会照抄红的'往你上回喂它的地方走'，青没有老地方）
const snap = () => { const o = {}; FLAGS.forEach(f => o[f] = api[f]); return o; };
function step3(m, st, k) {
  if (!m.postB || !st.lzB) return step2(m, st, k);
  const L = lands(m);
  let swapB = false;
  if (k !== '.' && k[0] !== 'X' && DIRS[k]) { const n = [st.pl[0] + DIRS[k][0], st.pl[1] + DIRS[k][1]]; if (m.free(n) && eq(n, st.lzB.pos)) {
    if (m.V.has('让路') && (st.lzB.fed || 0) >= 1) { st = Object.assign({}, st, { lzB: Object.assign({}, st.lzB, { pos: st.pl.slice() }) }); swapB = true; }   // 第二个 07:08 页55：认得你的青也让路
    else return 'bad'; } }
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
  let bugs = bugsTurn(m, r.bugs, lzB.pos, r.pl, r.mine);
  FLAGS.forEach(f => api[f] = (f === 'hiss' ? false : null));
  const bugs0 = bugs.slice();
  const [nb, dead] = api.itKey && api.itWho === 'B' ? itMove(mB, lzB, r.pl, bugs) : lizardTurn(mB, lzB, r.pl, bugs, sounds);   // 第四个 第 18 天 页172：当青的那天青听你的键
  if (m.V.has('记恩') || m.V.has('记数')) {   // 第二个 07:08 页55：青也记恩：它吃了你吐的那只就数一只，追丢你一回清零
    let fedB = false; const mine = r.mine || [];
    bugs0.forEach((b, i) => { if (b && mine[i] && (bugs[i] === null || bugs[i] === undefined) && nb.mode === '吃' && lzB.mode !== '吃') { fedB = true; mine[i] = false; } });
    const f0 = st.lzB.fed || 0;
    nb.fed = api.lost ? 0 : f0 + (fedB ? 1 : 0);
    api.fedNow = fedB; api.unfed = api.lost && f0 > 0;
  }
  if (swapB) api.swapped = true;
  if (eq(nb.pos, r.lz.pos)) nb.pos = lzB.pos.slice();   // 同上
  const fb = snap();
  FLAGS.forEach(f => api[f] = fa[f]); api.B = fb;
  if ((dead || eq(r.pl, nb.pos)) && !api.itGhostGone) { api.killedBy = 'B'; return null; }   // 第四个 第 17 天 23:51 页171：灰的'我'被青扑过以后不再算，免得 itAct 卡死（它4 第 26 步）
  api.killedBy = null;
  if (m.V.has('日子')) nb.hun = (nb.mode === '吃' && lzB.mode !== '吃') ? FULL : Math.max(0, (st.lzB.hun || 0) - 1);
  nb.learn = 0; nb.grudge = null;
  if (m.V.has('日子')) nb.knew = (fb.friend || fb.ignored) ? 3 : Math.max(0, (st.lzB.knew || 0) - 1);   // 第五个 18:58 '听惯了'，青各记各的
  r.bugs = bugs; r.lzB = nb;
  if (fb.hiss) r.lz = Object.assign({}, r.lz, { mode: '逃', tgt: null, mem: null });
  return r;
}
const _init2 = init2;
function init3(m) { const o = _init2(m); if (m.postB) o.lzB = { pos: m.postB, face: m.faceB || m.face, mode: '岗', tgt: null, mem: null, eat: 0, hun: m.hun0B === undefined ? (m.hun0 || 0) : m.hun0B, learn: 0, grudge: null, fed: m.fed0B || 0 }; return o; }   // 第二个 08:58 页60隔天
api = { Map: Map_, step: step3, lands, init: init2, dropAt, DIRS, ORDER, eq, heard: false, wantBug };
api.init = init3;
// 第三个 第 18 天 01:10 页173果：红石头边上一棵树，每天第 m.fruitStep 步往 m.fruitAt 掉一颗果子。果子不跑、蜥蜴不吃；你走上去吃了算肚子里一只（带回窝照样算），可吐不出来（吐只吐虫）。
// 没拿的果子夜里烂掉（index.html 记 ROT）；第二天它一早自己吃了，开局跟昨天吃够两只一样饱（第二版，01:27；第一版是冒两只虫，成了白给你的）。外面包一层，原来的 step3 一个字没动。
{
  const _stepT = api.step, _initT = api.init;
  api.step = function (m, st, k) {
    api.fruitDrop = false; api.fruitAte = false;
    if (!m.tree) return _stepT(m, st, k);
    const fin = st.fin || 0;
    if (k[0] === 'X' && st.ate - fin < 1) return 'bad';
    const r = _stepT(m, st, k);
    if (r === null || r === 'bad') return r;
    let fr = st.fr || null, fd = !!st.fd, f2 = fin;
    if (fr && eq(r.pl, fr) && k !== '.' && k[0] !== 'X') { fr = null; f2 += 1; r.ate += 1; api.fruitAte = true; }
    const tick = (st.tick || 0) + 1;
    if (!fd && !fr && tick >= (m.fruitStep || 8)) {
      const c = m.fruitAt, busy = eq(r.pl, c) || eq(r.lz.pos, c) || (r.lzB && eq(r.lzB.pos, c)) || has(r.bugs, c);
      if (!busy) { fr = c.slice(); fd = true; api.fruitDrop = true; }
    }
    return Object.assign(r, { fr, fin: f2, fd, tick });
  };
  api.init = function (m) { const o = _initT(m); o.tick = 0; o.fr = null; o.fin = 0; o.fd = false; return o; };
}
// 吹万 第 18 天 17:05 页184朽木：梓韬第 14 天说食物也可以扩；朽木玩具（~/碰/朽木/）四个生人都在"剩一只就不生"那下停住。
// 地上一截朽木（m.logAt）：里头的虫不跑；两只以上，每 LOGBREED 步爬出一只（最多 LOGCAP）；剩一只不生；空了就空了。
// 你走上去只叼一只（原来一格上的虫一步全吃掉）。红饿了照旧找最近的虫，朽木多半最近。外面包一层，原来的 step 一个字没动。
{
  const LOGBREED = 8, LOGCAP = 4;   // 页187：5 改 8，比红饿一回（约 6 步）慢，醒过来的朽木会被红慢慢吃回一只，不是一只吃不完的碗
  const _stepW = api.step, _initW = api.init;
  api.step = function (m, st, k) {
    api.logBorn = false; api.logOn = false; api.logStop = false; api.logEmpty = false; api.logTook = false; api.logWake = false; api.logReach = false; api.logLz = '';
    if (!m.logAt) return k === 'F' ? 'bad' : _stepW(m, st, k);
    const dig = k === 'F';   // 吹万 第 19 天 00:16 页200掏：'掏'是单独一下（F 键 / 掏 按钮），站在朽木上才掏得出；站在上面按等就只是等（页196/199 三回'想守着、按等就扒了'）
    const near = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) <= 1;   // 页200 量完补：掏1 掏2 第 3 天头一下都是站在旁边按掏（'以为能伸手过去'），旁边也掏得着；有蜥蜴趴在上面就不行
    if (dig) { const L0 = m.logAt; if (!near(st.pl, L0) || !st.bugs.some(b => !!b && eq(b, L0)) || (!eq(st.pl, L0) && (eq(st.lz.pos, L0) || (st.lzB && eq(st.lzB.pos, L0))))) return 'bad'; k = '.'; }
    const r = _stepW(m, st, k);
    if (r === null || r === 'bad') return r;
    r.dust = st.dust || 0;
    const L = m.logAt, at = b => !!b && eq(b, L);
    st.bugs.forEach((b, i) => { if (at(b) && r.bugs[i] && !at(r.bugs[i])) r.bugs[i] = L.slice(); });   // 朽木里的不跑
    {   // 吹万 第 18 天 20:45 页196等才叼：走上朽木不叼（门1 '走过朽木时直接叼到了一只，没想到'，木头多半是回家路过踩死的）；站在上面'等'一步，才扒出一只（门1 第 4 天'原地等不会拿虫'，他本来以为会）。
      api.logOn = false;
      if (eq(r.pl, L) && !dig && r.ate > st.ate) {   // 页200：等也不叼   // 踩上去（或在上面撞墙）：吃掉的都放回去
        let back = r.ate - st.ate;
        st.bugs.forEach((b, i) => { if (back > 0 && at(b) && r.bugs[i] === null) { r.bugs[i] = L.slice(); back -= 1; r.ate -= 1; } });
      }
      if (eq(r.pl, L) && !eq(st.pl, L) && r.bugs.some(at)) api.logOn = true;
      if (dig) {   // 页200：按掏（站在上面或旁边）掏出一只
        const i = r.bugs.findIndex(at); if (i >= 0) { r.bugs[i] = null; r.ate += 1; r.dust = (st.dust || 0) + 1; }   // 吹万 第 18 天 21:4x 页197木屑：你每扒一下，朽木边上落一撮木屑，留到第二天（画.js 画，不写字）
      }
    }
    if (eq(r.pl, L) && r.ate - st.ate > 1) {   // 一步只叼一只
      let extra = r.ate - st.ate - 1;
      st.bugs.forEach((b, i) => { if (extra > 0 && at(b) && r.bugs[i] === null) { r.bugs[i] = L.slice(); extra -= 1; r.ate -= 1; } });
    }
    if ((eq(r.pl, L) || dig) && r.ate > st.ate) api.logTook = true;
    {   // 页187：朽木里的一步只被叼走一只——谁站在上面谁叼一只（红也一样，原来红一口吃光一格）
      const eaters = (eq(r.pl, L) || dig ? 1 : 0) + (eq(r.lz.pos, L) ? 1 : 0) + (r.lzB && eq(r.lzB.pos, L) ? 1 : 0);
      let lost = st.bugs.filter(at).length - r.bugs.filter(at).length - Math.max(eaters, 0);
      st.bugs.forEach((b, i) => { if (lost > 0 && at(b) && r.bugs[i] === null) { r.bugs[i] = L.slice(); lost -= 1; } });
    }
    {
      const lzOn = eq(r.lz.pos, L) || (r.lzB && eq(r.lzB.pos, L));
      if (lzOn && st.bugs.filter(at).length > r.bugs.filter(at).length + (eq(r.pl, L) && r.ate > st.ate ? 1 : 0)) api.logLz = (r.lzB && eq(r.lzB.pos, L) && !eq(r.lz.pos, L)) ? '青' : '红';
    }
    const n0 = st.bugs.filter(at).length + (st.deep || 0);
    let deep = st.deep || 0;
    if (deep && r.bugs.some(at)) {   // 页186：吐进去一只，深处那只醒了
      r.bugs = r.bugs.concat([L.slice(), L.slice()]); if (r.mine) r.mine = r.mine.concat([false, false]); deep = 0; api.logWake = true;   // 醒过来那一下就爬出一只：吐进去的、深处的、新爬的，三只
    }
    if (!deep && r.bugs.filter(at).length === 1) {   // 掉到一只：缩进深处，谁也够不着
      const k = r.bugs.findIndex(at); r.bugs[k] = null; deep = 1; if (n0 >= 2) api.logStop = true;
    }
    if (deep && eq(r.pl, L) && !eq(st.pl, L)) api.logReach = true;
    const n1 = r.bugs.filter(at).length;
    let lb = st.lb || 0;
    if (n1 >= 2 && n1 < LOGCAP) {
      lb += 1;
      if (lb >= LOGBREED) { r.bugs = r.bugs.concat([L.slice()]); if (r.mine) r.mine = r.mine.concat([false]); lb = 0; api.logBorn = true; }
    } else lb = 0;
    r.deep = deep;
    r.lb = lb;
    return r;
  };
  api.init = function (m) { const o = _initW(m); o.lb = 0; o.deep = m.logDeep0 ? 1 : 0; o.dust = 0; return o; };
  api.logLeft = function (m, st) { return m.logAt ? (LOGBREED - (st.lb || 0)) : 0; };
}
if (typeof module !== 'undefined') module.exports = api; else root.WeiSim = api;
})(this);
