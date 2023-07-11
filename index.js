'use strict';

const fs = require('node:fs');
const Discord = require('discord.js');
const Voice = require('@discordjs/voice');
const emoji = require('emoji-dictionary');
const Player = require('./Player.prototype.js');
const player = new Player();
const util = require('./util.js');
const log = require('./log.js');
const puppeteer = require('puppeteer');
let browser = null;

const bot = new Discord.Client({
  intents: Object.keys(Discord.Intents.FLAGS)
});

bot.login(process.env.TOKEN).then(token => {
  log.default(`[bot] login successfully and created websocket connection with discord server by using token: "${token}"`);
});

bot.on('ready', async client => {
  const dir = `./_music/`;
  if (fs.existsSync(dir)) {
    await util.execShellCommand(`rm -r ${dir}`);
  }
  fs.mkdirSync(dir);

  browser = await puppeteer.launch({
    headless: true,
    args: [
      '--user-agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"'
    ]
  });

  log.default(`[bot] ready event user tag: "${client.user.tag}"`);
  const guilds = await client.guilds.fetch();
  guilds.forEach(guild => {
    log.default(`[bot] connected to "${guild.name}"`);
  });
});

bot.on('messageCreate', async message => {
  if (message.content.toLowerCase().startsWith('play')) {
    const voiceChannel = message.guild.channels.cache.filter(channel => channel.type === 'GUILD_VOICE').find(channel => {
      return channel.members.some(member => member.id === message.author.id);
    });
    if (voiceChannel === undefined) {
      message.channel.send('You have to join a voice channel first.');
      return;
    }
    const next = async () => {
      player.incrementDownloadingCount(message.guild.id);
      let url = null;
      if (message.content.startsWith('play https://')) {
        url = message.content.split(' ')[1];
      } else {
        const page = await browser.newPage();
        await page.setViewport({
          width: 0,
          height: 0,
          deviceScaleFactor: 1
        });
        await page.goto(`https://music.youtube.com/search?q=${encodeURI(message.content.slice(5))}`, {
          timeout: 0,
          waitUntil: 'domcontentloaded'
        });
        url = await page.evaluate(async () => {
          const _isObject = function(x) {
            return typeof x === 'object' && x instanceof Object && !Array.isArray(x);
          };
          const _isArray = function(x) {
            return typeof x === 'object' && x instanceof Array && Array.isArray(x);
          };
          const run = function(data) {
            let returnValue = null;

            if (_isObject(data)) {
              for (const key in data) {
                if (key === 'videoId') {
                  returnValue = data[key];
                }
                const value = run(data[key]);
                if (returnValue === null && value !== null) returnValue = value;
              }
            } else if (_isArray(data)) {
              data.forEach(each => {
                const value = run(each);
                if (returnValue === null && value !== null) returnValue = value;
              });
            }

            return returnValue;
          };

          const result = run(window.ytcfg.data_.YTMUSIC_INITIAL_DATA[1].data);
          return `https://music.youtube.com/watch?v=${result}`;
        });
        await page.close();
      }

      const songId = url.split('?v=')[1].split('&')[0];
      const outputPath = `./_music/${message.guild.id}/${songId}-${new Date().getTime()}.mp3`;
      const reaction = await message.react(emoji.getUnicode('arrow_down'));
      await util.execShellCommand(`yt-dlp --extract-audio --audio-format mp3 --audio-quality 0 --no-playlist "${url}" -o "${outputPath}"`);
      player.decrementDownloadingCount(message.guild.id);
      if (await player.play(message.guild.id, outputPath)) {
        reaction.remove();
        await message.react(emoji.getUnicode('white_check_mark'));
      }
    };
    let connection = Voice.getVoiceConnection(message.guild.id);
    if (connection === undefined) {
      connection = Voice.joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator
      });
      connection.on(Voice.VoiceConnectionStatus.Signalling, () => {
        log.default(`[VoiceConnectionStatus] Signalling state - ${message.guild.id}:"${message.guild.name}"`);
      });
      connection.on(Voice.VoiceConnectionStatus.Connecting, () => {
        log.default(`[VoiceConnectionStatus] Connecting state - ${message.guild.id}:"${message.guild.name}"`);
      });
      connection.on(Voice.VoiceConnectionStatus.Ready, async () => {
        log.default(`[VoiceConnectionStatus] Ready state - ${message.guild.id}:"${message.guild.name}"`);
      });
      connection.on(Voice.VoiceConnectionStatus.Disconnected, async (_oldState, _newState) => {
        log.default(`[VoiceConnectionStatus] Disconnected state - ${message.guild.id}:"${message.guild.name}"`);
        try {
          await Promise.race([
            Voice.entersState(connection, Voice.VoiceConnectionStatus.Signalling, 5e3),
            Voice.entersState(connection, Voice.VoiceConnectionStatus.Connecting, 5e3)
          ]);
        } catch (_error) {
          connection.destroy();
        }
      });
      connection.on(Voice.VoiceConnectionStatus.Destroyed, async () => {
        log.default(`[VoiceConnectionStatus] Destroyed state - ${message.guild.id}:"${message.guild.name}"`);
        await player.destroy(message.guild.id);
      });
      connection.on('stateChange', (oldState, newState) => {
        if (
          (oldState.status === Voice.VoiceConnectionStatus.Ready && newState.status === Voice.VoiceConnectionStatus.Connecting) ||
          (oldState.status === Voice.VoiceConnectionStatus.Connecting && newState.status === Voice.VoiceConnectionStatus.Signalling)
        ) {
          connection.configureNetworking();
        }
      });

      player.create(message.guild.id);
      connection.subscribe(player.get(message.guild.id));
    }
    await next();
  } else if (message.content.toLowerCase().startsWith('pause')) {
    if (player.pause(message.guild.id)) {
      await message.react(emoji.getUnicode('white_check_mark'));
    }
  } else if (message.content.toLowerCase().startsWith('resume')) {
    if (player.unpause(message.guild.id)) {
      await message.react(emoji.getUnicode('white_check_mark'));
    }
  } else if (message.content.toLowerCase().startsWith('stop')) {
    if (await player.stop(message.guild.id)) {
      await message.react(emoji.getUnicode('white_check_mark'));
    }
  } else if (message.content.toLowerCase().startsWith('skip')) {
    if (await player.skip(message.guild.id)) {
      await message.react(emoji.getUnicode('white_check_mark'));
    }
  }
});

module.exports = null;
