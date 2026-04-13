const { app, BrowserWindow, shell, ipcMain, safeStorage } = require("electron");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const isDev = !app.isPackaged;
const devUrl = process.env.WEB_DEV_SERVER_URL || "http://127.0.0.1:8080";
const desktopPartition = "persist:promo";

const storagePrefix = "supabase:";
const quickUnlockKey = "quick_unlock";

function vaultPath() {
  return path.join(app.getPath("userData"), "promo-secure-vault.bin");
}

function readVault() {
  const file = vaultPath();
  if (!fs.existsSync(file)) return {};

  try {
    const buffer = fs.readFileSync(file);
    if (buffer.length === 0) return {};

    const raw = safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(buffer)
      : buffer.toString("utf8");
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function writeVault(vault) {
  const raw = JSON.stringify(vault);
  const payload = safeStorage.isEncryptionAvailable()
    ? safeStorage.encryptString(raw)
    : Buffer.from(raw, "utf8");
  fs.writeFileSync(vaultPath(), payload);
}

function readStorageValue(key) {
  const vault = readVault();
  return vault[`${storagePrefix}${key}`] ?? null;
}

function writeStorageValue(key, value) {
  const vault = readVault();
  vault[`${storagePrefix}${key}`] = value;
  writeVault(vault);
}

function removeStorageValue(key) {
  const vault = readVault();
  delete vault[`${storagePrefix}${key}`];
  writeVault(vault);
}

function clearStorageValues() {
  const vault = readVault();
  Object.keys(vault)
    .filter((key) => key.startsWith(storagePrefix))
    .forEach((key) => delete vault[key]);
  writeVault(vault);
}

function getQuickUnlockConfig() {
  const vault = readVault();
  const quick = vault[quickUnlockKey] ?? {};
  return {
    enabled: quick.enabled !== false,
    hasPin: typeof quick.pinHash === "string" && quick.pinHash.length > 0,
  };
}

function hashPin(pin) {
  return crypto.createHash("sha256").update(pin).digest("hex");
}

function setQuickUnlockPin(pin) {
  const normalized = String(pin ?? "").trim();
  if (!/^\d{4,8}$/.test(normalized)) {
    return { ok: false };
  }

  const vault = readVault();
  vault[quickUnlockKey] = {
    enabled: true,
    pinHash: hashPin(normalized),
  };
  writeVault(vault);
  return { ok: true };
}

function verifyQuickUnlockPin(pin) {
  const normalized = String(pin ?? "").trim();
  const vault = readVault();
  const quick = vault[quickUnlockKey] ?? {};
  const expected = quick.pinHash;
  if (!expected || typeof expected !== "string") {
    return { ok: false };
  }
  return { ok: hashPin(normalized) === expected };
}

function disableQuickUnlock() {
  const vault = readVault();
  vault[quickUnlockKey] = { enabled: false, pinHash: null };
  writeVault(vault);
  return { ok: true };
}

function registerDesktopIpc() {
  ipcMain.on("desktop-storage:get-item", (event, key) => {
    event.returnValue = readStorageValue(String(key));
  });
  ipcMain.on("desktop-storage:set-item", (_event, key, value) => {
    writeStorageValue(String(key), String(value));
  });
  ipcMain.on("desktop-storage:remove-item", (_event, key) => {
    removeStorageValue(String(key));
  });
  ipcMain.on("desktop-storage:clear", () => {
    clearStorageValues();
  });

  ipcMain.handle("desktop-quick-unlock:get-config", () => getQuickUnlockConfig());
  ipcMain.handle("desktop-quick-unlock:set-pin", (_event, pin) => setQuickUnlockPin(pin));
  ipcMain.handle("desktop-quick-unlock:verify-pin", (_event, pin) => verifyQuickUnlockPin(pin));
  ipcMain.handle("desktop-quick-unlock:disable", () => disableQuickUnlock());
}

function resolveEmbeddedIndexPath() {
  const packagedPath = path.join(process.resourcesPath, "web-dist", "index.html");
  if (fs.existsSync(packagedPath)) {
    return packagedPath;
  }

  return path.join(__dirname, "..", "web-dist", "index.html");
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      partition: desktopPartition,
    },
  });

  if (isDev) {
    win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(resolveEmbeddedIndexPath());
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  registerDesktopIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

