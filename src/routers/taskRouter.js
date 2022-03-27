const express = require('express');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/tasks', auth, async(req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(200).send(task);
    } catch (err) {
        res.status(400).send(err);
    }
})

// GET /tasks?done=true
// GET /tasks?limit=10&skip=10
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async(req, res) => {
    const match = {};
    const sort = {};

    if (req.query.done) { // Accessing key-value pairs specified in url
        match.done = req.query.done === 'true';
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1; // 1 for ascending and -1 for descending
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        })
        res.status(201).send(req.user.tasks);
    } catch (err) {
        res.status(500).send(err);
    }
})

router.get('/tasks/:id', auth, async(req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

        if (!task) res.status(404).send({ error: 'Task not found' });

        res.status(201).send(task);
    } catch (err) {
        res.status(404).send(err);
    }
})

router.patch('/tasks/:id', auth, async(req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['task', 'done'];
    const isAllowed = updates.every(item => allowedUpdates.includes(item));

    if (!isAllowed) return res.status(400).send({ error: 'Invalid updates!' });

    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

        if (!task) res.status(404).send({ error: 'Not found' });

        updates.forEach(update => task[update] = req.body[update]);
        await task.save();

        res.status(201).send(task);
    } catch (err) {
        res.status(500).send(err);
    }
})

router.delete('/tasks/:id', auth, async(req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

        if (!task) return res.status(404).send({ error: 'Task not found' });

        res.send(task);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
})


module.exports = router;