import Koa from "koa";
import serve from "koa-static";
import path from "path";
import yargs from "yargs";

const run = async () => {
    const args = await yargs(process.argv.slice(2))
        .number(["p", "c"])
        .describe("p", "The port on which to run the server.")
        .describe("c", "The chain ID to set on the client")
        .demandOption(["c"])
        .default("p", 9001)
        .default("c", 31337)
        .parse();

    new Koa()
        .use(async (ctx, next) => {
            ctx.cookies.set("chainId", args.c.toString(), { httpOnly: false });
            await next();
        })
        .use(serve(path.resolve(__dirname, "..", "client")))
        .use(serve(path.resolve(__dirname, "..", "client", "assets", "images")))
        .listen(args.p);

    console.log(`DogeSwap interface running. Port: ${args.p}. Chain ID: ${args.c}.`);
};

run();
