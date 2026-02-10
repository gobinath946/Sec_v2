const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const axios = require('axios');

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

const server = http.createServer(app);
const cronJobs = require("./src/Libs/cron")
const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger-output.json')
const config = require("./config/environment/dbDependencies");
const port = process.env.PORT || config.ServerPort;


const otp = require("./src/routes/otp")
const message = require("./src/routes/message")
const user = require("./src/routes/user")
const customer = require("./src/routes/customer")
const dashboard = require("./src/routes/dashboard")
const log = require("./src/routes/log")
const proxyRoutes = require("./src/routes/proxy")

const authRoutes = require('./src/finance/routes/auth');
const gapRoutes = require('./src/finance/routes/gap');
const mbiRoutes = require('./src/finance/routes/mbi');
const ppiRoutes = require('./src/finance/routes/ppi');
const hubspotRoutes = require('./src/finance/routes/hubspot');
const sendEmail = require('./src/finance/routes/email');



mongoose
  .connect(config.dbURL)
  .then(() => { console.log("Connected to MongoDB"); })
  .catch((err) => { console.error("MongoDB connection error:", err); });


//MiddleWares
app.use(otp);
app.use(message);
app.use(user);
app.use(customer);
app.use(dashboard);
app.use(log);
app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))


// File upload configuration (in-memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Make upload available to routes
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gap', gapRoutes);
app.use('/api/mbi', mbiRoutes);
app.use('/api/ppi', ppiRoutes);
app.use('/api/hubspot', hubspotRoutes);
app.use('/api/email',sendEmail );
app.use('/', proxyRoutes);


app.get('/api/proxy/image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    try {
      new URL(imageUrl);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer'
    });
    const contentType = response.headers['content-type'];

    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    });
    res.send(response.data);
  } catch (error) {
    console.error('Image proxy error:', error.message);
    if (error.response) {
      return res.status(error.response.status).json({ 
        error: `Error from image server: ${error.response.status}` 
      });
    }
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});



app.use("/api/v1/health", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB connection not established");
    }
    await mongoose.connection.db.command({ ping: 1 });
    res.json({
      status: "Database is healthy",
      health: "API Server is up & running",
    });
  } catch (error) {
    console.error("Database is not healthy:", error);
    res.status(500).json({
      status: "Database is not healthy",
      error: error.message,
    });
  }
});




server.listen(port, () => {
  console.log("CONNECT Server is running on http://localhost: " + port);
});



