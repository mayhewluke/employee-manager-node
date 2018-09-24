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

useMongo("create");
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
  const existingEmployee: Employee = {
    employeeName: "Taylor",
    phone: "555-5555",
    shift: "Monday"
  };
  beforeEach(async done => {
    mockVerify.mockImplementation(() => Promise.resolve({ uid }));
    await UserModel.create({ _id: uid, employees: [existingEmployee] });
    client.on("message", (data: string) => {
      const response = JSON.parse(data);
      if (response.type === MessageTypes.AuthSuccess) done();
    });
    client.send(JSON.stringify(creators.authenticate(uid)));
  });

  describe("with a valid employee", () => {
    const employee: Employee = {
      employeeName: "Casey",
      phone: "123-456-7890",
      shift: "Friday"
    };
    const msg = JSON.stringify(creators.createEmployee(employee));

    it("adds the employee to the current user", done => {
      client.on("message", async () => {
        const [first, second] = (await UserModel.findById(uid))!.employees;
        expect(first).toEqual(expect.objectContaining(existingEmployee));
        expect(second).toEqual(expect.objectContaining(employee));
        done();
      });

      client.send(msg);
    });

    it("sends a create success message then a list employees message", done => {
      let count = 0;
      client.on("message", (data: string) => {
        const response = JSON.parse(data);
        if (count === 0) {
          // eslint-disable-next-line operator-assignment
          count = count + 1;
          expect(response.type).toEqual(MessageTypes.CreateEmployeeSuccess);
        } else if (count === 1) {
          expect(response.type).toEqual(MessageTypes.EmployeesList);
          done();
        }
      });

      client.send(msg);
    });

    it("sends out the updated employees list", done => {
      client.on("message", (data: string) => {
        const response = JSON.parse(data);
        if (response.type === MessageTypes.EmployeesList) {
          const [first, second] = response.payload;
          expect(first).toEqual(expect.objectContaining(existingEmployee));
          expect(second).toEqual(expect.objectContaining(employee));
          done();
        }
      });

      client.send(msg);
    });
  });

  describe("with an invalid employee", () => {
    const employee = { foo: "bar" };
    const msg = JSON.stringify(creators.createEmployee(employee as any));

    it("returns an error message", done => {
      client.on("message", (data: string) => {
        const response = JSON.parse(data);
        expect(response.type).toEqual(MessageTypes.Error);
        done();
      });

      client.send(msg);
    });

    it("does not change the employees", async done => {
      // Jest sees them as unequal even when they are identical for some reason.
      // Serializing them solves this.
      const getEmployees = async () =>
        JSON.stringify((await UserModel.findById(uid))!.employees);
      const originalEmployees = await getEmployees();

      client.on("message", async () => {
        expect(await getEmployees()).toEqual(originalEmployees);
        done();
      });

      client.send(msg);
    });
  });
});

describe("when not logged in", () => {
  const employee: Employee = {
    employeeName: "Casey",
    phone: "123-456-7890",
    shift: "Friday"
  };
  const msg = JSON.stringify(creators.createEmployee(employee));

  it("returns an error message", done => {
    client.on("message", (data: string) => {
      const response = JSON.parse(data);
      expect(response.type).toEqual(MessageTypes.Error);
      done();
    });

    client.send(msg);
  });
});
