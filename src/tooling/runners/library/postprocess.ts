import { Transform } from "stream";
import Vinyl = require("vinyl");
import { VueDecomposer } from "./vue/decompose";
import { getSource } from "./utility/vinyl";
import { VueError } from "./vue/error";

export interface PostprocessorOptions {
	error(error: VueError): void;
	readonly vueDecomposer: VueDecomposer;
}

export function createPostprocessor(options: PostprocessorOptions) {
	return new Transform({
		objectMode: true,
		async transform(chunk: Vinyl, encoding, callback) {
			try {
				await postprocess.call(this, chunk, options.vueDecomposer);
				callback();
			} catch (error) {
				if (error instanceof VueError) {
					options.error(error);
					callback();
				} else {
					callback(error);
				}
			}
		}
	});
}

export async function postprocess(this: Transform, chunk: Vinyl, decomposer: VueDecomposer) {
	const vueStyleSuffix = /--s([0-9]+)\.css$/.exec(chunk.relative);
	if (vueStyleSuffix) {
		const relname = chunk.relative.slice(0, -vueStyleSuffix[0].length);
		const meta = decomposer.components.get(relname);
		if (meta) {
			const source = getSource(chunk);
			const styleId = Number(vueStyleSuffix[1]);

			const vue = await import("@vue/component-compiler-utils");
			const { code, errors } = vue.compileStyle({
				source,
				filename: chunk.path,
				id: meta.scopeId,
				scoped: meta.scopedStyles.has(styleId),
				trim: true
			});
			if (errors.length > 0) {
				throw new VueError(chunk.path.slice(0, -vueStyleSuffix[0].length) + ".vue", errors);
			}

			chunk.contents = Buffer.from(code);
		}
	}

	if (/\.scss$/.test(chunk.relative)) {
		this.push(new Vinyl({
			contents: Buffer.from(`import "./${chunk.stem}.css";`),
			cwd: chunk.cwd,
			base: chunk.base,
			path: `${chunk.path}.js`
		}));
		this.push(new Vinyl({
			contents: Buffer.from(""),
			cwd: chunk.cwd,
			base: chunk.base,
			path: `${chunk.path}.d.ts`
		}));
	}

	this.push(chunk);
}
