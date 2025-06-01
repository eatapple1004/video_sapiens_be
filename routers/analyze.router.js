const express = require("express");
const router = express.Router();
const analyzeController = require("../controllers/analyze.controller");
const { authenticate } = require("../middlewares/authMiddleware");

router.post("/analyze", authenticate, analyzeController.analyzeVideo);

module.exports = router;
