function matchSetupPath(setupPath, map, trackMapJson, seriesMapJson) {
  let success = true;
  const validationErrors = [];
  const regex = new RegExp(map.pattern);
  const match = setupPath.match(regex);
  if (!match || match.length < 6) {

    console.log(`No pattern match for entry: ${setupPath}`);
    console.log(`match: ${match}`);
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
  const isWet = match.groups.isWet ? true : false;
  const week = match.groups.week ? match.groups.week : false;

  const normalizedTrack = normalizeValue(parsedTrack);
  const normalizedSeries = normalizeValue(parsedSeries, false);
  const trackMap = generateMap(trackMapJson);
  const seriesMap = generateMap(seriesMapJson);
  const track = findMatchForNormalizedValue(normalizedTrack, trackMap);
  const series = findMatchForNormalizedValue(normalizedSeries, seriesMap);
  if (track === false) {
    console.log(`Track not found in map: ${parsedTrack} -> ${normalizedTrack}`);
    success = false;
    validationErrors.push(`Track not found in map: ${normalizedTrack}`);
  }
  if (series === false) {
    console.log(`Series not found in map: ${parsedSeries} -> ${normalizedSeries}`);
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
      isWet,
      week,
    },
  };
}

/**
 * Normalizes the value by trimming, converting to lowercase, and replacing certain characters.
 *
 * @param {string} value - The value to normalize.
 * @return {string|null} - The normalized value or null if the input is undefined or null.
 */
function normalizeValue(value, replaceNumbers = true) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') {
    let normalizedValue = value
      .trim()
      .toLowerCase()
      .replace(/-/g, ' ')
      .replace(/_/g, ' ');
    if (replaceNumbers) {
        normalizedValue = normalizedValue.replace(/[0-9]+/g, ' ')
    }
    normalizedValue = normalizedValue.replace(/\s+/g, ' ')
      .replace(/^\s|\s$/g, '');

    return normalizedValue
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
};