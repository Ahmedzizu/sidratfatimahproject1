const path = require('path');

const resortFileUpload = (req, res, next) => {
  try{
    if (req.files && req.files['file[]']){
      let file=req.files['file[]']
      if (!Array.isArray(file))file = [file];
      if(file.length==0) return res.status(403).send({error:"No files sent"})
      let fileNames= file.map((ele,ind)=>{ 
      let fileName=ind+"resort"+Date.now()+path.extname(ele.name)
      let uploadpath=path.join(path.dirname(__dirname) +`/uploads/resort/${fileName}`)
      ele.mv(uploadpath,(err)=>{
        if(err) return console.log(err.message)})
        return `/resort/img/${fileName}`
      })
      req.imgNames=fileNames
    }
    
    if (req.files && req.files['videos[]']){
        let file=req.files['videos[]']
        if (!Array.isArray(file)) file = [file];

        if(file.length==0) return res.status(403).send({error:"No files sent"})

        let fileNames= file.map((ele,ind)=>{ 
        let fileName=ind+"resort-video"+Date.now()+path.extname(ele.name)
        let uploadpath=path.join(path.dirname(__dirname) +`/uploads/resort/${fileName}`)
        ele.mv(uploadpath,(err)=>{
          if(err) return console.log(err.message)})
          return `/resort/video/${fileName}`
        })
        req.videoNames=fileNames
    }
  next();
} catch (error) {
console.log(error.message);
return res.status(500).send({error:error.message})
}
}

module.exports = resortFileUpload;
