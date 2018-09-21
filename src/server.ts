import http from "http";

import expressApp from "express-app";
import wsserver from "wsserver";

const port = process.env.PORT || 3000;
const server = http.createServer(expressApp);

server.listen(port, () => console.log(`Example app listening on port ${port}`));
wsserver(server);

export default server;
