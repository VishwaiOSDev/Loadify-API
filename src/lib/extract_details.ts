export function extractDetailsFrom(object: Record<string, any>, keys: string[]): Record<string, any> {
    return Object.keys(object)
        .filter((key) => keys.includes(key))
        .reduce((acc, key) => {
            acc[key] = object[key];
            return acc;
        }, {} as Record<string, any>);
}