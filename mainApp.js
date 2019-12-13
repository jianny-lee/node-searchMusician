// Express 기본 모듈 불러오기
var express = require('express')
  , http = require('http')
  , path = require('path');

// Express의 미들웨어 불러오기
var bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , static = require('serve-static')
  , errorHandler = require('errorhandler');

// 에러 핸들러 모듈 사용
var expressErrorHandler = require('express-error-handler');

// Session 미들웨어 불러오기
var expressSession = require('express-session');
 

//===== MySQL 데이터베이스를 사용할 수 있도록 하는 mysql 모듈 불러오기 =====//
var mysql = require('mysql');

var pool = mysql.createPool({
    connectionLimit : 10,
    host        : 'localhost',
    user        : 'root',
    password    : '12345678',
    port        : '3306',
    database    : 'artistList',
    debug       : false
    });



// 익스프레스 객체 생성
var app = express();

// 설정 파일에 들어있는 port 정보 사용하여 포트 설정
app.set('port', process.env.PORT || 3000);

// body-parser를 이용해 application/x-www-form-urlencoded 파싱
app.use(bodyParser.urlencoded({ extended: false }))

// body-parser를 이용해 application/json 파싱
app.use(bodyParser.json())

// public 폴더를 static으로 오픈
app.use('/public', static(path.join(__dirname, 'public')));
 
// cookie-parser 설정
app.use(cookieParser());

// 세션 설정
app.use(expressSession({
	secret:'my key',
	resave:true,
	saveUninitialized:true
}));
 



//===== 라우팅 함수 등록 =====//

// 라우터 객체 참조
var router = express.Router();


// 로그인 처리 함수
router.route('/process/firstpage').post(function(req, res) {
    console.log('/process/firstpage가 호출됨');

	// 요청 파라미터 확인
    var paramName = req.body.name || req.query.name;
    var paramGroup = req.body.group || req.query.group;
    var paramDebut = req.body.debut || req.query.debut;
    var paramGenre = req.body.genre || req.query.genre;
	
    console.log('$요청 파라미터 : ' + paramName + ', ' + paramGroup + ', ' + paramDebut + ', ' + paramGenre);
	
    // pool 객체가 초기화된 경우, authUser 함수 호출하여 사용자 인증
	if (pool) {
        
        searchArtist(paramName,paramGroup,paramDebut,paramGenre, function(err, rows){
            // 에러 발생 시, 클라이언트로 에러 전송
            if (err) {
                console.error('사용자 로그인 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>Error occur when you search for artist</h2>');
                res.write('<p>' + err.stack + '</p>');
				res.end();
                
                return;
            }
            if(rows){
                console.dir(rows);

                //조회 결과에서 사용자 이름 확인
                var username = rows[0].name;
                var usergroup = rows[0].group;
                var userdebut = rows[0].debut;
                var usergenre = rows[0].genre;

                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('&ensp;&ensp;<h1>[ Artist Information ]</h1>');
				res.write('&ensp;<div><p>Name : ' + username + '</p></div>');
                res.write('&ensp;<div><p>Group : ' + usergroup + '</p></div>');
                res.write('&ensp;<div><p>Debut Year : ' + userdebut + '</p></div>');
                res.write('&ensp;<div><p>Genre : ' + usergenre + '</p></div>');
				res.write("&ensp;<br><br><a href='/public/firstpage.html'>Back to the page of searching information</a>");
				res.end();
            } else {  // 조회된 레코드가 없는 경우 실패 응답 전송
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('&ensp;<h1>We cannot find information about artist</h1>');
				res.write('&ensp;<div><p>Please check artist name.</p></div>');
				res.write("&ensp;<br><br><a href='/public/firstpage.html'>Enter the name again</a>");
				res.end();
			}
        });
        } else {  // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
            res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
            res.write('<h2>데이터베이스 연결 실패</h2>');
            res.write('<div><p>데이터베이스에 연결하지 못했습니다.</p></div>');
            res.end();
        }
});

app.use('/',router);

