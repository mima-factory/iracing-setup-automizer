fse = require('fs-extra');

function loadDataPacksForSeries(series, setupsFolder) {
  const carFolders = fse.readdirSync(setupsFolder);
  const dataPacks = [];
  for (const carFolder of carFolders) {
    const carDatapacksFolder = path.join(setupsFolder, carFolder, 'Garage 61', 'Data Packs');
    if (!fse.existsSync(carDatapacksFolder)) continue;
    const car = parseCarName(carFolder);

    const dataPackFolders = fse.readdirSync(carDatapacksFolder);
    for (const dataPackFolder of dataPackFolders) {
      const { seasonYear, seasonNo, week, track, series} = parseDatapackName(dataPackFolder);
    }
  }
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
