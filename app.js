//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { userInfo } = require("os");
const app = express();

// For Current Time Zone in booking field
const moment = require('moment-timezone');

// TO upload photo to mongodb
const multer = require("multer");
const { log } = require("console");

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  dest: 'public/uploads',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: function(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

mongoose.connect("mongodb://127.0.0.1:27017/CourierWebsite", {
  useNewUrlParser: true,
});

// Define the franchisee schema and model
const franchiseeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pincode: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true,unique: true },
  address: { type: String, required: true },
  password: { type: String, required: true },
  image: { data: Buffer, contentType: String },
  // booked: []
});

const Franchisee = mongoose.model("Franchisee", franchiseeSchema);

const bookedConsignementSchema = new mongoose.Schema({
  trakingID: { type: String, required: true, unique: true },
  Spincode: { type: String, required: true },
  Rpincode: { type: String, required: true },
  SName: { type: String, required: true },
  RName: { type: String, required: true },
  Smobile: { type: String, required: true },
  Rmobile: { type: String, required: true },
  SAddress: { type: String},
  RAddress: { type: String, required: true },
  Semail: { type: String},
  Remail: { type: String},
  date: { type: Date }
});

const bookedConsignement = mongoose.model("bookedConsignement", bookedConsignementSchema);



app.get("/", function (req, res) {
  res.render("home");
});

app.get("/Network", function (req, res) {
  const success = req.query.success;
  res.render("network",{ success: success });
});


app.post("/network", async function (req, res) {
  const pinCode = req.body.pinCode;
  console.log(pinCode);
  try {
    const user = await Franchisee.findOne({
      pincode: pinCode,
    });
    if (!user) {
      res.redirect("/network?success=invalid");
    } else {
      res.redirect("/branch?pincode=" + user.pincode);
    }
  } catch (err) {
    console.error("Error finding pincode or comparing pincode:", err);
    // return res.status(500).send("Error finding user or comparing password");
  }

});

app.get("/branch", async function (req, res) {
  const pinCode = req.query.pincode;
  console.log(pinCode);
  try {
    const user = await Franchisee.findOne({
      pincode: pinCode,
    });
    if (!user) {
      res.redirect("/network");
    } else {
      res.render("branch", { franchisee: user });
    }
  } catch (err) {
    console.error("Error finding user:", err);
    // return res.status(500).send("Error finding user");
  }
});


app.get("/Service", function (req, res) {
  res.render("service");
});

app.get("/Solution", function (req, res) {
  res.render("solution");
});

app.get("/About", function (req, res) {
  res.render("about");
});

app.get("/login", function (req, res) {
  const success = req.query.success;
  res.render("login", { success: success });
});

// Set up the login form submission route
app.post("/login", async function (req, res) {
  const { email, password } = req.body;
  console.log(email+password);
  try {
    const user = await Franchisee.findOne({
      email: email,
      password: password,
    });
    if (!user) {
      res.redirect("/login?success=invalid");
    } else {
      res.redirect("/user?id=" + user._id);
    }
  } catch (err) {
    console.error("Error finding user or comparing password:", err);
    // return res.status(500).send("Error finding user or comparing password");
  }
});

app.get("/user", async function (req, res) {
  const userId = req.query.id;
  try {
    const user = await Franchisee.findById(userId);
    if (!user) {
      res.redirect("/login");
    } else {
      res.render("user", { franchisee: user });
    }
  } catch (err) {
    console.error("Error finding user:", err);
    // return res.status(500).send("Error finding user");
  }
});


app.post("/bookConsignment", async function (req, res) {
  const currentDate = moment().tz('Asia/Kolkata').toDate();

  const booked = new bookedConsignement({
    trakingID: req.body.trakingNumber,
    Spincode: req.body.SPincode,
    Rpincode: req.body.RPincode,
    SName: req.body.SName,
    RName: req.body.RName,
    Smobile: req.body.SMobile,
    Rmobile: req.body.RMobile,
    SAddress: req.body.SAddress,
    RAddress: req.body.RAddress,
    Semail: req.body.SEmail,
    Remail: req.body.REmail,
    date: currentDate
  });

  try {
    await booked.save();
    // redirect to contact page with success message
    res.redirect("/bookConsignment?success=booked");
  } catch (err) {
    res.redirect("/bookConsignment?success=errorinbooking");
    console.error(err);
  }
});

app.get("/bookConsignment", function (req, res) {
  const success = req.query.success;
  res.render("booking",{ success: success });
});



app.post("/Track", async function (req, res) {
    const trakingNumber = req.body.trakingNumber;

    console.log(trakingNumber);
    try {
      const found = await bookedConsignement.findOne({
      trakingID: trakingNumber
    });
      if (!found) {
        res.redirect("/Track?success=invalid");
      } else {
        res.redirect("/Traking?id=" + found._id);
      }
    } catch (err) {
      console.error("Error finding traking number in database:", err);
      // return res.status(500).send("Error finding user or comparing password");
    }
});

app.get("/Traking", async function (req, res) {
  const trakingDBId = req.query.id;
  try {
    const found = await bookedConsignement.findById(trakingDBId);
    if (!found) {
      res.redirect("/Track");
    } else {
      res.render("Traking", { track: found });
    }
  } catch (err) {
    console.error("Error finding user:", err);
    // return res.status(500).send("Error finding user");
  }
});

app.get("/Track", function (req, res) {
  const success = req.query.success;
  res.render("track",{ success: success });
});

app.get("/admin", function (req, res) {
  const success = req.query.success;

  res.render("admin", { success: success });
});

app.post("/deleteFranchisee", function (req, res) {
  const pincode = req.body.pincode;
  Franchisee.findOneAndDelete({ pincode: pincode })
    .then(function (franchisee) {
      if (!franchisee) {
        console.log("Franchisee not found");
        res.redirect("/admin?success=notFound");
      } else {
        res.redirect("/admin?success=deleted");
      }
    })
    .catch(function (err) {
      console.log(err);
      console.error("Error deleting franchisee:", err);
      return res.status(500).send("Error deleting franchisee");
    });
});

app.post("/addFranchisee", upload.single('image'), async function (req, res) {

  console.log(req.file);
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  const franchisee = new Franchisee({
    name: req.body.name,
    image: {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    },
    pincode: req.body.pincode,
    mobile: req.body.mobile,
    email: req.body.email,
    address: req.body.address,
    password: req.body.password,
  });

  try {
    await franchisee.save();
    // redirect to contact page with success message
    res.redirect("/admin?success=added");
  } catch (err) {
    res.redirect("/admin?success=errorinadding");
    console.error(err);
  }
});

app.get("/myBooking", async function (req, res) {
  res.render("mybooking.ejs",{bookings:Franchisee});
});


app.get("/viewFranchisees", async function (req, res) {
  try {
    const franchisees = await Franchisee.find();
    res.render("viewFranchisees", { franchisees: franchisees });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error retrieving franchisees");
  }
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
