const validator = require('validator');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./Task');

// Creating user schema
const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) throw new Error('Invalid email!');
        }
    },
    password: {
        type: String,
        required: true,
        validate(value) {
            if (value.length < 6) throw new Error('Please enter password of at least 6 characters.')
            if (value.search('password') !== -1) throw new Error('Please do not include "password" in your password.')
        }
    },
    age: {
        type: Number,
        vaidate(value) {
            if (value < 0) throw new Error('Invalid age!');
        }
    },
    avatar: {
        type: Buffer
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
})

// Sending only relevant information about the user
userSchema.methods.toJSON = function() {
    const user = this.toObject();

    user.password = undefined;
    user.tokens = undefined;
    user.avatar = undefined;

    return user;
}

// To create a relationship between user and their tasks
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

// For generating jwt token for a user
userSchema.methods.generateAuthToken = async function() {
    const user = this;

    const token = jwt.sign({ _id: user._id.toString() }, process.env.secretKey, { expiresIn: '3 days' });

    user.tokens = user.tokens.concat({ token });
    user.save();

    return token;
}

// For checking login credentials of users
userSchema.statics.findByCredentials = async(email, password) => {
    const user = await User.findOne({ email });

    if (!user) throw new Error('Unable to login');

    const isMatch = bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Unable to login');

    return user;
}

// Hashing the password before saving
userSchema.pre('save', async function(next) {
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
})

// Deleting the user along with all of his tasks
userSchema.pre('remove', async function(next) {
    const user = this;

    await Task.deleteMany({ owner: user._id });

    next();
})

// Creating User model
const User = mongoose.model('User', userSchema);

module.exports = User;