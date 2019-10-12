import { Transform } from "stream";
import Vinyl = require("vinyl");
import { VueError } from "./error";

export interface VueComposeOptions {
	error(error: VueError): void;
}

export function createComposer(options: VueComposeOptions) {
	return new Transform({
		objectMode: true,
		async transform(chunk: Vinyl, encoding, callback) {
			try {
				await compose.call(this, chunk);
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

export function compose(this: Transform, chunk: Vinyl) {
	// TODO: Check if there is a matching .vue component file by reading some map from the decomposer.
	// TODO: Apply scope transforms to css.
	// TODO: Replace "--s.d.ts" with ".vue.d.ts".
	this.push(chunk);
}
