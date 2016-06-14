const request = require('request-promise');
const _ = require('lodash');
const utils = require('./utils');
const db = require('./db');

class Updater {
    constructor(check_url) {
        this.check_url = check_url;
        this.settings = db.get('updater');
        this.limited = this.settings.find({ name: 'limited' });
        this.has_noticed = false;
        this.timer = null;
        if(!this.limited) {
            this.limited = { value: false, release_time: 0, name: 'limited' };
            this.settings.push(this.limited);
        }
    }

    start(current, callback) {
        this.currentVersion = current;
        this.callback = callback;
        setTimeout(() => {
            this.check();
        }, 1000);
    }

    stop() {
        clearTimeout(this.timer);
    }

    stopBothering() {
        this.has_noticed = true;
    }

    saveLimitation() {
        this.settings.chain().find({ name: 'limited' }).assign(this.limited).value();
    }

    isLimited() {
        if(!this.limited || (this.limited && !this.limited.value)) {
            return false;
        }

        const isReleased = this.limited.release_time * 1000 < new Date().getTime();
        if(isReleased) {
            this.limited.value = false;
            this.limited.release_time = 0;
            this.saveLimitation();
            return false;
        }

        return true;
    }

    check() {
        const self = this;
        LOG.verbose('Running update check...');
        if(this.isLimited()) {
            LOG.verbose("Still rate limited. Skipping.");
            return;
        }

        if(this.has_noticed) {
            LOG.verbose("User already knows, no need to check.");
            return;
        }

        request({
            url: self.check_url,
            headers: {
                'User-Agent': 'proxtop-' + this.currentVersion
            }
        }).then(JSON.parse).then(function(releases) {
            return utils.findLatestRelease(releases, self.currentVersion);
        }).then((update) => {
            LOG.verbose('Update available? ' + (update ? 'Yes' : 'No'));
            if(update) {
                self.callback(update);
                this.stopBothering();
            }
        }).then(() => {
            this.timer = setTimeout(() => {
                this.check();
            }, UPDATE_INTERVALL);
        }).catch(function(e) {
            if(e.statusCode == 403) {
                LOG.warn("GitHub API limit reached.");
                self.limited.value = true;
                self.limited.release_time = parseInt(e.response.headers['x-ratelimit-reset']);
                self.saveLimitation();
            } else {
                LOG.error("There was an issue doing github update check:", {
                    error: e
                });
            }
        });
    }
}

module.exports = Updater;
