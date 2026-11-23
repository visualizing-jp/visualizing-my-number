'use strict';
/* 2つのページで共有する部品：数字列の入力、ルールの詳細表示、書き出し、対応図からの強調 */
(function () {
  const { logoSVG, legendBlock, mappingBlock, sheetSVG, clean, esc, group } = MN;
  const DEF = ['083668131698', '640367057080'];
  const SAMPLES = ['314159265358', '271828182845', '141421356237', '907214365580', '502871369451', '119922883344'];
  const $ = s => document.querySelector(s);

  /* ── 書き出し ── */
  function save(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  const saveSVG = (svg, name) => save(new Blob([svg], { type: 'image/svg+xml' }), name);
  function savePNG(svg, w, h, name) {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const x = c.getContext('2d');
      x.fillStyle = '#fff';
      x.fillRect(0, 0, w, h);
      x.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      c.toBlob(b => save(b, name), 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); $('#warn').textContent = 'PNG の書き出しに失敗しました。SVG で書き出してください。'; };
    img.src = url;
  }

  /* ── 数字列の入力。S.A・S.B を更新し、12桁そろったら onChange を呼ぶ ── */
  function initNums(S, onChange) {
    const inA = $('#numA'), inB = $('#numB'), warn = $('#warn');
    function read() {
      const vals = [inA, inB].map(el => {
        const v = el.value.replace(/\D/g, '').slice(0, 12);
        if (v !== el.value) el.value = v;
        el.classList.toggle('bad', v.length !== 12);
        return v;
      });
      if (vals.every(v => v.length === 12)) { warn.textContent = ''; S.A = vals[0]; S.B = vals[1]; onChange(); }
      else warn.textContent = '数字列は12桁で入力してください。';
    }
    const set = (a, b) => { inA.value = a; inB.value = b; read(); };
    const rand = () => Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
    inA.addEventListener('input', read);
    inB.addEventListener('input', read);
    $('#btnRandom').addEventListener('click', () => set(rand(), rand()));
    $('#btnReset').addEventListener('click', () => set(DEF[0], DEF[1]));
    set(DEF[0], DEF[1]);
  }

  /* ── ルールの詳細 ── */
  const sheetOf = (r, S) => sheetSVG({ rule: r, A: S.A, B: S.B, title: S.title, sid: S.sid, name: S.name });
  function detailHTML(r, S, withBack) {
    const lg = legendBlock(r, 150), mp = mappingBlock(r, S.A, S.B, 6);
    const logo = (dg, key) => `<div class="logo">${logoSVG(r, dg)}<p class="digits">${group(dg)}</p>
      <div class="acts"><button type="button" data-dl="svg" data-key="${key}">SVG</button><button type="button" data-dl="png" data-key="${key}">PNG</button></div></div>`;
    return `
      ${withBack ? '<button type="button" class="back" data-back>← 一覧へ戻る</button>' : ''}
      <div class="detail-head"><span class="cat">${r.cat}</span><h2>${r.name}</h2><p>${r.sum}</p></div>
      <div class="cols">
        <div class="left">
          <section class="panel"><h3>ロゴ</h3><div class="logos">${logo(S.A, 'A')}${logo(S.B, 'B')}</div></section>
          <section class="panel"><h3>縮小見本(一辺 30mm)</h3><div class="thumbs"><div class="t">${logoSVG(r, S.A)}</div><div class="t">${logoSVG(r, S.B)}</div><p>画面上の実寸は環境によって前後します。</p></div></section>
          <section class="panel"><h3>ほかの数字列での例</h3><div class="vars">${SAMPLES.map(n => `<figure>${logoSVG(r, n)}<figcaption>${n}</figcaption></figure>`).join('')}</div></section>
        </div>
        <div class="right">
          <section class="panel legend"><h3>数字と表現の対応</h3><p class="note">桁や項目にカーソルを合わせると、ロゴの該当する部分だけが残ります。</p><svg id="mapSvg" viewBox="-1 0 152 ${mp.h}" role="img" aria-label="${r.map.map(([p, v, l]) => p.join('・') + '桁目は' + v + '：' + l).join('、')}">${mp.inner}</svg></section>
          <section class="panel legend"><h3>凡例</h3><svg viewBox="-1 0 152 ${lg.h}" role="img" aria-label="数字と造形の対応">${lg.inner}</svg></section>
          <section class="panel"><h3>手順</h3><ol class="steps">${r.steps.map(t => `<li>${t}</li>`).join('')}</ol></section>
        </div>
      </div>
      <section class="panel">
        <h3>A3 シート</h3>
        <div class="sheet-form">
          <label>タイトル<input id="fTitle" value="${esc(S.title)}" placeholder="${r.name}"></label>
          <label>学生番号<input id="fSid" value="${esc(S.sid)}" placeholder="12345678"></label>
          <label>氏名<input id="fName" value="${esc(S.name)}" placeholder="氏名"></label>
          <button type="button" data-sheet="svg">SVG</button>
          <button type="button" data-sheet="png">PNG</button>
          <button type="button" class="primary" data-sheet="print">印刷</button>
        </div>
        <div class="sheet-box" id="sheetBox">${sheetOf(r, S)}</div>
      </section>`;
  }

  /* ── 詳細表示の中の操作。getRule() は表示中のルール(なければ null) ── */
  function bind(root, getRule, S) {
    root.addEventListener('click', e => {
      const b = e.target.closest('button'), r = getRule();
      if (!b || !r) return;
      if (b.dataset.dl) {
        const dg = S[b.dataset.key], svg = clean(logoSVG(r, dg, 2000)), name = `${r.id}_${dg}`;
        b.dataset.dl === 'svg' ? saveSVG(svg, name + '.svg') : savePNG(svg, 2000, 2000, name + '.png');
      } else if (b.dataset.sheet) {
        const svg = sheetOf(r, S), name = `${r.id}_A3`;
        if (b.dataset.sheet === 'svg') saveSVG(svg, name + '.svg');
        else if (b.dataset.sheet === 'png') savePNG(svg, 4961, 3508, name + '.png');
        else { $('#printArea').innerHTML = svg; window.print(); }
      }
    });
    root.addEventListener('input', e => {
      const k = { fTitle: 'title', fSid: 'sid', fName: 'name' }[e.target.id], r = getRule();
      if (!k || !r) return;
      S[k] = e.target.value;
      $('#sheetBox').innerHTML = sheetOf(r, S);
    });

    // 対応図 → ロゴの強調
    function highlight(pos) {
      const box = root.querySelector('.logos');
      if (!box) return;
      box.classList.toggle('hl', !!pos);
      box.querySelectorAll('[data-d]').forEach(el => {
        el.classList.toggle('on', !!pos && el.dataset.d.split(' ').some(n => pos.includes(n)));
      });
    }
    const posOf = e => { const t = e.target.closest && e.target.closest('.hit'); return t ? t.dataset.pos.split(' ') : null; };
    root.addEventListener('pointerover', e => { const p = posOf(e); if (p) highlight(p); });
    root.addEventListener('pointerout', e => { if (posOf(e)) highlight(null); });
    root.addEventListener('focusin', e => { const p = posOf(e); if (p) highlight(p); });
    root.addEventListener('focusout', e => { if (posOf(e)) highlight(null); });
  }

  MN.view = { initNums, detailHTML, bind };
})();
