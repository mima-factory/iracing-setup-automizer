const { normalizeValue } = require('../services/matcher');

test('normalizeValue replaces underscores', () => {
  expect(normalizeValue('11road_22atlanta_full11')).toBe('road atlanta full');
});

test('normalizeValue number replacements can be turned off', () => {
  expect(normalizeValue('GT4', false)).toBe('gt4');
});
