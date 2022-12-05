var mongoose = require('mongoose');
var Schema = mongoose.Schema;
EmpSchema = new Schema({
    name : String,
    address : String,
    rate: Number,
    Description: String
});
module.exports = mongoose.model('restaurant', EmpSchema);