const express = require("express");
const router = express.Router();
const controller = require("../controllers/uploadController");

router.post("/", controller.uploadFile);
router.get("/template", controller.downloadTemplate);

module.exports = router;