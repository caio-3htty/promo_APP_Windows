const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  app: "prumo-windows-client",
  storage: {
    getItem: (key) => ipcRenderer.sendSync("desktop-storage:get-item", key),
    setItem: (key, value) => ipcRenderer.sendSync("desktop-storage:set-item", key, value),
    removeItem: (key) => ipcRenderer.sendSync("desktop-storage:remove-item", key),
    clear: () => ipcRenderer.sendSync("desktop-storage:clear"),
  },
  quickUnlock: {
    getConfig: () => ipcRenderer.invoke("desktop-quick-unlock:get-config"),
    setPin: (pin) => ipcRenderer.invoke("desktop-quick-unlock:set-pin", pin),
    verifyPin: (pin) => ipcRenderer.invoke("desktop-quick-unlock:verify-pin", pin),
    disable: () => ipcRenderer.invoke("desktop-quick-unlock:disable"),
  },
});

