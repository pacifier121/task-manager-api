const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');


router.post('/users', async(req, res) => {
    const user = new User(req.body);
    try {
        await user.save();

        const token = await user.generateAuthToken();

        res.status(201).send({ user, token });
    } catch (err) {
        res.status(400).send(err);
    }
})

router.post('/users/login', async(req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password); // Checking login credentials are valid or not

        const token = await user.generateAuthToken(); // For getting jwt token

        res.status(200).send({ user, token });
    } catch (err) {
        res.status(400).send(err);
    }
})

router.post('/users/logout', auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)

        await req.user.save();

        res.status(200).send();
    } catch (err) {
        res.status(500).send();
    }
})

router.post('/users/logoutAll', auth, async(req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();

        res.status(200).send();
    } catch (err) {
        res.status(500).send();
    }
})

const uploadAvatar = multer({
    limits: {
        fileSize: Math.pow(10, 6)
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            cb(new Error('Please upload a valid file!'))
        }
        cb(undefined, true);
    }
})

router.post('/users/me/avatar', auth, uploadAvatar.single('uploadAvatar'), async(req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer;

    await req.user.save();
    res.send('Avatar uploaded successfully!');
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, async(req, res) => {
    req.user.avatar = undefined;
    await req.user.save();

    res.send('Avatar removed!');
})

router.get('/users/me', auth, async(req, res) => {
    res.send(req.user);
})

router.get('/users/:id', async(req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user) res.status(404).send('No such user found');

        res.status(201).send(user);
    } catch (err) {
        res.status(404).send(err);
    }
})

router.patch('/users/me', auth, async(req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password'];
    const isAllowed = updates.every(item => {
        return allowedUpdates.includes(item);
    })

    if (!isAllowed) res.status(400).send({ error: 'Invalid update!' });

    try {
        updates.forEach(update => req.user[update] = req.body[update]);
        req.user.save();

        res.send(req.user);
    } catch (err) {
        res.status(500).send(err);
    }
})

router.delete('/users/me', auth, async(req, res) => {
    try {
        await req.user.remove();
        res.send(req.user);
    } catch (err) {
        res.status(500).send(err);
    }
})

router.get('/users/:id/avatar', async(req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/png') // To send back the Content-Type of header of response as jpg image
        res.send(user.avatar)
    } catch (err) {
        res.status(404).send();
    }
})

module.exports = router;