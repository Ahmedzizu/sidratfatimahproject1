const path = require('path');

const userImgUpload = (req, res, next) => {
  try {
    if(!req.files) return next()
      let file=req.files['file']
      let fileName="user"+Date.now()+path.extname(file.name)
      let uploadpath=path.join(path.dirname(__dirname) +`/uploads/user/${fileName}`)
      file.mv(uploadpath,(err)=>{if(err) return console.log(err.message)})
      req.img=`/user/img/${fileName}`
    next();
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({error:error.message})
  }
};

module.exports = userImgUpload;
