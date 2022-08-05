import { parse } from "qs";
import { Field } from "../../../src/state/swap/actions";
import { queryParametersToSwapState } from "../../../src/state/swap/hooks";

describe("hooks", () => {
    describe("#queryParametersToSwapState", () => {
        test("WDOGE to DAI", () => {
            expect(
                queryParametersToSwapState(
                    parse(
                        "?inputCurrency=WDOGE&outputCurrency=0x6b175474e89094c44da98b954eedeac495271d0f&exactAmount=20.5&exactField=outPUT",
                        { parseArrays: false, ignoreQueryPrefix: true },
                    ),
                ),
            ).toEqual({
                [Field.OUTPUT]: { currencyId: "0x6B175474E89094C44Da98b954EedeAC495271d0F" },
                [Field.INPUT]: { currencyId: "WDOGE" },
                typedValue: "20.5",
                independentField: Field.OUTPUT,
                recipient: null,
            });
        });

        test("does not duplicate wdoge for invalid output token", () => {
            expect(
                queryParametersToSwapState(
                    parse("?outputCurrency=invalid", { parseArrays: false, ignoreQueryPrefix: true }),
                ),
            ).toEqual({
                [Field.INPUT]: { currencyId: "" },
                [Field.OUTPUT]: { currencyId: "WDOGE" },
                typedValue: "",
                independentField: Field.INPUT,
                recipient: null,
            });
        });

        test("output WDOGE only", () => {
            expect(
                queryParametersToSwapState(
                    parse("?outputCurrency=wdoge&exactAmount=20.5", { parseArrays: false, ignoreQueryPrefix: true }),
                ),
            ).toEqual({
                [Field.OUTPUT]: { currencyId: "WDOGE" },
                [Field.INPUT]: { currencyId: "" },
                typedValue: "20.5",
                independentField: Field.INPUT,
                recipient: null,
            });
        });

        test("invalid recipient", () => {
            expect(
                queryParametersToSwapState(
                    parse("?outputCurrency=wdoge&exactAmount=20.5&recipient=abc", {
                        parseArrays: false,
                        ignoreQueryPrefix: true,
                    }),
                ),
            ).toEqual({
                [Field.OUTPUT]: { currencyId: "WDOGE" },
                [Field.INPUT]: { currencyId: "" },
                typedValue: "20.5",
                independentField: Field.INPUT,
                recipient: null,
            });
        });

        test("valid recipient", () => {
            expect(
                queryParametersToSwapState(
                    parse(
                        "?outputCurrency=wdoge&exactAmount=20.5&recipient=0x0fF2D1eFd7A57B7562b2bf27F3f37899dB27F4a5",
                        {
                            parseArrays: false,
                            ignoreQueryPrefix: true,
                        },
                    ),
                ),
            ).toEqual({
                [Field.OUTPUT]: { currencyId: "WDOGE" },
                [Field.INPUT]: { currencyId: "" },
                typedValue: "20.5",
                independentField: Field.INPUT,
                recipient: "0x0fF2D1eFd7A57B7562b2bf27F3f37899dB27F4a5",
            });
        });
        test("accepts any recipient", () => {
            expect(
                queryParametersToSwapState(
                    parse("?outputCurrency=wdoge&exactAmount=20.5&recipient=bob.argent.xyz", {
                        parseArrays: false,
                        ignoreQueryPrefix: true,
                    }),
                ),
            ).toEqual({
                [Field.OUTPUT]: { currencyId: "WDOGE" },
                [Field.INPUT]: { currencyId: "" },
                typedValue: "20.5",
                independentField: Field.INPUT,
                recipient: "bob.argent.xyz",
            });
        });
    });
});
