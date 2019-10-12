import { dirname, basename } from "path";
import hash = require("hash-sum");
import { Transform } from "stream";
import Vinyl = require("vinyl");
import { getSource } from "../utility/vinyl";
import { VueTemplateCompiler } from "@vue/component-compiler-utils/dist/types";
import { componentEntry, templateModule, componentDeclaration } from "./generator";
import { VueError } from "./error";

export interface VueDecomposeOptions {
	error(error: VueError): void;
}

export interface VueComponentMeta {
}

export interface VueDecomposer {
	readonly stream: Transform;
	readonly components: Map<string, VueComponentMeta>;
}

/**
 * Create a transform stream that consumes vue single component files
 * and decomposes them into their individual parts.
 *
 * Emitted file types can be ".ts", ".js", ".scss" and ".css".
 * Before writing the final files to disk, they should be piped through
 * a composeVue transform to apply some final transformations.
 */
export function createDecomposer(options: VueDecomposeOptions): VueDecomposer {
	const components = new Map<string, VueComponentMeta>();
	return {
		stream: new Transform({
			objectMode: true,
			async transform(chunk: Vinyl, encoding, callback) {
				try {
					await decompose.call(this, chunk, components);
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
		}),
		components
	};
}

async function decompose(this: Transform, chunk: Vinyl, components: Map<string, VueComponentMeta>) {
	const name = chunk.path.slice(0, -chunk.extname.length);
	const source = getSource(chunk);

	// Import compiler utils in demand to improve cli performance
	// for libraries that do not contain any vue components.
	const [vue, compiler] = await Promise.all([
		import("@vue/component-compiler-utils"),
		<Promise<VueTemplateCompiler>> import("vue-template-compiler")
	]);

	const { template, script, styles } = vue.parse({
		source,
		compiler,
		filename: chunk.path,
		sourceRoot: dirname(chunk.path),
		needMap: true
	});

	const files: Vinyl[] = [];

	const scopeId = `data-v-${hash(`${chunk.relative}:${source}`)}`;
	const scoped = styles.some(s => s.scoped);

	let hasTemplate = false;
	if (template) {
		const { errors, code } = vue.compileTemplate({
			source: template.content,
			filename: chunk.path,
			compiler,
			compilerOptions: { outputSourceRange: true },
			transformAssetUrls: true,
			isProduction: true,
			isFunctional: false,
			optimizeSSR: false,
			prettify: true
		});
		if (errors.length > 0) {
			throw new VueError(chunk.path, errors);
		}
		files.push(new Vinyl({
			contents: Buffer.from(templateModule({ code })),
			cwd: chunk.cwd,
			base: chunk.base,
			path: `${name}--r.js`
		}));
		hasTemplate = true;
	}

	let hasScript = false;
	let hasDeclaration = false;
	if (script) {
		if (script.attrs.lang !== "ts") {
			throw new VueError(chunk.path, [`Non typescript script blocks are currently unsupported in vue components. Use <script lang="ts">`]);
		}
		const scriptFile = new Vinyl({
			contents: Buffer.from(script.content),
			cwd: chunk.cwd,
			base: chunk.base,
			path: `${name}--s.ts`
		});
		// TODO: Attach source maps.
		files.push(scriptFile);
		hasScript = true;
		hasDeclaration = true;
	}

	files.push(new Vinyl({
		contents: Buffer.from(componentEntry({ stem: chunk.stem, hasTemplate, hasScript })),
		cwd: chunk.cwd,
		base: chunk.base,
		// The additional vue extension is used to allow imports of
		// the component without declarations for ".vue" files installed:
		path: `${name}.vue.js`
	}));
	files.push(new Vinyl({
		contents: Buffer.from(componentDeclaration({ stem: chunk.stem, hasDeclaration })),
		cwd: chunk.cwd,
		base: chunk.base,
		path: `${name}.vue.d.ts`
	}));

	components.set(chunk.relative.slice(0, -chunk.extname.length), { });

	for (const file of files) {
		this.push(file);
	}
}
