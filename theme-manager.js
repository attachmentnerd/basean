#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');
const crypto = require('crypto');
const semver = require('semver');

class ThemeManager {
  constructor() {
    this.rootDir = process.cwd();
    this.exportDir = path.join(this.rootDir, 'exports');
    this.configFile = path.join(this.rootDir, 'theme-versions.json');
    this.changelogFile = path.join(this.rootDir, 'CHANGELOG.md');
    
    this.ensureDirectories();
    this.loadConfig();
  }

  ensureDirectories() {
    const dirs = [
      'exports',
      'exports/releases',
      'exports/dev',
      'exports/archive',
      'dist'
    ];
    
    dirs.forEach(dir => {
      fs.ensureDirSync(path.join(this.rootDir, dir));
    });
  }

  loadConfig() {
    if (fs.existsSync(this.configFile)) {
      this.config = fs.readJsonSync(this.configFile);
    } else {
      this.config = {
        themes: {
          website: { currentVersion: '1.0.0', lastRelease: null },
          landing: { currentVersion: '1.0.0', lastRelease: null },
          product: { currentVersion: '1.0.0', lastRelease: null },
          email: { currentVersion: '1.0.0', lastRelease: null }
        },
        sharedVersion: '1.0.0'
      };
      this.saveConfig();
    }
  }

  saveConfig() {
    fs.writeJsonSync(this.configFile, this.config, { spaces: 2 });
  }

  // Version management
  bumpVersion(themeName, releaseType = 'patch') {
    const theme = this.config.themes[themeName];
    if (!theme) {
      throw new Error(`Theme ${themeName} not found`);
    }

    const oldVersion = theme.currentVersion;
    const newVersion = semver.inc(oldVersion, releaseType);
    
    theme.currentVersion = newVersion;
    this.saveConfig();

    console.log(`Bumped ${themeName} from ${oldVersion} to ${newVersion}`);
    return newVersion;
  }

  // Build theme
  async buildTheme(themeName) {
    const buildScript = path.join(this.rootDir, 'build-themes.js');
    const { buildTheme } = require(buildScript);
    
    console.log(`Building ${themeName}...`);
    await buildTheme(themeName);
    console.log(`✓ Build complete`);
  }

  // Export theme
  async exportTheme(themeName, options = {}) {
    const {
      releaseType = 'patch',
      isDev = false,
      message = '',
      skipBuild = false
    } = options;

    // Build theme first
    if (!skipBuild) {
      await this.buildTheme(themeName);
    }

    // Get version
    let version;
    if (isDev) {
      version = `${this.config.themes[themeName].currentVersion}-dev.${Date.now()}`;
    } else {
      version = this.bumpVersion(themeName, releaseType);
    }

    // Prepare export directory
    const exportType = isDev ? 'dev' : 'releases';
    const versionDir = path.join(this.exportDir, exportType, `v${version}`);
    fs.ensureDirSync(versionDir);

    // Get theme info
    const themeDir = path.join(this.rootDir, 'dist', themeName);
    const settingsSchema = fs.readJsonSync(path.join(themeDir, 'config', 'settings_schema.json'));
    const themeInfo = settingsSchema.find(s => s.name === 'theme_info');
    const themeFriendlyName = themeInfo.theme_name.replace(/\s+/g, '-');

    // Update version in theme files
    themeInfo.theme_version = version;
    fs.writeJsonSync(
      path.join(themeDir, 'config', 'settings_schema.json'),
      settingsSchema,
      { spaces: 2 }
    );

    // Create ZIP
    const zipName = `${themeFriendlyName}_${version}.zip`;
    const zipPath = path.join(versionDir, zipName);
    
    await this.createZip(themeDir, zipPath);

    // Generate metadata
    const metadata = {
      theme: themeName,
      version,
      date: new Date().toISOString(),
      releaseType: isDev ? 'development' : releaseType,
      message,
      checksum: await this.generateChecksum(zipPath),
      fileSize: fs.statSync(zipPath).size,
      sharedVersion: this.config.sharedVersion
    };

    fs.writeJsonSync(
      path.join(versionDir, 'metadata.json'),
      metadata,
      { spaces: 2 }
    );

    // Update changelog for releases
    if (!isDev) {
      this.updateChangelog(themeName, version, message);
      this.config.themes[themeName].lastRelease = {
        version,
        date: metadata.date,
        path: zipPath
      };
      this.saveConfig();

      // Create/update latest symlink
      const latestPath = path.join(this.exportDir, exportType, 'latest', themeName);
      fs.ensureDirSync(path.dirname(latestPath));
      if (fs.existsSync(latestPath)) {
        fs.removeSync(latestPath);
      }
      fs.symlinkSync(versionDir, latestPath);
    }

    console.log(`✓ Exported ${themeFriendlyName} v${version} to ${zipPath}`);
    
    return {
      path: zipPath,
      version,
      metadata
    };
  }

