import Vue from "vue";

/** This is a helper function for creating a vue component from generated/compiled code. */
export function compose(
	render: any,
	staticRenderFns: any,
	script: any,
	scopeId: string | null,
	i18nPrefix: string | null
) {
	const options = script === null
		? { render: null }
		: (typeof script === "function" ? script.options : script);

	if (render !== null) {
		options.render = render;
		options.staticRenderFns = staticRenderFns;
		options._compiled = true;
	}

	if (scopeId !== null) {
		options._scopeId = scopeId;
	}

	if (i18nPrefix !== null) {
		options.i18nPrefix = i18nPrefix;
	}

	return Vue.extend(options);
}
