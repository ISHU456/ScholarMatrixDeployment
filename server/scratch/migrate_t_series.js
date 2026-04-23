import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const migrateToTSeries = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for T-series image migration");
    
    const db = mongoose.connection.db;
    
    // 1. Migrate Prizes
    const prizesCollection = db.collection('prizes');
    await prizesCollection.updateMany(
      { title: /1st/i },
      { $set: { image: "/prizes/t1.png" } }
    );
    await prizesCollection.updateMany(
      { title: /2nd/i },
      { $set: { image: "/prizes/t2.png" } }
    );
    await prizesCollection.updateMany(
      { title: /3rd/i },
      { $set: { image: "/prizes/t3.png" } }
    );

    // 2. Migrate Orders (Matching by prize image or title)
    const ordersCollection = db.collection('orders');
    await ordersCollection.updateMany(
      { prizeTitle: /1st/i },
      { $set: { prizeImage: "/prizes/t1.png" } }
    );
    await ordersCollection.updateMany(
      { prizeTitle: /2nd/i },
      { $set: { prizeImage: "/prizes/t2.png" } }
    );
    await ordersCollection.updateMany(
      { prizeTitle: /3rd/i },
      { $set: { prizeImage: "/prizes/t3.png" } }
    );

    console.log("Migration to T-series images completed.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

migrateToTSeries();
