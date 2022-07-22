import chai, { expect } from "chai";
import { createFixtureLoader, deployContract, MockProvider, solidity } from "ethereum-waffle";
import { Contract } from "ethers";

import { v2Fixture } from "./shared/fixtures";
import { encodePrice, expandTo18Decimals, mineBlock } from "./shared/utilities";

import ExampleOracleSimple from "../artifacts/contracts/examples/ExampleOracleSimple.sol/ExampleOracleSimple.json";

chai.use(solidity);

const overrides = {
    gasLimit: 30000000,
};

const token0Amount = expandTo18Decimals(5);
const token1Amount = expandTo18Decimals(10);

describe("ExampleOracleSimple", () => {
    const provider = new MockProvider({
        ganacheOptions: {
            hardfork: "istanbul",
            mnemonic: "horn horn horn horn horn horn horn horn horn horn horn horn",
            gasLimit: 30000000,
        }
    });
    const [wallet] = provider.getWallets();
    const loadFixture = createFixtureLoader([wallet], provider);

    let token0: Contract;
    let token1: Contract;
    let pair: Contract;
    let exampleOracleSimple: Contract;

    async function addLiquidity() {
        await token0.transfer(pair.address, token0Amount);
        await token1.transfer(pair.address, token1Amount);
        await pair.mint(wallet.address, overrides);
    }

    beforeEach(async function () {
        const fixture = await loadFixture(v2Fixture);

        token0 = fixture.token0;
        token1 = fixture.token1;
        pair = fixture.pair;
        await addLiquidity();
        exampleOracleSimple = await deployContract(
            wallet,
            ExampleOracleSimple,
            [fixture.factoryV2.address, token0.address, token1.address],
            overrides,
        );
    });

    it("update", async () => {
        const blockTimestamp = (await pair.getReserves())[2];
        await mineBlock(provider, blockTimestamp + 60 * 60 * 23);
        await expect(exampleOracleSimple.update(overrides)).to.be.reverted;
        await mineBlock(provider, blockTimestamp + 60 * 60 * 24);
        await exampleOracleSimple.update(overrides);

        const expectedPrice = encodePrice(token0Amount, token1Amount);

        expect(await exampleOracleSimple.price0Average()).to.eq(expectedPrice[0]);
        expect(await exampleOracleSimple.price1Average()).to.eq(expectedPrice[1]);

        expect(await exampleOracleSimple.consult(token0.address, token0Amount)).to.eq(token1Amount);
        expect(await exampleOracleSimple.consult(token1.address, token1Amount)).to.eq(token0Amount);
    });
});
