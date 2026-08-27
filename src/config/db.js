const mongoose = require('mongoose');

const dbConnection = async () => {
  const dbUri = process.env.CLOUD_MONGO_URI;
  const conn = await mongoose.connect(dbUri);
  console.log(`MongoDB Connected: ${conn.connection.host}.✅`);
};

module.exports = dbConnection;