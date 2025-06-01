const dotenv = require("dotenv").config()
const express = require("express")
const connect = require("./config/data")
const app = express()
const PORT = process.env.PORT
const userRoutes = require("./routes/userRoutes")
const postRoutes = require("./routes/postRoutes")
const cors = require("cors");


app.use(express.json());
app.use(cors());

app.get("/home", (req, res) => {
  res.send("Hello from Home Page")
})

app.use("/user", userRoutes)
app.use("/posts", postRoutes)



app.listen(PORT, async () => {
  try {
    await connect;
    console.log("Connected to MongoDB");
    console.log(`Server running on port ${PORT}`)
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message)
  }
});
