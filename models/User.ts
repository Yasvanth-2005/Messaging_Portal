import mongoose from "mongoose"

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  mobile: {
    type: String,
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
  },
  image: {
    type: String,
  },
  provider: {
    type: String,
    enum: ["credentials", "google"],
    default: "credentials",
  },
}, {
  timestamps: true,
})

export default mongoose.models.User || mongoose.model("User", UserSchema)
