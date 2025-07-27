const mongoose=require('mongoose')
const Schema=mongoose.Schema
const bcrypt=require('bcrypt');

  const adminSchema = new Schema({
    name: { type: String, trim: true, required: true },
    position: { type: String, trim: true, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    nationalId: { type: Number, required: true ,unique:true},
    phone: { type: String, required: true },
    salary: { type: Number, required: true },
    finance:[{type: mongoose.Types.ObjectId , ref:"EmployeeFinance" }],
   permissions: {
    expenses: { type: Boolean, default: false },
    insurance: { type: Boolean, default: false },
    bankTransfer: { type: Boolean, default: false },
    withdraw: { type: Boolean, default: false },
    onlinePayment: { type: Boolean, default: false },
    client: { type: Boolean, default: false },
    addEntity: { type: Boolean, default: false },
    removeEntity: { type: Boolean, default: false },
    addReservation: { type: Boolean, default: false },
    editReservation: { type: Boolean, default: false },
    removeReservation: { type: Boolean, default: false },
    acceptReservation: { type: Boolean, default: false },
    deferreReservation: { type: Boolean, default: false },
    paypal: { type: Boolean, default: false },
    addClient: { type: Boolean, default: false },
    cancelRequest: { type: Boolean, default: false }, // تم تصحيح الخطأ الإملائي
    canReceiveCarryover: { type: Boolean, default: false },
    employee: { type: Boolean, default: false }
},
    admin: { type: Boolean ,default:false },
  },);
  
  adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
      return next();
    }
    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(this.password, salt);
      this.password = hash;
      next();
    } catch (error) {
      return next(error);
    }
  });

const Employee=mongoose.model('employee',adminSchema)
module.exports=Employee