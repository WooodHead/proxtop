const BrowserWindow = require('browser-window');
const WindowState = require('electron-window-state');
const Shell = require('shell');
const openAboutWindow = require('about-window').default;
const path = require('path');

class WindowManager {
    constructor(dirs) {
        this.mainWindow = null;
        this.app_dir = dirs.app;
        this.index_location = dirs.index;
        this.logo_location = dirs.logo;
    }

    getMainWindow() {
        return this.mainWindow;
    }

    createMainWindow() {
        LOG.verbose('Opening new window');
        const self = this;
        const windowState = WindowState({
            defaultWidth: 800,
            defaultHeigth: 600,
            path: this.app_dir
        });

        this.mainWindow = new BrowserWindow({
            width: windowState.width,
            height: windowState.height,
            y: windowState.y,
            x: windowState.x,
            autoHideMenuBar: true,
            icon: this.logo_location
        });

        this.mainWindow.loadURL('file://' + this.index_location);
        this.mainWindow.on('closed', function() {
            self.mainWindow = null;
        });

        this.mainWindow.webContents.on('new-window', function(ev, url) {
            LOG.verbose('Prevent new window and open externally instead.');
            ev.preventDefault();
            Shell.openExternal(url);
        });

        windowState.manage(this.mainWindow);
    }

    createAboutWindow() {
        openAboutWindow({
            icon_path: this.logo_location
        });
    }
}

module.exports = WindowManager;
