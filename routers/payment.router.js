const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const paymentController = require("../controllers/payment.controller");
const { authenticate } = require("../middlewares/authMiddleware");


router.get("/username", authenticate, userController.getTokenUsername);

module.exports = router;
