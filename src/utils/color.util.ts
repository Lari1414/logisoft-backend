export type CMYK = {
    cyan: number;
    magenta: number;
    yellow: number;
    black: number;
};

export function cmykToHex({ cyan, magenta, yellow, black }: CMYK): string {
    const c = cyan / 100;
    const m = magenta / 100;
    const y = yellow / 100;
    const k = black / 100;

    const r = 255 * (1 - c) * (1 - k);
    const g = 255 * (1 - m) * (1 - k);
    const b = 255 * (1 - y) * (1 - k);

    const toHex = (val: number) =>
        Math.round(val).toString(16).padStart(2, '0');

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}