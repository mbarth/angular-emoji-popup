var gulp = require('gulp');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');
var concat = require('gulp-concat');
var plumber = require('gulp-plumber');
var IMAGES = "src/images/*.*";
var JS_SRC = ["src/js/config.js", "src/js/emojiPlugin.js", "src/js/emojiInsertDirective.js", "src/js/jquery.emojiarea.js", "src/js/nanoscroller.js", "src/js/util.js"];
var CSS_SRC = "src/css/*.css";

/**
 *  Manage Core Files
 **/
gulp.task('copy-images', function () {
    return gulp.src(IMAGES)
        .pipe(gulp.dest('dist/images'));
});
gulp.task('core-js', function () {
    return gulp.src(JS_SRC)
        .pipe(plumber())
        .pipe(concat('emoji.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});
gulp.task('core-css', function () {
    return gulp.src(CSS_SRC)
        .pipe(plumber())
        .pipe(concat('emoji.min.css'))
        .pipe(uglifycss())
        .pipe(gulp.dest('dist/css'));
});
gulp.task('default', ['copy-images', 'core-js', 'core-css']);