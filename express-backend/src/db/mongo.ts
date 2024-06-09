import mongoose from 'mongoose';

console.log('Mongoose connected from global.');
await mongoose.connect(process.env.MONGO_URI!);
