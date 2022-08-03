import invariant from "tiny-invariant";
import { ChainId } from "../constants";
import validateAndParseAddress from "../utils/validateAndParseAddress";
import { BaseCurrency } from "./baseCurrency";

/**
 * Represents an ERC20 token with a unique address and some metadata.
 */
export class Token<T extends string = string> extends BaseCurrency<T> {
    public readonly isNativeToken: false = false;
    public readonly isToken: true = true;

    public readonly chainId: ChainId;
    public readonly address: string;

    public constructor(chainId: ChainId, address: string, decimals: number, symbol: T, name?: string) {
        super(decimals, symbol, name);
        this.chainId = chainId;
        this.address = validateAndParseAddress(address);
    }

    /**
     * Returns true if the two tokens are equivalent, i.e. have the same chainId and address.
     * @param other other token to compare
     */
    public equals(other: Token): boolean {
        // short circuit on reference equality
        if (this === other) {
            return true;
        }
        return this.chainId === other.chainId && this.address === other.address;
    }

    /**
     * Returns true if the address of this token sorts before the address of the other token
     * @param other other token to compare
     * @throws if the tokens have the same address
     * @throws if the tokens are on different chains
     */
    public sortsBefore(other: Token): boolean {
        invariant(this.chainId === other.chainId, "CHAIN_IDS");
        invariant(this.address !== other.address, "ADDRESSES");
        return this.address.toLowerCase() < other.address.toLowerCase();
    }
}
