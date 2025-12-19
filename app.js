const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const registerRoutes = require("./app/routes/indexRoute");
const { sequelize, initDatabase } = require("./app/config/db");
const useragent = require("express-useragent");
const {consumeToasts} =require ('./app/utils/sessionToast')
const sessionMiddleware = require('./app/middlewares/sessionMiddleware');

const app = express();
const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(useragent.express());

// Setup Ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "app/views"));
app.use(expressLayouts);

// Static files
app.use(express.static(path.join(__dirname, "app", "public")));
// Set messages empty for EJS 
app.use((req, res, next) => {
  res.locals.messages = [];
  next();
});


//Notification
app.use(sessionMiddleware);
app.use((req, res, next) => {
  res.locals.toasts = consumeToasts(req); 
  next();
});

// Change layouts
app.use((req, res, next) => {
  if (req.path.startsWith("/api/auth")) {
    app.set("layout", "layouts/auth");
  } else {
    app.set("layout", "layouts/management"); 
  }
  next();
});


// Database
(async () => {
  try {
    console.log("Checking database...");
    await initDatabase();
    console.log("Connecting to MySQL...");
    await sequelize.authenticate();
    console.log("Successfully connected to the database.");
  } catch (err) {
    console.error(`Error Database: `, err.message);
  }
})();

// Routes
registerRoutes(app);

// Server
const PORT = process.env.PORT;
app.listen(PORT, () =>
  console.log(`>>>>>Server is running at http://localhost:${PORT}<<<<<`)
);