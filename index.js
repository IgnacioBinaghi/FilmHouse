const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const {
    addUserToDatabase,
    getUserData,
    getFilms,
    addFilmToDB,
    getFilmByName,
    getFilmsByUsername,
    deleteFilm,
    updateComments,
    getComments
} = require('./MongoDatabase'); // Assuming you've renamed MongoDatabase.mjs to MongoDatabase.js

const app = express();
app.set('view engine', 'hbs');

const sessionOptions = {
    secret: 'super secret stuff',
    saveUninitialized: false,
    resave: false
};
app.use(session(sessionOptions));
app.use(express.urlencoded({ extended: false }));


app.get('/register', (req, res) => { // GET /register
    if (req.session.loggedIn) {
        res.redirect('/');
    }
    res.render('register', {});
});

app.post('/register', async (req, res) => {
    const { email, username, password } = req.body;
    if (username === '' || password === '' || email === '') {
        return res.render('register', { error: 'Email, username, and password are required' });
    }
    const user = await getUserData(username);
    if (user) {
        return res.render('register', { error: 'Username already taken' });
    } else {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        addUserToDatabase(email, username, hashedPassword);
        req.session.loggedIn = true;
        req.session.username = username;
        res.redirect('/');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (username === '' || password === '') {
        return res.render('login', { error: 'Username and password are required' });
    }


    try {
        const user = await getUserData(username);
        const match = await bcrypt.compare(password, user.password);
        if (user && match) {
            req.session.loggedIn = true;
            req.session.username = username;
            res.redirect('/');
        } else {
            res.render('login', { error: 'Invalid username or password' });
        }
    } catch (err) {
        res.status(500).send('Server error');
    }
});


app.get('/login', (req, res) => { // GET /login
    if (req.session.loggedIn) {
        res.redirect('/');
    }
    res.render('login', {});
});

app.get('/logout', (req, res) => { // GET /logout
    req.session.destroy(); // Destroy the session
    res.redirect('/login');
});


app.get('/', async (req, res) => {
    if (!req.session.loggedIn) { // If the user is not logged in, redirect to login
        res.redirect('/login');
    } else { // If the user is logged in, show the home page
        let allFilms = await getFilms()
        res.render('dashboard', { films: allFilms });
    }
});

app.post('/comment/:filmName', (req, res) => {
    const filmName = req.params.filmName;
    const comment = req.body.comment;
    const film = getFilmByName(filmName);
    let CommentUuid = generateUniqueId();
    let commentData = {CommentUuid: CommentUuid, username: req.session.username, comment};
    film.comments.push(commentData);
    updateComments(uuid, film);
    res.redirect('/');
});

app.post('/replyComment/:commentid/:uuid', (req, res) => {
    console.log(commentid, uuid, req.body.reply)
    const commentid = req.params.commentid;
    const uuid = req.params.uuid;
    const reply = req.body.reply;
    const film = getFilmByUuid(uuid);
    for (let i = 0; i < film.comments.length; i++){
        if (film.comments[i].CommentUuid === commentid){
            if (!film.comments[i].replies){
                film.comments[i].replies = [];
                film.comments[i].replies.push({replyUuid: generateUniqueId(), username: req.session.username, reply});
            }
            else{
                film.comments[i].replies.push({replyUuid: generateUniqueId(), username: req.session.username, reply});
            }
        }
        break;
    }
    updateComments(uuid, film);
    res.redirect('/');
});

app.get('/myProfile', (req, res) => {
    if (!req.session.loggedIn) { // If the user is not logged in, redirect to login
        res.redirect('/login');
    } else { // If the user is logged in, show the home page
        res.render('myProfile', {username: req.session.username, myFilms: getFilmsByUsername(req.session.username)});
    }
});

app.post('/deleteFilm/:filmName', (req, res) => {
    const filmName = req.params.filmName;
    deleteFilm(req.session.username, filmName);
    res.redirect('/'); // Redirect back to the profile page after deletion
});


app.get('/uploadFilm', (req, res) => {
    if (!req.session.loggedIn) { // If the user is not logged in, redirect to login
        res.redirect('/login');
    } else { // If the user is logged in, show the home page
        res.render('uploadFilm');
    }
})

app.post('/uploadFilm', (req, res) => {
    const { filmLink, filmName, bio, totalTimeSpent,  numberOfPeopleInvolved, director, productionDesigner, dp, soundDesigner, costumeDesigner, editorialDepartment, actors, equipmentUsed, optionalDocuments} = req.body;
    addFilmToDB(req.session.username, filmLink.slice(32, ), filmName, bio, totalTimeSpent,  numberOfPeopleInvolved, director, productionDesigner, dp, soundDesigner, costumeDesigner, editorialDepartment, actors, equipmentUsed, optionalDocuments);
    res.redirect('/');
});

app.get('/film/:filmName', async (req, res) => {
    const filmName = req.params.filmName;
    const film = await getFilmByName(filmName);
    res.render('film', { film: film });
});

app.get('/user/:username', async (req, res) => {
    const username = req.params.username;
    const user = await getUserData(username);
    const userFilms = await getFilmsByUsername(username);
    res.render('profile', { username: user.username , films: userFilms});
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});