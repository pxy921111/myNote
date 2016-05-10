/*
*在线笔记本项目
* author:pxy
* date:2016.3.18
 */

//加载依赖库
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var session = require('express-session');
var moment = require('moment');
var checkLogin = require('./checkLogin.js');


//引入mongoose
var mongoose = require('mongoose');
//引入模型
var models = require('./models/models');

var User = models.User;
//使用mongoose连接服务
mongoose.connect('mongodb://localhost:27017/notes');
mongoose.connection.on('error',console.error.bind(console,'连接数据库失败'));
//创建express实例
var app = express();

//定义EJS模块引擎和模板文件位置
app.set('views',path.join('D:/nodejs/myNote','views'));
app.set('view engine','ejs');

//定义静态文件目录
app.use(express.static(path.join('D:/nodejs/myNote','public')));

//定义数据解析器
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

//建立session模型
app.use(session({
    secret:'1234',
    name:'mynote',
    //cookie:{maxAge:1000*60*20},//设置session的保存时间为20分钟
    cookie:{maxAge:1000*60*20*3*24*7},//设置session的保存时间为一周
    resave:false,
    saveUninitialized:true
}));

var User = models.User;
var Note = models.Note;

//对登录注册控制并提示用户
/*app.use(function(req, res, next) {
    res.locals.user = req.session.user;
    res.locals.error =req.session.error;
    var err = req.session.error;
    delete req.session.error;
    if (req.session.error) {
        res.locals.message =;
    }
    next();
});*/
//响应首页get请求
//"index.js" 180L,4525C
/*app.get( '/',function(req,res) {
     res.render('index',{
         user:req.session.user,
         title:'首页'
     });
});*/
//响应首页get请求
//app.get('/',checkLogin.noLogin);
app.get('/',function(req,res) {
    if(req.session.user != null) {
        Note.find({author: req.session.user.username})
            .exec(function (err, allNotes) {
                if (err) {
                    console.log(err);
                    return res.redirect('/');
                }
                res.render('index', {
                    title: '首页',
                    user: req.session.user,
                    notes: allNotes
                });
            })
    }
    else {
        res.render('index', {
            user: req.session.user,
            title: '首页'

        })
    }
});
//响应注册页面get请求
//app.get('/register',checkLogin.noLogin);
app.get( '/register',function(req,res) {
    console.log('注册！');
    var error = req.session.error;
    delete req.session.error;
    res.render('register',{
        user:req.session.user,
        title:'注册',
        message: error
    });
});
//post请求
app.post('/register',function(req,res) {
    //req.body可以获取到表单的每项数据
    var username = req.body.username,
        password = req.body.password,
        passwordRepeat = req.body.passwordRepeat;

    //function check() {//检查输入的用户名是否为空，使用trim去掉两端空格
        if (username.trim().length == 0) {
            console.log('用户名不能为空！');
            req.session.error = '用户名不能为空！';
            //console.log('****************');
            //console.log(req.session.error);
            return res.redirect('/register');
        }
        if(username.length < 3 || username.length >20)
        {
            console.log('用户名长度为3-20！');
            req.session.error = '用户名长度为3-20！';
            //console.log('****************');
            //console.log(req.session.error);
            return res.redirect('/register');
        }
        //if(username)
        //if(username.length >= 3 && username.length <= 20) {
        //检查输入的密码是否为空，使用trim去掉两端空格
     if (password.length < 6 || password.length > 15) {
        console.log('密码长度为6-15!');
        req.session.error = '密码长度为6-15!';
        return res.redirect('/register');
     }
        if (password.trim().length == 0 || passwordRepeat.trim().length == 0) {
            console.log('密码不能为空！');
            req.session.error = '密码不能为空！';
            return res.redirect('/register');
        }
        if (password != passwordRepeat) {
            console.log('两次输入的密码不一致！');
            req.session.error = '两次输入的密码不一致！';
            return res.redirect('/register');
        }
        if(password)
        //检查用户名是否已经存在，如果不存在，则保存这条记录
        User.findOne({username: username}, function (err, user) {
            if (err) {
                console.log(err);
                return res.redirect('/register');
            }
            if (user) {
                console.log('用户名已经存在！');
                req.session.error = '用户名已经存在！';
                return res.redirect('/register');
            }

            //对密码进行md5加密
            var md5 = crypto.createHash('md5'),
                md5password = md5.update(password).digest('hex');

            //新建user对象用于保存数据
            var newUser = new User({
                username: username,
                password: md5password
            });
            newUser.save(function (err, doc) {
                if (err) {
                    console.log(err);
                    return res.redirect('/register');
                }
                console.log('注册成功！');
                req.session.error = '注册成功！请登录！';
                return res.redirect('/login');
            });
        });
        //}
   // }
});

app.get('/login',function(req,res) {
    console.log('登录！');
    var error = req.session.error;
    delete req.session.error;
    res.render('login',{
        user:'',
        title:'登录',
        message:error

    });
    //console.log('**************'+req.session.error);
    //delete req.session.error;
    //console.log('**************'+req.session.error);
});
app.post('/login',function(req,res){
   var username =req.body.username,
       password =req.body.password;

    User.findOne({username:username},function(err,user) {
        if(err){
            console.log(err);9
            return res.redirect('/login');
        }
        if(!user){
            console.log('用户不存在！');
            req.session.error='用户不存在！';
            //$('#username').alert('用户不存在!');

            return res.redirect('/login');
        }
        //对密码进行md5加密
        var md5=crypto.createHash('md5'),
            md5password=md5.update(password).digest('hex');
        if(user.password !== md5password){
            console.log('密码错误!');
            req.session.error='密码错误！';
            return res.redirect('/login');
        }
        console.log('登录成功！');
        user.password = null;
        delete user.password;
        req.session.user = user;
        return res.redirect('/');
    });
});
app.get('/quit',function(req,res) {
    req.session.user = null;
    console.log('退出！');
    return res.redirect('/');
});
//app.get('/post',checkLogin.noLogin);
app.get('/post',function(req,res) {
    console.log('发布！');
    res.render('post',{
        user:req.session.user,
        title:'发布'
    });
});
app.post('/post',function(req,res) {
    var note = new Note({
        title:req.body.title,
        author:req.session.user.username,
        tag:req.body.tag,
        content:req.body.content
    });

    note.save(function(err,doc) {
       if(err) {
           console.log(err);
           return res.redirect('/post');
       }
        console.log('文章发表成功！');
        return res.redirect('/');
    });
});
//app.get('/detail',checkLogin.noLogin);
app.get('/detail/:_id',function(req,res) {
    console.log('查看笔记！');
    Note.findOne({_id:req.params._id})
        .exec(function(err,art) {
          if(err){
              console.log(err);
              return res.redirect('/');
          }
            if(art){
                res.render('detail',{
                    title:'查看笔记',
                    user:req.session.user,
                    art:art,
                    moment:moment
                });
            }
        });
});
app.get( '/test',function(req,res) {
    console.log('测试！');
    var error = req.session.error;
    delete req.session.error;
    res.render('test',{
        user:req.session.user,
        title:'测试',
        message: error
    });
});
//监听3000端口
app.listen(3000,function(req,res) {
  console.log('app is running at port 3000');
});