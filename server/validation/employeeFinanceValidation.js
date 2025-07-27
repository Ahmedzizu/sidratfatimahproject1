const validator = require('validator');

const employeeFinanceValidation = (data) => {
    const errors = {};
    if (validator.isEmpty(data?.employee))errors.name = 'Name is required';
    // if (validator.isEmpty(data?.amount))errors.name = 'abount is required';
    if (validator.isEmpty(data?.date))errors.name = 'date is required';
    if (validator.isEmpty(data?.type))errors.name = 'type is required';
    return {errors,isValid: Object.keys(errors).length === 0,};
  };

  const employeeAbsenceValidation = (data) => {
    const errors = {};
    if (validator.isEmpty(data?.employee)) errors.name = 'Name is required';
    if (validator.isEmpty(data?.date)) errors.name = 'date is required';
    return {errors,isValid: Object.keys(errors).length === 0,};
  };
  module.exports= {
    employeeFinanceValidation,
    employeeAbsenceValidation
  } 