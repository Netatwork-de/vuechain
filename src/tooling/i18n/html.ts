
const ignoredNodes = new Set(["#comment", "#documentType", "#text"]);

export function* traverseNodes(node: any) {
	if (!ignoredNodes.has(node.nodeName)) {yield node;
		if (node.childNodes) {
			for (const childNode of node.childNodes) {
				yield* traverseNodes(childNode);
			}
		}
		if (node.content) {
			yield* traverseNodes(node.content);
		}
	}
}

export interface HtmlAttr {
	readonly start: number;
	readonly end: number;
	readonly value: string;
}

export function getAttr(node: any, name: string): HtmlAttr | undefined {
	if (!node.attrs) {
		return;
	}
	for (const attr of node.attrs) {
		if (attr.name === name) {
			const location = node.sourceCodeLocation.attrs[name];
			return {
				start: location.startOffset,
				end: location.endOffset,
				value: attr.value
			};
		}
	}
	return;
}

export function getTextContent(node: any) {
	let content = "";
	if (node.childNodes) {
		for (const childNode of node.childNodes) {
			if (childNode.nodeName === "#text") {
				content += childNode.value;
			}
		}
	}
	return content;
}
