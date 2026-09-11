const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

const zip = new AdmZip();

function addFolder(folderPath, zipPrefix = '') {
  const items = fs.readdirSync(folderPath);
  for (const item of items) {
    const fullPath = path.join(folderPath, item);
    const stat = fs.statSync(fullPath);
    const zipEntryName = zipPrefix ? (zipPrefix + '/' + item) : item;
    if (stat.isDirectory()) {
      addFolder(fullPath, zipEntryName);
    } else {
      const content = fs.readFileSync(fullPath);
      zip.addFile(zipEntryName, content);
    }
  }
}

addFolder(path.join(__dirname, 'public'));
zip.writeZip(path.join(__dirname, 'game_playgama.zip'));
console.log('Successfully created game_playgama.zip with forward slashes!');
