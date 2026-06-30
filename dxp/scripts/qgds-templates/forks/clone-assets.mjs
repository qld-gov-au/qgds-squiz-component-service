#!/usr/bin/env node

//# Clone static JS and CSS assets from QGDS node_modules
import { rmSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { requiredPackageInstalled } from '../../utils/helpers.mjs';
import { join } from 'node:path';
import { GREEN, RED, BLUE, NC, BOLD, LINE } from '../../utils/styles.mjs';

// 1. Check if QGDS is installed and get its version (also serves as a sanity check for node_modules access)
const packageName = '@qld-gov-au/qgds-bootstrap5';
const currentVersion = requiredPackageInstalled(packageName);

// 2. Introduction Log
console.log(`\n${BLUE}${BOLD}🖼️  DXP QGDS-Boostrap5 V${currentVersion} Asset Update!${NC}\n`);

// 3. Path Resolution
const ROOT = process.cwd();
const srcDir = join(ROOT, 'node_modules', '@qld-gov-au', 'qgds-bootstrap5', 'dist', 'assets');
const QGDS_LIB  = join(ROOT, 'dxp', 'lib', 'qgds-bootstrap5');

// 4. Assets to clone (relative to srcDir)
const assets = {
  js: ['qld.bootstrap.min.js', 'qld.bootstrap.min.js.map', 'bootstrap.bundle.min.js', 'bootstrap.bundle.min.js.map'],
  css: ['qld.bootstrap.css', 'qld.bootstrap.css.map']
}

// 5. File Operations (Clean and Prep)
Object.keys(assets).forEach(type => {
  const outDir = join(QGDS_LIB, type);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
});

// 6. Asset Processing
let hadError = 0;
let entries = 0;
try {
  Object.keys(assets).forEach(type => {
    assets[type].forEach(asset => {
      const src = join(srcDir, type, asset);
      const dest = join(QGDS_LIB, type, asset);
      if (existsSync(src)) {
        copyFileSync(src, dest);
        console.log(`  ${GREEN}✓${NC} Cloned: ${BOLD}${type}/${asset}${NC}`);
        entries++;
      } else {
        console.warn(`  ${RED}⚠ Skipping: ${BOLD}${type}/${asset}${NC} (source not found)${NC}`);
        hadError++;
      }
    });
  });

} catch (error) {
  console.error(error.message);
  hadError = 'all'; 
}

// 7. Final Report
  if (hadError === 0) {
    console.log(`\n${GREEN}${BOLD}✅ Asset Update Complete!${NC}`);
    console.log(`   ${GREEN}●${NC} ${BOLD}Processed ${entries} assets${NC}`);
  } else 
  if(hadError === 'all') {
    console.error(`\n${RED}${BOLD}✗ Assets Update Failed!${NC}`);
    console.log(`   ${RED}●${NC} No assets were found.${NC}`);
  } else 
  if(hadError > 0) {
    console.error(`\n${RED}${BOLD}✗ Assets Update Processed with Errors!${NC}`);
    console.error(`   ${RED}●${NC} ${BOLD}${hadError} out of ${entries + hadError} assets failed to clone${NC}`);
  }
  console.log(LINE);
  process.exit(hadError === 0 ? 0 : 1);