import webpack = require("webpack");
import HtmlPlugin = require("html-webpack-plugin");
import { VueLoaderPlugin } from "vue-loader";
import { VcConfig } from "../../config";
import { VcRunnerContext } from "..";

export async function run(config: VcConfig, context: VcRunnerContext) {
	const webpackConfig = {
		context: config.context,
		mode: context.env === "development" ? "development" : "production",
		devtool: context.env === "production" ? null : "inline-source-map",
		entry: "./src",
		resolve: {
			extensions: [".ts", ".js", ".json"],
			alias: {
				$vue: context.env === "development" ? "vue/dist/vue.runtime.js" : "vue/dist/vue.runtime.min.js"
			}
		},
		module: {
			rules: [
				{ test: /\.js$/, use: [] },
				{ test: /\.ts$/, loader: "ts-loader", options: {
					appendTsSuffixTo: [/\.vue$/]
				} },
				{ test: /\.vue$/, loader: "vue-loader", options: {
					esModule: true
				} }
			]
		},
		plugins: [
			new VueLoaderPlugin(),
			new HtmlPlugin({
				template: "./src/index.html",
				inject: "head",
				minify: {
					collapseWhitespace: context.env === "production"
				}
			}),

			...(context.watch ? [] : [
				new webpack.ProgressPlugin()
			]),
		],
		node: false,
		output: {
			path: config.outDir,
			filename: "index.js",
			// TODO: Make configurable:
			publicPath: "/"
		}
	};
	const compiler = webpack(webpackConfig);

	if (context.watch) {
		const Server = await import("webpack-dev-server");
		const server = new Server(compiler, {
			hot: true,
			publicPath: "/"
		});
		server.listen(8080);
		await new Promise(() => { });
	} else {
		await new Promise((resolve, reject) => {
			compiler.run((error, stats) => {
				if (error) {
					reject(error);
				} else {
					console.log(stats.toString({
						colors: process.stdout.isTTY
					}));
					resolve();
				}
			});
		});
	}
}
