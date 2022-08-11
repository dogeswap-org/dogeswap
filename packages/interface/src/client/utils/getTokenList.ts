import { ChainId } from "@dogeswap/sdk-core";
import { Tags, TokenList } from "@uniswap/token-lists";
import schema from "@uniswap/token-lists/src/tokenlist.schema.json";
import Ajv from "ajv";
import { tokenLists } from "../../common/tokenLists";
import { DEFAULT_TOKEN_LIST_URL } from "../constants/lists";
import contenthashToUri from "./contenthashToUri";
import { parseENSAddress } from "./parseENSAddress";
import uriToHttp from "./uriToHttp";

const tokenListValidator = new Ajv({ allErrors: true }).compile(schema);

const emptyTokenList: TokenList = {
    name: "",
    timestamp: new Date(0).toISOString(),
    version: {
        major: 0,
        minor: 0,
        patch: 0,
    },
    tokens: [],
};

const getRemoteTokenList = async (
    listUrl: string,
    resolveENSContentHash: (ensName: string) => Promise<string>,
): Promise<TokenList> => {
    const parsedENS = parseENSAddress(listUrl);
    let urls: string[];
    if (parsedENS) {
        let contentHashUri;
        try {
            contentHashUri = await resolveENSContentHash(parsedENS.ensName);
        } catch (error) {
            console.debug(`Failed to resolve ENS name: ${parsedENS.ensName}`, error);
            throw new Error(`Failed to resolve ENS name: ${parsedENS.ensName}`);
        }
        let translatedUri;
        try {
            translatedUri = contenthashToUri(contentHashUri);
        } catch (error) {
            console.debug("Failed to translate contenthash to URI", contentHashUri);
            throw new Error(`Failed to translate contenthash to URI: ${contentHashUri}`);
        }
        urls = uriToHttp(`${translatedUri}${parsedENS.ensPath ?? ""}`);
    } else {
        urls = uriToHttp(listUrl);
    }
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const isLast = i === urls.length - 1;
        let response;
        try {
            response = await fetch(url);
        } catch (error) {
            console.debug("Failed to fetch list", listUrl, error);
            if (isLast) throw new Error(`Failed to download list ${listUrl}`);
            continue;
        }

        if (!response.ok) {
            if (isLast) throw new Error(`Failed to download list ${listUrl}`);
            continue;
        }

        const json = await response.json();
        if (!tokenListValidator(json)) {
            const validationErrors: string =
                tokenListValidator.errors?.reduce<string>((memo, error) => {
                    const add = `${error.dataPath} ${error.message ?? ""}`;
                    return memo.length > 0 ? `${memo}; ${add}` : `${add}`;
                }, "") ?? "unknown error";
            throw new Error(`Token list failed validation: ${validationErrors}`);
        }
        return json;
    }
    throw new Error("Unrecognized list URL protocol.");
};

/**
 * Contains the logic for resolving a list URL to a validated token list
 * @param listUrl list url
 * @param resolveENSContentHash resolves an ens name to a contenthash
 */
export default async function getTokenList(
    listUrl: string,
    resolveENSContentHash: (ensName: string) => Promise<string>,
    chainId: ChainId | undefined,
): Promise<TokenList> {
    if (chainId == undefined) {
        return emptyTokenList;
    }

    const defaultList = tokenLists[chainId];
    if (listUrl === DEFAULT_TOKEN_LIST_URL) {
        return defaultList;
    }

    const remoteList = await getRemoteTokenList(listUrl, resolveENSContentHash);
    return {
        ...remoteList,
        tokens: [...defaultList.tokens, ...remoteList.tokens],
        keywords: [...(defaultList.keywords ?? []), ...(remoteList.keywords ?? [])],
        tags: { ...(defaultList.tags ?? ({} as Tags)), ...(remoteList.tags ?? {}) },
    };
}
