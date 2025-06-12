/**
 * SmartHub - AI powered Smart Home
 * Command Library for any App 
 * GitHub: https://github.com/mikhail-leonov/smart-house
 * 
 * @author Mikhail Leonov mikecommon@gmail.com
 * @version 0.7.1
 * @license MIT
 */

function execCommand(command) {
  if (!command) {
    return Promise.reject(new Error('Command is required'));
  }

  const url = new URL('http://command.jarvis.home:8091/command');
  url.searchParams.append('c', command);

  return fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'text/plain',
    },
  })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(`Command failed with status ${response.status}: ${text}`);
        });
      }
      return response.text();
    });
}

const contentCommand = { execCommand };

window.Jarvis = window.Jarvis || {};
window.Jarvis.command = contentCommand;
