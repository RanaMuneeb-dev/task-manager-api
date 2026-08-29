const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const Task = require('../models/Task');

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks of logged in user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user tasks
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed]
 *     responses:
 *       201:
 *         description: Task created
 */

// 1. CREATE TASK (Post)
router.post(
  '/',
  [authMiddleware, [body('title', 'Title is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const newTask = new Task({
        user: req.user,
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
      });

      const task = await newTask.save();
      res.status(201).json(task);
    } catch (err) {
      res.status(500).send('Server error');
    }
  }
);

// 2. READ ALL TASKS (Get)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get single task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task detail
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed]
 *     responses:
 *       200:
 *         description: Task updated
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted
 */

// 3. READ SINGLE TASK BY ID (Get)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.user.toString() !== req.user) return res.status(401).json({ message: 'Not authorized' });

    res.json(task);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// 4. UPDATE TASK (Put)
router.put('/:id', authMiddleware, async (req, res) => {
  const { title, description, status } = req.body;
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.user.toString() !== req.user) return res.status(401).json({ message: 'Not authorized' });

    task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: { title, description, status } },
      { new: true }
    );
    res.json(task);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// 5. DELETE TASK (Delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.user.toString() !== req.user) return res.status(401).json({ message: 'Not authorized' });

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task removed successfully' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;