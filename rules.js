'use strict';
/* 生成ルール。draw(d, id) は 200×200 の中に SVG を描く。d は 12 個の数字、id は一意な接頭辞 */
(function () {
  const { TAU, f, pol, P, deg, sector, arc, pairRGB, rgbStr, hueOf, RULES } = MN;
  const K = '#111';
  const C = 100;
  const circle = (x, y, r, fill, extra) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" ${extra || ''}/>`;
  const line = (x1, y1, x2, y2, w, col, extra) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${col || K}" stroke-width="${w}" stroke-linecap="round" ${extra || ''}/>`;
  // ロゴの部分に「どの桁が決めたか」の印を付ける
  const T = (ds, inner) => `<g data-d="${[].concat(ds).join(' ')}">${inner}</g>`;
  const hint = (ds, x, y, r) => `<circle class="hint" data-d="${[].concat(ds).join(' ')}" cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="none" stroke="#111" stroke-width="1.4" stroke-dasharray="4 3"/>`;
  const swatch = col => `<rect x="2" y="2" width="26" height="26" rx="3" fill="${col}"/>`;

  /* 1 頂点むすび ─────────────────────────── */
  RULES.push({
    id: 'vertex', name: '頂点むすび', cat: 'むき・きょり',
    sum: '十二角形の頂点を、数字のぶんだけ時計回りに進んだ頂点と結ぶ。',
    steps: [
      '正十二角形の頂点に、真上から時計回りに12桁を1つずつ割り当てる。',
      '各頂点から、その数字のぶんだけ時計回りに進んだ頂点へ線を引く。0 は進まないので点を打つ。',
      '同じ2頂点を結ぶ線が重なったら、重なった本数ぶん太くする。',
      '1〜6桁目の行き先の頂点を順に結んだ面をA、7〜12桁目の行き先を結んだ面をBとする。',
      '面Aは1〜6桁目、面Bは7〜12桁目を2桁ずつ R・G・B に変換した色(40＋2.1×値)で塗り、乗算で重ねる。',
    ],
    legend: [{
      t: '数字 = 時計回りに進む頂点の数', cell: k => {
        const V = i => pol(15, 15, 12, i / 12 * TAU - TAU / 4);
        let o = '';
        for (let i = 0; i < 12; i++) o += circle(...V(i), .9, '#aaa');
        return o + (k ? line(...V(0), ...V(k), 1.6) : circle(...V(0), 2.2, K));
      },
    }],
    draw(d) {
      const V = i => pol(C, C, 90, i / 12 * TAU - TAU / 4);
      const t = d.map((x, i) => (i + x) % 12);
      let o = T(R(1, 6), `<polygon points="${P(t.slice(0, 6).map(V))}" fill="${rgbStr(d.slice(0, 6))}" opacity=".8"/>`);
      o += T(R(7, 12), `<polygon points="${P(t.slice(6).map(V))}" fill="${rgbStr(d.slice(6))}" opacity=".8" style="mix-blend-mode:multiply"/>`);
      const seg = {};
      d.forEach((x, i) => { if (x) { const k = Math.min(i, t[i]) + '-' + Math.max(i, t[i]); (seg[k] = seg[k] || []).push(i + 1); } });
      for (const k in seg) { const [a, b] = k.split('-').map(Number); o += T(seg[k], line(...V(a), ...V(b), 1.8 * seg[k].length)); }
      d.forEach((x, i) => { if (!x) o += T(i + 1, circle(...V(i), 3.4, K)); });
      return o;
    },
  });

  /* 2 環紋 ─────────────────────────────── */
  const RED = '#E0202B';
  function ring(cx, cy, r, t) {
    const L = TAU * r; let o = '';
    const rep = (n, fn) => { n = Math.max(3, Math.round(n)); for (let k = 0; k < n; k++) o += fn(k / n * TAU - TAU / 4, k, n); };
    const dot = (rr, a, s, c) => circle(...pol(cx, cy, rr, a), s, c);
    const tick = (a, r1, r2, w, c, a2) => line(...pol(cx, cy, r1, a), ...pol(cx, cy, r2, a2 === undefined ? a : a2), w, c);
    const full = w => `<circle cx="${cx}" cy="${cy}" r="${f(r)}" fill="none" stroke="${K}" stroke-width="${w}"/>`;
    switch (t) {
      case 0: { const n = Math.max(3, Math.round(L / 14)), u = L / n; o += `<circle cx="${cx}" cy="${cy}" r="${f(r)}" fill="none" stroke="${K}" stroke-width="1.6" stroke-dasharray="${f(u * .62)} ${f(u * .38)}"/>`; break; }
      case 1: rep(L / 4.6, (a, k) => k % 2 ? dot(r, a, .9, RED) : tick(a, r - 2.2, r + 2.2, 1.1, K)); break;
      case 2: rep(L / 4.2, a => dot(r - 1.5, a, 1.1, K) + dot(r + 1.5, a, 1.1, K)); break;
      case 3: rep(L / 5, a => tick(a, r - 2, r + 2, 1.1, K, a + 3.4 / r)); break;
      case 4: o += full(1.3); rep(L / 12, a => dot(r, a, 1.8, K)); break;
      case 5: rep(L / 13, (a, k, n) => dot(r, a, 2.3, K) + `<path d="${arc(cx, cy, r - 1.1, a + TAU / n * .3, a + TAU / n * .7)}" fill="none" stroke="${RED}" stroke-width="1"/><path d="${arc(cx, cy, r + 1.1, a + TAU / n * .3, a + TAU / n * .7)}" fill="none" stroke="${RED}" stroke-width="1"/>`); break;
      case 6: rep(L / 8, a => dot(r, a, 2.8, K)); break;
      case 7: rep(L / 4.6, (a, k) => k % 2 ? tick(a, r - 2.4, r + 2.4, 1, RED) : tick(a, r - 2.4, r + 1, 1, K) + dot(r + 2, a, 1, K)); break;
      case 8: o += full(1); rep(L / 16, a => dot(r, a, 1.6, RED)); break;
      default: rep(L / 9, a => dot(r, a, .8, K));
    }
    return o;
  }
  RULES.push({
    id: 'rings', name: '環紋', cat: '中心点',
    sum: '12桁を内側から外側へ、12本の同心円の模様に置き換える。',
    steps: [
      '中心から等間隔に12本の同心円を引く。内側から1桁目、外側が12桁目。',
      '各桁の数字に対応する模様を凡例から選び、その円周に沿って繰り返す。',
      '模様の繰り返し回数は円周の長さに比例させ、どの輪でも模様の大きさをそろえる。',
      '模様は真上から描き始め、時計回りに並べる。',
    ],
    legend: [{ t: '数字 = 輪の模様', cell: k => ring(15, 15, 11, k) }],
    draw(d) { return d.map((x, i) => T(i + 1, ring(C, C, 12 + i * 7, x))).join(''); },
  });

  /* 3 タイルの花 ─────────────────────────── */
  function tile(t, x, y, s) {
    const poly = pts => `<polygon points="${P(pts.map(([a, b]) => [x + a * s, y + b * s]))}" fill="${K}"/>`;
    let o = '';
    const u = s / 10;
    switch (t) {
      case 0: return poly([[0, 0], [1, 0], [1, 1], [0, 1]]);
      case 1: return poly([[0, 0], [0, 1], [1, 1]]);
      case 2: return poly([[0, 1], [1, 1], [1, 0]]);
      case 3: return poly([[0, .5], [1, .5], [1, 1], [0, 1]]);
      case 4: for (let k = 0; k < 5; k++) { const a = k * .2, b = a + .1; o += poly([[a, a], [1, a], [1, b], [b, b]]); } return o;
      case 5: return poly([[0, 0], [1, 0], [1, .5], [0, .5]]);
      case 6: return poly([[0, 0], [1, 0], [0, 1]]);
      case 7: return poly([[0, 0], [1, 0], [1, 1]]);
      case 8: for (let k = 0; k < 5; k++) o += `<rect x="${f(x)}" y="${f(y + k * 2 * u)}" width="${f(s)}" height="${f(u)}" fill="${K}"/>`; return o;
      default: for (let k = 0; k < 5; k++) { const a = k * .2, b = a + .1; o += poly([[0, a], [1 - a, a], [1 - b, b], [0, b]]); } return o;
    }
  }
  RULES.push({
    id: 'tiles', name: 'タイルの花', cat: '方眼紙',
    sum: '12桁を3×4マスのタイルに置き換え、できた形を花に見立てる。',
    steps: [
      '横4マス×縦3マスの方眼を用意する。',
      '左上から右へ、上段→中段→下段の順に12桁を1マスずつ割り当てる。',
      '各マスを、数字に対応するタイル(凡例)で塗る。',
      'マスの下の中央に、茎と2枚の葉を決まった形で付ける。',
    ],
    legend: [{ t: '数字 = タイルの形', cell: k => `<rect x="3" y="3" width="24" height="24" fill="none" stroke="#999" stroke-width=".8"/>` + tile(k, 3, 3, 24) }],
    draw(d) {
      let o = d.map((x, i) => T(i + 1, tile(x, 20 + (i % 4) * 40, 10 + Math.floor(i / 4) * 40, 40))).join('');
      o += `<path d="M103 136Q101 166 94 192" fill="none" stroke="${K}" stroke-width="5" stroke-linecap="round"/>`;
      o += `<path d="M94 172Q72 176 62 154Q84 150 94 172Z M100 168Q112 146 136 152Q126 174 100 168Z" fill="none" stroke="${K}" stroke-width="4.5" stroke-linejoin="round"/>`;
      return o;
    },
  });

  /* 4 青海波 ─────────────────────────────── */
  const SEA = '#1F4FA8', SKY = '#BFE3F7';
  function fan(v, cx, cy, R) {
    const a1 = deg(-150), a2 = deg(-30);
    let o = `<path d="${sector(cx, cy, R * .14, R, a1, a2)}" fill="${SKY}" stroke="#fff" stroke-width="${f(R * .04)}"/>`;
    [[4, .76, 1], [2, .48, .64], [1, .22, .36]].forEach(([bit, r1, r2]) => {
      if (v & bit) o += `<path d="${sector(cx, cy, R * r1, R * r2, a1, a2)}" fill="${SEA}"/>`;
      else o += `<path d="${arc(cx, cy, R * (r1 + r2) / 2, a1, a2)}" fill="none" stroke="${SEA}" stroke-width="${f(R * .045)}"/>`;
    });
    return o;
  }
  RULES.push({
    id: 'seigaiha', name: '青海波', cat: '方眼紙',
    sum: '12桁を8進数に直し、3本の帯の太い・細いで波を編む。',
    steps: [
      '12桁を1つの10進数とみなし、8進数に変換する。14桁に満たない場合は先頭を0で埋める。',
      '8進数の各桁(0〜7)を、外・中・内の3本の帯に分ける。4が含まれれば外、2なら中、1なら内の帯を太くする。',
      '扇形を上から4枚・3枚・4枚・3枚の順に、左から右へ並べる。3枚の段は半分ずらす。',
      '下の段を上の段に重ね、波の模様にする。',
    ],
    legend: [{ t: '8進数の1桁 = 帯の太さ(4＝外、2＝中、1＝内)', n: 8, cell: k => fan(k, 15, 26, 22) }],
    draw(d) {
      const oct = BigInt(d.join('')).toString(8).padStart(14, '0').split('').map(Number);
      const R = 27, W = 2 * R * Math.sin(deg(60)); // この関数内の R は扇形の半径
      let o = '', i = 0;
      [4, 3, 4, 3].forEach((n, row) => {
        for (let j = 0; j < n; j++) o += T(ALL, fan(oct[i++], C + (j - (n - 1) / 2) * W, 78 + row * 24, R));
      });
      return o;
    },
  });

  /* 5 メタボール ─────────────────────────── */
  RULES.push({
    id: 'metaball', name: 'メタボール', cat: 'たて・よこ',
    sum: '3つの球の位置と大きさを数字で決め、中央の球と溶け合わせる。',
    steps: [
      '10×10の方眼の中央に、決まった大きさの球を1つ置く。',
      '4〜9桁目を2桁ずつ(横・縦)の座標として、球A・B・Cの中心を方眼上に置く。',
      '10〜12桁目で球A・B・Cの大きさを決める(凡例)。',
      '中央の球と各球を一定の太さの帯でつなぎ、輪郭をなめらかに溶け合わせて1つの形にする。',
      '1・2桁目の色相(数字×36°)を両端とするグラデーションを、3桁目×36°の向きにかける。',
    ],
    legend: [
      { t: '10〜12桁目：球の大きさ', cell: k => circle(15, 15, (9 + k * 2.6) * .42, '#6FD08C') },
      { t: '1・2桁目：色相', cell: k => swatch(`hsl(${k * 36} 90% 58%)`) },
    ],
    draw(d, id) {
      const pos = v => 37 + v * 14;
      let b = circle(C, C, 20, '#fff'), h = '';
      for (let i = 0; i < 3; i++) {
        const x = pos(d[3 + i * 2]), y = pos(d[4 + i * 2]);
        b += line(C, C, x, y, 9, '#fff') + circle(x, y, 9 + d[9 + i] * 2.6, '#fff');
        h += hint([4 + i * 2, 5 + i * 2, 10 + i], x, y, 9 + d[9 + i] * 2.6);
      }
      return `<defs><filter id="${id}f" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 24 -10"/></filter>`
        + `<linearGradient id="${id}g" gradientTransform="rotate(${d[2] * 36} .5 .5)"><stop offset="0" stop-color="hsl(${d[0] * 36} 90% 58%)"/><stop offset="1" stop-color="hsl(${d[1] * 36} 90% 58%)"/></linearGradient>`
        + `<mask id="${id}m" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200"><g filter="url(#${id}f)">${b}</g></mask></defs>`
        + `<rect data-d="1 2 3" width="200" height="200" fill="url(#${id}g)" mask="url(#${id}m)"/>` + h;
    },
  });

  /* 6 滲み ─────────────────────────────── */
  RULES.push({
    id: 'nijimi', name: '滲み', cat: '中心点',
    sum: '3つの色を、向き・大きさ・うねりを変えながら滲ませて重ねる。',
    steps: [
      '12桁の前9桁を3桁ずつに分け、3つの色のかたまりに割り当てる。',
      '各かたまりの1桁目で色相(数字×36°)、2桁目で中心から見た向き(数字×36°)、3桁目で大きさを決める。',
      '10桁目で、3つのかたまりを中心からどれだけ離すかを決める。',
      '3つを乗算で重ね、全体をぼかす。',
      '11桁目でうねりの強さ、12桁目でうねりの細かさを決め、輪郭を揺らす。',
    ],
    legend: [
      { t: '1・4・7桁目：色相', cell: k => circle(15, 15, 11, `hsl(${k * 36} 80% 58%)`, 'opacity=".75"') },
      { t: '2・5・8桁目：向き', cell: k => circle(15, 15, 1.5, K) + line(15, 15, ...pol(15, 15, 11, deg(k * 36 - 90)), 1.4) },
      { t: '3・6・9桁目：大きさ', cell: k => circle(15, 15, (30 + k * 3.4) * .22, '#999', 'opacity=".7"') },
    ],
    draw(d, id) {
      let b = '';
      for (let i = 0; i < 3; i++) {
        const [x, y] = pol(C, C, 6 + d[9] * 4, deg(d[i * 3 + 1] * 36 - 90));
        b += circle(x, y, 30 + d[i * 3 + 2] * 3.4, `hsl(${d[i * 3] * 36} 80% 58%)`, `data-d="${i * 3 + 1} ${i * 3 + 2} ${i * 3 + 3} 10 11 12" opacity=".75" style="mix-blend-mode:multiply"`);
      }
      return `<defs><filter id="${id}f" x="-40%" y="-40%" width="180%" height="180%"><feTurbulence type="fractalNoise" baseFrequency="${f(.008 + d[11] * .004)}" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${d[10] * 5}" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation="7"/></filter></defs>`
        + `<g transform="translate(100 100) scale(.8) translate(-100 -100)"><g filter="url(#${id}f)">${b}</g></g>`;
    },
  });

  /* 7 図形と線 ─────────────────────────── */
  const NAVY = '#263C7E';
  function shape(t, cx, cy, s) {
    const h = s / 2, out = [6, 7, 8, 9, 0].includes(t), w = s * .17, q = out ? h - w / 2 : h;
    const st = out ? `fill="none" stroke="${NAVY}" stroke-width="${f(w)}"` : `fill="${NAVY}"`;
    const tri = pts => `<polygon points="${P(pts.map(([a, b]) => [cx + a * q, cy + b * q]))}" ${st}/>`;
    const kind = { 1: 'sq', 6: 'sq', 2: 'ci', 7: 'ci', 3: 'l', 9: 'l', 4: 'r', 8: 'r', 5: 'u', 0: 'u' }[t];
    const k = out ? .8 : 1;
    if (kind === 'sq') return `<rect x="${f(cx - q)}" y="${f(cy - q)}" width="${f(q * 2)}" height="${f(q * 2)}" ${st}/>`;
    if (kind === 'ci') return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(q)}" ${st}/>`;
    if (kind === 'l') return tri([[-k, 0], [k, -k], [k, k]]);
    if (kind === 'r') return tri([[k, 0], [-k, -k], [-k, k]]);
    return tri([[0, -k], [k, k], [-k, k]]);
  }
  function rule7line(t, x1, x2, y) {
    const n = t === 0 ? 1 : ((t - 1) % 3) + 1, style = t === 0 ? 0 : Math.floor((t - 1) / 3);
    let o = '';
    for (let i = 0; i < n; i++) {
      const yy = y + (i - (n - 1) / 2) * 3.4;
      const dash = style === 1 ? 'stroke-dasharray="5 4" stroke-linecap="butt"' : style === 2 ? 'stroke-dasharray="7 4 .1 4"' : '';
      o += `<line x1="${f(x1)}" y1="${f(yy)}" x2="${f(x2)}" y2="${f(yy)}" stroke="${NAVY}" stroke-width="${style === 2 ? 2 : 1.2}" stroke-linecap="round" ${dash}/>`;
    }
    if (t === 0) o += `<circle cx="${f((x1 + x2) / 2)}" cy="${f(y)}" r="3.4" fill="#fff" stroke="${NAVY}" stroke-width="1.2"/>`;
    return o;
  }
  RULES.push({
    id: 'shapeline', name: '図形と線', cat: 'よこ',
    sum: '12桁を図形と線に交互に置き換え、4段に並べる。',
    steps: [
      '12桁を3桁ずつ4段に分け、上から並べる。',
      '1桁目から順に、図形・線・図形・線…と交互に役割を割り当てる。',
      '図形の桁は図形の凡例、線の桁は線の凡例から、数字に対応するものを選ぶ。',
      '各段で3つを左から横一列に並べ、線は図形の中心の高さに通す。',
    ],
    legend: [
      { t: '図形の桁', cell: k => shape(k, 15, 15, 22) },
      { t: '線の桁', cell: k => rule7line(k, 3, 27, 15) },
    ],
    draw(d) {
      let o = '';
      for (let r = 0; r < 4; r++) {
        const y = 31 + r * 46, a = d[r * 3], b = d[r * 3 + 1], c = d[r * 3 + 2];
        const n = r * 3 + 1;
        if (r % 2 === 0) o += T(n + 1, rule7line(b, 70, 130, y)) + T(n, shape(a, 52, y, 40)) + T(n + 2, shape(c, 148, y, 40));
        else o += T(n, rule7line(a, 32, 82, y)) + T(n + 2, rule7line(c, 118, 168, y)) + T(n + 1, shape(b, 100, y, 40));
      }
      return o;
    },
  });

  /* 8 六角のしるし ─────────────────────────── */
  RULES.push({
    id: 'hex', name: '六角のしるし', cat: 'むき・きょり',
    sum: '前半6桁で六角形の形を、後半6桁で色と明るさを決める。',
    steps: [
      '中心から、真上を起点に60°ずつ6本の軸を時計回りに引く。',
      '1〜6桁目を順に各軸へ割り当て、数字が大きいほど中心から遠い位置に頂点を打つ(凡例)。',
      '中心と、隣り合う2つの頂点で三角形を6つ作る。',
      '7〜12桁目を2桁ずつ R・G・B に変換した色から色相を読み取り、全体の色の系統とする。',
      '7〜12桁目を1桁ずつ6つの三角形に割り当て、数字が大きいほど明るく塗る。',
      '中心から各頂点へ白い線を重ねる。',
    ],
    legend: [
      { t: '1〜6桁目：頂点の距離', cell: k => line(15, 27, 15, 3, .6, '#aaa') + circle(15, 27, 1.2, '#aaa') + circle(15, 27 - 24 * (k + 3) / 12, 2.2, K) },
      { t: '7〜12桁目：明るさ', cell: k => swatch(`hsl(230 55% ${14 + k * 7.5}%)`) },
    ],
    draw(d) {
      const V = i => pol(C, C, 90 * (d[i % 6] + 3) / 12, i / 6 * TAU - TAU / 4);
      const hue = hueOf(pairRGB(d.slice(6)));
      let o = '';
      for (let i = 0; i < 6; i++) o += T([i + 1, (i + 1) % 6 + 1, 7 + i], `<polygon points="${P([[C, C], V(i), V(i + 1)])}" fill="hsl(${hue} 55% ${f(14 + d[6 + i] * 7.5)}%)"/>`);
      for (let i = 0; i < 6; i++) o += T(i + 1, line(C, C, ...V(i), 2.2, '#fff'));
      return o;
    },
  });

  /* 9 福笑い ─────────────────────────────── */
  const ST = `fill="none" stroke="${K}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"`;
  const path = (dd, extra) => `<path d="${dd}" ${extra || ST}/>`;
  const BG = ['#E05A5A', '#C961A8', '#8E63B0', '#4F5BB0', '#5AA7DC', '#74C8CC', '#74BB8C', '#93C95C', '#E3DB5E', '#E38A5A'];
  const CHEEK = ['#F7B267', '#F4845F', '#F25C54', '#F0567A', '#E85D9E', '#C96BC0', '#9A79C9', '#6C74C4', '#6FC7E3', '#8BD17C'];
  const FACE = [[62, 72, 2], [58, 74, 8], [72, 62, 2], [66, 66, 2.6], [54, 78, 2], [70, 70, 4], [60, 70, 1.4], [74, 58, 3], [56, 76, 3], [68, 74, 2.2]];
  function facePath(t, cx, cy, k) {
    const [w, h, n] = FACE[t], pts = [];
    for (let i = 0; i < 64; i++) {
      const a = i / 64 * TAU, c = Math.cos(a), s = Math.sin(a);
      pts.push([cx + k * w * Math.sign(c) * Math.abs(c) ** (2 / n), cy + k * h * Math.sign(s) * Math.abs(s) ** (2 / n)]);
    }
    return `<polygon points="${P(pts)}" fill="#fff" stroke="${K}" stroke-width="${f(2.5 * Math.max(k, .5))}" stroke-linejoin="round"/>`;
  }
  function eye(t, x, y) {
    switch (t) {
      case 0: return circle(x, y, 3.2, K);
      case 1: return line(x - 7, y, x + 7, y, 3.5);
      case 2: return circle(x, y, 6.5, 'none', `stroke="${K}" stroke-width="2.5"`);
      case 3: return line(x - 3, y - 7, x - 3, y + 7, 3) + line(x + 3, y - 7, x + 3, y + 7, 3);
      case 4: return `<ellipse cx="${x}" cy="${y}" rx="5" ry="8" fill="${K}"/>`;
      case 5: return `<rect x="${x - 7}" y="${y - 7}" width="14" height="14" ${ST}/><rect x="${x - 2.5}" y="${y - 2.5}" width="5" height="5" fill="${K}"/>`;
      case 6: return path(`M${x - 7} ${y + 2}Q${x} ${y - 8} ${x + 7} ${y + 2}`);
      case 7: return path(`M${x - 7} ${y - 2}Q${x} ${y + 8} ${x + 7} ${y - 2}`);
      case 8: return circle(x, y, 8, K) + circle(x + 2.5, y - 2.5, 2.5, '#fff');
      default: return line(x - 5, y - 5, x + 5, y + 5, 2.8) + line(x + 5, y - 5, x - 5, y + 5, 2.8);
    }
  }
  function nose(t, x, y) {
    switch (t) {
      case 0: return circle(x, y, 2.2, K);
      case 1: return line(x, y - 7, x, y + 5, 2.5);
      case 2: return path(`M${x} ${y - 7}V${y + 5}H${x + 7}`);
      case 3: return path(`M${x} ${y - 7}L${x - 6} ${y + 5}H${x + 6}Z`);
      case 4: return circle(x, y, 4.5, 'none', `stroke="${K}" stroke-width="2.5"`);
      case 5: return circle(x - 4, y + 2, 1.8, K) + circle(x + 4, y + 2, 1.8, K);
      case 6: return path(`M${x - 6} ${y - 2}Q${x} ${y + 8} ${x + 6} ${y - 2}`);
      case 7: return path(`M${x - 6} ${y + 5}L${x} ${y - 5}L${x + 6} ${y + 5}`);
      case 8: return `<polygon points="${x - 6},${y - 5} ${x + 6},${y - 5} ${x},${y + 5}" fill="${K}"/>`;
      default: return line(x - 5, y + 2, x + 5, y + 2, 2.5);
    }
  }
  function mouth(t, x, y) {
    switch (t) {
      case 0: return line(x - 12, y, x + 12, y, 2.5);
      case 1: return path(`M${x - 14} ${y - 4}Q${x} ${y + 10} ${x + 14} ${y - 4}`);
      case 2: return path(`M${x - 14} ${y + 4}Q${x} ${y - 10} ${x + 14} ${y + 4}`);
      case 3: return `<ellipse cx="${x}" cy="${y}" rx="6" ry="8" ${ST}/>`;
      case 4: return path(`M${x - 14} ${y - 4}H${x + 14}Q${x} ${y + 14} ${x - 14} ${y - 4}Z`, `fill="${K}"`);
      case 5: return path(`M${x - 16} ${y}L${x - 8} ${y - 5}L${x} ${y + 1}L${x + 8} ${y - 5}L${x + 16} ${y}`);
      case 6: return circle(x, y, 3, K);
      case 7: return path(`M${x - 12} ${y - 4}Q${x - 6} ${y + 6} ${x} ${y - 4}Q${x + 6} ${y + 6} ${x + 12} ${y - 4}`);
      case 8: return path(`M${x - 10} ${y - 5}H${x + 10}L${x} ${y + 6}Z`);
      default: return line(x - 12, y + 4, x + 12, y - 5, 2.5);
    }
  }
  function ornament(t, x, y) {
    const W = `fill="#fff" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"`;
    switch (t) {
      case 0: return '';
      case 1: return path(`M${x} ${y}Q${x + 9} ${y - 12} ${x - 4} ${y - 19}`);
      case 2: return line(x, y, x - 10, y - 14, 2.5) + line(x, y, x, y - 17, 2.5) + line(x, y, x + 10, y - 14, 2.5);
      case 3: return `<polygon points="${x},${y - 6} ${x - 15},${y - 15} ${x - 15},${y + 3}" fill="${K}"/><polygon points="${x},${y - 6} ${x + 15},${y - 15} ${x + 15},${y + 3}" fill="${K}"/>` + circle(x, y - 6, 3.6, '#fff', `stroke="${K}" stroke-width="2"`);
      case 4: return `<rect x="${x - 18}" y="${y - 18}" width="36" height="16" fill="${K}"/>` + line(x - 28, y - 2, x + 28, y - 2, 3.5);
      case 5: return line(x, y, x, y - 15, 2.5) + circle(x, y - 18, 4, K);
      case 6: return `<polygon points="${x - 26},${y + 12} ${x - 20},${y - 12} ${x - 10},${y + 5}" ${W}/><polygon points="${x + 26},${y + 12} ${x + 20},${y - 12} ${x + 10},${y + 5}" ${W}/>`;
      case 7: return path(`M${x - 18} ${y + 3}V${y - 14}L${x - 9} ${y - 5}L${x} ${y - 16}L${x + 9} ${y - 5}L${x + 18} ${y - 14}V${y + 3}Z`, `fill="#F2C230" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"`);
      case 8: return path(`M${x} ${y}Q${x - 13} ${y - 10} ${x} ${y - 22}Q${x + 13} ${y - 10} ${x} ${y}Z`, `fill="#4BA560" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"`);
      default: return path(`M${x} ${y}C${x} ${y - 17} ${x + 17} ${y - 17} ${x + 15} ${y - 6}C${x + 14} ${y} ${x + 6} ${y - 2} ${x + 8} ${y - 8}`);
    }
  }
  const MOLES = [[122, 128], [80, 134], [112, 80], [86, 78], [128, 104], [72, 104], [100, 148], [116, 142], [84, 144]];
  RULES.push({
    id: 'face', name: '福笑い', cat: '絵・キャラ',
    sum: '12桁それぞれが顔のパーツを選び、ひとつの顔になる。',
    steps: [
      '角の丸い正方形を、1桁目に対応する色で塗る。',
      '2桁目で輪郭を選んで中央に置き、8桁目の数字が大きいほど大きな耳を左右に付ける。',
      '3・4桁目で左右の目、6桁目で鼻、7桁目で口を凡例から選び、決まった位置に置く。',
      '眉は水平を基準に、5桁目の数字に応じて傾ける(数字−4.5)×8°。左右対称にする。',
      '頬に、9桁目の色・10桁目の大きさの円を置く。11桁目の数だけ、決まった順にほくろを打つ。',
      '12桁目で頭の飾りを選び、輪郭の頂点に付ける。',
    ],
    legend: [
      { t: '1桁目：背景の色', cell: k => swatch(BG[k]) },
      { t: '2桁目：輪郭', cell: k => facePath(k, 15, 15, .16) },
      { t: '3・4桁目：目', cell: k => eye(k, 15, 15) },
      { t: '6桁目：鼻', cell: k => nose(k, 15, 16) },
      { t: '7桁目：口', cell: k => `<g transform="translate(15 15) scale(.8) translate(-15 -15)">${mouth(k, 15, 14)}</g>` },
      { t: '9桁目：頬の色', cell: k => circle(15, 15, 9, CHEEK[k]) },
      { t: '12桁目：頭の飾り', cell: k => `<g transform="translate(15 15) scale(.75) translate(-15 -15)">${ornament(k, 15, 26)}</g>` },
    ],
    draw(d) {
      const cy = 106, [w, h] = FACE[d[1]], er = 8 + d[7] * 1.4;
      let o = T(1, `<rect width="200" height="200" rx="24" fill="${BG[d[0]]}"/>`), ears = '', cheeks = '', brows = '', moles = '';
      [-1, 1].forEach(s => { ears += circle(C + s * (w + er * .45), cy, er, '#fff', `stroke="${K}" stroke-width="2.5"`); });
      o += T(8, ears) + T(2, facePath(d[1], C, cy, 1));
      [-1, 1].forEach(s => { cheeks += circle(C + s * 34, cy + 14, 5 + d[9] * 1.1, CHEEK[d[8]], 'opacity=".85"'); });
      o += T([9, 10], cheeks) + T(3, eye(d[2], C - 24, cy - 10)) + T(4, eye(d[3], C + 24, cy - 10));
      const ba = deg((d[4] - 4.5) * 8);
      [-1, 1].forEach(s => {
        const bx = C + s * 24, by = cy - 26, dx = 9 * Math.cos(ba), dy = 9 * Math.sin(ba);
        brows += line(bx - s * dx, by + dy, bx + s * dx, by - dy, 2.5);
      });
      o += T(5, brows) + T(6, nose(d[5], C, cy + 6)) + T(7, mouth(d[6], C, cy + 28));
      for (let i = 0; i < d[10]; i++) moles += circle(MOLES[i][0], MOLES[i][1], 1.7, K);
      return o + T(11, moles) + T(12, ornament(d[11], C, cy - h));
    },
  });

  /* 10 ぶどう ─────────────────────────────── */
  const grapeR = v => v === 0 ? 20 : 2 + v * 1.8;
  const grapeC = v => `hsl(262 70% ${f(90 - (v === 0 ? 10 : v) * 7.4)}%)`;
  RULES.push({
    id: 'grape', name: 'ぶどう', cat: '三角',
    sum: '数字の大きさを粒の大きさと色の濃さに置き換え、一房に並べる。',
    steps: [
      '粒の位置を、上から4・3・2・2・1個の逆三角形に決めておく。',
      '左上から右へ、上の段から順に12桁を1粒ずつ割り当てる。',
      '数字が大きいほど粒を大きく、色を濃くする。1が最小で、0は9より大きい最大の粒とする。',
      '房の上の中央に、決まった形の軸を付ける。',
    ],
    legend: [{ t: '数字 = 粒の大きさと色', cell: k => circle(15, 15, grapeR(k) * .6, grapeC(k)) }],
    draw(d) {
      let o = `<path d="M100 42Q100 16 112 6" fill="none" stroke="#5A2C0A" stroke-width="5" stroke-linecap="round"/>`, i = 0;
      [4, 3, 2, 2, 1].forEach((n, row) => {
        for (let j = 0; j < n; j++, i++) o += T(i + 1, circle(C + (j - (n - 1) / 2) * 34, 62 + row * 29, grapeR(d[i]), grapeC(d[i])));
      });
      return o;
    },
  });

  /* 11 軌道 ─────────────────────────────── */
  const ANG = [0, 40, 115, 200, 290, 10, 75, 160, 250, 325];
  const body = (k, cx, cy, s) => pol(cx, cy, k * 9.5 * s, deg(ANG[k] - 90));
  RULES.push({
    id: 'orbit', name: '軌道', cat: '中心点',
    sum: '0〜9を同心円の軌道上の天体とし、数字の順に天体をたどる。',
    steps: [
      '中心を0とし、外へ向かって1〜9の同心円の軌道を等間隔に引く。',
      '各軌道の上に天体を1つ置く。角度は軌道ごとに決まった値(真上から時計回りに 40・115・200・290・10・75・160・250・325°)。',
      '1桁目の天体から12桁目の天体まで、数字の順に直線で結ぶ。',
      '通過した天体に円を描く。同じ天体を n 回通ったら、n 重の円にする。',
    ],
    legend: [{
      t: '数字 = 天体の位置', cell: k => {
        let o = '';
        for (let i = 1; i < 10; i++) o += circle(15, 15, i * 1.4, 'none', `stroke="${i === k ? K : '#ccc'}" stroke-width="${i === k ? .9 : .4}"`);
        return o + circle(...body(k, 15, 15, 1.4 / 9.5), 1.8, K);
      },
    }],
    draw(d) {
      let o = circle(C, C, 98, '#0B0B10');
      for (let i = 1; i < 10; i++) o += circle(C, C, i * 9.5, 'none', 'stroke="#fff" stroke-opacity=".3" stroke-width=".6"');
      for (let i = 0; i < 11; i++) o += T([i + 1, i + 2], line(...body(d[i], C, C, 1), ...body(d[i + 1], C, C, 1), 1, '#fff'));
      const cnt = {};
      d.forEach((x, i) => {
        cnt[x] = (cnt[x] || 0) + 1;
        o += T(i + 1, circle(...body(x, C, C, 1), 5 * cnt[x], 'none', 'stroke="#fff" stroke-width=".9"'));
      });
      return o;
    },
  });

  /* 12 色面 ─────────────────────────────── */
  const PAL = ['#22303A', '#1F2A7A', '#D12F26', '#2F5D3A', '#D62F7F', '#FFF04D', '#F28C28', '#3BA7D9', '#8A5BB5', '#EDE6D6'];
  RULES.push({
    id: 'blocks', name: '色面', cat: 'たて・よこ',
    sum: '数字を色と幅に置き換え、3段の色面で正方形を埋める。',
    steps: [
      '正方形を、同じ高さの3段に分ける。',
      '12桁を4桁ずつ、上段・中段・下段に割り当てる。',
      '各段を左から4つの長方形に分ける。幅は(数字＋1)の比で分ける。',
      '各長方形を、数字に対応する色(凡例)で塗る。',
    ],
    legend: [
      { t: '数字 = 色', cell: k => swatch(PAL[k]) },
      { t: '数字 = 幅の比(数字＋1)', cell: k => `<rect x="2" y="11" width="${f(2.6 * (k + 1))}" height="8" fill="${K}"/>` },
    ],
    draw(d) {
      let o = '';
      for (let r = 0; r < 3; r++) {
        const row = d.slice(r * 4, r * 4 + 4), sum = row.reduce((a, b) => a + b + 1, 0);
        let x = 10;
        row.forEach((v, j) => { const w = 180 * (v + 1) / sum; o += T(r * 4 + j + 1, `<rect x="${f(x)}" y="${10 + r * 60}" width="${f(w + .3)}" height="60.3" fill="${PAL[v]}"/>`); x += w; });
      }
      return o;
    },
  });

  /* 13 四辺むすび ─────────────────────────── */
  const side = v => 20 + v * 160 / 9;
  RULES.push({
    id: 'quad', name: '四辺むすび', cat: '四隅',
    sum: '正方形の四辺の上に点を取り、3つの四角形を重ねる。',
    steps: [
      '正方形の各辺を9等分し、端を含めて10個の点を打つ。',
      '12桁を4桁ずつ3組に分ける。各組の4桁を、上辺・右辺・下辺・左辺の順に割り当てる。',
      '各辺で、数字の番号の点を選ぶ。数える向きは時計回り(上辺は左から、右辺は上から、下辺は右から、左辺は下から)。',
      '選んだ4点を結んで四角形にする。',
      '1組目を黒、2組目を黄、3組目を水玉と黒い輪郭にして、この順に重ねる。',
    ],
    legend: [{
      t: '数字 = 辺の上の点の位置(上辺の場合)', cell: k => `<rect x="4" y="6" width="22" height="22" fill="none" stroke="#bbb" stroke-width=".7"/>` + circle(4 + k * 22 / 9, 6, 2.2, K),
    }],
    draw(d, id) {
      const pt = g => [[side(g[0]), 20], [180, side(g[1])], [180 - (side(g[2]) - 20), 180], [20, 180 - (side(g[3]) - 20)]], q = g => P(pt(g));
      let o = `<defs><pattern id="${id}p" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="5.5" fill="none" stroke="${K}" stroke-width=".9"/></pattern></defs>`;
      for (let i = 0; i < 10; i++) {
        const v = side(i);
        [[v, 20], [180, v], [v, 180], [20, v]].forEach(([x, y]) => { o += circle(x, y, 2.2, 'none', 'stroke="#bbb" stroke-width=".8"'); });
      }
      o += T(R(1, 4), `<polygon points="${q(d.slice(0, 4))}" fill="${K}"/>`);
      o += T(R(5, 8), `<polygon points="${q(d.slice(4, 8))}" fill="#E9E636"/>`);
      o += T(R(9, 12), `<polygon points="${q(d.slice(8))}" fill="url(#${id}p)" stroke="${K}" stroke-width="2" stroke-linejoin="round"/>`);
      for (let g = 0; g < 3; g++) pt(d.slice(g * 4, g * 4 + 4)).forEach(([x, y], j) => { o += hint(g * 4 + j + 1, x, y, 6); });
      return o;
    },
  });

  /* 数字 → 視覚変数 の対応表。[桁の位置, 視覚変数, 何を決めるか] */
  // 一覧での並び順：福笑いと四辺むすびを入れ替える
  {
    const i = RULES.findIndex(r => r.id === 'face'), j = RULES.findIndex(r => r.id === 'quad');
    [RULES[i], RULES[j]] = [RULES[j], RULES[i]];
  }
  const R = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i), ALL = R(1, 12);
  const MAP = {
    vertex: ['真上の頂点から時計回り', [[ALL, '位置', '結ぶ先の頂点(進む数)'], [R(1, 6), '色', '面Aの色(2桁ずつ R・G・B)'], [R(7, 12), '色', '面Bの色(2桁ずつ R・G・B)']]],
    rings: ['内側の輪 → 外側の輪', [[ALL, '模様', '輪の模様']]],
    tiles: ['左上から右へ、上段 → 下段', [[ALL, '形', 'タイルの形']]],
    seigaiha: ['8進数に直した後、左上から右へ、上段 → 下段', [[ALL, '線', '3本の帯の太さ(8進数に変換)']]],
    metaball: ['色 → 位置 → 大きさ', [[[1, 2], '色', 'グラデーション両端の色相'], [[3], '向き', 'グラデーションの向き'], [R(4, 9), '位置', '球A・B・Cの横と縦'], [R(10, 12), '大きさ', '球A・B・Cの大きさ']]],
    nijimi: ['3桁ごとに1つの色のかたまり', [[[1, 4, 7], '色', '3つの色の色相'], [[2, 5, 8], '向き', '中心から見た向き'], [[3, 6, 9], '大きさ', '滲みの大きさ'], [[10], '位置', '中心からの距離'], [[11], '形', 'うねりの強さ'], [[12], '形', 'うねりの細かさ']]],
    shapeline: ['左から右へ、上段 → 下段', [[[1, 3, 5, 7, 9, 11], '形', '図形の種類'], [[2, 4, 6, 8, 10, 12], '線', '線の種類']]],
    hex: ['真上の軸から時計回り', [[R(1, 6), '位置', '6つの頂点の距離'], [R(7, 12), '色', '全体の色相(2桁ずつ R・G・B)'], [R(7, 12), '色', '6つの三角形の明るさ']]],
    face: ['桁ごとに決まったパーツ', [[[1], '色', '背景の色'], [[2], '形', '輪郭'], [[3], '形', '左目'], [[4], '形', '右目'], [[5], '向き', '眉の角度'], [[6], '形', '鼻'], [[7], '形', '口'], [[8], '大きさ', '耳'], [[9], '色', '頬の色'], [[10], '大きさ', '頬'], [[11], '個数', 'ほくろ'], [[12], '形', '頭の飾り']]],
    grape: ['左上から右へ、上段 → 下段', [[ALL, '大きさ', '粒の大きさ'], [ALL, '色', '粒の色の濃さ']]],
    orbit: ['1桁目の天体から順にたどる', [[ALL, '位置', 'たどる天体'], [ALL, '個数', '円の重なり(通過した回数)']]],
    blocks: ['左から右へ、上段 → 下段', [[ALL, '色', '面の色'], [ALL, '大きさ', '面の幅']]],
    quad: ['四角形ごとに 上辺 → 右辺 → 下辺 → 左辺', [[R(1, 4), '位置', '四角形1(黒)の4点'], [R(5, 8), '位置', '四角形2(黄)の4点'], [R(9, 12), '位置', '四角形3(水玉)の4点']]],
  };
  RULES.forEach(r => { [r.order, r.map] = MAP[r.id]; });
  Object.assign(MN, { T, hint, circle, line, R, ALL });
})();
