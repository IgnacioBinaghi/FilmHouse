import fs from 'fs';
import { get } from 'http';
import util from 'util';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

function addToDB(email, username, password) {
    try {
        let data = {username, email, password: password, userData: {}, films: {}, comments: [], friends: {}};
        let db = JSON.parse(fs.readFileSync('data.json', 'utf8'));
        db[username] = data;
        fs.writeFileSync('data.json', JSON.stringify(db, null, 2));
    } catch (err) {
        console.error(err);
        throw err;
    }
}

function getDBByUsername(username) {
    try {
        let db = JSON.parse(fs.readFileSync('data.json', 'utf8'));
        return db[username];
    } catch (err) {
        console.error(err);
        throw err;
    }
}

function getDB(){
    try {
        let db = JSON.parse(fs.readFileSync('data.json', 'utf8'));
        return db;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

function addFilmToDB(username, filmData) {
    try {
        let db = JSON.parse(fs.readFileSync('data.json', 'utf8'));
        filmData.filmData.comments = [];
        db[username].films[filmData.uuid] = filmData.filmData;
        fs.writeFileSync('data.json', JSON.stringify(db, null, 2));
    } catch (err) {
        console.error(err);
        throw err;
    }
}

function generateUniqueId() {
    return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
}

function getFilms(){
    const db = getDB();
    const films = [];

    for (let i = 0; i < Object.keys(db).length; i++){
        let username = Object.keys(db)[i];
        let uuid = Object.keys(db[Object.keys(db)[i]].films)[0];
        let currFilm = db[Object.keys(db)[i]].films;
        for (let u = 0; u < Object.keys(currFilm).length; u++){
            currFilm[Object.keys(currFilm)[u]]['uuid'] = uuid
            currFilm[Object.keys(currFilm)[u]]['username'] = username
            films.push(currFilm[Object.keys(currFilm)[u]]);
        }
    }
    return films;
}

function getFilmByUuid(uuid){
    const db = getDB();
    for (let i = 0; i < Object.keys(db).length; i++){
        let currFilm = db[Object.keys(db)[i]].films;
        for (let u = 0; u < Object.keys(currFilm).length; u++){
            if (Object.keys(currFilm)[u] === uuid){
                return currFilm[Object.keys(currFilm)[u]];
            }
        }
    }

}

function getUserFilms(username){
    const db = getDBByUsername(username);
    const films = [];

    let currFilms = db.films;
    for (let u = 0; u < Object.keys(currFilms).length; u++){
        currFilms[Object.keys(currFilms)[u]]['uuid'] = Object.keys(currFilms)[u]
        films.push(currFilms[Object.keys(currFilms)[u]]);
    }
    console.log(films);
    return films;
}

function deleteFilm(uuid){
    const db = getDB();
    for (let i = 0; i < Object.keys(db).length; i++){
        let currFilm = db[Object.keys(db)[i]].films;
        for (let u = 0; u < Object.keys(currFilm).length; u++){
            if (Object.keys(currFilm)[u] === uuid){
                delete db[Object.keys(db)[i]].films[uuid];
                fs.writeFileSync('data.json', JSON.stringify(db, null, 2));
                return;
            }
        }
    }
}

function updateComments(uuid, filmData){
    let db = getDB();
    for (let i = 0; i < Object.keys(db).length; i++){
        let currFilm = db[Object.keys(db)[i]].films;
        for (let u = 0; u < Object.keys(currFilm).length; u++){
            if (Object.keys(currFilm)[u] === uuid){
                db[Object.keys(db)[i]].films[uuid].comments = filmData.comments;
                fs.writeFileSync('data.json', JSON.stringify(db, null, 2));
                return;
            }
        }
    }
}

function getComments(uuid){
    const db = getFilmByUuid(uuid);
    console.log(db.comments);
    return db.comments;
}


export { addToDB, getDBByUsername, addFilmToDB, generateUniqueId, getDB, getFilms, getFilmByUuid, getUserFilms, deleteFilm, updateComments, getComments}