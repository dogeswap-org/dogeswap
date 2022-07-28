import { INIT_CODE_HASH } from "../src/constants";

import { keccak256 } from "@ethersproject/solidity";
import { bytecode } from "../../contracts-core/artifacts/contracts/DogeSwapV2Pair.sol/DogeSwapV2Pair.json";

// this _could_ go in constants, except that it would cost every consumer of the sdk the CPU to compute the hash
// and load the JSON.
const COMPUTED_INIT_CODE_HASH = keccak256(["bytes"], [bytecode]);

describe("constants", () => {
    describe("INIT_CODE_HASH", () => {
        it("matches computed bytecode hash", () => {
            expect(COMPUTED_INIT_CODE_HASH).toEqual(INIT_CODE_HASH);
        });
    });
});
