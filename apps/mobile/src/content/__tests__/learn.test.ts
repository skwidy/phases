import i18n from '../../i18n';
import learnEn from '../learn.en.json';
import learnFr from '../learn.fr.json';
import { lessonRowStatus, parseLessons, seriesProgress } from '../learn';

test('both languages parse the same lessons, and only lesson 5 has steps', () => {
  const fr = parseLessons(learnFr.series.lessons);
  const en = parseLessons(learnEn.series.lessons);

  expect(fr.map((lesson) => lesson.id)).toEqual([
    'amour-ne-suffit-pas',
    'deux-horloges',
    'langage-malentendu',
    'entretien',
    'cinq-temps',
    'chacun-sa-part',
  ]);
  expect(en.map((lesson) => lesson.id)).toEqual(fr.map((lesson) => lesson.id));
  expect(fr.find((lesson) => lesson.id === 'cinq-temps')?.steps).toHaveLength(5);
  expect(en.find((lesson) => lesson.id === 'cinq-temps')?.steps).toHaveLength(5);
  expect(fr.find((lesson) => lesson.id === 'langage-malentendu')?.steps).toBeUndefined();
  expect(fr.find((lesson) => lesson.id === 'cinq-temps')?.with_phases.link).toBeNull();
  expect(en.find((lesson) => lesson.id === 'cinq-temps')?.with_phases.link).toBeNull();
  expect(fr.find((lesson) => lesson.id === 'entretien')?.with_phases.link?.route).toBe('/(tabs)');
});

test('the learn namespace resolves both languages', async () => {
  await i18n.changeLanguage('fr');
  const fr = parseLessons(i18n.t('series.lessons', { ns: 'learn', returnObjects: true }));
  expect(fr).toHaveLength(6);
  expect(i18n.t('ui.start', { ns: 'learn' })).toBe('Commencer');

  await i18n.changeLanguage('en');
  const en = parseLessons(i18n.t('series.lessons', { ns: 'learn', returnObjects: true }));
  expect(en.map((lesson) => lesson.id)).toEqual(fr.map((lesson) => lesson.id));
  expect(en[0]?.title).not.toBe(fr[0]?.title);
  expect(i18n.t('ui.start', { ns: 'learn' })).toBe('Start');
  expect(i18n.t('nav.learn')).toBe('Learn');

  await i18n.changeLanguage('fr');
  expect(i18n.t('nav.learn')).toBe('Apprendre');
});

test('continue points at the first unread lesson', () => {
  const lessons = [
    { id: 'a', number: 1 },
    { id: 'b', number: 2 },
    { id: 'c', number: 3 },
  ];

  expect(seriesProgress(lessons, []).pending?.id).toBe('a');
  expect(seriesProgress(lessons, ['a', 'b'])).toMatchObject({ done: 2, total: 3, pending: { id: 'c' } });
  expect(seriesProgress(lessons, ['a', 'b', 'c']).pending).toBeNull();
  expect(lessonRowStatus('a', lessons, [])).toBe('unread');
  expect(lessonRowStatus('b', lessons, ['a'])).toBe('current');
  expect(lessonRowStatus('a', lessons, ['a'])).toBe('read');
  expect(lessonRowStatus('c', lessons, ['a'])).toBe('unread');
});
