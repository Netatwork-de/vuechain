import { extname } from "path";
import { parse } from "querystring";
import { getFileMeta } from "../../i18n/file-meta";
import { I18nPlugin } from "./i18n-plugin";
import { I18N_PLUGIN_KEY, I18N_MODULE_META_KEY, I18N_MODULE_CONFIG_KEY } from "./common";

export default async function (source: string, map: any, meta: any) {
	const callback = this.async();
	try {
		const query = parse(this.resourceQuery.slice(1));
		const type = extname(this.resourcePath);
		const meta = getFileMeta(this.resourcePath);
		if (meta) {
			const plugin: I18nPlugin = this._compilation[I18N_PLUGIN_KEY];
			const config = await plugin.getPackageConfig(meta.context);
			if (config) {
				if (config.external) {
					const manifest = await plugin.getPackageManifest(config);
					if (manifest) {
						const keys = manifest.keys.get(this.resourcePath);
						if (keys) {
							const dependency = plugin.getDependency(config);
							for (const key of keys) {
								dependency.keys.add(key);
							}
						}
					}
				} else {
					this.addDependency(config.filename);
					const prefix = meta.getPrefix(config);
					switch (type) {
						case ".vue":
							if (query.type === "script") {
								source = injectScriptPrefix(source, prefix);
							}
							if (query.vue === undefined) {
								source = injectVuePrefix(source, prefix);
								this._module[I18N_MODULE_META_KEY] = meta;
								this._module[I18N_MODULE_CONFIG_KEY] = config;
							}
							break;

						default:
							source = injectScriptPrefix(source, prefix);
							this._module[I18N_MODULE_META_KEY] = meta;
							this._module[I18N_MODULE_CONFIG_KEY] = config;
							break;
					}
				}
			}
		}
		callback(null, source, map, meta);
	} catch (error) {
		callback(error);
	}
}

function injectScriptPrefix(source: string, prefix: string) {
	return `const i18nPrefix = ${JSON.stringify(prefix)};${source}`;
}

function injectVuePrefix(source: string, prefix: string) {
	return `${source}\n; component.options.i18nPrefix = ${JSON.stringify(prefix)};`;
}
