import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
import IUniswapV2Pair from "../../contracts-core/artifacts/contracts/interfaces/IDogeSwapV2Pair.sol/IDogeSwapV2Pair.json";

import { deployContract, fixture } from "./shared/fixtures";
import { expandTo18Decimals, getApprovalDigest, MINIMUM_LIQUIDITY } from "./shared/utilities";

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ecsign } from "ethereumjs-util";

const {
    constants: { MaxUint256 },
} = ethers;

const overrides = {
    gasLimit: 9999999,
};

describe("UniswapV2Router02", () => {
    let token0: Contract;
    let token1: Contract;
    let router: Contract;
    beforeEach(async function () {
        const loaded = await loadFixture(fixture);
        token0 = loaded.token0;
        token1 = loaded.token1;
        router = loaded.router;
    });

    it("quote", async () => {
        expect(await router.quote(BigNumber.from(1), BigNumber.from(100), BigNumber.from(200))).to.eq(
            BigNumber.from(2),
        );
        expect(await router.quote(BigNumber.from(2), BigNumber.from(200), BigNumber.from(100))).to.eq(
            BigNumber.from(1),
        );
        await expect(router.quote(BigNumber.from(0), BigNumber.from(100), BigNumber.from(200))).to.be.revertedWith(
            "DogeSwapV2Library: INSUFFICIENT_AMOUNT",
        );
        await expect(router.quote(BigNumber.from(1), BigNumber.from(0), BigNumber.from(200))).to.be.revertedWith(
            "DogeSwapV2Library: INSUFFICIENT_LIQUIDITY",
        );
        await expect(router.quote(BigNumber.from(1), BigNumber.from(100), BigNumber.from(0))).to.be.revertedWith(
            "DogeSwapV2Library: INSUFFICIENT_LIQUIDITY",
        );
    });

    it("getAmountOut", async () => {
        expect(await router.getAmountOut(BigNumber.from(2), BigNumber.from(100), BigNumber.from(100))).to.eq(
            BigNumber.from(1),
        );
        await expect(
            router.getAmountOut(BigNumber.from(0), BigNumber.from(100), BigNumber.from(100)),
        ).to.be.revertedWith("DogeSwapV2Library: INSUFFICIENT_INPUT_AMOUNT");
        await expect(router.getAmountOut(BigNumber.from(2), BigNumber.from(0), BigNumber.from(100))).to.be.revertedWith(
            "DogeSwapV2Library: INSUFFICIENT_LIQUIDITY",
        );
        await expect(router.getAmountOut(BigNumber.from(2), BigNumber.from(100), BigNumber.from(0))).to.be.revertedWith(
            "DogeSwapV2Library: INSUFFICIENT_LIQUIDITY",
        );
    });

    it("getAmountIn", async () => {
        expect(await router.getAmountIn(BigNumber.from(1), BigNumber.from(100), BigNumber.from(100))).to.eq(
            BigNumber.from(2),
        );
        await expect(
            router.getAmountIn(BigNumber.from(0), BigNumber.from(100), BigNumber.from(100)),
        ).to.be.revertedWith("DogeSwapV2Library: INSUFFICIENT_OUTPUT_AMOUNT");
        await expect(router.getAmountIn(BigNumber.from(1), BigNumber.from(0), BigNumber.from(100))).to.be.revertedWith(
            "DogeSwapV2Library: INSUFFICIENT_LIQUIDITY",
        );
        await expect(router.getAmountIn(BigNumber.from(1), BigNumber.from(100), BigNumber.from(0))).to.be.revertedWith(
            "DogeSwapV2Library: INSUFFICIENT_LIQUIDITY",
        );
    });

    it("getAmountsOut", async () => {
        const [owner] = await ethers.getSigners();

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
            "DogeSwapV2Library: INVALID_PATH",
        );
        const path = [token0.address, token1.address];
        expect(await router.getAmountsOut(BigNumber.from(2), path)).to.deep.eq([BigNumber.from(2), BigNumber.from(1)]);
    });

    it("getAmountsIn", async () => {
        const [owner] = await ethers.getSigners();

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
            "DogeSwapV2Library: INVALID_PATH",
        );
        const path = [token0.address, token1.address];
        expect(await router.getAmountsIn(BigNumber.from(1), path)).to.deep.eq([BigNumber.from(2), BigNumber.from(1)]);
    });
});

