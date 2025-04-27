const { matchSetupPath } = require('../services/matcher');

test('matchSetupPath matches simple case', () => {
  const setupPath = 'c8rvettegte/2025 - S2/Road Atlanta - Corvette GTE/P1Doks_CorvetteGTE_RoadAtl_R_25S2W5.sto';
  const map = {
    pattern: /^(?<car>[^\/]+)\/20(?<seasonYear>[0-9]{2}) - S(?<seasonNo>[0-9]+)\/(?<track>[^\/]+) - .* (?<series>[A-Z0-9a-z]+)\/.*P1Doks\_[A-Z0-9a-z]+_[^\/]+\.sto$/,
  };
  const config = {
    mappings: {
      tracks: {
        'road atlanta': 'Road Atlanta',
      },
      series: {
        'gte': 'GTE',
      },
    },
  };
  const result = matchSetupPath(setupPath, map, config.mappings.tracks, config.mappings.series);

  expect(result.result).toBe(true);
  expect(result.matches.car).toBe('c8rvettegte');
  expect(result.matches.seasonYear).toBe('25');
  expect(result.matches.seasonNo).toBe('2');
  expect(result.matches.track).toBe('Road Atlanta');
  expect(result.matches.series).toBe('GTE');
  expect(result.validationErrors.length).toBe(0);
});

test('matchSetupPath add error on non matching track', () => {
  const setupPath = 'c8rvettegte/2025 - S2/Road Atlanta - Corvette GTE/P1Doks_CorvetteGTE_RoadAtl_R_25S2W5.sto';
  const map = {
    pattern: /^(?<car>[^\/]+)\/20(?<seasonYear>[0-9]{2}) - S(?<seasonNo>[0-9]+)\/(?<track>[^\/]+) - .* (?<series>[A-Z0-9a-z]+)\/.*P1Doks\_[A-Z0-9a-z]+_[^\/]+\.sto$/,
  };
  const config = {
    mappings: {
      tracks: {
        'road at': 'Road Atlanta',
      },
      series: {
        'gte': 'GTE',
      },
    },
  };
  const result = matchSetupPath(setupPath, map, config.mappings.tracks, config.mappings.series);

  expect(result.result).toBe(false);
  expect(result.matches.car).toBe('c8rvettegte');
  expect(result.matches.seasonYear).toBe('25');
  expect(result.matches.seasonNo).toBe('2');
  expect(result.matches.track).toBe(false);
  expect(result.matches.series).toBe('GTE');
  expect(result.validationErrors.length).toBe(1);
});

test('matchSetupPath add error on non matching series', () => {
  const setupPath = 'c8rvettegte/2025 - S2/Road Atlanta - Corvette GTE/P1Doks_CorvetteGTE_RoadAtl_R_25S2W5.sto';
  const map = {
    pattern: /^(?<car>[^\/]+)\/20(?<seasonYear>[0-9]{2}) - S(?<seasonNo>[0-9]+)\/(?<track>[^\/]+) - .* (?<series>[A-Z0-9a-z]+)\/.*P1Doks\_[A-Z0-9a-z]+_[^\/]+\.sto$/,
  };
  const config = {
    mappings: {
      tracks: {
        'road atlanta': 'Road Atlanta',
      },
      series: {
        'gt': 'GTE',
      },
    },
  };
  const result = matchSetupPath(setupPath, map, config.mappings.tracks, config.mappings.series);

  expect(result.result).toBe(false);
  expect(result.matches.car).toBe('c8rvettegte');
  expect(result.matches.seasonYear).toBe('25');
  expect(result.matches.seasonNo).toBe('2');
  expect(result.matches.track).toBe('Road Atlanta');
  expect(result.matches.series).toBe(false);
  expect(result.validationErrors.length).toBe(1);
});
