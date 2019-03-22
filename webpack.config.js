//const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = function makeWebpackConfig() {
    let config = {};

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
                test: /\.(png|jpg|gif)$/,
                loader: 'file-loader'
            }
        ]
    };

    config.plugins = [
        new CopyWebpackPlugin([
            {from: 'tutorials', to: 'raw/tutorials'},
            {from: 'opinions', to: 'raw/opinions'},
            {from: 'images', to: 'images'},
        ]),
        new BundleAnalyzerPlugin()
    ];

    config.optimization = {
        splitChunks: {
            cacheGroups: {
                vendor: {
                    chunks: 'initial',
                    name: 'vendor',
                    test: /[\\/]node_modules[\\/]/,
                    enforce: true
                },
            }
        }
    };

    config.devServer = {
        host: '0.0.0.0',
        historyApiFallback: true,
        stats: 'minimal',
        port: 9009,
        watchOptions: {
            ignored: [
                __dirname + 'dist',
                __dirname + 'node_modules',
                __dirname + 'articles',
                __dirname + 'opinions',
                 __dirname + 'images',
            ]
        },
    };

    return config;
}();
