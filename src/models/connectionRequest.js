const mongoose = require('mongoose');
const User = require('./user');

const sendConnectionRequestSchema = new mongoose.Schema({
    fromuserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        required: true
    },
    touserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: {
            values: ["pass", "like", "accepted", "rejected"],
            message: `{VALUE} is incorrect Status Type` 
        }
    }
},
{timestamps: true}
);

sendConnectionRequestSchema.index({fromuserId: 1, touserId: 1})

sendConnectionRequestSchema.pre( 'save', function (next) {
    const ConnectionRequest = this;
    if(ConnectionRequest.fromuserId.equals(ConnectionRequest.touserId)){
        throw new Error("YOU CAN NOT SEND REQUEST TO YOURSELF");
    };
    next();
});

const ConnectionRequest = new mongoose.model('connectionRequest', sendConnectionRequestSchema);

module.exports = ConnectionRequest;