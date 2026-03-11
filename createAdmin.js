const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Admin = require("./models/Admin");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const hashedPassword = await bcrypt.hash("admin@omtneo26", 10);

    await Admin.create({
      username: "admin",
      password: hashedPassword
    });

    console.log("Admin Created");
    process.exit();
  })
  .catch(err => console.log(err));