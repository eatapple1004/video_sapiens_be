const express = require("express");
const router = express.Router();
const searchController = require("../controllers/search.controller");
//const { authenticate } = require("../middlewares/authMiddleware");


//완료
router.get("/search/integrated", searchController.integreatedSearch);
router.get("/search/tag",        searchController.tagSearch);
router.get("/tag/list",          searchController.getAllTags);

//진행중
router.get("/search", searchController.searchReels);

//진행 예정
//router.get("/search/creator");

module.exports = router;