const webpack = require("webpack");
const path = require("path");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const config = require("./config.json");

const devtool = "inline-source-map";

const imageInlineSizeLimit = parseInt(process.env.IMAGE_INLINE_SIZE_LIMIT ?? "10000");

console.log(JSON.stringify(config));

module.exports = {
    mode: process.env.NODE_ENV ?? "development",
    devtool,
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".scss"],
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
        new webpack.DefinePlugin({ __CONFIG__: JSON.stringify(config) }),
        new ForkTsCheckerWebpackPlugin(),
    ],
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" },
            {
                test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.svg$/],
                loader: "url-loader",
                options: {
                    limit: imageInlineSizeLimit,
                    name: "static/media/[name].[hash:8].[ext]",
                },
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    entry: path.resolve(__dirname, "src", "index.tsx"),
    output: {
        filename: "main.js",
    },
    devServer: {
        compress: true,
        open: true,
        port: 9000,
        static: [path.resolve(__dirname, "src"), path.resolve(__dirname, "dist"), path.resolve(__dirname)],
    },
};
