fse = require('fs-extra');
const { matchSetupPath } = require('./matcher');
const path = require('path');
const config = require('../config.json');

function loadDataPacksForSeries(series, setupsFolder) {
  const carFolders = fse.readdirSync(setupsFolder);
  const datapacks = {};
  for (const carFolder of carFolders) {
    let carDatapacksFolder = path.join(setupsFolder, carFolder, 'Garage 61', 'Data Packs');
    console.log(carDatapacksFolder);
    if (!fse.existsSync(carDatapacksFolder)) continue;
    let car = parseCarName(carFolder);
    datapacks[car] = {
      car: car,
      dataPacks: [],
    };

    let dataPackFolders = fse.readdirSync(carDatapacksFolder);
    for (const dataPackFolder of dataPackFolders) {
      let parsedDatapack = parseDatapackName(dataPackFolder);
      if (parsedDatapack == null) continue;
      parsedDatapack['sourceFolder'] = path.join(carDatapacksFolder, dataPackFolder);
      datapacks[car].dataPacks.push(parsedDatapack);
    }

    datapacks[car].dataPacks = datapacks[car].dataPacks.filter((dataPack) => {
      return series.includes(dataPack.series);
    });
  }

  return datapacks;
}

function parseCarName(carFolder) {
  return carFolder;
}

function parseDatapackName(dataPackFolder) {
  const map = 
  {
    "provider": "GnG",
    "pattern": "(?<seasonYear>[0-9]{2})S(?<seasonNo>[0-9]{1,2})\\sW(?<week>[0-9]{2})\\s(?<series>[\\w-]+)\\s[\\w-]+\\s(?<track>.*?)(?: (?<isWet>(WET|Wet)))?$",
    "destinationTemplate": "{base}/{car}/Garage 61 - Motorsports Factory/S{seasonYear}0{seasonNo}-{series}/{week}-{track}"
  };
  const matcherResult = matchSetupPath(dataPackFolder, map, config.mappings.tracks, config.mappings.series);
  if (matcherResult.result) {
    if (matcherResult.matches.seasonYear === null || matcherResult.matches.seasonNo === null || matcherResult.matches.week === null || matcherResult.matches.track === null || matcherResult.matches.series === null || matcherResult.matches.isWet === null) {
      return null;
    }
    return {
      seasonYear: matcherResult.matches.seasonYear,
      seasonNo: matcherResult.matches.seasonNo,
      week: matcherResult.matches.week,
      track: matcherResult.matches.track,
      series: matcherResult.matches.series,
      isWet: matcherResult.matches.isWet,
    };
  }
  return null;
}

function loadTargetForDatapack(car, dataPack) {
  const targetFolder = path.join(car, 'Garage 61 - Motorsports Factory', `S${dataPack.seasonYear}0${dataPack.seasonNo}-${dataPack.series}`, `W${dataPack.week}-${dataPack.track}`);
  return targetFolder;
}

module.exports = {
  loadDataPacksForSeries,
  parseCarName,
  parseDatapackName,
  loadTargetForDatapack,
};
