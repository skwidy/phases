// /s — sync relay. Reads the #fragment in the browser, shows the status, hands off to the app.
import { decode, status, APP_SCHEME } from './sync.js';

const en = !String(navigator.language || '').toLowerCase().startsWith('fr');

const T = {
  fr: {},
  en: {
    title: 'Cycle update',
    intro: 'Someone sent you where their cycle is at. This data is read in your browser: it is never sent to a server.',
    started: 'Cycle started',
    today: 'Today',
    pms: 'PMS likely from',
    next: 'Next period around',
    open: 'Open in Phases',
    get: "I don't have the app",
    note: 'Opening in Phases shows you the changes before applying them. Nothing is overwritten without your OK.',
    koTitle: 'Incomplete link',
    koText: "This link doesn't hold a readable update. Ask them to resend it from Phases.",
    discover: 'Discover Phases',
  },
};

const PHASE = {
  fr: { regles: 'Règles', folliculaire: 'Phase folliculaire', ovulation: 'Ovulation', luteale: 'Phase lutéale', spm: 'SPM', retard: 'Règles attendues' },
  en: { regles: 'Period', folliculaire: 'Follicular phase', ovulation: 'Ovulation', luteale: 'Luteal phase', spm: 'PMS', retard: 'Period expected' },
};

const lang = en ? 'en' : 'fr';
document.documentElement.lang = lang;
if (en) {
  document.title = 'Phases · Cycle update';
  document.querySelectorAll('[data-t]').forEach((el) => {
    const v = T.en[el.dataset.t];
    if (v) el.textContent = v;
  });
  document.querySelectorAll('[data-home]').forEach((a) => a.setAttribute('href', '/en'));
}

const fmt = new Intl.DateTimeFormat(en ? 'en-US' : 'fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const show = (iso) => fmt.format(new Date(iso + 'T00:00:00Z'));

const fragment = location.hash.slice(1);
const data = decode(fragment);

if (!data) {
  document.getElementById('ko').classList.remove('hidden');
} else {
  const s = status(data);
  const badge = document.getElementById('badge');
  badge.textContent = PHASE[lang][s.phase];
  badge.classList.add(s.phase);
  document.getElementById('start').textContent = show(s.start);
  document.getElementById('day').textContent = s.late > 0
    ? (en ? `${s.late} day${s.late > 1 ? 's' : ''} late` : `J+${s.late}`)
    : (en ? `Day ${s.day}` : `J${s.day}`);
  document.getElementById('pms').textContent = show(s.nextPms);
  document.getElementById('next').textContent = show(s.nextPeriod);
  // Custom scheme works with a free Apple ID build. With Universal Links configured,
  // iOS opens the app directly and this page is never shown.
  document.getElementById('open').setAttribute('href', `${APP_SCHEME}s#${fragment}`);
  document.getElementById('ok').classList.remove('hidden');
}
