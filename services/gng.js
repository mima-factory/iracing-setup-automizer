fse = require('fs-extra');
const { matchSetupPath } = require('./matcher');
const path = require('path');
const config = require('../config.json');

function loadDataPacksForSeries(filters, setupsFolder) {
  const series = filters.series
  const seasonWeeks = filters.weeks;
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
      return series.includes(dataPack.series)
        && seasonWeeks.includes(dataPack.week)
        && dataPack.seasonYear === config.general.currentSeasonYear
        && dataPack.seasonNo === config.general.currentSeasonNo;
    });
  }

  return datapacks;
}

function parseCarName(carFolder) {
  return carFolder;
}

function parseDatapackName(dataPackFolder) {
  for (let setupJsonMap of config.mappings.setups) {
    const matcherResult = matchSetupPath(dataPackFolder, setupJsonMap, config.mappings.tracks, config.mappings.series);
    if (matcherResult.result) {
      if (matcherResult.matches.seasonYear === null || matcherResult.matches.seasonNo === null || matcherResult.matches.week === null || matcherResult.matches.track === null || matcherResult.matches.series === null || matcherResult.matches.isWet === null) {
        return null;
      }
      const dest = setupJsonMap.destinationTemplate
        .replace('{seasonYear}', matcherResult.matches.seasonYear)
        .replace('{seasonNo}', matcherResult.matches.seasonNo)
        .replace('{series}', matcherResult.matches.series)
        .replace('{week}', matcherResult.matches.week)
        .replace('{track}', matcherResult.matches.track)
        .replace('\\', path.sep);
      return {
        seasonYear: matcherResult.matches.seasonYear,
        seasonNo: matcherResult.matches.seasonNo,
        week: matcherResult.matches.week,
        track: matcherResult.matches.track,
        series: matcherResult.matches.series,
        isWet: matcherResult.matches.isWet,
        destFolderTemplate: dest,
      };
    }
  }
  return null;
}

function loadTargetForDatapack(car, basePath, dataPack) {
  const targetFolder = dataPack.destFolderTemplate
    .replace('{car}', car)
    .replace('{base}', basePath);
  return targetFolder;
}

module.exports = {
  loadDataPacksForSeries,
  parseCarName,
  parseDatapackName,
  loadTargetForDatapack,
};
