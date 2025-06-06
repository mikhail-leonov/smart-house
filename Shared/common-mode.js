/**
 * SmartHub - AI powered Smart Home
 * Common node.js lib
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.6.8
 * @license MIT
 */

async function callFunction(func) {
    if (typeof func !== 'function') {
        console.error("Provided argument is not a function.");
        return null;
    }
    try {
        const callResult = func();
        if (callResult instanceof Promise) {
            return await callResult;
        } else {
            return callResult;
        }
    } catch (err) {
        console.error("Error calling function:", err);
        return null;
    }
}

module.exports = { callFunction };
