import { VcConfig } from "../config";

export class I18nFileMeta {
	public constructor(
		readonly filename: string,
		readonly context: string,
		readonly id: string
	) { }

	public getPrefix(config: VcConfig) {
		return config.prefix ? `${config.prefix}.${this.id}.t` : `${this.id}.t`;
	}
}

export function getFileMeta(filename: string) {
    // Math the smallest filename starting with "/src" or "/dist" and an extension:
	const match = /[\\\/](?:src|dist)((?:[\\\/](?!src|dist)[^\\\/]+)*)\.[^\\\/]+$/.exec(filename);
	if (match) {
		return new I18nFileMeta(
			filename,
			filename.slice(0, match.index),
            match[1]
                // Remove the trailing slash:
                .slice(1)
                // Ensure consistent paths between different platforms:
                .replace(/\\/g, "/")
		);
	}
}
