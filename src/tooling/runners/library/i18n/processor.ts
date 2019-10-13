import Vinyl = require("vinyl");
import { Transform } from "stream";
import { VueDecomposer } from "../vue/decompose";
import { getSource } from "../utility/vinyl";
import { parseSource } from "../../../i18n/parse-source";
import { justifySource } from "../../../i18n/justify-source";
import { writeFile } from "fs-extra";
import { I18nContext } from "./context";
import { getFileMeta } from "../../../i18n/file-meta";
import { I18nPair } from "../../../i18n/adapter";

export function createI18nProcessor(context: I18nContext, justify: boolean, decomposer: VueDecomposer) {
	const preprocessor = new Transform({
		objectMode: true,
		async transform(chunk: Vinyl, encoding, callback) {
			try {
				await preprocess.call(this, chunk, context, justify);
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

async function preprocess(this: Transform, chunk: Vinyl, context: I18nContext, justify: boolean) {
	if (/\.(?:vue|ts|js)$/.test(chunk.path)) {
		const meta = getFileMeta(chunk.path);
		if (meta) {
			const config = await context.getPackageConfig(meta.context);
			if (config) {
				const prefix = meta.getPrefix(config);

				const source = getSource(chunk);
				const entities = parseSource(source);
				if (justify) {
					const { output, pairs } = justifySource(source, entities);
					if (source !== output) {
						await writeFile(chunk.path, output);
					}
					context.files.set(chunk.path, {
						meta,
						pairs: pairs.map<I18nPair>(p => ({ key: prefix + p.key, value: p.value }))
					});
				} else {
					context.files.set(chunk.path, {
						meta,
						pairs: entities
							.filter(e => e.key !== undefined)
							.map<I18nPair>(e => ({ key: prefix + e.key, value: e.value }))
					});
				}
			}
		}
	}
	this.push(chunk);
}

async function postprocess(this: Transform, chunk: Vinyl, decomposer: VueDecomposer) {
	// TODO: Inject code files.
	// TODO: Use chunk.history to detect targets.
	// - Add history support to the vue decomposer.
	this.push(chunk);
}
