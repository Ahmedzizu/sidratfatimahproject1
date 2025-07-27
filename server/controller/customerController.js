// F:\ractprojects\New folder (2)\ggg\server\controller\customerController.js
// تم دمج الدوال ذات الصلة بالعملاء هنا
const User = require("../model/user"); // موديل المستخدم
const customerValidation = require("../validation/customerValidation"); // لسهولة التحقق في بعض الحالات
const mongoose = require('mongoose'); // لـ ObjectId إذا لزم الأمر

const customer = {
    // 1. إضافة عميل جديد (postCustomer)
    postCustomer: async (req, res) => {
        try {
            let { name, phone, phone2, address, idNumber, nationality, email, password } = req.body;

            // 1. التحقق من الاسم ثلاثي
            if (!name || name.trim().split(' ').length < 3) {
                return res.status(400).json({ message: 'Full name (at least three parts) is required.', errors: { name: 'Full name (at least three parts) is required.' } });
            }

            // 2. التحقق من الحقول الأساسية المطلوبة
            // تأكد أن `idNumber` حقل مطلوب، والموديل `User` بيسمح بيه
            if (!phone || !idNumber || !nationality || !address) {
                return res.status(400).json({ message: 'Phone, ID Number, Nationality, and Address are required.', errors: { general: 'Phone, ID Number, Nationality, and Address are required.' } });
            }

            // 3. تحديد كلمة المرور النهائية:
            // إذا تم تقديم كلمة مرور من الـ frontend، استخدمها (وتأكد من طولها).
            // إذا لم يتم تقديمها (أو كانت فارغة)، استخدم رقم الهوية ككلمة مرور افتراضية.
            const finalPassword = (password && String(password).length >= 8) ? password : String(idNumber);

            // 4. تحديد البريد الإلكتروني النهائي:
            // إذا تم تقديم بريد إلكتروني من الـ frontend، استخدمه.
            // إذا لم يتم تقديمه (أو كان فارغاً)، استخدم رقم الهاتف كجزء من بريد إلكتروني افتراضي.
            const finalEmail = (email && String(email).trim() !== '') ? email : `${phone}@example.com`;

            // 5. التحقق من تكرار البريد الإلكتروني أو رقم الهاتف
            const existing = await User.findOne({ $or: [{ email: finalEmail }, { phone }] });
            if (existing) {
                const message = existing.email === finalEmail ? 'Email address is already taken.' : 'Phone number is already taken.';
                const errorField = existing.email === finalEmail ? 'email' : 'phone';
                return res.status(409).json({ message, errors: { [errorField]: message } });
            }

            // 6. إنشاء كائن العميل الجديد
            let newCustomerData = {
                name,
                phone,
                phone2: phone2 || null,
                address,
                idNumber,
                nationality,
                email: finalEmail,
                password: finalPassword, // هنمرر الـ finalPassword للموديل
                emailVerification: true, // الأدمن بيضيفه يبقى متفعل تلقائياً
                phoneVerification: true   // الأدمن بيضيفه يبقى متفعل تلقائياً
            };

            let customer = new User(newCustomerData); // استخدم `User` model مباشرة

            await customer.save(); // الـ pre-save hook في موديل User هيشفر الـ password تلقائياً

            res.status(201).json({ message: "Customer added successfully.", customer }); // إرجاع العميل المُضاف

        } catch (error) {
            console.error("Error in postCustomer:", error.message, error);
            if (error.code === 11000) { // Duplicate key error from Mongoose
                if (error.keyPattern.email) return res.status(409).json({ message: "Email address is already taken.", errors: { email: "Email address is already taken." } });
                if (error.keyPattern.phone) return res.status(409).json({ message: "Phone number is already taken.", errors: { phone: "Phone number is already taken." } });
            }
            if (error.name === 'ValidationError') { // Mongoose validation errors
                const errors = {};
                for (let field in error.errors) {
                    errors[field] = error.errors[field].message;
                }
                return res.status(400).json({ message: "Validation failed.", errors });
            }
            res.status(500).json({ message: error.message || "Internal server error." });
        }
    },

    // 2. جلب العملاء (تدعم البحث) - هذا هو `getAllUsersForAdmin` في الـ `usersController` السابق
    getCustomer: async (req, res) => {
        try {
            const { search } = req.query;
            
            let query = {};
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search,  $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { idNumber: { $regex: search, $options: 'i' } },
                    { nationality: { $regex: search, $options: 'i' } },
                ];
            }

            let customers = await User.find(query).select('-password').sort({ createdAt: -1 });
            res.status(200).json(customers);
        } catch (error) {
            console.error("Error in getCustomer:", error.message);
            res.status(500).json({ error: error.message || "Internal server error fetching customers." });
        }
    },

    // 3. تحديث العميل (updateCustomer)
    updateCustomer: async (req, res) => {
        try {
            const customerId = req.params.id; // استقبل الـ ID من الـ URL (لأن المسار هو admin/customer/:id)
            let { name, phone, phone2, address, idNumber, nationality, email } = req.body;

            // بناء كائن التحديث
            const updateFields = { name, phone, phone2, address, idNumber, nationality, email };

            // التحقق من تكرار البريد الإلكتروني أو رقم الهاتف مع مستخدمين آخرين
            if (email) {
                const existingUserWithEmail = await User.findOne({ email });
                if (existingUserWithEmail && existingUserWithEmail._id.toString() !== customerId) {
                    return res.status(409).json({ message: "Email address is already taken by another user.", errors: { email: "Email address is already taken by another user." } });
                }
            }
            if (phone) {
                const existingUserWithPhone = await User.findOne({ phone });
                if (existingUserWithPhone && existingUserWithPhone._id.toString() !== customerId) {
                    return res.status(409).json({ message: "Phone number is already taken by another user.", errors: { phone: "Phone number is already taken by another user." } });
                }
            }
            
            // تحققات إضافية على الحقول المطلوبة (يمكنك إزالتها إذا كانت اختيارية)
            if (!name || name.trim().split(' ').length < 3) {
                return res.status(400).json({ message: 'Full name (at least three parts) is required for update.', errors: { name: 'Full name (at least three parts) is required.' } });
            }
            // تأكد أن `idNumber` حقل مطلوب
            if (!phone || !idNumber || !nationality || !address) {
                return res.status(400).json({ message: 'Phone, ID Number, Nationality, and Address are required for update.', errors: { general: 'Phone, ID Number, Nationality, and Address are required.' } });
            }

            // استخدام `findByIdAndUpdate`
            const updatedDoc = await User.findByIdAndUpdate(
                customerId, // استخدام customerId هنا
                updateFields,
                { new: true, runValidators: true }
            ).select('-password'); // استبعاد كلمة المرور من الرد

            if (!updatedDoc) {
                return res.status(404).json({ message: "Customer not found for update." });
            }
            res.status(200).json({ message: "Customer updated successfully.", customer: updatedDoc });

        } catch (error) {
            console.error("Error in updateCustomer:", error.message, error);
            if (error.code === 11000) { // Duplicate key error from Mongoose
                if (error.keyPattern.email) return res.status(409).json({ message: "Email address is already taken.", errors: { email: "Email address is already taken." } });
                if (error.keyPattern.phone) return res.status(409).json({ message: "Phone number is already taken.", errors: { phone: "Phone number is already taken." } });
            }
            if (error.name === 'ValidationError') { // Mongoose validation errors
                const errors = {};
                for (let field in error.errors) {
                    errors[field] = error.errors[field].message;
                }
                return res.status(400).json({ message: "Validation failed.", errors });
            }
            res.status(500).json({ message: error.message || "Internal server error." });
        }
    },

    // 4. حذف العميل (deleteCustomer)
    deleteCustomer: async (req, res) => {
        try {
            let id = req.params.id; // معرف العميل من الـ URL

            // يمكنك إضافة منطق للتحقق من وجود حجوزات قبل الحذف
            // تأكد أن 'reservations' في موديل User هو Array of ObjectIds
            const customerHasReservations = await User.findById(id).populate('reservations'); 
            if (customerHasReservations && customerHasReservations.reservations && customerHasReservations.reservations.length > 0) {
                 return res.status(400).json({ message: "Cannot delete customer with active reservations. Please delete or reassign reservations first." });
            }

            const deletedDoc = await User.findByIdAndDelete(id); // استخدم User model مباشرة

            if (!deletedDoc) {
                return res.status(404).json({ message: "Customer not found for deletion." });
            }
            res.status(200).json({ message: "Customer deleted successfully." });

        } catch (error) {
            console.error("Error in deleteCustomer:", error.message);
            res.status(500).json({ message: error.message || "Internal server error." });
        }
    },

    // 5. دالة لتأكيد البريد الإلكتروني للعميل بواسطة الأدمن
    adminVerifyEmail: async (req, res) => {
        try {
            const { id } = req.params;
            const customer = await User.findById(id); // استخدم User model مباشرة

            if (!customer) {
                return res.status(404).json({ message: "Customer not found." });
            }

            if (customer.emailVerification) {
                return res.status(400).json({ message: "Email is already verified." });
            }

            customer.emailVerification = true;
            customer.emailVerificationCode = undefined;
            customer.emailVerificationExpires = undefined;
            await customer.save({ validateBeforeSave: false });

            res.status(200).json({ message: "Email verified successfully by admin.", customerEmail: customer.email });
        } catch (error) {
            console.error("Error in adminVerifyEmail (customerController):", error.message);
            res.status(500).json({ message: "Internal server error verifying email." });
        }
    },

    // 6. دالة لإعادة تعيين كلمة مرور العميل إلى رقم هويته بواسطة الأدمن
    adminResetPassword: async (req, res) => { // غيرت اسم الدالة لـ `adminResetPassword` لتعكس طبيعة المسار
        try {
            const { id } = req.params;
            const customer = await User.findById(id); // استخدم User model مباشرة

            if (!customer) {
                return res.status(404).json({ message: "Customer not found." });
            }

            if (!customer.idNumber) {
                return res.status(400).json({ message: "Customer does not have an ID number to reset password to." });
            }

            // تعيين كلمة المرور إلى رقم الهوية وتشفيرها بواسطة الـ pre-save hook في موديل User
            customer.password = String(customer.idNumber); 
            await customer.save(); // الـ pre-save hook سيقوم بتشفير كلمة المرور تلقائياً

            res.status(200).json({ message: "Password reset to ID number successfully." });
        } catch (error) {
            console.error("Error in adminResetPassword (customerController):", error.message);
            res.status(500).json({ message: "Internal server error resetting password." });
        }
    },
};

module.exports = customer;