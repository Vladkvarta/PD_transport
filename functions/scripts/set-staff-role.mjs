import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "node:fs";

const [email, role = "secretary"] = process.argv.slice(2);
if (!email || !["secretary", "admin"].includes(role)) {
  console.error("Usage: npm run set-role -- manager@company.ua secretary");
  process.exit(1);
}

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const credential = serviceAccountPath
  ? cert(JSON.parse(readFileSync(serviceAccountPath, "utf8")))
  : applicationDefault();

if (getApps().length === 0) {
  initializeApp({ credential });
}

const user = await getAuth().getUserByEmail(email);
await getAuth().setCustomUserClaims(user.uid, {
  ...user.customClaims,
  role,
});

console.log(`Role "${role}" assigned to ${email}.`);
