import Vinyl = require("vinyl");

export function getSource(chunk: Vinyl) {
	if (chunk.contents instanceof Buffer) {
		return chunk.contents.toString("utf8");
	}
	throw new Error(`File content must be a buffer: ${chunk.path}`);
}
