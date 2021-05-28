const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const rolesSchema = new Schema({
    name:{
        type:String,
        required: true
    },
    permissions:[{
        type:String,
        required: true
    }]
},{timestemps:true});

const rolesModel = mongoose.model('roles',rolesSchema);



modules.exports = rolesModel;