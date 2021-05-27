var hash = require('bcrypt');
var sql = require('../helpers/databaseConfig');

exports.emailIsExist = (email,callback) => {
	sql.query(`Select * from users where email = ? `, email, function (error, users) {    
		         
		if(error || !users.length) {
			callback(true, {msg:"Email Id is not exist!"});
		}
		else{
			callback(false, {});
		}
	}); 
}

exports.login = (email,password,callback) => {
	sql.query(`Select * from users where email = ?`, email,function (error, users) {    

		if(error || !users.length) {
			callback(true, {msg:"Wrong Email Id or Password!"});
		}
		else{
			users = JSON.parse(JSON.stringify(users))[0];
			users.password = users.password.replace('$2y$', '$2a$');
		    if(!hash.compareSync(password,users.password)){
				callback(true, {msg:"Wrong Email Id or Password!"});
			}else{
				if(users.role_id && users.role_id == process.env.ROLE_ID){
					if(users.status && users.status == process.env.ACTIVE_STATUS){
						let userData = {
							"id": users.id,
							"first_name": users.first_name,
							"last_name": users.last_name,
							"email": users.email,
							"phone_no": users.phone_no,
							"alt_phone_no": users.alt_phone_no,
						}
						sql.query(`Select * from students where user_id = ?`, users.id,function (error, student) {    
							if(!error && student.length){
								student = JSON.parse(JSON.stringify(student))[0];
								userData.dob = student.dob;
								userData.education = student.education;
								userData.profile_pic = student.profile_pic;
								userData.about = student.about;
								userData.address = student.address;
							}
							callback(false, userData);	  				
						});
					}else{
						callback(true, {msg:"Please verify your email id first!"});	  
					}
				}else{
					callback(true, {msg:"Only Students are allow to login!"});	  
				}
			}
		}
	}); 
}

exports.registration = (userData,callback) => {
	let userQuery = "INSERT INTO users (first_name, last_name, email, phone_no, password, role_id, status, verify_token, created_at) VALUES (?,?,?,?,?,?,?,?,?)";
	sql.query(userQuery, userData, function (err, result) {  
		console.log("result ",result,err);
		
		if (err){
			callback(true);
		}else{
			result = JSON.parse(JSON.stringify(result));
			console.log("after = ",result);
			
			let studentQuery = "INSERT INTO students (user_id) VALUES (?)";
			sql.query(studentQuery, result.insertId, function (err, sresult) { 
				if (err){
					callback(true);
				}else{
					callback(false);
				}
			})
		}
	});
}

exports.verifyToken = (token,callback) => {
	sql.query(`Select * from users where verify_token = ?`, token,function (error, users) {    

		if(error || !users.length) {
			callback(true, "Invalid Token!");
		}
		else{
			users = JSON.parse(JSON.stringify(users))[0];
			if(users.status && users.status == 1){
				sql.query(`Update users set status = 2 where verify_token = ?`, token,function (error, tokenUpdate) {
					if(error){
						callback(true, "Something Went Wrong!");
					}else{
						callback(false, "Email Id verified successfully!");
					}
				});
			}else{
				callback(true, "User Profile already Active!");
			}
		}
	});
}

exports.passwordIsExist = (userId,password,callback) => {
	sql.query(`Select * from users where id = ? `, userId,function (error, users) {    
		if(error || !users.length) {
			callback(true, "Invalid User.");
		}
		else{
			users = JSON.parse(JSON.stringify(users))[0];
			if(users.status == 2){
				users.password = users.password.replace('$2y$', '$2a$');

				if(!hash.compareSync(password,users.password)){
					callback(true, "Invalid current password!" );
				}else{
					callback(false, null);
				}
			}else{
				callback(true, "User Profile is not activated!" );
			}
		}
	});
}

exports.updatePassword = (userId, password, callback) => {
	sql.query(`Update users set password = ? where id = ?`, [password, userId],function (error) {
		if(error){
			callback(true, "Something went wrong!" );			
		}else{
			callback(false, "Password Updated Successfully.");				
		}
	});
}