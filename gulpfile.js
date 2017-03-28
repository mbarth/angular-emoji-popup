var rimraf = require('gulp-rimraf');
var gulp = require('gulp');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');
var concat = require('gulp-concat');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var JS_SRC = ["src/js/config.js", "src/js/emojiPlugin.js", "src/js/emojiInsertDirective.js", "src/js/jquery.emojiarea.js", "src/js/nanoscroller.js", "src/js/util.js"];

gulp.task('compile-css', function() {
    gulp.src('src/css/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('./src/css'));
});
gulp.task('core-css', ['compile-css', 'empty-dist'], function () {
    return gulp.src('src/css/*.css')
        .pipe(uglifycss())
        .pipe(rename('emoji.min.css'))
        .pipe(gulp.dest('dist/css'))
});
gulp.task('copy-images', ['empty-dist'], function () {
    return gulp.src('src/images/*.*')
        .pipe(gulp.dest('dist/images'));
});
gulp.task('core-js', ['empty-dist'], function () {
    return gulp.src(JS_SRC)
        .pipe(plumber())
        .pipe(concat('emoji.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});
gulp.task('empty-dist', function() {
    return gulp.src('dist/', { read: false })
        .pipe(rimraf());
});
gulp.task('default', ['copy-images', 'core-js', 'core-css']);
