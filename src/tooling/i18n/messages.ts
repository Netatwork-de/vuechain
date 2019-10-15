
export interface I18nMessages {
	[partialKey: string]: I18nMessages | string;
}

export class I18nMergeError extends Error {
	public constructor(path: string[]) {
		super(`Unable to merge i18n message at path: "${path.join(".")}"`);
	}
}

export function parseMessagePath(path: string) {
	return path ? path.split(".") : [];
}

export function mergeMessages(target: I18nMessages, path: string[], messages: I18nMessages | string) {
	if (typeof messages === "string") {
		const last = path.pop();
		if (last) {
			messages = { [last]: messages };
		} else {
			throw new I18nMergeError([]);
		}
	}
	(function merge(target: I18nMessages, messages: I18nMessages, currentPath: string[]) {
		for (const key in messages) {
			if (typeof messages[key] === "string") {
				if (key in target) {
					throw new I18nMergeError(currentPath.concat(key));
				} else {
					target[key] = messages[key];
				}
			} else {
				if (typeof target[key] === "string") {
					throw new I18nMergeError(currentPath.concat(key));
				}
				merge(
					target[key] as I18nMessages || (target[key] = { }),
					messages[key] as I18nMessages,
					currentPath.concat(key));
			}
		}
	})(target = path.reduce<I18nMessages>((target, key, i) => {
		const next = target[key];
		if (typeof next === "string") {
			throw new I18nMergeError(path.slice(0, i));
		}
		return next ? next : (target[key] = { });
	}, target), messages, path);
}

export function getLocaleMessageAssetPath(locale: string) {
	return `locale/${locale}.json`;
}
