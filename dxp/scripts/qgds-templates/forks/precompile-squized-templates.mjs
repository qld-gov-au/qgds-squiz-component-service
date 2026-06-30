#!/usr/bin/env node

//#Build QGDS templates

import { rmSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, basename, relative, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import {squizedHbs} from './helpers/squizedHbs.mjs';
import { GREEN, RED, BLUE, LINE, NC, BOLD } from '../../utils/styles.mjs';
import { requiredPackageInstalled, walkDir } from '../../utils/helpers.mjs';

// 1. Check if QGDS is installed and get its version (also serves as a sanity check for node_modules access)
const packageName = '@qld-gov-au/qgds-bootstrap5';
const currentVersion = requiredPackageInstalled(packageName);

//2. Introduction Log
console.log(`\n${BLUE}${BOLD}✨ DXP QGDS-Boostrap5 V${currentVersion} Generate Precompiled Squized Templates!${NC}\n`);

// 3. Path Resolution
const ROOT              = process.cwd();
const QGDS_LIB          = join(ROOT, 'dxp', 'lib', 'qgds-bootstrap5');
const srcDir            = join(ROOT, 'node_modules', '@qld-gov-au', 'qgds-bootstrap5', 'dist', 'assets', 'components', 'bs5');
const outSquizedDir     = join(QGDS_LIB, 'templates', 'squized');
const outPrecompiledDir = join(QGDS_LIB, 'templates', 'precompiled');
const outFile           = join(QGDS_LIB, 'templates', '_registry.ts');

// 4. File Operations (Clean and Prep)
rmSync(outSquizedDir, { recursive: true, force: true });
mkdirSync(outSquizedDir, { recursive: true });
rmSync(outPrecompiledDir, { recursive: true, force: true });
mkdirSync(outPrecompiledDir, { recursive: true });

// 5. Template Processing
let hadError = 0;
const registryEntries = [];

walkDir(srcDir, (filePath, fileName, parentDir) => {

  if (fileName.endsWith('.hbs') && !fileName.endsWith('.test.hbs')) {
    const fileBase = basename(fileName, '.hbs');
    
    // Get the path relative to srcDir (e.g., "callout" or "callout/x")
    const relativeFolder = relative(srcDir, parentDir);
    
    // Get the immediate parent folder name (e.g., "callout" or "x")
    const immediateParent = basename(parentDir);

    // Determine the Registry Key
    // If filename matches parent (callout/callout), use "callout"
    // Otherwise, keep the tree (callout/callouts -> "callout/callouts")
    const registryKey = (fileBase === immediateParent && relativeFolder === fileBase)
      ? fileBase
      : join(relativeFolder, fileBase).replace(/\\/g, '/'); // Force forward slashes for registry

    const targetHbs = join(outSquizedDir, `${registryKey}.hbs`);
    const targetJs  = join(outPrecompiledDir, `${registryKey}.js`);

    try {

      // Create the specific subfolders for this template if they don't exist
      // This is crucial for paths like 'callout/callouts'
      if (registryKey !== fileBase) {
        mkdirSync(dirname(targetHbs), { recursive: true });
        mkdirSync(dirname(targetJs), { recursive: true });
      }

      

      //Generate Squized template
      const content = readFileSync(filePath, 'utf8');
      const squized = squizedHbs(content);
      
      writeFileSync(targetHbs, squized);
      
      // Compile the template
      execSync(`npx handlebars "${targetHbs}" -e hbs -n Handlebars.templates -f "${targetJs}" -m`, { 
        stdio: 'inherit', 
        // shell:true for Windows compatibility with npx
        shell: true 
      });

      // Add to registry 
      registryEntries.push(`  "${registryKey}": () => import("@qgds/lib/templates/precompiled/${registryKey}"),`);
      console.log(`  ${GREEN}✓${NC} Processed template: ${BOLD}${registryKey}${NC}`);

    } catch (e) {
      console.error(`  ${RED}⚠ Skipping: Failed to process template: ${registryKey}${NC}`);
      console.error(`    ${RED}●${NC} ${e.message}${NC}`);
      hadError += 1;
    }
  }
});


// 6. Check if we found at least one valid .hbs file (in case the QGDS folder structure changes in the future)
if (registryEntries.length === 0) {
    console.error(`${RED}✗ Error: No valid .hbs templates were found in ${srcDir} (excluding *test.hbs)${NC}`);
    hadError = 'all';
}else{
// 7. Save Registry
  const registryContent = `export default {\n${registryEntries.join('\n')}\n};\n`;
  writeFileSync(outFile, registryContent); 
}

// 8. Final Report
  if (hadError === 0) {
    console.log(`\n${GREEN}${BOLD}✅ Template Generation Complete!${NC}`);
    console.log(`   ${GREEN}●${NC} ${BOLD}Processed ${registryEntries.length} templates${NC}`);
  } else 
  if(hadError === 'all') {
    console.error(`\n${RED}${BOLD}✗ Template Generation Failed!${NC}`);
    console.log(`   ${RED}●${NC} No templates were found.${NC}`);
  } else 
  if(hadError > 0) {
    console.error(`\n${RED}${BOLD}✗ Template Generation Processed with Errors!${NC}`);
    console.error(`   ${RED}●${NC} ${BOLD}${hadError} out of ${registryEntries.length + hadError} templates failed to process${NC}`);
  }
  console.log(LINE);
  process.exit(hadError === 0 ? 0 : 1);
