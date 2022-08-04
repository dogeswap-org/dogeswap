import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
import IUniswapV2Pair from "../../contracts-core/artifacts/contracts/interfaces/IDogeSwapV2Pair.sol/IDogeSwapV2Pair.json";

import { createFixture, deployContract } from "./shared/fixtures";
import { expandTo18Decimals, getApprovalDigest, MINIMUM_LIQUIDITY } from "./shared/utilities";

import { ecsign } from "ethereumjs-util";

const {
    constants: { MaxUint256 },
} = ethers;

const overrides = {
    gasLimit: 9999999,
};

describe("UniswapV2Router02", async () => {
    const [owner] = await ethers.getSigners();

    let token0: Contract;
    let token1: Contract;
    let router: Contract;
    beforeEach(async function () {
        const fixture = await createFixture();
        token0 = fixture.token0;
        token1 = fixture.token1;
        router = fixture.router;
    });

    it("quote", async () => {
        expect(await router.quote(BigNumber.from(1), BigNumber.from(100), BigNumber.from(200))).to.eq(
            BigNumber.from(2),
        );
        expect(await router.quote(BigNumber.from(2), BigNumber.from(200), BigNumber.from(100))).to.eq(
            BigNumber.from(1),
        );
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
        expect(await router.getAmountOut(BigNumber.from(2), BigNumber.from(100), BigNumber.from(100))).to.eq(
            BigNumber.from(1),
        );
        await expect(
            router.getAmountOut(BigNumber.from(0), BigNumber.from(100), BigNumber.from(100)),
        ).to.be.revertedWith("UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT");
        await expect(router.getAmountOut(BigNumber.from(2), BigNumber.from(0), BigNumber.from(100))).to.be.revertedWith(
            "UniswapV2Library: INSUFFICIENT_LIQUIDITY",
        );
        await expect(router.getAmountOut(BigNumber.from(2), BigNumber.from(100), BigNumber.from(0))).to.be.revertedWith(
            "UniswapV2Library: INSUFFICIENT_LIQUIDITY",
        );
    });

    it("getAmountIn", async () => {
        expect(await router.getAmountIn(BigNumber.from(1), BigNumber.from(100), BigNumber.from(100))).to.eq(
            BigNumber.from(2),
        );
        await expect(
            router.getAmountIn(BigNumber.from(0), BigNumber.from(100), BigNumber.from(100)),
        ).to.be.revertedWith("UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT");
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
            owner.address,
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
            owner.address,
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

describe("fee-on-transfer tokens", async () => {
    const [owner] = await ethers.getSigners();
    const ownerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Same as first localnet account.

    let DTT: Contract;
    let WETH: Contract;
    let router: Contract;
    let pair: Contract;
    beforeEach(async function () {
        const fixture = await createFixture();

        WETH = fixture.WETH;
        router = fixture.router;

        DTT = await deployContract("DeflatingERC20", owner, "DTT", "DTT", expandTo18Decimals(10000));

        // make a DTT<>WETH pair
        await fixture.factory.createPair(DTT.address, WETH.address);
        const pairAddress = await fixture.factory.getPair(DTT.address, WETH.address);
        pair = new Contract(pairAddress, JSON.stringify(IUniswapV2Pair.abi), owner);
    });

    afterEach(async function () {
        expect(await ethers.getDefaultProvider().getBalance(router.address)).to.eq(0);
    });

    async function addLiquidity(DTTAmount: BigNumber, WETHAmount: BigNumber) {
        await DTT.approve(router.address, MaxUint256);
        await router.addLiquidityETH(DTT.address, DTTAmount, DTTAmount, WETHAmount, owner.address, MaxUint256, {
            ...overrides,
            value: WETHAmount,
        });
    }

    it("removeLiquidityETHSupportingFeeOnTransferTokens", async () => {
        const DTTAmount = expandTo18Decimals(1);
        const ETHAmount = expandTo18Decimals(4);
        await addLiquidity(DTTAmount, ETHAmount);

        const DTTInPair = await DTT.balanceOf(pair.address);
        const WETHInPair = await WETH.balanceOf(pair.address);
        const liquidity = await pair.balanceOf(owner.address);
        const totalSupply = await pair.totalSupply();
        const NaiveDTTExpected = DTTInPair.mul(liquidity).div(totalSupply);
        const WETHExpected = WETHInPair.mul(liquidity).div(totalSupply);

        await pair.approve(router.address, MaxUint256);
        await router.removeLiquidityETHSupportingFeeOnTransferTokens(
            DTT.address,
            liquidity,
            NaiveDTTExpected,
            WETHExpected,
            owner.address,
            MaxUint256,
            overrides,
        );
    });

    it("removeLiquidityETHWithPermitSupportingFeeOnTransferTokens", async () => {
        const DTTAmount = expandTo18Decimals(1).mul(100).div(99);
        const ETHAmount = expandTo18Decimals(4);
        await addLiquidity(DTTAmount, ETHAmount);

        const expectedLiquidity = expandTo18Decimals(2);

        const nonce = await pair.nonces(owner.address);
        const digest = await getApprovalDigest(
            pair,
            { owner: owner.address, spender: router.address, value: expectedLiquidity.sub(MINIMUM_LIQUIDITY) },
            nonce,
            MaxUint256,
        );

        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), "hex"), Buffer.from(ownerPrivateKey.slice(2), "hex"));

        const DTTInPair = await DTT.balanceOf(pair.address);
        const WETHInPair = await WETH.balanceOf(pair.address);
        const liquidity = await pair.balanceOf(owner.address);
        const totalSupply = await pair.totalSupply();
        const NaiveDTTExpected = DTTInPair.mul(liquidity).div(totalSupply);
        const WETHExpected = WETHInPair.mul(liquidity).div(totalSupply);

        await pair.approve(router.address, MaxUint256);
        await router.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
            DTT.address,
            liquidity,
            NaiveDTTExpected,
            WETHExpected,
            owner.address,
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

        it("DTT -> WETH", async () => {
            await DTT.approve(router.address, MaxUint256);

            await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                amountIn,
                0,
                [DTT.address, WETH.address],
                owner.address,
                MaxUint256,
                overrides,
            );
        });

        // WETH -> DTT
        it("WETH -> DTT", async () => {
            await WETH.deposit({ value: amountIn }); // mint WETH
            await WETH.approve(router.address, MaxUint256);

            await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                amountIn,
                0,
                [WETH.address, DTT.address],
                owner.address,
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
            [WETH.address, DTT.address],
            owner.address,
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
            [DTT.address, WETH.address],
            owner.address,
            MaxUint256,
            overrides,
        );
    });
});

describe("fee-on-transfer tokens: reloaded", async () => {
    const [owner] = await ethers.getSigners();

    let DTT: Contract;
    let DTT2: Contract;
    let router: Contract;
    beforeEach(async function () {
        const fixture = await createFixture();

        router = fixture.router;

        DTT = await deployContract("DeflatingERC20", owner, "DTT", "DTT", expandTo18Decimals(10000));
        DTT2 = await deployContract("DeflatingERC20", owner, "DTT2", "DTT2", expandTo18Decimals(10000));

        // make a DTT<>WETH pair
        await fixture.factory.createPair(DTT.address, DTT2.address);
        const pairAddress = await fixture.factory.getPair(DTT.address, DTT2.address);
    });

    afterEach(async function () {
        expect(await ethers.getDefaultProvider().getBalance(router.address)).to.eq(0);
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
            owner.address,
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
                owner.address,
                MaxUint256,
                overrides,
            );
        });
    });
});
