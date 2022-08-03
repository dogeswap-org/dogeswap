import { ChainId } from "@dogeswap/sdk-core";
import { Provider } from "@ethersproject/abstract-provider";
import { Contract } from "@ethersproject/contracts";
import { namehash } from "ethers/lib/utils";
import { addresses } from "../../common/addresses";

const REGISTRAR_ABI = [
    {
        constant: true,
        inputs: [
            {
                name: "node",
                type: "bytes32",
            },
        ],
        name: "resolver",
        outputs: [
            {
                name: "resolverAddress",
                type: "address",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
];

const RESOLVER_ABI = [
    {
        constant: true,
        inputs: [
            {
                internalType: "bytes32",
                name: "node",
                type: "bytes32",
            },
        ],
        name: "contenthash",
        outputs: [
            {
                internalType: "bytes",
                name: "",
                type: "bytes",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
];

// cache the resolver contracts since most of them are the public resolver
function resolverContract(resolverAddress: string, provider: Provider): Contract {
    return new Contract(resolverAddress, RESOLVER_ABI, provider);
}

/**
 * Fetches and decodes the result of an ENS contenthash lookup on mainnet to a URI
 * @param ensName to resolve
 * @param provider provider to use to fetch the data
 */
export default async function resolveENSContentHash(
    ensName: string,
    provider: Provider,
    chainId: ChainId,
): Promise<string> {
    const registrarAddress = addresses[chainId].infrastructure.ensRegistrar;
    const ensRegistrarContract = new Contract(registrarAddress, REGISTRAR_ABI, provider);
    const hash = namehash(ensName);
    const resolverAddress = await ensRegistrarContract.resolver(hash);
    return resolverContract(resolverAddress, provider).contenthash(hash);
}
