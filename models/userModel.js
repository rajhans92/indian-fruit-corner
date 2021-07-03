var bcrypt = require('bcrypt');
var sql = require('../helpers/databaseConfig');

exports.loginWithContactNo = async (contactNo,userId,callback) => {

	sql.query(`Select id,first_name,last_name,email_id,contact_no,profile_pic,role_id,verify_mail,status from users where contact_no = ? AND status='1' limit 1`, contactNo,function (error, user) {    
		if(error) {
			callback(true, {msg:"Something Went Wrong!"});
		}else{
			if(!user.length){
				if(userId){
					sql.query(`Update users set contact_no = ?, verify_contact_no = '1',status = '1' where id = ?`, [contactNo, userId],function (error,data) {
						console.log("data",data);
						if (error){
							callback(true, {msg:"Something Went Wrong!"});
						}else{
							sql.query(`Select id,first_name,last_name,email_id,contact_no,profile_pic,role_id,verify_mail,status from users where contact_no = ? AND status='1' limit 1`, contactNo,function (error, user) {    
								if(error) {
									callback(true, {msg:"Something Went Wrong!"});
								}else{
									user = JSON.parse(JSON.stringify(user))[0];
									callback(false, user);
								}
							});
						}
					});
				}else{
					let userData = [
						contactNo,
						'1',
						'1',
						'1'
					];
					let userQuery = "INSERT INTO users (contact_no,verify_contact_no, role_id, status) VALUES (?,?,?,?)";
					sql.query(userQuery, userData, function (err, result) {  					
						if (err){
							callback(true,{msg:"Something Went Wrong!"});
						}else{
							let userTemp = {
								'id':result.insertId,
								'first_name':null,
								"last_name":null,
								"email_id":null,
								"profile_pic":null,
								'contact_no':contactNo,
								'verify_mail':0,
								'role_id':1,
								'status':1
							}
							callback(false, userTemp);
						}
					});
				}

			}else{
				user = JSON.parse(JSON.stringify(user))[0];
				callback(false, user);
	
			}
		}
	});
}

exports.emailIsExist = (email,callback) => {
	sql.query(`Select * from users where email_id = ? `, email, function (error, users) {    
		         
		if(error || !users.length) {
			callback(true, {msg:"Email Id is not exist!"});
		}
		else{
			callback(false, {});
		}
	}); 
}

exports.userIdIsExist = (userId,callback) => {
	sql.query(`Select * from users where id = ? `, userId, function (error, users) {    
		         
		if(error || !users.length) {
			callback(true, {msg:"User Id is not exist!"});
		}
		else{
			callback(false, {});
		}
	}); 
}

exports.login = (email,password,callback) => {
	sql.query(`Select * from users where email_id = ?`, email,function (error, users) {    

		if(error || !users.length) {
			callback(true, {msg:"Wrong Email Id or Password!"});
		}
		else{
			users = JSON.parse(JSON.stringify(users))[0];
			users.password = users.password.replace('$2y$', '$2a$');
		    if(!bcrypt.compareSync(password,users.password)){
				callback(true, {msg:"Wrong Email Id or Password!"});
			}else{
				if(users.status && users.status == 1){
					let userData = {
						"id": users.id,
						"first_name": users.first_name,
						"last_name": users.last_name,
						"email_id": users.email_id,
						"contact_no": users.contact_no,
						"profile_pic": users.profile_pic,
						"role_id":users.role_id,
						"verify_contact_no":users.verify_contact_no,
						"verify_mail":users.verify_mail
					}
					callback(false, userData);
				}else{
					callback(true, {msg:"Please verify your account with email or phone number first!"});	  
				}
			}
		}
	}); 
}

exports.registration = async (userData,callback) => {
	try{
		userData.password = await bcrypt.hash(userData.password,10); 
		let userDataTemp = [
			userData.firs_name,
			userData.last_name,
			userData.email_id,
			userData.password,
			userData.verify_token,
			userData.role_id,
			userData.status
		];
		let userQuery = "INSERT INTO users (first_name, last_name, email_id, password, verify_token, role_id, status) VALUES (?,?,?,?,?,?,?)";
		sql.query(userQuery, userDataTemp, function (err, result) {  
			console.log(err);		
			if (err){
				callback(true);
			}else{
				callback(false);
			}
		});
	}catch(error){
		console.log(error);
		callback(true);
	}
}

exports.verifyToken = (token,callback) => {
	sql.query(`Select * from users where verify_token = ?`, token,function (error, users) {    

		if(error || !users.length) {
			callback(true, "Invalid Token!");
		}
		else{
			users = JSON.parse(JSON.stringify(users))[0];
			if(users.verify_mail && users.verify_mail == 1){
				sql.query(`Update users set status = 1,verify_mail=1 where verify_token = ?`, token,function (error, tokenUpdate) {
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
			if(users.status == 1){
				users.password = users.password.replace('$2y$', '$2a$');

				if(!bcrypt.compareSync(password,users.password)){
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

exports.updatePassword = async (userId, password, callback) => {
	try{
		password = await bcrypt.hash(password,10); 
		sql.query(`Update users set password = ? where id = ?`, [password, userId],function (error) {
			if(error){
				callback(true, "Something went wrong!" );			
			}else{
				callback(false, "Password Updated Successfully.");				
			}
		});
	}catch(error){
		callback(true, "Something went wrong!");
	}
}