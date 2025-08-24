const express = require("express");
const router = express.Router();
const metaOEmbedController = require("../controllers/metaOEmbed.controller");

router.get("/instagram/oembed", metaOEmbedController.getInstagramOEmbed);

module.exports = router;