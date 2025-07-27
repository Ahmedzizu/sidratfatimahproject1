const validator = require('validator');

const employeeValidation = (name,email, password,nationalId, phone) => {
  const errors = {};
  if (validator.isEmpty(name))errors.name = 'Name is required';
  if (validator.isEmpty(password)) errors.password = 'Password is required';
  if (!validator.isLength(password, { min: 8 }))errors.password = 'Password must be at least 8 characters long';
  if (validator.isEmpty(phone)) errors.phone = 'Phone number is required';
  if (validator.isEmpty(nationalId?.toString())) errors.nationalId = 'National id is required';
  if (!validator.isMobilePhone(phone)) errors.phone = 'Phone number is invalid';
  if (validator.isEmpty(email)) errors.email ="Email address is required"
 // if (validator.isEmail(email)) errors.email ="Email address is invalid"
  return {errors,isValid: Object.keys(errors).length === 0,};
};

module.exports = employeeValidation;
