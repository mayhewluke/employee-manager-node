import http from "http";
import { AddressInfo } from "net"; // eslint-disable-line import/newline-after-import
import WebSocket = require("ws");

import { MessageTypes } from "websocket/messages";
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
  describe("message validation", () => {
    const payload = "}{lk}{[]a12}";
    it("responds with an error if the payload is not valid JSON", done => {
      client.on("message", data => {
        expect(typeof data).toBe("string");
        if (typeof data === "string") {
          const response = JSON.parse(data);
          expect(response.type).toBe(MessageTypes.Error);
          done();
        }
      });

      client.send(payload);
    });

    it("keeps working even after an error", done => {
      let count = 0;

      client.on("message", data => {
        expect(typeof data).toBe("string");
        if (typeof data === "string") {
          const response = JSON.parse(data);
          /* eslint-disable-next-line operator-assignment */
          count = count + 1;
          expect(response.type).toBe(MessageTypes.Error);
          if (count === 2) done();
        }
      });

      client.send(payload);
      client.send(payload);
    });
  });
});
