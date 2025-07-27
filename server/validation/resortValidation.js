const validator = require('validator');

const resortValidation = (name,images,pool,games,kitchen,area) => {
    let errors={}
    if (validator.isEmpty(name))errors.name = 'Name is required';
    if (validator.isEmpty(pool))errors.pool = 'Pool Number is required';
    if (validator.isEmpty(games))errors.games = 'games Number is required';
    if (validator.isEmpty(kitchen))errors.kitchen = 'kitchen Number is required';
    if (validator.isEmpty(area))errors.area = 'area is required';
    if (images.length==0)errors.images = 'images is required';
    return {errors,isValid: Object.keys(errors).length === 0,};
}

module.exports=resortValidation