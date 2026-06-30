import { existsSync, readFileSync, mkdirSync, writeFileSync, unlinkSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Find current test versions from config.json
const ROOT = process.cwd();
const QGDS_LIB              = join(ROOT, 'dxp', 'lib', 'qgds-bootstrap5');
const configFile            = join(QGDS_LIB, 'config.json');
const configJson            = existsSync(configFile) ? JSON.parse(readFileSync(configFile, 'utf8')) : {};
const testVersions          = configJson.testVersions || [];
const currentVersion        = configJson.currentVersion;

console.log('Current Version:', currentVersion);
console.log('Test Versions:', testVersions);

// Build target paths directly from the project ROOT folder
const TARGET_DIR            = join(ROOT, 'dxp', 'assets', 'preview');
const TEMPLATE_DIR          = join(ROOT, 'dxp', 'scripts', 'preview-templates');
const COMPONENT_SERVICE_DIR = join(ROOT, 'dxp', 'component-service');


// Recursive function to find all manifest.json files, ignoring '.dxp'
function findManifestFiles(dir, manifestList = []) {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      if (file === '.dxp') continue; // Explicitly skip the .dxp subdirectory

      const resPath = join(dir, file);
      const stat = statSync(resPath);

      if (stat.isDirectory()) {
        findManifestFiles(resPath, manifestList);
      } else if (file === 'manifest.json') {
        manifestList.push(resPath);
      }
    }
  } catch (error) {
    console.error(`⚠️ Warning reading directory ${dir}:`, error.message);
  }
  return manifestList;
}

// Function to update the previews object inside a manifest file
function updateManifestPreviews(manifestPath) {
  try {
    const manifestData = JSON.parse(readFileSync(manifestPath, 'utf8'));
    
    // 1. Initialize the new previews object structure
    const newPreviews = {};

    // 2. Add the "default" block using currentVersion (if it exists)
    if (currentVersion) {
      newPreviews["default"] = {
        autoReload: true,
        functionData: {
          main: {
            inputData: {
              type: "file",
              path: "example.data.json"
            },
            wrapper: {
              path: `../../assets/preview/QGDS-${currentVersion}.html`
            }
          }
        }
      };
      newPreviews["default-QLDGov"] = {
        autoReload: true,
        functionData: {
          main: {
            inputData: {
              type: "file",
              path: "example.data.json"
            },
            wrapper: {
              path: `../../assets/preview/QLDGov-${currentVersion}.html`
            }
          }
        }
      };
    }



    // 3. Add QLDGov and QGDS blocks for each version in the testVersions array
    for (const version of testVersions) {
      const versionStr = version.toString();
      if (versionStr === currentVersion) continue;

      const versionKey = versionStr.replace(/\./g, '-'); // Replace dots with dashes for keys
      newPreviews[`QLDGov_${versionKey}`] = {
        autoReload: true,
        functionData: {
          main: {
            inputData: {
              type: "file",
              path: "example.data.json"
            },
            wrapper: {
              path: `../../assets/preview/QLDGov-${versionStr}.html`
            }
          }
        }
      };

      newPreviews[`QGDS_${versionKey}`] = {
        autoReload: true,
        functionData: {
          main: {
            inputData: {
              type: "file",
              path: "example.data.json"
            },
            wrapper: {
              path: `../../assets/preview/QGDS-${versionStr}.html`
            }
          }
        }
      };
    }

    // 4. Overwrite/assign the previews key and preserve existing formatted spacing
    manifestData.previews = newPreviews;
    writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), 'utf8');
    console.log(`Updated manifest previews: ${manifestPath}`);

  } catch (error) {
    console.error(`❌ Error updating manifest at ${manifestPath}:`, error.message);
  }
}

function runFork() {
  try {
    // Step A: Ensure target directory exists, or create it if missing
    if (!existsSync(TARGET_DIR)) {
      mkdirSync(TARGET_DIR, { recursive: true });
    }

    // Step B: Clean out all existing .html files in the target directory
    const existingFiles = readdirSync(TARGET_DIR);
    for (const file of existingFiles) {
      if (file.endsWith('.html')) {
        unlinkSync(join(TARGET_DIR, file));
      }
    }
    console.log(`Successfully cleared existing HTML files in: ${TARGET_DIR}`);

    // Step C: Read the template contents upfront
    const qgdsTemplatePath = join(TEMPLATE_DIR, 'QGDS-preview.html');
    const qldGovTemplatePath = join(TEMPLATE_DIR, 'QLDGov-preview.html');

    if (!existsSync(qgdsTemplatePath) || !existsSync(qldGovTemplatePath)) {
      throw new Error('Required template files are missing from preview-templates directory.');
    }

    const qgdsContent = readFileSync(qgdsTemplatePath, 'utf8');
    const qldGovContent = readFileSync(qldGovTemplatePath, 'utf8');

    // Step D: Generate 2 new HTML files for each test version
    for (const version of testVersions) {
      const finalQgdsContent = qgdsContent.replaceAll('{{{version}}}', version.toString());
      const qgdsFileName = `QGDS-${version}.html`;
      writeFileSync(join(TARGET_DIR, qgdsFileName), finalQgdsContent, 'utf8');

      const finalQldGovContent = qldGovContent.replaceAll('{{{version}}}', version.toString());
      const qldGovFileName = `QLDGov-${version}.html`;
      writeFileSync(join(TARGET_DIR, qldGovFileName), finalQldGovContent, 'utf8');

      console.log(`Generated: ${qgdsFileName} & ${qldGovFileName}`);
    }

    // Step E: Find and update manifest files dynamically
    console.log(`Searching for manifest.json files in: ${COMPONENT_SERVICE_DIR}`);
    const manifests = findManifestFiles(COMPONENT_SERVICE_DIR);
    
    if (manifests.length === 0) {
      console.log('⚠️ No manifest.json files found matching criteria.');
    } else {
      for (const manifestPath of manifests) {
        updateManifestPreviews(manifestPath);
      }
    }

    console.log('✨ Preview fork setup and manifest injection completed successfully!');
  } catch (error) {
    console.error('❌ Error executing preview script fork:', error.message);
    process.exit(1);
  }
}

runFork();
