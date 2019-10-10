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
}

/** Start a vuechain app. */
export async function bootstrap(options: BootstrapOptions) {
	const app = new Vue({
		render: c => c(options.app)
	});

	await ready;
	app.$mount("#app");
}
