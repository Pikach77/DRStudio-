const path = require("path");
const { app } = require("electron");

class FolderManager {
  constructor() {
    // set minecraftDir depends on platform
    if (process.platform == "win32") {
      this.minecraftDir = path.join(app.getPath("appData"), ".minecraft");
      this.modsDir = path.join(app.getPath("appData"), "C:/Program Files/DrStudio Launcher/resources/mods");
      this.versionsDir = path.join(app.getPath("appData"), "C:/Program Files/DrStudio Launcher/resources/versions");
      this.configDir = path.join(app.getPath("appData"), "C:/Program Files/DrStudio Launcher/resources/config");
    } else if (process.platform == "darwin") {
      this.minecraftDir = path.join(app.getPath("appData"), "minecraft");
      this.modsDir = path.join(app.getPath("appData"), "DrStudio Launcher/resources/mods");
      this.versionsDir = path.join(app.getPath("appData"), "DrStudio Launcher/resources/versions");
      this.configDir = path.join(app.getPath("appData"), "DrStudio Launcher/resources/config");
    } else if (process.platform == "linux") {
      this.minecraftDir = path.join(app.getPath("home"), ".minecraft");
      this.modsDir = path.join(app.getPath("home"), ".drstudio-launcher/resources/mods");
      this.versionsDir = path.join(app.getPath("home"), ".drstudio-launcher/resources/versions");
      this.configDir = path.join(app.getPath("home"), ".drstudio-launcher/resources/config");
    } else {
      // TO-DO - add popup for error
      throw new Error("Unsupported platform");
    }
  }

  getModsDir() {
    return this.modsDir;
  }

  getConfigDir() {
    return this.configDir;
  }

  getVersionsDir() {
    return this.versionsDir;
  }
}

module.exports = FolderManager;
