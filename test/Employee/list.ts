import WebSocket = require("ws");

import { useMongo, useWebsocketServer } from "test/helpers";

import { UserModel } from "authentication/User";
import { Employee } from "Employee/model";
import firebaseAdmin from "firebaseAdmin";
import { creators, MessageTypes } from "websocket/messages";

let client: WebSocket;
let originalVerify: any;
const mockVerify = jest.fn();
const uid = "uid1";

useMongo("list");
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

const employees: Employee[] = [
  {
    employeeName: "Taylor",
    phone: "555-5555",
    shift: "Monday"
  },
  {
    employeeName: "Casey",
    phone: "123-456-7890",
    shift: "Friday"
  }
];
const msg = JSON.stringify(creators.listEmployees());

describe("when logged in", () => {
  beforeEach(async done => {
    mockVerify.mockImplementation(() => Promise.resolve({ uid }));
    await UserModel.create({ employees, _id: uid });
    client.on("message", (data: string) => {
      const response = JSON.parse(data);
      if (response.type === MessageTypes.AuthSuccess) done();
    });
    client.send(JSON.stringify(creators.authenticate(uid)));
  });

  it("returns the list of employees for the current user", done => {
    client.on("message", async (data: string) => {
      const { type, payload } = JSON.parse(data);
      expect(type).toEqual(MessageTypes.EmployeesList);
      expect(payload[0]).toEqual(expect.objectContaining(employees[0]));
      expect(payload[1]).toEqual(expect.objectContaining(employees[1]));
      done();
    });

    client.send(msg);
  });

  it("does not return employees from any other users", async done => {
    const otherEmployee = {
      employeeName: "foo",
      phone: "999-8888",
      shift: "Sunday"
    };
    await UserModel.create({ _id: "otheruid", employees: [otherEmployee] });

    client.on("message", (data: string) => {
      const { type, payload } = JSON.parse(data);
      expect(type).toEqual(MessageTypes.EmployeesList);
      expect(payload).not.toContainEqual(
        expect.objectContaining(otherEmployee)
      );
      done();
    });

    client.send(msg);
  });
});

describe("when not logged in", () => {
  it("sends an error", done => {
    client.on("message", (data: string) => {
      const { type } = JSON.parse(data);
      expect(type).toEqual(MessageTypes.Error);
      done();
    });

    client.send(msg);
  });
});
