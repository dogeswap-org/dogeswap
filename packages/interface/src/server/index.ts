import Koa from "koa";
import serve from "koa-static";
import path from "path";

const port = 9001;

const app = new Koa();
app.use(serve(path.resolve(__dirname, "..", "client")));
app.listen(port);
console.log(`DogeSwap interface running on port ${port}`);