describe("fee-on-transfer tokens", () => {
    const ownerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Same as first localnet account.

    let DTT: Contract;
    let WWDOGE: Contract;
    let router: Contract;
    let pair: Contract;
    let owner: SignerWithAddress;
    beforeEach(async function () {
        owner = (await ethers.getSigners())[0];

        const loaded = await loadFixture(fixture);

        WWDOGE = loaded.WWDOGE;
        router = loaded.router;
        pair = loaded.pair;
        const { factory } = loaded;

        DTT = await deployContract("DeflatingERC20", owner, expandTo18Decimals(10000));

        // make a DTT<>WWDOGE pair
        await factory.createPair(DTT.address, WWDOGE.address);
        const pairAddress = await factory.getPair(DTT.address, WWDOGE.address);
        pair = new Contract(pairAddress, JSON.stringify(IUniswapV2Pair.abi), owner);
    });

    afterEach(async function () {
        expect(await ethers.provider.getBalance(router.address)).to.eq(0);
    });

    async function addLiquidity(DTTAmount: BigNumber, WWDOGEAmount: BigNumber) {
        const [owner] = await ethers.getSigners();

        await DTT.approve(router.address, MaxUint256);
        await router.addLiquidityWDOGE(DTT.address, DTTAmount, DTTAmount, WWDOGEAmount, owner.address, MaxUint256, {
            ...overrides,
            value: WWDOGEAmount,
        });
    }

    it("removeLiquidityWDOGESupportingFeeOnTransferTokens", async () => {
        const DTTAmount = expandTo18Decimals(1);
        const WDOGEAmount = expandTo18Decimals(4);
        await addLiquidity(DTTAmount, WDOGEAmount);

        const DTTInPair = await DTT.balanceOf(pair.address);
        const WWDOGEInPair = await WWDOGE.balanceOf(pair.address);
        const liquidity = await pair.balanceOf(owner.address);
        const totalSupply = await pair.totalSupply();
        const NaiveDTTExpected = DTTInPair.mul(liquidity).div(totalSupply);
        const WWDOGEExpected = WWDOGEInPair.mul(liquidity).div(totalSupply);

        await pair.approve(router.address, MaxUint256);
        await router.removeLiquidityWDOGESupportingFeeOnTransferTokens(
            DTT.address,
            liquidity,
            NaiveDTTExpected,
            WWDOGEExpected,
            owner.address,
            MaxUint256,
            overrides,
        );
    });

    it("removeLiquidityWDOGEWithPermitSupportingFeeOnTransferTokens", async () => {
        const DTTAmount = expandTo18Decimals(1).mul(100).div(99);
        const WDOGEAmount = expandTo18Decimals(4);
        await addLiquidity(DTTAmount, WDOGEAmount);

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
        const WWDOGEInPair = await WWDOGE.balanceOf(pair.address);
        const liquidity = await pair.balanceOf(owner.address);
        const totalSupply = await pair.totalSupply();
        const NaiveDTTExpected = DTTInPair.mul(liquidity).div(totalSupply);
        const WWDOGEExpected = WWDOGEInPair.mul(liquidity).div(totalSupply);

        await pair.approve(router.address, MaxUint256);
        await router.removeLiquidityWDOGEWithPermitSupportingFeeOnTransferTokens(
            DTT.address,
            liquidity,
            NaiveDTTExpected,
            WWDOGEExpected,
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
        const WDOGEAmount = expandTo18Decimals(10);
        const amountIn = expandTo18Decimals(1);

        let owner: SignerWithAddress;

        beforeEach(async () => {
            owner = (await ethers.getSigners())[0];
            await addLiquidity(DTTAmount, WDOGEAmount);
        });

        it("DTT -> WWDOGE", async () => {
            await DTT.approve(router.address, MaxUint256);

            await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                amountIn,
                0,
                [DTT.address, WWDOGE.address],
                owner.address,
                MaxUint256,
                overrides,
            );
        });

        // WWDOGE -> DTT
        it("WWDOGE -> DTT", async () => {
            await WWDOGE.deposit({ value: amountIn }); // mint WWDOGE
            await WWDOGE.approve(router.address, MaxUint256);

            await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                amountIn,
                0,
                [WWDOGE.address, DTT.address],
                owner.address,
                MaxUint256,
                overrides,
            );
        });
    });

    // WDOGE -> DTT
    it("swapExactWDOGEForTokensSupportingFeeOnTransferTokens", async () => {
        const DTTAmount = expandTo18Decimals(10).mul(100).div(99);
        const WDOGEAmount = expandTo18Decimals(5);
        const swapAmount = expandTo18Decimals(1);
        await addLiquidity(DTTAmount, WDOGEAmount);

        await router.swapExactWDOGEForTokensSupportingFeeOnTransferTokens(
            0,
            [WWDOGE.address, DTT.address],
            owner.address,
            MaxUint256,
            {
                ...overrides,
                value: swapAmount,
            },
        );
    });

    // DTT -> WDOGE
    it("swapExactTokensForWDOGESupportingFeeOnTransferTokens", async () => {
        const [owner] = await ethers.getSigners();

        const DTTAmount = expandTo18Decimals(5).mul(100).div(99);
        const WDOGEAmount = expandTo18Decimals(10);
        const swapAmount = expandTo18Decimals(1);

        await addLiquidity(DTTAmount, WDOGEAmount);
        await DTT.approve(router.address, MaxUint256);

        await router.swapExactTokensForWDOGESupportingFeeOnTransferTokens(
            swapAmount,
            0,
            [DTT.address, WWDOGE.address],
            owner.address,
            MaxUint256,
            overrides,
        );
    });
});

describe("fee-on-transfer tokens: reloaded", () => {
    let DTT: Contract;
    let DTT2: Contract;
    let router: Contract;
    let owner: SignerWithAddress;
    beforeEach(async function () {
        owner = (await ethers.getSigners())[0];

        const loaded = await loadFixture(fixture);

        router = loaded.router;

        DTT = await deployContract("DeflatingERC20", owner, expandTo18Decimals(10000));
        DTT2 = await deployContract("DeflatingERC20", owner, expandTo18Decimals(10000));

        // make a DTT<>WWDOGE pair
        await loaded.factory.createPair(DTT.address, DTT2.address);
    });

    afterEach(async function () {
        expect(await ethers.provider.getBalance(router.address)).to.eq(0);
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
