// F:\ractprojects\New folder (2)\ggg\server\controller\usersController.js
const bcrypt = require('bcrypt');
const User = require("../model/user");
const validateSignupData = require("../validation/signupValidation");
const middleware = require("../middlewares/middleware");
const otpService = require('../services/otp'); // هذا لـ OTP الهاتف والبريد الإلكتروني الآن
const sendEmail = require('../services/emailService'); 
const mongoose = require('mongoose');
const Reservation = require('../model/reservation');
const db = mongoose.connection;
const OtpCollection = db.collection('otpCollection'); // لا يزال يستخدم للـ OTP الخاص بالهاتف
const crypto = require('crypto'); // لا يزال مطلوب لتوكن إعادة تعيين كلمة المرور

const users = {


    // ✅✅✅ الدوال الجديدة لإدارة العملاء من طرف الأدمن ✅✅✅

    // 1. جلب جميع العملاء للأدمن (مع دعم البحث)
    getAllUsersForAdmin: async (req, res) => {
        try {
            // استخراج معايير البحث من query parameters
            const { search } = req.query; // على سبيل المثال: /admin/users?search=احمد
            
            let query = {};
            if (search) {
                // بحث بالاسم أو الهاتف أو البريد الإلكتروني أو الجنسية
                query.$or = [
                    { name: { $regex: search, $options: 'i' } }, // بحث غير حساس لحالة الأحرف
                    { phone: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { nationality: { $regex: search, $options: 'i' } },
                ];
            }

            // جلب العملاء مع استبعاد كلمة المرور، وترتيبهم حسب الأحدث
            const customers = await User.find(query).select('-password').sort({ createdAt: -1 });

            res.status(200).json(customers);
        } catch (error) {
            console.error("Error in getAllUsersForAdmin:", error.message);
            res.status(500).json({ message: "Internal server error fetching customers." });
        }
    },

    // 2. تحديث بيانات عميل معين بواسطة الأدمن
    adminUpdateUser: async (req, res, next) => {
        try {
            const { id } = req.params; // معرف العميل من الـ URL (مثلاً /admin/users/:id)
            let { name, email, phone, phone2, address, idNumber, nationality } = req.body;

            // بناء كائن التحديث
            const updateFields = { name, email, phone, phone2, address, idNumber, nationality };

            // التحقق من تكرار البريد الإلكتروني أو رقم الهاتف مع مستخدمين آخرين
            // (نفس المنطق المستخدم في updateUserData)
            if (email) {
                const existingUserWithEmail = await User.findOne({ email });
                if (existingUserWithEmail && existingUserWithEmail._id.toString() !== id) {
                    return res.status(409).json({ message: "Email address is already taken by another user." });
                }
            }
            if (phone) {
                const existingUserWithPhone = await User.findOne({ phone });
                if (existingUserWithPhone && existingUserWithPhone._id.toString() !== id) {
                    return res.status(409).json({ message: "Phone number is already taken by another user." });
                }
            }

            // التحقق من صحة البيانات الأساسية (يمكنك استخدام customerValidation هنا إذا أردت)
            // بما أن `name`, `phone`, `idNumber`, `nationality` هي مطلوبة في الموديل،
            // تأكد أنها لا تُرسل فارغة من الـ frontend.

            const updatedUser = await User.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true }).select('-password');

            if (!updatedUser) {
                return res.status(404).json({ message: "Customer not found." });
            }

            res.status(200).json({ message: "Customer updated successfully.", user: updatedUser });

        } catch (error) {
            console.error("Error in adminUpdateUser:", error.message);
            if (error.name === 'ValidationError') {
                const errors = Object.keys(error.errors).map(key => error.errors[key].message);
                return res.status(400).json({ message: errors.join(', ') });
            }
            if (error.code === 11000) { // Duplicate key error
                if (error.keyPattern.email) return res.status(409).json({ message: "Email address is already taken." });
                if (error.keyPattern.phone) return res.status(409).json({ message: "Phone number is already taken." });
            }
            res.status(500).json({ message: error.message || "Internal server error updating customer data." });
        }
    },

    // 3. حذف عميل بواسطة الأدمن
    adminDeleteUser: async (req, res, next) => {
        try {
            const { id } = req.params; // معرف العميل من الـ URL

            // يمكنك إضافة منطق للتعامل مع حجوزات العميل (مثل إلغاءها أو عدم السماح بالحذف إذا كان لديه حجوزات مؤكدة)
            // مثال: const userReservations = await Reservation.find({ 'client.id': id });
            // إذا كنت لا تريد حذفه، يمكنك تغيير حالته (مثل status: 'deactivated') بدلاً من الحذف الفعلي.

            const deletedUser = await User.findByIdAndDelete(id);

            if (!deletedUser) {
                return res.status(404).json({ message: "Customer not found." });
            }

            res.status(200).json({ message: "Customer deleted successfully." });

        } catch (error) {
            console.error("Error in adminDeleteUser:", error.message);
            res.status(500).json({ message: error.message || "Internal server error deleting customer." });
        }
    },

    // 4. دالة لتغيير حالة emailVerification لعميل
    adminVerifyEmail: async (req, res, next) => {
        try {
            const { id } = req.params; // معرف العميل
            const user = await User.findById(id);

            if (!user) {
                return res.status(404).json({ message: "Customer not found." });
            }

            user.emailVerification = true; // تعيين التحقق إلى صحيح
            user.emailVerificationCode = undefined; // مسح الكود
            user.emailVerificationExpires = undefined; // مسح تاريخ الصلاحية
            await user.save({ validateBeforeSave: false }); // لا تتحقق من الحقول الأخرى عند الحفظ السريع

            res.status(200).json({ message: "Email verified successfully by admin.", user: user.email });
        } catch (error) {
            console.error("Error in adminVerifyEmail:", error.message);
            res.status(500).json({ message: "Internal server error verifying email." });
        }
    },

    // 5. دالة لإعادة تعيين كلمة مرور العميل إلى رقم هويته
    adminResetPasswordToIdNumber: async (req, res, next) => {
        try {
            const { id } = req.params; // معرف العميل
            const user = await User.findById(id);

            if (!user) {
                return res.status(404).json({ message: "Customer not found." });
            }

            if (!user.idNumber) {
                return res.status(400).json({ message: "Customer does not have an ID number to reset password to." });
            }

            // تعيين كلمة المرور إلى رقم الهوية وتشفيرها بواسطة الـ pre-save hook
            user.password = String(user.idNumber); 
            await user.save(); // الـ pre-save hook سيعمل على تشفيرها تلقائياً

            // يمكنك إرسال رسالة واتساب للعميل لإبلاغه بكلمة المرور الجديدة (آخر 3 أرقام مثلاً)
            // سيتم التعامل مع إرسال الرسالة من الواجهة الأمامية.

            res.status(200).json({ message: "Password reset to ID number successfully." });
        } catch (error) {
            console.error("Error in adminResetPasswordToIdNumber:", error.message);
            res.status(500).json({ message: "Internal server error resetting password." });
        }
    },

    
    signup: async (req, res) => {
        try {
            let { name, password, phone, email } = req.body;

            let { errors, isValid } = validateSignupData(name, email, password, phone);
            if (!isValid) {
                return res.status(400).json(errors);
            }

            const uniqueEmail = await User.findOne({ email });
            if (uniqueEmail) {
                return res.status(409).json({ email: "Email address is already taken" });
            }

            const uniquePhone = await User.findOne({ phone });
            if (uniquePhone) {
                return res.status(409).json({ phone: "Phone number is already taken" });
            }

            const newUser = new User({ name, email, password, phone });
            
            // ✨ توليد كود تحقق إيميل من 6 أرقام باستخدام otpService.generateOtp()
            const emailVerificationCode = otpService.generateOtp(); 
            newUser.emailVerificationCode = String(emailVerificationCode); // حفظ الكود كنص
            newUser.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // صلاحية 10 دقائق
            
            await newUser.save(); // حفظ المستخدم مع كود التحقق الجديد

            // ✨ تعديل هنا: إضافة email إلى رابط التحقق
            const verificationUrl = `${process.env.FRONTEND_URL}/user/verify-email?id=${newUser._id}&code=${emailVerificationCode}&email=${encodeURIComponent(newUser.email)}`;

            const emailOptions = {
                email: newUser.email,
                subject: 'Verify Your Email Address for Your Account',
                html: `
                    <p>Hello ${newUser.name},</p>
                    <p>Thank you for registering. Please verify your email address to activate your account by clicking on the link below:</p>
                    <a href="${verificationUrl}" style="background-color: #D4AF37; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
                    <p>Or use this code: <strong>${emailVerificationCode}</strong></p>
                    <p>This code is valid for 10 minutes.</p>
                    <p>If you did not register, please ignore this email.</p>
                `,
            };
            await sendEmail(emailOptions);

            res.status(201).json({
                message: "User registered successfully! Please check your email to verify your account.",
                userId: newUser._id, 
                email: newUser.email,
                emailVerification: newUser.emailVerification 
            });

        } catch (error) {
            console.error("Error during signup:", error.message, error.code);
            if (error.code === 11000) {
                if (error.keyPattern.email) {
                    return res.status(409).json({ email: "Email address is already taken" });
                }
                if (error.keyPattern.phone) {
                    return res.status(409).json({ phone: "Phone number is already taken" });
                }
            }
            res.status(500).json({ message: "Internal server error during signup" });
        }
    },

    signin: async (req, res) => {
        try {
            let { email, password } = req.body;

            let user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ email: "Email address not found" });
            }

            // التحقق من الإيميل قبل السماح بتسجيل الدخول
            if (!user.emailVerification) {
                return res.status(403).json({ message: "Please verify your email address before logging in." });
            }

            if (!await user.comparePassword(password)) {
                return res.status(403).json({ password: "Invalid Password" });
            }

            const token = await middleware.generateToken(user._id);

            res.status(200).json({
                message: "Login successful",
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    idNumber: user.idNumber || '',
                    nationality: user.nationality || '',
                    address: user.address || '',
                    emailVerification: user.emailVerification 
                }
            });

        } catch (error) {
            console.error("Error during signin:", error.message);
            res.status(500).json({ message: "Internal server error during signin" });
        }
    },

    sendOtb: async (req, res) => {
        try {
            // تأكد أن req.user.phone موجود ومفعل في الـ middleware
            if (!req.user || !req.user.phone) {
                return res.status(400).json({ message: "User phone not available." });
            }

            const otpCode = otpService.generateOtp(); // هذا يولد كود رقمي
            const timestamp = new Date();
            console.log("Generated Phone OTP:", otpCode);

            // حفظ كود الهاتف في OtpCollection
            const result = await OtpCollection.updateOne(
                { userId: new mongoose.Types.ObjectId(req.user._id), type: 'phoneVerification' }, 
                { $set: { otpCode: otpCode, createdAt: timestamp, expiresAt: new Date(timestamp.getTime() + 5 * 60 * 1000) } },
                { upsert: true }
            );
            console.log("OTP update result (Phone):", result.modifiedCount, result.upsertedId);

            otpService.sendOtp(req.user.phone, otpCode);
            res.status(200).json({ message: "OTP sent successfully to phone" }); 

        } catch (error) {
            console.error("Error sending Phone OTP:", error.message);
            res.status(500).json({ message: "Internal server error sending Phone OTP" });
        }
    },

    phoneVirefy: async (req, res) => {
        try {
            let { otb } = req.body; 
            let otpDoc = await OtpCollection.findOne({ userId: new mongoose.Types.ObjectId(req.user._id), type: 'phoneVerification' });
            if (!otpDoc) {
                return res.status(404).json({ message: "OTP not found for this user." });
            }

            const FIVE_MINUTES = 5 * 60 * 1000;
            if (new Date() - otpDoc.createdAt > FIVE_MINUTES) { 
                await OtpCollection.deleteOne({ _id: otpDoc._id }); 
                return res.status(400).json({ message: "OTP has expired." });
            }

            // تأكد من أن otb المدخل هو من نوع String ليتم مقارنته بشكل صحيح
            if (String(otb) === String(otpDoc.otpCode)) { // استخدم String() لضمان المقارنة الصحيحة
                const updatedUser = await User.findByIdAndUpdate(
                    req.user._id,
                    { phoneVerification: true },
                    { new: true }
                );
                await OtpCollection.deleteOne({ _id: otpDoc._id }); 
                res.status(200).json({ message: "Phone verified successfully!" });
            } else {
                res.status(400).json({ message: "Invalid OTP" });
            }
        } catch (error) {
            console.error("Error during phone verification:", error.message);
            res.status(500).json({ message: "Internal server error during phone verification" });
        }
    },

    verifyEmail: async (req, res) => {
        try {
            const { id, code } = req.body; 

            console.log("Verify Email Request - Received ID:", id, "Code:", code); 

            const user = await User.findOne({
                _id: new mongoose.Types.ObjectId(id), 
                emailVerificationCode: code // البحث عن الكود المخزن في موديل المستخدم
            });

            if (!user) {
                console.log("Verify Email Error: User or code not found for ID:", id, "Code:", code); 
                return res.status(400).json({ message: "Invalid verification code or user ID." });
            }

            console.log("Verify Email - Found User:", user.email); 

            const currentTime = new Date();
            if (currentTime > user.emailVerificationExpires) { 
                console.log("Verify Email Error: Code expired. Current Time:", currentTime, "Expires At:", user.emailVerificationExpires); 
                user.emailVerificationCode = undefined;
                user.emailVerificationExpires = undefined;
                await user.save({ validateBeforeSave: false }); 
                return res.status(400).json({ message: "Verification code has expired." });
            }
            
            if (user.emailVerification) {
                return res.status(400).json({ message: "Email is already verified." });
            }

            user.emailVerification = true;
            user.emailVerificationCode = undefined;
            user.emailVerificationExpires = undefined;
            await user.save({ validateBeforeSave: false }); 

            console.log("Email verified successfully for user:", user.email); 
            res.status(200).json({ message: "Email verified successfully!" });

        } catch (error) {
            console.error("Error during email verification:", error.message);
            res.status(500).json({ message: "Internal server error during email verification." });
        }
    },

    resendEmailVerification: async (req, res) => {
        try {
            const { email } = req.body;
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(404).json({ message: "User with that email does not exist." });
            }
            if (user.emailVerification) {
                return res.status(400).json({ message: "Email is already verified." });
            }

            // ✨ توليد كود تحقق جديد من 6 أرقام وحفظه مباشرة في موديل المستخدم
            const emailVerificationCode = otpService.generateOtp(); 
            user.emailVerificationCode = String(emailVerificationCode);
            user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; 
            await user.save({ validateBeforeSave: false }); 

            // ✨ تعديل هنا: إضافة email إلى رابط التحقق
            const verificationUrl = `${process.env.FRONTEND_URL}/user/verify-email?id=${user._id}&code=${emailVerificationCode}&email=${encodeURIComponent(user.email)}`;

            const emailOptions = {
                email: user.email,
                subject: 'Verify Your Email Address',
                html: `
                    <p>Hello ${user.name},</p>
                    <p>You requested to resend your email verification code. Please verify your email address to activate your account by clicking on the link below:</p>
                    <a href="${verificationUrl}" style="background-color: #D4AF37; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
                    <p>Or use this code: <strong>${emailVerificationCode}</strong></p>
                    <p>This code is valid for 10 minutes.</p>
                    <p>If you did not request this, please ignore this email.</p>
                `,
            };
            await sendEmail(emailOptions);

            res.status(200).json({ message: "Verification email resent successfully." });

        } catch (error) {
            console.error("Error resending email verification:", error.message);
            res.status(500).json({ message: "Error resending verification email." });
        }
    },
    
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(404).json({ message: "User with that email does not exist." });
            }

            const resetToken = user.generateToken('resetPassword'); // استخدام الدالة العامة
            await user.save({ validateBeforeSave: false }); 

            const resetUrl = `${process.env.FRONTEND_URL}/user/reset-password/${resetToken}`;

            const message = `
                <p>You are receiving this because you (or someone else) have requested the reset of a password for your account.</p>
                <p>Please click on the following link, or paste this into your browser to complete the process:</p>
                <p><a href="${resetUrl}">${resetUrl}</a></p>
                <p>This link is valid for 10 minutes.</p>
                <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
            `;

            const emailOptions = {
                email: user.email,
                subject: 'Password Reset Request',
                html: message,
            };

            try {
                await sendEmail(emailOptions);
                res.status(200).json({ message: 'Password reset email sent successfully.' });
            } catch (error) {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
                await user.save({ validateBeforeSave: false });
                console.error("Error sending reset password email:", error.message);
                return res.status(500).json({ message: 'Error sending password reset email.' });
            }

        } catch (error) {
            console.error("Error in forgotPassword:", error.message);
            res.status(500).json({ message: "Internal server error during password reset request." });
        }
    },

    resetPassword: async (req, res) => {
        try {
            const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

            const user = await User.findOne({
                resetPasswordToken,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({ message: "Password reset token is invalid or has expired." });
            }

            user.password = req.body.newPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            await user.save(); 

            res.status(200).json({ message: "Password has been reset successfully." });

        } catch (error) {
            console.error("Error in resetPassword:", error.message);
            res.status(500).json({ message: "Internal server error during password reset." });
        }
    },

    getUser: async (req, res) => {
        try {
            const user = await User.findById(req.user._id).select('-password');
            if (!user) {
                return res.status(404).json({ message: "User not found." });
            }
            res.status(200).json(user);
        } catch (error) {
            console.error("Error in getUser:", error.message);
            res.status(500).json({ message: "Internal server error fetching user data" });
        }
    },

    getUserReservations: async (req, res) => {
        try {
            let { _id } = req.user;

            let reservations = await Reservation.find({ 'client.id': _id })
                .select("client entity cost period status contractNumber date payment completed image type")
                .lean();

            let formattedReservations = reservations.map(reservation => {
                return {
                    ...reservation,
                    image: reservation.image || "/default/no-image.jpg"
                };
            });

            res.status(200).json(formattedReservations);
        } catch (error) {
            console.error("Error in getUserReservations:", error.message);
            res.status(500).json({ message: "Internal server error fetching user reservations" });
        }
    },

    cancelUserReservation: async (req, res, next) => {
        try {
            let { id } = req.params;
            const updatedReservation = await Reservation.findByIdAndUpdate(id, { cancelRequest: true }, { new: true });

            if (!updatedReservation) {
                return res.status(404).json({ message: "Reservation not found." });
            }

            res.status(200).json({ message: "Cancellation request sent.", reservation: updatedReservation });

        } catch (error) {
            console.error("Error during cancelUserReservation:", error.message);
            res.status(500).json({ message: "Internal server error during cancellation request" });
        }
    },

    updateUserData: async (req, res) => {
        try {
            let userId = req.user._id;
            let { name, email, phone, idNumber, nationality, address } = req.body;

            const updateFields = { name, email, phone, idNumber, nationality, address };

            if (email && email !== req.user.email) {
                const existingUser = await User.findOne({ email });
                if (existingUser && existingUser._id.toString() !== userId.toString()) {
                    return res.status(409).json({ message: "Email address is already taken by another user." });
                }
            }
            if (phone && phone !== req.user.phone) {
                const existingUser = await User.findOne({ phone });
                if (existingUser && existingUser._id.toString() !== userId.toString()) {
                    return res.status(409).json({ message: "Phone number is already taken by another user." });
                }
            }

            const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true, runValidators: true }).select('-password');

            if (!updatedUser) {
                return res.status(404).json({ message: "User not found." });
            }

            res.status(200).json({ message: "Profile updated successfully", user: updatedUser });

        } catch (error) {
            console.error("Error during updateUserData:", error.message);
            if (error.name === 'ValidationError') {
                const errors = Object.keys(error.errors).map(key => error.errors[key].message);
                return res.status(400).json({ message: errors.join(', ') });
            }
            if (error.code === 11000) { 
                if (error.keyPattern.email) return res.status(409).json({ message: "Email address is already taken" });
                if (error.keyPattern.phone) return res.status(409).json({ message: "Phone number is already taken" });
            }
            res.status(500).json({ message: error.message || "Internal server error during user data update" });
        }
    },

    updateUserPassword: async (req, res) => {
        try {
            let { newPass, oldPass } = req.body;
            let user = await User.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ message: "User not found." });
            }

            if (!await user.comparePassword(oldPass)) {
                return res.status(403).json({ message: "كلمة السر القديمة خاطئة" });
            }

            user.password = newPass;
            await user.save();

            res.status(200).json({ message: "Password updated successfully." });
        } catch (error) {
            console.error("Error during updateUserPassword:", error.message);
            if (error.name === 'ValidationError') {
                const errors = Object.keys(error.errors).map(key => error.errors[key].message);
                return res.status(400).json({ message: errors.join(', ') });
            }
            res.status(500).json({ message: error.message || "Internal server error during password update" });
        }
    }
};

