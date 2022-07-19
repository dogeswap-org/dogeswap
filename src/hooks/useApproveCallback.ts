import { MaxUint256 } from "@ethersproject/constants";
import { TransactionResponse } from "@ethersproject/providers";
import { useCallback, useMemo } from "react";
import { Token } from "../../../sdk-core/src";
import { DOGECHAIN } from "../../../sdk-core/src/entities/ether";
import CurrencyAmount from "../../../sdk-core/src/entities/fractions/currencyAmount";
import { Trade } from "../../../v2-sdk/src/entities/trade";
import { ROUTER_ADDRESS } from "../constants";
import { useTokenAllowance } from "../data/Allowances";
import { Field } from "../state/swap/actions";
import { useHasPendingApproval, useTransactionAdder } from "../state/transactions/hooks";
import { calculateGasMargin } from "../utils";
import { computeSlippageAdjustedAmounts } from "../utils/prices";
import { useActiveWeb3React } from "./index";
import { useTokenContract } from "./useContract";

export enum ApprovalState {
    UNKNOWN,
    NOT_APPROVED,
    PENDING,
    APPROVED,
}

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallback(amount?: CurrencyAmount, spender?: string): [ApprovalState, () => Promise<void>] {
    if (amount?.currency === DOGECHAIN) {
        return [ApprovalState.APPROVED, async () => void console.error("approve was called unnecessarily")];
    }

    // If we haven't (unnecessarily) tried to approve Dogechain, then we're dealing with an ERC-20 token.
    const amountToApprove = amount as CurrencyAmount<Token>;
    const { account } = useActiveWeb3React();
    const token = amountToApprove instanceof CurrencyAmount ? amountToApprove.currency : undefined;
    const currentAllowance = useTokenAllowance(token, account ?? undefined, spender);
    const pendingApproval = useHasPendingApproval(token?.address, spender);

    // check the current approval status
    const approvalState: ApprovalState = useMemo(() => {
        if (!amountToApprove || !spender) return ApprovalState.UNKNOWN;
        // we might not have enough data to know whether or not we need to approve
        if (!currentAllowance) return ApprovalState.UNKNOWN;

        // amountToApprove will be defined if currentAllowance is
        return currentAllowance.lessThan(amountToApprove)
            ? pendingApproval
                ? ApprovalState.PENDING
                : ApprovalState.NOT_APPROVED
            : ApprovalState.APPROVED;
    }, [amountToApprove, currentAllowance, pendingApproval, spender]);

    const tokenContract = useTokenContract(token?.address);
    const addTransaction = useTransactionAdder();

    const approve = useCallback(async (): Promise<void> => {
        if (approvalState !== ApprovalState.NOT_APPROVED) {
            console.error("approve was called unnecessarily");
            return;
        }
        if (!token) {
            console.error("no token");
            return;
        }

        if (!tokenContract) {
            console.error("tokenContract is null");
            return;
        }

        if (!amountToApprove) {
            console.error("missing amount to approve");
            return;
        }

        if (!spender) {
            console.error("no spender");
            return;
        }

        let useExact = false;
        const estimatedGas = await tokenContract.estimateGas.approve(spender, MaxUint256).catch(() => {
            // general fallback for tokens who restrict approval amounts
            useExact = true;
            return tokenContract.estimateGas.approve(spender, amountToApprove.raw.toString());
        });

        return tokenContract
            .approve(spender, useExact ? amountToApprove.raw.toString() : MaxUint256, {
                gasLimit: calculateGasMargin(estimatedGas),
            })
            .then((response: TransactionResponse) => {
                addTransaction(response, {
                    summary: "Approve " + amountToApprove.currency.symbol,
                    approval: { tokenAddress: token.address, spender: spender },
                });
            })
            .catch((error: Error) => {
                console.debug("Failed to approve token", error);
                throw error;
            });
    }, [approvalState, token, tokenContract, amountToApprove, spender, addTransaction]);

    return [approvalState, approve];
}

// wraps useApproveCallback in the context of a swap
export function useApproveCallbackFromTrade(trade?: Trade, allowedSlippage = 0) {
    const amountToApprove = useMemo(
        () => (trade ? computeSlippageAdjustedAmounts(trade, allowedSlippage)[Field.INPUT] : undefined),
        [trade, allowedSlippage],
    );
    return useApproveCallback(amountToApprove, ROUTER_ADDRESS);
}
