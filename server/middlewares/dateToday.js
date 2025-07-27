function getDateToday(){
        const date = new Date();
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // January is 0
        const year = date.getFullYear();
        return `${year}-${month}-${day}`;
}
module.exports=getDateToday