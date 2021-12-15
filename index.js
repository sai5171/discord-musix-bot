'use strict';

const fs = require('fs');
const Discord = require('discord.js');
const Voice = require('@discordjs/voice');
const emoji = require('emoji-dictionary');
const Player = require('./Player.prototype.js');
const player = new Player();
const util = require('./util.js');

const bot = new Discord.Client({
  intents: Object.keys(Discord.Intents.FLAGS)
});

bot.login(process.env.TOKEN).then(token => {
  console.log(`[bot] login successfully and created websocket connection with discord server by using token: "${token}"`);
});

bot.on('ready', async client => {
  const dir = `./_music/`;
  if (fs.existsSync(dir)) {
    await util.execShellCommand(`rm -r ${dir}`);
  }
  fs.mkdirSync(dir);
  console.log(`[bot] ready event user tag: "${client.user.tag}"`);
});

bot.on('messageCreate', async message => {
  if (message.content.toLowerCase().startsWith('play')) {
    const voiceChannel = message.guild.channels.cache.filter(channel => channel.type == 'GUILD_VOICE').find(channel => {
      return channel.members.find(member => member.id == message.author.id)
    });
    if (voiceChannel == undefined) {
      message.channel.send('You have to join a voice channel first.');
      return;
    }
    const next = async () => {
      const url = message.content.split(' ')[1];
      const songId = url.split('?v=')[1].split('&')[0];
      const outputPath = `./_music/${message.guild.id}/${songId}-${new Date().getTime()}.mp3`;
      await util.execShellCommand(`yt-dlp --extract-audio --audio-format mp3 --audio-quality 0 --no-playlist "${url}" -o "${outputPath}"`);
      await player.play(message.guild.id, outputPath);
      message.react(emoji.getUnicode('ok_hand'));
    };
    let connection = null;
    while (true) {
      connection = Voice.getVoiceConnection(message.guild.id);
      if (connection == undefined || connection._state.status != Voice.VoiceConnectionStatus.Disconnected) {
        break;
      } else {
        await Promise.race([
          Voice.entersState(connection, Voice.VoiceConnectionStatus.Signalling, 7e3),
          Voice.entersState(connection, Voice.VoiceConnectionStatus.Connecting, 7e3),
          Voice.entersState(connection, Voice.VoiceConnectionStatus.Destroyed, 7e3)
        ]);
      }
    }
    if (connection == undefined) {
      connection = Voice.joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator
      });
      connection.on(Voice.VoiceConnectionStatus.Signalling, () => {
        console.log(`[VoiceConnectionStatus] Signalling state - ${message.guild.id}:"${message.guild.name}"`);
      });
      connection.on(Voice.VoiceConnectionStatus.Connecting, () => {
        console.log(`[VoiceConnectionStatus] Connecting state - ${message.guild.id}:"${message.guild.name}"`);
        player.create(message.guild.id);
        connection.subscribe(player.get(message.guild.id));
      });
      connection.on(Voice.VoiceConnectionStatus.Ready, async () => {
        console.log(`[VoiceConnectionStatus] Ready state - ${message.guild.id}:"${message.guild.name}"`);
        await next();
      });
      connection.on(Voice.VoiceConnectionStatus.Disconnected, async (_oldState, _newState) => {
        console.log(`[VoiceConnectionStatus] Disconnected state - ${message.guild.id}:"${message.guild.name}"`);
        try {
          await Promise.race([
            Voice.entersState(connection, Voice.VoiceConnectionStatus.Signalling, 5e3),
            Voice.entersState(connection, Voice.VoiceConnectionStatus.Connecting, 5e3)
          ]);
        } catch (_error) {
          connection.destroy();
          await player.destroy(message.guild.id);
        }
      });
      connection.on(Voice.VoiceConnectionStatus.Destroyed, () => {
        console.log(`[VoiceConnectionStatus] Destroyed state - ${message.guild.id}:"${message.guild.name}"`);
      });
    } else {
      await next();
    }
  } else if (message.content.toLowerCase().startsWith('pause')) {
    if (player.pause(message.guild.id)) {
      message.react(emoji.getUnicode('ok_hand'));
    }
  } else if (message.content.toLowerCase().startsWith('unpause')) {
    if (player.unpause(message.guild.id)) {
      message.react(emoji.getUnicode('ok_hand'));
    }
  } else if (message.content.toLowerCase().startsWith('stop')) {
    if (await player.stop(message.guild.id)) {
      message.react(emoji.getUnicode('ok_hand'));
    }
  } else if (message.content.toLowerCase().startsWith('skip')) {
    if (player.skip(message.guild.id)) {
      message.react(emoji.getUnicode('ok_hand'));
    }
  }
});
