'use strict';

const fs = require('fs');
const util = require('./util.js');
const Voice = require('@discordjs/voice');

const Player = function() {

  // if called class without new
  if (!(this instanceof Player)) throw new Error(`Class constructor Player cannot be invoked without 'new'`);

  this._players = {};
};

Player.prototype.create = function(guild) {
  if (!this._players.hasOwnProperty(guild)) {

    const dir = `./_music/${guild}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    const player = Voice.createAudioPlayer();
    player.on(Voice.AudioPlayerStatus.Idle, async () => {
      console.log(`[AudioPlayerStatus] Idle state - ${guild}`);
      const path = this._players[guild].queue.shift();
      if (path != undefined) {
        const resource = Voice.createAudioResource(path);
        this._players[guild].player.play(resource);
        await util.execShellCommand(`rm ${path}`);
      }
    });
    player.on(Voice.AudioPlayerStatus.Buffering, () => {
      console.log(`[AudioPlayerStatus] Buffering state - ${guild}`);
    });
    player.on(Voice.AudioPlayerStatus.Playing, () => {
      console.log(`[AudioPlayerStatus] Playing state - ${guild}`);
    });
    player.on(Voice.AudioPlayerStatus.AutoPaused, () => {
      console.log(`[AudioPlayerStatus] AutoPaused state - ${guild}`);
    });
    player.on(Voice.AudioPlayerStatus.Paused, () => {
      console.log(`[AudioPlayerStatus] Paused state - ${guild}`);
    });

    this._players[guild] = {
      queue: [],
      player: player
    };
  }
};

Player.prototype.get = function(guild) {
  if (this._players.hasOwnProperty(guild)) {
    return this._players[guild].player;
  } else {
    return null;
  }
};

Player.prototype.delete = async function(guild) {
  if (this._players.hasOwnProperty(guild)) {
    this._players[guild].player.stop();

    this._players[guild].queue = [];
    await util.execShellCommand(`rm -r ./_music/${guild}`);

    this._players[guild] = null;
    delete this._players[guild];
  }
};

Player.prototype.play = async function(guild, path) {
  if (this._players.hasOwnProperty(guild)) {
    if (this._players[guild].player.state.status == Voice.AudioPlayerStatus.Idle) {
      const resource = Voice.createAudioResource(path);
      this._players[guild].player.play(resource);
      await util.execShellCommand(`rm ${path}`);
    } else {
      this._players[guild].queue.push(path);
    }
  }
};

Player.prototype.pause = function(guild) {
  if (this._players.hasOwnProperty(guild)) {
    if (this._players[guild].player.state.status != Voice.AudioPlayerStatus.Paused) {
      this._players[guild].player.pause();

      return true;
    }
  }
};

Player.prototype.unpause = function(guild) {
  if (this._players.hasOwnProperty(guild)) {
    if (this._players[guild].player.state.status == Voice.AudioPlayerStatus.Paused) {
      this._players[guild].player.unpause();

      return true;
    }
  }
};

Player.prototype.stop = async function(guild) {
  if (this._players.hasOwnProperty(guild)) {
    if (this._players[guild].player.state.status != Voice.AudioPlayerStatus.Idle) {
      this._players[guild].player.stop();

      this._players[guild].queue = [];
      await util.execShellCommand(`rm -r ./_music/${guild}`);

      return true;
    }
  }
};

Player.prototype.skip = function(guild) {
  if (this._players.hasOwnProperty(guild)) {
    if (this._players[guild].player.state.status != Voice.AudioPlayerStatus.Idle) {
      const path = this._players[guild].queue.shift();
      if (path != undefined) {
        this._players[guild].player.play(Voice.createAudioResource(path));

        return true;
      }
    }
  }
};

module.exports = Player;
