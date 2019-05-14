    const path = require("path");
    const HtmlWebPackPlugin = require("html-webpack-plugin");
    var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
    module.exports = {
      mode: 'development',
      entry: {
        'Router': './src/js/Router.js',
      },
      output: {
        path: path.resolve(__dirname, "dist"),
        filename: "js/[name].js"
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
          template: "./src/index.html",
          filename: "./index.html"
        }),
        new BundleAnalyzerPlugin()
      ]
    };