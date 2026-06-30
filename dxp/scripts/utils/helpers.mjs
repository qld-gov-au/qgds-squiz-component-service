import fs from 'node:fs';
import path from 'node:path';
import { fork } from 'node:child_process';
import { RED, NC } from './styles.mjs';

export function checkNodeVersion(minArray) {
  const current = process.versions.node.split('.').map(Number);
  
  // Logic to compare major.minor.patch
  for (let i = 0; i < 3; i++) {
    if (current[i] > minArray[i]) break; // Newer version
    if (current[i] < minArray[i]) {      // Older version
      console.error(`${RED}Error: Node.js v${minArray.join('.')} or higher is required.${NC}`);
      process.exit(1); 
    }
  }
}

export function getPackageVersion(packageName) {
  try {
    // 1. Get the path to node_modules (usually in the project root)
    const nodeMods = path.join(process.cwd(), 'node_modules');
    
    // 2. Point directly to the package's own package.json
    const packageJsonPath = path.join(nodeMods, packageName, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      const data = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return data.version || '';
    }
  } catch (e) {
    // Silent fail if directory doesn't exist or JSON is invalid
  }
  return '';
}

export function requiredPackageInstalled(packageName) {
  const version = getPackageVersion(packageName);
  
  if (!version) {
    console.error(`${RED}✗ Error: ${packageName} is not installed. Cannot proceed. Run 'npm install ${packageName}'${NC}`);
    process.exit(1);
  }
  
  return version;
}

export function walkDir(dir, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(res, callback);
    } else {
      // Pass 'dir' so the callback knows the parent folder
      callback(res, entry.name, dir);
    }
  }
}

// Helper to wrap fork in a Promise for await-ability
export const runScript = (scriptPath) => new Promise((resolve) => {
  const child = fork(scriptPath, [], { stdio: 'inherit' });
  child.on('close', resolve);
});