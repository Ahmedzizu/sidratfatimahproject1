const express = require("express")
const router  =  express.Router()
const bankCtl = require("../controller/bankController")
const {adminAuthorization } =require("../middlewares/middleware")

router.route("/")
.post( bankCtl.addBank)

router.delete("/:id" , bankCtl.deleteBank)

router.post("/update"   , bankCtl.updateBankData)
router.get("/all" , bankCtl.getAllBankData)

module.exports = router