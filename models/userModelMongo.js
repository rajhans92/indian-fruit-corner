const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Schema = mongoose.Schema;

// set users table structure
const userSchema = new Schema({
    firstName:{
        type:String,
        required: true
    },
    lastName:{
        type:String
    },
    email:{
        type:String,
        unique: true, 
        required: true
    },
    phoneNo:{
        type:String,
        required: true,
        min:10,
        max:15,
    },
    password:{
        type:String,
        required: true,
        min:5
    },
    verifyToken:{
        type:String,
        required: true
    },
    status:{
        type:Number,
        required: true,
        min:1,
        max:1,
        default:0
    }
},{timestemps:true});

const userModel = mongoose.model('users',userSchema);

// registration ORM
exports.registration = async (data,callback) => {
    try{
        // create hash string for passwrd
        data.password = await bcrypt.hash(data.password,10);  

        const user = new userModel(data);
        user.save((err, user) => {      // save data in mongodb and create new user
            return callback(err,user);
        });
    }catch(error){
        return callback(error,null);
    }
};

// login ORM
exports.login = (email,password,callback) => {
    userModel.findOne({     // check user id exist or not
        email:email
    },(error,user)=>{
        if(!error){
            var passwordIsValid = bcrypt.compareSync(password, user.password);  // compair encrypted password
            if (passwordIsValid){
                let data = {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phoneNo: user.phoneNo
                };
                return callback(error,data);
            }else{
                return callback(error,"Invalid Password.");
            }
        }else{
            return callback(error,"Invalid User id.");
        }
    });
};

//check user is already exist or not 
exports.emailIsExist = (data,callback) => {
    userModel.findOne({
        email:data
    }).exec((err, user)=>{
        return callback(err, user);
    });
};