/**
 * SmartHub - AI powered Smart Home
 * Web Node.js Wrapper 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.3
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

// === CONFIGURATION ===
const targetVersion = '0.7.3'; 

const rootDir = '/home/admin/smart-house/'; // Starting directory
const forbiddenDirs = ['Install', 'LLM', 'Mqtt', 'node_modules', '.git', 'backup']; // Forbidden directory names

// This regex matches lines like: * @version 0.5.5
const versionRegex = /^(\s*\*\s*@version\s+)(\d+\.\d+\.\d+)(.*)$/i;

function updateVersionInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  let changed = false;

  const updatedLines = lines.map(line => {
    const match = line.match(versionRegex);
    if (match) {
      changed = true;
      return `${match[1]}${targetVersion}${match[3]}`;
    }
    return line;
  });

  if (changed) {
    fs.writeFileSync(filePath, updatedLines.join('\n'), 'utf-8');
    console.log(`Updated version in: ${filePath}`);
  }
}

function walkDirectory(dirPath, depth = 0) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  console.log(` - Checking: ${dirPath}`);

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (forbiddenDirs.includes(entry.name)) {
        // Special case: allow processing of public subdir inside forbidden ones
        const publicPath = path.join(fullPath, 'public');
        if (fs.existsSync(publicPath) && fs.statSync(publicPath).isDirectory()) {
          console.log(`   Found 'public' in forbidden dir, processing: ${publicPath}`);
          walkDirectory(publicPath, depth + 1);
        } else {
          console.log(`   Skipping forbidden directory: ${entry.name}`);
        }
        continue;
      }

      if (entry.name === 'public' || depth < 1) {
        walkDirectory(fullPath, depth + 1);
      }
    } else if (entry.isFile()) {
		updateVersionInFile(fullPath);
    }
  }
}

// Start the version update
console.log('Version update started.');
walkDirectory(rootDir);
console.log('Version update complete.');
