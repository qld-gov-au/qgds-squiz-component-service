#!/usr/bin/env node

/**
 * Evaluate the need to run the build script for QGDS templates 
 * based on version changes or missing folders.
 */

import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { requiredPackageInstalled, runScript } from '../utils/helpers.mjs';
import { GREEN, BLUE, NC, BOLD } from '../utils/styles.mjs';

// 1. Setup paths
const ROOT = process.cwd();
const QGDS_LIB              = join(ROOT, 'dxp', 'lib', 'qgds-bootstrap5');
const configFile             = join(QGDS_LIB, 'config.json');
const templateDir           = join(QGDS_LIB, 'templates');
const jsDir                 = join(QGDS_LIB, 'js');
const cssDir                = join(QGDS_LIB, 'css');
const forks                 = join(import.meta.dirname, 'forks');

//2. Check if QGDS is installed and get its version (also serves as a sanity check for node_modules access)
const packageName = '@qld-gov-au/qgds-bootstrap5';
const currentVersion = requiredPackageInstalled(packageName);


//3. Evaluation Logic
let shouldBuild = false;
const configJson = existsSync(configFile) ? JSON.parse(readFileSync(configFile, 'utf8')) : {};

if (!existsSync(templateDir) || !existsSync(cssDir) || !existsSync(jsDir)) {
  // Condition 1: Folder is missing. Build is mandatory.
  shouldBuild = true;
} else {
  // Condition 2: Compare current version with cached version
  if (currentVersion !== configJson.currentVersion) {
    shouldBuild = true;
  }
}

// 4. Execution 
if (shouldBuild) {

  // Print Header
  console.log(`${BLUE}▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬${NC}`);
  console.log("");
  console.log(`${BLUE}     ${BOLD}🎨 DXP QGDS-Boostrap5 V${currentVersion} Configuration ${NC}`);
  console.log(`${GREEN}${BOLD}`);
  console.log(`      ____  __  __  ____        ___    ____  ____   ____  `);
  console.log(`     |  _ \\ \\ \\/ / |  _ \\      / _ \\  / ___||  _ \\ / ___| `);
  console.log(`     | | | \\ \\  /  | |_) |    | | | || |  _ | | | |\\___ \\ `);
  console.log(`     | |_| / /  \\  |  __/     | |_| || |_| || |_| | ___) |`);
  console.log(`     |____/ /_/\\_\\ |_|         \\__\\_\\ \\____||____/ |____/ `);
  console.log("");
  console.log("");
  console.log(`${BLUE}▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬${NC}`);
  console.log("");

  // Step 1: Run the Template Build (Handlebars)
  const precompileCode = await runScript(join(forks, 'precompile-squized-templates.mjs'));
  if (precompileCode !== 0) process.exit(precompileCode);

  // Step 2: Run the Asset Clone (CSS/JS)
  const assetCode = await runScript(join(forks, 'clone-assets.mjs'));
  if (assetCode !== 0) process.exit(assetCode);

  // Step 3: Success! Update the version cache
  configJson.currentVersion = currentVersion;
  configJson.testVersions = configJson.testVersions || [];
  if (!configJson.testVersions.includes(currentVersion)) {
    configJson.testVersions.push(currentVersion);
    configJson.testVersions.sort((a, b) => a.localeCompare(b));
  }
  mkdirSync(dirname(configFile), { recursive: true });
  writeFileSync(configFile, JSON.stringify(configJson, null, 2), 'utf8');

  // Step 4: Adjust Previews
  const previewCode = await runScript(join(forks, 'preview-templates.mjs'));
  if (previewCode !== 0) process.exit(previewCode);

  process.exit(0);
  
} else {
  // Already up to date
  process.exit(0);
}