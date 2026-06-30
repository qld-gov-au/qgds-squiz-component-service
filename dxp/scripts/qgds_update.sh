#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

#GQDS Version 
GQDS_VERSION=$(npm list @qld-gov-au/qgds-bootstrap5 --depth=0 | grep @qld-gov-au/qgds-bootstrap5 | cut -d@ -f3 | awk '{print $1}')

# Start message
echo -e "${BLUE}▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬${NC}"
echo ""
echo -e "${BLUE}     ${BOLD}🎨 DXP QGDS-Boostrap5 V.$GQDS_VERSION templates Update ${NC}"
echo -e "${GREEN}${BOLD}"
echo -e "      ____  __  __ ____      ___   ____ ____  ____   "
echo -e "     |  _ \\ \ \/ /|  _ \    / _ \ / ___|  _ \/ ___| "
echo -e "     | | | \ \  / | |_) |  | | | | |  _| | | \___ \  "
echo -e "     | |_| / /  \ |  __/   | |_| | |_| | |_| |___) | "
echo -e "     |____/_/\_\_\|_|       \__\_\ \___|____/|____/  "
echo ""
echo ""
echo -e "${BLUE}▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬${NC}"
echo ""

# Move the terminal context to the script's own folder
cd "$(dirname "$0")"

# Paths 
NODE_MODS=$(npm root)
BASE_DIR="$NODE_MODS/@qld-gov-au/qgds-bootstrap5/dist/assets/components"
SRC_DIR="$BASE_DIR/bs5"
OUT_DIR="../lib/qgds-bootstrap5/precompiled"
OUT_FILE="$OUT_DIR/../_registry.js"

# Check if source directory exists before proceeding
if [ ! -d "$SRC_DIR" ]; then
    echo -e "${RED}Error: Source directory $SRC_DIR does not exist.${NC}"
    echo "Check if @qld-gov-au is installed."
    exit 1
fi

# Remove the directory and its contents if it exists, then create a fresh copy to remove old files and ensure a clean slate. This prevents depreciated templates from remaining in the registry if they are removed from the repo.
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

# Start writing the file (with error check)
if ! echo "export default {" > "$OUT_FILE"; then
    echo -e "${RED}Error: Could not write to $OUT_FILE.${NC}"
    exit 1
fi

# Track if any errors occur
HAD_ERROR=0

# Loop through folders in the bs5 directory
for dir in "$SRC_DIR"/*/; do
    if [ -d "$dir" ]; then
        folder_name=$(basename "$dir")
        
        # Find all .hbs files that do NOT end in test.hbs
        hbs_files=$(find "$dir" -maxdepth 2 -name "*.hbs" ! -name "*test.hbs")

        # Check if we found at least one valid .hbs file
        if [ -n "$hbs_files" ]; then
            # Loop through every file found in this folder
            for hbs_file in $hbs_files; do
                # Get the filename without extension (e.g., 'callout' or 'large')
                file_base=$(basename "$hbs_file" .hbs)

                # Finds the .hbs file and outputs a .js file in precompiled
                if npx handlebars "$hbs_file" -e hbs -n Handlebars.templates -f "$OUT_DIR/$file_base.js" -m; then
                    # Append entry using static alias pattern
                    echo "  \"$file_base\": () => import(\"@qgdslib/precompiled/$file_base\")," >> "$OUT_FILE"
                    echo -e "  ${GREEN}✓${NC} Processed template: $file_base"
                else
                    echo -e "  ${RED}✗ FAILED to process template: $file_base${NC}"
                    HAD_ERROR=1
                    break 2 # Break both inner and outer loops
                fi
            done
        else
            echo -e "  ${RED}✗ Error: No valid .hbs files found in $dir (excluding *test.hbs)${NC}"
            HAD_ERROR=1
            break
        fi
    fi
done

# Close the object
echo "};" >> "$OUT_FILE"

echo "-----------------------------------------------"
# --- Success/Failure Message ---

if [ $HAD_ERROR -eq 0 ]; then
    echo -e "\n${GREEN}${BOLD}✨ DXP QGDS-Boostrap5 V.$GQDS_VERSION templates Update Complete!${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "     ${GREEN}●${NC} ${BOLD}Registry:${NC} Generated registry"
    echo -e "     ${GREEN}●${NC} ${BOLD}Handlebars:${NC} Precompiled templates"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
else
    echo -e "\n${RED}${BOLD}❌ DXP QGDS-Boostrap5 V.$GQDS_VERSION templates Update Failed!${NC}"
    echo -e "Check the logs above for the failed templates.\n"
    exit 1
fi 