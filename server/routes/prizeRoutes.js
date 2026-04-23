import express from 'express';
import multer from 'multer';
import { storage } from '../config/cloudinary.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import Prize from '../models/Prize.js';

const router = express.Router();
const upload = multer({ storage });

// Get all prizes
router.get('/', protect, async (req, res) => {
  try {
    const prizes = await Prize.find({}).sort({ rank: 1 });
    res.json(prizes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create prize (Admin) - Supports image upload
router.post('/', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const { title, description, coinsRequired, category, rank, stock } = req.body;
    const imageUrl = req.file ? req.file.path : '';
    
    const prize = await Prize.create({
      title,
      description,
      coinsRequired: Number(coinsRequired),
      category,
      rank: Number(rank || 0),
      stock: Number(stock || -1),
      image: imageUrl
    });
    
    res.status(201).json(prize);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update prize (Admin)
router.put('/:id', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = req.file.path;
    }
    
    const prize = await Prize.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(prize);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete prize (Admin)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    await Prize.findByIdAndDelete(req.params.id);
    res.json({ message: "Prize removed from registry" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
