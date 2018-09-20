import express from "express";

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (_, res) => res.send("Hello World!"));

/* tslint:disable:no-console */
/* eslint-disable-next-line no-console */
app.listen(port, () => console.log(`Example app listening on port ${port}`));
/* tslint:enable:no-console */
