import { Transform } from "stream";
import Vinyl = require("vinyl");
import { VueError } from "./error";
import { VueDecomposer } from "./decompose";

export interface VueComposeOptions {
	error(error: VueError): void;
	readonly decomposer: VueDecomposer;
}

export function createComposer(options: VueComposeOptions) {
	return new Transform({
		objectMode: true,
		async transform(chunk: Vinyl, encoding, callback) {
			try {
				await compose.call(this, chunk, options.decomposer);
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

export function compose(this: Transform, chunk: Vinyl, decomposer: VueDecomposer) {
	// TODO: Apply scope transforms to css.
	this.push(chunk);
}
