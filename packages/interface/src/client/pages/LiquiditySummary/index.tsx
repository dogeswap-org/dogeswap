import { Token } from "@dogeswap/sdk-core";
import { formatEther, Interface } from "ethers/lib/utils";
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

const resolveSymbol = (token: Token<string>) => (token.symbol === "WWDOGE" ? "WDOGE" : token.symbol);

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
        console.log(symbol0, symbol1);
        pairAmounts.push(
            <div key={pair.liquidityToken.address} style={{ display: "flex", justifyContent: "center" }}>
                <CurrencyLogo size="20px" currency={token0} />
                <CurrencyLogo size="20px" style={{ marginRight: "8px" }} currency={token1} />
                {symbol0}/{symbol1} - {formatEther(result[0])}/{formatEther(result[1])}
            </div>,
        );
    }

    return (
        <>
            <AppBody>
                <SwapPoolTabs active="liquidity" />
                <AutoColumn gap="lg" justify="center">
                    <AutoColumn gap="12px" style={{ width: "100%" }}>
                        <LightCard padding="8px">
                            <TYPE.body color={theme.text1} textAlign="center">
                                <Text fontWeight={500} fontSize={16}>
                                    {pairAmounts}
                                </Text>
                            </TYPE.body>
                        </LightCard>
                    </AutoColumn>
                </AutoColumn>
            </AppBody>
        </>
    );
}
