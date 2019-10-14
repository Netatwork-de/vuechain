import { I18nAdapter, I18nAdapterContext } from "../adapter";

export class DefaultI18nAdapter implements I18nAdapter {
	async process(ctx: I18nAdapterContext) {
		// TODO: Read project i18n.json
		// TODO: Adjust data to the data extracted from the current context.
		// TODO: Write project i18n.json

		if (ctx.addBundle) {
			// TODO: Create translation bundle from:
			// - project i18n.json
			// - dependency keys (read dependency i18n.json files)
		}
	}
}
