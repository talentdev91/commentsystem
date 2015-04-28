var gulp = require('gulp');
var react = require('gulp-react');
var sass = require('gulp-sass');

gulp.task('jsx', function () {
    return gulp.src('./jsx/components.jsx')
        .pipe(react())
        .pipe(gulp.dest('public'));
});

gulp.task('sass', function () {
    return gulp.src('./sass/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('public/css'));
});

gulp.task('watch', function() {
	gulp.watch('./jsx/**/*.jsx', ['jsx']);
	gulp.watch('./sass/**/*.scss', ['sass']);
});

gulp.task('default', ['sass', 'jsx', 'watch']);