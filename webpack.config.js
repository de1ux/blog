const path = require('path');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ENV = process.env.npm_lifecycle_event;

const extractSass = new ExtractTextPlugin({
    filename: "[name].[contenthash].css",
    //allchunks: true,
    disable: false
    //disable: process.env.NODE_ENV === "development"
});

module.exports = function makeWebpackConfig() {
    var config = {};

    config.entry = {
        index: "./index.tsx",
    };
    config.output = {
        filename: '[name].bundle.js',
        path: __dirname + "/dist"
    };

    // Enable sourcemaps for debugging webpack's output.
    config.devtool = 'eval-source-map';

    config.resolve = {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"]
    };

    config.module = {
        rules: [
            {test: /\.tsx?$/, loader: "awesome-typescript-loader"},
            {test: /\.css$/, loader: "style-loader!css-loader"},
            {
                test: /\.scss$/,
                exclude: /node_modules/,
                include: path.resolve(__dirname, 'src/style/'),
                use: extractSass.extract({
                    use: [{
                        loader: 'css-loader'
                    }, {
                        loader: 'sass-loader'
                    }],
                    // use style-loader in development
                    fallback: "style-loader"
                })
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
                loader: 'file-loader'
            }
        ]
    };

    config.plugins = [
        extractSass,
        new webpack.optimize.CommonsChunkPlugin({
            name: "vendor",
            minChunks: function (module) {
                // This prevents stylesheet resources with the .css or .scss extension
                // from being moved from their original chunk to the vendor chunk
                if (module.resource && (/^.*\.(css|scss)$/).test(module.resource)) {
                    return false;
                }
                return module.context && module.context.indexOf("node_modules") !== -1;
            }
        }),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            jquery: "jquery",
            "window.jQuery": "jquery"
        })
    ];

    config.devServer = {
        host: '0.0.0.0',
        contentBase: [
            __dirname,
        ],
        stats: 'minimal',
        port: 9009
    };

    return config;
}();
