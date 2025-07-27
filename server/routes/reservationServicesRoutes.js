const services=require("../controller/reservationServicesController")
const express = require('express');
const router = express.Router();
const middlware = require('../middlewares/middleware');

router.post("/reservation/service",services.postService)
router.post("/reservation/service/update",services.updateService)
router.route("/reservation/service/:id")
.get(services.getService)
.delete(services.deleteService)

router.get('/reservation/service',services.getAllService)


module.exports = router;