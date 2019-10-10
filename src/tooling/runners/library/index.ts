import asyncDone = require("async-done");
import { src, dest } from "vinyl-fs";
import Vinyl = require("vinyl");
import merge = require("merge-stream");
import { createProject } from "gulp-typescript";
import { VcConfig } from "../../config";
import { VcRunnerContext } from "..";
import { join } from "path";

export async function run(config: VcConfig, context: VcRunnerContext) {
	const ts = createProject(join(config.context, "tsconfig.json"));
	const tsProcessor = ts();

	await new Promise((resolve, reject) => {
		asyncDone(() => {
			return src(config.rootDir + "/**/*.ts")
				.pipe(tsProcessor)
				.pipe(dest(config.outDir));
		}, (error) => {
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		});
	});

	// TODO: Build sources using gulp.
}
