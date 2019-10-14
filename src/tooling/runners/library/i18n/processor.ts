import Vinyl = require("vinyl");
import { Transform } from "stream";
import { getSource } from "../utility/vinyl";
import { parseSource } from "../../../i18n/parse-source";
import { justifySource } from "../../../i18n/justify-source";
import { writeFile } from "fs-extra";
import { I18nContext } from "./context";
import { getFileMeta } from "../../../i18n/file-meta";
import { I18nPair } from "../../../i18n/adapter";
import { join, relative } from "path";

export function createI18nProcessor(context: I18nContext, justify: boolean) {
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
				await postprocess.call(this, chunk, context);
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

async function postprocess(this: Transform, chunk: Vinyl, context: I18nContext) {
	// Inject prefix into vue component entries:
	if (/\.vue\.js$/.test(chunk.path)) {
		const sourceFilename = chunk.history.find(p => /\.vue$/.test(p));
		if (sourceFilename) {
			const meta = getFileMeta(sourceFilename);
			if (meta) {
				const config = await context.getPackageConfig(meta.context);
				if (config) {
					context.setOutputSourceRelation(chunk.relative, sourceFilename);

					const source = getSource(chunk);
					const prefix = meta.getPrefix(config);
					chunk.contents = Buffer.from(injectVuePrefix(source, prefix));
				}
			}
		}
	}

	// Inject prefix into .ts/js files:
	// (gulp-typescript does not support vinyl history, so if the history has only one
	// entry, it is either an original .js file or a transpiled .ts file)
	if (/\.js$/.test(chunk.path) && chunk.history.length === 1) {
		let sourceFilename = chunk.path;

		const vueScriptSuffix = "--s.js";
		if (sourceFilename.endsWith(vueScriptSuffix)) {
			sourceFilename = sourceFilename.slice(0, -vueScriptSuffix.length) + ".js";
		}

		const meta = getFileMeta(sourceFilename);
		if (meta) {
			const config = await context.getPackageConfig(meta.context);
			if (config) {
				if (sourceFilename.startsWith(config.outDir)) {
					sourceFilename = join(config.rootDir, relative(config.outDir, sourceFilename));
				}
				context.setOutputSourceRelation(chunk.relative, sourceFilename);

				const source = getSource(chunk);
				const prefix = meta.getPrefix(config);
				chunk.contents = Buffer.from(injectScriptPrefix(source, prefix));
			}
		}
	}

	this.push(chunk);
}

function injectVuePrefix(source: string, prefix: string) {
	return source.replace(`/* i18nPrefix */ null`, `/* i18nPrefix */ ${JSON.stringify(prefix)}`);
}

function injectScriptPrefix(source: string, prefix: string) {
	// Theoretically, the prefix constant should be injected after the first import and only if no import is called "i18nPrefix",
	// but with webpack as the final module bundler, it also works if the prefix is at the start of the file.
	return `const i18nPrefix = ${JSON.stringify(prefix)};\n${source}`;
}
