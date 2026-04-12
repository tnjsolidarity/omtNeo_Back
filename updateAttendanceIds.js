const mongoose = require('mongoose');
require('dotenv').config();
const Counter = require('./models/Counter');

async function updateAttendanceIds() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const collection = db.collection('attendances');

    const docs = await collection.find({ attendanceId: null }).toArray();
    console.log('Found ' + docs.length + ' documents with null attendanceId');

    for (let i = 0; i < docs.length; i++) {
      const year = new Date().getFullYear();
      const counter = await Counter.findOneAndUpdate(
        { name: `attendanceId-${year}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const attendanceId = `ATT-${year}-${String(counter.seq).padStart(4, '0')}`;
      await collection.updateOne({ _id: docs[i]._id }, { $set: { attendanceId } });
      console.log('Updated document ' + (i+1) + ' with attendanceId: ' + attendanceId);
    }

    console.log('All documents updated successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

updateAttendanceIds();