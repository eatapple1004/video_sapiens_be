const express = require("express");
const router = express.Router();
const libraryController = require("../controllers/library.controller");
const { authenticate }  = require("../middlewares/authMiddleware");


// 완료
router.get("/library", authenticate, libraryController.retrieveCheckedMarkedVideos);

// 진행중
router.get("/library/auto/insert", libraryController.autoInsertBlankFromLibray)

// 진행 예정

module.exports = router;