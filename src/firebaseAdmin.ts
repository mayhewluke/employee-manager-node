import firebaseAdmin from "firebase-admin";
import firebaseAdminConfigJson from "secrets/firebaseAdminConfig.json";

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(firebaseAdminConfigJson),
  databaseURL: "https://rncoursemanager-ccb4f.firebaseio.com"
});

export default firebaseAdmin;
