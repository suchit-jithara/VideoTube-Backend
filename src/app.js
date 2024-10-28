import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))

app.use(express.json({ limit: '16kb' }))
// Purpose: This middleware parses JSON payloads in incoming requests.
// Content-Type: It only parses requests with Content-Type: application/json.
// Parsing Result: Converts the JSON payload into a JavaScript object and attaches it to req.body.

app.use(express.urlencoded({ extended: true, limit: '16kb' }))
// Purpose: This middleware parses URL-encoded payloads, commonly used with HTML form submissions.
// Content-Type: It only parses requests with Content-Type: application/x-www-form-urlencoded.
// Parsing Result: Converts the URL-encoded payload into a JavaScript object, similar to query string parsing, and attaches it to req.body.

app.use(express.static("public"));
app.use(cookieParser({}));
// Purpose: This middleware parses cookies attached to the incoming request object (req).
// Cookies: Cookies are typically sent by the client (usually a web browser) to the server in the HTTP headers. They are often used for session management, user tracking, and storing user preferences.
// Result: After this middleware is applied, the parsed cookies will be accessible in req.cookies as a JavaScript object.

// The app.use(cookieParser({})) line allows your Express application to read cookies from incoming requests, making it easier to manage user sessions and store user-specific data.
// By accessing req.cookies, you can work with cookies in a straightforward way, as they are converted into a JavaScript object.





// import router
import userRoute  from "./routes/user.routes.js";

app.use("/api/v1/user", userRoute);

export default app;