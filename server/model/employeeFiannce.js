const mongoose= require("mongoose")
const Schema =mongoose.Schema

const financeSchema = new Schema({
    employee :{
        type : mongoose.Types.ObjectId ,
        ref:"employee" ,
         required : true
    },
    type:{
        type:String ,
        enum:["bonus","discount"],
        required:true,
    },
    amount:{
        type:Number,
        trim:true,
        required:true,
    },
    notes:{
        type:String,
        trim:true
    },
    date:{
        type:String,
        required:true,
        trim:true
    },
    bonusHours:{
        type:Number,
    }
})

const EmployeeFinance = mongoose.model("EmployeeFinance",financeSchema)
module.exports=EmployeeFinance