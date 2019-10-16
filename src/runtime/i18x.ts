import Vue, { VNode } from "vue";
import VueI18n from "vue-i18n";
import { VueConstructor } from "vue";
import { DirectiveBinding } from "vue/types/options";

declare const __webpack_public_path__: string;

export class VueI18x extends VueI18n {
	public static install(Vue: VueConstructor) {
		super.install(Vue);

		Vue.directive("x", {
			bind: directive,
			update: directive
		});

		Vue.mixin({
			computed: {
				$i18x() {
					return this.$i18n;
				}
			}
		});

		Vue.prototype.$x = function (this: Vue, key: number, value: string, params: any) {
			if (process.env.NODE_ENV === "development") {
				if (typeof key !== "number") {
					return key;
				}
			}
			return this.$t((this.$options.i18nPrefix as string) + key, params);
		};
	}

	public constructor() {
		super({
			fallbackLocale: "en",
			silentFallbackWarn: process.env.NODE_ENV === "production",
			silentTranslationWarn: process.env.NODE_ENV === "production"
		});
	}

	private _fetchingLocales = new Map<string, Promise<void>>();

	public get locale() {
		return super.locale;
	}

	public set locale(value: string) {
		if (process.env.NODE_ENV === "development") {
			console.warn("[vuechain] locale was changed without fetching messages beforehand.");
		}
		super.locale = value;
	}

	/** Fetch and set the locale. */
	public async changeLocale(locale: string) {
		await this.prefetchLocale(locale);
		super.locale = locale;
	}

	/**
	 * Autodetect, fetch and set the locale.
	 * If no supported locale is detected, the first supported locale is used as the fallback.
	 */
	public changeLocaleAuto(supportedLocales: string[]) {
		const locales = new Set(supportedLocales);
		for (const lang of navigator.languages) {
			const langCode = /^[^\-_]+/.exec(lang);
			if (langCode && locales.has(langCode[0])) {
				return this.changeLocale(langCode[0]);
			}
		}
		return this.changeLocale(supportedLocales[0]);
	}

	public prefetchLocale(locale: string) {
		let request = this._fetchingLocales.get(locale);
		if (!request) {
			request = this.fetchLocale(locale);
			this._fetchingLocales.set(locale, request);
		}
		return request;
	}

	protected async fetchLocale(locale: string) {
		const req = await fetch(`${__webpack_public_path__}locale/${locale}.json`);
		if (req.status === 200 || req.status === 204) {
			const messages = await req.json();
			this.mergeLocaleMessage(locale, messages);
		} else {
			throw new Error(`Unable to fetch locale: ${locale}. The server returned ${req.status}`);
		}
	}
}

function directive(el: any, binding: DirectiveBinding, vnode: VNode) {
	if (process.env.NODE_ENV === "development") {
		if (typeof binding.value !== "number" && (typeof binding.value[0] !== "number" || (binding.value[1] && typeof binding.value[1] !== "object"))) {
			console.warn("[vuechain] v-x directive must be a number, or an array with a number as the first element and an object as the second element.", binding.value, vnode);
		}
		if (vnode.context) {
			if (vnode.componentInstance) {
				if (!vnode.componentInstance.$slots || !vnode.componentInstance.$slots.default) {
					console.warn("[vuechain] v-x directive was used on a component without a default slot.", vnode);
				}
			}
		} else {
			console.warn("[vuechain] v-x directive was used without context.", vnode);
		}
	}

	const context = vnode.context;
	if (context) {
		const prefix = context.$options.i18nPrefix as string;
		const text = typeof binding.value === "number"
			? context.$t(prefix + binding.value) as string
			: context.$t(prefix + binding.value[0], binding.value[1]) as string;

		if (el._i18xText !== text) {
			el._i18xText = text;

			let vm: Vue | undefined, slot: VNode[] | undefined, slotContent: VNode | undefined, slotElem: Node | undefined;
			if (vm = vnode.componentInstance) {
				if ((slot = vm.$slots.default) && (slotContent = slot[0]) && (slotElem = slotContent.elm)) {
					slotElem.textContent = text;
				}
			} else {
				el.innerText = text;
			}
		}
	}
}

declare module "vue/types/vue" {
	interface Vue {
		/**
		 * Access the global i18x instance.
		 */
		readonly $i18x: VueI18x;

		/**
         * Translate an i18x key.
         * @param key The i18x key.
         * @param value The english default translation. This is ignored at runtime.
         * @param params An optional object with translation parameters.
         */
		$x(key: number, value: string, params?: any): string;
	}
}

declare module 'vue/types/options' {
	interface ComponentOptions<V extends Vue> {
		/** The i18x prefix for this component. */
		readonly i18nPrefix?: string;
	}
}
