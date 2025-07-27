const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    phone2: {
        type: String,
        trim: true,
    },
    phoneVerification: {
        type: Boolean,
        default: false
    },
    emailVerification: {
        type: Boolean,
        default: false
    },
    emailVerificationCode: String,
    emailVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    idNumber: {
        type: String,
    // required: true, 
    unique: true, 
    trim: true,
    minlength: 8, // ✨ Change this to 8 (or whatever your actual minimum length is)
    // maxlength: 10 // You can keep this or adjust it too
    },
    nationality: {
        type: String,
        // required: true,
        trim: true
    },
    address: {
        type: String,
        // required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['customer', 'admin', 'employee'],
        default: 'customer'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    reservations: [{
        type: mongoose.Schema.Types.ObjectId,
        // ✨ هنا هو التصحيح: تغيير 'Reservation' إلى 'reservations' (الاسم المسجل في الموديل)
        ref: 'reservations' 
    }],
    image: {
        type: String,
        default: ''
    }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateToken = function(type) {
    const token = crypto.randomBytes(20).toString('hex');

    if (type === 'resetPassword') {
        this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
        this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    } else if (type === 'emailVerification') {
        this.emailVerificationCode = token;
        this.emailVerificationExpires = Date.now() + 10 * 60 * 1000;
    }
    return token;
};

module.exports = mongoose.model('User', userSchema);