// 아티스트 추가 라우팅 함수
router.route('/process/addartist').post(function(req, res) {
	console.log('/process/addartist 호출됨.');

    var paramName = req.body.name || req.query.name;
    var paramGroup = req.body.group || req.query.group;
    var paramDebut = req.body.debut || req.query.debut;
    var paramGenre = req.body.genre || req.query.genre;
	
    console.log('요청 파라미터 : ' + paramName + ', ' + paramGroup + ', ' + paramDebut + ', ' + paramGenre);
    
    // pool 객체가 초기화된 경우, addUser 함수 호출하여 사용자 추가
	if (pool) {
		addArtist(paramName, paramGroup, paramDebut, paramGenre, function(err, addedArtist) {
			// 동일한 id로 추가하려는 경우 에러 발생 - 클라이언트로 에러 전송
			if (err) {
                console.error('사용자 추가 중 에러 발생 : ' + err.stack);
                
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>Error about user addition</h2>');
                res.write('<h3> >>Input duplication information about artist</h3>');
                res.write("<br><br><a href='/public/addartist.html'>Move to page that add artist information");
				res.end();
                
                return;
            }
            
            // 결과 객체 있으면 성공 응답 전송
			if (addedArtist) {
				console.dir(addedArtist);

				console.log('>>inserted ' + addedArtist.affectedRows + ' rows');
	        
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>Success to add music artist</h2>');
                res.write("<br><br><a href='/public/firstpage.html'>Move to first page")
				res.end();
			} else {
				res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
				res.write('<h2>Fail to add music artist</h2>');
				res.end();
			}
		});
	} else {  // 데이터베이스 객체가 초기화되지 않은 경우 실패 응답 전송
		res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
		res.write('<h2>데이터베이스 연결 실패</h2>');
		res.end();
	}
	
});



// 라우터 객체 등록
app.use('/', router);


// 사용자를 인증하는 함수
var searchArtist = function(name,group,debut,genre, callback) {
	console.log('authUser 호출됨 : ' + name);
	
	// 커넥션 풀에서 연결 객체를 가져옴
	pool.getConnection(function(err, conn) {
        if (err) {
        	if (conn) {
                conn.release();  // 반드시 해제해야 함
            }
            callback(err, null);
            return;
        }   
        console.log('>> 데이터베이스 연결 스레드 아이디 : ' + conn.threadId);
          
        var columns = ['name','group','debut','genre']
        var tablename = 'users';

        // SQL 문을 실행합니다.
        var exec = conn.query("select ?? from ?? where name = ?", [columns,tablename,name], function(err, rows) {
            conn.release();  // 반드시 해제해야 함
            console.log('실행 대상 SQL : ' + exec.sql);
            
            if (rows != 0) {
    	    	console.log('이름 [%s]이 일치하는 사용자 찾음.', name);
    	    	callback(null, rows);
            } else {
            	console.log("일치하는 사용자를 찾지 못함.");
    	    	callback(null, null);
            }
        });

        conn.on('error', function(err) {      
            console.log('데이터베이스 연결 시 에러 발생함.');
            console.dir(err);
            
            callback(err, null);
      });
    });
	
}

//뮤지션을 등록하는 함수
var addArtist = function(name,group,debut,genre, callback) {
	console.log('addArtist 호출됨 : ' + name + ', ' + group + ', ' + debut + ', ' + genre);
	
	// 커넥션 풀에서 연결 객체를 가져옴
	pool.getConnection(function(err, conn) {
        if (err) {
        	if (conn) {
                conn.release();  // 반드시 해제해야 함
            }
            
            callback(err, null);
            return;
        }   
        console.log('<<<데이터베이스 연결 스레드 아이디 : ' + conn.threadId);

    	// 데이터를 객체로 만듦
        var data = {name:name, group:group, debut:debut, genre:genre};
        // console.dir(data);
        
        // SQL 문을 실행함
        var exec = conn.query('insert into users set ?', data, function(err, result) {
        	conn.release();  // 반드시 해제해야 함
        	console.log('실행 대상 SQL : ' + exec.sql);
        	
        	if (err) {
        		console.log('SQL 실행 시 에러 발생함.');
        		console.dir(err);
        		
        		callback(err, null);
        		
        		return;
            }
            
        	callback(null, result);
        	
        });
        
        conn.on('error', function(err) {      
              console.log('데이터베이스 연결 시 에러 발생함.');
              console.dir(err);
              
              callback(err, null);
        });
    });
	
}




// 404 에러 페이지 처리
var errorHandler = expressErrorHandler({
 static: {
   '404': './public/404.html'
 }
});

app.use( expressErrorHandler.httpError(404) );
app.use( errorHandler );


//===== 서버 시작 =====//

// 프로세스 종료 시에 데이터베이스 연결 해제
process.on('SIGTERM', function () {
    console.log("프로세스가 종료됩니다.");
});

app.on('close', function () {
	console.log("Express 서버 객체가 종료됩니다.");
});

// Express 서버 시작
http.createServer(app).listen(app.get('port'), function(){
  console.log('서버가 시작되었습니다. 포트 : ' + app.get('port'));
});
 