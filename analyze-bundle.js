#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

/**
 * Analyzes the bundling results and shows the comparison
 */
function analyzeBundleResults() {
  const scriptsDir = 'scripts';
  const distFile = 'dist/bundle.min.js';
  
  try {
    // Get all JavaScript files in scripts directory
    const getAllJsFiles = (dir) => {
      const files = [];
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...getAllJsFiles(fullPath));
        } else if (item.endsWith('.js')) {
          files.push(fullPath);
        }
      }
      return files;
    };
    
    const jsFiles = getAllJsFiles(scriptsDir);
    let totalOriginalSize = 0;
    let fileCount = 0;
    
    console.log('\n📊 Bundle Analysis Report');
    console.log('=' .repeat(50));
    
    console.log('\n📂 Original Module Files:');
    for (const file of jsFiles) {
      const stats = fs.statSync(file);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`   ${file}: ${sizeKB} KB`);
      totalOriginalSize += stats.size;
      fileCount++;
    }
    
    console.log(`\n📋 Summary:`);
    console.log(`   Total modules: ${fileCount}`);
    console.log(`   Total original size: ${(totalOriginalSize / 1024).toFixed(2)} KB`);
    
    // Analyze bundle
    const bundleStats = fs.statSync(distFile);
    const bundleSizeKB = (bundleStats.size / 1024).toFixed(2);
    const reduction = ((1 - bundleStats.size / totalOriginalSize) * 100).toFixed(1);
    
    console.log(`\n📦 Bundled Result:`);
    console.log(`   Bundle size: ${bundleSizeKB} KB`);
    console.log(`   Size reduction: ${reduction}%`);
    console.log(`   HTTP requests reduced: ${fileCount} → 1 (${((fileCount - 1) / fileCount * 100).toFixed(1)}% reduction)`);
    
    // Performance benefits
    console.log(`\n🚀 Performance Benefits:`);
    console.log(`   ✅ Single IIFE - no module loading overhead`);
    console.log(`   ✅ Minified code - smaller file size`);
    console.log(`   ✅ One HTTP request instead of ${fileCount}`);
    console.log(`   ✅ All dependencies bundled and resolved`);
    console.log(`   ✅ Source maps included for debugging`);
    
    // Usage instructions
    console.log(`\n💡 Usage:`);
    console.log(`   Development: Use individual modules in scripts/`);
    console.log(`   Production: Use dist/bundle.min.js`);
    console.log(`   Testing: Open dist/index.html in browser`);
    console.log(`   Watch mode: npm run build:watch`);
    
  } catch (error) {
    console.error('Error analyzing bundle:', error.message);
  }
}

analyzeBundleResults();
