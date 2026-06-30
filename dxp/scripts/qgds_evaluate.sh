#!/bin/bash

# Move the terminal context to the script's own folder
cd "$(dirname "$0")"

# Configuration
PACKAGE_NAME="@qld-gov-au/qgds-bootstrap5"
CACHE_FILE="../lib/qgds-bootstrap5/.qgds_version_cache"
PRECOMPILED_DIR="../lib/qgds-bootstrap5/precompiled"

# Get the currently installed version of the QGDS package
CURRENT_VERSION=$(npm list $PACKAGE_NAME --depth=0 | grep $PACKAGE_NAME | cut -d@ -f3 | awk '{print $1}')

# If the package isn't installed at all, exit
if [ -z "$CURRENT_VERSION" ]; then
    exit 0
fi

# Get the last version we successfully processed
if [ -f "$CACHE_FILE" ]; then
    LAST_VERSION=$(cat "$CACHE_FILE")
else
    LAST_VERSION=""
fi

# Check if the precompiled folder is missing
# If it is missing, we set LAST_VERSION to empty to force the script to run
if [ ! -d "$PRECOMPILED_DIR" ]; then
    LAST_VERSION=""
fi

# Only run the update if the version has changed OR folder is missing
if [ "$CURRENT_VERSION" != "$LAST_VERSION" ]; then

    # RUN THE UPDATE SCRIPT
    bash ./qgds_update.sh
    
    # If the update succeeded, save the new version to the cache
    if [ $? -eq 0 ]; then
        echo "$CURRENT_VERSION" > "$CACHE_FILE"
    fi
else
    # Versions match and folder exists; do nothing
    exit 0
fi