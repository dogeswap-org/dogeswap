import JSBI from "jsbi";
import { ChainId, MaxUint256 } from "../../../src/constants";
import CurrencyAmount from "../../../src/entities/fractions/currencyAmount";
import { Token } from "../../../src/entities/token";

describe("CurrencyAmount", () => {
    const ADDRESS_ONE = "0x0000000000000000000000000000000000000001";

    describe("constructor", () => {
        it("works", () => {
            const token = new Token(ChainId.MAINNET, ADDRESS_ONE, 18, "");
            const amount = new CurrencyAmount(token, 100);
            expect(amount.raw).toEqual(JSBI.BigInt(100));
        });
    });

    describe("#ether", () => {
        it("produces ether amount", () => {
            const amount = CurrencyAmount.dogechain(100);
            expect(amount.raw).toEqual(JSBI.BigInt(100));
        });
    });

    it("token amount can be max uint256", () => {
        const amount = new CurrencyAmount(new Token(ChainId.MAINNET, ADDRESS_ONE, 18, ""), MaxUint256);
        expect(amount.raw).toEqual(MaxUint256);
    });
});
