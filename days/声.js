// 声.js —— 喂它一口（连着七天）的耳朵。第 19 天 16:56 吹万（七天的耳朵）第二版（亲耳听过改掉裸锯齿波蜂鸣、等距敲铁皮和固定步距撞车）。
// 纯 WebAudio 合成：既在浏览器 AudioContext 实时发声，又能用同一个节点图在 OfflineAudioContext 里渲染出每一步的 WAV（供 Playwright 按键手直接拿回声音）。
// 铁律：平时安静（空地脚步极轻，晒太阳不吵），有事才响；我的动静在 t0，蜥蜴的动静错开 70ms，多步连按时等前一步落音再起下一步。
(function (root) {
  const SR = 24000;
  let liveCtx = null;
  let stepQueue = [];

  function ensureLive() {
    if (!liveCtx && (root.AudioContext || root.webkitAudioContext)) {
      liveCtx = new (root.AudioContext || root.webkitAudioContext)({ sampleRate: SR });
    }
    if (liveCtx && liveCtx.state === 'suspended') {
      liveCtx.resume().catch(() => {});
    }
    return liveCtx;
  }

  function makeNoise(ctx, dur) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + w * 0.029;
      b1 = 0.985 * b1 + w * 0.032;
      b2 = 0.950 * b2 + w * 0.048;
      d[i] = (b0 + b1 + b2 + w * 0.18) * 0.7;
    }
    return buf;
  }

  function tone(ctx, dest, type, f0, f1, t0, dur, gainPeak, attack, lpFreq, lpQ) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(Math.max(20, f0), t0);
    if (f1 && f1 !== f0) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    }
    const att = Math.min(dur * 0.3, attack || 0.008);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gainPeak, t0 + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    if (lpFreq) {
      const flt = ctx.createBiquadFilter();
      flt.type = 'lowpass';
      flt.frequency.setValueAtTime(lpFreq, t0);
      flt.frequency.exponentialRampToValueAtTime(Math.max(80, lpFreq * 0.45), t0 + dur);
      flt.Q.setValueAtTime(lpQ || 3.0, t0);
      osc.connect(flt);
      flt.connect(g);
    } else {
      osc.connect(g);
    }
    g.connect(dest);
    osc.start(t0);
    osc.stop(t0 + dur + 0.005);
  }

  function noiseBurst(ctx, dest, f0, f1, Q, t0, dur, gainPeak, filterType) {
    const src = ctx.createBufferSource();
    src.buffer = makeNoise(ctx, dur + 0.02);
    const flt = ctx.createBiquadFilter();
    flt.type = filterType || 'bandpass';
    flt.frequency.setValueAtTime(Math.max(40, f0), t0);
    if (f1 && f1 !== f0) {
      flt.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t0 + dur);
    }
    flt.Q.setValueAtTime(Q || 2.0, t0);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gainPeak, t0 + Math.min(0.015, dur * 0.25));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(dest);
    src.connect(flt);
    src.start(t0);
    src.stop(t0 + dur + 0.01);
  }

  // 在 ctx 上从 t0 开始排好一步的所有声音，返回这一步声音持续的秒数
  function scheduleStep(ctx, dest, t0, ev) {
    if (!ev) return 0.18;
    let maxEnd = t0 + 0.18;
    const mark = (t) => { if (t > maxEnd) maxEnd = t; };

    // 1. 走不动 / 吐不出 / 掏不出
    if (ev.bad) {
      if (ev.bad === '墙' || ev.bad === '蜥蜴') {
        tone(ctx, dest, 'triangle', 115, 42, t0, 0.11, 0.30, 0.005);
        noiseBurst(ctx, dest, 300, 120, 1.5, t0, 0.06, 0.15, 'lowpass');
        mark(t0 + 0.18);
      } else if (ev.bad === '空吐') {
        noiseBurst(ctx, dest, 700, 350, 3.0, t0, 0.08, 0.18, 'bandpass');
        tone(ctx, dest, 'sine', 210, 130, t0, 0.09, 0.14, 0.01);
        mark(t0 + 0.18);
      } else if (ev.bad === '空掏' || ev.bad === '深处') {
        /* 页225 吹万 18:25：原来这两下刨木头的 RMS 只有撞墙的 1/12，听1 听2 都说'跟撞墙一样的咚'——刨声没听见，听见的是别的。放大、拉长成指甲刮空木头，再敲一下空心的'笃'（比撞墙高八度、短） */
        noiseBurst(ctx, dest, 1400, 700, 3.0, t0, 0.12, 0.85, 'bandpass');
        noiseBurst(ctx, dest, 1200, 600, 3.0, t0 + 0.13, 0.12, 0.70, 'bandpass');
        tone(ctx, dest, 'triangle', 420, 330, t0 + 0.27, 0.07, 0.35, 0.003);
        if (ev.bad === '深处') {
          tone(ctx, dest, 'triangle', 260, 135, t0 + 0.36, 0.16, 0.30, 0.01);
          mark(t0 + 0.56);
        } else {
          mark(t0 + 0.38);
        }
      }
      return maxEnd - t0;
    }

    // 2. 我自己的动作（t0 起）
    if (ev.step && !ev.lzSwap) {
      const ate = ev.ate || 0;
      const fNoise = Math.max(600, 1150 - ate * 140);
      noiseBurst(ctx, dest, fNoise, fNoise * 0.75, 2.2, t0, 0.038, 0.065, 'bandpass');
      tone(ctx, dest, 'sine', Math.max(95, 155 - ate * 15), 65, t0, 0.035, 0.05, 0.004);
      mark(t0 + 0.12);
    }

    if (ev.eatBug) {
      noiseBurst(ctx, dest, 1800, 900, 3.0, t0 + 0.01, 0.035, 0.22, 'bandpass');
      tone(ctx, dest, 'triangle', 540, 280, t0 + 0.01, 0.04, 0.20, 0.004);
      const enough = ev.eatBug.ate >= ev.eatBug.need;
      const fUp = enough ? 495 : 415;
      tone(ctx, dest, 'sine', 310, fUp, t0 + 0.055, 0.11, 0.24, 0.01);
      if (enough) {
        tone(ctx, dest, 'sine', 660, 660, t0 + 0.14, 0.24, 0.20, 0.015);
        tone(ctx, dest, 'triangle', 330, 330, t0 + 0.14, 0.22, 0.10, 0.015);
        mark(t0 + 0.42);
      } else {
        mark(t0 + 0.22);
      }
      if (ev.eatBug.wantedByLz) {
        // 这只正是蜥蜴想去吃的！在你咽下后，它那边传来一声落空/委屈下坠的低鸣“呜…↘”
        const tw = t0 + (enough ? 0.34 : 0.19);
        tone(ctx, dest, 'sawtooth', 215, 112, tw, 0.26, 0.24, 0.02, 380, 4.0);
        tone(ctx, dest, 'triangle', 155, 82, tw + 0.02, 0.26, 0.20, 0.02);
        mark(tw + 0.30);
      }
    }

    if (ev.spit) {
      tone(ctx, dest, 'sine', 185, 340, t0, 0.075, 0.22, 0.01);
      noiseBurst(ctx, dest, 950, 1400, 2.5, t0 + 0.01, 0.07, 0.16, 'bandpass');
      tone(ctx, dest, 'triangle', 410, 250, t0 + 0.11, 0.06, 0.18, 0.005);
      mark(t0 + 0.20);
      if (ev.spit.toLogWake) {
        const notes = [290, 370, 460, 550];
        notes.forEach((fn, idx) => {
          const ts = t0 + 0.19 + idx * 0.075;
          tone(ctx, dest, 'triangle', fn, fn * 1.12, ts, 0.065, 0.18, 0.006);
          noiseBurst(ctx, dest, 1200 + idx * 200, 900, 3.5, ts, 0.055, 0.14, 'bandpass');
        });
        mark(t0 + 0.56);
      }
    }

    if (ev.digOk) {
      noiseBurst(ctx, dest, 520, 960, 3.2, t0, 0.09, 0.22, 'bandpass');
      tone(ctx, dest, 'triangle', 520, 290, t0 + 0.09, 0.04, 0.22, 0.004);
      const enough = ev.digOk.ate >= ev.digOk.need;
      tone(ctx, dest, 'sine', 320, enough ? 495 : 420, t0 + 0.13, 0.11, 0.24, 0.01);
      if (enough) {
        tone(ctx, dest, 'sine', 660, 660, t0 + 0.22, 0.22, 0.18, 0.015);
      }
      mark(t0 + 0.35);
      if (ev.digOk.stop) {
        tone(ctx, dest, 'triangle', 330, 130, t0 + 0.28, 0.24, 0.24, 0.01);
        noiseBurst(ctx, dest, 480, 200, 3.0, t0 + 0.28, 0.18, 0.14, 'lowpass');
        mark(t0 + 0.55);
      }
    } else if (ev.logBorn) {
      noiseBurst(ctx, dest, 1100, 1500, 3.5, t0 + 0.04, 0.05, 0.12, 'bandpass');
      tone(ctx, dest, 'triangle', 380, 440, t0 + 0.09, 0.06, 0.10, 0.008);
      mark(t0 + 0.20);
    }

    // 3. 蜥蜴的动静（如果我有吐虫或掏虫，错开稍多一点让两件事听得清）
    const tl = (ev.spit || ev.digOk || ev.eatBug || ev.logBorn) ? Math.max(t0 + 0.16, maxEnd - 0.02) : (t0 + 0.07);

    if (ev.killed) {
      // 扑到你身上！先是沉重猛扑破空，再是一记闷重咬合
      noiseBurst(ctx, dest, 600, 180, 1.2, t0 + 0.02, 0.12, 0.38, 'lowpass');
      tone(ctx, dest, 'sawtooth', 165, 38, t0 + 0.03, 0.34, 0.42, 0.006, 520, 3.5);
      tone(ctx, dest, 'triangle', 120, 32, t0 + 0.03, 0.38, 0.45, 0.005);
      // 利齿咬合声
      noiseBurst(ctx, dest, 1800, 420, 2.5, t0 + 0.11, 0.14, 0.36, 'bandpass');
      tone(ctx, dest, 'sawtooth', 220, 48, t0 + 0.11, 0.22, 0.32, 0.004, 680, 3.0);
      mark(t0 + 0.48);
      return maxEnd - t0;
    }

    if (ev.lzSwap) {
      // 侧身让路！温顺柔和的鳞片擦石壁沙沙声 + 低柔温顺的双音鼻息（像熟识的大兽贴墙收脚让你先过）
      noiseBurst(ctx, dest, 480, 300, 1.5, t0 + 0.02, 0.32, 0.15, 'lowpass');
      tone(ctx, dest, 'sine', 175, 220, t0 + 0.04, 0.32, 0.22, 0.04);
      tone(ctx, dest, 'triangle', 262, 330, t0 + 0.10, 0.30, 0.16, 0.05, 600, 1.5);
      mark(t0 + 0.46);
    }

    if (ev.lzHiss) {
      noiseBurst(ctx, dest, 3200, 1900, 4.5, tl, 0.30, 0.35, 'bandpass');
      tone(ctx, dest, 'sawtooth', 380, 220, tl + 0.02, 0.24, 0.16, 0.01, 900, 4.0);
      mark(tl + 0.36);
    }

    if (ev.lzChew) {
      if (ev.lzChew.start) {
        // 真实咀嚼感：第一口脆咬破壳（咔嚓），第二口软嚼（吧唧），第三下喉咙吞咽（咕噜↗↘）
        // 第1口：脆壳裂开
        noiseBurst(ctx, dest, 1900, 850, 3.2, tl, 0.045, 0.30, 'bandpass');
        tone(ctx, dest, 'triangle', 320, 135, tl, 0.055, 0.24, 0.004);
        // 第2口（错开 0.15s）：软肉咀嚼
        noiseBurst(ctx, dest, 1100, 550, 2.5, tl + 0.15, 0.05, 0.20, 'bandpass');
        tone(ctx, dest, 'sine', 240, 125, tl + 0.15, 0.06, 0.20, 0.006);
        // 第3下（0.27s）：喉咙吞咽咕噜
        tone(ctx, dest, 'sine', 145, 235, tl + 0.27, 0.08, 0.22, 0.015);
        tone(ctx, dest, 'sine', 235, 130, tl + 0.34, 0.09, 0.18, 0.01);
        if (ev.lzChew.fedNow) {
          // 吃的是你吐的虫！吞下后多一声柔和低沉的满足鼻息（“嗯~”）
          tone(ctx, dest, 'sine', 165, 196, tl + 0.45, 0.30, 0.24, 0.04);
          tone(ctx, dest, 'triangle', 247, 294, tl + 0.47, 0.28, 0.14, 0.04, 550, 1.5);
          mark(tl + 0.80);
        } else {
          mark(tl + 0.46);
        }
      } else {
        // 第二步还在嚼：轻轻一下软嚼 + 咽下
        noiseBurst(ctx, dest, 1050, 520, 2.5, tl, 0.045, 0.14, 'bandpass');
        tone(ctx, dest, 'sine', 175, 115, tl + 0.06, 0.08, 0.14, 0.01);
        mark(tl + 0.18);
      }
    }

    if (ev.lzStare) {
      // 停住盯上你：过共振低通滤波的低沉喉咙压迫声 + 细微吸气嘶声（像猛兽扑食前压低身子喉间低吼）
      const isMe = ev.lzStare === '你';
      const fBase = isMe ? 110 : 155;
      tone(ctx, dest, 'sawtooth', fBase, fBase * 0.78, tl + 0.02, isMe ? 0.32 : 0.18, isMe ? 0.30 : 0.16, 0.02, isMe ? 420 : 520, 4.5);
      if (isMe) {
        tone(ctx, dest, 'sawtooth', fBase * 1.04, fBase * 0.80, tl + 0.02, 0.32, 0.24, 0.02, 380, 4.5);
        noiseBurst(ctx, dest, 2400, 1500, 5.0, tl + 0.02, 0.20, 0.12, 'bandpass');
        mark(tl + 0.38);
      } else {
        mark(tl + 0.22);
      }
    } else if (ev.lzHeard) {
      // 听见动静猛一转头：短促机警的“唰-咯”
      noiseBurst(ctx, dest, 750, 1650, 3.0, tl, 0.07, 0.20, 'bandpass');
      tone(ctx, dest, 'triangle', 175, 285, tl + 0.01, 0.075, 0.18, 0.006);
      mark(tl + 0.14);
    }

    if (ev.lzStep >= 2) {
      [0, 0.11].forEach((dt) => {
        const ts = tl + dt;
        tone(ctx, dest, 'triangle', 135, 46, ts, 0.09, 0.32, 0.004);
        noiseBurst(ctx, dest, 550, 180, 1.5, ts, 0.065, 0.22, 'lowpass');
      });
      mark(tl + 0.26);
    } else if (ev.lzBack) {
      noiseBurst(ctx, dest, 620, 360, 2.5, tl, 0.10, 0.14, 'bandpass');
      tone(ctx, dest, 'sine', 110, 82, tl, 0.09, 0.10, 0.01);
      mark(tl + 0.15);
    } else if (ev.lzStep === 1 && !ev.lzSwap && !ev.lzChew) {
      tone(ctx, dest, 'triangle', 98, 52, tl, 0.065, 0.14, 0.005);
      noiseBurst(ctx, dest, 450, 220, 1.8, tl, 0.05, 0.10, 'lowpass');
      mark(tl + 0.14);
    }

    if (ev.lzWakeHungry) {
      // 彻底饿了（hun 1->0）：低沉的空腹肠鸣“咕——呜↗”
      tone(ctx, dest, 'sawtooth', 125, 88, tl + 0.04, 0.15, 0.22, 0.02, 360, 4.0);
      tone(ctx, dest, 'sawtooth', 92, 155, tl + 0.17, 0.18, 0.24, 0.02, 420, 4.0);
      mark(tl + 0.40);
    } else if (ev.lzEyesOpen) {
      // 饱劲过了、睁圆眼睛（hun 5->4）：短促机警的抬头睁眼音
      tone(ctx, dest, 'triangle', 195, 290, tl + 0.04, 0.11, 0.18, 0.01);
      noiseBurst(ctx, dest, 900, 1500, 3.0, tl + 0.04, 0.07, 0.12, 'bandpass');
      mark(tl + 0.20);
    } else if (ev.lzFullTail) {
      [0.06, 0.19].forEach((dt) => {
        noiseBurst(ctx, dest, 380, 180, 1.6, tl + dt, 0.055, 0.16, 'lowpass');
        tone(ctx, dest, 'sine', 120, 65, tl + dt, 0.055, 0.15, 0.005);
      });
      mark(tl + 0.30);
    } else if (ev.lzFriend && !ev.lzSwap) {
      tone(ctx, dest, 'sine', 210, 188, tl + 0.04, 0.18, 0.15, 0.02);
      mark(tl + 0.25);
    }

    if (ev.logStop && !(ev.digOk && ev.digOk.stop)) {
      // 蜥蜴把朽木吃得只剩一只、缩进深处没动静了：在它嚼完之后补一声空心木头下坠的闷响
      const tStop = Math.max(tl + 0.36, maxEnd - 0.01);
      tone(ctx, dest, 'triangle', 330, 125, tStop, 0.25, 0.25, 0.01);
      noiseBurst(ctx, dest, 480, 200, 3.0, tStop, 0.19, 0.15, 'lowpass');
      mark(tStop + 0.28);
    }

    // 4. 窝的结果
    if (ev.nestLack) {
      const tN = t0 + 0.10;
      tone(ctx, dest, 'triangle', 240, 155, tN, 0.11, 0.28, 0.006);
      tone(ctx, dest, 'triangle', 175, 98, tN + 0.13, 0.20, 0.32, 0.006);
      noiseBurst(ctx, dest, 320, 160, 4.0, tN + 0.13, 0.15, 0.18, 'bandpass');
      mark(tN + 0.38);
    } else if (ev.dusk) {
      /* 页225 吹万 18:10：天黑原来没声（WeiFX.dusk 被我静音了），听2 第 2 张天黑那一下正好撞上红饿醒的咕噜，读成了'结束音'。一声长的往下沉 + 一口气 */
      const tD = t0 + 0.12;
      tone(ctx, dest, 'sine', 330, 196, tD, 0.9, 0.22, 0.04);
      tone(ctx, dest, 'sine', 247, 147, tD + 0.25, 0.9, 0.16, 0.04);
      noiseBurst(ctx, dest, 900, 300, 1.5, tD, 0.9, 0.06, 'lowpass');
      mark(tD + 1.2);
    } else if (ev.win) {
      const tW = t0 + 0.08;
      [261.6, 329.6, 392.0, 523.2].forEach((fn, idx) => {
        tone(ctx, dest, idx === 3 ? 'sine' : 'triangle', fn, fn, tW + idx * 0.065, 0.38, 0.20, 0.015);
      });
      mark(tW + 0.65);
    }

    return maxEnd - t0;
  }

  function playStep(ev) {
    stepQueue.push(ev);
    const ctx = ensureLive();
    if (ctx) {
      try {
        scheduleStep(ctx, ctx.destination, ctx.currentTime + 0.01, ev);
      } catch (e) {}
    }
  }

  function encodeWAV(samples, sampleRate) {
    const numSamples = samples.length;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);
    const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, numSamples * 2, true);
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  async function flushWav() {
    const q = stepQueue.splice(0, stepQueue.length);
    if (!q.length) return null;
    const OfflineCtx = root.OfflineAudioContext || root.webkitOfflineAudioContext;
    if (!OfflineCtx) return null;
    // 先在假 ctx 或直接算每一步时长，留够呼吸间隙，绝不让前后两步撞车
    const maxTotal = q.length * 1.1 + 0.5;
    const len = Math.ceil(maxTotal * SR);
    const octx = new OfflineCtx(1, len, SR);
    let curT = 0.02;
    q.forEach((ev) => {
      const dur = scheduleStep(octx, octx.destination, curT, ev);
      curT += Math.max(0.32, dur + 0.10);
    });
    const rendered = await octx.startRendering();
    const pcm = rendered.getChannelData(0);
    const cutLen = Math.min(pcm.length, Math.ceil((curT + 0.05) * SR));
    return encodeWAV(pcm.subarray(0, cutLen), SR);
  }

  root.WeiSound = root.WEITA_SOUND = { playStep, flushWav, scheduleStep };
  if (typeof root.itAct === 'function' && !root.itAct._earPatched) {
    const origItAct = root.itAct;
    root.itAct = function(k) {
      const n0 = typeof n !== 'undefined' ? n : 0;
      const st0 = typeof st !== 'undefined' ? st : null;
      const g0 = (typeof IT !== 'undefined' && IT && !IT.ghostGone) ? (IT.K[IT.t] || '.') : '.';
      origItAct(k);
      if (typeof n !== 'undefined' && n > n0 && st0 && typeof st !== 'undefined' && typeof IT !== 'undefined' && IT) {
        const me = IT.who === 'B' ? st.lzB : st.lz;
        const me0 = IT.who === 'B' ? st0.lzB : st0.lz;
        const startMe = (me.mode === '吃' && me0.mode !== '吃');
        const chewMe = (me.mode === '吃');
        const postPos = IT.who === 'B' ? m.postB : m.post;
        playStep({
          bumpWall: !!(typeof S !== 'undefined' && S.itBlocked),
          plStep: (!IT.ghostGone && !S.eq(st0.pl, st.pl)),
          spit: (g0[0] === 'X' && typeof lastDrop !== 'undefined' && lastDrop) ? { intoLog: !!(m.logAt && S.eq(lastDrop, m.logAt)), woke: !!S.logWake } : null,
          digOk: (S.logTook || S.dugOut) ? { ate: 1, need: 1, stop: !!S.logStop } : null,
          logStop: !!S.logStop,
          lzKilledLog: !!(S.logStop && !(S.logTook || S.dugOut)),
          logBorn: !!(S.logBorn && !S.logWake),
          killed: !!(IT.ghostGone && !startMe && st0.pl && !S.eq(st0.pl, st.pl)),
          lzChew: chewMe ? { start: startMe, fedNow: !!(IT.who === 'B' ? (S.B && S.B.fedNow) : S.fedNow) } : null,
          lzStep: !S.eq(me0.pos, me.pos) ? 1 : 0,
          lzWakeHungry: !!(me0.hun > 0 && !(me.hun > 0)),
          lzEyesOpen: !!((me0.hun || 0) >= 5 && (me.hun || 0) < 5 && me.mode !== '吃'),
          lzFullTail: !!((me.hun || 0) >= 5 && ((me0.mode === '吃' && me.mode !== '吃') || (!S.eq(me0.pos, postPos) && S.eq(me.pos, postPos))))
        });
      }
    };
    root.itAct._earPatched = true;
  }

})(window);
