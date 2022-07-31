import { ChainId } from "@dogeswap/sdk-core";

const getSearchParam = (key: string) => new URL(document.location.toString()).searchParams.get(key);

const getCookie = (name: string) => {
    // https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie#example_2_get_a_sample_cookie_named_test2
    return document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${name}=`))
        ?.split("=")[1];
};

const toChainId = (value: string | undefined | null) => {
    if (value == undefined) {
        return undefined;
    }

    const num = parseInt(value);
    return isNaN(num) ? undefined : (num as ChainId);
};

export const defaultChainId = toChainId(getSearchParam("c")) ?? toChainId(getCookie("chainId")) ?? ChainId.LOCALNET;
