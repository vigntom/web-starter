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

const clean = gulp.parallel(
  'clean:html',
  'clean:style',
  'clean:img',
  'clean:fonts',
  'clean:js'
)

gulp.task('build:img', () => {
  return gulp.src(config.path.images, { cwd: config.src })
    .pipe(gulp.dest(config.dest))
})

gulp.task('build:fonts', () => {
  return gulp.src('fonts/*.*', { cwd: config.src })
    .pipe(gulp.dest(path.join(config.dest, 'fonts')))
})

gulp.task('build:style', () => {
  sass.compiler = require('node-sass')

  return gulp.src(config.path.sass, { cwd: config.src })
    .pipe(plumber())
    .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
    .pipe(postcss([ postcssImport, postcssPresetEnv ]))
    .pipe(gulp.dest('css', { cwd: config.dest }))
    .pipe(bs.stream())
})

function buildHtml () {
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

  return gulp.src(config.path.html, { cwd: config.src })
    .pipe(htmlmin(htmlMinConfig))
    .pipe(pretty(prettyConfig))
    .pipe(gulp.dest(config.dest))
}

gulp.task('build:html', buildHtml)

gulp.task('build:js', () => {
  return gulp.src(config.path.js, { cwd: config.src })
    .pipe(babel())
    .pipe(gulp.dest('js', { cwd: config.dest }))
})

const build = gulp.parallel(
  'build:html',
  'build:style',
  'build:img',
  'build:fonts',
  'build:js'
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
