import { useMemo } from "react";
import { Currency } from "../../../sdk-core/src/entities/currency";
import { DOGECHAIN } from "../../../sdk-core/src/entities/ether";
import { WDC } from "../../../sdk-core/src/entities/token";
import { currencyEquals } from "../../../sdk-core/src/utils/currencyEquals";
import { tryParseAmount } from "../state/swap/hooks";
import { useTransactionAdder } from "../state/transactions/hooks";
import { useCurrencyBalance } from "../state/wallet/hooks";
import { useActiveWeb3React } from "./index";
import { useWDCContract } from "./useContract";

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
    const wdcContract = useWDCContract();
    const balance = useCurrencyBalance(account ?? undefined, inputCurrency);
    // we can always parse the amount typed as the input currency, since wrapping is 1:1
    const inputAmount = useMemo(() => tryParseAmount(typedValue, inputCurrency), [inputCurrency, typedValue]);
    const addTransaction = useTransactionAdder();

    return useMemo(() => {
        if (!wdcContract || !chainId || !inputCurrency || !outputCurrency) return NOT_APPLICABLE;

        const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount);

        if (inputCurrency === DOGECHAIN && currencyEquals(WDC[chainId], outputCurrency)) {
            return {
                wrapType: WrapType.WRAP,
                execute:
                    sufficientBalance && inputAmount
                        ? async () => {
                              try {
                                  const txReceipt = await wdcContract.deposit({
                                      value: `0x${inputAmount.raw.toString(16)}`,
                                  });
                                  addTransaction(txReceipt, {
                                      summary: `Wrap ${inputAmount.toSignificant(6)} ETH to WDC`,
                                  });
                              } catch (error) {
                                  console.error("Could not deposit", error);
                              }
                          }
                        : undefined,
                inputError: sufficientBalance ? undefined : "Insufficient ETH balance",
            };
        } else if (currencyEquals(WDC[chainId], inputCurrency) && outputCurrency === DOGECHAIN) {
            return {
                wrapType: WrapType.UNWRAP,
                execute:
                    sufficientBalance && inputAmount
                        ? async () => {
                              try {
                                  const txReceipt = await wdcContract.withdraw(`0x${inputAmount.raw.toString(16)}`);
                                  addTransaction(txReceipt, {
                                      summary: `Unwrap ${inputAmount.toSignificant(6)} WDC to ETH`,
                                  });
                              } catch (error) {
                                  console.error("Could not withdraw", error);
                              }
                          }
                        : undefined,
                inputError: sufficientBalance ? undefined : "Insufficient WDC balance",
            };
        } else {
            return NOT_APPLICABLE;
        }
    }, [wdcContract, chainId, inputCurrency, outputCurrency, inputAmount, balance, addTransaction]);
}
