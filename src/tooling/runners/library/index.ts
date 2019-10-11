import { src, dest } from "vinyl-fs";
import chokidar = require("chokidar");
import gulpTs = require("gulp-typescript");
import sourcemaps = require("gulp-sourcemaps");
import colors = require("ansi-colors");
import { VcConfig } from "../../config";
import { VcRunnerContext } from "..";
import { join } from "path";
import { formatTsError } from "./ts-util";
import { Task, stream } from "./tasks";

export async function run(config: VcConfig, context: VcRunnerContext) {
	const tsProject = gulpTs.createProject(join(config.context, "tsconfig.json"));
	const scheduler = new Task(async () => {
		let errorCount = 0;
		const tsProcessor = tsProject({
			error(error) {
				errorCount++;
				console.error(formatTsError(error));
			}
		});

		const outDir = dest(config.outDir);
		await stream((end, error) => {
			src("./**/*.ts", { cwd: config.rootDir, allowEmpty: true, nosort: true })
				.pipe(sourcemaps.init())
				.pipe(tsProcessor.on("error", error).on("end", end))
				.pipe(sourcemaps.write())
				.pipe(dest(config.outDir), { end: false })
		});

		await stream((end, error) => {
			outDir.on("error", error).on("end", end).on("close", end).end();
		});

		console.log(`Compilation finished with ${errorCount} error(s).`);
		if (context.watch) {
			console.log(colors.gray("Watching for changes..."));
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
