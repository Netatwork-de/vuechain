import { DiagnosticCategory } from "typescript";
import gulpTs = require("gulp-typescript");
import colors = require("ansi-colors");

// The following logging behavior is the same as in ts-loader (see npm) to
// provide a bit more consistency between different build systems (gulp and webpack).
const categories = new Map<DiagnosticCategory, { style: colors.StyleFunction, label: string }>([
	[DiagnosticCategory.Error, { style: colors.redBright, label: "ERROR" }],
	[DiagnosticCategory.Message, { style: colors.green, label: "MESSAGE" }],
	[DiagnosticCategory.Warning, { style: colors.yellow, label: "WARNING" }]
]);

export function formatTsError(error: gulpTs.reporter.TypeScriptError) {
	const category = categories.get(error.diagnostic.category);
	if (category) {
		return category.style(`[ts] ${category.label} in ${colors.cyanBright(`${error.fullFilename}${error.startPosition ? `(${formatPosition(error.startPosition)})` : ""}`)}\n     TS${error.diagnostic.code}: ${error.diagnostic.messageText}`);
	}
}

function formatPosition({ line, character }: { line: number, character: number }) {
	return `${line},${character}`;
}
