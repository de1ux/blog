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
    //config.devtool = 'eval-source-map';

    config.resolve = {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"]
    };

    config.module = {
        rules: [
            {test: /\.tsx?$/, loader: "awesome-typescript-loader"},
            {test: /\.css$/, loader: "style-loader!css-loader"},
            {
                test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
                loader: 'file-loader'
            }
        ]
    };

    config.plugins = [
        new CopyWebpackPlugin([
            {from: 'tutorials', to: 'raw/tutorials'},
            {from: 'opinions', to: 'raw/opinions'}
        ]),
    ];

    if (process.env.NODE_ENV === 'production') {
        config.plugins = config.plugins.concat([
            new webpack.optimize.CommonsChunkPlugin({name: 'vendor', filename: 'vendor.min.js'}),
            new webpack.optimize.UglifyJsPlugin()
        ])
    }

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
            ]
        },
    };

    return config;
}();
