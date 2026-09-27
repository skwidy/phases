import { dailyTips } from '../tips';

const tips = ['a', 'b', 'c', 'd', 'e', 'f'];

test('the same day always draws the same three tips, in their original order', () => {
  const first = dailyTips(tips, 20000);
  expect(first).toEqual(dailyTips(tips, 20000));
  expect(first).toHaveLength(3);
  expect(first.every((tip) => tips.includes(tip))).toBe(true);
  const positions = first.map((tip) => tips.indexOf(tip));
  expect(positions).toEqual([...positions].sort((left, right) => left - right));
});

test('a short list is returned as-is', () => {
  expect(dailyTips(['a', 'b'], 12)).toEqual(['a', 'b']);
});
