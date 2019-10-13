
declare module "*.vue" {
	import Vue from "vue";
	export default Vue;
}

interface NodeRequire {
	context: (
		directory: string,
		includeSubdirs?: boolean,
		filter?: RegExp,
		mode?: string
	) => ((id: string) => any) & {
		resolve(id: string): string;
		keys(): string[];
	};
}

declare module "vue/types/options" {
	interface ComponentOptions {
		readonly i18nPrefix: string;
	}
}

declare const i18nPrefix: string;
