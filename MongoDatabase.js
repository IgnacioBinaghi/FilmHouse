const { MongoClient } = require("mongodb");
const { ObjectId } = require('mongodb');

function connectToDatabase() {
  const uri = "mongodb+srv://binaghiignacio:Vo7ABJDXTIycPFpp@cluster0.e4dydyw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
  const client = new MongoClient(uri);
  return client;
};

async function addUserToDatabase(email, username, password) {
  const client = connectToDatabase();
  const database = client.db('userData');
  const users = database.collection('users');

  await users.insertOne({ 'username': username, 'email': email, password: password, userData: {}, friends: {}, profileViews: 0});
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

  let currFilmData = { user, votes: 0, voters: {}, filmLink, filmName, bio, totalTimeSpent, numberOfPeopleInvolved, director, productionDesigner, dp, soundDesigner, costumeDesigner, editorialDepartment, actors, equipmentUsed, optionalDocuments, comments: [] }
  await filmData.insertOne(currFilmData);
  await client.close();
}

async function changeVotes(filmName, vote, user) {
  const client = connectToDatabase();
  const database = client.db('userData');
  const filmData = database.collection('filmData');

  let currFilm = await filmData.findOne({ filmName });

  if (user && !currFilm.voters[user]){
    currFilm.voters[user] = vote;
    currFilm.votes++;
    await filmData.updateOne(
      { 'filmName': filmName },
      { $set: { 'votes': currFilm.votes, 'voters': currFilm.voters } }
    );
    await client.close();
    return;
  }
  else if (!user){
    await client.close();
    return;
  }

  if (currFilm.voters[user] === vote){
    await client.close();
    return;
  } else if (currFilm.voters[user] !== vote){ // make it so when someone downvotes they can only change to upvote and vice versa but cant vote twice
    if (vote === 'up' && currFilm.voters[user] === 'down'){
      currFilm.votes++;
    }
    else if (vote === 'down' && currFilm.voters[user] === 'up'){
      currFilm.votes--;
    }
  }
  currFilm.voters[user] = vote;
  await filmData.updateOne(
    { 'filmName': filmName },
    { $set: { 'votes': currFilm.votes, 'voters': currFilm.voters } }
  );
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

async function updateComments(filmName, comment, username, parentCommentId = null) {
  const client = await connectToDatabase();
  const database = client.db('userData');
  const filmData = database.collection('filmData');

  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeString = currentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const timestamp = dateString + ' ' + timeString;

  if (parentCommentId) {
    // It's a reply to an existing comment
    let currFilm = await filmData.findOne({ 'filmName': filmName});
    let currComment = currFilm.comments.find(comment => comment._id == parentCommentId);

    await filmData.updateOne(
      { 'filmName': filmName, 'comments._id': new ObjectId(parentCommentId) },
      { $push: { 'comments.$.replies': { _id: new ObjectId(), text: comment, postedBy: username, repliedAt: timestamp, replies: [] } } }
    );
  } else {
    // It's a new parent comment
    await filmData.updateOne(
      { 'filmName': filmName },
      { $push: { 'comments': { _id: new ObjectId(), text: comment, postedBy: username, commentedAt: timestamp, replies: [] } } }
    );
  }
  await client.close();
}

async function getComments(filmName, skip = 0, limit = 10) {
  const client = await connectToDatabase();
  const database = client.db('userData');
  const filmData = database.collection('filmData');

  const film = await filmData.findOne(
      { filmName },
      { projection: { comments: { $slice: [skip, limit] } } }
  );
  await client.close();
  return film.comments;
}

async function deleteComment(filmName, commentId) {
  const client = await connectToDatabase();
  const database = client.db('userData');
  const filmData = database.collection('filmData');

  await filmData.updateOne(
    { 'filmName': filmName },
    { $pull: { 'comments': { _id: new ObjectId(commentId) } } }
  );
  await client.close();
}

async function addProfileView(user){
  const client = await connectToDatabase();
  const database = client.db('userData');
  const users = database.collection('users');


  //let newProfileViews = getUserData(user).profileViews++;
  let userViews = (await getUserData(user)).profileViews;

  let newProfileViews = userViews + 1;

  await users.updateOne(
  { 'username': user },
  { $inc: { 'profileViews': 1 } }
);
  await client.close();
}



module.exports = { addUserToDatabase, getUserData, getFilms, addFilmToDB, getFilmByName, getFilmsByUsername,
  deleteFilm, updateComments, getComments, deleteComment, changeVotes, addProfileView };
