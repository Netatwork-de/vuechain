import { bootstrap } from "vuechain";
import App from "./app.vue";

bootstrap({
	app: App,
	async start(app) {
		await app.$i18x.changeLocale("en");
	}
});
