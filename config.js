/*
 * 설정 파일
 *
 * @date 2016-11-10
 * @author Mike
 */

module.exports = {
	server_port: 3000,
	db_url: 'db',
	db_schemas: [
	    {file:'./user_schema', collection:'users3', schemaName:'UserSchema', modelName:'UserModel'}
	],
	route_info: [
	    //===== User =====//
	    // {file:'./user', path:'/process/login', method:'login', type:'post'}					// user.login 
	    ,{file:'./user', path:'/process/addartist', method:'addartist', type:'post'}				// user.adduser 
	    // ,{file:'./user', path:'/process/listuser', method:'listuser', type:'post'}			// user.listuser 
	]
}