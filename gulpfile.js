const babel = require('gulp-babel')
const del = require('del')
const gulp = require('gulp')
const path = require('path')
const postcss = require('gulp-postcss')
const postcssImport = require('postcss-import')
const postcssPresetEnv = require('postcss-preset-env')
const pretty = require('gulp-pretty-html')
const sass = require('gulp-sass')
const plumber = require('gulp-plumber')
const bs = require('browser-sync').create()
const htmlmin = require('gulp-htmlmin')
const imagemin = require('gulp-imagemin')
const guetzli = require('imagemin-guetzli')
const mozjpeg = require('imagemin-mozjpeg')
const newer = require('gulp-newer')
const webp = require('gulp-webp')
const modernizr = require('gulp-modernizr')
const cssMinify = require('gulp-csso')
const rename = require('gulp-rename')
const uglify = require('gulp-uglify')
// const svgstore = require('gulp-svgstore')

const config = {
  src: 'src',
  dest: 'dist',
  path: {
    sass: 'sass/*.scss', // '**/*.{scss,sass}',
    html: '*.html',
    images: '**/**/*.{png,jpg,svg,webp}',
    js: 'js/*.js'
  }
}

//
// clean
//

gulp.task('clean:style', () => del([
  path.join(config.dest, 'css')
]))

gulp.task('clean:html', () => del([
  path.join(config.dest, config.path.html)
]))

gulp.task('clean:img', () => del([
  path.join(config.dest, 'img')
]))

gulp.task('clean:fonts', () => del([
  path.join(config.dest, 'fonts')
]))

gulp.task('clean:js', () => del([
  path.join(config.dest, 'js')
]))

gulp.task('clean:publish', () => del([
  path.join('docs')
]))

const clean = gulp.parallel(
  'clean:html',
  'clean:style',
  'clean:img',
  'clean:fonts',
  'clean:js'
)

function createOptimizeSvgOrPng (dest) {
  return function optimizeSVGorPng () {
    return gulp.src('src/img/*.{svg,png}')
      .pipe(newer(dest))
      .pipe(imagemin([
        imagemin.optipng({ optimizationLevel: 3 }),
        imagemin.svgo()
      ]))
      .pipe(gulp.dest(dest))
  }
}

function createPng2webp (dest) {
  return function png2webp () {
    return gulp.src('src/img/*.png')
      .pipe(newer(dest))
      .pipe(webp({ lossless: true }))
      .pipe(gulp.dest(dest))
  }
}

function createOptimizeBgImg (dest) {
  return function optimizeBgImg () {
    return gulp.src('src/img/bg-*.jpg')
      .pipe(newer(dest))
      .pipe(imagemin([mozjpeg({
        quality: 70,
        progressive: true
      })]))
      .pipe(gulp.dest(dest))
  }
}

function createBg2webp (dest) {
  return function bg2webp () {
    return gulp.src('src/img/bg-*.jpg')
      .pipe(newer(dest))
      .pipe(webp({ quality: 50 }))
      .pipe(gulp.dest(dest))
  }
}

function createOptimizePhoto (dest) {
  return function optimizePhoto () {
    return gulp.src('src/img/photo-*.jpg')
      .pipe(newer(dest))
      .pipe(imagemin([guetzli({
        quality: 84
      })]))
      .pipe(gulp.dest(dest))
  }
}

function createOptimizeJPG (dest) {
  return function optimizeJPG () {
    return gulp.src('src/img/!(bg|photo)*.jpg')
      .pipe(newer(dest))
      .pipe(imagemin([mozjpeg({
        quality: 84
      })]))
      .pipe(gulp.dest(dest))
  }
}

function createImg2webp (dest) {
  return function img2webp () {
    return gulp.src('src/img/!(bg)*.jpg')
      .pipe(newer(dest))
      .pipe(webp({ quality: 75 }))
      .pipe(gulp.dest(dest))
  }
}

// function crateSvgSprite () {
//   return gulp.src('src/img/icon-*.svg')
//     .pipe(svgstore({
//       inlineSvg: true
//     }))
//     .pipe(rename('sprite.svg'))
//     .pipe(gulp.dest('dist/img'))
// }

function buildImg (dest) {
  return gulp.parallel(
    createOptimizeSvgOrPng(dest),
    createOptimizeBgImg(dest),
    createOptimizePhoto(dest),
    createOptimizeJPG(dest),
    createPng2webp(dest),
    createBg2webp(dest),
    createImg2webp(dest)
  )
}

