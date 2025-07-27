// const validator = require('validator');

// const hallValidation = (name,rooms,halls,capacity) => {
//     let errors={}
//     if (validator.isEmpty(name))errors.name = 'Name is required';
//     if (validator.isEmpty(rooms))errors.rooms = 'Rooms is required';
//     if (validator.isEmpty(halls))errors.halls = 'Halls is required';
//     if (validator.isEmpty(capacity))errors.capacity = 'Capacity is required';
//     return {errors,isValid: Object.keys(errors).length === 0,};
// }

// module.exports=hallValidation


const validator = require('validator');

const hallValidation = (name, rooms, halls, capacity) => {
    let errors = {};

    // تأكد أن كل القيم عبارة عن نصوص قبل فحصها
    name = String(name || "").trim();
    rooms = String(rooms || "").trim();
    halls = String(halls || "").trim();
    capacity = String(capacity || "").trim();

    if (validator.isEmpty(name)) errors.name = 'Name is required';
    if (validator.isEmpty(rooms)) errors.rooms = 'Rooms is required';
    if (validator.isEmpty(halls)) errors.halls = 'Halls is required';
    if (validator.isEmpty(capacity)) errors.capacity = 'Capacity is required';

    return { errors, isValid: Object.keys(errors).length === 0 };
};

module.exports = hallValidation;
