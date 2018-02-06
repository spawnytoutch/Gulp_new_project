'use strict';

var gulp = require('gulp'),
	duration = require('gulp-duration'),
	sass = require('gulp-sass'),
	sourcemaps = require('gulp-sourcemaps'),
	fs = require('fs'),
	browserSync = require('browser-sync'),
	livereload = require('gulp-livereload'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	runSequence = require('run-sequence'),
	prettify = require('gulp-jsbeautifier'),
	removeHtmlComments = require('gulp-remove-html-comments'),
	cleanCSS = require('gulp-clean-css'),
	csscomb = require('gulp-csscomb'),
	_ = require('lodash'),
	config = require('./config.json');

gulp.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: 'generated/'
        }
    });
});

gulp.task('watch', function() {
	livereload.listen();

	gulp.watch('./app/scss/**/*.scss').on('change', function(file) {
		var baseFilePath = file.path.replace('/scss/', '/css/');
		var tmpBaseFilePath = baseFilePath.split('/');
		tmpBaseFilePath.pop();
		baseFilePath = tmpBaseFilePath.join('/');
		gulp.src(file.path)
			.pipe(sourcemaps.init())
			.pipe(sass.sync({
				outputStyle: 'expanded',
				includePaths: ['bower_components/compass-mixins/lib/', 'bower_components/susy/sass/']
			}).on('error', sass.logError))
			.pipe(sourcemaps.write('./maps'))
			// .pipe(cleanCSS({
			// 	compatibility: 'ie8',
			// 	format: 'beautify'
			// }))
			.pipe(csscomb())
			.pipe(gulp.dest(baseFilePath)).on('end', function() {
				var baseFilePathDest = file.path.replace(__dirname + '/app', '').replace('/scss/', 'css/').replace('.scss', '.css');
				var buildCSS = JSON.parse(fs.readFileSync('./pages.json', 'utf8'));
				for (var i = buildCSS.pages.length - 1; i >= 0; i--) {
					var objCSS = buildCSS.pages[i]['css'];
					var objCSSIdName = buildCSS.pages[i].idName;
					if (_.includes(objCSS, baseFilePathDest)) {
						
						var objCSStmp = [];
						for (var o = objCSS.length - 1; o >= 0; o--) {
							objCSStmp.unshift(__dirname + '/app/'+objCSS[o]);
						}

						gulp.src(objCSStmp)
							.pipe(concat(objCSSIdName + '.css'))
							.pipe(duration('rebuilding files'))
							.pipe(gulp.dest(config.destFolder+'css/'))
							.pipe(livereload());

						console.log(objCSStmp.length+' CSS concatenated and copied to: ', config.destFolder+'css/'+objCSSIdName + '.css');
					}
				}
			});
	});

	gulp.watch('./app/pages/**/*.html').on('change', function(file) {
		var destFilePath = file.path.replace('/scss/', '/css/');
		var destaseFilePath = destFilePath.split('/');
		destaseFilePath.pop();
		destFilePath = destaseFilePath.join('/');
		destFilePath = destFilePath.replace(__dirname + '/app/', '')

		gulp.src(file.path)
				.pipe(prettify({
					'indent_size': 1,
					'indent_char': '	'
				}))
				.pipe(removeHtmlComments())
				.pipe(duration('rebuilding files'))
				.pipe(gulp.dest(config.destFolder))
				.pipe(livereload());

		console.log('HTML pretiffied, uncommented and copied to: ', config.destFolder);
	});

	gulp.watch('./app/js/**/*.js').on('change', function(file) {
		var baseFilePath = file.path.replace(__dirname + '/app/', '');
		var buildJS = JSON.parse(fs.readFileSync('./pages.json', 'utf8'));
		for (var i = buildJS.pages.length - 1; i >= 0; i--) {
			var objJS = buildJS.pages[i]['js'];
			var objJSIdName = buildJS.pages[i].idName;
			if (_.includes(objJS, baseFilePath)) {

				var objJStmp = [];
				for (var o = objJS.length - 1; o >= 0; o--) {
					objJStmp.unshift(__dirname + '/app/'+objJS[o]);
				}

				gulp.src(objJStmp)
					.pipe(concat(objJSIdName + '.js'))
					.pipe(duration('rebuilding files'))
					.pipe(gulp.dest(config.destFolder + 'js/'))
					.pipe(livereload());

				console.log(objJStmp.length+' JS concatenated and copied to: ', config.destFolder+'js/'+objJSIdName + '.js');
			}
		}
	});
});

gulp.task('server', function(callback) {
	runSequence('watch', 'browserSync', callback);
});

gulp.task('default', ['server']);