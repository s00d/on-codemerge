#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to locales folder
const localesPath = path.join(__dirname, '../src/core/services/locales');
const srcPath = path.join(__dirname, '../src');

// Read English file as reference
function readEnglishLocale() {
  const enPath = path.join(localesPath, 'en.json');
  try {
    const content = fs.readFileSync(enPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading en.json:', error.message);
    process.exit(1);
  }
}

// Read locale file
function readLocale(filename) {
  const filePath = path.join(localesPath, filename);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    return null;
  }
}

// Get list of all locale files
function getLocaleFiles() {
  try {
    const files = fs.readdirSync(localesPath);
    return files.filter(file => file.endsWith('.json') && file !== 'en.json');
  } catch (error) {
    console.error('Error reading locales folder:', error.message);
    return [];
  }
}

// Find all translation keys used in code
function findTranslationKeys() {
  const translationKeys = new Set();
  const filesChecked = [];
  
  function scanDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and other non-source directories
          if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
            scanDirectory(fullPath);
          }
        } else if (stat.isFile() && /\.(ts|js|vue|tsx|jsx)$/.test(item)) {
          filesChecked.push(fullPath);
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Find .t('key'), editor.t('key'), this.editor.t('key') patterns
          const pattern = /(?:\.|editor\.|this\.editor\.)t\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
          
          let match;
          while ((match = pattern.exec(content)) !== null) {
            const key = match[1];
            if (key && !key.includes('${')) {
              translationKeys.add(key);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error.message);
    }
  }
  
  scanDirectory(srcPath);
  
  return {
    keys: Array.from(translationKeys),
    filesChecked: filesChecked.length
  };
}

// Check if translation keys exist in English locale
function checkTranslationKeys(englishLocale, translationKeys) {
  const missingKeys = [];
  
  for (const key of translationKeys) {
    if (!(key in englishLocale)) {
      missingKeys.push(key);
    }
  }
  
  if (missingKeys.length > 0) {
    console.log(`\n🔍 Translation keys used in code but missing in en.json:`);
    console.log(`   Missing ${missingKeys.length} keys:`);
    missingKeys.forEach(key => {
      console.log(`   ❌ "${key}"`);
    });
    return missingKeys.length;
  } else {
    console.log(`\n✅ All translation keys from code are present in en.json`);
    return 0;
  }
}

// Compare keys between locales
function compareLocales(englishLocale, localeKeys, localeName) {
  const missingKeys = [];
  
  for (const key of Object.keys(englishLocale)) {
    if (!(key in localeKeys)) {
      missingKeys.push(key);
    }
  }
  
  if (missingKeys.length > 0) {
    console.log(`\n🔍 ${localeName}:`);
    console.log(`   Missing ${missingKeys.length} keys:`);
    missingKeys.forEach(key => {
      console.log(`   ❌ "${key}": "${englishLocale[key]}"`);
    });
    return missingKeys.length;
  } else {
    console.log(`\n✅ ${localeName}: All keys present`);
    return 0;
  }
}

// Main function
function main() {
  console.log('🔍 Checking locales and translation keys...\n');
  
  // Read English file
  const englishLocale = readEnglishLocale();
  const englishKeys = Object.keys(englishLocale);
  
  console.log(`📊 Total keys in en.json: ${englishKeys.length}`);
  
  // Find translation keys in code
  console.log('\n🔍 Scanning source code for translation keys...');
  const { keys: translationKeys, filesChecked } = findTranslationKeys();
  console.log(`📁 Scanned ${filesChecked} files`);
  console.log(`🔑 Found ${translationKeys.length} translation keys in code`);
  
  // Show all found keys
  console.log('\n📋 All translation keys found in code:');
  translationKeys.sort().forEach(key => {
    console.log(`   "${key}"`);
  });
  
  // Check if translation keys exist in English locale
  const missingTranslationKeys = checkTranslationKeys(englishLocale, translationKeys);
  
  // Get list of locale files
  const localeFiles = getLocaleFiles();
  
  if (localeFiles.length === 0) {
    console.log('❌ No locale files found');
    return;
  }
  
  console.log(`\n📁 Found locale files: ${localeFiles.length}`);
  
  let totalMissing = 0;
  const results = [];
  
  // Check each locale
  for (const filename of localeFiles) {
    const localeName = filename.replace('.json', '');
    const localeData = readLocale(filename);
    
    if (localeData) {
      const missingCount = compareLocales(englishLocale, localeData, localeName);
      totalMissing += missingCount;
      results.push({ locale: localeName, missing: missingCount });
    }
  }
  
  // Final statistics
  console.log('\n📈 FINAL STATISTICS:');
  console.log('='.repeat(50));
  
  if (totalMissing === 0 && missingTranslationKeys === 0) {
    console.log('🎉 All locales are synchronized and all translation keys are present!');
  } else {
    if (missingTranslationKeys > 0) {
      console.log(`⚠️  Missing translation keys in en.json: ${missingTranslationKeys}`);
    }
    if (totalMissing > 0) {
      console.log(`⚠️  Total missing keys in other locales: ${totalMissing}`);
    }
    
    console.log('\n📋 Locale details:');
    
    results
      .filter(r => r.missing > 0)
      .sort((a, b) => b.missing - a.missing)
      .forEach(result => {
        console.log(`   ${result.locale}: ${result.missing} keys`);
      });
  }

}

// Run script
main(); 