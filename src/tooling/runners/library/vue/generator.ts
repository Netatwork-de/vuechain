
/**
 * Generate entry module code that imports decomposed parts of a
 * vue component and exports a normalized vue component as default.
 *
 * (Named exports from the component script are currently not supported, which
 * will pass through typescript silently, but break during the webpack build)
 */
export const componentEntry = ({
	stem,
	hasTemplate,
	hasScript,
	hasStyles,
	scoped,
	scopeId
}: {
	readonly stem: string;
	readonly hasTemplate: boolean;
	readonly hasScript: boolean;
	readonly hasStyles: number;
	readonly scoped: boolean;
	readonly scopeId: string;
}) => `
import { compose } from "vuechain/compose";
${hasTemplate ? `import { render, staticRenderFns } from "./${stem}--r.js";\n` : ""}
${hasScript ? `import component from "./${stem}--s.js";\n` : ""}
${Array.from(new Array(hasStyles)).map((_, i) => `import "./${stem}--s${i}.css";\n`).join("")}

export default compose(
	/* render */ ${hasTemplate ? "render" : "null"},
	/* staticRenderFns */ ${hasTemplate ? "staticRenderFns" : "null"},
	/* component */ ${hasScript ? "component" : "null"},
	/* scopeId */ ${scoped ? JSON.stringify(scopeId) : null}
);
`;

export const componentDeclaration = ({
	stem,
	hasDeclaration
}: {
	readonly stem: string;
	readonly hasDeclaration: boolean;
}) => `
${hasDeclaration
	? `export * from "./${stem}--s";`
	: `import Vue from "vue";\ndeclare const _default: import("vue").VueConstructor<Vue>;\nexport default _default;`
}`;

/**
 * Generate template module code that exports compiled render functions.
 * The code must define two constants: `render` and `staticRenderFns`
 */
export const templateModule = ({
	code
}: {
	readonly code: string;
}) => `${code}
export { render, staticRenderFns };
`;
