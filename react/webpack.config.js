const path = require("path");
const {InjectManifest} = require('workbox-webpack-plugin');
const {GenerateSW} = require('workbox-webpack-plugin');


const HtmlWebPackPlugin = require("html-webpack-plugin");
const BundleTracker = require("webpack-bundle-tracker");

var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
module.exports = {
  mode: 'development',
  entry: {
    'app': './src/js/app.js',
  },
  output: {
    filename: 'js/[name].bundle.js',
    chunkFilename: 'js/[name].bundle.js',
    publicPath: '/static/',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-runtime']
          }
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader"
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: '../static/index.html'
    }),
    new BundleAnalyzerPlugin(),
    new BundleTracker({path: __dirname, filename: './webpack-stats.json'}),
  ]
};

//new GenerateSW({
//  swDest: './serviceworker.js', //This is the view we wrote above that serves it.
//  skipWaiting:true,
//  clientsClaim:true,
//  globDirectory: '../static/',
//  "globPatterns": [
//    "**/*.{css,html,js}"
//  ],
//  globIgnores: ['admin/**/*', ],
//})