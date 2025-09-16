const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const CTFchallenge = new Schema(
  {
    challengeNumber: { type: Number }, // unique: true, required: true
    title: { type: String, unique: true, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    difficulty: {
      type: String,
      required: true,
      enum: ["easy", "intermediate", "hard", "advanced"],
    },
    tags: [{ type: String }],
    // creator: { type: String, required: true },
    attachments: [{ type: String }],
    score: { type: Number, required: true },
    flag: { type: String, required: true },
    hints: [
      {
        text: { type: String },
        cost: { type: Number },
      },
    ],
    Author: { type: String , required: true},  
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("CTF_challenges", CTFchallenge);
