const Drawer = require('../model/Drawer'); // تأكد من صحة المسار
const CashTransaction = require('../model/cashTransaction'); // سوف نحتاجه لإنشاء حركة الإيداع

/**
 * @desc    جلب كل الأدراج المتاحة (الغير نشطة)
 * @route   GET /api/drawers/available
 * @access  Private
 */
exports.getAvailableDrawers = async (req, res) => {
    try {
        // ابحث عن الأدراج التي ليست قيد الاستخدام حالياً
        const availableDrawers = await Drawer.find({ isActive: false });
        res.status(200).json(availableDrawers);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في جلب الأدراج المتاحة', error: error.message });
    }
};

/**
 * @desc    بدء وردية جديدة على درج معين
 * @route   POST /api/drawers/start-shift
 * @access  Private
 */
exports.startShiftOnDrawer = async (req, res) => {
    const { drawerId, employeeId } = req.body;

    try {
        // 1. ابحث عن الدرج وتأكد من أنه متاح
        const drawer = await Drawer.findById(drawerId);
        if (!drawer) {
            return res.status(404).json({ message: 'الدرج غير موجود' });
        }
        if (drawer.isActive) {
            return res.status(400).json({ message: 'هذا الدرج قيد الاستخدام حالياً من قبل موظف آخر' });
        }

        // 2. قم بتحديث حالة الدرج
        drawer.isActive = true;
        drawer.currentEmployee = employeeId;
        
        // إضافة سجل جديد في تاريخ الدرج
        drawer.history.push({
            employee: employeeId,
            shiftStart: new Date(),
        });

        await drawer.save();

        // 3. الخطوة الأهم: إنشاء حركة إيداع تلقائية للموظف بقيمة رصيد الدرج
        // هذا يمثل تسليم العهدة للموظف
        if (drawer.balance > 0) {
            await CashTransaction.create({
                employee: employeeId,
                type: 'إيداع',
                amount: drawer.balance,
                details: `استلام عهدة الدرج: ${drawer.name}`,
                paymentDate: new Date(),
                drawer: drawerId // ربط الحركة بالدرج
            });
        }
        
        res.status(200).json({ message: `تم بدء الوردية على الدرج: ${drawer.name}`, drawer });

    } catch (error) {
        res.status(500).json({ message: 'فشل في بدء الوردية', error: error.message });
    }
};
exports.createDrawer = async (req, res) => {
    try {
        const { name, balance } = req.body;
        const newDrawer = await Drawer.create({ name, balance });
        res.status(201).json(newDrawer);
    } catch (error) {
        res.status(500).json({ message: 'فشل في إنشاء الدرج', error: error.message });
    }
};
// ✅ تأكد من وجود هذه الوظيفة وتصديرها
exports.getAllDrawers = async (req, res) => {
    try {
        const drawers = await Drawer.find({})
            .populate('currentEmployee', 'name')
            .populate('history.employee', 'name');
        res.status(200).json(drawers);
    } catch (error) {
        res.status(500).json({ message: 'فشل في جلب الأدراج', error: error.message });
    }
};
