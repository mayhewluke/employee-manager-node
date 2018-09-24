import mongoose, { Document } from "mongoose"; // eslint-disable-line import/newline-after-import
import WebSocket = require("ws");

import { useMongo, useWebsocketServer } from "test/helpers";

import { Employee, EmployeeModel } from "Employee";
import firebaseAdmin from "firebaseAdmin";
import { creators, MessageTypes } from "websocket/messages";

let client: WebSocket;
let originalVerify: any;
const mockVerify = jest.fn();
const uid = "uid1";

useMongo("delete");
const getClient = useWebsocketServer();

beforeEach(() => {
  client = getClient();
});

// Manually mock the verifyIdToken method
beforeAll(() => {
  const auth = firebaseAdmin.auth();
  originalVerify = auth.verifyIdToken;
  auth.verifyIdToken = mockVerify;
});
afterAll(() => {
  firebaseAdmin.auth().verifyIdToken = originalVerify;
});

describe("when logged in", () => {
  const existingEmployee: Partial<Employee & Document> = {
    _id: new mongoose.Types.ObjectId(),
    employeeName: "Taylor",
    phone: "555-5555",
    shift: "Monday",
    userUid: uid
  };
  beforeEach(async done => {
    mockVerify.mockImplementation(() => Promise.resolve({ uid }));
    await EmployeeModel.create(existingEmployee);
    client.on("message", (data: string) => {
      const response = JSON.parse(data);
      if (response.type === MessageTypes.AuthSuccess) done();
    });
    client.send(JSON.stringify(creators.authenticate(uid)));
  });

  describe("when the Employee with the given id exists", () => {
    // eslint-disable-next-line no-underscore-dangle
    const msg = JSON.stringify(creators.deleteEmployee(existingEmployee._id));

    it("deletes the Employee", done => {
      client.on("message", async () => {
        // eslint-disable-next-line no-underscore-dangle
        const employee = await EmployeeModel.findById(existingEmployee._id);
        expect(employee).toBeNull();
        done();
      });

      client.send(msg);
    });

    it("sends a delete success message then a list employees message", done => {
      let count = 0;
      client.on("message", (data: string) => {
        const response = JSON.parse(data);
        if (count === 0) {
          // eslint-disable-next-line operator-assignment
          count = count + 1;
          expect(response.type).toEqual(MessageTypes.DeleteEmployeeSuccess);
        } else if (count === 1) {
          expect(response.type).toEqual(MessageTypes.EmployeesList);
          done();
        }
      });

      client.send(msg);
    });
  });

  describe("when the Employee with the given id does not exist", () => {
    const msg = JSON.stringify(
      creators.deleteEmployee(new mongoose.Types.ObjectId().toString())
    );

    it("returns an error message", done => {
      client.on("message", (data: string) => {
        const response = JSON.parse(data);
        expect(response.type).toEqual(MessageTypes.Error);
        done();
      });

      client.send(msg);
    });

    it("does not delete any Employees", async done => {
      const originalCount = await EmployeeModel.countDocuments({});
      expect(originalCount).toBeGreaterThan(0);

      client.on("message", async () => {
        expect(await EmployeeModel.countDocuments({})).toBe(originalCount);
        done();
      });

      client.send(msg);
    });
  });
});

describe("when not logged in", () => {
  const msg = JSON.stringify(
    creators.deleteEmployee(new mongoose.Types.ObjectId().toString())
  );

  it("returns an error message", done => {
    client.on("message", (data: string) => {
      const response = JSON.parse(data);
      expect(response.type).toEqual(MessageTypes.Error);
      done();
    });

    client.send(msg);
  });
});
