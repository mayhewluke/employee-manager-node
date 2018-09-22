import http from "http";
import { AddressInfo } from "net"; // eslint-disable-line import/newline-after-import
import WebSocket = require("ws");

import firebaseAdmin from "firebaseAdmin";
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
    const payload = JSON.stringify({ hello: "world" });

    client.on("message", data => {
      expect(data).toEqual(payload);
      done();
    });

    client.send(payload);
  });

  describe("message validation", () => {
    const payload = "}{lk}{[]a12}";
    it("responds with an error if the payload is not valid JSON", done => {
      client.on("message", data => {
        expect(typeof data).toBe("string");
        if (typeof data === "string") {
          const response = JSON.parse(data);
          expect(response.event).toBe("error");
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
          expect(response.event).toBe("error");
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
      const token = "1234";
      const payload = JSON.stringify({ token, event: "authenticate" });

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
        const message = { event: "authenticate", token: "" };
        mockVerify.mockImplementation(() => Promise.resolve(returnToken));

        client.on("message", data => {
          expect(typeof data).toBe("string");
          if (typeof data === "string") {
            const response = JSON.parse(data);
            expect(response.event).toBe("authSuccess");
            done();
          }
        });

        client.send(JSON.stringify(message));
      });
    });

    describe("when unsuccessful", () => {
      it("responds with the error from firebase", done => {
        const error = new Error("Something went wrong!");
        const message = { event: "authenticate", token: "" };
        mockVerify.mockImplementation(() => Promise.reject(error));

        client.on("message", data => {
          expect(typeof data).toBe("string");
          if (typeof data === "string") {
            const response = JSON.parse(data);
            expect(response.event).toBe("error");
            expect(response.message).toEqual(error.message);
            done();
          }
        });

        client.send(JSON.stringify(message));
      });
    });
  });
});
