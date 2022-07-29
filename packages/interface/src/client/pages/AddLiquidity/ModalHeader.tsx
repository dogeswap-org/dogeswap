import { Currency, CurrencyAmount } from "@dogeswap/sdk-core";
import React from "react";
import { Text } from "rebass";
import { LightCard } from "../../components/Card";
import { AutoColumn } from "../../components/Column";
import DoubleCurrencyLogo from "../../components/DoubleLogo";
import Row, { RowFlat } from "../../components/Row";
import { Field } from "../../state/burn/actions";
import { TYPE } from "../../theme";

interface ModalHeaderProps {
    allowedSlippage: number;
    liquidityMinted?: CurrencyAmount;
    currencies: { [field in Field]?: Currency };
    noLiquidity: boolean | undefined;
}

export const ModalHeader = ({ allowedSlippage, liquidityMinted, currencies, noLiquidity }: ModalHeaderProps) => {
    return noLiquidity ? (
        <AutoColumn gap="20px">
            <LightCard mt="20px" borderRadius="20px">
                <RowFlat>
                    <Text fontSize="48px" fontWeight={500} lineHeight="42px" marginRight={10}>
                        {currencies[Field.CURRENCY_A]?.symbol + "/" + currencies[Field.CURRENCY_B]?.symbol}
                    </Text>
                    <DoubleCurrencyLogo
                        currency0={currencies[Field.CURRENCY_A]}
                        currency1={currencies[Field.CURRENCY_B]}
                        size={30}
                    />
                </RowFlat>
            </LightCard>
        </AutoColumn>
    ) : (
        <AutoColumn gap="20px">
            <RowFlat style={{ marginTop: "20px" }}>
                <Text fontSize="48px" fontWeight={500} lineHeight="42px" marginRight={10}>
                    {liquidityMinted?.toSignificant(6)}
                </Text>
                <DoubleCurrencyLogo
                    currency0={currencies[Field.CURRENCY_A]}
                    currency1={currencies[Field.CURRENCY_B]}
                    size={30}
                />
            </RowFlat>
            <Row>
                <Text fontSize="24px">
                    {currencies[Field.CURRENCY_A]?.symbol + "/" + currencies[Field.CURRENCY_B]?.symbol + " Pool Tokens"}
                </Text>
            </Row>
            <TYPE.italic fontSize={12} textAlign="left" padding={"8px 0 0 0 "}>
                {`Output is estimated. If the price changes by more than ${
                    allowedSlippage / 100
                }% your transaction will revert.`}
            </TYPE.italic>
        </AutoColumn>
    );
};
