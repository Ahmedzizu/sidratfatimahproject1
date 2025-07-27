const mongoose=require('mongoose')
const Schema=mongoose.Schema

const incuranceSchema=new Schema({
    clientName:{type:String,trim:true,required:true},
    entity:{
        name:{type:String,trim:true,required:true},
        id:{type:String,trim:true,required:true},
    },
    finance:{
        insurance:{type:Number,required:true},
        damage:{type:Number,default:0},
        remain:{type:Number,default:0}
    },
    reservationId:{type:String,required:true},
    date:{type:String,trim:true,required:true},
    employee:{type:String,trim:true,required:true},
    restored:{type:Boolean,default:false},
})
incuranceSchema.pre('save', function (next) {
    this.finance.remain = this.finance.insurance - this.finance.damage;
    next();
  });
const Insurence=mongoose.model('insurance',incuranceSchema)
module.exports=Insurence