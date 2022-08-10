import { Currency, NativeToken, Token } from "@dogeswap/sdk-core";
import React, { useMemo } from "react";
import styled from "styled-components";

import DogechainLogo from "../../../../assets/embedded/dogechain-logo.png";
import useHttpLocations from "../../hooks/useHttpLocations";
import { WrappedTokenInfo } from "../../state/lists/hooks";
import Logo from "../Logo";

// TODO: Update
const getTokenLogoURL = (address: string) =>
    `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`;

const StyledEthereumLogo = styled.img<{ size: string }>`
    width: ${({ size }) => size};
    height: ${({ size }) => size};
    box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
    border-radius: 24px;
`;

const StyledLogo = styled(Logo)<{ size: string }>`
    width: ${({ size }) => size};
    height: ${({ size }) => size};
    border-radius: 100%;
`;

export default function CurrencyLogo({
    currency,
    size = "24px",
    style,
}: {
    currency?: Currency;
    size?: string;
    style?: React.CSSProperties;
}) {
    const uriLocations = useHttpLocations(currency instanceof WrappedTokenInfo ? currency.logoURI : undefined);

    const srcs: string[] = useMemo(() => {
        if (currency === NativeToken.Instance) return [];

        if (currency instanceof Token) {
            if (currency instanceof WrappedTokenInfo) {
                return [...uriLocations, getTokenLogoURL(currency.address)];
            }

            return [getTokenLogoURL(currency.address)];
        }
        return [];
    }, [currency, uriLocations]);

    if (currency === NativeToken.Instance) {
        return <StyledEthereumLogo src={DogechainLogo} size={size} style={style} />;
    }

    // TODO: Fix style property discrepancies in @react/types
    return <StyledLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? "token"} logo`} style={style as any} />;
}
