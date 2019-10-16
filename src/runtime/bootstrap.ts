import Vue, { VueConstructor } from "vue";
import { VueI18x } from "./i18x";
import "./types";

const ready = new Promise<void>(resolve => {
	if (window.document.readyState == "complete") {
		resolve();
	} else {
		window.addEventListener("load", () => resolve());
	}
});

export interface BootstrapOptions {
	/** Your application's entry component. */
	app: VueConstructor<any>;
	/** The selector to mount the app when ready. Default is `"#app"` */
	mount?: string;

	/** A hook that is called during startup. */
	start?(app: Vue): Promise<void> | void;
}

/** Start a vuechain app. */
export async function bootstrap(options: BootstrapOptions) {
	Vue.use(VueI18x);

	const app = new Vue({
		render: c => c(options.app),
		i18n: new VueI18x()
	});

	if (options.start) {
		await options.start(app);
	}

	await ready;

	app.$mount(options.mount || "#app");
}
