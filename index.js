const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const {
    addUserToDatabase,
    getUserData,
    getFilms,
    addFilmToDB,
    getFilmByName,
    getFilmsByUsername,
    deleteFilm,
    updateComments,
    getComments,
    deleteComment,
    changeVotes,
    addProfileView
} = require('./MongoDatabase'); // Assuming you've renamed MongoDatabase.mjs to MongoDatabase.js

const { sendEmail } = require('./sendEmail');
const e = require('express');

const app = express();
app.set('view engine', 'hbs');

const sessionOptions = {
    secret: 'super secret stuff',
    saveUninitialized: false,
    resave: false
};
app.use(session(sessionOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/register', (req, res) => { // GET /register
    if (req.session.loggedIn) {
        res.redirect('/');
    }
    res.render('register', {});
});

app.get('/register/:email/:username', (req, res) => { // GET /register
    if (req.session.loggedIn) {
        res.redirect('/');
    }
    const email = req.params.email;
    const username = req.params.username;
    res.render('register', {email, username});
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
        if (!user) {
            return res.render('login', { error: 'Invalid username or password' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (user && match) {
            req.session.loggedIn = true;
            req.session.username = username;
            res.redirect('/');
        } else {
            return res.render('login', { error: 'Invalid username or password' });
        }
    } catch (err) {
        return res.status(500).send('Server error');
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
        let constributors = [];
        let bio = '';
        const allFilmsFiltered = allFilms.map(film => { // filtering film object to make sure only items in film with data are displayed, with the exception of comments
            return Object.fromEntries(Object.entries(film).filter(([key, value]) => {
                if (key === 'comments') {
                    return true;
                }
                else if (key === 'bio') {
                    bio = value;
                    return true;
                }
                else if (key === 'contributors') {
                    constributors = value;
                    return true;
                }
                return value !== '';
            }));
        });
        res.render('dashboard', { films: allFilmsFiltered, user: req.session.username, contributors: constributors, bio: bio});
    }
});

app.get('/vote/:filmName/:voteType', async (req, res) => {
    const filmName = req.params.filmName;
    const film = await getFilmByName(filmName);
    
    if (req.params.voteType === 'up') {
        await changeVotes(filmName, 'up', req.session.username);
    }
    else{
        await changeVotes(filmName, 'down', req.session.username);
    }

    if (req.headers.referer) {
        const referer = req.headers.referer.split('/');
        if (referer[3] === 'film') {
            res.redirect(`/film/${filmName}`);
            return;
        }
    }
    res.redirect('/');
});

app.post('/comment/:filmName', (req, res) => {
    const filmName = req.params.filmName;
    const comment = req.body.comment;

    updateComments(filmName, comment, req.session.username);

    // get current page and redirect accordingly
    // if in /film/:filmName, redirect to /film/:filmName
    // else redirect to /
    if (req.headers.referer) {
        const referer = req.headers.referer.split('/');
        if (referer[3] === 'film') {
            res.redirect(`/film/${filmName}`);
            return;
        }
    }
    res.redirect('/');
});

app.post('/replyComment/:filmName', (req, res) => {
    console.log(req.body);
    const { parentCommentId, reply } = req.body;
    const filmName = req.params.filmName;

    updateComments(filmName, reply, req.session.username, parentCommentId);
    res.redirect('/');
});

app.get('/getComments/:filmName/:skip/:limit', async (req, res) => {
    const { filmName, skip, limit } = req.params;
    const comments = await getComments(filmName, parseInt(skip), parseInt(limit));
    res.json(comments);
});

app.get('/deleteComment/:filmName/:commentId', async (req, res) => {
    const { filmName, commentId } = req.params;
    await deleteComment(filmName, commentId);
    res.redirect('/');
});


app.get('/myProfile', async (req, res) => {
    if (!req.session.loggedIn) { // If the user is not logged in, redirect to login
        res.redirect('/login');
    } else { // If the user is logged in, show the home page
        let myFilms = await getFilmsByUsername(req.session.username);
        let profileViews = await getUserData(req.session.username);
        res.render('myProfile', {username: req.session.username, myFilms: myFilms, profileViews: profileViews.profileViews.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")});
    }
});

app.post('/deleteFilm/:filmName', async (req, res) => {
    const filmName = req.params.filmName;
    await deleteFilm(req.session.username, filmName);
    res.redirect('/myProfile'); // Redirect back to the profile page after deletion
});


app.get('/uploadFilm', (req, res) => {
    if (!req.session.loggedIn) { // If the user is not logged in, redirect to login
        res.redirect('/login');
    } else { // If the user is logged in, show the home page
        res.render('uploadFilm');
    }
})

function extractVideoID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);

    return (match && match[2].length == 11) ? match[2] : null;
}

app.post('/confirmFilm', (req, res) => {
    const filmLink = req.body.filmLink;
    const slicedLink = extractVideoID(filmLink);

    res.render('confirmFilm', {filmLink: slicedLink});
});

app.get('/uploadFilmData/:filmLink', (req, res) => {
    res.render('uploadFilmData', {filmLink: req.params.filmLink});
});

app.post('/uploadFilm', (req, res) => {
    let filmLink = req.body.filmLink;
    let filmName = req.body.filmName;
    let filmDescription = req.body.filmDescription;
    let contributorType = req.body.contributorType;
    let contributorName = req.body.contributorName;
    let totalTimeSpent = req.body.totalTimeSpent;
    let contributorOther = req.body.contributorOther;


    const contributors = []; // { contributorType: contributorName }
    let currIndex = 0;
    contributorType.map((curr, index) => { // map contributorType to contributorName
        if (curr === 'other') {
            contributors.push({contributorType: contributorOther[currIndex], contributorName: contributorName[index]});
            currIndex++;
            return;
        }
        return contributors.push({contributorType: curr, contributorName:contributorName[index]});
    });

    addFilmToDB(req.session.username, filmLink, filmName, filmDescription, totalTimeSpent, contributors);
    res.redirect('/');
});

app.get('/newAccount', async (req, res) => { // to be implemented in the future when tagging new people
    const { email, username } = req.query;
    console.log(email, username);
    await sendEmail(email, `http://localhost:3000/register/${email}/${username}`);
    res.redirect('/');
});


app.get('/film/:filmName', async (req, res) => {
    const filmName = req.params.filmName;
    const film = await getFilmByName(filmName);
    const comments = await getComments(filmName, 0, 10);
    // filtering film object to make sure only items in film with data are displayed, with the exception of comments
    const filteredFilm = Object.fromEntries(Object.entries(film).filter(([key, value]) => {
        if (key === 'comments') {
            return true;
        }
        else if (key === 'bio') {
            bio = value;
            return true;
        }
        else if (key === 'contributors') {
            constributors = value;
            return true;
        }
        return value !== '';
    }));
    res.render('film', { film: filteredFilm, comments: comments, bio: bio});
});

app.get('/user/:username', async (req, res) => {
    const username = req.params.username;
    if (username === req.session.username) {
        res.redirect('/myProfile');
        return;
    }
    const user = await getUserData(username);
    const userFilms = await getFilmsByUsername(username);

    addProfileView(username);

    res.render('profile', { username: user.username , films: userFilms});
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});