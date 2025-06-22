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

test('matchSetupPath for GnG', () => {
  const setupPath = 'bmwm4evogt4/Garage 61/Data packs/25S1 W02 SportsCar BMW Oschersleben/2025S1-W02-GnG-BMW-Oschersleben-Q.sto';
  const map = {
    pattern: /^(?<car>[A-Za-z0-9_-]+)\/Garage 61\/Data packs\/(?<seasonYear>[0-9]{2})S(?<seasonNo>[0-9]{1,2})\sW(?<week>[0-9]{2})\s(?<series>[\w-]+)\s[\w-]+\s(?<track>.*?)(?: (?<isWet>(WET|Wet)))?\/[A-Z0-9a-z-_]+\.sto$/,
  };
  const config = {
    mappings: {
      tracks: {
        'oschersleben': 'Oschersleben',
      },
      series: {
        'sportscar': 'SPORTSCAR',
      },
    },
  };
  const result = matchSetupPath(setupPath, map, config.mappings.tracks, config.mappings.series);

  expect(result.result).toBe(true);
  expect(result.matches.car).toBe('bmwm4evogt4');
  expect(result.matches.seasonYear).toBe('25');
  expect(result.matches.seasonNo).toBe('1');
  expect(result.matches.track).toBe('Oschersleben');
  expect(result.matches.series).toBe('SPORTSCAR');
});

test('matchSetupPath for GnG Watkins6H, which has no track part in the match, so we use a', () => {
  const setupPath = '25S3 W02 Watkins6H Acura';
  const map = {
    pattern: /(?<seasonYear>[0-9]{2})S(?<seasonNo>[0-9]{1,2})\sW(?<week>[0-9]{2})\s(?<series>(?<track>Watkins)6H)\s[\w-]+(?<ignorecars>(BMW)|(Porsche))*(?: (?<isWet>(WET|Wet)))?$/,
  };
  const config = {
    mappings: {
      tracks: {
        'watkins': 'Watkins-Glen',
      },
      series: {
        'watkins6h': 'Watkins-6h',
      },
    },
  };
  const result = matchSetupPath(setupPath, map, config.mappings.tracks, config.mappings.series);

  expect(result.result).toBe(true);
  expect(result.matches.car).toBe(undefined);
  expect(result.matches.seasonYear).toBe('25');
  expect(result.matches.seasonNo).toBe('3');
  expect(result.matches.week).toBe('02');
  expect(result.matches.series).toBe('Watkins-6h');
  expect(result.matches.track).toBe('Watkins-Glen');
});
