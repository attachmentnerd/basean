const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const fs = require('fs');
const path = require('path');

// Compile SCSS into compiled-theme.css
gulp.task('compile-scss', function() {
  return gulp.src('./styles/theme.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'expanded',
      includePaths: ['./styles']
    }).on('error', sass.logError))
    .pipe(autoprefixer({
      cascade: false
    }))
    .pipe(concat('compiled-theme.css'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./assets'));
});

// Merge compiled CSS with original styles.scss.liquid
gulp.task('merge-styles', function(done) {
  const originalPath = path.join(__dirname, 'assets', 'styles.scss.liquid');
  const compiledPath = path.join(__dirname, 'assets', 'compiled-theme.css');
  
  // Read original file
  let originalContent = '';
  if (fs.existsSync(originalPath)) {
    originalContent = fs.readFileSync(originalPath, 'utf8');
  }
  
  // Remove any existing compiled theme styles section
  const markerText = '/* === COMPILED THEME STYLES === */';
  const markerIndex = originalContent.indexOf(markerText);
  if (markerIndex !== -1) {
    originalContent = originalContent.substring(0, markerIndex).trimEnd();
  }
  
  // Read compiled CSS
  let compiledContent = '';
  if (fs.existsSync(compiledPath)) {
    compiledContent = fs.readFileSync(compiledPath, 'utf8');
  }
  
  // Merge: original + compiled
  const mergedContent = originalContent + '\n\n' + markerText + '\n' + compiledContent;
  
  // Write merged content
  fs.writeFileSync(originalPath, mergedContent, 'utf8');
  
  // Clean up compiled file
  if (fs.existsSync(compiledPath)) {
    fs.unlinkSync(compiledPath);
  }
  if (fs.existsSync(compiledPath + '.map')) {
    fs.unlinkSync(compiledPath + '.map');
  }
  
  console.log('✅ Styles merged successfully!');
  done();
});

// Main styles task
gulp.task('styles', gulp.series('compile-scss', 'merge-styles'));

// Watch for changes
gulp.task('watch', function() {
  gulp.watch('./styles/**/*.scss', gulp.series('styles'));
});

// Default task
gulp.task('default', gulp.series('styles', 'watch'));

// Build task (no watch)
gulp.task('build', gulp.series('styles'));