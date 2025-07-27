const mongoose=require('mongoose')
const Schema=mongoose.Schema

const packageSchema=new Schema({
    package:{type:String,trim:true,required:true},
    price:{type:Number,trim:true,required:true},
})
const serviceSchema=new Schema({
    service:{type:String,trim:true,required:true},
})
const freeServiceSchema=new Schema({
    service:{type:String,trim:true,required:true},
})
const Package=mongoose.model('packages',packageSchema)
const Services=mongoose.model('services',serviceSchema)
const FreeServices=mongoose.model('freeServices',freeServiceSchema)
module.exports={Package,Services,FreeServices}