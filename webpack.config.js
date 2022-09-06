const path = require('path');
const HTMLPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = {
    entry: [
        './src/index.js',
        './src/scss/application.scss',
    ],
    output: {
      path: __dirname + '/dist',
      filename: 'bundle.js'
    },
    module: {
        rules: [
          {
            test: /.s?css$/,
            use: [
                MiniCssExtractPlugin.loader,
                { loader: "css-loader" },
                { loader: "sass-loader" },
            ],
          },
          {
            test: /\.(gif|svg|jpg|png)$/,
            loader: "file-loader",
            options: {
              name: '[name].[ext]',
              outputPath: 'images'
            }
          },
        ],
        
      },
      optimization: {
        minimizer: [
          new CssMinimizerPlugin(),
        ],
        minimize: true,
      },
        plugins: [
            new HTMLPlugin({
                filename: 'index.html',
                template: './src/index.html'
            }),
            new MiniCssExtractPlugin({
                filename: 'style.min.css',
                ignoreOrder: true
            }),
        ],
    mode: 'development'
};