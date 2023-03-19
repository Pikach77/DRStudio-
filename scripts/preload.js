const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld(
  "IPC", {
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  sendSync: (channel, data) => {
    return ipcRenderer.sendSync(channel, data);
  },
  on: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
  invoke: (channel, data) => {
    return ipcRenderer.invoke(channel, data);
  }
});

//Directorio de Discord RPC Colocado Nuevamente

const fs = require("fs");
const path = require("path");
const DiscordRPC = require("discord-rpc");

DiscordRPC.register("421781651098566656");

const rpc = new DiscordRPC.Client({ transport: 'ipc' });
const startTimestamp = new Date();

rpc.setMaxListeners(0);

let mainDir = (__dirname).split("\\scripts")[0];
mainDir = mainDir.includes("/scripts") ? mainDir.split("/scripts")[0] : mainDir;

function setActivity() {
  rpc.setActivity({
    details: 'In main window',
    startTimestamp,
    largeImageKey: 'drstudio',
    largeImageText: 'drstudio',
    instance: false,
  });

  rpc.on('ready', () => {
    setActivity();
    console.log("[DEBUG] Discord RPC ready");
    setInterval(() => {
      setActivity();
    }, 15e3);
  });
}

function addEvent(type, element, event, loading, ...params) {
  try {
    if (type == "id") { 
      el = document.getElementById(element);
    } else {
      el = document.querySelector(element);
    }
    el.addEventListener("click", () => {
      if (loading)
        toggleLoading("accounts");
      event(...params);
    });
  } catch (err) {
    return;
  }
}

function toggleLoading(tab, forceClose) {
  let tabEl = document.getElementById(tab);
  if (forceClose)
    return tabEl.classList.remove("tabLoading");
  tabEl.classList.toggle("tabLoading");
}

let wiz;

window.addEventListener("DOMContentLoaded", () => {
  function online() {
    document.querySelectorAll(".requiresConnection").forEach((el) => {
      el.style.display = "";
    });
    document.querySelectorAll(".noConnectionIndicator").forEach((el) => {
      el.style.display = "none";
    });
  }
  function noConnection() {
    document.querySelectorAll(".requiresConnection").forEach((el) => {
      el.style.display = "none";
    });
    document.querySelectorAll(".noConnectionIndicator").forEach((el) => {
      el.style.display = "";
    });
  }
  window.addEventListener('online', online);
  window.addEventListener('offline', noConnection);
  navigator.onLine ? online() : noConnection();
  ipcRenderer.send("getVersions");
  setActivity();
  ipcRenderer.send("loaded");
  addEvent("id", "login", ipcRenderer.send, true, "addAccount");
  ipcRenderer.send("getAccounts");
  ipcRenderer.send("getProfiles");
  wiz = document.getElementById("wizard").outerHTML.toString();
  fs.readdir(path.join(mainDir, "style", "themes"), (err, files) => {
    if (err) return console.error(err);
    const themes = files.filter(file => file.endsWith(".css"));
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const style = document.createElement("link");
    style.setAttribute("rel", "stylesheet");
    style.setAttribute("type", "text/css");
    style.setAttribute("href", `style/themes/${theme}`);
    document.head.appendChild(style);
  });
  ipcRenderer.send("getMemory");
  ipcRenderer.send("getVersion");
});

ipcRenderer.on("version", (event, data) => {
  document.getElementById("launcherVersion").innerHTML = data || "???";
});

rpc.login({ "clientId": "421781651098566656" }).catch(console.error);

let toggledSubTabs = [];
let toggledTabs = [];

ipcRenderer.on("loginResult", (event, arg) => {
  if (JSON.parse(arg).status == "error") {
    // TO-DO - add error handling (maybe a pop-up?)
    toggleLoading("accounts", true);
  } else {
    const accounts = JSON.parse(JSON.parse(arg).accounts); // yes, i hate processing JSON datas...
    createAccountList(accounts, arg.haveSelected);
  }
});

ipcRenderer.on("verifyAccountResult", (event, arg) => {
  arg = JSON.parse(arg);
  if (arg.error) {
    // TO-DO - add error handling (maybe a pop-up?)
    toggleLoading("accounts", true);
    return console.error(arg);
  } 
  if (!arg.valid) {
    ipcRenderer.send("refreshAccount", arg.uuid);
    return;
  }
  ipcRenderer.send("setSelectedAccount", arg.uuid);
});

ipcRenderer.on("refreshAccountResult", (event, arg) => {
  toggleLoading("accounts");
  arg = JSON.parse(arg);
  if (arg.error || !arg.accounts) {
    // TO-DO - add error handling (maybe a pop-up?)
    return console.error(arg);
  }
  ipcRenderer.send("setSelectedAccount", arg.uuid);
})

let versions = [];

ipcRenderer.on("versions", (event, arg) => {
  versions = arg;
});

Date.prototype.toShortFormat = function() {

  let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  let day = this.getDate();
  
  let monthIndex = this.getMonth();
  let monthName = monthNames[monthIndex];
  
  let year = this.getFullYear();
  
  return `${day} ${monthName} ${year}`;  
}