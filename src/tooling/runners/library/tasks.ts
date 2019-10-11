import { Writable } from "stream";
import Vinyl = require("vinyl");

export class Task {
	public constructor(private readonly action: () => Promise<void>) {
	}

	private running: Promise<void> | null = null;
	private invalid = false;

	public run() {
		if (this.running) {
			this.invalid = true;
		} else {
			this.running = (async () => this.action())().finally(() => {
				this.running = null;
				if (this.invalid) {
					this.invalid = false;
					this.run();
				}
			});
		}
		return this.running;
	}
}

export function stream(start: (end: () => void, error: (error: any) => void) => void) {
	return new Promise((resolve, reject) => {
		const errors: any[] = [];
		start(() => {
			if (errors.length > 0) {
				reject(errors[0]);
			} else {
				resolve();
			}
		}, error => {
			errors.push(error);
		});
	});
}

export function streamEnd(streams: (NodeJS.ReadableStream | NodeJS.WritableStream)[], callback: () => void) {
	const pending = new Set(streams);
	streams.forEach(stream => {
		function end() {
			if (pending.delete(stream) && pending.size === 0) {
				callback();
			}
		}
		stream.on("end", end).on("close", end);
	});
}

export interface SwitchRule {
	readonly match?: RegExp;
	readonly stream: NodeJS.WritableStream;
	readonly end?: boolean;
}

export function streamSwitch(rules: SwitchRule[]) {
	return new Writable({
		objectMode: true,
		write(chunk: Vinyl, encoding, callback) {
			const rule = rules.find(r => !r.match || r.match.test(chunk.path));
			if (rule) {
				rule.stream.write(chunk, callback);
			} else {
				callback();
			}
		},
		final(callback) {
			for (const rule of rules) {
				if (rule.end) {
					rule.stream.end();
				}
			}
			callback();
		}
	});
}
