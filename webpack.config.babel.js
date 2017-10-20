import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CleanWebpackPlugin from 'clean-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

export default {
    entry: {
        index: ['./src/index.js']
    },
    output: {
        publicPath: '/',
        path: path.join(__dirname, 'build'),
        filename: 'static/js/[chunkhash].[name].js'
    },
    resolve: {
        extensions: ['.js']
    },
    module: {
        rules: [{
            test: /\.(js)$/,
            include: path.join(__dirname, 'src'),
            use: ['babel-loader']
        }]
    },
    plugins: [
        new CleanWebpackPlugin(['build']),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './src/index.html'
        }),
        new CopyWebpackPlugin([
            {
                from: path.join(__dirname, 'src/test'),
                to: 'static'
            }
        ])
    ]
}