'use strict';

// require packages
const exec = require('child_process').exec;

const util = {};

util.execShellCommand = cmd => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(stderr);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
};

module.exports = util;
