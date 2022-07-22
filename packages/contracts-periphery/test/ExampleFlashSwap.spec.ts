import chai, { expect } from "chai";
import { createFixtureLoader, deployContract, MockProvider, solidity } from "ethereum-waffle";
import { Contract } from "ethers";

import { v2Fixture } from "./shared/fixtures";
import { expandTo18Decimals } from "./shared/utilities";

import ExampleFlashSwap from "../artifacts/contracts/examples/ExampleFlashSwap.sol/ExampleFlashSwap.json";

chai.use(solidity);

const overrides = {
    gasLimit: 30000000,
    gasPrice: 0,
};

describe("ExampleFlashSwap", () => {
    const provider = new MockProvider({
        ganacheOptions: {
            hardfork: "istanbul",
            mnemonic: "horn horn horn horn horn horn horn horn horn horn horn horn",
            gasLimit: 30000000,
        }
    });
    const [wallet] = provider.getWallets();
    const loadFixture = createFixtureLoader([wallet], provider);

    let WDC: Contract;
    let WDCPartner: Contract;
    let WDCExchangeV1: Contract;
    let WDCPair: Contract;
    let flashSwapExample: Contract;
    beforeEach(async function () {
        const fixture = await loadFixture(v2Fixture);

        WDC = fixture.WDC;
        WDCPartner = fixture.WDCPartner;
        WDCExchangeV1 = fixture.WDCExchangeV1;
        WDCPair = fixture.WDCPair;
        flashSwapExample = await deployContract(
            wallet,
            ExampleFlashSwap,
            [fixture.factoryV2.address, fixture.factoryV1.address, fixture.router.address],
            overrides,
        );
    });

    it("uniswapV2Call:0", async () => {
        // add liquidity to V1 at a rate of 1 ETH / 200 X
        const WDCPartnerAmountV1 = expandTo18Decimals(2000);
        const ETHAmountV1 = expandTo18Decimals(10);
        await WDCPartner.approve(WDCExchangeV1.address, WDCPartnerAmountV1);
        await WDCExchangeV1.addLiquidity(BigNumber.from(1), WDCPartnerAmountV1, MaxUint256, {
            ...overrides,
            value: ETHAmountV1,
        });

        // add liquidity to V2 at a rate of 1 ETH / 100 X
        const WDCPartnerAmountV2 = expandTo18Decimals(1000);
        const ETHAmountV2 = expandTo18Decimals(10);
        await WDCPartner.transfer(WDCPair.address, WDCPartnerAmountV2);
        await WDC.deposit({ value: ETHAmountV2 });
        await WDC.transfer(WDCPair.address, ETHAmountV2);
        await WDCPair.mint(wallet.address, overrides);

        const balanceBefore = await WDCPartner.balanceOf(wallet.address);

        // now, execute arbitrage via uniswapV2Call:
        // receive 1 ETH from V2, get as much X from V1 as we can, repay V2 with minimum X, keep the rest!
        const arbitrageAmount = expandTo18Decimals(1);
        // instead of being 'hard-coded', the above value could be calculated optimally off-chain. this would be
        // better, but it'd be better yet to calculate the amount at runtime, on-chain. unfortunately, this requires a
        // swap-to-price calculation, which is a little tricky, and out of scope for the moment
        const WDCPairToken0 = await WDCPair.token0();
        const amount0 = WDCPairToken0 === WDCPartner.address ? BigNumber.from(0) : arbitrageAmount;
        const amount1 = WDCPairToken0 === WDCPartner.address ? arbitrageAmount : BigNumber.from(0);
        await WDCPair.swap(
            amount0,
            amount1,
            flashSwapExample.address,
            defaultAbiCoder.encode(["uint"], [BigNumber.from(1)]),
            overrides,
        );

        const balanceAfter = await WDCPartner.balanceOf(wallet.address);
        const profit = balanceAfter.sub(balanceBefore).div(expandTo18Decimals(1));
        const reservesV1 = [
            await WDCPartner.balanceOf(WDCExchangeV1.address),
            await provider.getBalance(WDCExchangeV1.address),
        ];
        const priceV1 = reservesV1[0].div(reservesV1[1]);
        const reservesV2 = (await WDCPair.getReserves()).slice(0, 2);
        const priceV2 =
            WDCPairToken0 === WDCPartner.address ? reservesV2[0].div(reservesV2[1]) : reservesV2[1].div(reservesV2[0]);

        expect(profit.toString()).to.eq("69"); // our profit is ~69 tokens
        expect(priceV1.toString()).to.eq("165"); // we pushed the v1 price down to ~165
        expect(priceV2.toString()).to.eq("123"); // we pushed the v2 price up to ~123
    });

    it("uniswapV2Call:1", async () => {
        // add liquidity to V1 at a rate of 1 ETH / 100 X
        const WDCPartnerAmountV1 = expandTo18Decimals(1000);
        const ETHAmountV1 = expandTo18Decimals(10);
        await WDCPartner.approve(WDCExchangeV1.address, WDCPartnerAmountV1);
        await WDCExchangeV1.addLiquidity(BigNumber.from(1), WDCPartnerAmountV1, MaxUint256, {
            ...overrides,
            value: ETHAmountV1,
        });

        // add liquidity to V2 at a rate of 1 ETH / 200 X
        const WDCPartnerAmountV2 = expandTo18Decimals(2000);
        const ETHAmountV2 = expandTo18Decimals(10);
        await WDCPartner.transfer(WDCPair.address, WDCPartnerAmountV2);
        await WDC.deposit({ value: ETHAmountV2 });
        await WDC.transfer(WDCPair.address, ETHAmountV2);
        await WDCPair.mint(wallet.address, overrides);

        const balanceBefore = await provider.getBalance(wallet.address);

        // now, execute arbitrage via uniswapV2Call:
        // receive 200 X from V2, get as much ETH from V1 as we can, repay V2 with minimum ETH, keep the rest!
        const arbitrageAmount = expandTo18Decimals(200);
        // instead of being 'hard-coded', the above value could be calculated optimally off-chain. this would be
        // better, but it'd be better yet to calculate the amount at runtime, on-chain. unfortunately, this requires a
        // swap-to-price calculation, which is a little tricky, and out of scope for the moment
        const WDCPairToken0 = await WDCPair.token0();
        const amount0 = WDCPairToken0 === WDCPartner.address ? arbitrageAmount : BigNumber.from(0);
        const amount1 = WDCPairToken0 === WDCPartner.address ? BigNumber.from(0) : arbitrageAmount;
        await WDCPair.swap(
            amount0,
            amount1,
            flashSwapExample.address,
            defaultAbiCoder.encode(["uint"], [BigNumber.from(1)]),
            overrides,
        );

        const balanceAfter = await provider.getBalance(wallet.address);
        const profit = balanceAfter.sub(balanceBefore);
        const reservesV1 = [
            await WDCPartner.balanceOf(WDCExchangeV1.address),
            await provider.getBalance(WDCExchangeV1.address),
        ];
        const priceV1 = reservesV1[0].div(reservesV1[1]);
        const reservesV2 = (await WDCPair.getReserves()).slice(0, 2);
        const priceV2 =
            WDCPairToken0 === WDCPartner.address ? reservesV2[0].div(reservesV2[1]) : reservesV2[1].div(reservesV2[0]);

        expect(formatEther(profit)).to.eq("0.548043441089763649"); // our profit is ~.5 ETH
        expect(priceV1.toString()).to.eq("143"); // we pushed the v1 price up to ~143
        expect(priceV2.toString()).to.eq("161"); // we pushed the v2 price down to ~161
    });
});
