const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  fetchThingSpeakData,
} = require("../controllers/thingspeakController");

router.get("/feeds", authMiddleware, fetchThingSpeakData);

module.exports = router;