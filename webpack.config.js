const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

function getPlugins(isProd, isHot) {
  const pluginsProduction = [new CleanWebpackPlugin(["docs/*"])];
  const commonsPlugins = [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify(isProd ? "production" : "development"),
        BROWSER: true,
      },
    }),
    new HtmlWebpackPlugin({
      template: "public/index.html",
      filename: "index.html",
      inject: true,
      chunksSortMode: "none",
      cache: isHot,
      minify: {
        preserveLineBreaks: false,
        html5: true,
        removeComments: true,
        collapseWhitespace: true,
      },
    }),
  ];
  if (isHot) {
    commonsPlugins.push(new webpack.HotModuleReplacementPlugin());
  }
  return isProd ? [...commonsPlugins, ...pluginsProduction] : commonsPlugins;
}

module.exports = function(env) {
  const isHot = (env && env.hot) || false;
  const isProd = (!isHot && (env && env.production)) || false;

  const pluginsToUse = getPlugins(isProd, isHot);
  const webpackStatsProd = {
    children: true,
    chunks: false,
    chunkModules: false,
    chunkOrigins: false,
    optimizationBailout: true,
    source: false,
  };

  return {
    cache: !isProd,
    devtool: false,
    mode: !isProd ? "development" : "production",
    stats: isProd ? webpackStatsProd : "minimal",
    entry: path.resolve(__dirname, "public", "index.tsx"),
    output: {
      path: path.resolve(__dirname, "docs"),
      filename: isProd ? "[chunkhash].js" : "[name].bundle.js",
      chunkFilename: isProd ? "[chunkhash].chunk.js" : "[name].chunk.js",
      pathinfo: !isProd,
      jsonpScriptType: "module",
    },
    devServer: {
      contentBase: path.resolve(__dirname, "docs"),
      compress: false,
      historyApiFallback: true,
      hot: true,
      index: "index.html",
      open: false,
      inline: true,
      overlay: true,
      port: 9000,
    },
    performance: {
      hints: isProd ? "warning" : false,
    },
    optimization: {
      splitChunks: { chunks: "all", cacheGroups: {} },
      minimize: isProd,
      minimizer: [
        new UglifyJsPlugin({
          uglifyOptions: {
            ecma: 7,
            compress: { inline: false },
          },
          cache: false,
          parallel: true,
          sourceMap: false,
        }),
      ],
      runtimeChunk: false,
      concatenateModules: isProd,
    },
    resolve: {
      extensions: [".tsx", ".ts", ".jsx", ".js"],
      mainFields: ["module", "browser", "main"],
      modules: [path.resolve(__dirname, "node_modules")],
    },
    target: "web",
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: [
            {
              loader: "babel-loader",
              options: {
                cacheDirectory: !isProd,
              },
            },
            "ts-loader",
          ],
          include: /public/,
          exclude: /node_modules/,
        },
        {
          test: /\.(js|jsx)$/,
          use: {
            loader: "babel-loader",
            options: {
              cacheDirectory: !isProd,
            },
          },
          include: /public/,
          exclude: /node_modules/,
        },
      ],
    },
    plugins: pluginsToUse,
  };
};
