export const MONGODB_URI = process.env["MONGODB_URI"];


if (!MONGODB_URI) {
  console.log(process.env);
  console.log("No mongo connection string. Set MONGODB_URI environment variable.");
  process.exit(1);
}