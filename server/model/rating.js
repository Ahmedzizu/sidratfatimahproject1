const mongoose=require('mongoose')
const Schema=mongoose.Schema

const ratingSchema=new Schema({
    clientName:{type:String,trim:true,required:true},
    entityName:{type:String,trim:true,required:true},
    rate:{type:String,trim:true,required:true},
    date:{type:String,trim:true,required:true},
    note:{type:String,trim:true,default:"لا يوجد"},
})
const Rating=mongoose.model('rating',ratingSchema)
module.exports=Rating