import colors = require("ansi-colors");

interface SassError {
	file: string;
	messageOriginal: string;
	line: number;
	column: number;
}

export function formatSassError(error: SassError) {
	return colors.redBright(`[sass] ERROR in ${colors.cyanBright(`${error.file}(${error.line},${error.column})`)}\n       ${error.messageOriginal}`);
}
