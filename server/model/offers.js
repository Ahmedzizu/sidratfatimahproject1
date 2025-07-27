const mongoose=require('mongoose')
const Schema=mongoose.Schema

const offerSchema=new Schema({
    entity:{type:String,trim:true,required:true},
    discount:{type:Number,required:true},
    period:{
        startDate:{type:String,trim:true,required:true},
        endDate:{type:String,trim:true,required:true},
    },
    details:{type:String,trim:true},
})
const Offers=mongoose.model('offers',offerSchema)
module.exports=Offers