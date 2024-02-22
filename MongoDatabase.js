const { MongoClient } = require("mongodb");

function connectToDatabase() {
  const uri = "mongodb+srv://binaghiignacio:Vo7ABJDXTIycPFpp@cluster0.e4dydyw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
  const client = new MongoClient(uri);
  return client;
};

async function addUserToDatabase(email, username, password) {
  const client = connectToDatabase();
  const database = client.db('userData');
  const users = database.collection('users');

  await users.insertOne({ 'username': username, 'email': email, password: password, userData: {}, friends: {} });
  await client.close();
};

async function getUserData(username) {
  const client = connectToDatabase();
  const database = client.db('userData');
  const users = database.collection('users');

  const user = await users.findOne({ username });
  await client.close();
  return user;
}

async function getFilms() {
  const client = connectToDatabase();
  const database = client.db('userData');
  const filmData = database.collection('filmData');

  const films = await filmData.find({}).toArray();
  await client.close();
  return films;
}

async function addFilmToDB(user, filmLink, filmName, bio, totalTimeSpent, numberOfPeopleInvolved, director, productionDesigner, dp, soundDesigner, costumeDesigner, editorialDepartment, actors, equipmentUsed, optionalDocuments) {
  const client = connectToDatabase();
  const database = client.db('userData');
  const filmData = database.collection('filmData');

  let currFilmData = { user, filmLink, filmName, bio, totalTimeSpent, numberOfPeopleInvolved, director, productionDesigner, dp, soundDesigner, costumeDesigner, editorialDepartment, actors, equipmentUsed, optionalDocuments, comments: [] }
  await filmData.insertOne(currFilmData);
  await client.close();
}

async function getFilmByName(filmName) {
  const client = connectToDatabase();
  const database = client.db('userData');
  const filmData = database.collection('filmData');

  const film = await filmData.findOne({ filmName });
  await client.close();
  return film;
}

async function getFilmsByUsername(username) {
  const client = connectToDatabase();
  const database = client.db('userData');
  const filmData = database.collection('filmData');

  const films = await filmData.find({ user: username }).toArray();
  await client.close();
  return films;
}

async function deleteFilm(username, filmName) {
  const client = connectToDatabase();
  const database = client.db('userData');
  const filmData = database.collection('filmData');

  await filmData.deleteOne({ user: username, filmName: filmName });
  await client.close();
}

async function updateComments(filmName, comments) {
  const client = connectToDatabase();
  const database = client.db('userData');
  const filmData = database.collection('filmData');

  await filmData.updateOne({ filmName }, { $set: { comments } });
  await client.close();
}

async function getComments(filmName) {
  const client = connectToDatabase();
  const database = client.db('userData');
  const filmData = database.collection('filmData');

  const film = await filmData.findOne({ filmName });
  await client.close();
  return film.comments;
}

module.exports = { addUserToDatabase, getUserData, getFilms, addFilmToDB, getFilmByName, getFilmsByUsername, deleteFilm, updateComments, getComments };
