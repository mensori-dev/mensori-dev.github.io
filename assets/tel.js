/* ---------- номер телефона: на десктопе клик копирует номер ---------- */
/* На телефоне ссылка tel: работает как обычно, скрипт её не трогает. */
(() => {
  if (matchMedia('(pointer:coarse)').matches) return;
  if (!navigator.clipboard || !navigator.clipboard.writeText) return;
  const links = [...document.querySelectorAll('a[href^="tel:"]')];
  if (!links.length) return;

  let toast = null, timer = 0;
  const say = (text) => {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'copy-toast';
      (document.body || document.documentElement).appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add('on');
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('on'), 2400);
  };

  const pretty = (raw) => raw.replace(/^\+?7(\d{3})(\d{3})(\d{2})(\d{2})$/, '+7 $1 $2-$3-$4');

  links.forEach((a) => {
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      const raw = a.getAttribute('href').slice(4);
      navigator.clipboard.writeText(raw).then(
        () => say(pretty(raw) + ' — скопировано'),
        () => { location.href = a.getAttribute('href'); }
      );
    });
  });
})();
