const webpack = require("webpack");
const path = require("path");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");

let mode;
let devtool;
const additionalPlugins = [];
if (process.env.NODE_ENV === "production") {
    mode = "production";
    devtool = undefined;
    additionalPlugins.push(new TerserWebpackPlugin())
} else {
    mode = "development";
    devtool = "inline-source-map";
}

module.exports = {
    mode,
    devtool,
    entry: path.resolve(__dirname, "src", "client", "index.tsx"),
    output: {
        path: path.resolve(__dirname, "dist", "client"),
        filename: "client.js",
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        fallback: {
            http: require.resolve("http-browserify"),
            https: require.resolve("https-browserify"),
            stream: require.resolve("stream-browserify"),
            crypto: require.resolve("crypto-browserify"),
            assert: require.resolve("assert/"),
            util: require.resolve("util/"),
            os: require.resolve("os-browserify/browser"),
        },
    },
    plugins: [
        new webpack.ProvidePlugin({
            // Make a global `process` variable that points to the `process` package,
            // because the `util` package expects there to be a global variable named `process`.
            // Thanks to https://stackoverflow.com/a/65018686/14239942
            process: "process/browser",
        }),
        new ForkTsCheckerWebpackPlugin(),
        ...additionalPlugins
    ],
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" },
            {
                test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.svg$/],
                type: "asset/resource"
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    devServer: {
        compress: true,
        hot: false,
        liveReload: false,
        open: false,
        port: 9000,
        static: [path.resolve(__dirname, "src/client"), path.resolve(__dirname)],
        watchFiles: ["src/**/*.ts*"],
    },
};
