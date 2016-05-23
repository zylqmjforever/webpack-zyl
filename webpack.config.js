var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
var path = require('path');
var webpack = require('webpack');
var fs = require('fs');
var uglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
var srcDir = path.resolve(process.cwd(),'src');

function getEntry() {
    var jsPath = path.resolve(srcDir, 'js');
    var dirs = fs.readdirSync(jsPath);
    var matchs = [], files = {};
    dirs.forEach(function (item) {
        matchs = item.match(/(.+)\.js$/);
        console.log(matchs);
        if (matchs) {
            files[matchs[1]] = path.resolve(srcDir, 'js', item);
        }
    });
    console.log(JSON.stringify(files));
    return files;
}

module.exports = {
    cache: true,
    devtool: "source-map",
    // entry: './src/js/main.js',
    entry: getEntry(),
    output: {
        path: path.join(__dirname, "dist/js/"),
        publicPath: "dist/js/",
        filename: "[name].js",
        chunkFilename: "[chunkhash].js"
    },
    module: {
        //各种加载器，即让各种文件格式可用require引用
        loaders: [
            // { test: /\.css$/, loader: "style-loader!css-loader"},
            // { test: /\.less$/, loader: "style-loader!csss-loader!less-loader"}
           {
           	test:[/\.es6$/,/\.js$/],
			exclude:/node_modules/,
			loader:'babel-loader'
           } 
        ]
    },
    resolve: {
        alias: {
            jquery: srcDir + "/js/lib/jquery.min.js",
            core: srcDir + "/js/core",
            ui: srcDir + "/js/ui"
        },
        extensions:['','.js']
    },
    plugins: [
    	new webpack.ProvidePlugin({
            jQuery: "jquery",
            $: "jquery",
            // nie: "nie"
        }),
        new CommonsChunkPlugin('common.js'),
        new uglifyJsPlugin({
            compress: {
                warnings: false
            }
        })
    ]
};

