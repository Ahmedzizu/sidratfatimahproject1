
const otp={
   sendOtp:(phone,otp)=>{
      const accountSid =process.env.ACC_SID;
      const authToken = process.env.PHONE_AUTH_TOKEN;
      const twilioPhone=process.env.TWILIO_PHONE
      const client = require('twilio')(accountSid, authToken);
      console.log(phone,otp);
      client.messages
        .create({
           body: `Your OTP is ${otp}`,
           from: twilioPhone,
           to: phone
        })
        .then(message => console.log(message.sid))
        .catch((err)=>console.log(err.message))

   },
   generateOtp:()=>{
      return Math.floor(100000 + Math.random() * 900000);
   }
}

module.exports=otp
