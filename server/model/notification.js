const mongoose=require('mongoose')
const Schema=mongoose.Schema

const noifivationSchema=new Schema({
    type:{type:String,trim:true,required:true},
})
const Notification=mongoose.model('notification',noifivationSchema)
module.exports=Notification 