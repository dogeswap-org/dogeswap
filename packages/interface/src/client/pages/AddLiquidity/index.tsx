import { BigNumber } from "@ethersproject/bignumber";
import { TransactionResponse } from "@ethersproject/providers";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { Plus } from "react-feather";
import ReactGA from "react-ga";
import { RouteComponentProps } from "react-router-dom";
import { Text } from "rebass";
import { ThemeContext } from "styled-components";
import { BlueCard, GreyCard, LightCard } from "../../components/Card";
import { AutoColumn, ColumnCenter } from "../../components/Column";
import CurrencyInputPanel from "../../components/CurrencyInputPanel";
import { AddRemoveTabs } from "../../components/NavigationTabs";
import { MinimalPositionCard } from "../../components/PositionCard";
import { RowBetween } from "../../components/Row";
import TransactionConfirmationModal, { ConfirmationModalContent } from "../../components/TransactionConfirmationModal";

import { PairState } from "../../data/Reserves";
import { useActiveWeb3React } from "../../hooks";
import { useCurrency } from "../../hooks/Tokens";
import { useWalletModalToggle } from "../../state/application/hooks";
import { Field } from "../../state/mint/actions";
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from "../../state/mint/hooks";

import { Currency, CurrencyAmount, currencyEquals, NativeToken } from "@dogeswap/sdk-core";
import { getAddress } from "../../../common/addresses";
import { getToken } from "../../../common/tokens";
import { ButtonError, ButtonLight, ButtonPrimary } from "../../components/Button";
import { ApprovalState, useApproveCallback } from "../../hooks/useApproveCallback";
import { useTransactionAdder } from "../../state/transactions/hooks";
import { useIsExpertMode, useUserDeadline, useUserSlippageTolerance } from "../../state/user/hooks";
import { TYPE } from "../../theme";
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from "../../utils";
import { currencyId } from "../../utils/currencyId";
import { maxAmountSpend } from "../../utils/maxAmountSpend";
import { wrappedCurrency } from "../../utils/wrappedCurrency";
import AppBody from "../AppBody";
import { Dots, Wrapper } from "../Pool/styleds";
import { ConfirmAddModalBottom } from "./ConfirmAddModalBottom";
import { ModalHeader } from "./ModalHeader";
import { PoolPriceBar } from "./PoolPriceBar";

