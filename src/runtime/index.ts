import Vue, { VueConstructor } from "vue";
import "./types";

const ready = new Promise(resolve => {
	if (window.document.readyState == "complete") {
		resolve();
	} else {
		window.addEventListener("load", resolve);
	}
});

export interface BootstrapOptions {
	/** Your application's entry component. */
	app: VueConstructor<any>;
	/** The selector to mount the app when ready. Default is `"#app"` */
	mount?: string;
}

/** Start a vuechain app. */
export async function bootstrap(options: BootstrapOptions) {
	const app = new Vue({
		render: c => c(options.app)
	});

	await ready;
	app.$mount(options.mount || "#app");
}
