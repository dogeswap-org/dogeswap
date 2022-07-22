import IUniswapV2Pair from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import chai, { expect } from "chai";
import { createFixtureLoader, deployContract, MockProvider, solidity } from "ethereum-waffle";
import { BigNumber, Contract } from "ethers";

import { v2Fixture } from "./shared/fixtures";
import { expandTo18Decimals, getApprovalDigest, MINIMUM_LIQUIDITY } from "./shared/utilities";

import { ecsign } from "ethereumjs-util";

import { MaxUint256 } from "@ethersproject/constants";
import DeflatingERC20 from "../artifacts/contracts/test/DeflatingERC20.sol/DeflatingERC20.json";

chai.use(solidity);

const overrides = {
    gasLimit: 30000000,
};

describe("UniswapV2Router02", () => {
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
    let router: Contract;
    beforeEach(async function () {
        const fixture = await loadFixture(v2Fixture);
        token0 = fixture.token0;
        token1 = fixture.token1;
        router = fixture.router02;
    });

    it("quote", async () => {
        expect(await router.quote(BigNumber.from(1), BigNumber.from(100), BigNumber.from(200))).to.eq(BigNumber.from(2));
        expect(await router.quote(BigNumber.from(2), BigNumber.from(200), BigNumber.from(100))).to.eq(BigNumber.from(1));
        await expect(router.quote(BigNumber.from(0), BigNumber.from(100), BigNumber.from(200))).to.be.revertedWith(
            "UniswapV2Library: INSUFFICIENT_AMOUNT",
        );
        await expect(router.quote(BigNumber.from(1), BigNumber.from(0), BigNumber.from(200))).to.be.revertedWith(
            "UniswapV2Library: INSUFFICIENT_LIQUIDITY",
        );
        await expect(router.quote(BigNumber.from(1), BigNumber.from(100), BigNumber.from(0))).to.be.revertedWith(
            "UniswapV2Library: INSUFFICIENT_LIQUIDITY",
        );
    });

    it("getAmountOut", async () => {
        expect(await router.getAmountOut(BigNumber.from(2), BigNumber.from(100), BigNumber.from(100))).to.eq(BigNumber.from(1));
        await expect(router.getAmountOut(BigNumber.from(0), BigNumber.from(100), BigNumber.from(100))).to.be.revertedWith(
            "UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT",
        );
        await expect(router.getAmountOut(BigNumber.from(2), BigNumber.from(0), BigNumber.from(100))).to.be.revertedWith(
            "UniswapV2Library: INSUFFICIENT_LIQUIDITY",
        );
        await expect(router.getAmountOut(BigNumber.from(2), BigNumber.from(100), BigNumber.from(0))).to.be.revertedWith(
            "UniswapV2Library: INSUFFICIENT_LIQUIDITY",
        );
    });

    it("getAmountIn", async () => {
        expect(await router.getAmountIn(BigNumber.from(1), BigNumber.from(100), BigNumber.from(100))).to.eq(BigNumber.from(2));
        await expect(router.getAmountIn(BigNumber.from(0), BigNumber.from(100), BigNumber.from(100))).to.be.revertedWith(
            "UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT",
        );
        await expect(router.getAmountIn(BigNumber.from(1), BigNumber.from(0), BigNumber.from(100))).to.be.revertedWith(
            "UniswapV2Library: INSUFFICIENT_LIQUIDITY",
        );
        await expect(router.getAmountIn(BigNumber.from(1), BigNumber.from(100), BigNumber.from(0))).to.be.revertedWith(
            "UniswapV2Library: INSUFFICIENT_LIQUIDITY",
        );
    });

    it("getAmountsOut", async () => {
        await token0.approve(router.address, MaxUint256);
        await token1.approve(router.address, MaxUint256);
        await router.addLiquidity(
            token0.address,
            token1.address,
            BigNumber.from(10000),
            BigNumber.from(10000),
            0,
            0,
            wallet.address,
            MaxUint256,
            overrides,
        );

        await expect(router.getAmountsOut(BigNumber.from(2), [token0.address])).to.be.revertedWith(
            "UniswapV2Library: INVALID_PATH",
        );
        const path = [token0.address, token1.address];
        expect(await router.getAmountsOut(BigNumber.from(2), path)).to.deep.eq([BigNumber.from(2), BigNumber.from(1)]);
    });

    it("getAmountsIn", async () => {
        await token0.approve(router.address, MaxUint256);
        await token1.approve(router.address, MaxUint256);
        await router.addLiquidity(
            token0.address,
            token1.address,
            BigNumber.from(10000),
            BigNumber.from(10000),
            0,
            0,
            wallet.address,
            MaxUint256,
            overrides,
        );

        await expect(router.getAmountsIn(BigNumber.from(1), [token0.address])).to.be.revertedWith(
            "UniswapV2Library: INVALID_PATH",
        );
        const path = [token0.address, token1.address];
        expect(await router.getAmountsIn(BigNumber.from(1), path)).to.deep.eq([BigNumber.from(2), BigNumber.from(1)]);
    });
});

