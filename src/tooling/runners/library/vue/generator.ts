
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
	hasScript
}: {
	readonly stem: string;
	readonly hasTemplate: boolean;
	readonly hasScript: boolean;
}) => `${hasTemplate
	? `import { render, staticRenderFns } from "./${stem}--r.js";\n`
	: ""
}${hasScript
	? `import component from "./${stem}--s.js";\n`
	: ""
}
// TODO: Compose & export component.
`;

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
