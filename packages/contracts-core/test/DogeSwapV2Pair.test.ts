import { AddressZero } from "@ethersproject/constants";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";

import { fullFixture } from "./shared/fixtures";
import { encodePrice, expandTo18Decimals, mineBlock, setAutomine } from "./shared/utilities";

const MINIMUM_LIQUIDITY = BigNumber.from(10).pow(3);

describe("DogeSwapV2Pair", () => {
    let factory: Contract;
    let token0: Contract;
    let token1: Contract;
    let pair: Contract;
    beforeEach(async () => {
        const fixture = await loadFixture(fullFixture);
        factory = fixture.factory;
        token0 = fixture.token0;
        token1 = fixture.token1;
        pair = fixture.pair;
    });

    it("mint", async () => {
        const [owner] = await ethers.getSigners();
        const token0Amount = expandTo18Decimals(1);
        const token1Amount = expandTo18Decimals(4);
        await token0.transfer(pair.address, token0Amount);
        await token1.transfer(pair.address, token1Amount);

        const expectedLiquidity = expandTo18Decimals(2);
        await expect(pair.mint(owner.address))
            .to.emit(pair, "Transfer")
            .withArgs(AddressZero, AddressZero, MINIMUM_LIQUIDITY)
            .to.emit(pair, "Transfer")
            .withArgs(AddressZero, owner.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
            .to.emit(pair, "Sync")
            .withArgs(token0Amount, token1Amount)
            .to.emit(pair, "Mint")
            .withArgs(owner.address, token0Amount, token1Amount);

        expect(await pair.totalSupply()).to.eq(expectedLiquidity);
        expect(await pair.balanceOf(owner.address)).to.eq(expectedLiquidity.sub(MINIMUM_LIQUIDITY));
        expect(await token0.balanceOf(pair.address)).to.eq(token0Amount);
        expect(await token1.balanceOf(pair.address)).to.eq(token1Amount);
        const reserves = await pair.getReserves();
        expect(reserves[0]).to.eq(token0Amount);
        expect(reserves[1]).to.eq(token1Amount);
    });

    async function addLiquidity(token0Amount: BigNumber, token1Amount: BigNumber) {
        const [owner] = await ethers.getSigners();
        await token0.transfer(pair.address, token0Amount);
        await token1.transfer(pair.address, token1Amount);
        await pair.mint(owner.address);
    }

    const swapTestCases: BigNumber[][] = [
        // (a, b, c) => c - ((b * c) / ( b + a - (a * 0.002)))
        [1, 5, 10, "1663887962654218072"],
        [1, 10, 5, "453718857974177123"],

        [2, 5, 10, "2853058890794739851"],
        [2, 10, 5, "831943981327109036"],

        [1, 10, 10, "907437715948354246"],
        [1, 100, 100, "988138378977801540"],
        [1, 1000, 1000, "997004989020957084"],
    ].map((a) => a.map((n) => (typeof n === "string" ? BigNumber.from(n) : expandTo18Decimals(n))));
    swapTestCases.forEach((swapTestCase, i) => {
        it(`getInputPrice:${i}`, async () => {
            const [owner] = await ethers.getSigners();
            const [swapAmount, token0Amount, token1Amount, expectedOutputAmount] = swapTestCase;
            await addLiquidity(token0Amount, token1Amount);
            await token0.transfer(pair.address, swapAmount);
            await expect(pair.swap(0, expectedOutputAmount.add(1), owner.address, "0x")).to.be.revertedWith(
                "DogeSwapV2: K",
            );
            await pair.swap(0, expectedOutputAmount, owner.address, "0x");
        });
    });

    const optimisticTestCases: BigNumber[][] = [
        ["998000000000000000", 5, 10, 1], // given amountIn, amountOut = floor(amountIn * .998)
        ["998000000000000000", 10, 5, 1],
        ["998000000000000000", 5, 5, 1],
        [1, 5, 5, "1002004008016032065"], // given amountOut, amountIn = ceiling(amountOut / .998)
    ].map((a) => a.map((n) => (typeof n === "string" ? BigNumber.from(n) : expandTo18Decimals(n))));
    optimisticTestCases.forEach((optimisticTestCase, i) => {
        it(`optimistic:${i}`, async () => {
            const [owner] = await ethers.getSigners();
            const [outputAmount, token0Amount, token1Amount, inputAmount] = optimisticTestCase;
            await addLiquidity(token0Amount, token1Amount);
            await token0.transfer(pair.address, inputAmount);
            await expect(pair.swap(outputAmount.add(1), 0, owner.address, "0x")).to.be.revertedWith("DogeSwapV2: K");
            await pair.swap(outputAmount, 0, owner.address, "0x");
        });
    });

    it("swap:token0", async () => {
        const [owner] = await ethers.getSigners();
        const token0Amount = expandTo18Decimals(5);
        const token1Amount = expandTo18Decimals(10);
        await addLiquidity(token0Amount, token1Amount);

        const swapAmount = expandTo18Decimals(1);
        const expectedOutputAmount = BigNumber.from("1662497915624478906");
        await token0.transfer(pair.address, swapAmount);
        await expect(pair.swap(0, expectedOutputAmount, owner.address, "0x"))
            .to.emit(token1, "Transfer")
            .withArgs(pair.address, owner.address, expectedOutputAmount)
            .to.emit(pair, "Sync")
            .withArgs(token0Amount.add(swapAmount), token1Amount.sub(expectedOutputAmount))
            .to.emit(pair, "Swap")
            .withArgs(owner.address, swapAmount, 0, 0, expectedOutputAmount, owner.address);

        const reserves = await pair.getReserves();
        expect(reserves[0]).to.eq(token0Amount.add(swapAmount));
        expect(reserves[1]).to.eq(token1Amount.sub(expectedOutputAmount));
        expect(await token0.balanceOf(pair.address)).to.eq(token0Amount.add(swapAmount));
        expect(await token1.balanceOf(pair.address)).to.eq(token1Amount.sub(expectedOutputAmount));
        const totalSupplyToken0 = await token0.totalSupply();
        const totalSupplyToken1 = await token1.totalSupply();
        expect(await token0.balanceOf(owner.address)).to.eq(totalSupplyToken0.sub(token0Amount).sub(swapAmount));
        expect(await token1.balanceOf(owner.address)).to.eq(
            totalSupplyToken1.sub(token1Amount).add(expectedOutputAmount),
        );
    });

    it("swap:token1", async () => {
        const [owner] = await ethers.getSigners();
        const token0Amount = expandTo18Decimals(5);
        const token1Amount = expandTo18Decimals(10);
        await addLiquidity(token0Amount, token1Amount);

        const swapAmount = expandTo18Decimals(1);
        const expectedOutputAmount = BigNumber.from("453305446940074565");
        await token1.transfer(pair.address, swapAmount);
        await expect(pair.swap(expectedOutputAmount, 0, owner.address, "0x"))
            .to.emit(token0, "Transfer")
            .withArgs(pair.address, owner.address, expectedOutputAmount)
            .to.emit(pair, "Sync")
            .withArgs(token0Amount.sub(expectedOutputAmount), token1Amount.add(swapAmount))
            .to.emit(pair, "Swap")
            .withArgs(owner.address, 0, swapAmount, expectedOutputAmount, 0, owner.address);

        const reserves = await pair.getReserves();
        expect(reserves[0]).to.eq(token0Amount.sub(expectedOutputAmount));
        expect(reserves[1]).to.eq(token1Amount.add(swapAmount));
        expect(await token0.balanceOf(pair.address)).to.eq(token0Amount.sub(expectedOutputAmount));
        expect(await token1.balanceOf(pair.address)).to.eq(token1Amount.add(swapAmount));
        const totalSupplyToken0 = await token0.totalSupply();
        const totalSupplyToken1 = await token1.totalSupply();
        expect(await token0.balanceOf(owner.address)).to.eq(
            totalSupplyToken0.sub(token0Amount).add(expectedOutputAmount),
        );
        expect(await token1.balanceOf(owner.address)).to.eq(totalSupplyToken1.sub(token1Amount).sub(swapAmount));
    });

    it("swap:gas", async () => {
        const [owner] = await ethers.getSigners();
        const token0Amount = expandTo18Decimals(5);
        const token1Amount = expandTo18Decimals(10);
        await addLiquidity(token0Amount, token1Amount);

        // ensure that setting price{0,1}CumulativeLast for the first time doesn't affect our gas math
        await mineBlock((await ethers.provider.getBlock("latest")).timestamp + 1);
        await pair.sync();

        const swapAmount = expandTo18Decimals(1);
        const expectedOutputAmount = BigNumber.from("453305446940074565");
        await token1.transfer(pair.address, swapAmount);
        await mineBlock((await ethers.provider.getBlock("latest")).timestamp + 1);
        const tx = await pair.swap(expectedOutputAmount, 0, owner.address, "0x");
        const receipt = await tx.wait();
        expect(receipt.gasUsed).to.eq(73701);
    });

    it("burn", async () => {
        const [owner] = await ethers.getSigners();
        const token0Amount = expandTo18Decimals(3);
        const token1Amount = expandTo18Decimals(3);
        await addLiquidity(token0Amount, token1Amount);

        const expectedLiquidity = expandTo18Decimals(3);
        await pair.transfer(pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY));
        await expect(pair.burn(owner.address))
            .to.emit(pair, "Transfer")
            .withArgs(pair.address, AddressZero, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
            .to.emit(token0, "Transfer")
            .withArgs(pair.address, owner.address, token0Amount.sub(1000))
            .to.emit(token1, "Transfer")
            .withArgs(pair.address, owner.address, token1Amount.sub(1000))
            .to.emit(pair, "Sync")
            .withArgs(1000, 1000)
            .to.emit(pair, "Burn")
            .withArgs(owner.address, token0Amount.sub(1000), token1Amount.sub(1000), owner.address);

        expect(await pair.balanceOf(owner.address)).to.eq(0);
        expect(await pair.totalSupply()).to.eq(MINIMUM_LIQUIDITY);
        expect(await token0.balanceOf(pair.address)).to.eq(1000);
        expect(await token1.balanceOf(pair.address)).to.eq(1000);
        const totalSupplyToken0 = await token0.totalSupply();
        const totalSupplyToken1 = await token1.totalSupply();
        expect(await token0.balanceOf(owner.address)).to.eq(totalSupplyToken0.sub(1000));
        expect(await token1.balanceOf(owner.address)).to.eq(totalSupplyToken1.sub(1000));
    });

    it("price{0,1}CumulativeLast", async () => {
        try {
            await setAutomine(false);

            const [owner] = await ethers.getSigners();
            const token0Amount = expandTo18Decimals(3);
            const token1Amount = expandTo18Decimals(3);
            await addLiquidity(token0Amount, token1Amount);

            await mineBlock();

            const blockTimestamp = (await pair.getReserves())[2];

            await pair.sync();

            await mineBlock(blockTimestamp + 1);

            const initialPrice = encodePrice(token0Amount, token1Amount);
            expect(await pair.price0CumulativeLast()).to.eq(initialPrice[0]);
            expect(await pair.price1CumulativeLast()).to.eq(initialPrice[1]);
            expect((await pair.getReserves())[2]).to.eq(blockTimestamp + 1);

            const swapAmount = expandTo18Decimals(3);
            await token0.transfer(pair.address, swapAmount);
            // swap to a new price eagerly instead of syncing
            await pair.swap(0, expandTo18Decimals(1), owner.address, "0x"); // make the price nice

            await mineBlock(blockTimestamp + 10);

            expect(await pair.price0CumulativeLast()).to.eq(initialPrice[0].mul(10));
            expect(await pair.price1CumulativeLast()).to.eq(initialPrice[1].mul(10));
            expect((await pair.getReserves())[2]).to.eq(blockTimestamp + 10);

            await pair.sync();

            await mineBlock(blockTimestamp + 20);

            const newPrice = encodePrice(expandTo18Decimals(6), expandTo18Decimals(2));
            expect(await pair.price0CumulativeLast()).to.eq(initialPrice[0].mul(10).add(newPrice[0].mul(10)));
            expect(await pair.price1CumulativeLast()).to.eq(initialPrice[1].mul(10).add(newPrice[1].mul(10)));
            expect((await pair.getReserves())[2]).to.eq(blockTimestamp + 20);
        } finally {
            await setAutomine(true);
        }
    });

    it("feeTo:off", async () => {
        const [owner] = await ethers.getSigners();
        const token0Amount = expandTo18Decimals(1000);
        const token1Amount = expandTo18Decimals(1000);
        await addLiquidity(token0Amount, token1Amount);

        const swapAmount = expandTo18Decimals(1);
        const expectedOutputAmount = BigNumber.from("996006981039903216");
        await token1.transfer(pair.address, swapAmount);
        await pair.swap(expectedOutputAmount, 0, owner.address, "0x");

        const expectedLiquidity = expandTo18Decimals(1000);
        await pair.transfer(pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY));
        await pair.burn(owner.address);
        expect(await pair.totalSupply()).to.eq(MINIMUM_LIQUIDITY);
    });

    it("feeTo:on", async () => {
        const [owner, other] = await ethers.getSigners();
        await factory.setFeeTo(other.address);

        const token0Amount = expandTo18Decimals(1000);
        const token1Amount = expandTo18Decimals(1000);
        await addLiquidity(token0Amount, token1Amount);

        const swapAmount = expandTo18Decimals(1);
        const expectedOutputAmount = BigNumber.from("996006981039903216");
        await token1.transfer(pair.address, swapAmount);
        await pair.swap(expectedOutputAmount, 0, owner.address, "0x");

        const expectedLiquidity = expandTo18Decimals(1000);
        await pair.transfer(pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY));
        await pair.burn(owner.address);
        expect(await pair.totalSupply()).to.eq(MINIMUM_LIQUIDITY.add("249750499251388"));
        expect(await pair.balanceOf(other.address)).to.eq("249750499251388");

        // using 1000 here instead of the symbolic MINIMUM_LIQUIDITY because the amounts only happen to be equal...
        // ...because the initial liquidity amounts were equal
        expect(await token0.balanceOf(pair.address)).to.eq(BigNumber.from(1000).add("249501683697445"));
        expect(await token1.balanceOf(pair.address)).to.eq(BigNumber.from(1000).add("250000187312969"));
    });
});
