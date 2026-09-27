import learnEn from '../../content/learn.en.json';
import learnFr from '../../content/learn.fr.json';
import contentEn from '../../content/phases.en.json';
import contentFr from '../../content/phases.fr.json';
import en from '../en.json';
import fr from '../fr.json';

function keyTree(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === 'string')) return [`${prefix}[]`];
    return value.flatMap((item, index) => keyTree(item, `${prefix}[${index}]`));
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .flatMap((key) => keyTree((value as Record<string, unknown>)[key], prefix ? `${prefix}.${key}` : key));
  }
  return [prefix];
}

function keyDiff(left: unknown, right: unknown) {
  const leftKeys = keyTree(left).sort();
  const rightKeys = keyTree(right).sort();
  return {
    missingOnRight: leftKeys.filter((key) => !rightKeys.includes(key)),
    missingOnLeft: rightKeys.filter((key) => !leftKeys.includes(key)),
  };
}

test('fr and en share the same key tree', () => {
  expect(keyDiff(fr, en)).toEqual({ missingOnRight: [], missingOnLeft: [] });
  expect(keyDiff(contentFr, contentEn)).toEqual({ missingOnRight: [], missingOnLeft: [] });
  expect(keyDiff(learnFr, learnEn)).toEqual({ missingOnRight: [], missingOnLeft: [] });
});
