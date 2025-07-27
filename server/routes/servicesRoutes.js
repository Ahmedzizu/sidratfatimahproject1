const services=require("../controller/servicesController")
const express = require('express');
const router = express.Router();
const middlware = require('../middlewares/middleware');

router.route("/package")
.get(services.getPackages)
.post(services.postPackage)

router.post("/package/update",services.updatePackage)

router.delete("/package/:id",services.deletePackage)

router.route("/services")
.get(services.getServices)
.post(services.postService)
.patch(services.updateService)
router.delete("/services/:id",services.deleteService)
router.post("/services/update",services.updateService)

router.route("/freeServices")
.get(services.getFreeServices)
.post(services.postFreeService)
.patch(services.updateFreeService)
router.delete("/freeServices/:id",services.deleteFreeService)
router.post("/freeServices/update",services.updateFreeService)

module.exports = router;