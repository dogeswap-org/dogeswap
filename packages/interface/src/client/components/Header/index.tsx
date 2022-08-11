import React from "react";
import { isMobile } from "react-device-detect";
import { Text } from "rebass";

import styled from "styled-components";

import Logo from "../../../../assets/embedded/logo.png";
import { useActiveWeb3React } from "../../hooks";
import { useWDOGEBalances } from "../../state/wallet/hooks";

import { YellowCard } from "../Card";
import Menu from "../Menu";
import Settings from "../Settings";

import { ChainId } from "@dogeswap/sdk-core";
import Row, { RowBetween } from "../Row";
import Web3Status from "../Web3Status";

const HeaderFrame = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-direction: column;
    width: 100%;
    top: 0;
    position: absolute;
    z-index: 2;
    ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 12px 0 0 0;
    width: calc(100%);
    position: relative;
  `};
`;

const HeaderElement = styled.div`
    display: flex;
    align-items: center;
`;

const HeaderElementWrap = styled.div`
    display: flex;
    align-items: center;

    ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-top: 0.5rem;
`};
`;

const Title = styled.a`
    display: flex;
    align-items: center;
    pointer-events: auto;
    text-decoration: none;

    :hover {
        cursor: pointer;
    }
`;

const TitleText = styled(Row)`
    color: black;
    font-family: "Kanit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 18px;
    font-weight: bold;
    margin-left: 8px;
    width: fit-content;
    white-space: nowrap;
    ${({ theme }) => theme.mediaWidth.upToExtraSmall`
        display: none;
    `};
`;

const AccountElement = styled.div<{ active: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    background-color: ${({ theme, active }) => (!active ? theme.bg1 : theme.bg3)};
    border-radius: 12px;
    white-space: nowrap;
    width: 100%;

    :focus {
        border: 1px solid blue;
    }
`;

const TestnetWrapper = styled.div`
    white-space: nowrap;
    width: fit-content;
    margin-left: 10px;
    pointer-events: auto;
`;

const NetworkCard = styled(YellowCard)`
    width: fit-content;
    margin-right: 10px;
    border-radius: 12px;
    padding: 8px 12px;
`;

const UniIcon = styled.div`
    transition: transform 0.3s ease;
    :hover {
        transform: rotate(-5deg);
    }
    ${({ theme }) => theme.mediaWidth.upToSmall`
    img {
      width: 4.5rem;
    }
  `};
`;

const HeaderControls = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;

    ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    align-items: flex-end;
  `};
`;

const BalanceText = styled(Text)`
    ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`;

const NETWORK_LABELS: { [chainId in ChainId]: string | null } = {
    [ChainId.MAINNET]: null,
    [ChainId.TESTNET]: "Testnet",
    [ChainId.LOCALNET]: "Localnet",
};

export default function Header() {
    const { account, chainId } = useActiveWeb3React();

    const userWDOGEBalance = useWDOGEBalances(account ? [account] : [])?.[account ?? ""];

    return (
        <HeaderFrame>
            <div style={{ background: "black", color: "white", width: "100%", textAlign: "center", padding: 4 }}>
                Beware of scams! DogeSwap is open source and decentralised - anybody can create a token, and DogeSwap
                does not verify the authenticity of tokens.
            </div>
            <RowBetween style={{ alignItems: "flex-start" }} padding="1rem 1rem 0 1rem">
                <HeaderElement>
                    <Title href=".">
                        <UniIcon>
                            <img src={Logo} alt="logo" height="48" width="48" />
                        </UniIcon>
                        <TitleText>DogeSwap.org</TitleText>
                    </Title>
                </HeaderElement>
                <HeaderControls>
                    <HeaderElement>
                        <TestnetWrapper>
                            {!isMobile && chainId && NETWORK_LABELS[chainId] && (
                                <NetworkCard>{NETWORK_LABELS[chainId]}</NetworkCard>
                            )}
                        </TestnetWrapper>
                        <AccountElement active={!!account} style={{ pointerEvents: "auto" }}>
                            {account && userWDOGEBalance ? (
                                <BalanceText style={{ flexShrink: 0 }} pl="0.75rem" pr="0.5rem" fontWeight={500}>
                                    {userWDOGEBalance?.toSignificant(4)} WDOGE
                                </BalanceText>
                            ) : null}
                            <Web3Status />
                        </AccountElement>
                    </HeaderElement>
                    <HeaderElementWrap>
                        <Settings />
                        <Menu />
                    </HeaderElementWrap>
                </HeaderControls>
            </RowBetween>
        </HeaderFrame>
    );
}
