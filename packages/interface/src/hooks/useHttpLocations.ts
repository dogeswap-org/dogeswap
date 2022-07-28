import { useMemo } from "react";
import contenthashToUri from "../utils/contenthashToUri";
import { parseENSAddress } from "../utils/parseENSAddress";
import uriToHttp from "../utils/uriToHttp";
import useENSContentHash from "./useENSContentHash";

export default function useHttpLocations(uri: string | undefined): string[] {
    const ens = useMemo(() => (uri ? parseENSAddress(uri) : undefined), [uri]);
    const contentHash = ens != undefined ? useENSContentHash(ens.ensName).contenthash : undefined;
    return useMemo(() => {
        if (ens) {
            return contentHash ? uriToHttp(contenthashToUri(contentHash)) : [];
        } else {
            return uri ? uriToHttp(uri) : [];
        }
    }, [ens, contentHash, uri]);
}
