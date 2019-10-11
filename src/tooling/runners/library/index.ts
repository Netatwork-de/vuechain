import { src, dest } from "vinyl-fs";
import Vinyl = require("vinyl");
import merge = require("merge-stream");
import ts = require("gulp-typescript");
import { VcConfig } from "../../config";
import { VcRunnerContext } from "..";
import { join } from "path";
import { formatTsError } from "./ts-util";

export async function run(config: VcConfig, context: VcRunnerContext) {
	const tsProject = ts.createProject(join(config.context, "tsconfig.json"));
	const tsProcessor = tsProject({
		error(error) {
			console.error(formatTsError(error));
		}
	});

	// TODO: Support ts incremental compilation in watch mode.

	await stream(reject => src(config.rootDir + "/**/*.ts")
		.pipe(tsProcessor.on("error", reject))
		.pipe(dest(config.outDir))
	);
}

function stream(start: (reject: (error: any) => void) => NodeJS.ReadWriteStream) {
	return new Promise((resolve, reject) => {
		const errors: any[] = [];
		function done() {
			if (errors.length > 0) {
				reject(errors[0]);
			} else {
				resolve();
			}
		}
		start(error => void errors.push(error)).on("end", done).on("close", done);
	});
}
