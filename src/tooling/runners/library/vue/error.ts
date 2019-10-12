import { ErrorWithRange } from "vue-template-compiler";
import colors = require("ansi-colors");

export class VueError extends Error {
	public constructor(filename: string, errors: (string | ErrorWithRange)[]) {
		super();
	}
}

export function formatVueError(error: VueError) {
	return colors.redBright(`[vue] ERROR`);
}
