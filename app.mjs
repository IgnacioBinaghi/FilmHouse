import express from 'express';
import session from 'express-session';
import fs from 'fs';
import util from 'util';
import { getDBByUsername, addToDB, addFilmToDB, getFilms, generateUniqueId, getFilmByUuid, getUserFilms, deleteFilm, updateComments, getComments } from './helper.mjs';

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
    try {
        const user = await getDBByUsername(username);
        if (user) {
            res.render('register', { error: 'Username already taken' });
        } else {
            addToDB(email, username, password);
            req.session.loggedIn = true;
            req.session.username = username;
            res.redirect('/');
        }
    } catch (err) {
        res.status(500).send('Server error');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (username === '' || password === '') {
        return res.render('login', { error: 'Username and password are required' });
    }


    try {
        const user = await getDBByUsername(username);
        if (user && password === user.password) {
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


app.get('/', (req, res) => {
    if (!req.session.loggedIn) { // If the user is not logged in, redirect to login
        res.redirect('/login');
    } else { // If the user is logged in, show the home page
        let allFilms = getFilms()
        res.render('dashboard', {films : allFilms});
    }
});

app.post('/comment/:uuid', (req, res) => {
    const uuid = req.params.uuid;
    const comment = req.body.comment;
    const film = getFilmByUuid(uuid);
    film.comments.push({username: req.session.username, comment: comment});
    updateComments(uuid, film);
    res.redirect('/');
});

app.get('/myProfile', (req, res) => {
    if (!req.session.loggedIn) { // If the user is not logged in, redirect to login
        res.redirect('/login');
    } else { // If the user is logged in, show the home page
        res.render('myProfile', {username: req.session.username, myFilms: getUserFilms(req.session.username)});
    }
});

app.post('/deleteFilm/:uuid', (req, res) => {
    const filmId = req.params.uuid;
    deleteFilm(filmId);
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
    const filmData = {filmLink: filmLink.slice(32, ), filmName, bio, totalTimeSpent,  numberOfPeopleInvolved, director, productionDesigner, dp, soundDesigner, costumeDesigner, editorialDepartment, actors, equipmentUsed, optionalDocuments};
    const filmUploadData = {uuid:generateUniqueId(), filmData};
    addFilmToDB(req.session.username, filmUploadData);
    res.redirect('/');
});

app.get('/:uuid', (req, res) => {
    const uuid = req.params.uuid;
    const film = getFilmByUuid(uuid);
    res.render('film', { film: film });
});


app.listen(3000);