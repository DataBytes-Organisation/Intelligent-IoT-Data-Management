const csv = require('csvtojson');
const fs = require('fs');

const inputPath = './data/sensor.csv';       // path to your CSV file
const outputPath = './data/sensorData.json'; // path where JSON will be saved

csv()
  .fromFile(inputPath)
  .then((jsonObj) => {
    fs.writeFileSync(outputPath, JSON.stringify(jsonObj, null, 2));
    console.log('JSON saved to', outputPath);
  });