gulp.task('build:img', buildImg('dist/img'))
gulp.task('publish:img', buildImg('docs/img'))

gulp.task('build:fonts', () => {
  return gulp.src('fonts/*.*', { cwd: config.src })
    .pipe(gulp.dest(path.join(config.dest, 'fonts')))
})

gulp.task('publish:fonts', () => {
  return gulp.src('fonts/*.*', { cwd: config.src })
    .pipe(gulp.dest('docs/fonts'))
})

function buildStyle (dest) {
  sass.compiler = require('node-sass')

  return () => gulp.src(config.path.sass, { cwd: config.src })
    .pipe(plumber())
    .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
    .pipe(postcss([ postcssImport, postcssPresetEnv ]))
    .pipe(gulp.dest(dest))
    .pipe(bs.stream())
    .pipe(cssMinify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(dest))
}

gulp.task('build:style', buildStyle('dist/css'))
gulp.task('publish:style', buildStyle('docs/css'))

function buildHtml (dest) {
  const prettyConfig = {
    indent_size: 2,
    indent_char: ' ',
    preserve_newlines: true,
    max_preserve_newlines: 1
  }

  const htmlMinConfig = {
    removeComments: true,
    collapseWhitespace: true,
    conservativeCollapse: true,
    preserveLineBreaks: true
  }

  return () => gulp.src(config.path.html, { cwd: config.src })
    .pipe(htmlmin(htmlMinConfig))
    .pipe(pretty(prettyConfig))
    .pipe(gulp.dest(dest))
}

gulp.task('build:html', buildHtml('dist'))
gulp.task('publish:html', buildHtml('docs'))

function createBuildJS (dest) {
  return function buildJS () {
    return gulp.src(config.path.js, { cwd: config.src })
      .pipe(babel())
      .pipe(gulp.dest(dest))
      .pipe(bs.stream())
      .pipe(uglify())
      .pipe(rename({ suffix: '.min' }))
      .pipe(gulp.dest(dest))
  }
}

function createBuildModernizr (dest) {
  const configModernizr = {
    options: [],
    tests: ['webp']
  }

  return function buildModernizr () {
    return gulp.src(config.path.js, { cwd: config.src })
      .pipe(modernizr(configModernizr))
      .pipe(uglify())
      .pipe(rename({ suffix: '.custom.min' }))
      .pipe(gulp.dest(dest))
  }
}

gulp.task('build:js', gulp.parallel(
  createBuildJS('dist/js'),
  createBuildModernizr('dist/js'))
)

gulp.task('publish:js', gulp.parallel(
  createBuildJS('docs/js'),
  createBuildModernizr('docs/js'))
)

const build = gulp.parallel(
  'build:fonts',
  'build:img',
  'build:style',
  'build:js',
  'build:html'
)

const publish = gulp.parallel(
  'publish:img',
  'publish:fonts',
  'publish:style',
  'publish:js',
  'publish:html'
)

function reload (done) {
  bs.reload()
  done()
}

function serve (done) {
  bs.init({
    open: false,
    server: {
      baseDir: config.dest
    }
  })

  done()
}

gulp.task('watch:style', () => (
  gulp.watch(['sass/**/*.{scss,sass}', 'components/**/*.scss'], {
    cwd: config.src
  }, gulp.series('build:style'))
))

gulp.task('watch:html', () => (
  gulp.watch('**/*.html', {
    cwd: config.src
  }, gulp.series('build:html', reload))
))

gulp.task('watch:img', () => (
  gulp.watch(config.path.images, {
    cwd: config.src
  }, gulp.series('clean:img', 'build:img', reload))
))

gulp.task('watch:fonts', () => (
  gulp.watch('src/fonts/*.*', gulp.series('clean:fonts', 'build:fonts', reload))
))

gulp.task('watch:js', () => (
  gulp.watch('js/*.js', {
    cwd: config.src
  }, gulp.series('build:js', reload))
))

const watch = gulp.parallel(
  'watch:html',
  'watch:style',
  'watch:img',
  'watch:fonts',
  'watch:js'
)
const dev = gulp.series(clean, build, serve, watch)

exports.build = build
exports.clean = clean
exports.default = dev
exports.publish = publish
