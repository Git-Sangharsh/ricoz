import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";

const app = express();
const port = 5000;

app.get("/", (req, res) => {
    res.send("<h1>hello World</h1>");
})

app.listen(port, () => {
    console.log("listening on port " + port)
} )