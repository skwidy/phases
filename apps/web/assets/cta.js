/* Header: sticky state + compact theme switch on small screens. No network, no storage. */
(function () {
  var top = document.querySelector('.top');
  if (top) {
    var onScroll = function () { top.classList.toggle('is-stuck', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  // On phones only the active theme button is shown: tapping it moves to the next theme.
  var group = document.querySelector('.theme');
  var small = window.matchMedia('(max-width: 720px)');
  if (group) {
    group.addEventListener('click', function (e) {
      if (!small.matches) return;
      var btn = e.target.closest('[data-theme-choice]');
      if (!btn || btn.getAttribute('aria-pressed') !== 'true') return;
      e.stopPropagation();
      var all = group.querySelectorAll('[data-theme-choice]');
      for (var i = 0; i < all.length; i++) {
        if (all[i] === btn) { all[(i + 1) % all.length].click(); break; }
      }
    }, true);
  }
})();
