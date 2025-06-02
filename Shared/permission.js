/**
 * SmartHub - AI powered Smart Home
 * Set cmd files x permission Node.js Script
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.5
 * @license MIT
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Directory to start from
const baseDir = process.argv[2] || '.';

function makeCmdFilesExecutable(dir) {
  fs.readdir(dir, { withFileTypes: true }, (err, entries) => {
    if (err) {
      console.error(`Error reading directory ${dir}:`, err);
      return;
    }

    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        makeCmdFilesExecutable(fullPath); // Recurse into subdirectory
      } else if (entry.isFile() && fullPath.endsWith('.cmd')) {
        // Set permission using chmod +x
        exec(`chmod +x "${fullPath}"`, (err) => {
          if (err) {
            console.error(`Failed to chmod ${fullPath}:`, err.message);
          } else {
            console.log(`? Made executable: ${fullPath}`);
          }
        });
      }
    });
  });
}

// Run it
makeCmdFilesExecutable(baseDir);
