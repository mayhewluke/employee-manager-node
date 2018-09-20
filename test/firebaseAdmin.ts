jest.mock("firebase-admin");
jest.mock("secrets/firebaseAdminConfig.json", () => ({}), {
  virtual: true
});

import firebaseAdmin from "firebase-admin";

describe("firebaseAdmin module", () => {
  const initialize = firebaseAdmin.initializeApp;
  const credential = { foo: "bar" };
  beforeEach(() => {
    (firebaseAdmin.credential.cert as any).mockImplementation(() => credential);
  });

  it("it initializes firebase-admin with credentials from the config file", () => {
    const databaseURL = expect.any(String);
    expect(initialize).not.toHaveBeenCalled();

    require("firebaseAdmin");

    expect(initialize).toHaveBeenCalledWith({ credential, databaseURL });
  });

  it("exports firebase-admin", () => {
    expect(require("firebaseAdmin").default).toBe(
      require("firebase-admin").default
    );
  });
});
