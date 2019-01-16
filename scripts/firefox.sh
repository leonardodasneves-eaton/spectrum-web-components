#!/usr/bin/env bash

set -e

TARGET_URL=$1
FIREFOX_HOME=$PWD/.firefox
PREFS_FILE=$FIREFOX_HOME/prefs.js

cleanup() {        
    rm -rf $FIREFOX_HOME
}

# listen for exit signals and trigger kill of background PID, wait a moment and then cleanup
trap 'kill -TERM $PID && sleep 0.5 && cleanup' EXIT TERM INT

# clean just in case of a bad exit previously
cleanup

# make the home folder
mkdir -p $FIREFOX_HOME

# write the prefs file
cat >$PREFS_FILE <<EOL
user_pref("browser.startup.homepage_override.buildID", "20190108160530");
user_pref("browser.startup.homepage_override.mstone", "64.0.2");
user_pref('browser.shell.checkDefaultBrowser', false);
user_pref('browser.bookmarks.restore_default_bookmarks', false);
user_pref('dom.disable_open_during_load', false);
user_pref('dom.max_script_run_time', 0);
user_pref('dom.min_background_timeout_value', 10);
user_pref('browser.tabs.remote.autostart', false);
user_pref('browser.tabs.remote.autostart.2', false);
user_pref('extensions.enabledScopes', 15);
EOL

PROFILE_PATH=$FIREFOX_HOME
# are we in a linux with /proc/version?
if [ -f /proc/version ]; then
    # are we in WSL?
    if grep -q Microsoft /proc/version; then
        # generate wsl path if in WSL
        PROFILE_PATH=$(wslpath -m $FIREFOX_HOME)
    fi
fi

# launch firefox and grab the PID
"$FIREFOX_BIN" -profile $PROFILE_PATH -no-remote $1 &
PID=$!

# wait on the process to exit
wait $PID

# cleanup just for good measure and pass back the exit code from firefox
cleanup
exit $?
