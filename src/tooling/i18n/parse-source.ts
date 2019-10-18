import { parseFragment as parseHtml } from "parse5";
import { traverseNodes, getAttr, getTextContent } from "./html";

/**
 * Parse source code for i18x entities.
 */
export function parseSource(source: string) {
    const entities: I18xEntity[] = [];

    // Find all $xt translation calls:
    const TRegExp = /\$x\s*\(\s*(?:([0-9]+)\s*,)?\s*(\"(?:[^\\\"\']|\\.)*\"|\'(?:[^\\\"\']|\\.)*\')/g;
    for (let m = TRegExp.exec(source); m; m = TRegExp.exec(source)) {
        const quotes = m[2][0];
        const valueStart = m[0].indexOf(quotes);
        entities.push({
            type: "x",
            key: m[1] === undefined ? undefined : Number(m[1]),
            value: JSON.parse(quotes === "\'" ? `"${m[2].slice(1, -1)}"` : m[2]),
            start: m.index + 3,
            end: m.index + valueStart
        });
    }

    // Parse code as html and find all translation directives:
    const html = parseHtml(source, { sourceCodeLocationInfo: true });
    for (const node of traverseNodes(html)) {
        const attr = getAttr(node, "v-x");
        if (attr) {
            const raw = source.slice(attr.start, attr.end);
            if (!raw.includes("=") || /^\s*$/.test(attr.value) || /^\s*\[\s*\]\s*$/.test(attr.value)) {
                entities.push({
                    type: "directive",
                    key: undefined,
                    value: getTextContent(node),
                    start: attr.start,
                    end: attr.end
                });
            } else {
                const simple = /^\s*([0-9]+)\s*$/.exec(attr.value) || /^\s*\[\s*([0-9]+)\s*\]\s*$/.exec(attr.value);
                if (simple) {
                    entities.push({
                        type: "directive",
                        key: Number(simple[1]),
                        value: getTextContent(node),
                        start: attr.start,
                        end: attr.end
                    });
                } else {
                    const extended = /^\s*\[\s*(?:([0-9]+)\s*,?)?\s*([^\]]*)\]\s*$/.exec(attr.value);
                    if (extended) {
                        entities.push({
                            type: "extended-directive",
                            key: extended[1] === undefined ? undefined : Number(extended[1]),
                            options: extended[2],
                            value: getTextContent(node),
                            start: attr.start,
                            end: attr.end
                        });
                    } else {
                        entities.push({
                            type: "extended-directive",
                            key: undefined,
                            options: attr.value,
                            value: getTextContent(node),
                            start: attr.start,
                            end: attr.end
                        });
                    }
                }
            }
        }
    }

    return entities.sort((a, b) => a.start - b.start);
}

export interface I18xTranslateFn {
    readonly type: "x";
    readonly key: number | undefined;
    readonly value: string;
    readonly start: number;
    readonly end: number;
}

export interface I18xDirective {
    readonly type: "directive";
    readonly key: number | undefined;
    readonly value: string;
    readonly start: number;
    readonly end: number;
}

export interface I18xExtendedDirective {
    readonly type: "extended-directive";
    readonly key: number | undefined;
    readonly options: string;
    readonly value: string;
    readonly start: number;
    readonly end: number;
}

export type I18xEntity = I18xTranslateFn | I18xDirective | I18xExtendedDirective;
