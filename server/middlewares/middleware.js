const jwt = require('jsonwebtoken');
const User = require("../model/user");
const Employee = require("../model/employee");
const middleware = {
    generateToken: (id) => {
        return jwt.sign({ user: id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '3d' });
    },


    // ✅ توليد التوكن للأدمن
    generateAdminToken: (id) => {
        return jwt.sign({ user: id, admin: true }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '3d' });
    },

    //hack you
   
        authorization: async (req, res, next) => {
            try {
                // ✅ استخراج التوكن من `Authorization` Header
                let token = req.headers.authorization;
        
                if (!token || !token.startsWith("Bearer ")) {
                    return res.status(401).send({ error: "Unauthorized: No token provided" });
                }
        
                // ✅ إزالة "Bearer " من التوكن للحصول على القيمة الحقيقية
                token = token.split(" ")[1];
        
                // ✅ فك التوكن باستخدام jwt
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                
                if (!decoded.user) {
                    return res.status(401).send({ error: "Unauthorized: Invalid token" });
                }
        
                // ✅ جلب بيانات المستخدم بدون كلمة المرور
                req.user = await User.findById(decoded.user).select("-password");
        
                if (!req.user) {
                    return res.status(401).send({ error: "Unauthorized: User not found" });
                }
        
                next();
            } catch (err) {
                console.log("❌ JWT Error:", err.message);
                res.status(401).send({ error: "Unauthorized: Token verification failed" });
            }
        },

    
    

        // ✅ التحقق من الأدمن
     // ✅ التحقق من الأدمن (النسخة المصححة)
    adminAuthorization: async (req, res, next) => {
        try {
            let token = req.headers.authorization;
    
            if (!token || !token.startsWith("Bearer ")) {
                return res.status(401).send({ error: "Unauthorized: No admin token provided" });
            }
    
            token = token.split(" ")[1];
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            
            if (!decoded.user) {
                return res.status(401).send({ error: "Unauthorized: Invalid admin token" });
            }

            // ✅✅ التعديل الأهم: البحث في جدول Employee
            req.user = await Employee.findById(decoded.user).select("-password");
    
            if (!req.user) {
                return res.status(401).send({ error: "Unauthorized: Admin user not found" });
            }

            next();
        } catch (err) {
            console.log("❌ Admin JWT Error:", err.message);
            res.status(401).send({ error: "Unauthorized: Admin token verification failed" });
        }
    },
        
};

module.exports = middleware;