describe("fee-on-transfer tokens", () => {
    const provider = new MockProvider({
        ganacheOptions: {
            hardfork: "istanbul",
            mnemonic: "horn horn horn horn horn horn horn horn horn horn horn horn",
            gasLimit: 30000000,
        }
    });
    const [wallet] = provider.getWallets();
    const loadFixture = createFixtureLoader([wallet], provider);

    let DTT: Contract;
    let WDC: Contract;
    let router: Contract;
    let pair: Contract;
    beforeEach(async function () {
        const fixture = await loadFixture(v2Fixture);

        WDC = fixture.WDC;
        router = fixture.router02;

        DTT = await deployContract(wallet, DeflatingERC20, [expandTo18Decimals(10000)]);

        // make a DTT<>WDC pair
        await fixture.factoryV2.createPair(DTT.address, WDC.address);
        const pairAddress = await fixture.factoryV2.getPair(DTT.address, WDC.address);
        pair = new Contract(pairAddress, JSON.stringify(IUniswapV2Pair.abi), provider).connect(wallet);
    });

    afterEach(async function () {
        expect(await provider.getBalance(router.address)).to.eq(0);
    });

    async function addLiquidity(DTTAmount: BigNumber, WDCAmount: BigNumber) {
        await DTT.approve(router.address, MaxUint256);
        await router.addLiquidityETH(DTT.address, DTTAmount, DTTAmount, WDCAmount, wallet.address, MaxUint256, {
            ...overrides,
            value: WDCAmount,
        });
    }

    it("removeLiquidityETHSupportingFeeOnTransferTokens", async () => {
        const DTTAmount = expandTo18Decimals(1);
        const ETHAmount = expandTo18Decimals(4);
        await addLiquidity(DTTAmount, ETHAmount);

        const DTTInPair = await DTT.balanceOf(pair.address);
        const WDCInPair = await WDC.balanceOf(pair.address);
        const liquidity = await pair.balanceOf(wallet.address);
        const totalSupply = await pair.totalSupply();
        const NaiveDTTExpected = DTTInPair.mul(liquidity).div(totalSupply);
        const WDCExpected = WDCInPair.mul(liquidity).div(totalSupply);

        await pair.approve(router.address, MaxUint256);
        await router.removeLiquidityETHSupportingFeeOnTransferTokens(
            DTT.address,
            liquidity,
            NaiveDTTExpected,
            WDCExpected,
            wallet.address,
            MaxUint256,
            overrides,
        );
    });

    it("removeLiquidityETHWithPermitSupportingFeeOnTransferTokens", async () => {
        const DTTAmount = expandTo18Decimals(1).mul(100).div(99);
        const ETHAmount = expandTo18Decimals(4);
        await addLiquidity(DTTAmount, ETHAmount);

        const expectedLiquidity = expandTo18Decimals(2);

        const nonce = await pair.nonces(wallet.address);
        const digest = await getApprovalDigest(
            pair,
            { owner: wallet.address, spender: router.address, value: expectedLiquidity.sub(MINIMUM_LIQUIDITY) },
            nonce,
            MaxUint256,
        );
        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), "hex"), Buffer.from(wallet.privateKey.slice(2), "hex"));

        const DTTInPair = await DTT.balanceOf(pair.address);
        const WDCInPair = await WDC.balanceOf(pair.address);
        const liquidity = await pair.balanceOf(wallet.address);
        const totalSupply = await pair.totalSupply();
        const NaiveDTTExpected = DTTInPair.mul(liquidity).div(totalSupply);
        const WDCExpected = WDCInPair.mul(liquidity).div(totalSupply);

        await pair.approve(router.address, MaxUint256);
        await router.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
            DTT.address,
            liquidity,
            NaiveDTTExpected,
            WDCExpected,
            wallet.address,
            MaxUint256,
            false,
            v,
            r,
            s,
            overrides,
        );
    });

    describe("swapExactTokensForTokensSupportingFeeOnTransferTokens", () => {
        const DTTAmount = expandTo18Decimals(5).mul(100).div(99);
        const ETHAmount = expandTo18Decimals(10);
        const amountIn = expandTo18Decimals(1);

        beforeEach(async () => {
            await addLiquidity(DTTAmount, ETHAmount);
        });

        it("DTT -> WDC", async () => {
            await DTT.approve(router.address, MaxUint256);

            await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                amountIn,
                0,
                [DTT.address, WDC.address],
                wallet.address,
                MaxUint256,
                overrides,
            );
        });

        // WDC -> DTT
        it("WDC -> DTT", async () => {
            await WDC.deposit({ value: amountIn }); // mint WDC
            await WDC.approve(router.address, MaxUint256);

            await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                amountIn,
                0,
                [WDC.address, DTT.address],
                wallet.address,
                MaxUint256,
                overrides,
            );
        });
    });

    // ETH -> DTT
    it("swapExactETHForTokensSupportingFeeOnTransferTokens", async () => {
        const DTTAmount = expandTo18Decimals(10).mul(100).div(99);
        const ETHAmount = expandTo18Decimals(5);
        const swapAmount = expandTo18Decimals(1);
        await addLiquidity(DTTAmount, ETHAmount);

        await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
            0,
            [WDC.address, DTT.address],
            wallet.address,
            MaxUint256,
            {
                ...overrides,
                value: swapAmount,
            },
        );
    });

    // DTT -> ETH
    it("swapExactTokensForETHSupportingFeeOnTransferTokens", async () => {
        const DTTAmount = expandTo18Decimals(5).mul(100).div(99);
        const ETHAmount = expandTo18Decimals(10);
        const swapAmount = expandTo18Decimals(1);

        await addLiquidity(DTTAmount, ETHAmount);
        await DTT.approve(router.address, MaxUint256);

        await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            swapAmount,
            0,
            [DTT.address, WDC.address],
            wallet.address,
            MaxUint256,
            overrides,
        );
    });
});

