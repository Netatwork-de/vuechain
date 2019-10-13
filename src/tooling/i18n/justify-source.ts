import { I18xEntity } from "./parse-source";

/**
 * Justify i18x keys.
 * @param source The source code.
 * @param entities The parsed i18x entities.
 */
export function justifySource(source: string, entities: I18xEntity[]): I18xJustifyResult {
    const entityKeys: [I18xEntity, number][] = [];
    const usedKeys = new Map<number, I18xEntity>();

    // Register existing keys that should not be changed:
    for (const entity of entities) {
        if (entity.key !== undefined && !usedKeys.has(entity.key)) {
            usedKeys.set(entity.key, entity);
        }
    }

    // Justify missing or duplicate keys:
    let nextKey = 0;
    for (const entity of entities) {
        if (entity.key === undefined || usedKeys.get(entity.key) !== entity) {
            while (usedKeys.has(nextKey)) {
                nextKey++;
            }
            usedKeys.set(nextKey, entity);
            entityKeys.push([entity, nextKey]);
        } else {
            entityKeys.push([entity, entity.key]);
        }
    }

    // Format the source code with the justified keys:
    let output = "";
    let pos = 0;
    for (const [entity, key] of entityKeys) {
        output += source.slice(pos, entity.start);
        switch (entity.type) {
            case "x":
                output += `${key}, `;
                break;

            case "directive":
                output += `v-x="${key}"`;
                break;

            case "extended-directive":
                output += `v-x="[${key}, ${entity.options}]"`;
                break;
        }
        pos = entity.end;
    }
    output += source.slice(pos);

    return {
        pairs: entityKeys.map(([entity, key]) => ({ key, value: entity.value })),
        output
    };
}

export interface I18xPair {
    /** The i18x key. */
    readonly key: number;
    /** The default value for "en" locale. */
    readonly value: string;
}

export interface I18xJustifyResult {
    /** All key value pairs included in the justified source code. */
    readonly pairs: I18xPair[];
    /** The justified source code. */
    readonly output: string;
}
