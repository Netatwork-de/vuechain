import Vinyl = require("vinyl");
import { Writable, Readable } from "stream";

type Input = NodeJS.ReadableStream;
type Output = NodeJS.WritableStream | NodeJS.ReadWriteStream;

export interface Route {
	readonly map?: RegExp;
	readonly to: Output;
}

export class Pipes {
	private readonly outputs = new Map<Output, Set<Input>>();

	public pipe(input: Input, output: Output) {
		const inputs = this.outputs.get(output);
		if (inputs) {
			inputs.add(input);
		} else {
			this.outputs.set(output, new Set([input]));
		}
		return this;
	}

	public route(input: NodeJS.ReadableStream, routes: Route[]) {
		const routeOutputs = new Map<Route, Readable>();
		for (const route of routes) {
			routeOutputs.set(route, new Readable({ objectMode: true, read() { } }));
		}

		const routeInput = new Writable({
			objectMode: true,
			write(chunk: Vinyl, encoding, callback) {
				const route = routes.find(c => !c.map || c.map.test(chunk.path));
				if (route) {
					(routeOutputs.get(route) as Readable).push(chunk);
				}
				callback();
			},
			final(callback) {
				for (const [, output] of routeOutputs) {
					output.push(null);
				}
				callback();
			}
		});

		this.pipe(input, routeInput);
		for (const [route, output] of routeOutputs) {
			this.pipe(output, route.to);
		}

		return this;
	}

	public run() {
		return new Promise((resolve, reject) => {
			const errors: any[] = [];

			// End an output, when all of it's inputs have ended:
			for (const [output, inputs] of this.outputs) {
				const pendingInputs = new Set(inputs);
				for (const input of inputs) {
					input.on("end", () => {
						if (pendingInputs.delete(input) && pendingInputs.size === 0) {
							output.end();
						}
					});
				}
			}

			// Pipe all inputs to outputs:
			for (const [output, inputs] of this.outputs) {
				for (const input of inputs) {
					input.on("error", error => {
						errors.push(error);
					});
					input.pipe(output, { end: false });
				}
			}

			// Wait for all readable outputs to "end" and for all writable outputs to "finish":
			const pendingOutputs = new Set(this.outputs.keys());
			for (const output of this.outputs.keys()) {
				function done() {
					if (pendingOutputs.delete(output) && pendingOutputs.size === 0) {
						if (errors.length > 0) {
							reject(errors[0]);
						} else {
							resolve();
						}
					}
				}
				if ((<any> output).readable) {
					output.on("end", done);
					output.on("data", () => { });
				} else {
					output.on("finish", done);
				}
			}
		});
	}
}
