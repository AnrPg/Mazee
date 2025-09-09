// Creates an app database and a non-root user for it.
const adminUser = process.env.MONGO_INITDB_ROOT_USERNAME || "mazee";
const adminPass = process.env.MONGO_INITDB_ROOT_PASSWORD || "mazee_dev_pw";

print(">> Creating app database and user…");
const dbName = "mazee_dev";
const appUser = "mazee_app";
const appPass = "mazee_app_pw";

db = db.getSiblingDB(dbName);
db.createUser({
  user: appUser,
  pwd: appPass,
  roles: [{ role: "readWrite", db: dbName }],
});
print(`>> Created user '${appUser}' on db '${dbName}'.`);
