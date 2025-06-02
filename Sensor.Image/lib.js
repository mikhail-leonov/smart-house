/**
 * SmartHub - AI powered Smart Home
 * Image parsing Node.JS Library (Async Version)
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.7
 * @license MIT
 */

const fs = require('fs').promises;
const path = require('path');
const tf = require('@tensorflow/tfjs');
const cocoSsd = require('@tensorflow-models/coco-ssd');
const mqtt = require('../Shared/mqtt-node');
const { createCanvas, loadImage } = require('canvas');

let modelPromise = cocoSsd.load();

function inferRoomFromFilename(filename) {
  const base = path.basename(filename).toLowerCase();
  const match = base.match(/^([a-z0-9]+)_/i);
  return match ? match[1] : 'unknown';
}

function buildMqttResult(predictions, room) {
  const car = predictions.find(obj => obj.class === 'car');
  if (!car) { return { car_presence: 0 } } else { return { car_presence: 1 } } 
}

async function getImageObjects(filePath) {
    const model = await modelPromise;
    const image = await loadImage(filePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    const input = tf.browser.fromPixels(canvas);
    const predictions = await model.detect(input);

    const room = inferRoomFromFilename(filePath);
    const result = buildMqttResult(predictions, room);
/*
    await fs.unlink(filePath).catch(err =>
      console.warn(`Could not delete ${filePath}: ${err.message}`)
    );
*/
    return result ;
}

module.exports = { getImageObjects };

