#!/usr/bin/env node

import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWatch = process.argv.includes('--watch');

/**
 * ESBuild configuration for bundling all modules into a single IIFE
 */
const buildConfig = {
  entryPoints: ['scripts/main.js'],
  bundle: true,
  format: 'iife',
  globalName: 'Website2025',
  outfile: 'dist/bundle.min.js',
  minify: true,
  sourcemap: true,
  target: ['es2020'],
  platform: 'browser',
  resolveExtensions: ['.js', '.ts'],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  banner: {
    js: `/* Website 2025 - Bundled ${new Date().toISOString()} */`
  },
  plugins: [
    {
      name: 'console-info',
      setup(build) {
        build.onStart(() => {
          console.log('\n🔨 Building bundle...');
        });
        
        build.onEnd((result) => {
          if (result.errors.length > 0) {
            console.error('❌ Build failed with errors:');
            result.errors.forEach(error => console.error(error));
          } else {
            console.log('✅ Bundle built successfully!');
            
            // Show bundle size
            try {
              const stats = fs.statSync('dist/bundle.min.js');
              const fileSizeInBytes = stats.size;
              const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);
              console.log(`📦 Bundle size: ${fileSizeInKB} KB`);
            } catch (e) {
              // File might not exist yet
            }
          }
          
          if (result.warnings.length > 0) {
            console.warn('⚠️  Build warnings:');
            result.warnings.forEach(warning => console.warn(warning));
          }
        });
      }
    }
  ]
};

/**
 * Creates the dist directory if it doesn't exist
 */
function ensureDistDirectory() {
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
    console.log('📁 Created dist directory');
  }
}

/**
 * Builds the bundle
 */
async function build() {
  try {
    ensureDistDirectory();
    
    if (isWatch) {
      console.log('👀 Starting watch mode...');
      const ctx = await esbuild.context(buildConfig);
      await ctx.watch();
      
      // Also watch for changes in modules directory
      console.log('🔍 Watching for file changes...');
      chokidar.watch(['scripts/**/*.js'], {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true
      }).on('change', path => {
        console.log(`🔄 File changed: ${path}`);
      });
      
    } else {
      await esbuild.build(buildConfig);
    }
    
  } catch (error) {
    console.error('❌ Build error:', error);
    process.exit(1);
  }
}

/**
 * Generates an HTML file that includes the bundled script for testing
 */
function generateTestHTML() {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website 2025 - Bundled Version</title>
    <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
    <div id="main-content">
        <h1>Website 2025 - Bundled Version</h1>
        <p>This page uses the bundled and minified JavaScript.</p>
        <div id="loading-text">Loading...</div>
    </div>
    
    <script src="bundle.min.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), htmlContent);
  console.log('📄 Generated test HTML file: dist/index.html');
}

// Run the build
build().then(() => {
  if (!isWatch) {
    generateTestHTML();
    console.log('\n🎉 Build complete!');
    console.log('💡 To test the bundle, serve the dist/ directory or open dist/index.html');
    console.log('💡 To watch for changes, run: npm run build:watch');
  }
});
