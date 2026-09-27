import { decode, encode, fragmentFromLink, shareUrl } from '../format';

const state = { cycles: ['2026-08-07', '2026-09-04'], cycleLength: 28, periodLength: 5 };
const webFixture = '1.eyJjIjpbIjIwMjYtMDgtMDciLCIyMDI2LTA5LTA0Il0sIkwiOjI4LCJQIjo1fQ';

test('encode matches the web fixture and round-trips', () => {
  const fragment = encode(state);
  expect(fragment).toBe(webFixture);
  expect(decode(fragment)).toEqual(state);
  expect(decode(`#${fragment}`)).toEqual(state);
  expect(shareUrl(state)).toBe(`https://tryphases.io/s#${webFixture}`);
});

test('decode rejects invalid payloads', () => {
  expect(decode('')).toBeNull();
  expect(decode(null)).toBeNull();
  expect(decode('2.abc')).toBeNull();
  expect(decode('1.!!!')).toBeNull();
  expect(decode(encode({ cycles: [], cycleLength: 28, periodLength: 5 }))).toBeNull();
  const many = Array.from({ length: 61 }, (_, index) => {
    const day = new Date(Date.UTC(2020, 0, 1 + index));
    return day.toISOString().slice(0, 10);
  });
  expect(decode(encode({ cycles: many, cycleLength: 28, periodLength: 5 }))).toBeNull();
});

test('decode falls back when the lengths are out of range and drops junk dates', () => {
  const fragment = encode({ cycles: ['nope', '2026-09-04', '2026-09-04'], cycleLength: 99, periodLength: 1 });
  expect(decode(fragment)).toEqual({ cycles: ['2026-09-04'], cycleLength: 28, periodLength: 5 });
});

test('fragmentFromLink keeps the hash of an app or site sync URL', () => {
  expect(fragmentFromLink(`phases://s#${webFixture}`)).toBe(webFixture);
  expect(fragmentFromLink(`https://tryphases.io/s#${webFixture}`)).toBe(webFixture);
  expect(fragmentFromLink(`https://tryphases.io/s/#${webFixture}`)).toBe(webFixture);
  expect(fragmentFromLink('https://tryphases.io/')).toBeNull();
  expect(fragmentFromLink('https://example.com/s#1.abc')).toBeNull();
  expect(fragmentFromLink('phases://today#1.abc')).toBeNull();
});