export default function AddLiquidity({
    match: {
        params: { currencyIdA, currencyIdB },
    },
    history,
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) {
    const { account, chainId, library } = useActiveWeb3React();
    const theme = useContext(ThemeContext);

    const currencyA = useCurrency(currencyIdA);
    const currencyB = useCurrency(currencyIdB);
    const wrapped = useMemo(() => getToken("wwdoge", chainId), [chainId]);
    const oneCurrencyIsWWDOGE = Boolean(
        chainId &&
            wrapped &&
            ((currencyA && currencyEquals(currencyA, wrapped)) || (currencyB && currencyEquals(currencyB, wrapped))),
    );

    const toggleWalletModal = useWalletModalToggle(); // toggle wallet when disconnected

    const expertMode = useIsExpertMode();

    // mint state
    const { independentField, typedValue, otherTypedValue } = useMintState();
    const {
        dependentField,
        currencies,
        pair,
        pairState,
        currencyBalances,
        parsedAmounts,
        price,
        noLiquidity,
        liquidityMinted,
        poolTokenPercentage,
        error,
    } = useDerivedMintInfo(currencyA ?? undefined, currencyB ?? undefined);
    const { onFieldAInput, onFieldBInput } = useMintActionHandlers(noLiquidity);

    const isValid = !error;

    // modal and loading
    const [showConfirm, setShowConfirm] = useState<boolean>(false);
    const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false); // clicked confirm

    // txn values
    const [deadline] = useUserDeadline(); // custom from users settings
    const [allowedSlippage] = useUserSlippageTolerance(); // custom from users
    const [txHash, setTxHash] = useState<string>("");

    // get formatted amounts
    const formattedAmounts = {
        [independentField]: typedValue,
        [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? "",
    };

    // get the max amounts user can add
    const maxAmounts: { [field in Field]?: CurrencyAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
        (accumulator, field) => {
            return {
                ...accumulator,
                [field]: maxAmountSpend(currencyBalances[field]),
            };
        },
        {},
    );

    const atMaxAmounts: { [field in Field]?: CurrencyAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
        (accumulator, field) => {
            return {
                ...accumulator,
                [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? "0"),
            };
        },
        {},
    );

    const routerAddress = useMemo(() => getAddress("router", chainId), [chainId]);

    // check whether the user has approved the router on the tokens
    const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_A], routerAddress);
    const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_B], routerAddress);

    const addTransaction = useTransactionAdder();

    async function onAdd() {
        if (!chainId || !library || !account) return;
        const router = getRouterContract(chainId, library, account);

        const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts;
        if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB) {
            return;
        }

        const amountsMin = {
            [Field.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? 0 : allowedSlippage)[0],
            [Field.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? 0 : allowedSlippage)[0],
        };

        const deadlineFromNow = Math.ceil(Date.now() / 1000) + deadline;

        let estimate,
            method: (...args: any) => Promise<TransactionResponse>,
            args: Array<string | string[] | number>,
            value: BigNumber | null;
        if (currencyA === NativeToken.Instance || currencyB === NativeToken.Instance) {
            const tokenBIsWDOGE = currencyB === NativeToken.Instance;
            estimate = router.estimateGas.addLiquidityWDOGE;
            method = router.addLiquidityWDOGE;
            args = [
                wrappedCurrency(tokenBIsWDOGE ? currencyA : currencyB, chainId)?.address ?? "", // token
                (tokenBIsWDOGE ? parsedAmountA : parsedAmountB).raw.toString(), // token desired
                amountsMin[tokenBIsWDOGE ? Field.CURRENCY_A : Field.CURRENCY_B].toString(), // token min
                amountsMin[tokenBIsWDOGE ? Field.CURRENCY_B : Field.CURRENCY_A].toString(), // eth min
                account,
                deadlineFromNow,
            ];
            value = BigNumber.from((tokenBIsWDOGE ? parsedAmountB : parsedAmountA).raw.toString());
        } else {
            estimate = router.estimateGas.addLiquidity;
            method = router.addLiquidity;
            args = [
                wrappedCurrency(currencyA, chainId)?.address ?? "",
                wrappedCurrency(currencyB, chainId)?.address ?? "",
                parsedAmountA.raw.toString(),
                parsedAmountB.raw.toString(),
                amountsMin[Field.CURRENCY_A].toString(),
                amountsMin[Field.CURRENCY_B].toString(),
                account,
                deadlineFromNow,
            ];
            value = null;
        }

        setAttemptingTxn(true);
        try {
            let estimatedGasLimit: BigNumber;
            try {
                estimatedGasLimit = await estimate(...args, value ? { value } : {});
            } catch (e) {
                console.log("Could not estimate gas limit", e);

                // Real gas cost should be in the 2.1m range
                estimatedGasLimit = BigNumber.from(2_200_000);
            }

            const response = await method(...args, {
                ...(value ? { value } : {}),
                gasLimit: calculateGasMargin(estimatedGasLimit),
            });

            setAttemptingTxn(false);

            addTransaction(response, {
                summary:
                    "Add " +
                    parsedAmounts[Field.CURRENCY_A]?.toSignificant(3) +
                    " " +
                    currencies[Field.CURRENCY_A]?.symbol +
                    " and " +
                    parsedAmounts[Field.CURRENCY_B]?.toSignificant(3) +
                    " " +
                    currencies[Field.CURRENCY_B]?.symbol,
            });

            setTxHash(response.hash);

            ReactGA.event({
                category: "Liquidity",
                action: "Add",
                label: [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol].join("/"),
            });
        } catch (e) {
            // we only care if the error is something _other_ than the user rejected the tx
            if ((e as any)?.code !== 4001) {
                console.error(e);
            }

            setAttemptingTxn(false);
        }
    }

    const modalHeader = () => (
        <ModalHeader
            allowedSlippage={allowedSlippage}
            currencies={currencies}
            noLiquidity={noLiquidity}
            liquidityMinted={liquidityMinted}
        />
    );

    const modalBottom = () => {
        return (
            <ConfirmAddModalBottom
                price={price}
                currencies={currencies}
                parsedAmounts={parsedAmounts}
                noLiquidity={noLiquidity}
                onAdd={onAdd}
                poolTokenPercentage={poolTokenPercentage}
            />
        );
    };

    const pendingText = `Supplying ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${
        currencies[Field.CURRENCY_A]?.symbol
    } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${currencies[Field.CURRENCY_B]?.symbol}`;

    const handleCurrencyASelect = useCallback(
        (currencyA: Currency) => {
            const newCurrencyIdA = currencyId(currencyA);
            if (newCurrencyIdA === currencyIdB) {
                history.push(`/add/${currencyIdB}/${currencyIdA}`);
            } else {
                history.push(`/add/${newCurrencyIdA}/${currencyIdB}`);
            }
        },
        [currencyIdB, history, currencyIdA],
    );
    const handleCurrencyBSelect = useCallback(
        (currencyB: Currency) => {
            const newCurrencyIdB = currencyId(currencyB);
            if (currencyIdA === newCurrencyIdB) {
                if (currencyIdB) {
                    history.push(`/add/${currencyIdB}/${newCurrencyIdB}`);
                } else {
                    history.push(`/add/${newCurrencyIdB}`);
                }
            } else {
                history.push(`/add/${currencyIdA ? currencyIdA : "WDOGE"}/${newCurrencyIdB}`);
            }
        },
        [currencyIdA, history, currencyIdB],
    );

    const handleDismissConfirmation = useCallback(() => {
        setShowConfirm(false);
        // if there was a tx hash, we want to clear the input
        if (txHash) {
            onFieldAInput("");
        }
        setTxHash("");
    }, [onFieldAInput, txHash]);

    return (
        <>
            <AppBody>
                <AddRemoveTabs adding={true} />
                <Wrapper>
                    <TransactionConfirmationModal
                        isOpen={showConfirm}
                        onDismiss={handleDismissConfirmation}
                        attemptingTxn={attemptingTxn}
                        hash={txHash}
                        content={() => (
                            <ConfirmationModalContent
                                title={noLiquidity ? "You are creating a pool" : "You will receive"}
                                onDismiss={handleDismissConfirmation}
                                topContent={modalHeader}
                                bottomContent={modalBottom}
                            />
                        )}
                        pendingText={pendingText}
                    />
                    <AutoColumn gap="20px">
                        {noLiquidity && (
                            <ColumnCenter>
                                <BlueCard>
                                    <AutoColumn gap="10px">
                                        <TYPE.link fontWeight={600} color={"primaryText1"}>
                                            You are the first liquidity provider.
                                        </TYPE.link>
                                        <TYPE.link fontWeight={400} color={"primaryText1"}>
                                            The ratio of tokens you add will set the price of this pool.
                                        </TYPE.link>
                                        <TYPE.link fontWeight={400} color={"primaryText1"}>
                                            Once you are happy with the rate click supply to review.
                                        </TYPE.link>
                                    </AutoColumn>
                                </BlueCard>
                            </ColumnCenter>
                        )}
                        <CurrencyInputPanel
                            value={formattedAmounts[Field.CURRENCY_A]}
                            onUserInput={onFieldAInput}
                            onMax={() => {
                                onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? "");
                            }}
                            onCurrencySelect={handleCurrencyASelect}
                            showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                            currency={currencies[Field.CURRENCY_A]}
                            id="add-liquidity-input-tokena"
                            showCommonBases
                        />
                        <ColumnCenter>
                            <Plus size="16" color={theme.text2} />
                        </ColumnCenter>
                        <CurrencyInputPanel
                            value={formattedAmounts[Field.CURRENCY_B]}
                            onUserInput={onFieldBInput}
                            onCurrencySelect={handleCurrencyBSelect}
                            onMax={() => {
                                onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? "");
                            }}
                            showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                            currency={currencies[Field.CURRENCY_B]}
                            id="add-liquidity-input-tokenb"
                            showCommonBases
                        />
                        {currencies[Field.CURRENCY_A] &&
                            currencies[Field.CURRENCY_B] &&
                            pairState !== PairState.INVALID && (
                                <>
                                    <GreyCard padding="0px" borderRadius={"20px"}>
                                        <RowBetween padding="1rem">
                                            <TYPE.subHeader fontWeight={500} fontSize={14}>
                                                {noLiquidity ? "Initial prices" : "Prices"} and pool share
                                            </TYPE.subHeader>
                                        </RowBetween>{" "}
                                        <LightCard padding="1rem" borderRadius={"20px"}>
                                            <PoolPriceBar
                                                currencies={currencies}
                                                poolTokenPercentage={poolTokenPercentage}
                                                noLiquidity={noLiquidity}
                                                price={price}
                                            />
                                        </LightCard>
                                    </GreyCard>
                                </>
                            )}

                        {!account ? (
                            <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
                        ) : (
                            <AutoColumn gap={"md"}>
                                {(approvalA === ApprovalState.NOT_APPROVED ||
                                    approvalA === ApprovalState.PENDING ||
                                    approvalB === ApprovalState.NOT_APPROVED ||
                                    approvalB === ApprovalState.PENDING) &&
                                    isValid && (
                                        <RowBetween>
                                            {approvalA !== ApprovalState.APPROVED && (
                                                <ButtonPrimary
                                                    onClick={approveACallback}
                                                    disabled={approvalA === ApprovalState.PENDING}
                                                    width={approvalB !== ApprovalState.APPROVED ? "48%" : "100%"}
                                                >
                                                    {approvalA === ApprovalState.PENDING ? (
                                                        <Dots>Approving {currencies[Field.CURRENCY_A]?.symbol}</Dots>
                                                    ) : (
                                                        "Approve " + currencies[Field.CURRENCY_A]?.symbol
                                                    )}
                                                </ButtonPrimary>
                                            )}
                                            {approvalB !== ApprovalState.APPROVED && (
                                                <ButtonPrimary
                                                    onClick={approveBCallback}
                                                    disabled={approvalB === ApprovalState.PENDING}
                                                    width={approvalA !== ApprovalState.APPROVED ? "48%" : "100%"}
                                                >
                                                    {approvalB === ApprovalState.PENDING ? (
                                                        <Dots>Approving {currencies[Field.CURRENCY_B]?.symbol}</Dots>
                                                    ) : (
                                                        "Approve " + currencies[Field.CURRENCY_B]?.symbol
                                                    )}
                                                </ButtonPrimary>
                                            )}
                                        </RowBetween>
                                    )}
                                <ButtonError
                                    onClick={() => {
                                        expertMode ? onAdd() : setShowConfirm(true);
                                    }}
                                    disabled={
                                        !isValid ||
                                        approvalA !== ApprovalState.APPROVED ||
                                        approvalB !== ApprovalState.APPROVED
                                    }
                                    error={
                                        !isValid &&
                                        !!parsedAmounts[Field.CURRENCY_A] &&
                                        !!parsedAmounts[Field.CURRENCY_B]
                                    }
                                >
                                    <Text fontSize={20} fontWeight={500}>
                                        {error ?? "Supply"}
                                    </Text>
                                </ButtonError>
                            </AutoColumn>
                        )}
                    </AutoColumn>
                </Wrapper>
            </AppBody>

            {pair && !noLiquidity && pairState !== PairState.INVALID ? (
                <AutoColumn style={{ minWidth: "20rem", marginTop: "1rem" }}>
                    <MinimalPositionCard showUnwrapped={oneCurrencyIsWWDOGE} pair={pair} />
                </AutoColumn>
            ) : null}
        </>
    );
}
