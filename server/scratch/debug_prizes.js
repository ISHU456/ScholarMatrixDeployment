import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const checkPrizes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const prizes = await mongoose.connection.db.collection('prizes').find({}).toArray();
    console.log("Current Prizes in DB:");
    prizes.forEach((p, i) => {
      console.log(`${i+1}. Title: ${p.title}, Image: ${p.image}, Coins: ${p.coinsRequired}, Rank: ${p.rank}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkPrizes();
