const Employee=require("../model/employee")
const bcrypt=require('bcrypt')
const middleware=require("../middlewares/middleware")
const employeeValidation = require("../validation/employeeValidation")
const { employeeFinanceValidation,employeeAbsenceValidation } = require("../validation/employeeFinanceValidation")
const EmployeeFinance = require("../model/employeeFiannce")
const EmployeeAbsence= require("../model/employeeAbsence")

const employee={

    // signin:async (req,res)=>{
    //     try {
    //         console.log(req.body);
    //         let {email,password}=req.body
    //         if(!email) return res.status(404).send({email:"Email is required"})
    //         if(!password) return res.status(404).send({password:"Password is required"})
    //         let user= await Employee.findOne({email})
    //         if(!user)  return res.status(404).send({email:"Email not found"})
    //         if(! await bcrypt.compare(password,user.password)) return res.status(403).send({password:"Invalid password"})
    //         delete user.password
    //         let token=await middleware.generateToken({user})
    //         res.cookie("admin_token",`Baerar ${token}`,{
    //             maxAge:2 * 24 * 60 * 60 * 1000 ,
    //             httpOnly:true,
    //             secure:true,
    //         })
    //         res.send()
    //     } catch (error) {
    //         console.log(error.message);
    //         res.status(500).send(error.message)
    //     }
    // },


    signin: async (req, res) => {
        try {
            console.log(req.body);
            let { email, password } = req.body;
    
            // ✅ التحقق من المدخلات
            if (!email) return res.status(400).send({ email: "Email is required" });
            if (!password) return res.status(400).send({ password: "Password is required" });
    
            // ✅ البحث عن المستخدم في `Employee` بدل `User`
            let user = await Employee.findOne({ email });
            if (!user) return res.status(404).send({ email: "Email not found" });
    
            // ✅ التحقق من كلمة المرور
            if (!await bcrypt.compare(password, user.password)) 
                return res.status(403).send({ password: "Invalid password" });
    
            // ✅ توليد التوكن بدون استخدام الكوكيز
            const token = await middleware.generateAdminToken(user._id);  // تمرير _id فقط
    
            // ✅ إرجاع التوكن في الـ response فقط
            res.status(200).send({
                message: "Login successful",
                token,  // ✅ إرسال التوكن فقط بدون كوكيز
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name
                }
            });
    
        } catch (error) {
            console.log("❌ Login Error:", error.message);
            res.status(500).send({ error: error.message });
        }
    },

    
    addEmployee:async(req,res)=>{
          try {
            let {name,nationalId,phone,email,password,salary,position}=req.body
            let {errors,isValid}= employeeValidation(name,email,password,nationalId,phone)
            console.log(errors);
            if(!isValid) return res.status(403).send(errors)
            let user =new Employee({name,email,password,nationalId,phone,salary,position})
            await user.save()
            .then(()=>res.sendStatus(201))
            .catch((err)=>{
                console.log(err);
                if(err.code==11000) return res.status(403).send({email:"Email is already taken"})
               return res.status(403).send(err.message)
            })
        } catch (error) {
            console.log(error.message);
            res.status(500).send({error:error.message})
        }
    },


    
    getEmployees:async(req,res)=>{
        try {
            let employees=await Employee.find({admin:false}).populate("finance")
            res.send(employees)
        } catch (error) {
            console.log(error.message);
            res.status(500).send({error:error.message})
        }
    },
    deleteEmployee:async(req,res)=>{
        try {
            let {id}=req.params
            await Employee.findByIdAndDelete({_id:id})
            .then(()=>res.send())
            .catch((error)=>{
                console.log(error.message);
                res.status(500).send({error:error.message})
            })
        } catch (error) {
            console.log(error.message);
            res.status(500).send({error:error.message})
        }
    },
    updateEmployee:async(req,res)=>{
        try {
            let {name,email,password,nationalId,phone,_id}=req.body
            let hashed=await bcrypt.hash(password,10)
            await Employee.findByIdAndUpdate({_id},{name,email,password:hashed,nationalId,phone})
            .then(()=>res.send())
            .catch((error)=>{
                console.log(error.message);
                res.status(500).send({error:error.message})
            })
        } catch (error) {
            console.log(error.message);
            res.status(500).send({error:error.message})
        }
    },
    updatePermissions:async(req,res)=>{
        try {
            let {_id}=req.body
            delete req.body._id
            await Employee.findByIdAndUpdate({_id},{permissions:req.body})
            .then(()=>res.send())
            .catch((err)=>res.status(403).send({error:err.message}))
        } catch (error) {
            console.log(error.message);
            res.status(500).send({error:error.message})
        }
    },
    getAdminData: async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).send({ error: "Unauthorized: No user data in request." });
        }

        let { _id } = req.user;
        let data = await Employee.findOne({ _id });
        res.send(data);
    } catch (error) {
        console.log("❌ getAdminData error:", error.message);
        res.status(500).send({ error: error.message });
    }


    },
    addFinance:async (req,res)=>{
        try {
            console.log(req.body);
            let {errors,isValid}= employeeFinanceValidation(req.body)
            if(!isValid) return res.status(403).send(errors)

            let newFinacne = new EmployeeFinance(req.body)
            await newFinacne.save()
            
            let user = await Employee.findById(req.body.employee)
            user.finance.push(newFinacne._id)
            await user.save()

            res.status(201).send()

        } catch (error) {
            console.log(error.message);
            res.status(500).send({error:error.message})
        }
    },
    getAllfinance:async (req,res)=>{
        try {
            let data =await EmployeeFinance.find()
                .populate("employee")
            
            res.send(data)
        } catch (error) {
            console.log(error.message);
            res.status(500).send({error:error.message})
        }
    },
    addAbsence:async (req,res)=>{
        try {
            let {errors,isValid}= employeeAbsenceValidation(req.body)
            console.log(errors);
            if(!isValid) return res.status(403).send(errors)

            let newAbsence = new EmployeeAbsence(req.body)
            await newAbsence.save()
            console.log(newAbsence);
            res.status(201).send()
        } catch (error) {
            console.log(error.message);
            res.status(500).send({error:error.message})
        }
    },
    getAllAbsence:async (req,res)=>{
        try {
            let data =await EmployeeAbsence.find()
                .populate("employee")
            res.send(data)
        } catch (error) {
            res.status(500).send({error:error.message})
        }
    },
    editAbsence:async (req,res)=>{
        try {
            await EmployeeAbsence.findByIdAndUpdate(req?.body?._id,req.body)
            res.send()
        } catch (error) {
            console.log(error.message);
            res.status(500).send({message: error.message})
        }
    },
    deleteAbsence: async (req,res)=>{
        try {
            let {id} =req.params
            await EmployeeAbsence.findByIdAndDelete(id)
            res.send()
        } catch (error) {
            console.log(error.message);
            res.status(500).send({message: error.message})
        }
    }
}
module.exports=employee;