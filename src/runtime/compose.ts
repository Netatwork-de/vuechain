import Vue from "vue";

/** This is a helper function for creating a vue component from generated/compiled code. */
export function compose(
	render: any,
	staticRenderFns: any,
	script: any,
	scopeId: any
) {
	const options = script === null
		? { render: null }
		: (typeof script === "function" ? script.options : script);

	options.render = render || ((c: any) => c("div"));
	options.staticRenderFns = staticRenderFns;

	if (scopeId !== null) {
		options._scopeId = scopeId;
	}
	options._compiled = true;
	return Vue.extend(options);
}
