const url=process.env.DB_URL
const mongoose=require('mongoose')

function databaseConnection(){
    mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
     }).then(()=>{
         console.log("Database connected !!!!");
     }).catch((err)=>{
         console.log(err);
         console.log("Database NOT CONNECTED");
     })
}
module.exports =databaseConnection