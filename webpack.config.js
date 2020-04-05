// const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  // mode: 'production',
  context: path.join(__dirname, 'src'),

  entry: {
    main: './js/app.js'
  },

  output: {
    // path: path.join(__dirname, '/dist'),
    // path: __dirname + '/dist',
    filename: '[name].[hash].js',
    // filename: 'app.js',
    library: 'LocalNote',
    // libraryExport: 'default',
    libraryTarget: 'umd'
  },

  plugins: [
    new HtmlWebpackPlugin({ template: '../src/index.html', inject: 'body' }),
    new CopyPlugin([{ from: 'css/*.css', to: '../dist' }]),
    new CopyPlugin([{ from: 'img/*.png', to: '../dist' }])
  ],

  module: {
    rules: [
      // Babel定義も入れていたがエラーになる
      // {
      //   test: /\.js$/,
      //   exclude: /node_modules/,
      //   loader: 'babel-loader',
      //   query: {
      //     presets: ['es2015']
      //   }
      // }
      // fontawesome を取り込もうとして入れていたローダー定義
      // {
      //   test: /\.css$/,
      //   loaders: ['style-loader', 'css-loader?modules']
      // },
      // {
      //   test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
      //   use: [
      //     {
      //       loader: 'file-loader',
      //       options: {
      //         name: '[name].[ext]',
      //         outputPath: 'fonts/'
      //       }
      //     }
      //   ]
      // }
    ]
  }
};
