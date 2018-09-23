import http from "http";
import { AddressInfo } from "net"; // eslint-disable-line import/newline-after-import
import WebSocket = require("ws");

import wsserver from "wsserver";

const useWebsocketServer = () => {
  let server: http.Server;
  let serverAddress: string | AddressInfo;
  let wss: WebSocket.Server;
  let client: WebSocket;

  beforeAll(done => {
    server = http.createServer().listen();
    serverAddress = server.address();
    wss = wsserver(server);
    wss.on("listening", done);
  });

  beforeEach(done => {
    if (typeof serverAddress === "string") {
      throw new Error("serverAddress was a pipe or UNIX domain socket");
    }
    // Brackets are needed in case it's IPv6
    client = new WebSocket(
      `ws://[${serverAddress.address}]:${serverAddress.port}`
    );
    client.on("open", done);
  });

  afterEach(done => {
    // `onclose` passes an error along, so wrap in a fn that swallows the error or
    // else the tests will fail
    client.onclose = () => done();
    client.close();
  });

  afterAll(done => {
    wss.close(() => {
      server.close(done);
    });
  });

  return () => client;
};

export default useWebsocketServer;
