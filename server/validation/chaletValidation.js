const validator = require("validator");

const chaletValidation = (name, area, address, bath, lounge, sleeping, kitchen) => {
    let errors = {};

    console.log("🔍 Validating Chalet Data:");
    console.log(`- name: ${name} (type: ${typeof name})`);
    console.log(`- area: ${area} (type: ${typeof area})`);
    console.log(`- address: ${address} (type: ${typeof address})`);
    console.log(`- bath: ${bath} (type: ${typeof bath})`);
    console.log(`- lounge: ${lounge} (type: ${typeof lounge})`);
    console.log(`- sleeping: ${sleeping} (type: ${typeof sleeping})`);
    console.log(`- kitchen: ${kitchen} (type: ${typeof kitchen})`);

    // **تحويل القيم إلى نصوص قبل الفحص وتهذيبها (trim)**
    // استخدام String() فقط إذا كانت القيمة موجودة
    const trimmedName = (name !== undefined && name !== null) ? String(name).trim() : '';
    const trimmedArea = (area !== undefined && area !== null) ? String(area).trim() : '';
    const trimmedAddress = (address !== undefined && address !== null) ? String(address).trim() : '';
    const trimmedBath = (bath !== undefined && bath !== null) ? String(bath).trim() : '';
    const trimmedLounge = (lounge !== undefined && lounge !== null) ? String(lounge).trim() : '';
    const trimmedSleeping = (sleeping !== undefined && sleeping !== null) ? String(sleeping).trim() : '';
    const trimmedKitchen = (kitchen !== undefined && kitchen !== null) ? String(kitchen).trim() : '';

    // **التحقق من الحقول المطلوبة باستخدام القيم المهذبة**
    if (validator.isEmpty(trimmedName)) errors.name = "Name is required";
    if (validator.isEmpty(trimmedArea)) errors.area = "Area is required";
    if (validator.isEmpty(trimmedAddress)) errors.address = "Address is required";
    if (validator.isEmpty(trimmedBath)) errors.bath = "Bath is required";
    if (validator.isEmpty(trimmedLounge)) errors.lounge = "Lounge is required";
    if (validator.isEmpty(trimmedSleeping)) errors.sleeping = "Sleeping capacity is required";
    if (validator.isEmpty(trimmedKitchen)) errors.kitchen = "Kitchen is required";

    // (اختياري) إضافة تحققات لنوع البيانات، مثلاً أن تكون المساحة والحمامات أرقاماً موجبة
    if (!validator.isNumeric(trimmedArea) || parseInt(trimmedArea) <= 0) {
        errors.area = 'Area must be a positive number';
    }
    if (!validator.isNumeric(trimmedBath) || parseInt(trimmedBath) <= 0) {
        errors.bath = 'Bathrooms must be a positive number';
    }
    // يمكنك إضافة نفس التحقق لـ lounge, sleeping, kitchen إذا كانت أرقاماً
    if (!validator.isNumeric(trimmedLounge) || parseInt(trimmedLounge) < 0) { // يمكن أن تكون 0
        errors.lounge = 'Lounge must be a non-negative number';
    }
    if (!validator.isNumeric(trimmedSleeping) || parseInt(trimmedSleeping) <= 0) {
        errors.sleeping = 'Sleeping capacity must be a positive number';
    }
    if (!validator.isNumeric(trimmedKitchen) || parseInt(trimmedKitchen) < 0) { // يمكن أن تكون 0
        errors.kitchen = 'Kitchen must be a non-negative number';
    }


    return { errors, isValid: Object.keys(errors).length === 0 };
};

module.exports = chaletValidation;