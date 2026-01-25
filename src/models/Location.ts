import mongoose from 'mongoose';

const DistrictSchema = new mongoose.Schema({
    name: String,
    thanas: [String]
});

const LocationSchema = new mongoose.Schema({
    division: {
        type: String,
        required: true,
        unique: true,
    },
    districts: [DistrictSchema]
}, {
    timestamps: true,
});

export default mongoose.models.Location || mongoose.model('Location', LocationSchema);
