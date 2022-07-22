declare module "toformat" {
    export default function <T>(input: T): T;
}

interface ToFormattable {
    toFormat(format: object): string;
    toFormat(decimalPlaces: number, format: object): string;
}
