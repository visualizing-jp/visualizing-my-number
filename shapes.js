'use strict';
/* 分類から：8つの分類(配置のしかた)と、数字の表し方を組み合わせて汎用的な図形をつくる */
(function () {
  const { TAU, f, pol, P, deg, arc, T, hint, circle, line, R, ALL, view } = MN;
  const C = 100, K = '#111';
  const ODD = [1, 3, 5, 7, 9, 11], EVEN = [2, 4, 6, 8, 10, 12];

  const INKS = [
    { n: '黒', c: '#111', h: 0, s: 0 }, { n: '藍', c: '#263C7E', h: 225, s: 55 }, { n: '赤', c: '#C9382A', h: 6, s: 65 },
    { n: '緑', c: '#2F7D4F', h: 145, s: 45 }, { n: '紫', c: '#7D46AD', h: 272, s: 42 },
  ];
  const tone = (ink, v) => `hsl(${ink.h} ${ink.s}% ${f(88 - v * 8.5)}%)`;

  /* ── 図形の部品 ── */
  // 0 は円、1 は棒、2 は楕円、3 以上はその数の角をもつ正多角形
  function glyph(v, cx, cy, r, fill, rot) {
    const tr = `transform="rotate(${f(rot || 0)} ${f(cx)} ${f(cy)})"`;
    if (v === 0) return circle(cx, cy, r, fill);
    if (v === 1) return `<rect x="${f(cx - r * .28)}" y="${f(cy - r)}" width="${f(r * .56)}" height="${f(r * 2)}" fill="${fill}" ${tr}/>`;
    if (v === 2) return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(r)}" ry="${f(r * .5)}" fill="${fill}" ${tr}/>`;
    const pts = [];
    for (let i = 0; i < v; i++) pts.push(pol(cx, cy, r, i / v * TAU - TAU / 4));
    return `<polygon points="${P(pts)}" fill="${fill}" ${tr}/>`;
  }
  // 1つの数字を、枠(中心 cx, cy・一辺 s)の中の図形にする
  function mark(enc, v, cx, cy, s, ink) {
    if (enc === 'size') return circle(cx, cy, Math.max(1, s * .47 * v / 9), ink.c);
    if (enc === 'shape') return glyph(v, cx, cy, s * .42, ink.c, 0);
    if (enc === 'tone') return `<rect x="${f(cx - s * .43)}" y="${f(cy - s * .43)}" width="${f(s * .86)}" height="${f(s * .86)}" fill="${tone(ink, v)}"/>`;
    return circle(cx, cy, s * .09, ink.c) + line(cx, cy, ...pol(cx, cy, s * .43, deg(v * 36 - 90)), f(s * .1), ink.c);
  }
  // 1つの数字を、横の軸(y=100)の上の位置 cx に立つ縦長の図形にする
  function markYoko(enc, v, cx, ink) {
    if (enc === 'size') { const h = 10 + v * 16; return `<rect x="${f(cx - 5.5)}" y="${f(100 - h / 2)}" width="11" height="${f(h)}" fill="${ink.c}"/>`; }
    if (enc === 'shape') return `<g transform="translate(${f(cx)} 100) scale(1 8) translate(${f(-cx)} -100)">${glyph(v, cx, 100, 6.6, ink.c, 0)}</g>`;
    if (enc === 'tone') return `<rect x="${f(cx - 7.6)}" y="25" width="15.2" height="150" fill="${tone(ink, v)}"/>`;
    const dx = 70 * Math.tan(deg((v - 4.5) * 5));
    return line(cx + dx, 30, cx - dx, 170, 4, ink.c);
  }
  // 1つの数字を、半径 r の輪にする
  function ringMark(enc, v, r, ink) {
    const base = `cx="100" cy="100" r="${f(r)}" fill="none"`;
    if (enc === 'size') return `<circle ${base} stroke="${ink.c}" stroke-width="${f(.5 + v * .62)}"/>`;
    if (enc === 'tone') return `<circle ${base} stroke="${tone(ink, v)}" stroke-width="6"/>`;
    if (enc === 'shape') {
      const u = TAU * r / (v + 1);
      return `<circle ${base} stroke="${ink.c}" stroke-width="2.6" ${v ? `stroke-dasharray="${f(u * .6)} ${f(u * .4)}"` : ''} transform="rotate(-90 100 100)"/>`;
    }
    const a = v * 36 - 90;
    return `<path d="${arc(100, 100, r, deg(a + 25), deg(a + 335))}" fill="none" stroke="${ink.c}" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  function smooth(p) {
    const n = p.length;
    let s = `M${f(p[0][0])} ${f(p[0][1])}`;
    for (let i = 0; i < n; i++) {
      const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n], e = p[(i + 2) % n];
      s += `C${f(b[0] + (c[0] - a[0]) / 6)} ${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)} ${f(c[1] - (e[1] - b[1]) / 6)} ${f(c[0])} ${f(c[1])}`;
    }
    return s + 'Z';
  }

  /* ── 選択肢 ── */
  const ENC = {
    size: { n: '大きさ', v: '大きさ', slot: '数字が大きいほど大きな円にする。0 は最小の点とする。', ring: '数字が大きいほど輪の線を太くする。', yoko: '各位置に、軸を中心として上下に伸びる縦の棒を立てる。数字が大きいほど棒を長くする。' },
    shape: { n: '形', v: '形', slot: '0 は円、1 は棒、2 は楕円、3 以上はその数の角をもつ正多角形にする。', ring: '輪を(数字＋1)個の破線に区切る。0 は切れ目のない輪とする。', yoko: '各位置に、図形を縦に8倍に引き伸ばして置く。0 は円、1 は棒、2 は楕円、3 以上はその数の角をもつ正多角形。' },
    tone: { n: '濃さ', v: '色', slot: '数字が大きいほど濃い色の正方形にする。', ring: '数字が大きいほど濃い色の輪にする。', yoko: '各位置を、上から下までの縦の帯にする。数字が大きいほど濃い色で塗る。' },
    angle: { n: '向き', v: '向き', slot: '真上を 0 として、数字×36°だけ時計回りに回した針にする。', ring: '輪に切れ目を1つ入れ、切れ目の向きを数字×36°(真上が 0、時計回り)にする。', yoko: '各位置に、軸の上の点を中心とする長い線を引く。垂直を基準に(数字−4.5)×5°だけ傾ける。0 は左へ、9 は右へ最も傾く。' },
  };
  const LINK = { dots: '点', line: '折れ線', area: '面', curve: '曲線' };
  const ALINK = { outline: '線で結ぶ', none: '結ばない' };
  const LAYOUTS = [
    { id: 'yoko', cat: 'よこ', kind: 'slot', coord: '直交座標・1軸', sum: '直交座標の1軸。並び順をよこ軸に取り、数字を図形に置き換える。' },
    { id: 'tateyoko', cat: 'たて・よこ', kind: 'points', coord: '直交座標・2軸' },
    { id: 'polar', cat: 'むき・きょり', kind: 'points', coord: '極座標' },
    { id: 'grid', cat: '方眼紙', kind: 'slot', coord: '直交座標・マス目', sum: '直交座標のマス目。並び順をマスの位置(横4×縦3)に取り、数字を図形に置き換える。' },
    { id: 'corners', cat: '四隅', kind: 'anchor', coord: '直交座標・原点4つ', sum: '12桁を3桁ずつ、正方形の四隅に置く図形に割り当てる。' },
    { id: 'tri', cat: '三角', kind: 'anchor', coord: '三角座標', sum: '12桁を4桁ずつ、三角形の3つの頂点に置く図形に割り当てる。' },
    { id: 'center', cat: '中心点', kind: 'slot', coord: '極座標・距離のみ', sum: '極座標の距離だけを使う。並び順を中心からの距離に取り、数字を輪の表し方に置き換える。' },
    { id: 'chara', cat: '絵・キャラ', kind: 'chara' },
  ];

  /* ── ルールの組み立て ── */
  function slotRule(L, st) {
    const ink = INKS[st.ink], e = st.enc, E = ENC[e], ring = L.id === 'center', yoko = L.id === 'yoko';
    const yx = i => e === 'angle' ? 32 + i * 12.36 : 17.5 + i * 15;
    const pos = i => [34 + (i % 4) * 44, 56 + Math.floor(i / 4) * 44, 40];
    const place = {
      yoko: ['左から右へ', '1本の横線の上に、等間隔に12個の位置を取る。左から1桁目、右端が12桁目。'],
      grid: ['左上から右へ、上段 → 下段', '横4マス×縦3マスの方眼を用意し、左上から右へ、上段から順に12桁を1マスずつ割り当てる。'],
      center: ['内側の輪 → 外側の輪', '中心から等間隔に12本の同心円を引く。内側から1桁目、外側が12桁目。'],
    }[L.id];
    return {
      id: `${L.id}_${e}`, name: `${L.cat} × ${E.n}`, order: place[0],
      map: [[ALL, E.v, ring ? `輪の${E.n === '形' ? '区切り方' : E.n === '大きさ' ? '太さ' : E.n === '向き' ? '切れ目の向き' : '濃さ'}` : `図形の${E.n}`]],
      steps: [place[1], ring ? E.ring : yoko ? E.yoko : `各位置に、数字に対応する図形を置く。${E.slot}`, '色は選んだ1色だけを使い、位置と間隔は数字によらず固定する。'],
      legend: [{ t: `数字 = ${E.n}`, cell: k => ring ? `<g transform="translate(15 15) scale(.36) translate(-100 -100)">${ringMark(e, k, 30, ink)}</g>` : yoko ? `<g transform="translate(15 15) scale(.17) translate(-100 -100)">${markYoko(e, k, 100, ink)}</g>` : mark(e, k, 15, 15, 26, ink) }],
      draw: d => d.map((v, i) => T(i + 1, ring ? ringMark(e, v, 10 + i * 7.4, ink) : yoko ? markYoko(e, v, yx(i), ink) : mark(e, v, ...pos(i), ink))).join(''),
    };
  }

  // よこ(1軸)で、数字の値を軸の上の位置にする場合
  function yokoValueRule(L, st) {
    const ink = INKS[st.ink];
    return {
      id: 'yoko_value', name: 'よこ × 数字を位置に', order: '1桁目が最も小さい円、12桁目が最も大きい円',
      sum: '直交座標の1軸。数字の値をよこ軸の上の位置に取り、並び順を円の大きさにする。',
      map: [[ALL, '位置', 'よこ軸の上の位置(数字の値)'], [ALL, '大きさ', '円の大きさ(並び順)']],
      steps: [
        '1本のよこ軸を引き、左端を 0、右端を 9 として10個の目盛りを等間隔に取る。',
        '12桁それぞれについて、数字の値の目盛りを中心とする円を描く。',
        '円の大きさは並び順で決める。1桁目を最も小さく、12桁目を最も大きくする。',
        '円は選んだ1色の線で描き、塗らない。同じ数字が重なると同心円になる。',
      ],
      legend: [{ t: '数字 = よこ軸の上の位置', cell: v => line(3, 15, 27, 15, .6, '#aaa') + circle(3 + v * 24 / 9, 15, 2.2, K) }],
      draw: d => d.map((v, i) => T(i + 1, circle(20 + v * 17.8, 100, 3 + i * 1.4, 'none', `stroke="${ink.c}" stroke-width="2.2"`))).join(''),
    };
  }

  // 方眼紙(直交座標のマス目)で、数字の値をマスの列・行にする場合
  function gridCoordRule(L, st) {
    const ink = INKS[st.ink], ax = st.axis;
    const G = ax === 'col' ? { nx: 10, ny: 12, w: 16, h: 14 } : ax === 'row' ? { nx: 12, ny: 10, w: 14, h: 16 } : { nx: 10, ny: 10, w: 17, h: 17 };
    const x0 = 100 - G.nx * G.w / 2, y0 = 100 - G.ny * G.h / 2;
    const cell = (cx, cy, fill) => `<rect x="${f(x0 + cx * G.w)}" y="${f(y0 + cy * G.h)}" width="${G.w}" height="${G.h}" fill="${fill}"/>`;
    const grid = () => {
      let o = '';
      for (let i = 0; i <= G.nx; i++) o += line(x0 + i * G.w, y0, x0 + i * G.w, y0 + G.ny * G.h, .6, ink.c, 'stroke-opacity=".28"');
      for (let j = 0; j <= G.ny; j++) o += line(x0, y0 + j * G.h, x0 + G.nx * G.w, y0 + j * G.h, .6, ink.c, 'stroke-opacity=".28"');
      return o;
    };
    const strip = (k, vert) => R(0, 9).map(j => `<rect x="${f(vert ? 13.8 : 3 + j * 2.4)}" y="${f(vert ? 3 + j * 2.4 : 13.8)}" width="2.4" height="2.4" fill="${j === k ? K : '#fff'}" stroke="#aaa" stroke-width=".3"/>`).join('');
    const D = {
      col: {
        name: '数字を列に', sum: '直交座標のマス目。数字の値をマスの列に、並び順を行に取る。', order: '上の行から下の行へ',
        map: [[ALL, '位置', '塗るマスの列(数字の値)']], legend: [{ t: '数字 = 塗るマスの列', cell: k => strip(k, false) }],
        steps: ['横10列×縦12行の方眼を用意する。列は左から 0〜9、行は上から1桁目〜12桁目とする。', '各行で、数字の値の列にあるマスを1つ塗る。'],
        cells: d => d.map((v, i) => T(i + 1, cell(v, i, ink.c))).join(''),
      },
      row: {
        name: '数字を行に', sum: '直交座標のマス目。並び順をマスの列に、数字の値を行に取る。', order: '左の列から右の列へ',
        map: [[ALL, '位置', '塗るマスの行(数字の値)']], legend: [{ t: '数字 = 塗るマスの行', cell: k => strip(k, true) }],
        steps: ['横12列×縦10行の方眼を用意する。列は左から1桁目〜12桁目、行は上から 0〜9 とする。', '各列で、数字の値の行にあるマスを1つ塗る。'],
        cells: d => d.map((v, i) => T(i + 1, cell(i, v, ink.c))).join(''),
      },
      pair: {
        name: '2桁ずつをマスに', sum: '直交座標のマス目。2桁を1組にして、1桁目を列に、2桁目を行に取る。', order: '2桁ごとに1マス。後のマスほど濃く塗り、上に重ねる',
        map: [[ODD, '位置', '塗るマスの列'], [EVEN, '位置', '塗るマスの行']],
        legend: [{ t: '奇数桁目：列', cell: k => strip(k, false) }, { t: '偶数桁目：行', cell: k => strip(k, true) }],
        steps: ['横10列×縦10行の方眼を用意する。列は左から 0〜9、行は上から 0〜9 とする。', '12桁を2桁ずつ6組に分け、各組の1桁目を列、2桁目を行として、そのマスを塗る。', '1組目を最も薄く、6組目を最も濃く塗る。同じマスに重なった場合は後の組を上にする。'],
        cells: d => R(0, 5).map(i => T([2 * i + 1, 2 * i + 2], cell(d[2 * i], d[2 * i + 1], tone(ink, 3 + i * 1.2)))).join(''),
      },
    }[ax];
    return {
      id: `grid_${ax}`, name: `方眼紙 × ${D.name}`, sum: D.sum, order: D.order, map: D.map, legend: D.legend,
      steps: [...D.steps, '方眼の線は細く薄く引き、塗ったマスが主役になるようにする。'],
      draw: d => grid() + D.cells(d),
    };
  }

  // 中心点(極座標の距離だけ)で、数字の値を中心からの距離にする場合
  function centerValueRule(L, st) {
    const ink = INKS[st.ink];
    return {
      id: 'center_value', name: '中心点 × 数字を距離に', order: '1桁目が最も太く薄い輪、12桁目が最も細く濃い輪',
      sum: '極座標の距離だけを使う。数字の値を中心からの距離に取り、並び順を輪の太さと濃さにする。',
      map: [[ALL, '位置', '輪の半径(数字の値)'], [ALL, '大きさ', '輪の太さと濃さ(並び順)']],
      steps: [
        '中心から外へ、0〜9 の10段階の半径を等間隔に決める。',
        '12桁それぞれについて、数字の値の半径をもつ輪を描く。',
        '輪の太さと濃さは並び順で決める。1桁目を最も太く薄く、12桁目を最も細く濃くする。',
        '1桁目から順に描き、後の輪を上に重ねる。同じ数字が重なると、太い輪の中に細い輪が見える。',
      ],
      legend: [{ t: '数字 = 輪の半径', cell: v => circle(15, 15, 1, '#aaa') + circle(15, 15, (12 + v * 8.5) * .14, 'none', `stroke="${K}" stroke-width="1"`) }],
      draw: d => d.map((v, i) => T(i + 1, circle(C, C, 12 + v * 8.5, 'none', `stroke="${tone(ink, 1 + i * .75)}" stroke-width="${f(2 + (11 - i) * 1.3)}"`))).join(''),
    };
  }

  // たて・よこ(直交座標・2軸)と、むき・きょり(極座標)。軸に「並び順」と「数字の値」を割り当てる
  function pointsRule(L, st) {
    const ink = INKS[st.ink], k = st.link, ax = st.axis, polar = L.id === 'polar', pair = ax === 'pair';
    const n = pair ? 6 : 12;
    const X = v => 28 + v * 16, Y = v => 28 + v * 16;            // 数字の値 → 直交座標(原点は左上、たて軸は下向き)
    const OX = i => 23 + i * 14, OY = i => 23 + i * 14;          // 並び順 → 直交座標
    const pts = d => R(0, n - 1).map(i => {
      if (polar) {
        if (pair) return pol(C, C, 12 + d[2 * i + 1] * 8.5, deg(d[2 * i] * 36 - 90));
        return ax === 'order' ? pol(C, C, 12 + d[i] * 8.5, deg(i * 30 - 90)) : pol(C, C, 14 + i * 6.8, deg(d[i] * 36 - 90));
      }
      if (pair) return [X(d[2 * i]), Y(d[2 * i + 1])];
      return ax === 'order' ? [OX(i), Y(d[i])] : [X(d[i]), OY(i)];
    });
    const tg = i => pair ? [2 * i + 1, 2 * i + 2] : [i + 1];
    const hAxis = v => line(3, 15, 27, 15, .6, '#aaa') + circle(3 + v * 24 / 9, 15, 2.2, K);
    const vAxis = v => line(15, 3, 15, 27, .6, '#aaa') + circle(15, 3 + v * 24 / 9, 2.2, K);
    const needle = v => circle(15, 15, 1.4, K) + line(15, 15, ...pol(15, 15, 11, deg(v * 36 - 90)), 1.4);
    const radius = v => line(3, 15, 27, 15, .6, '#aaa') + circle(3, 15, 1.2, '#aaa') + circle(3 + (12 + v * 8.5) * .26, 15, 2.2, K);
    const D = polar ? {
      order: {
        sum: '極座標。並び順を向きに、数字の値を中心からの距離に取る。', order: '真上から時計回りに、30°ずつ',
        map: [[ALL, '位置', '中心からの距離(数字の値)']], legend: [{ t: '数字 = 中心からの距離', cell: radius }],
        steps: ['中心から、真上を起点に30°ずつ時計回りに12本の軸を引く。1本目が1桁目、12本目が12桁目。', '各軸の上に点を打つ。数字が大きいほど中心から遠い位置にする。'],
      },
      value: {
        sum: '極座標。数字の値を向きに、並び順を中心からの距離に取る。', order: '内側から外側へ',
        map: [[ALL, '向き', '中心から見た向き(数字の値)']], legend: [{ t: '数字 = 向き', cell: needle }],
        steps: ['中心から等間隔に12本の同心円を引く。内側から1桁目、外側が12桁目。', '各円の上に点を打つ。向きは真上を 0 として、数字×36°だけ時計回りに回した位置にする。'],
      },
      pair: {
        sum: '極座標。2桁を1組にして、1桁目を向きに、2桁目を中心からの距離に取る。', order: '2桁ごとに1つの点。点は1つ目から順に扱う',
        map: [[ODD, '向き', '中心から見た点の向き'], [EVEN, '位置', '中心から点までの距離']],
        legend: [{ t: '奇数桁目：向き', cell: needle }, { t: '偶数桁目：中心からの距離', cell: radius }],
        steps: ['12桁を2桁ずつ6組に分け、1組を1つの点とする。', '各組の1桁目で向き(真上を 0 として数字×36°、時計回り)、2桁目で中心からの距離(数字が大きいほど遠い)を決める。'],
      },
    } : {
      order: {
        sum: '直交座標の2軸。並び順をよこ軸に、数字の値をたて軸に取る。', order: 'よこ軸に沿って左から右へ',
        map: [[ALL, '位置', 'たての位置(数字の値)']], legend: [{ t: '数字 = たての位置', cell: vAxis }],
        steps: ['原点を左上に置き、よこ軸は右向き、たて軸は下向きとする。よこ軸に12個の目盛りを等間隔に取る。左から1桁目、右端が12桁目。', '各目盛りの下に点を打つ。たての位置は数字の値で決め、0 が上端、9 が下端とする。'],
      },
      value: {
        sum: '直交座標の2軸。数字の値をよこ軸に、並び順をたて軸に取る。', order: 'たて軸に沿って上から下へ',
        map: [[ALL, '位置', 'よこの位置(数字の値)']], legend: [{ t: '数字 = よこの位置', cell: hAxis }],
        steps: ['原点を左上に置き、よこ軸は右向き、たて軸は下向きとする。たて軸に12個の目盛りを等間隔に取る。上から1桁目、下端が12桁目。', '各目盛りの高さに点を打つ。よこの位置は数字の値で決め、0 が左端、9 が右端とする。'],
      },
      pair: {
        sum: '直交座標の2軸。2桁を1組にして、1桁目をよこ軸に、2桁目をたて軸に取る。', order: '2桁ごとに1つの点。点は1つ目から順に扱う',
        map: [[ODD, '位置', '点のよこの位置'], [EVEN, '位置', '点のたての位置']],
        legend: [{ t: '奇数桁目：よこの位置', cell: hAxis }, { t: '偶数桁目：たての位置', cell: vAxis }],
        steps: ['12桁を2桁ずつ6組に分け、1組を1つの点とする。', '原点を左上に置き、よこ軸は右向き、たて軸は下向きとする。各組の1桁目でよこの位置(0 が左端、9 が右端)、2桁目でたての位置(0 が上端、9 が下端)を決める。'],
      },
    };
    const how = {
      dots: pair ? '点を円で描く。1つ目の点を最も小さく、順番が後の点ほど大きくする。' : '点を同じ大きさの円で描く。',
      line: '1つ目の点から最後の点まで、順番に直線で結ぶ。',
      area: '点を順番に結んで閉じ、内側を塗る。',
      curve: '点を順番に通る、閉じたなめらかな曲線を引く。',
    }[k];
    const def = D[ax];
    return {
      id: `${L.id}_${ax}_${k}`, name: `${L.cat} × ${LINK[k]}`, sum: def.sum, order: def.order, map: def.map, legend: def.legend,
      steps: [...def.steps, how],
      draw(d) {
        const p = pts(d);
        let o = '';
        if (k === 'area') o += T(ALL, `<polygon points="${P(p)}" fill="${ink.c}" opacity=".88" stroke="${ink.c}" stroke-width="2" stroke-linejoin="round"/>`);
        if (k === 'curve') o += T(ALL, `<path d="${smooth(p)}" fill="none" stroke="${ink.c}" stroke-width="${pair ? 4 : 3}" stroke-linejoin="round"/>`);
        if (k === 'line') for (let i = 0; i < n - 1; i++) o += T([...tg(i), ...tg(i + 1)], line(...p[i], ...p[i + 1], 3, ink.c));
        p.forEach((q, i) => {
          if (k === 'dots') o += T(tg(i), circle(q[0], q[1], pair ? 4 + i * 1.3 : 5.5, ink.c, 'opacity=".88"'));
          else if (k === 'line') o += T(tg(i), circle(q[0], q[1], pair ? 4.5 : 3.6, ink.c));
          else o += hint(tg(i), q[0], q[1], 6);
        });
        return o;
      },
    };
  }

  function anchorRule(L, st) {
    const ink = INKS[st.ink], tri = L.id === 'tri', n = tri ? 4 : 3;
    const A = tri ? [[100, 46], [154, 146], [46, 146]] : [[48, 48], [152, 48], [152, 152], [48, 152]];
    const col = i => R(0, A.length - 1).map(a => a * n + i);
    const map = [[col(1), '大きさ', '図形の大きさ'], [col(2), '形', '図形の形'], [col(3), '向き', '図形の回転']];
    const legend = [
      { t: `${col(1).join('・')}桁目：大きさ`, cell: v => circle(15, 15, (10 + v * 3) * .32, ink.c) },
      { t: `${col(2).join('・')}桁目：形`, cell: v => glyph(v, 15, 15, 11, ink.c, 0) },
      { t: `${col(3).join('・')}桁目：回転(数字×10°)`, cell: v => glyph(1, 15, 15, 11, ink.c, v * 10) },
    ];
    if (tri) {
      map.push([col(4), '色', '図形の濃さ']);
      legend.push({ t: `${col(4).join('・')}桁目：濃さ`, cell: v => `<rect x="2" y="2" width="26" height="26" rx="3" fill="${tone(ink, v)}"/>` });
    }
    return {
      id: `${L.id}_${st.alink}`, name: `${L.cat} × ${ALINK[st.alink]}`, map, legend,
      order: tri ? '上の頂点から時計回りに、4桁ずつ' : '左上の隅から時計回りに、3桁ずつ',
      steps: [
        tri ? '正三角形の3つの頂点を、図形を置く位置とする。上の頂点から時計回りに、12桁を4桁ずつ割り当てる。'
          : '正方形の四隅を、図形を置く位置とする。左上から時計回りに、12桁を3桁ずつ割り当てる。',
        '各組の1桁目で図形の大きさ、2桁目で形(0 は円、1 は棒、2 は楕円、3 以上は正多角形)、3桁目で回転(数字×10°)を決める。',
        tri ? '各組の4桁目で図形の濃さを決める。数字が大きいほど濃い。' : '図形は選んだ1色で、少し透かして塗る。重なった部分は濃く見える。',
        st.alink === 'outline' ? '図形を置く位置どうしを、決まった太さの線で結ぶ。' : '図形を置く位置どうしは結ばない。',
      ],
      draw(d) {
        let o = st.alink === 'outline' ? `<polygon points="${P(A)}" fill="none" stroke="${ink.c}" stroke-width="1.6" stroke-linejoin="round"/>` : '';
        A.forEach(([x, y], a) => {
          const g = d.slice(a * n, a * n + n);
          o += T(R(a * n + 1, a * n + n), `<g opacity="${tri ? 1 : .82}">${glyph(g[1], x, y, 10 + g[0] * 3, tri ? tone(ink, g[3]) : ink.c, g[2] * 10)}</g>`);
        });
        return o;
      },
    };
  }

  // 四隅(隅ごとに原点をもつ直交座標)と、三角(三角座標)で、数字の値を位置にする場合
  function anchorCoordRule(L, st) {
    const ink = INKS[st.ink], out = st.alink === 'outline';
    const col = i => R(0, 3).map(a => a * 3 + i), grp = a => [a * 3 + 1, a * 3 + 2, a * 3 + 3];
    const link = p => out ? p.map((q, a) => { const b = (a + 1) % 4; return T([...grp(a), ...grp(b)], line(...q, ...p[b], 2.4, ink.c)); }).join('') : '';
    const how = out ? '4つの点を、1つ目から順に直線で結び、最後の点から1つ目へ戻って閉じる。' : '点どうしは結ばない。';
    if (L.id === 'corners') {
      const O = [[20, 20, 1, 1], [180, 20, -1, 1], [180, 180, -1, -1], [20, 180, 1, -1]];
      const pt = (a, g) => [O[a][0] + O[a][2] * (8 + g[0] * 7), O[a][1] + O[a][3] * (8 + g[1] * 7)];
      const ax = v => line(3, 15, 27, 15, .6, '#aaa') + circle(3, 15, 1.2, '#aaa') + circle(3 + (8 + v * 7) * .3, 15, 2.2, K);
      const ay = v => line(15, 3, 15, 27, .6, '#aaa') + circle(15, 3, 1.2, '#aaa') + circle(15, 3 + (8 + v * 7) * .3, 2.2, K);
      return {
        id: `corners_coord_${st.alink}`, name: `四隅 × 隅を原点に`, order: '左上の隅から時計回りに、3桁ずつ',
        sum: '四隅をそれぞれ原点とする直交座標。3桁を1組にして、隅から内側へ測ったよこ・たての位置と、円の大きさに取る。',
        map: [[col(1), '位置', '隅からのよこの距離'], [col(2), '位置', '隅からのたての距離'], [col(3), '大きさ', '円の大きさ']],
        legend: [
          { t: `${col(1).join('・')}桁目：隅からのよこの距離`, cell: ax },
          { t: `${col(2).join('・')}桁目：隅からのたての距離`, cell: ay },
          { t: `${col(3).join('・')}桁目：円の大きさ`, cell: v => circle(15, 15, (4 + v * 1.6) * .6, ink.c) },
        ],
        steps: [
          '正方形の四隅をそれぞれ原点とし、どの隅でも、よこ軸・たて軸を内側へ向けて引く。左上から時計回りに、12桁を3桁ずつ割り当てる。',
          '各組の1桁目で隅からのよこの距離、2桁目で隅からのたての距離を決め、その位置に円を置く。数字が大きいほど隅から離れ、正方形の中心に近づく。',
          '各組の3桁目で円の大きさを決める。円は選んだ1色で、少し透かして塗る。',
          how, '軸の線は細く薄く引く。',
        ],
        draw(d) {
          const p = O.map((_, a) => pt(a, d.slice(a * 3, a * 3 + 3)));
          let o = O.map(([x, y, sx, sy]) => line(x, y, x + sx * 72, y, .8, ink.c, 'stroke-opacity=".28"') + line(x, y, x, y + sy * 72, .8, ink.c, 'stroke-opacity=".28"')).join('') + link(p);
          p.forEach((q, a) => { o += T(grp(a), circle(q[0], q[1], 4 + d[a * 3 + 2] * 1.6, ink.c, 'opacity=".82"')); });
          return o;
        },
      };
    }
    const V = [[100, 22], [178, 157], [22, 157]], VN = ['上', '右下', '左下'];
    const mix = (v, w) => { const s = w[0] + w[1] + w[2]; return s ? [0, 1].map(k => (v[0][k] * w[0] + v[1][k] * w[1] + v[2][k] * w[2]) / s) : [0, 1].map(k => (v[0][k] + v[1][k] + v[2][k]) / 3); };
    const LV = [[15, 4], [27, 25], [3, 25]];
    const cell = j => k => `<polygon points="${P(LV)}" fill="none" stroke="#aaa" stroke-width=".6"/>` + circle(...LV[j], 1.4, '#aaa') + circle(...mix(LV, [0, 1, 2].map(i => i === j ? k : 4.5)), 2.2, K);
    return {
      id: `tri_tern_${st.alink}`, name: '三角 × 三角座標', order: '3桁ごとに1つの点。1つ目を最も薄く、4つ目を最も濃く塗る',
      sum: '三角座標。3桁を1組にして、3つの頂点への比率に取り、三角形の中の1点に置く。',
      map: [...[0, 1, 2].map(j => [col(j + 1), '位置', `${VN[j]}の頂点への近さ`]), [ALL, '大きさ', '点の大きさ(3桁の合計)']],
      legend: [0, 1, 2].map(j => ({ t: `${col(j + 1).join('・')}桁目：${VN[j]}の頂点への近さ(ほかの2桁が同じ場合)`, cell: cell(j) })),
      steps: [
        '正三角形を描き、上・右下・左下の3つの頂点を軸とする三角座標を使う。',
        '12桁を3桁ずつ4組に分け、1組を1つの点とする。',
        '各組の3つの数字を、順に上・右下・左下の頂点への比率とし、その割合で3つの頂点を混ぜた位置に点を打つ。数字が大きい頂点ほど点が近づく。3つとも 0 のときは三角形の中心に置く。',
        '点は円で描き、3桁の合計が大きいほど大きくする。1組目を最も薄く、4組目を最も濃く塗り、後の点を上に重ねる。',
        how, '三角形の線は細く薄く引く。',
      ],
      draw(d) {
        const g = R(0, 3).map(a => d.slice(a * 3, a * 3 + 3)), p = g.map(w => mix(V, w));
        let o = `<polygon points="${P(V)}" fill="none" stroke="${ink.c}" stroke-opacity=".28" stroke-width=".8"/>` + link(p);
        p.forEach((q, a) => { o += T(grp(a), circle(q[0], q[1], 4 + (g[a][0] + g[a][1] + g[a][2]) * .55, tone(ink, 3 + a * 2), 'opacity=".9"')); });
        return o;
      },
    };
  }

  /* 絵・キャラ：単純な形の体、表情のある目、小物ひとつ。構造は共通で、限られた変化で個体を区別する */
  const BODYC = ['#FF6B6B', '#FF9F45', '#F7C948', '#7BC86C', '#34B3A0', '#4DA8F0', '#6C7BF2', '#A77BF3', '#F07BC1', '#8C97A8'];
  const ACCC = ['#15171A', '#E5484D', '#F5A524', '#B8860B', '#30A46C', '#12A594', '#0090FF', '#6E56CF', '#E93D82', '#7E868C'];
  const DK = '#15171A', U = 62;
  // 体の形ごとの、頭頂の高さ・顔の中心の高さ・目の高さでの半幅・目の間隔の倍率(体の半径を 1 とする)
  const TOP = [-1, -.95, -1, -1.1, -.78, -.72, -1, -.68, -.95, -1], FY = [-.05, -.05, .3, .2, .1, .15, -.15, -.05, -.05, 0];
  const HW = [1, .95, .55, .8, 1, .85, .62, 1, .9, .95], GX = [1, 1, .62, .85, 1, .95, .62, 1.1, .95, .9];
  function bodyUnit(v) {
    const rp = (pts, w) => `<polygon points="${P(pts)}" stroke-width="${w}" stroke-linejoin="round"/>`;
    const c = (x, y, r) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}"/>`;
    switch (v) {
      case 0: return c(0, 0, 1);
      case 1: return rp([[-.8, -.8], [.8, -.8], [.8, .8], [-.8, .8]], .3);
      case 2: return rp([[0, -.8], [.82, .7], [-.82, .7]], .4);
      case 3: return c(0, .2, .8) + rp([[0, -.95], [.55, -.2], [-.55, -.2]], .3);
      case 4: return c(-.5, .15, .5) + c(0, -.2, .58) + c(.5, .15, .5) + `<rect x="-.75" y=".05" width="1.5" height=".6" rx=".3"/>`;
      case 5: return c(0, .2, .8) + c(-.55, -.55, .32) + c(.55, -.55, .32);
      case 6: return `<rect x="-.62" y="-1" width="1.24" height="2" rx=".62"/>`;
      case 7: return `<rect x="-1" y="-.68" width="2" height="1.36" rx=".68"/>`;
      case 8: return rp(R(0, 5).map(i => pol(0, 0, .82, i / 6 * TAU - TAU / 4)), .3);
      default: return R(0, 5).map(i => c(...pol(0, 0, .58, i / 6 * TAU), .4)).join('') + c(0, 0, .62);
    }
  }
  // 目。g は視線の向き(単位ベクトル)
  function botEye(t, x, y, r, g) {
    const px = x + g[0] * r * .3, py = y + g[1] * r * .3, sw = f(Math.max(1.8, r * .38));
    switch (t) {
      case 0: return circle(x, y, r * .62, DK);
      case 1: return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * .5)}" ry="${f(r)}" fill="${DK}"/>`;
      case 2: return circle(x, y, r, '#fff') + circle(px, py, r * .5, DK);
      case 3: return `<path d="M${f(x - r)} ${f(y)}A${f(r)} ${f(r)} 0 0 0 ${f(x + r)} ${f(y)}Z" fill="#fff"/>` + circle(x + g[0] * r * .3, y + r * .42, r * .36, DK);
      case 4: return `<path d="M${f(x - r)} ${f(y + r * .3)}Q${f(x)} ${f(y - r)} ${f(x + r)} ${f(y + r * .3)}" fill="none" stroke="${DK}" stroke-width="${sw}" stroke-linecap="round"/>`;
      case 5: return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * .55)}" fill="${DK}"/>`;
      case 6: return `<rect x="${f(x - r * .75)}" y="${f(y - r * .75)}" width="${f(r * 1.5)}" height="${f(r * 1.5)}" rx="${f(r * .4)}" fill="${DK}"/>`;
      case 7: return line(x - r, y, x + r, y, sw, DK);
      case 8: return `<polygon points="${P([[0, -1], [.28, -.28], [1, 0], [.28, .28], [0, 1], [-.28, .28], [-1, 0], [-.28, -.28]].map(([a, b]) => [x + a * r, y + b * r]))}" fill="${DK}"/>`;
      default: return circle(x, y, r * 1.12, '#fff') + circle(px, py, r * .72, DK) + circle(px - r * .25, py - r * .28, r * .22, '#fff');
    }
  }
  function botMouth(t, x, y, w) {
    const st = `fill="none" stroke="${DK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"`;
    switch (t) {
      case 0: return '';
      case 1: return `<path d="M${f(x - w * .6)} ${f(y - 1)}Q${f(x)} ${f(y + 5)} ${f(x + w * .6)} ${f(y - 1)}" ${st}/>`;
      case 2: return line(x - w * .6, y, x + w * .6, y, 2.4, DK);
      case 3: return `<ellipse cx="${f(x)}" cy="${f(y + 1)}" rx="${f(w * .35)}" ry="${f(w * .45)}" fill="${DK}"/>`;
      case 4: return `<path d="M${f(x - w * .8)} ${f(y - 2)}H${f(x + w * .8)}Q${f(x)} ${f(y + w * 1.1)} ${f(x - w * .8)} ${f(y - 2)}Z" fill="${DK}"/>`;
      case 5: return `<path d="M${f(x - w * .8)} ${f(y - 1)}Q${f(x - w * .4)} ${f(y + 4)} ${f(x)} ${f(y - 1)}Q${f(x + w * .4)} ${f(y + 4)} ${f(x + w * .8)} ${f(y - 1)}" ${st}/>`;
      case 6: return `<path d="M${f(x - w * .6)} ${f(y + 3)}Q${f(x)} ${f(y - 3)} ${f(x + w * .6)} ${f(y + 3)}" ${st}/>`;
      case 7: return circle(x, y, 1.8, DK);
      case 8: return `<path d="M${f(x - w)} ${f(y - 2)}Q${f(x)} ${f(y + 8)} ${f(x + w)} ${f(y - 2)}" ${st}/>`;
      default: return `<path d="M${f(x - w)} ${f(y)}L${f(x - w * .5)} ${f(y - 3)}L${f(x)} ${f(y + 1)}L${f(x + w * .5)} ${f(y - 3)}L${f(x + w)} ${f(y)}" ${st}/>`;
    }
  }
  // 小物。c = { top: 頭頂, hw: 目の高さでの半幅, ey: 目の高さ, er: 目の半径, gap: 目の間隔の半分, low: 口の下 }
  function botAcc(t, col, c) {
    const st = `fill="none" stroke="${col}" stroke-linecap="round" stroke-linejoin="round"`;
    switch (t) {
      case 0: return '';
      case 1: return `<polygon points="${P([[0, c.low], [-13, c.low - 8], [-13, c.low + 8]])}" fill="${col}"/><polygon points="${P([[0, c.low], [13, c.low - 8], [13, c.low + 8]])}" fill="${col}"/>` + circle(0, c.low, 3.6, col);
      case 2: return `<path d="M${f(-c.hw)} ${f(c.ey)}C${f(-c.hw)} ${f(c.top - 22)} ${f(c.hw)} ${f(c.top - 22)} ${f(c.hw)} ${f(c.ey)}" ${st} stroke-width="5"/>`
        + [-1, 1].map(s => `<rect x="${f(s * c.hw - 6)}" y="${f(c.ey - 11)}" width="12" height="22" rx="5" fill="${col}"/>`).join('');
      case 3: return `<g transform="rotate(-12 0 ${f(c.top)})"><ellipse cx="5" cy="${f(c.top + 3)}" rx="27" ry="10" fill="${col}"/></g>` + line(0, c.top - 5, 2, c.top - 12, 3, col);
      case 4: return line(0, c.top + 3, 0, c.top - 15, 3.4, col) + circle(0, c.top - 18, 5.5, col);
      case 5: return [-1, 1].map(s => circle(s * c.gap, c.ey, c.er + 5, 'none', `stroke="${col}" stroke-width="2.8"`)).join('') + line(-c.gap + c.er + 5, c.ey, c.gap - c.er - 5, c.ey, 2.8, col);
      case 6: return `<polygon points="${P([[-17, c.top + 5], [-17, c.top - 13], [-8, c.top - 4], [0, c.top - 15], [8, c.top - 4], [17, c.top - 13], [17, c.top + 5]])}" fill="${col}" stroke="${col}" stroke-width="2" stroke-linejoin="round"/>`;
      case 7: return line(0, c.top + 3, 0, c.top - 9, 3, col) + `<path d="M0 ${f(c.top - 8)}Q-16 ${f(c.top - 12)} -17 ${f(c.top - 24)}Q-2 ${f(c.top - 22)} 0 ${f(c.top - 8)}ZM0 ${f(c.top - 8)}Q16 ${f(c.top - 10)} 18 ${f(c.top - 20)}Q4 ${f(c.top - 20)} 0 ${f(c.top - 8)}Z" fill="${col}"/>`;
      case 8: return `<rect x="${f(-c.hw * .8)}" y="${f(c.low - 5)}" width="${f(c.hw * 1.6)}" height="10" rx="5" fill="${col}"/><rect x="${f(c.hw * .3)}" y="${f(c.low)}" width="9" height="18" rx="4" fill="${col}"/>`;
      default: return `<path d="M-22 ${f(c.top + 6)}C-22 ${f(c.top - 20)} 22 ${f(c.top - 20)} 22 ${f(c.top + 6)}Z" fill="${col}"/><rect x="6" y="${f(c.top + 2)}" width="30" height="7" rx="3.5" fill="${col}"/>`;
    }
  }
  function botRule() {
    const ctx = (shape, sy, d6, er, gapK) => {
      const ey = (FY[shape] + (d6 - 4.5) * .035) * U;
      return { top: TOP[shape] * U * sy, hw: HW[shape] * U, ey, er, gap: gapK * GX[shape] * U, low: ey + er + 27 };
    };
    const demo = ctx(0, 1, 4.5, 9, .3);
    return {
      id: 'chara_bot', name: '絵・キャラ × まるい体と小物', order: '桁ごとに決まった部分',
      parts: [['shape', '体の形', { 1: 0 }], ['color', '体の色', { 2: 5 }], ['eyes', '目の形と配置', { 3: 2, 4: 5, 5: 5, 6: 4 }], ['gaze', '視線の向き', { 7: 2 }], ['mouth', '口', { 8: 1 }], ['pose', '体の傾きと伸び', { 9: 5, 12: 5 }], ['acc', '小物', { 10: 0, 11: 0 }]],
      sum: '単純な形の体・表情のある目・小物ひとつで、12桁を1体のキャラクターにする。',
      map: [[[1], '形', '体の形'], [[2], '色', '体の色'], [[3], '形', '目の形'], [[4], '大きさ', '目の大きさ'], [[5, 6], '位置', '目の間隔と高さ'], [[7], '向き', '視線の向き'], [[8], '形', '口の形'], [[9], '向き', '体の傾き'], [[10], '形', '小物の種類'], [[11], '色', '小物の色'], [[12], '大きさ', '体の縦横の比']],
      steps: [
        '1桁目で体の形を凡例から選び、2桁目の色の1色で塗る。体に輪郭線は付けない。',
        '12桁目で体の縦の伸び(85〜115%)を決め、9桁目で体全体を傾ける(数字−4.5)×3°。',
        '3桁目で目の形を選び、左右に同じ目を置く。4桁目で大きさ、5桁目で間隔、6桁目で高さを決める。',
        '7桁目×36°(真上が 0、時計回り)を視線の向きとし、目をその向きへ少し寄せる。瞳のある目は瞳も寄せる。',
        '8桁目で口を選び、目の下の決まった位置に置く。0 は口なし。',
        '10桁目で小物を1つ選び、11桁目の色で塗る。0 は小物なし。小物の位置は種類ごとに決まっている(頭の上、目のまわり、口の下)。',
      ],
      legend: [
        { pos: [1], t: '1桁目：体の形', cell: v => `<g transform="translate(15 16) scale(11)" fill="${DK}" stroke="${DK}" stroke-width="0">${bodyUnit(v)}</g>` },
        { pos: [2], t: '2桁目：体の色', cell: v => circle(15, 15, 11, BODYC[v]) },
        { pos: [3], t: '3桁目：目の形', cell: v => circle(15, 15, 13, '#C9CED6') + botEye(v, 15, 15, 7.5, [.7, -.7]) },
        { pos: [8], t: '8桁目：口の形', cell: v => botMouth(v, 15, 15, 9) },
        { pos: [10], t: '10桁目：小物の種類', cell: v => `<g transform="translate(15 19) scale(.2)">${circle(0, 0, U, '#C9CED6')}${botAcc(v, DK, demo)}</g>` },
        { pos: [11], t: '11桁目：小物の色', cell: v => circle(15, 15, 9, ACCC[v]) },
      ],
      draw(d) {
        const sh = d[0], col = BODYC[d[1]], sy = .85 + d[11] * .033, er = (5.5 + d[3] * .8) * (GX[sh] < .8 ? .78 : 1);
        const c = ctx(sh, sy, d[5], er, .22 + d[4] * .03), g = pol(0, 0, 1, deg(d[6] * 36 - 90));
        const ex = g[0] * 3, ey = c.ey + g[1] * 3;
        const body = T([1, 2, 9, 12], `<g transform="scale(${U} ${f(U * sy)})" fill="${col}" stroke="${col}" stroke-width="0">${bodyUnit(sh)}</g>`);
        const eyes = T([3, 4, 5, 6, 7], botEye(d[2], ex - c.gap, ey, er, g) + botEye(d[2], ex + c.gap, ey, er, g));
        const mouth = T(8, botMouth(d[7], ex, c.ey + er + 12, 11 * Math.min(1, GX[sh] + .1)));
        const acc = T([10, 11], botAcc(d[9], ACCC[d[10]], c));
        return `<g transform="translate(100 110) rotate(${f((d[8] - 4.5) * 3)})">${body}${eyes}${mouth}${acc}</g>`;
      },
    };
  }

  // 手足のある体。多角形の体に、折れ曲がった腕と脚が付く
  function limbRule() {
    const unit = v => {
      if (v === 9) return `<circle r="1"/>`;
      const pts = [];
      for (let i = 0; i < v + 3; i++) pts.push(pol(0, 0, 1, i / (v + 3) * TAU - TAU / 4));
      return `<polygon points="${P(pts)}"/>`;
    };
    const limb = (x, y, a, len, fa) => {
      const e = pol(x, y, len, deg(a)), h = pol(e[0], e[1], len * .5, deg(fa));
      return `<polyline points="${P([[x, y], e, h])}" fill="none" stroke="${K}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
    };
    return {
      id: 'chara_limb', name: '絵・キャラ × 手足のある体', order: '桁ごとに決まった体の部分',
      parts: [['shape', '体の形', { 1: 1 }], ['size', '体の大きさと傾き', { 2: 5, 3: 5, 4: 5 }], ['arms', '手の動き', { 5: 3, 6: 3 }], ['legs', '脚の開き', { 7: 5, 8: 5 }], ['len', '手足の長さ', { 9: 5 }], ['eyes', '目の配置', { 10: 5, 11: 5 }], ['color', '体の色', { 12: 6 }]],
      sum: '12桁それぞれが、体・腕・脚・目の形や向きを決める。',
      map: [[[1], '形', '体の形'], [[2, 3], '大きさ', '体の幅と高さ'], [[4], '向き', '体の傾き'], [[5, 6], '向き', '左右の腕の上げ方'], [[7, 8], '向き', '左右の脚の開き'], [[9], '大きさ', '手足の長さ'], [[10], '大きさ', '目の大きさ'], [[11], '位置', '目の間隔'], [[12], '色', '体の色相']],
      steps: [
        '1桁目で体の形を選ぶ。0〜8 は(数字＋3)個の角をもつ正多角形、9 は円。',
        '2桁目で体の幅、3桁目で体の高さを決め、4桁目で体を傾ける(数字−4.5)×5°。',
        '5・6桁目で左右の腕の上げ方を決める。0 がいちばん下、9 がいちばん上。腕の先は決まった角度で折り曲げる。',
        '7・8桁目で左右の脚の開きを決める。4.5 を真下として、数字が大きいほど外へ開く。足先は外向きに折り曲げる。',
        '9桁目で手足の長さ、10桁目で目の大きさ、11桁目で目の間隔を決める。',
        '12桁目×36°を色相として、体を塗る。手足は黒い線で、体の下に重ねる。',
      ],
      legend: [
        { pos: [1], t: '1桁目：体の形', cell: v => `<g transform="translate(15 15) scale(11)" fill="${K}">${unit(v)}</g>` },
        { pos: [5, 6], t: '5・6桁目：腕の上げ方(右腕の場合)', cell: v => circle(6, 15, 1.4, K) + line(6, 15, ...pol(6, 15, 18, deg(70 - v * 15.5)), 1.6) },
        { pos: [9], t: '9桁目：手足の長さ', cell: v => line(3, 15, 3 + (14 + v * 2.2) * .7, 15, 2.2) },
        { pos: [12], t: '12桁目：体の色相', cell: v => `<rect x="2" y="2" width="26" height="26" rx="3" fill="hsl(${v * 36} 55% 36%)"/>` },
      ],
      draw(d) {
        const cx = C, cy = 88, w = 26 + d[1] * 3, h = 26 + d[2] * 3, len = 14 + d[8] * 2.2;
        const la = -70 + d[4] * 15.5, ra = -70 + d[5] * 15.5, ll = (d[6] - 4.5) * 8, rl = (d[7] - 4.5) * 8;
        let o = T([5, 9], limb(cx - w * .5, cy + h * .1, 180 + la, len + w * .5, 110 + la));
        o += T([6, 9], limb(cx + w * .5, cy + h * .1, -ra, len + w * .5, 70 - ra));
        o += T([7, 9], limb(cx - w * .35, cy + h * .3, 90 + ll, len + h * .7, 180));
        o += T([8, 9], limb(cx + w * .35, cy + h * .3, 90 - rl, len + h * .7, 0));
        o += T([1, 2, 3, 4, 12], `<g transform="translate(${cx} ${cy}) rotate(${f((d[3] - 4.5) * 5)}) scale(${w} ${h})" fill="hsl(${d[11] * 36} 55% 36%)">${unit(d[0])}</g>`);
        const gap = 4 + d[10] * 1.1, er = 2 + d[9] * .45;
        return o + T([10, 11], circle(cx - gap, cy + h * .05, er, '#fff') + circle(cx + gap, cy + h * .05, er, '#fff'));
      },
    };
  }
  const CHARA = { bot: 'まるい体と小物', limb: '手足のある体' };
  // 数字で変える部分を選ぶ。選ばなかった部分は、決まった値に固定する
  function charaRule(L, st) {
    const r = st.chara === 'limb' ? limbRule() : botRule(), off = st.off[st.chara];
    const fixed = {}, names = [];
    r.parts.forEach(([key, name, def]) => { if (off.includes(key)) { Object.assign(fixed, def); names.push(name); } });
    if (!names.length) return r;
    const on = pos => pos.every(n => !(n in fixed)), base = r.draw;
    return Object.assign(r, {
      id: r.id + '_' + off.slice().sort().join('-'),
      map: r.map.filter(m => on(m[0])), legend: r.legend.filter(row => on(row.pos)),
      steps: [...r.steps, `次の部分は数字によらず、決まった形に固定する：${names.join('、')}。`],
      draw: (d, id) => base(d.map((v, i) => (i + 1) in fixed ? fixed[i + 1] : v), id),
    });
  }

  function build(st) {
    const L = LAYOUTS.find(l => l.id === st.layout);
    const fn = L.id === 'yoko' && st.axis === 'value' ? yokoValueRule : L.id === 'grid' && st.axis !== 'order' ? gridCoordRule : L.id === 'center' && st.axis === 'value' ? centerValueRule : L.kind === 'anchor' && st.axis !== 'order' ? anchorCoordRule : { slot: slotRule, points: pointsRule, anchor: anchorRule, chara: charaRule }[L.kind];
    const r = fn(L, st);
    return Object.assign(r, { cat: L.cat, sum: r.sum || L.sum, id: 'bunrui_' + r.id });
  }

  /* ── 分類のアイコン ── */
  function icon(id) {
    const s = 'stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"', dot = (x, y) => `<circle cx="${x}" cy="${y}" r="3" fill="currentColor"/>`;
    const body = {
      yoko: `<path d="M8 30H50M44 24l6 6-6 6" ${s}/>`,
      tateyoko: `<path d="M8 30H50M44 24l6 6-6 6M30 8V50M24 44l6 6 6-6" ${s}/>`,
      polar: `<circle cx="30" cy="34" r="18" ${s} stroke-dasharray="2 4" stroke-width="1.2"/><path d="M30 34V10M25 15l5-5 5 5" ${s}/>${dot(30, 34)}`,
      grid: `<path d="M10 18H50M10 30H50M10 42H50M18 10V50M30 10V50M42 10V50" ${s}/>`,
      corners: dot(14, 14) + dot(46, 14) + dot(46, 46) + dot(14, 46),
      tri: dot(30, 13) + dot(48, 46) + dot(12, 46),
      center: dot(30, 30),
      chara: `<path d="M22 28l-8-2 3 8M40 28l8-2-3 8M26 40l-2 10h-5M35 40l2 10h5" ${s}/><rect x="20" y="14" width="20" height="26" fill="currentColor" transform="rotate(8 30 27)"/>`,
    }[id];
    return `<svg viewBox="0 0 60 60" aria-hidden="true">${body}</svg>`;
  }

  /* ── 画面 ── */
  const S = { A: '', B: '', title: '', sid: '', name: '' };
  const st = { layout: 'yoko', chara: 'bot', off: { bot: [], limb: [] }, axis: 'order', enc: 'size', link: 'line', alink: 'outline', ink: 0 };
  const AXIS = {
    yoko: [['order', '並び順 → よこ、数字 → 図形'], ['value', '数字 → よこ、並び順 → 大きさ']],
    tateyoko: [['order', '並び順 → よこ、数字 → たて'], ['value', '数字 → よこ、並び順 → たて'], ['pair', '2桁ずつ →(よこ, たて)']],
    grid: [['order', '並び順 → マス、数字 → 図形'], ['col', '数字 → 列、並び順 → 行'], ['row', '並び順 → 列、数字 → 行'], ['pair', '2桁ずつ →(列, 行)']],
    center: [['order', '並び順 → きょり、数字 → 輪'], ['value', '数字 → きょり、並び順 → 太さ']],
    corners: [['order', '3桁ずつ → 隅の図形'], ['coord', '3桁ずつ →(よこ, たて, 大きさ)']],
    tri: [['order', '4桁ずつ → 頂点の図形'], ['tern', '3桁ずつ → 3頂点への比率']],
    polar: [['order', '並び順 → むき、数字 → きょり'], ['value', '数字 → むき、並び順 → きょり'], ['pair', '2桁ずつ →(むき, きょり)']],
  };
  const picker = document.querySelector('#picker'), app = document.querySelector('#app');
  let rule = null;

  const seg = (key, label, items) => `<fieldset><legend>${label}</legend><div class="seg">${items.map(([v, t]) => `<button type="button" data-set="${key}" data-val="${v}" aria-pressed="${String(st[key]) === String(v)}">${t}</button>`).join('')}</div></fieldset>`;
  function render() {
    const L = LAYOUTS.find(l => l.id === st.layout);
    let opts = '';
    if (AXIS[L.id]) {
      if (!AXIS[L.id].some(([v]) => v === st.axis)) st.axis = 'order';
      opts += seg('axis', '軸への割り当て', AXIS[L.id]);
    }
    if (L.kind === 'slot' && st.axis === 'order') opts += seg('enc', '数字の表し方', Object.entries(ENC).map(([k, e]) => [k, e.n]));
    if (L.kind === 'points') opts += seg('link', '点のつなぎ方', Object.entries(LINK));
    if (L.kind === 'anchor') opts += seg('alink', '位置どうしの線', Object.entries(ALINK));
    if (L.kind === 'chara') {
      const off = st.off[st.chara], parts = (st.chara === 'limb' ? limbRule() : botRule()).parts;
      opts += seg('chara', 'キャラクターの型', Object.entries(CHARA));
      opts += `<fieldset><legend>数字で変える部分(選ばない部分は固定)</legend><div class="seg">${parts.map(([k, n]) => `<button type="button" data-part="${k}" aria-pressed="${!off.includes(k)}">${n}</button>`).join('')}</div></fieldset>`;
      if (off.length) opts += `<p class="note" style="flex-basis:100%;margin:0">固定した部分があるため、12桁のうち ${parts.filter(([k]) => off.includes(k)).reduce((a, p) => a + Object.keys(p[2]).length, 0)} 桁は形に反映されません。課題の「12桁すべてを使う」という条件を満たすには、すべての部分を選んでください。</p>`;
    }
    if (L.kind !== 'chara') opts += seg('ink', '色', INKS.map((k, i) => [i, `<span class="sw" style="background:${k.c}"></span>${k.n}`]));
    picker.innerHTML = `<h2 class="picker-h">分類(数字の配置のしかた)</h2>
      <div class="tiles">${LAYOUTS.map(l => `<button type="button" data-set="layout" data-val="${l.id}" aria-pressed="${l.id === st.layout}">${icon(l.id)}${l.cat}<small>${l.coord || '&nbsp;'}</small></button>`).join('')}</div>
      <div class="opts">${opts}</div>`;
    rule = build(st);
    app.innerHTML = view.detailHTML(rule, S, false);
  }

  picker.addEventListener('click', e => {
    const pb = e.target.closest('button[data-part]');
    if (pb) {
      const off = st.off[st.chara], k = pb.dataset.part, total = picker.querySelectorAll('button[data-part]').length;
      if (off.includes(k)) off.splice(off.indexOf(k), 1);
      else if (off.length < total - 1) off.push(k);   // 最後の1つは外せない
      S.title = '';
      render();
      const again = picker.querySelector(`button[data-part="${k}"]`);
      if (again) again.focus();
      return;
    }
    const b = e.target.closest('button[data-set]');
    if (!b) return;
    st[b.dataset.set] = b.dataset.set === 'ink' ? +b.dataset.val : b.dataset.val;
    S.title = '';
    render();
    const again = picker.querySelector(`button[data-set="${b.dataset.set}"][data-val="${b.dataset.val}"]`);
    if (again) again.focus();
  });
  view.bind(app, () => rule, S);
  view.initNums(S, render);
})();
