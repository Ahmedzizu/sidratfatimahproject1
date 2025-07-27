const express = require('express');
const router = express.Router();
const drawerController = require('../controller/drawerController'); // استيراد وحدة التحكم

// ✅ المسار الأول: GET /api/drawers
router.get('/', drawerController.getAllDrawers);

// ✅ المسار الثاني: POST /api/drawers/create
router.post('/create', drawerController.createDrawer);

router.get('/available', drawerController.getAvailableDrawers);

// POST /api/drawers/start-shift
// بدء وردية جديدة على درج معين
router.post('/start-shift', drawerController.startShiftOnDrawer);


module.exports = router;
