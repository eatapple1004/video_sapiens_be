const express = require("express");
const router = express.Router();
const searchController = require("../controllers/search.controller");
const { authenticate } = require("../middlewares/authMiddleware");


// <완료>
// 로그인용 검색
router.get("/search/integrated/login", authenticate, searchController.integreatedSearch);
router.get("/search/tag/login",        authenticate, searchController.tagSearch);

// 비로그인용 검색
router.get("/search/integrated", searchController.integreatedSearch);
router.get("/search/tag",        searchController.tagSearch);

router.get("/tag/list",          searchController.getAllTags);

//진행중
router.get("/search",            searchController.searchReels);

//진행 예정
//router.get("/search/creator");

module.exports = router;