import { useWeb3React } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";
import { useEffect, useState } from "react";
import { ChainId } from "../../../../sdk-core/src";

const injected = new InjectedConnector({ supportedChainIds: [ChainId.MAINNET, ChainId.TESTNET, ChainId.LOCALNET] });

// TODO DOGESWAP: We should probably request authorization when the user tries to trade.

export const useDogeswapWeb3ReactConnector = () => {
    const [connector, setConnector] = useState<InjectedConnector>();
    const { active, error, activate } = useWeb3React();
    useEffect(() => {
        (async () => {
            const isAuthorized = await injected.isAuthorized();
            if (isAuthorized && !active && !error) {
                activate(injected);
            }

            setConnector(injected);
        })();
    }, [active, error, activate]);

    return connector;
};

export const useDogeswapWeb3React = <T = any>(key?: string) => {
    const { connector, ...returnValues } = useWeb3React<T>(key);
    return returnValues;
};
