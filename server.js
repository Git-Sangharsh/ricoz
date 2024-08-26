import http from "http";
import mongoose from "mongoose";
import { parse } from "url";

const port = 5000;

// Middleware for handling CORS
const handleCors = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return false;
  }
  return true;
};

// Middleware for parsing JSON body
const parseBody = (req, res) => {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Invalid JSON" }));
        reject(err);
      }
    });
  });
};

// Connecting to MongoDB server
mongoose
  .connect("mongodb://127.0.0.1:27017/ricoz")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Couldn't connect to MongoDB: " + err.message));

// Mongoose schema
const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    unique: true,
    required: true,
  },
});

const userModel = mongoose.model("userdata", userSchema);

// Create server
const server = http.createServer(async (req, res) => {
  if (!handleCors(req, res)) return;

  const parsedUrl = parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  if (path === "/" && method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h1>Hello World</h1>");
  } else if (path === "/users" && method === "GET") {
    try {
      const users = await userModel.find({});
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(users));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Server error while fetching users",
          error: err.message,
        })
      );
    }
  } else if (path === "/add" && method === "POST") {
    try {
      const body = await parseBody(req, res);
      const { userName, userEmail } = body;
      const userExist = await userModel.findOne({ userEmail });
      if (userExist) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "User already exists" }));
        return;
      }

      const newUser = new userModel({ userName, userEmail });
      const savedUser = await newUser.save();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ user: savedUser, status: "New user added successfully!!" })
      );
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Server error while adding user",
          error: err.message,
        })
      );
    }
  } else if (path.startsWith("/update/") && method === "PUT") {
    const userEmail = path.split("/")[2];
    try {
      const body = await parseBody(req, res);
      const { userName } = body;
      const updateUser = await userModel.findOneAndUpdate(
        { userEmail },
        { userName },
        { new: true }
      );
      if (!updateUser) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "User not found" }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ user: updateUser, status: "User updated successfully" })
      );
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Server error while updating user",
          error: err.message,
        })
      );
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
});

// Start server
server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
