import Vinyl = require("vinyl");
import { Transform } from "stream";
import { VueDecomposer } from "../vue/decompose";
import { getSource } from "../utility/vinyl";
import { parseSource } from "../../../i18n/parse-source";
import { justifySource } from "../../../i18n/justify-source";
import { writeFile } from "fs-extra";

export function createI18nProcessor(justify: boolean, decomposer: VueDecomposer) {
	const preprocessor = new Transform({
		objectMode: true,
		async transform(chunk: Vinyl, encoding, callback) {
			try {
				await preprocess.call(this, chunk, justify);
				callback();
			} catch (error) {
				callback(error);
			}
		}
	});
	const postprocessor = new Transform({
		objectMode: true,
		async transform(chunk: Vinyl, encoding, callback) {
			try {
				await postprocess.call(this, chunk, decomposer);
				callback();
			} catch (error) {
				callback(error);
			}
		}
	});
	return { preprocessor, postprocessor };
}

async function preprocess(this: Transform, chunk: Vinyl, justify: boolean) {
	if (/\.(?:vue|ts|js)$/.test(chunk.relative)) {
		const source = getSource(chunk);
		const entities = parseSource(source);
		if (justify) {
			const { output, pairs } = justifySource(source, entities);
			if (source !== output) {
				await writeFile(chunk.path, output);
			}
			// TODO: Register justified pairs.
		} else {
			// TODO: Register extracted entities.
		}
	}
	this.push(chunk);
}

async function postprocess(this: Transform, chunk: Vinyl, decomposer: VueDecomposer) {
	// TODO: Inject prefixes into code files.
	this.push(chunk);
}
