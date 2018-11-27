    const path = require("path");
    const HtmlWebPackPlugin = require("html-webpack-plugin");
    module.exports = {
      entry: {
        'profileApp': './src/js/profileApp.js',
        'groupApp': './src/js/groupApp.js',
        'Router': './src/js/Router.js',
      },
      output: {
        path: path.resolve(__dirname, "dist"),
        filename: "js/[name].js"
      },
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
              loader: "babel-loader"
            }
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
        })
      ]
    };