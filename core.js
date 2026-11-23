'use strict';
/* 共通の描画ヘルパーと、ロゴ・凡例・A3シートの組み立て */
const MN = {};
(function () {
  const TAU = Math.PI * 2;
  const f = n => +n.toFixed(2);
  const pol = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const P = a => a.map(p => f(p[0]) + ',' + f(p[1])).join(' ');
  const deg = x => x * Math.PI / 180;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let uidN = 0;
  const uid = () => 'u' + (++uidN);

  // 扇形(ドーナツ状)のパス。角度はラジアン、a1 から a2 へ時計回り
  function sector(cx, cy, r1, r2, a1, a2) {
    const [x1, y1] = pol(cx, cy, r2, a1), [x2, y2] = pol(cx, cy, r2, a2);
    const [x3, y3] = pol(cx, cy, r1, a2), [x4, y4] = pol(cx, cy, r1, a1);
    const lg = (a2 - a1) > Math.PI ? 1 : 0;
    return `M${f(x1)} ${f(y1)}A${f(r2)} ${f(r2)} 0 ${lg} 1 ${f(x2)} ${f(y2)}L${f(x3)} ${f(y3)}A${f(r1)} ${f(r1)} 0 ${lg} 0 ${f(x4)} ${f(y4)}Z`;
  }
  function arc(cx, cy, r, a1, a2) {
    const [x1, y1] = pol(cx, cy, r, a1), [x2, y2] = pol(cx, cy, r, a2);
    const lg = (a2 - a1) > Math.PI ? 1 : 0;
    return `M${f(x1)} ${f(y1)}A${f(r)} ${f(r)} 0 ${lg} 1 ${f(x2)} ${f(y2)}`;
  }

  // 6桁を2桁ずつ R・G・B に(0〜99 → 40〜248)
  function pairRGB(d6) {
    return [0, 2, 4].map(i => Math.round(40 + (d6[i] * 10 + d6[i + 1]) * 2.1));
  }
  const rgbStr = d6 => `rgb(${pairRGB(d6).join(',')})`;
  function hueOf([r, g, b]) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), c = mx - mn;
    if (c === 0) return 0;
    let h = mx === r ? ((g - b) / c) % 6 : mx === g ? (b - r) / c + 2 : (r - g) / c + 4;
    return Math.round((h * 60 + 360) % 360);
  }

  const parse = s => String(s).split('').map(Number);
  const group = s => s.slice(0, 4) + ' ' + s.slice(4, 8) + ' ' + s.slice(8, 12);

  function logoInner(rule, digits) { return rule.draw(parse(digits), uid()); }
  function logoSVG(rule, digits, size) {
    const wh = size ? ` width="${size}" height="${size}"` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"${wh}>${logoInner(rule, digits)}</svg>`;
  }

  // 凡例。幅 W(mm相当)の中に、行ごとに 0〜9 のセルを並べる
  function legendBlock(rule, W) {
    W = W || 184;
    let y = 0, o = '';
    rule.legend.forEach(row => {
      const n = row.n || 10, cw = Math.min(15, W / n);
      o += `<text x="0" y="${f(y + 3.4)}" font-size="3.2" font-weight="700">${esc(row.t)}</text>`;
      y += 5.5;
      for (let k = 0; k < n; k++) {
        const x = k * cw;
        o += `<text x="${f(x + 6)}" y="${f(y + 2.8)}" font-size="2.8" text-anchor="middle" fill="#666">${k}</text>`;
        o += `<g transform="translate(${f(x)},${f(y + 4)}) scale(.4)">${row.cell(k, uid())}</g>`;
      }
      y += 18.5;
    });
    return { inner: o, h: y };
  }

  // 対応図。左に12桁(A・B)、右に視覚変数、あいだを線で結ぶ
  const VARS = { '形': '#1f4fd8', '色': '#c9382a', '大きさ': '#2f7d4f', '位置': '#7d46ad', '向き': '#8f5c00', '線': '#444', '模様': '#0b7d7d', '個数': '#a03b6b' };
  function mappingBlock(rule, A, B, rh) {
    rh = rh || 6;
    const H = 12 * rh, top = 4.5, m = rule.map.length, bh = Math.min(rh - 1, 5), fs = Math.min(3, bh * .68);
    let o = `<text x="11" y="3" font-size="2.6" text-anchor="middle" fill="#666">A</text><text x="20" y="3" font-size="2.6" text-anchor="middle" fill="#666">B</text>`;
    const cy = i => top + (i + .5) * rh, ey = j => top + (j + .5) * H / m;
    rule.map.forEach(([pos, v], j) => {
      pos.forEach(pn => {
        o += `<path d="M24.5 ${f(cy(pn - 1))}C46 ${f(cy(pn - 1))} 46 ${f(ey(j))} 68 ${f(ey(j))}" fill="none" stroke="${VARS[v]}" stroke-width=".55" stroke-opacity=".6"/>`;
      });
    });
    for (let i = 0; i < 12; i++) {
      const y = cy(i);
      o += `<text x="5" y="${f(y + fs * .36)}" font-size="2.4" text-anchor="end" fill="#666">${i + 1}</text>`;
      [[A, 7], [B, 16]].forEach(([dg, x]) => {
        o += `<rect x="${x}" y="${f(y - bh / 2)}" width="8" height="${f(bh)}" fill="#fff" stroke="#999" stroke-width=".25"/>`;
        o += `<text x="${x + 4}" y="${f(y + fs * .36)}" font-size="${f(fs)}" text-anchor="middle" font-weight="700">${dg[i]}</text>`;
      });
    }
    rule.map.forEach(([pos, v, label], j) => {
      const y = ey(j);
      o += `<rect x="68" y="${f(y - bh / 2)}" width="17" height="${f(bh)}" rx="1" fill="${VARS[v]}"/>`;
      o += `<text x="76.5" y="${f(y + fs * .36)}" font-size="${f(fs)}" text-anchor="middle" fill="#fff" font-weight="700">${v}</text>`;
      o += `<text x="88" y="${f(y + fs * .36)}" font-size="${f(fs)}">${esc(label)}</text>`;
      o += `<rect class="hit" data-pos="${pos.join(' ')}" tabindex="0" aria-label="${pos.join('・')}桁目：${esc(v)} ${esc(label)}" x="66" y="${f(y - rh / 2 + .2)}" width="84" height="${f(rh - .4)}" fill="transparent"/>`;
    });
    for (let i = 0; i < 12; i++) o += `<rect class="hit" data-pos="${i + 1}" tabindex="0" aria-label="${i + 1}桁目" x="0" y="${f(top + i * rh)}" width="25" height="${f(rh)}" fill="transparent"/>`;
    o += `<text x="0" y="${f(top + H + 4)}" font-size="2.8" fill="#444">並び順：${esc(rule.order)}</text>`;
    return { inner: o, h: top + H + 6 };
  }

  // 書き出し用に、画面操作のための要素と印を取り除く
  const clean = svg => svg.replace(/<(circle|rect) class="(hint|hit)"[^>]*\/>/g, '').replace(/ data-d="[^"]*"/g, '');

  function wrap(text, n) {
    const out = [];
    for (let i = 0; i < text.length; i += n) out.push(text.slice(i, i + n));
    return out;
  }

  // A3 横(420 × 297mm)のシート
  function sheetSVG(o) {
    const { rule, A, B } = o;
    const FONT = `'Hiragino Sans','Noto Sans JP','Yu Gothic',system-ui,sans-serif`;
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 297" width="420mm" height="297mm" font-family="${FONT}" fill="#111">`;
    s += `<rect width="420" height="297" fill="#fff"/>`;
    s += `<text x="14" y="25" font-size="11" font-weight="700">${esc(o.title || rule.name)}</text>`;
    s += `<text x="14" y="34" font-size="3.6" fill="#444">${esc(rule.sum)}</text>`;

    // ロゴ2点と数字列
    [[A, 14], [B, 116]].forEach(([dg, x]) => {
      s += `<svg x="${x}" y="42" width="92" height="92" viewBox="0 0 200 200">${logoInner(rule, dg)}</svg>`;
      s += `<text x="${x + 46}" y="143" font-size="5" text-anchor="middle" letter-spacing=".4">${group(dg)}</text>`;
    });
    // 縮小見本
    [[A, 14], [B, 52]].forEach(([dg, x]) => {
      s += `<rect x="${x}" y="152" width="30" height="30" fill="none" stroke="#bbb" stroke-width=".2"/>`;
      s += `<svg x="${x}" y="152" width="30" height="30" viewBox="0 0 200 200">${logoInner(rule, dg)}</svg>`;
    });
    s += `<text x="90" y="166" font-size="3.2" font-weight="700">縮小見本</text>`;
    s += `<text x="90" y="171.5" font-size="3" fill="#444">一辺 30mm の正方形</text>`;

    // 手順
    s += `<text x="14" y="198" font-size="3.6" font-weight="700">手順</text>`;
    let y = 205;
    rule.steps.forEach((t, i) => {
      wrap(t, 54).forEach((ln, j) => {
        if (j === 0) s += `<text x="14" y="${y}" font-size="3.3" font-weight="700">${i + 1}</text>`;
        s += `<text x="20" y="${y}" font-size="3.3">${esc(ln)}</text>`;
        y += 5.2;
      });
      y += 1;
    });

    // 数字と表現の対応
    const RX = 222;
    s += `<text x="${RX}" y="46" font-size="3.6" font-weight="700">数字と表現の対応</text>`;
    const mp = mappingBlock(rule, A, B, 4.2);
    s += `<g transform="translate(${RX},49)">${mp.inner}</g>`;
    // 凡例
    const ly = 49 + mp.h + 5;
    s += `<text x="${RX}" y="${f(ly)}" font-size="3.6" font-weight="700">凡例</text>`;
    s += `<g transform="translate(${RX},${f(ly + 3.5)})">${legendBlock(rule, 184).inner}</g>`;

    const sig = [o.sid, o.name].filter(Boolean).join(' ') || '学生番号 氏名';
    s += `<text x="406" y="285" font-size="4" text-anchor="end">${esc(sig)}</text>`;
    return clean(s + '</svg>');
  }

  Object.assign(MN, { TAU, f, pol, P, deg, esc, uid, sector, arc, pairRGB, rgbStr, hueOf, parse, group, logoSVG, legendBlock, mappingBlock, sheetSVG, clean, RULES: [] });
})();
