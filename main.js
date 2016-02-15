require('./src/app/global');
var app = require('app');
var BrowserWindow = require('browser-window');
var winston = require("winston");
var utils = require('./src/app/utils');

utils.createDirIfNotExists(APP_DIR);
var Proxtop = require('./src/app/proxtop');
var settings = require('./src/app/settings');

var mainWindow = null;

var proxApp = new Proxtop(function(release) {
    mainWindow.send('update', release);
});

var appData = {
    name: APP_NAME,
    getWindow: function() { return mainWindow; },
    proxtop: proxApp
};

app.on('window-all-closed', function() {
    if(process.platform != 'darwin') {
        proxApp.finish();
        app.quit();
    }

    mainWindow = null;
});

app.on('activate-with-no-open-windows', function(event) {
    event.preventDefault();
    createWindow();
});

app.on('ready', function() {
    proxApp.init().then(createWindow);
});

function createWindow() {
    LOG.verbose('Opening new window');
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        'auto-hide-menu-bar': true
    });

    mainWindow.loadUrl('file://' + INDEX_LOCATION);
    mainWindow.on('closed', function() {
        mainWindow = null;
    });
}

module.exports = appData;