  async createZip(sourceDir, destPath) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(destPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  async generateChecksum(filePath) {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    return new Promise((resolve, reject) => {
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  updateChangelog(themeName, version, message) {
    const date = new Date().toISOString().split('T')[0];
    const entry = `\n## [${themeName} v${version}] - ${date}\n\n${message || '- Updated theme'}\n`;
    
    if (fs.existsSync(this.changelogFile)) {
      const content = fs.readFileSync(this.changelogFile, 'utf8');
      const lines = content.split('\n');
      const headerIndex = lines.findIndex(line => line.startsWith('# Changelog'));
      
      if (headerIndex !== -1) {
        lines.splice(headerIndex + 2, 0, entry);
        fs.writeFileSync(this.changelogFile, lines.join('\n'));
      } else {
        fs.appendFileSync(this.changelogFile, entry);
      }
    } else {
      fs.writeFileSync(this.changelogFile, `# Changelog\n\nAll notable changes to this project will be documented in this file.\n${entry}`);
    }
  }

  // List versions
  listVersions(themeName) {
    const releases = path.join(this.exportDir, 'releases');
    const versions = [];

    if (fs.existsSync(releases)) {
      fs.readdirSync(releases).forEach(dir => {
        if (dir.startsWith('v')) {
          const metadataPath = path.join(releases, dir, 'metadata.json');
          if (fs.existsSync(metadataPath)) {
            const metadata = fs.readJsonSync(metadataPath);
            if (!themeName || metadata.theme === themeName) {
              versions.push(metadata);
            }
          }
        }
      });
    }

    return versions.sort((a, b) => 
      semver.compare(b.version, a.version)
    );
  }

  // Archive old versions
  archiveOldVersions(keepCount = 5) {
    const themes = Object.keys(this.config.themes);
    
    themes.forEach(themeName => {
      const versions = this.listVersions(themeName);
      
      if (versions.length > keepCount) {
        const toArchive = versions.slice(keepCount);
        
        toArchive.forEach(version => {
          const sourcePath = path.join(this.exportDir, 'releases', `v${version.version}`);
          const archivePath = path.join(this.exportDir, 'archive', `v${version.version}`);
          
          if (fs.existsSync(sourcePath)) {
            fs.moveSync(sourcePath, archivePath, { overwrite: true });
            console.log(`Archived ${themeName} v${version.version}`);
          }
        });
      }
    });
  }

  // Clean up development builds
  cleanDevBuilds(olderThanDays = 7) {
    const devDir = path.join(this.exportDir, 'dev');
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    if (fs.existsSync(devDir)) {
      fs.readdirSync(devDir).forEach(dir => {
        const dirPath = path.join(devDir, dir);
        const stats = fs.statSync(dirPath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          fs.removeSync(dirPath);
          console.log(`Removed old dev build: ${dir}`);
        }
      });
    }
  }
}

// CLI Interface
async function main() {
  const manager = new ThemeManager();
  const [command, ...args] = process.argv.slice(2);

  try {
    switch (command) {
      case 'export':
        const themeName = args[0];
        const releaseType = args[1] || 'patch';
        const message = args.slice(2).join(' ');
        
        if (!themeName) {
          console.log('Usage: theme-manager export <theme-name> [major|minor|patch] [message]');
          process.exit(1);
        }
        
        await manager.exportTheme(themeName, { releaseType, message });
        break;

      case 'dev':
        const devTheme = args[0];
        if (!devTheme) {
          console.log('Usage: theme-manager dev <theme-name>');
          process.exit(1);
        }
        
        await manager.exportTheme(devTheme, { isDev: true });
        break;

      case 'list':
        const listTheme = args[0];
        const versions = manager.listVersions(listTheme);
        
        console.log('\nReleased Versions:');
        versions.forEach(v => {
          console.log(`  ${v.theme} v${v.version} - ${v.date.split('T')[0]} (${v.releaseType})`);
          if (v.message) console.log(`    ${v.message}`);
        });
        break;

      case 'archive':
        const keepCount = parseInt(args[0]) || 5;
        manager.archiveOldVersions(keepCount);
        break;

      case 'clean':
        const days = parseInt(args[0]) || 7;
        manager.cleanDevBuilds(days);
        break;

      default:
        console.log(`
Kajabi Theme Manager

Commands:
  export <theme> [type] [msg]  Export theme (type: major|minor|patch)
  dev <theme>                  Create development build
  list [theme]                 List versions
  archive [keep-count]         Archive old versions (default: keep 5)
  clean [days]                 Clean old dev builds (default: 7 days)

Examples:
  theme-manager export landing patch "Fixed button styles"
  theme-manager export website major "New design system"
  theme-manager dev landing
  theme-manager list
  theme-manager archive 3
        `);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ThemeManager;