const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
                test: /\.(md|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
                loader: 'file-loader'
            }
        ]
    };

    config.plugins = [
        new CopyWebpackPlugin([
            {from: 'articles', to: 'raw/articles'},
            {from: 'opinions', to: 'raw/opinions'}
        ]),
        new webpack.optimize.CommonsChunkPlugin({name: 'vendor', filename: 'vendor.min.js'}),
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
