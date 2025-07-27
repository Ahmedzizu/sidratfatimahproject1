const mongoose=require('mongoose')
const Schema=mongoose.Schema

const resortSchema=new Schema({
    name:{type:String,trim:true,required:true},
    images:[{type:String,required:true}],
    videos:[{type:String,required:true}],
    pool:{type:Number,trim:true,required:true},
    games:{type:Number,trim:true,required:true},
    dayStartHour:{type:String , trim:true , required:true},
    dayEndHour:{type:String , trim:true , required:true},
    nightStartHour:{type:String , trim:true , required:true},
    nightEndHour:{type:String , trim:true , required:true},
    price:{
        morning: {type:Number,trim:true,required:true},
        night: {type:Number,trim:true,required:true},
        wholeDay: {type:Number,trim:true,required:true},
     },
    kitchen:{type:Number,trim:true,required:true},
    area:{type:Number,trim:true,required:true},
    details:[{type:String,trim:true}],
    rate:{type:Array,default:[]},
})
const Resort=mongoose.model('resort',resortSchema)
module.exports=Resort