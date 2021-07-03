var bcrypt = require("bcrypt");
var sql = require('../helpers/databaseConfig');

module.exports = {
    create: async(userData, callback) => {
        try{
            userData.password = await bcrypt.hash(userData.password,10); 
            let userDataTemp = [
                userData.firstName,
                userData.lastName,
                userData.email,
                userData.phoneNo,
                userData.password,
                '2',
                '0'
            ];
            let userQuery = "INSERT INTO users (first_name, last_name, email_id, contact_no, password, role_id, status) VALUES (?,?,?,?,?,?,?)";
            sql.query(userQuery,userDataTemp, function (err, result) {  
                console.log(err);		
                if (err){
                    callback(true,"something went wrong!, please try again.");
                }else{
                    callback(false,"User save successfully!");
                }
            });
        }catch(error){
            callback(true,"something went wrong!, please try again.");
        }   
        
    },
    getUsers: callback => {
        sql.query(
            `select id, firstName, lastName, email_id, contact_no, password, verify_token, role_id, status from users`,
            [],
            (error, results, fields)=> {
                if(error) {
                   return callback(error);
                }
                return callback(null, results);
            }
        );
    },
    getUserByUserId: (id, callback) => {
        sql.query(
            `select id, firstName, lastName, email_id, contact_no, password, verify_token, role_id, status from users where id = ?`,
            [id],
            (error, results, fields)=> {
                if(error) {
                   return callback(error);
                }
                return callback(null, results);
            }
        );
    },
    updateUser: (data, callback) => {
        sql.query(
            `update users set firstName=?, lastName=?,	pssword=?, number=?	where id=?`,
            [
                userData.first_name,
                userData.last_name,
                userData.email_id,
                userData.contact_no,
                userData.password,
                userData.verify_token,
                userData.role_id,
                userData.status
            ],
            (error, results, fields)=> {
                if(error) {
                   return callback(error);
                }
                return callback(null, results[0]);
            }
        );
    },
    deleteUser: (data, callback) => {
        sql.query(
            `delete from users where id = ?`,
            [data.id],
            (error, results, fields)=> {
                if(error) {
                   return callback(error);
                }
                return callback(null, results[0]);
            }
        );
    },
};    