const express = require('express');
const router = express.Router();
const cors = require("cors")
const employee=require("../controller/employeeController");
const middleware = require('../middlewares/middleware'); // ✅ الخطوة 1: استدعاء الـ Middleware
router.use(cors({origin:true}))

router.post('/signin',employee.signin)
router.route('/data')
    // .post(middlware.authorization,employee.addEmployee)
    .post(employee.addEmployee)
    .get(employee.getEmployees)

router.delete('/data/:id',employee.deleteEmployee)
router.post('/data/update',employee.updateEmployee)
router.post('/permissions/update',employee.updatePermissions)
router.get('/user/data', middleware.adminAuthorization, employee.getAdminData);


router.route("/finance")
    .get(employee.getAllfinance)
    .post(employee.addFinance)

router.route("/absence")
    .get(employee.getAllAbsence)
    .post(employee.addAbsence)
    
router.delete("/absence/:id",employee.deleteAbsence)
router.post("/absence/update",employee.editAbsence)
//
module.exports = router;