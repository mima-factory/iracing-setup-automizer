fse = require('fs-extra');
const path = require('path');

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
      if (!parsedDatapack) continue;
      datapacks[car].dataPacks.push(parsedDatapack);
    }

    datapacks[car].dataPacks = datapacks[car].dataPacks.filter((dataPack) => {
      return series.includes(dataPack.series);
    });
  }

  return datapacks;
}

function parseCarName(carFolder) {
  return "bmwm4gt3";
}

function parseDatapackName(dataPackFolder) {
  const regex = /(?<seasonYear>[0-9]{2})S(?<seasonNo>[0-9]{1,2})\sW(?<week>[0-9]{2})\s(?<series>[\w-]+)\s[\w-]+\s(?<track>.*?)(?: (?<isWet>(WET|Wet)))?$/;
  const match = dataPackFolder.match(regex);
  if (match) {
    return {
      seasonYear: match.groups.seasonYear,
      seasonNo: match.groups.seasonNo,
      week: match.groups.week,
      track: match.groups.track,
      series: match.groups.series,
      isWet: match.groups.isWet ? true : false,
    };
  }
  return null;
}

module.exports = {
  loadDataPacksForSeries,
  parseCarName,
  parseDatapackName
};
