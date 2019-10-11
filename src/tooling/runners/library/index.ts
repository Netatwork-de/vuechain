import { src, dest } from "vinyl-fs";
import chokidar = require("chokidar");
import gulpTs = require("gulp-typescript");
import sourcemaps = require("gulp-sourcemaps");
import colors = require("ansi-colors");
import { VcConfig } from "../../config";
import { VcRunnerContext } from "..";
import { join } from "path";
import { formatTsError } from "./ts-util";
import { Task, stream, streamSwitch, streamEnd } from "./tasks";

export async function run(config: VcConfig, context: VcRunnerContext) {
	const tsProject = gulpTs.createProject(join(config.context, "tsconfig.json"));
	const scheduler = new Task(async () => {
		let errorCount = 0;
		await stream((end, error) => {
			const tsProcessor = tsProject({
				error(error) {
					errorCount++;
					console.error("\n" + formatTsError(error));
				}
			}).on("error", () => { });

			const sources = src("./**/*", { cwd: config.rootDir, allowEmpty: true, nosort: true })
				.pipe(sourcemaps.init());

			const output = dest(config.outDir);

			sources.pipe(streamSwitch([
				{ match: /\.ts$/, stream: tsProcessor },
				{ stream: output }
			]));

			tsProcessor
				.pipe(sourcemaps.write())
				.pipe(output);

			streamEnd([sources], () => tsProcessor.end());
			streamEnd([tsProcessor], () => output.end());
			streamEnd([output], end);
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
