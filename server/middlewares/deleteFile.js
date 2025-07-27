const Chalet=require("../model/chalet")
const Hall=require("../model/hall")
const Resort=require("../model/resort")
const fs = require('fs');
const path=require('path');
const User = require("../model/user");

 const deleteFile={
  chalet: async (req, res, nxt) => {
        try {
            let chalets = await Chalet.findById({ _id: req.params.id });

            if (!chalets) {
                console.warn(`⚠️ Warning: Chalet with ID ${req.params.id} not found. Cannot delete associated images.`);
                // ✅ أرسل استجابة 404 إذا لم يتم العثور على الشاليه
                return res.status(404).send({ message: `Chalet with ID ${req.params.id} not found.` });
            }

            for (const ele of chalets.images) {
                let fileName;
                try {
                    const parts = ele.split('/');
                    fileName = parts[parts.length - 1]; // ✅ استخراج اسم الملف بشكل صحيح
                } catch (parseError) {
                    console.error("❌ Error parsing image path for chalet:", ele, parseError.message);
                    continue; // تخطى هذا الملف إذا كان المسار خاطئًا
                }

                if (!fileName || fileName === 'undefined') {
                    console.warn(`⚠️ Skipping file deletion: Invalid filename extracted from path for chalet: ${ele}`);
                    continue;
                }

                const filePath = path.join(path.dirname(__dirname), 'uploads', 'chalet', fileName); // ✅ استخدام path.join

                try {
                    await fsPromises.unlink(filePath); // ✅ استخدام fs.promises.unlink للتعامل الأفضل مع الأخطاء
                    console.log(`✅ Chalet file deleted successfully: ${filePath}`);
                } catch (err) {
                    if (err.code === 'ENOENT') {
                        console.warn(`⚠️ Warning: Chalet file not found at path: ${filePath}. It might have been deleted already.`);
                    } else {
                        console.error(`❌ Error deleting chalet file ${filePath}:`, err.message);
                    }
                    // لا توقف العملية حتى لو فشل حذف ملف واحد
                }
            }
            nxt(); // استدعاء nxt() فقط إذا تمت معالجة الصور بنجاح أو عدم وجودها
        } catch (error) {
            console.error("❌ General error in chalet deletion middleware:", error.message);
            return res.status(500).send({ message: "Internal server error during chalet file deletion." });
        }
    },
    hall: async (req, res, nxt) => {
        try {
            let halls = await Hall.findById({ _id: req.params.id });

            if (!halls) {
                console.warn(`⚠️ Warning: Hall with ID ${req.params.id} not found. Cannot delete associated images.`);
                // ✅ إذا كانت القاعة غير موجودة، لا يمكن حذف صورها.
                // يجب إرسال استجابة خطأ إلى الكلاينت وإيقاف سلسلة الـ middleware.
                // على سبيل المثال، 404 Not Found
                return res.status(404).send({ message: `Hall with ID ${req.params.id} not found.` });
            }

            for (const ele of halls.images) {
                let fileName;
                try {
                    const parts = ele.split('/');
                    fileName = parts[parts.length - 1];
                } catch (parseError) {
                    console.error("❌ Error parsing image path:", ele, parseError.message);
                    continue; // تخطى هذا الملف إذا كان المسار خاطئًا
                }

                if (!fileName || fileName === 'undefined') {
                    console.warn(`⚠️ Skipping file deletion: Invalid filename extracted from path: ${ele}`);
                    continue;
                }

                const filePath = path.join(path.dirname(__dirname), 'uploads', 'hall', fileName);

                try {
                    await fsPromises.unlink(filePath);
                    console.log(`✅ File deleted successfully: ${filePath}`);
                } catch (err) {
                    if (err.code === 'ENOENT') {
                        console.warn(`⚠️ Warning: File not found at path: ${filePath}. It might have been deleted already.`);
                    } else {
                        // لا ترمي الخطأ، فقط سجل رسالة تحذير أو خطأ
                        console.error(`❌ Error deleting file ${filePath}:`, err.message);
                    }
                    // لا توقف العملية حتى لو فشل حذف ملف واحد
                }
            }
            nxt(); // استدعاء nxt() فقط إذا تمت معالجة الصور بنجاح أو عدم وجودها
        } catch (error) {
            console.error("❌ General error in hall deletion middleware:", error.message);
            return res.status(500).send({ message: "Internal server error during file deletion." });
        }
    },
    resort:async (req,res,nxt)=>{
        try {
            let resorts=await Resort.findById({_id:req.params.id})
            resorts.images.map((ele)=>{
                let fileName=ele.split('/')[3]
                fs.unlink(path.dirname(__dirname)+'/uploads/resort/' + fileName, (err) => {
                    if (err)throw err
                    console.log("Delete File successfully.");
                });
            })            
            nxt()
        } catch (error) {
            console.log(error.message);
            return  res.status(500).send(error.message)
        }
    },
    user:async (req,res,nxt)=>{
        try {
            if(!req.files) return nxt()
            let user=await User.findById({_id:req.user._id})
                let fileName=user.image.split('/')[3]
                fs.unlink(path.dirname(__dirname)+'/uploads/user/' + fileName, (err) => {
                    if (err) {
                        console.log(err.message);
                    }
                });
            nxt()
        } catch (error) {
            console.log(error.message);
            return  res.status(500).send(error.message)
        }
    },
}
module.exports=deleteFile