import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";

const app = express();
app.use(cors());
app.use(bodyParser.json());
const port = 5000;

// connecting to mongodb server
mongoose
  .connect("mongodb://127.0.0.1:27017/ricoz")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Couldn't connect to MongoDB: " + err.message));

// mongoose schema
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

app.get("/", (req, res) => {
  res.send("<h1>Hello World</h1>");
});

// get api to fetch all users
app.get("/users", async (req, res) => {
  try {
    const users = await userModel.find({});
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({
      message: "Server error while fetching users",
      error: err.message,
    });
  }
});

// post api to add new user
app.post("/add", async (req, res) => {
  const { userName, userEmail } = req.body;
  try {
    const userExist = await userModel.findOne({ userEmail: userEmail });
    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new userModel({ userName, userEmail });
    const savedUser = await newUser.save();

    res
      .status(200)
      .json({ user: savedUser, status: "New user added successfully!!" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error while adding user", error: err.message });
  }
});

app.put("/update/:userEmail", async (req, res) => {
  const { userEmail } = req.params;
  const { userName } = req.body;
  try {
    const updateUser = await userModel.findOneAndUpdate(
      { userEmail: userEmail },
      { userName: userName },
      { new: true }
    );
    if (!updateUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res
      .status(200)
      .json({ user: updateUser, status: "User updated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Server error while updating user",
        error: err.message,
      });
  }
});

// server
app.listen(port, () => {
  console.log("Listening on port " + port);
});
