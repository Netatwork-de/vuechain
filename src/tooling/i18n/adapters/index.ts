import { DefaultI18nAdapter } from "./default-adapter";
import { VcConfig } from "../../config";
import { I18nAdapter } from "../adapter";

export async function createI18nAdapter(config: VcConfig): Promise<I18nAdapter | undefined> {
	switch (config.adapter) {
		case undefined:
		case "default":
			return new DefaultI18nAdapter();

		default: throw new Error(`Unable to create adapter: "${config.adapter}"`);
	}
}
