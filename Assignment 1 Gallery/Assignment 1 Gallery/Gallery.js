const path = require("path");
const exp = require("express");
const fs = require("fs");
const exphbs = require("express-handlebars");
const session = require("client-sessions");
const randomstring = require("randomstring");
const lBl = require("line-by-line");

const myApp = exp();
const myPORT = process.env.myPORT || 3000;

myApp.use(session({
    cookieName: 'session',
    secret: randomstring.generate(), 
    duration: 24 * 60 * 60 * 1000, 
    activeDuration: 30 * 60 * 1000, 
}));

myApp.set('views', path.join(__dirname, 'views'));
myApp.set('view engine', 'hbs');
myApp.engine('hbs', exphbs({
    extname: 'hbs',
    defaultLayout: 'main', 
    layoutsDir: path.join(__dirname, 'views', 'layouts') 
}));

myApp.use(exp.static(path.join(__dirname, 'public', 'Pictures')));
myApp.use(exp.urlencoded({ extended: true }));

const uDataP = path.join(__dirname, 'user.json');
let uData = {};
fs.readFile(uDataP, 'utf8', (err, data) => {
    if (err) {
        console.error("Error reading user data:", err);
    } else {
        try {
            uData = JSON.parse(data);
        } catch (error) {
            console.error("Error parsing user data:", error);
        }
    }
});

myApp.get('/', (req, res) => {
    res.render('login');
});

myApp.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (uData[username] && uData[username] === password) {
        req.session.user = username;
        res.redirect('/templating');
    } else {
        res.render('login', { error: 'Invalid username or password' });
    }
});

myApp.get('/templating', (req, res) => {

    if (!req.session.user){
        res.redirect('/');
    }else{
        const pic = new lBl('ImageList.txt');
        let picNames = [];
        pic.on('line', line => {
        picNames.push(line);
    });

    pic.on('end', () => {
        res.render('templating', { username: req.session.user, picNames });
    });
}
    
});

myApp.get('/AllPics/:picName', (req, res) => {
    const picName = req.params.picName;
    const picPath = path.join(__dirname, 'public', 'Pictures', picName);

    fs.access(picPath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(err);
            res.status(404).send('Image not found');
        } else {
            res.sendFile(picPath);
        }
    });
});

myApp.get('/logout', (req, res) => {
    req.session.reset();
    res.redirect('/');
});

myApp.listen(myPORT, () => {
    console.log('Running on http://localhost:${myPORT}');
});