const mongoose= require("mongoose")
const Schema =mongoose.Schema

const AbsenceSchema = new Schema({
    employee :{
        type : mongoose.Types.ObjectId ,
        ref:"employee" ,
        required : true
    },
    date:{
        type:String,
        required:true,
        trim:true
    },
    delay:{
        type:Number,
        trim:true
    },
    type:{
        type:String,
        trim:true,
        required:true
    }
})

const EmployeeAbsence = mongoose.model("EmployeeAbsence",AbsenceSchema)
module.exports=EmployeeAbsence