import { useWeb3React } from "@web3-react/core";
import React, { useRef } from "react";
import { useSelector } from "react-redux";
import { AppState } from "../../state";

const barkSound = new Audio("assets/sounds/bark.wav");

export const Sounds = () => {
    const { chainId } = useWeb3React();

    const approvedTransactions = useRef(new Set<string>());
    const allTransactions = useSelector((state: AppState) => state.transactions);
    if (chainId != undefined) {
        const transactions = allTransactions[chainId] ?? {};
        if (approvedTransactions.current.size === 0) {
            Object.values(transactions).forEach((x) => approvedTransactions.current.add(x.hash));
        } else {
            const newlyApprovedTransactions = Object.values(transactions).filter(
                (x) => !approvedTransactions.current.has(x.hash),
            );

            newlyApprovedTransactions.forEach((x) => approvedTransactions.current.add(x.hash));
            if (newlyApprovedTransactions.find((x) => x.summary?.startsWith("Swap ")) != undefined) {
                barkSound.play();
            }
        }
    }

    return <></>;
};
