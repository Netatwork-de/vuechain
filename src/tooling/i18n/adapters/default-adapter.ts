import { I18nAdapter, I18nAdapterContext } from "../adapter";
import { join, relative } from "path";
import { readJson, writeFile } from "fs-extra";

export class DefaultI18nAdapter implements I18nAdapter {
	async process(ctx: I18nAdapterContext) {
		const dataFilename = join(ctx.config.context, "i18n.json");
		const data: I18nData = await readJson(dataFilename).catch(error => {
			if (error && error.code === "ENOENT") {
				return { };
			}
			throw error;
		});

		const unprocessedFiles = new Set(Object.keys(data));
		for (const [filename, file] of ctx.files) {
			if (file.pairs.length > 0) {
				const relname = getRelname(file.meta.context, filename);
				unprocessedFiles.delete(relname);

				let fileData = data[relname];
				if (!fileData) {
					fileData = data[relname] = { content: { } };
				}

				const unprocessedKeys = new Set(Object.keys(fileData.content));
				for (const { key, value } of file.pairs) {
					unprocessedKeys.delete(key);
					let entry = fileData.content[key];
					if (entry) {
						if (entry.content !== value) {
							entry.content = value;
							entry.lastModified = new Date().toISOString();
						}
						if (entry.content === value) {
							ctx.bundleMessages("en", entry.content, key);
							const latest = new Date(entry.lastModified).getTime();
							for (const locale in entry.translations) {
								if (new Date(entry.translations[locale].lastModified).getTime() >= latest) {
									ctx.bundleMessages(locale, entry.translations[locale].content, key);
								}
							}
						}
					} else {
						entry = fileData.content[key] = {
							content: value,
							lastModified: new Date().toISOString(),
							ignoreSpelling: [],
							translations: { }
						};
					}
				}
				for (const key of unprocessedKeys) {
					delete fileData.content[key];
				}
			}
		}
		for (const relname of unprocessedFiles) {
			delete data[relname];
		}

		await writeFile(dataFilename, JSON.stringify(data, null, "\t"));
	}
}

interface I18nData {
	[filename: string]: {
		content: {
			[key: string]: I18nTranslation & {
				translations: I18nTranslations;
			};
		};
	};
}

interface I18nTranslations {
	[locale: string]: I18nTranslation;
}

interface I18nTranslation {
	content: string;
	lastModified: string;
	ignoreSpelling: string[];
}

function getRelname(context: string, filename: string) {
	return relative(context, filename).replace(/\\/g, "/");
}
