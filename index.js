// utils
const fs = require('fs');
const path = require('path');

// markov
const markov = require('markov');
const m = markov(2);

// telegram
const Telegram = require('node-telegram-bot-api');
const token = require('./token');
const tg = new Telegram(token, { polling: true });

const filePath = path.join(__dirname, 'messages.txt');

try {
  const fileStream = fs.createReadStream(filePath);
  m.seed(fileStream, () => {
    console.log('initialized markov chains');
  });
} catch (e) {
  console.log('error opening messages.txt, starting from scratch');
}

tg.on('message', (msg) => {
  if (!msg.text) {
    return;
  }

  let lines = msg.text;
  lines = lines.replace(/\s+/g, ' ');
  lines = lines.replace(/\.\s+/g, '.\n');

  let respond = false;

  if (lines.indexOf('/') === 0) {
    if (lines.indexOf('/markov') === 0) {
      respond = true;
      // get rid of command in lines string
      lines = lines.substr(lines.indexOf(' ') + 1);
    } else {
      // unknown command, ignore
      return;
    }
  }

  fs.appendFileSync(filePath, lines + '\n');
    if (respond) {
      const res = m.respond(lines.replace('\n', ' ')).join(' ');
      tg.sendMessage(msg.chat.id, res);
    }

    lines.split('\n').forEach((line) => {
      try {
        m.seed(line);
      } catch(e) {
        console.log('m.seed failed, probably not enough lines in input file');
      }
    });
});
