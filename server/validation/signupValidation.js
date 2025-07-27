// F:\ractprojects\New folder (2)\ggg\server\validation\signupValidation.js
const validator = require('validator');

const validateSignupData = (name, email, password, phone) => {
    const errors = {};

    // Ensure values are strings, even if they come as null/undefined
    const validatedName = name ? String(name).trim() : '';
    const validatedEmail = email ? String(email).trim() : '';
    const validatedPassword = password ? String(password) : ''; 
    const validatedPhone = phone ? String(phone).trim() : ''; 

    // Validate Name
    if (validator.isEmpty(validatedName)) {
        errors.name = 'Name is required';
    }

    // Validate Email
    if (validator.isEmpty(validatedEmail)) {
        errors.email = 'Email address is required';
    } else if (!validator.isEmail(validatedEmail)) { 
        errors.email = 'Email address is invalid';
    }
    
    // Validate Password
    if (validator.isEmpty(validatedPassword)) {
        errors.password = 'Password is required';
    } else if (!validator.isLength(validatedPassword, { min: 8 })) { 
        errors.password = 'Password must be at least 8 characters long';
    }
    
    // Validate Phone - تم التعديل هنا
    if (validator.isEmpty(validatedPhone)) {
        errors.phone = 'Phone number is required';
    } else if (!validator.isMobilePhone(validatedPhone, 'any', { strictMode: false })) { 
        // 'any': للتحقق من أي رقم هاتف دولي
        // 'strictMode: false': يسمح بأرقام تبدأ بعلامة زائد (+) أو تتضمن مسافات أو أقواس
        errors.phone = 'Phone number is invalid';
    }

    return {
        errors,
        isValid: Object.keys(errors).length === 0,
    };
};

module.exports = validateSignupData;
