import { Currency, currencyEquals, NativeToken } from "@dogeswap/sdk-core";
import { useMemo } from "react";
import { getToken } from "../../common/tokens";
import { tryParseAmount } from "../state/swap/hooks";
import { useTransactionAdder } from "../state/transactions/hooks";
import { useCurrencyBalance } from "../state/wallet/hooks";
import { useActiveWeb3React } from "./index";
import { useWwdogeContract } from "./useContract";

export enum WrapType {
    NOT_APPLICABLE,
    WRAP,
    UNWRAP,
}

const NOT_APPLICABLE = { wrapType: WrapType.NOT_APPLICABLE };
/**
 * Given the selected input and output currency, return a wrap callback
 * @param inputCurrency the selected input currency
 * @param outputCurrency the selected output currency
 * @param typedValue the user input value
 */
export default function useWrapCallback(
    inputCurrency: Currency | undefined,
    outputCurrency: Currency | undefined,
    typedValue: string | undefined,
): { wrapType: WrapType; execute?: undefined | (() => Promise<void>); inputError?: string } {
    const { chainId, account } = useActiveWeb3React();
    const wwdogeContract = useWwdogeContract();
    const balance = useCurrencyBalance(account ?? undefined, inputCurrency);
    // we can always parse the amount typed as the input currency, since wrapping is 1:1
    const inputAmount = useMemo(() => tryParseAmount(typedValue, inputCurrency), [inputCurrency, typedValue]);
    const addTransaction = useTransactionAdder();

    return useMemo(() => {
        const wrapped = getToken("wwdoge", chainId);
        if (!wrapped || !wwdogeContract || !chainId || !inputCurrency || !outputCurrency) return NOT_APPLICABLE;

        const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount);

        if (inputCurrency === NativeToken.Instance && currencyEquals(wrapped, outputCurrency)) {
            return {
                wrapType: WrapType.WRAP,
                execute:
                    sufficientBalance && inputAmount
                        ? async () => {
                              try {
                                  const txReceipt = await wwdogeContract.deposit({
                                      value: `0x${inputAmount.raw.toString(16)}`,
                                  });
                                  addTransaction(txReceipt, {
                                      summary: `Wrap ${inputAmount.toSignificant(6)} WDOGE to WWDOGE`,
                                  });
                              } catch (error) {
                                  console.error("Could not deposit", error);
                              }
                          }
                        : undefined,
                inputError: sufficientBalance ? undefined : "Insufficient WDOGE balance",
            };
        } else if (currencyEquals(wrapped, inputCurrency) && outputCurrency === NativeToken.Instance) {
            return {
                wrapType: WrapType.UNWRAP,
                execute:
                    sufficientBalance && inputAmount
                        ? async () => {
                              try {
                                  const txReceipt = await wwdogeContract.withdraw(`0x${inputAmount.raw.toString(16)}`);
                                  addTransaction(txReceipt, {
                                      summary: `Unwrap ${inputAmount.toSignificant(6)} WWDOGE to WDOGE`,
                                  });
                              } catch (error) {
                                  console.error("Could not withdraw", error);
                              }
                          }
                        : undefined,
                inputError: sufficientBalance ? undefined : "Insufficient WWDOGE balance",
            };
        } else {
            return NOT_APPLICABLE;
        }
    }, [wwdogeContract, chainId, inputCurrency, outputCurrency, inputAmount, balance, addTransaction]);
}
