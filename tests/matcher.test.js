const { normalizeValue } = require('../services/matcher');

test('normalizeValue replaces underscores', () => {
  expect(normalizeValue('road_atlanta_full')).toBe('road atlanta full');
});
