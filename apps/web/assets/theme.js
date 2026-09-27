/* Theme for the static site. Light unless the visitor picks dark or system. */
(function () {
  var key = 'phases-theme';
  var theme = 'light';
  try {
    var saved = localStorage.getItem(key);
    if (saved === 'dark' || saved === 'light' || saved === 'system') theme = saved;
  } catch (e) {}

  var root = document.documentElement;
  root.setAttribute('data-theme', theme);

  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function resolved() {
    if (theme === 'system') return darkQuery.matches ? 'dark' : 'light';
    return theme;
  }

  function syncChrome() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolved() === 'dark' ? '#17110E' : '#FBF3EA');
    var buttons = document.querySelectorAll('[data-theme-choice]');
    for (var i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute('data-theme-choice') === theme;
      buttons[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function choose(next) {
    if (next !== 'light' && next !== 'dark' && next !== 'system') return;
    theme = next;
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem(key, theme); } catch (e) {}
    syncChrome();
  }

  function bind() {
    var buttons = document.querySelectorAll('[data-theme-choice]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function () {
        choose(this.getAttribute('data-theme-choice'));
      });
    }
    syncChrome();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();

  var onScheme = function () { if (theme === 'system') syncChrome(); };
  if (darkQuery.addEventListener) darkQuery.addEventListener('change', onScheme);
  else if (darkQuery.addListener) darkQuery.addListener(onScheme);
})();
