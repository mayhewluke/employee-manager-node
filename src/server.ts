import express from "express";

const app = express();

app.get("/", (_, res) => res.send("Hello World!"));

/* tslint:disable:no-console */
/* eslint-disable-next-line no-console */
app.listen(3000, () => console.log("Example app listening on port 3000"));
/* tslint:enable:no-console */
