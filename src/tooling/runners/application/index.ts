import webpack = require("webpack");
import HtmlPlugin = require("html-webpack-plugin");
import { VueLoaderPlugin } from "vue-loader";
import sassCompiler = require("sass");
import { VcConfig } from "../../config";
import { VcRunnerContext } from "..";
import { I18nPlugin } from "./i18n-plugin";
import { createI18nAdapter } from "../../i18n/adapters";

const i18nLoader = require.resolve("./i18n-loader");

export async function run(config: VcConfig, context: VcRunnerContext) {
	const i18nAdapter = await createI18nAdapter(config);
	const webpackConfig = {
		context: config.context,
		mode: context.env === "development" ? "development" : "production",
		devtool: context.env === "production" ? false : "inline-source-map",
		entry: "./src",
		resolve: {
			extensions: [".ts", ".js", ".json"],
			alias: {
				$vue: context.env === "development" ? "vue/dist/vue.runtime.js" : "vue/dist/vue.runtime.min.js"
			}
		},
		module: {
			rules: [
				{ test: /\.js$/, loader: i18nLoader },
				{ test: /\.ts$/, use: [
					i18nLoader,
					{ loader: "ts-loader", options: {
						appendTsSuffixTo: [/\.vue$/]
					} }
				] },
				{ test: /\.vue$/, use: [
					i18nLoader,
					{ loader: "vue-loader", options: {
						esModule: true,
						productionMode: context.env === "production",
						compilerOptions: {
							whitespace: "condense"
						}
					} }
				] },
				{ test: /\.css$/, use: [
					"vue-style-loader",
					"css-loader"
				] },
				{ test: /\.scss$/, use: [
					"vue-style-loader",
					"css-loader",
					{ loader: "sass-loader", options: {
						implementation: sassCompiler
					} }
				] }
			]
		},
		plugins: [
			new I18nPlugin(config, context, i18nAdapter),
			new VueLoaderPlugin(),
			new HtmlPlugin({
				template: "./src/index.html",
				inject: "head",
				minify: {
					collapseWhitespace: context.env === "production"
				}
			})
		],
		node: false,
		output: {
			path: config.outDir,
			filename: "index.js",
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
					if (stats.hasErrors()) {
						process.exitCode = 1;
					}
					resolve();
				}
			});
		});
	}
}
