import { defineApp } from "convex/server";
import browserUse from "../../src/component/convex.config.js";

const app = defineApp();
app.use(browserUse);

export default app;
