const startup = require('./src/app/squirrel_startup.js');
if(startup()) {
    return;
}

require('./src/app/global');
const { app } = require('electron');
LOG.verbose('Running on ' + process.versions['electron'] + ' on chrome ' + process.versions['chrome']);
LOG.verbose('Making sure app dir exists...');
require('./src/app/util/utils').createDirIfNotExists(APP_DIR);

const Proxtop = require('./src/app/proxtop');
const windowManager = require('./src/app/ui/window_manager');
const UpdaterProvider = require('./src/app/updater');
const tray = require('./src/app/ui/tray_manager');
const translate = require('./src/app/translation');
const path = require('path');

translate.load({
    path: path.join(__dirname, 'src', 'locale'),
    prefix: 'locale-',
    suffix: '.json'
});

LOG.verbose('Initializing...');
const updater = UpdaterProvider();

windowManager.setDirs({
    app: APP_DIR,
    logo: LOGO_LOCATION,
    index: INDEX_LOCATION
});

tray.icon = LOGO_LOCATION;

const apiKey = process.env['PROXTOP_API_KEY'] || "api_key_here";
const proxtop = new Proxtop(app, updater, {
    app_dir: APP_DIR,
    api_key: apiKey
});

app.on('ready', function() {
    LOG.verbose('Starting up...');
    proxtop.start().then(function() {
        LOG.verbose('Off we go!');
    });
});

module.exports = proxtop;
