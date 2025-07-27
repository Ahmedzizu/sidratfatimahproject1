const validator = require('validator');

const customerValidation = (name, address, nationalId, phone) => { // idNumber بدلاً من nationalId
  const errors = {};

  if (validator.isEmpty(name ? String(name) : '')) errors.name = 'Name is required';
  if (validator.isEmpty(phone ? String(phone) : '')) errors.phone = 'Phone number is required';
  if (validator.isEmpty(nationalId ? String(nationalId) : '')) errors.nationalId = 'National ID is required'; // يجب استخدام idNumber هنا

  // ✅✅✅ التصحيح هنا: هذا الشرط كان خاطئًا.
  // إذا كان `address` هو العنوان، فلا يجب التحقق من أنه ليس بريدًا إلكترونياً بهذه الطريقة.
  // يمكن إزالة هذا التحقق إذا كان العنوان غير مطلوب دائماً،
  // أو إضافة تحقق على طوله أو عدم فراغه إذا كان مطلوباً.
  // حالياً سأزيله بناءً على أن `address` هو العنوان السكني.
  // if (validator.isEmail(address)) errors.email = "Address is invalid (looks like an email)";

  // إذا كنت تريد التحقق من أن العنوان ليس فارغًا:
  if (validator.isEmpty(address ? String(address) : '')) errors.address = 'Address is required'; // إذا كان العنوان حقل إلزامي

  return { errors, isValid: Object.keys(errors).length === 0, };
};

module.exports = customerValidation;