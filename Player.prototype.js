'use strict';

const fs = require('node:fs');
const util = require('./util.js');
const Voice = require('@discordjs/voice');
const log = require('./log.js');

const Player = function () {
  // if called class without new
  if (!(this instanceof Player)) {
    throw new Error(`Class constructor Player cannot be invoked without 'new'`);
  }

  this._players = {};
};

Player.prototype.create = function (guild) {
  if (!Object.hasOwn(this._players, guild)) {
    const dir = `./_music/${guild}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    const player = Voice.createAudioPlayer();
    player.on(Voice.AudioPlayerStatus.Idle, async () => {
      log.default(`[AudioPlayerStatus] Idle state - ${guild}`);
      await this._next(guild);
    });
    player.on(Voice.AudioPlayerStatus.Buffering, () => {
      log.default(`[AudioPlayerStatus] Buffering state - ${guild}`);
    });
    player.on(Voice.AudioPlayerStatus.Playing, () => {
      log.default(`[AudioPlayerStatus] Playing state - ${guild}`);
    });
    player.on(Voice.AudioPlayerStatus.AutoPaused, () => {
      log.default(`[AudioPlayerStatus] AutoPaused state - ${guild}`);
    });
    player.on(Voice.AudioPlayerStatus.Paused, () => {
      log.default(`[AudioPlayerStatus] Paused state - ${guild}`);
    });

    this._players[guild] = {
      queue: [],
      downloadingCount: 0,
      previous_path: null,
      player
    };
  }
};

Player.prototype.incrementDownloadingCount = async function (guild) {
  if (Object.hasOwn(this._players, guild)) {
    this._players[guild].downloadingCount = this._players[guild].downloadingCount + 1;
  }
};

Player.prototype.decrementDownloadingCount = async function (guild) {
  if (Object.hasOwn(this._players, guild)) {
    this._players[guild].downloadingCount = this._players[guild].downloadingCount - 1;
  }
};

Player.prototype.destroy = async function (guild) {
  if (Object.hasOwn(this._players, guild)) {
    this._players[guild].player.stop();

    await util.execShellCommand(`rm -r ./_music/${guild}`);

    this._players[guild] = null;
    delete this._players[guild];
  }
};

Player.prototype.get = function (guild) {
  if (Object.hasOwn(this._players, guild)) {
    return this._players[guild].player;
  } else {
    return null;
  }
};

Player.prototype._play = function (guild, path) {
  this._players[guild].previous_path = path;
  const resource = Voice.createAudioResource(path);
  this._players[guild].player.play(resource);
};

Player.prototype.play = async function (guild, path) {
  if (Object.hasOwn(this._players, guild)) {
    if (this._players[guild].player.state.status === Voice.AudioPlayerStatus.Idle) {
      this._play(...arguments);
    } else {
      this._players[guild].queue.push(path);
    }

    return true;
  }
};

Player.prototype.pause = function (guild) {
  if (Object.hasOwn(this._players, guild)) {
    if (this._players[guild].player.state.status !== Voice.AudioPlayerStatus.Paused) {
      this._players[guild].player.pause();

      return true;
    }
  }
};

Player.prototype.unpause = function (guild) {
  if (Object.hasOwn(this._players, guild)) {
    if (this._players[guild].player.state.status === Voice.AudioPlayerStatus.Paused) {
      this._players[guild].player.unpause();

      return true;
    }
  }
};

Player.prototype.stop = async function (guild) {
  if (Object.hasOwn(this._players, guild)) {
    if (this._players[guild].player.state.status !== Voice.AudioPlayerStatus.Idle) {
      this._players[guild].player.stop();

      this._players[guild].queue = [];
      this._players[guild].previous_path = null;

      await util.execShellCommand(`rm -r ./_music/${guild}`);

      return true;
    }
  }
};

Player.prototype._next = async function (guild) {
  if (this._players[guild].previous_path !== null) {
    await util.execShellCommand(`rm ${this._players[guild].previous_path}`);
    this._players[guild].previous_path = null;
  }

  const path = this._players[guild].queue.shift();
  if (path !== undefined) {
    this._play(guild, path);
  } else if (this._players[guild].downloadingCount === 0) {
    const connection = Voice.getVoiceConnection(guild);
    connection.destroy();
  }
};

Player.prototype.skip = async function (guild) {
  if (Object.hasOwn(this._players, guild)) {
    if (this._players[guild].player.state.status !== Voice.AudioPlayerStatus.Idle) {
      this._players[guild].player.stop();
      await this._next(guild);

      return true;
    }
  }
};

module.exports = Player;
