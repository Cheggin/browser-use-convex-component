import { defineApp } from "convex/server";
import browserUse from "browser-use-convex-component/convex.config.js";

const app = defineApp();
app.use(browserUse);

export default app;
