/* Mobile sticky CTA: visible once the hero buttons scroll out, hidden near the download section. */
(function () {
  var bar = document.querySelector('.m-cta');
  var hero = document.querySelector('.hero-v2 .btn-row');
  var end = document.querySelector('.cta');
  if (!bar || !hero || !('IntersectionObserver' in window)) return;
  var heroOut = false, endIn = false;
  function update() { bar.hidden = !(heroOut && !endIn); }
  new IntersectionObserver(function (e) { heroOut = !e[0].isIntersecting && e[0].boundingClientRect.top < 0; update(); }).observe(hero);
  new IntersectionObserver(function (e) { endIn = e[0].isIntersecting; update(); }, { rootMargin: '0px 0px -10% 0px' }).observe(end);
})();
