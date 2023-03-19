const { app, BrowserWindow, ipcMain } = require('electron');
const { join } = require('path');
const axios = require("axios");
const { createWriteStream, existsSync, unlinkSync, copyFile, readFileSync } = require("fs");
const tempDir = join(__dirname, "..", "..")

const pkg = require("../package.json").version;

let mainWindow;
let isEverythingLoadedCorrectly = false;

const berry = require("./modules/logger")();

berry.log("Iniciando DrStudio...");

function checkForUpdates() {
  return new Promise((resolve, reject) => {
    if (!app.isPackaged)
      return resolve(false);
    else
      berry.log("Comprobando actualizaciones...");
    /* 
     * if you want to make updater only check for stable releases change add /latest to the url
     * and remove [0] from res
     */
    axios.get("www").then(async (r) => {
      berry.log("Esperando respuesta de GitHub API");
      let res = r?.data[0];
      if (!pkg)
        return;
      if (pkg !== res.tag_name.replace("v", "") && !existsSync(join(__dirname, "..", "..", "update.asar"))) {
        berry.log("Actualizacion disponible, descargando...");
        const updateModules = res.assets?.find(asset => asset.name.includes("asar"));
        const updateMeta = updateModules ? {
          version: res.tag_name,
          url: updateModules?.browser_download_url,
          size: updateModules?.size,
        } : false;
        mainWindow.webContents.send("progress", { type: "update", message: `Descargando nueva version ${updateMeta.version} with size of ${(updateMeta.size / 1024 / 1024).toFixed(1)} MB` });
        resolve(updateMeta);
      } else {
        resolve(false);
      }
    }).catch(err => {
      berry.error("No se puede comprobar si hay actualizacion");
      berry.error(err);
      resolve(false);
    });
  });
}

function update(url) {
  return new Promise((resolve, reject) => {
    axios({
      url,
      responseType: "stream"
    }).then((response) => {
      // You can replace .flexberry with anything you want except .asar!
      try {
      response.data.pipe(createWriteStream(join(tempDir, "app.flexberry")))
        .on("finish", () => {
          copyFile(join(tempDir, "app.flexberry"), join(tempDir, "app.asar"), (err) => {
            if (err) {
              berry.error("No se puede copear update.file");
              berry.error(err);
              reject(err);
            } else {
              berry.log("Actualizacion completa, reiniciando...");
              resolve(true);
              unlinkSync(join(tempDir, "app.flexberry"));
            }
          });
          resolve(true);
        })
        .on("error", reject);
      } catch (err) {
        reject(err);
      };
    }).catch(() => {
      reject("No se puede descargar la actualizacion, reinicia el launcher.");
      berry.error("No se puede descargar la actualizacion");
    });
  });
}

function createWindow() {
  berry.log("Launcher corriendo en modo produccion. Version: " + pkg);
  mainWindow = new BrowserWindow({
    width: 830,
    height: 520,
    titleBarStyle: "hidden",
    menuBarVisible: false,
    skipTaskbar: true,
    title: "DrStudio Launcher",
    fullscreenable: false,
    resizable: false,
    icon: join(__dirname, "assets/images/dr-studio-icon.png"),
    transparent: true,
    webPreferences: {
      spellcheck: false,
      preload: join(__dirname, "scripts", "preload.js"),
    }
  });
  mainWindow.loadFile(join(__dirname, "index.html"));
  if (process.platform === "darwin")
    mainWindow.setWindowButtonVisibility(false);
  require("./modules/gameManager")(mainWindow);
  require("./modules/versionManager")(mainWindow);
  require("./modules/accountManager")(mainWindow);
};

ipcMain.on("getMeta", async (event) => {
  event.returnValue = {
    isEverythingLoadedCorrectly,
    launcher: {
      version: pkg,
    },
    system: {
      memory: require("os").totalmem(),
      platform: process.platform,
    }
  };
});

ipcMain.on("loaded", async () => {
  isEverythingLoadedCorrectly = true;
  mainWindow.setSkipTaskbar(false);
  mainWindow.focus();
  const updateMeta = await checkForUpdates();
  if (updateMeta.url) {
    // TO-DO: Ask user if they wants to update
    update(updateMeta.url).then(() => {
      mainWindow.webContents.send("progress", { type: "update", message: "Actualizacion completa reiniciando launcher" });
      setTimeout(() => {
        app.relaunch();
        app.quit();
      }, 2000);
    }).catch(err => {
      berry.error(err);
      mainWindow.webContents.send("progress", { type: "update", error: true, message: err });
    });
  }
});

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("quit", () => {
  berry.log("Launcher cerrado");
  berry.log("$1");
});