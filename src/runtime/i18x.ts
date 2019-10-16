import VueI18n from "vue-i18n";
import { VueConstructor } from "vue";

export class VueI18x extends VueI18n {
	public static install(Vue: VueConstructor) {
		super.install(Vue);

		Vue.directive("x", {

		});
	}
}
