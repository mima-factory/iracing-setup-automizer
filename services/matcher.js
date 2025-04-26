const { config } = require('./config');

function matchSetupPath(setupPath, map) {
  let success = true;
  const validationErrors = [];
  const regex = new RegExp(map.pattern);
  const match = setupPath.match(regex);
  if (!match || match.length < 6) {
    console.error(`No pattern match for entry: ${setupPath}`);
    return {
      "result": false,
      "validationErrors": ["No pattern match for entry: " + setupPath],
      "matches": {},
    };
  }
  const parsedCar = match.groups.car;
  const parsedTrack = match.groups.track;
  const parsedSeries = match.groups.series;
  const parsedSeasonYear = match.groups.seasonYear;
  const parsedSeasonNo = match.groups.seasonNo;

  const trackMap = generateMap(config.mappings.tracks);
  const seriesMap = generateMap(config.mappings.series);
  const normalizedTrack = normalizeValue(parsedTrack);
  const normalizedSeries = normalizeValue(parsedSeries);
  console.log('mapping parsed track to map', normalizedTrack, trackMap);
  console.log('mapping parsed series to map', normalizedSeries, seriesMap);
  const track = findMatchForNormalizedValue(normalizedTrack, trackMap);
  const series = findMatchForNormalizedValue(normalizedSeries, seriesMap);
  if (track === false) {
    console.error(`Track not found in map: ${parsedTrack} -> ${normalizedTrack}`);
    success = false;
    validationErrors.push(`Track not found in map: ${normalizedTrack}`);
  }
  if (series === false) {
    console.error(`Series not found in map: ${parsedSeries} -> ${normalizedSeries}`);
    success = false;
    validationErrors.push(`Series not found in map: ${normalizedSeries}`);
  }

  return {
    "result": success,
    "validationErrors": validationErrors,
    "matches": {
      "car": parsedCar,
      track,
      series,
      "seasonYear": parsedSeasonYear,
      "seasonNo": parsedSeasonNo,
    },
  };
}

/**
 * Normalizes the value by trimming, converting to lowercase, and replacing certain characters.
 *
 * @param {string} value - The value to normalize.
 * @return {string|null} - The normalized value or null if the input is undefined or null.
 */
function normalizeValue(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') {
    return value
      .trim()
      .toLowerCase()
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .replace(/[0-9]+/g, ' ')
      .replace(/\s+/g, ' ');
  }
  return value;
}

function generateMap(jsonObject) {
  const map = new Map();
  for (const key in jsonObject) {
    map.set(key, jsonObject[key]);
  }
  return map;
}

function findMatchForNormalizedValue(normalizedValue, map) {
  if (map.has(normalizedValue)) {
    return map.get(normalizedValue);
  }
  return false;
}

module.exports = {
  matchSetupPath,
  normalizeValue,
};