import http from "http";
import { AddressInfo } from "net"; // eslint-disable-line import/newline-after-import
import WebSocket = require("ws");

import wsserver from "wsserver";

let server: http.Server;
let serverAddress: string | AddressInfo;
let wss: WebSocket.Server;
let client: WebSocket;

// Set up WebSocket and HTTP servers
beforeAll(done => {
  server = http.createServer().listen();
  serverAddress = server.address();
  wss = wsserver(server);
  wss.on("listening", done);
});

// Set up the WebSocket client
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

// Tear down the WebSocket client
afterEach(done => {
  // `onclose` passes an error along, so wrap in a fn that swallows the error or
  // else the tests will fail
  client.onclose = () => done();
  client.close();
});

// Tear down WebSocket and HTTP servers
afterAll(done => {
  wss.close(() => {
    server.close(done);
  });
});

describe("websockets", () => {
  it("echoes back sent messages", done => {
    const payload = "Hello World!";

    client.on("message", data => {
      expect(data).toEqual(payload);
      done();
    });

    client.send(payload);
  });
});
