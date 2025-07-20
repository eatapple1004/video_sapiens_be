const express = require("express");
const router = express.Router();
const searchController = require('../controllers/analyze.controller');
//const { authenticate } = require("../middlewares/authMiddleware");


//진행중
router.get("/search/integrated", searchController.integreatedsearch);

//진행 예정
router.get("/search/tag");
router.get("/search/creator");

module.exports = router;