exports.adminCreateUser = async (req, res) => {
    try {
        const { name, email, password, phone, address, idNumber, nationality } = req.body;

        // التحقق من الاسم ثلاثي
        if (!name || name.trim().split(' ').length < 3) {
            return res.status(400).json({ message: 'Full name (at least three parts) is required.' });
        }

        // تحققات أساسية قبل إنشاء المستخدم
        if (!phone || !idNumber || !nationality || !address) {
            return res.status(400).json({ message: 'Phone, ID Number, Nationality, and Address are required.' });
        }

        // 1. تحديد كلمة المرور النهائية:
        // إذا تم تقديم كلمة مرور من الـ frontend، استخدمها.
        // إذا لم يتم تقديمها (أو كانت فارغة)، استخدم رقم الهوية ككلمة مرور افتراضية.
        const finalPassword = password && password.length >= 8 ? password : String(idNumber);

        // 2. تحديد البريد الإلكتروني النهائي:
        // إذا تم تقديم بريد إلكتروني من الـ frontend، استخدمه.
        // إذا لم يتم تقديمه (أو كان فارغاً)، استخدم رقم الهاتف كجزء من بريد إلكتروني افتراضي.
        const finalEmail = email && email.trim() !== '' ? email : `${phone}@example.com`;

        // 3. التحقق من وجود مستخدم بنفس البريد أو الهاتف (باستخدام القيم النهائية)
        const existing = await User.findOne({ $or: [{ email: finalEmail }, { phone }] });
        if (existing) {
            const message = existing.email === finalEmail ? 'Email already exists.' : 'Phone number already exists.';
            return res.status(409).json({ message });
        }

        const user = new User({
            name,
            email: finalEmail,
            password: finalPassword, // <--- هنا هنمرر finalPassword (هتكون رقم الهوية لو مفيش باسورد)
            phone,
            address,
            idNumber,
            nationality,
            emailVerification: true, // تحقق تلقائي
            phoneVerification: true // تحقق تلقائي
        });

        await user.save(); // الـ pre-save hook هيشفر finalPassword تلقائياً

        res.status(201).json({ message: 'User created successfully', user });
    } catch (err) {
        console.error("Error in adminCreateUser:", err.message);
        if (err.code === 11000) {
            if (err.keyPattern.email) return res.status(409).json({ message: "Email address is already taken." });
            if (err.keyPattern.phone) return res.status(409).json({ message: "Phone number is already taken." });
        }
        // لو الخطأ بتاع required password لسه بيظهر، ممكن يكون minlength مش متبصيه
        if (err.name === 'ValidationError' && err.errors.password && err.errors.password.kind === 'minlength') {
             return res.status(400).json({ message: "Password must be at least 8 characters long." });
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


// ✅✅✅ قم بتغيير هذا السطر ليتضمن كل الدوال المصدرة ✅✅✅
module.exports = { ...users, adminCreateUser: exports.adminCreateUser };