import http from "http";
import { AddressInfo } from "net"; // eslint-disable-line import/newline-after-import
import WebSocket = require("ws");

import firebaseAdmin from "firebaseAdmin";
import { creators, MessageTypes } from "websocket/messages";
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

  describe("authentication", () => {
    let originalAuth: any;
    const mockVerify = jest.fn(() => Promise.resolve());
    const token = "1234";
    const payload = JSON.stringify(creators.authenticate(token));
    beforeAll(() => {
      // `auth` is a getter so it can't be automocked or assigned to with `=`
      originalAuth = firebaseAdmin.auth;
      Object.defineProperty(firebaseAdmin, "auth", {
        value: jest.fn(() => ({
          verifyIdToken: mockVerify
        }))
      });
    });
    afterAll(() => {
      Object.defineProperty(firebaseAdmin, "auth", {
        value: originalAuth
      });
    });

    it("checks the client's auth token against firebase", done => {
      client.on("message", () => {
        expect(mockVerify).toHaveBeenCalledTimes(1);
        expect(mockVerify).toHaveBeenCalledWith(token);
        done();
      });

      client.send(payload);
    });

    describe("when successful", () => {
      it("responds with an authSuccess message", done => {
        const returnToken = { uid: "uid1" };
        mockVerify.mockImplementation(() => Promise.resolve(returnToken));

        client.on("message", data => {
          expect(typeof data).toBe("string");
          if (typeof data === "string") {
            const response = JSON.parse(data);
            expect(response.type).toBe(MessageTypes.AuthSuccess);
            done();
          }
        });

        client.send(payload);
      });
    });

    describe("when unsuccessful", () => {
      it("responds with the error from firebase", done => {
        const error = new Error("Something went wrong!");
        mockVerify.mockImplementation(() => Promise.reject(error));

        client.on("message", data => {
          expect(typeof data).toBe("string");
          if (typeof data === "string") {
            const response = JSON.parse(data);
            expect(response.type).toBe(MessageTypes.Error);
            expect(response.payload.message).toEqual(error.message);
            done();
          }
        });

        client.send(payload);
      });
    });
  });
});
