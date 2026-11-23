'use strict';
/* 作品から：学生作品をもとにしたルールの一覧と詳細 */
(function () {
  const { RULES, logoSVG, view } = MN;
  const CATS = ['すべて', 'よこ', 'たて・よこ', 'むき・きょり', '方眼紙', '四隅', '三角', '中心点', '絵・キャラ'];
  const S = { A: '', B: '', cat: 'すべて', rule: null, title: '', sid: '', name: '' };
  const app = document.querySelector('#app');
  const current = () => RULES.find(x => x.id === S.rule) || null;

  function galleryHTML() {
    const list = RULES.filter(r => S.cat === 'すべて' || r.cat === S.cat);
    return `<div class="chips" role="group" aria-label="分類で絞り込む">${CATS.map(c => `<button type="button" data-cat="${c}" aria-pressed="${c === S.cat}">${c}</button>`).join('')}</div>`
      + (list.length
        ? `<div class="grid">${list.map(r => `<button type="button" class="card" data-rule="${r.id}">
            <div class="pair">${logoSVG(r, S.A)}${logoSVG(r, S.B)}</div>
            <h2>${r.name}</h2><span class="cat">${r.cat}</span><p>${r.sum}</p></button>`).join('')}</div>`
        : `<p class="empty">この分類のルールはまだありません。</p>`);
  }
  function render() { const r = current(); app.innerHTML = r ? view.detailHTML(r, S, true) : galleryHTML(); }

  app.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.cat) { S.cat = b.dataset.cat; render(); }
    else if (b.dataset.rule) { S.rule = b.dataset.rule; S.title = ''; render(); window.scrollTo(0, 0); }
    else if ('back' in b.dataset) { S.rule = null; render(); }
  });
  view.bind(app, current, S);
  view.initNums(S, render);
})();
