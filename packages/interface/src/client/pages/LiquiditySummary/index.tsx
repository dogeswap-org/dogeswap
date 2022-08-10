import { Token } from "@dogeswap/sdk-core";
import { BigNumber, utils } from "ethers";
import { Interface } from "ethers/lib/utils";
import React, { useContext, useMemo } from "react";
import { Text } from "rebass";
import { ThemeContext } from "styled-components";
import { abi as IDogeSwapV2PairABI } from "../../../../../contracts-core/artifacts/contracts/interfaces/IDogeSwapV2Pair.sol/IDogeSwapV2Pair.json";
import { LightCard } from "../../components/Card";
import { AutoColumn } from "../../components/Column";
import CurrencyLogo from "../../components/CurrencyLogo";
import { SwapPoolTabs } from "../../components/NavigationTabs";
import { useActiveWeb3React } from "../../hooks";
import { useMultipleContractSingleData } from "../../hooks/Multicall";
import { useCurrency } from "../../hooks/Tokens";
import { toV2LiquidityToken, useTrackedTokenPairs } from "../../state/user/hooks";
import { TYPE } from "../../theme";
import AppBody from "../AppBody";

const PAIR_INTERFACE = new Interface(IDogeSwapV2PairABI);

const formatEtherRounded = (value: BigNumber) => {
    const remainder = value.mod(1e14);
    return utils.formatEther(value.sub(remainder));
};

export default function Pool() {
    const theme = useContext(ThemeContext);
    const { account, chainId } = useActiveWeb3React();

    // fetch the user's balances of all tracked V2 LP tokens
    const trackedTokenPairs = useTrackedTokenPairs();
    const tokenPairsWithLiquidityTokens = useMemo(
        () => trackedTokenPairs.map((tokens) => ({ liquidityToken: toV2LiquidityToken(tokens, chainId!), tokens })),
        [trackedTokenPairs],
    );

    const pairAddresses = tokenPairsWithLiquidityTokens.map((x) => x.liquidityToken.address);
    const results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, "getReserves");

    const wdoge = useCurrency("WDOGE");
    const resolveToken = (token: Token<string>) => (token.symbol === "WWDOGE" ? wdoge ?? token : token);

    const pairAmounts: JSX.Element[] = [];
    for (let i = 0; i < pairAddresses.length; i++) {
        const result = results[i]?.result;
        if (result == undefined) {
            continue;
        }

        const pair = tokenPairsWithLiquidityTokens[i];
        const token0 = resolveToken(pair.tokens[0]);
        const token1 = resolveToken(pair.tokens[1]);

        const symbol0 = token0.symbol;
        const symbol1 = token1.symbol;
        pairAmounts.push(
            <div
                key={pair.liquidityToken.address}
                style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
            >
                <CurrencyLogo size="20px" currency={token0} />
                <CurrencyLogo size="20px" style={{ marginRight: "8px" }} currency={token1} />
                {symbol0}/{symbol1} - {formatEtherRounded(result[0])}/{formatEtherRounded(result[1])}
            </div>,
        );
    }

    const prerequisiteMessage = (
        <LightCard padding="45px 10px">
            <Text textAlign="center">Connect to a wallet to see liquidity info</Text>
        </LightCard>
    );

    const amountsCard = (
        <LightCard padding="8px">
            <TYPE.body color={theme.text1} textAlign="center">
                <Text fontWeight={500} fontSize={16}>
                    {pairAmounts}
                </Text>
            </TYPE.body>
        </LightCard>
    );

    return (
        <>
            <AppBody>
                <SwapPoolTabs active="liquidity" />
                <AutoColumn gap="lg" justify="center">
                    <AutoColumn gap="12px" style={{ width: "100%" }}>
                        {account == undefined ? prerequisiteMessage : amountsCard}
                    </AutoColumn>
                </AutoColumn>
            </AppBody>
        </>
    );
}
