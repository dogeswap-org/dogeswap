import React, { useState } from "react";
import { HelpCircle } from "react-feather";
import { ImageProps } from "rebass";

const BAD_SRCS: { [tokenAddress: string]: true } = {};

export interface LogoProps extends Pick<ImageProps, "style" | "alt" | "className"> {
    srcs: string[];
}

// TODO: Typed the rest props as any because the React CSS properties don't quite line up yet. Fix this later.

/**
 * Renders an image by sequentially trying a list of URIs, and then eventually a fallback triangle alert
 */
export default function Logo({ srcs, alt, ...rest }: LogoProps) {
    const [, refresh] = useState<number>(0);

    const src: string | undefined = srcs.find((src) => !BAD_SRCS[src]);

    if (src) {
        return (
            <img
                {...(rest as any)}
                alt={alt}
                src={src}
                onError={() => {
                    if (src) BAD_SRCS[src] = true;
                    refresh((i) => i + 1);
                }}
            />
        );
    }

    return <HelpCircle {...(rest as any)} />;
}
