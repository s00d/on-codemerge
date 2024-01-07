import path from "path";
import fs from "fs";

const distFolderPath = './packages';
const packageJsonPath = './package.json';

function generateExports() {
  const exports = {};

  // Чтение файлов и папок в директории dist/plugins
  const files = fs.readdirSync(distFolderPath, { withFileTypes: true });

  files.forEach(file => {
    if (file.isDirectory()) {
      const pluginName = file.name;
      // @ts-ignore
      exports[`./${pluginName}`] = {
        import: `./dist/plugins/${pluginName}.esm.js`,
        require: `./dist/plugins/${pluginName}.cjs.js`,
        browser: `./dist/plugins/${pluginName}.iife.js`,
        types: `./dist/types/packages/${pluginName}/src/index.d.ts`
      };
    }
  });

  return exports;
}

function updatePackageJsonExports() {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const newExports = generateExports();

  packageJson.exports = { ...packageJson.exports, ...newExports };
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

updatePackageJsonExports();
