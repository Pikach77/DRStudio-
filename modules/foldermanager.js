const path = require("path");

class FolderManager {
  constructor(gameDir) {
    this.gameDir = gameDir;
    this.modsDir = path.join(__dirname, "..", "resources", "mods");
    this.versionsDir = path.join(__dirname, "..", "resources", "versions");
    this.configDir = path.join(__dirname, "..", "resources", "config");
  }
}

module.exports = FolderManager;
