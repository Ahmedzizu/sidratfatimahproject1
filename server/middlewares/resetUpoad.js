const multer = require("multer");
const path  = require("path")

const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        if(file){
            cb(null,"./uploads")
        }else{
            cb(null,false)
        }
    },
    filename:(req,file,cb)=>{
        const uniqueSuffix = Date.now()
        cb(null, file.fieldname  + path.extname(file.originalname))
    }
});

const upload = multer({storage});
module.exports = upload;