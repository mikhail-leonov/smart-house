const dgram = require('dgram'); // <-- this was missing!

function spamWake() {
  const client = dgram.createSocket('udp4');
  const message = Buffer.from('wake up');

  let count = 0;
  const interval = setInterval(() => {
    client.send(message, 0, message.length, 5678, '192.168.1.113');
    console.log(`[Wake] UDP wake-up sent (${++count})`);

    if (count >= 10) {
      clearInterval(interval);
      client.close();
      console.log('[Wake] Done.');
    }
  }, 1000);
}

spamWake();