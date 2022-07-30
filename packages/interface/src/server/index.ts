import Koa from "koa";
import serve from "koa-static";
import path from "path";

const app = new Koa();
app.use(serve(path.resolve(__dirname, "..", "client")));
app.listen(9001);