describe("fee-on-transfer tokens: reloaded", () => {
    const provider = new MockProvider({
        ganacheOptions: {
            hardfork: "istanbul",
            mnemonic: "horn horn horn horn horn horn horn horn horn horn horn horn",
            gasLimit: 30000000,
        }
    });
    const [wallet] = provider.getWallets();
    const loadFixture = createFixtureLoader([wallet], provider);

    let DTT: Contract;
    let DTT2: Contract;
    let router: Contract;
    beforeEach(async function () {
        const fixture = await loadFixture(v2Fixture);

        router = fixture.router02;

        DTT = await deployContract(wallet, DeflatingERC20, [expandTo18Decimals(10000)]);
        DTT2 = await deployContract(wallet, DeflatingERC20, [expandTo18Decimals(10000)]);

        // make a DTT<>WDC pair
        await fixture.factoryV2.createPair(DTT.address, DTT2.address);
        const pairAddress = await fixture.factoryV2.getPair(DTT.address, DTT2.address);
    });

    afterEach(async function () {
        expect(await provider.getBalance(router.address)).to.eq(0);
    });

    async function addLiquidity(DTTAmount: BigNumber, DTT2Amount: BigNumber) {
        await DTT.approve(router.address, MaxUint256);
        await DTT2.approve(router.address, MaxUint256);
        await router.addLiquidity(
            DTT.address,
            DTT2.address,
            DTTAmount,
            DTT2Amount,
            DTTAmount,
            DTT2Amount,
            wallet.address,
            MaxUint256,
            overrides,
        );
    }

    describe("swapExactTokensForTokensSupportingFeeOnTransferTokens", () => {
        const DTTAmount = expandTo18Decimals(5).mul(100).div(99);
        const DTT2Amount = expandTo18Decimals(5);
        const amountIn = expandTo18Decimals(1);

        beforeEach(async () => {
            await addLiquidity(DTTAmount, DTT2Amount);
        });

        it("DTT -> DTT2", async () => {
            await DTT.approve(router.address, MaxUint256);

            await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                amountIn,
                0,
                [DTT.address, DTT2.address],
                wallet.address,
                MaxUint256,
                overrides,
            );
        });
    });
});
