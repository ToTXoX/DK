(() => {
  const $ = (id) => document.getElementById(id);
  const stage = $('stage'), cover = $('cover'), art = $('cover-art'), inside = $('inside'), pull = $('pull');

  /* ---- folding cover: split the artwork into four hinged strips ---- */
  let prev = null, first = null;
  for (let i = 0; i < 4; i++) {
    const seg = document.createElement('div');
    seg.className = 'seg s' + i;
    const front = document.createElement('div');
    front.className = 'face front';
    const clone = art.cloneNode(true);
    clone.removeAttribute('id');
    clone.style.left = (-100 * i) + '%';
    front.appendChild(clone);
    const back = document.createElement('div');
    back.className = 'face back';
    back.innerHTML = '<span>DK</span>';
    seg.append(front, back);
    if (prev) prev.appendChild(seg); else first = seg;
    prev = seg;
  }
  prev.appendChild(pull);          /* tab rides on the last strip */
  cover.replaceChildren(first);

  /* ---- projects ---- */
  const DATA = {
    zuzu: {
      no: 'No.01 / 03', name: '庭院日和', en: 'ZUZU · GARDEN DAYS',
      desc: '水跃鱼的庭院小游戏，消磨时光。',
      chips: ['3D', '小游戏'], url: 'https://zuzu.usdts.de', host: 'zuzu.usdts.de'
    },
    x: {
      no: 'No.02 / 03', name: '冒冒', en: 'PEEKALA · 𝕏 SIDEBAR',
      desc: '提供侧栏、点赞特效、快速跳转，帮你更高效地刷 X。',
      chips: ['书签工具', '开源'], url: 'https://x.usdts.de', host: 'x.usdts.de'
    },
    '2w': {
      no: 'No.03 / 03', name: '二呜兄弟', en: 'RACING · 赛道竞速',
      desc: '法天象地版四驱车。',
      chips: ['竞速', '小游戏'], url: 'https://2w.usdts.de', host: '2w.usdts.de'
    }
  };
  const picks = [...document.querySelectorAll('.pick')];
  const detail = $('detail'), idle = $('idle'), info = $('info'), back = $('back');
  let current = 'zuzu';

  /* phones: the info block lives inside the pad screen (list ⇄ detail); desktop: beside the pad */
  const small = matchMedia('(max-width: 820px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let fold = [];

  function resetFold() {
    fold.forEach((animation) => animation.cancel());
    fold = [];
    cover.classList.remove('folding');
  }
  small.addEventListener('change', resetFold);
  reducedMotion.addEventListener('change', resetFold);

  function moveCover(open) {
    if (!small.matches || reducedMotion.matches || !cover.animate) return;
    if (!fold.length) {
      const duration = 850;
      const edges = [1, 0, -1];
      const front = (edge) => Math.max(0, edge);
      const back = (edge) => Math.max(0, -edge);
      const layers = [
        ['.s1 > .front', (edge) => `translateX(100%) scaleX(${front(edge)})`],
        ['.s1 > .back', (edge) => `scaleX(${back(edge)})`],
        ['.s2 > .front', (edge) => `translateX(${100 * (1 + edge)}%)`],
        ['.s3 > .front', (edge) => `translateX(${100 * (2 + edge)}%) scaleX(${front(edge)})`],
        ['.s3 > .back', (edge) => `translateX(${100 * (1 + edge)}%) scaleX(${back(edge)})`],
        ['.pull', (edge) => `translateX(calc(${50 * (1 + edge)}cqw - ${100 * back(edge)}%)) scaleX(${Math.abs(edge)})`]
      ];
      const timing = { duration, easing: 'cubic-bezier(.65,.02,.25,1)', fill: 'both' };
      fold = layers.map(([selector, project]) =>
        cover.querySelector(selector).animate(edges.map((edge) => ({ transform: project(edge) })), timing));
      for (const [selector, closed, opened] of [['.pf', 1, 0], ['.pb', 0, 1]]) {
        fold.push(pull.querySelector(selector).animate([
          { opacity: closed, offset: 0, easing: 'steps(1, end)' },
          { opacity: opened, offset: .5 },
          { opacity: opened, offset: 1 }
        ], timing));
      }
      const first = fold[0];
      first.onfinish = () => {
        if (first.playState === 'finished' && fold[0] === first) resetFold();
      };
      fold.forEach((animation) => { animation.currentTime = open ? 0 : duration; });
    }
    cover.classList.add('folding');
    fold.forEach((animation) => {
      animation.updatePlaybackRate(open ? 1 : -1);
      animation.play();
    });
  }

  const place = () => {
    if (small.matches) inside.appendChild(detail);
    else { info.insertBefore(detail, info.querySelector('noscript')); inside.classList.remove('reading'); }
  };
  place();
  small.addEventListener('change', place);

  function show(key) {
    const d = DATA[key];
    if (!d) return;
    current = key;
    picks.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.key === key)));
    $('i-no').textContent = d.no;
    $('i-name').textContent = d.name;
    $('i-en').textContent = d.en;
    $('i-desc').textContent = d.desc;
    $('i-chips').replaceChildren(...d.chips.map((c) => Object.assign(document.createElement('li'), { textContent: c })));
    $('i-link').href = d.url;
    $('i-host').textContent = d.host + ' ↗';
    detail.classList.remove('in'); void detail.offsetWidth; detail.classList.add('in');
  }
  const setHash = (key) => history.replaceState(null, '', key ? '#' + key : location.pathname + location.search);

  /* open an item: desktop just updates the side; phones flip the screen to the detail page */
  function select(key) {
    show(key);
    setHash(key);
    if (small.matches) { inside.classList.add('reading'); back.focus({ preventScroll: true }); }
  }

  function setOpen(open) {
    moveCover(open);
    stage.classList.toggle('open', open);
    inside.inert = !open;
    pull.setAttribute('aria-label', open ? '合上' : '掀开');
    pull.setAttribute('aria-expanded', String(open));
    idle.hidden = open;
    detail.hidden = !open;
    inside.classList.remove('reading');
    if (open) { show(current); if (!small.matches) setHash(current); }
    else setHash(null);
  }

  cover.addEventListener('click', () => setOpen(!stage.classList.contains('open')));
  /* a shelf row opens from its price card or its plank; the product standing on it is just for show */
  picks.forEach((b) => b.closest('li').addEventListener('click', (e) => {
    if (!e.target.closest('.ico')) select(b.dataset.key);
  }));
  back.addEventListener('click', () => {
    inside.classList.remove('reading');
    setHash(null);
    picks.find((b) => b.dataset.key === current)?.focus({ preventScroll: true });
  });

  /* deep link: #zuzu, #x, #2w open the pad on that item */
  const fromHash = () => {
    const key = decodeURIComponent(location.hash.slice(1));
    if (!DATA[key]) return;
    current = key;
    if (!stage.classList.contains('open')) setOpen(true);
    select(key);
  };
  fromHash();
  window.addEventListener('hashchange', fromHash);
})();
