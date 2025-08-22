const express = require("express");
const router = express.Router();
const trendingController = require("../controllers/trending.controller");

router.get("/trend/rank", trendingController.getTrendingPosts);

module.exports = router;