var gulp = require('gulp'),
    gutil = require('gulp-util'),
    sass = require('gulp-sass'),
    path = require('path'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    gulpOpen = require('gulp-open'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    rev = require('gulp-rev-append'),
    md5 = require('gulp-md5-plus'),
    fileinclude = require('gulp-file-include'),
    livereload = require('gulp-livereload'),
    webpack = require('webpack'),
    connect = require('gulp-connect'),
    os = require('os'),
    webpackConfig = require('./webpack.config.js'),
    browserSync = require('browser-sync'),

    del = require('del');
var reload = browserSync.reload;
var srcDir = path.resolve(process.cwd(),'src');

var path = {
    scss:'./src/scss/**/*',
    css : './src/css/',
    html:'./src/tpl/**/*',
    js:'./src/js/**/*',
    images:['./src/imgs/**/*.png','./src/imgs/**/*.jpg','./src/imgs/**/*.svg','./src/imgs/**/*.gif']
},
    dist = {
        css:'./dist/css/',
        js:'./dist/js',
        imgs : './dist/imgs'
    },
    options = {
          autoprefix: 'last 10 version',
        imagemin: { optimizationLevel: 3, progressive: true, interlaced: true },
        jshint: '',
        jshint_reporter: 'default',
        scss: { style: 'compressed', compass: true, require: ['compass', 'susy', 'breakpoint'] },
        uglify: { mangle: false },
        clean: { read: false }
    };
var browser = os.platform() === 'linux' ? 'Google chrome' : (
  os.platform() === 'darwin' ? 'Google chrome' : (
  os.platform() === 'win32' ? 'chrome' : 'firefox'));
var pkg = require('./package.json');
gulp.task('styles', function() {
    //编译sass
    return gulp.src(path.scss)
    .pipe(sass())
    // .pipe(cache('sass'))
    //添加前缀
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    //保存未压缩文件到我们指定的目录下面
    .pipe(gulp.dest(dist.css))
    //给文件添加.min后缀
    // .pipe(rename({ suffix: '.min' }))
    //压缩样式文件
    // .pipe(minifycss())
    //输出压缩文件到指定目录
    .pipe(concat('style.min.css'))
    .pipe(minifycss())
    .pipe(gulp.dest(dist.css))
    //提醒任务完成
    .pipe(reload({stream: true}))
    .pipe(notify({ message: 'Styles task complete' }));
});
// Images
gulp.task('images', function() {
  return gulp.src(path.images)
    .pipe(cache(imagemin(options.imagemin)))
    .pipe(gulp.dest(dist.imgs))
    .pipe(notify({ message: 'Images task complete' }));
});


// Watch
gulp.task('watch', function() {
  // Watch .scss files
  gulp.watch(path.scss, ['styles']);
  // Watch .js files
 gulp.watch(path.js,['scripts']);
  // Watch image files
  gulp.watch(path.images, ['images']);
  // Watch html file
  gulp.watch(path.html,['fileinclude']);
  // gulp.watch(allSources, ['livereload']);
  // Create LiveReload server
  // livereload.listen();
  // var server = livereload();
  // gulp.watch('src/**/*', ['lessmin', 'build-js', 'fileinclude'])
  //       .on('end', done);
  // Watch any files in assets/, reload on change
  // gulp.watch('./dist/**/*.*',['styles'])
   browserSync({
        files: "**",
        server: {
            baseDir: "./dist",
            directory: true
        
        }
    });


});

gulp.task('clean',function() {
    return del('dist/**/*');
});
gulp.task('copy:images',function(done) {
    gulp.src(['src/imgs/**/*'])
        .pipe(cache(imagemin(options.imagemin)))
        .pipe(gulp.dest('dist/imgs/'))
        .on('end',done)
});
//用于在html文件中直接include文件
gulp.task('fileinclude', function (done) {
    gulp.src(['src/tpl/*.html'])
        .pipe(fileinclude({
          prefix: '@@',
          basepath: '@file'
        }))
        .pipe(gulp.dest('dist/app'))
        .on('end', done);
});
//雪碧图操作，应该先拷贝图片并压缩合并css
// gulp.task('sprite', ['copy:images', 'styles'], function (done) {
//     var timestamp = +new Date();
//     gulp.src('dist/css/style.min.css')
//         .pipe(spriter({
//             spriteSheet: 'dist/images/spritesheet' + timestamp + '.png',
//             pathToSpriteSheetFromCSS: '../images/spritesheet' + timestamp + '.png',
//             spritesmithOptions: {
//                 padding: 10
//             }
//         }))
//         .pipe(base64())
//         .pipe(cssmin())
//         .pipe(gulp.dest('dist/css'))
//         .on('end', done);
// });
gulp.task('md5:css', ['copy:images','fileinclude','styles'], function (done) {
    gulp.src('dist/css/*.css')
        .pipe(md5(10, 'dist/app/*.html'))
        .pipe(gulp.dest('dist/css'))
        .on('end', done);
});
// gulp.task('connect', function () {
//     console.log('connect------------');
//     connect.server({
//         root: host.path,
//         port: host.port,
//         livereload: true
//     });
// });
gulp.task('open', function (done) {
    gulp.src('')
        .pipe(gulpOpen({
            app: browser,
            uri: 'http://localhost:3000/app'
        }))
      .on('end', done);
});


var myDevConfig = Object.create(webpackConfig);

var devCompiler = webpack(myDevConfig);

//引用webpack对js进行操作
gulp.task("build-js", function(callback) {
    devCompiler.run(function(err, stats) {
        if(err) throw new gutil.PluginError("webpack:build-js", err);
        gutil.log("[webpack:build-js]", stats.toString({
            colors: true
        }));
        callback();


    });
});
gulp.task('scripts',['js'],browserSync.reload);
gulp.task('js',['build-js'],function() {
     return gulp.src('dist/js/*.js')
         .pipe(uglify())
         .pipe(gulp.dest('dist/js'))
         // .pipe(livereload())
         .pipe(reload({stream: true}))
         .pipe(notify({ message: 'scripts task complete' }));

})
//将js加上10位md5,并修改html中的引用路径，该动作依赖build-js
gulp.task('md5:js', ['build-js'], function (done) {
    gulp.src('dist/js/*.js')
        .pipe(md5(10, 'dist/app/*.html'))
        .pipe(gulp.dest('dist/js'))
        .on('end', done);
});
gulp.task('dev', ['clean', 'copy:images', 'fileinclude', 'styles', 'build-js', 'watch']);

gulp.task('prod',['clean','connect','md5:css','md5:js']);

