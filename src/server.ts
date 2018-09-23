import http from "http";
import mongoose from "mongoose";

import expressApp from "express-app";
import wsserver from "wsserver";

const port = process.env.PORT || 3000;
const server = http.createServer(expressApp);

server.listen(port, () => console.log(`Example app listening on port ${port}`));
wsserver(server);

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://127.0.0.1/employee-manager-node");

export default server;
