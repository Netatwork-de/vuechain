import { join } from "path";
import { src, dest } from "vinyl-fs";
import chokidar = require("chokidar");
import gulpTs = require("gulp-typescript");
import gulpSass = require("gulp-sass");
import sourcemaps = require("gulp-sourcemaps");
import colors = require("ansi-colors");
import { VcConfig } from "../../config";
import { VcRunnerContext } from "..";
import { formatTsError } from "./utility/ts";
import { Task } from "./utility/task";
import { createVueDecomposer } from "./vue/decompose";
import { formatVueError } from "./vue/error";
import { createPostprocessor } from "./postprocess";
import { Pipes } from "./utility/pipes";
import { formatSassError } from "./sass/error";

export async function run(config: VcConfig, context: VcRunnerContext) {
	const tsProject = gulpTs.createProject(join(config.context, "tsconfig.json"));
	const scheduler = new Task(async () => {
		let errorCount = 0;

		const input = src("./**/*", { cwd: config.rootDir, allowEmpty: true, nosort: true });
		const initSourcemaps = sourcemaps.init();
		const ts = tsProject({
			error(error) {
				const str = formatTsError(error);
				if (str) {
					errorCount++;
					console.error("\n" + formatTsError(error));
				}
			}
		});
		const scss = gulpSass({
		}).on("error", (error: any) => {
			errorCount++;
			console.error("\n" + formatSassError(error));
		});
		const vueDecomposer = createVueDecomposer({
			error(error) {
				errorCount++;
				console.error("\n" + formatVueError(error));
			}
		});
		const postprocessor = createPostprocessor({
			error(error) {
				errorCount++;
				console.error("\n" + formatVueError(error));
			},
			vueDecomposer: vueDecomposer
		});
		const writeSourcemaps = sourcemaps.write();
		const output = dest(config.outDir);

		await new Pipes()
			.pipe(input, initSourcemaps)
			.route(initSourcemaps, [
				{ map: /\.ts$/, to: ts },
				{ map: /\.scss$/, to: scss },
				{ map: /\.vue$/, to: vueDecomposer.stream },
				{ to: postprocessor }
			])
			.route(vueDecomposer.stream, [
				{ map: /\.d.ts$/, to: postprocessor },
				{ map: /\.ts$/, to: ts },
				{ map: /\.scss$/, to: scss },
				{ to: postprocessor }
			])
			.pipe(ts, postprocessor)
			.pipe(scss, postprocessor)
			.pipe(postprocessor, writeSourcemaps)
			.pipe(writeSourcemaps, output)
			.run()
			.catch(error => {
				if (errorCount === 0) {
					throw error;
				}
			});

		if (errorCount > 0) {
			console.log(colors.redBright(`\n[${new Date().toLocaleTimeString()}] Compilation finished with ${errorCount} error(s).`));
		} else {
			console.log(colors.greenBright(`\n[${new Date().toLocaleTimeString()}] Compilation succeeded.`));
		}
		if (context.watch) {
			console.log(colors.gray("Watching for changes..."));
		} else if (errorCount > 0) {
			throw new Error("Build failed due to compilation errors.");
		}
	});

	if (context.watch) {
		console.clear();
		await scheduler.run();
		const watcher = chokidar.watch("./**/*", { cwd: config.rootDir, ignoreInitial: true });
		watcher.on("error", console.error);
		watcher.on("change", () => {
			console.clear();
			console.log(colors.gray("File change detected. Starting incremental compilation..."));
			scheduler.run();
		});
		await new Promise(() => { });
	} else {
		await scheduler.run();
	}
}
