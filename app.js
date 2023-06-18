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

// Franchisee schema and model
const franchiseeSchema = new mongoose.Schema({
  profilePhoto: { data: Buffer, contentType: String },
  contactPerson: { type: String, required: true },
  contactNo: { type: String, required: true },
  branchName: { type: String, required: true },
  email: { type: String, required: true,unique: true },
  password: { type: String, required: true },
  state: { type: String, required: true },
  district: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  address: { type: String, required: true },

  bookings: [franchiseeBookingSchema]
});

const Franchisee = mongoose.model("Franchisee", franchiseeSchema);


// Shipment/Tracking ID Schema
const shipmentSchema = new mongoose.Schema({
  trackingNumber: { type: String, required: true, unique: true },
  
  senderName: { type: String, required: true },
  senderCity: { type: String, required: true },
  senderPincode: { type: String, required: true },
  senderAddress: { type: String},
  senderContactNo: { type: String, required: true },
  senderEmail: { type: String},
  
  ReceiverName: { type: String, required: true },
  ReceiverCity: { type: String, required: true },
  ReceiverPincode: { type: String, required: true },
  ReceiverAddress: { type: String, required: true },
  ReceiverContactNo: { type: String, required: true },
  ReceiverEmail: { type: String},
  
  date: { type: Date },

  deliveryStatus :{ type: String, required: true },
  bookedBy : { type: String, required: true }
});

const Shipment = mongoose.model("Shipment", shipmentSchema);

const franchiseeBookingSchema = new mongoose.Schema({
  date: { type: Date },
  trackingNumber: { type: String, required: true, unique: true },  
  senderName: { type: String, required: true },
  senderContactNo: { type: String, required: true },
  ReceiverPincode: { type: String, required: true },
});

const franchiseeBooking = mongoose.model("franchiseeBooking", franchiseeBookingSchema);

app.get("/", function (req, res) {
  res.render("home");
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
    trackingID: req.body.trackingNumber,
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

app.get("/myBooking", async function (req, res) {
  console.log(req.query.id);
  res.render("mybooking.ejs",{bookings:Franchisee});
});


app.post("/Track", async function (req, res) {
    const trackingNumber = req.body.trackingNumber;

    console.log(trackingNumber);
    try {
      const found = await bookedConsignement.findOne({
      trackingID: trackingNumber
    });
      if (!found) {
        res.redirect("/Track?success=invalid");
      } else {
        res.redirect("/Tracking?id=" + found._id);
      }
    } catch (err) {
      console.error("Error finding tracking number in database:", err);
      // return res.status(500).send("Error finding user or comparing password");
    }
});

app.get("/Tracking", async function (req, res) {
  const trackingDBId = req.query.id;
  try {
    const found = await bookedConsignement.findById(trackingDBId);
    if (!found) {
      res.redirect("/Track");
    } else {
      res.render("Tracking", { track: found });
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



// --------------------Admin Page Downside --------------------------------------------

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
    profilePhoto: {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    },
    contactPerson: req.body.contactPerson,
    contactNo: req.body.contactNo,
    branchName: req.body.branchName,
    email: req.body.email,
    password: req.body.password,
    state: req.body.state,
    district: req.body.district,
    city: req.body.city,
    pincode: req.body.pincode,
    address: req.body.address
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

app.get("/viewFranchisees", async function (req, res) {
  try {
    const franchisees = await Franchisee.find();
    res.render("viewFranchisees", { franchisees: franchisees });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error retrieving franchisees");
  }
});

// --------------------Admin Page Upwards --------------------------------------------


// --------------------------- Network Page Downward --------------------------

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
  }
});

// --------------------------- Network Page Upward --------------------------

app.get("/Service", function (req, res) {
  res.render("service");
});

app.get("/Solution", function (req, res) {
  res.render("solution");
});

app.get("/About", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
