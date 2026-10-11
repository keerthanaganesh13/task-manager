
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const taskData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'task.json'), 'utf8')
);

let tasks = taskData.tasks || [];

const priorities = ['low', 'medium', 'high'];

// Validate task data
const isValidTaskPayload = (task) => {
  return (
    task !== null &&
    typeof task === 'object' &&
    !Array.isArray(task) &&
    typeof task.title === 'string' &&
    task.title.trim() !== '' &&
    typeof task.description === 'string' &&
    task.description.trim() !== '' &&
    typeof task.completed === 'boolean' &&
    priorities.includes(task.priority)
  );
};

// Find task by ID
const getTaskById = (id) => {
  const taskId = Number(id);
  return tasks.find((task) => task.id === taskId);
};

// GET all tasks with filtering and sorting
app.get('/tasks', (req, res) => {
  let result = [...tasks];

  // Filter by completion status
  if (req.query.completed !== undefined) {
    if (!['true', 'false'].includes(req.query.completed)) {
      return res.status(400).json({
        message: 'completed must be true or false',
      });
    }

    const completed = req.query.completed === 'true';

    result = result.filter(
      (task) => task.completed === completed
    );
  }

  // Sort by creation date
  if (req.query.sort !== undefined) {
    const sort = req.query.sort;

    if (!['asc', 'desc'].includes(sort)) {
      return res.status(400).json({
        message: 'sort must be asc or desc',
      });
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      return sort === 'asc'
        ? dateA - dateB
        : dateB - dateA;
    });
  }

  res.status(200).json(result);
});

// GET tasks by priority
app.get('/tasks/priority/:level', (req, res) => {
  const level = req.params.level;

  if (!priorities.includes(level)) {
    return res.status(400).json({
      message: 'Priority must be low, medium, or high',
    });
  }

  const result = tasks.filter(
    (task) => task.priority === level
  );

  res.status(200).json(result);
});

// GET task by ID
app.get('/tasks/:id', (req, res) => {
  const task = getTaskById(req.params.id);

  if (!task) {
    return res.status(404).json({
      message: 'Task not found',
    });
  }

  res.status(200).json(task);
});

// POST: Create a task
app.post('/tasks', (req, res) => {
  const newTask = req.body;

  if (!isValidTaskPayload(newTask)) {
    return res.status(400).json({
      message: 'Invalid task data',
    });
  }

  const taskId = tasks.length
    ? Math.max(...tasks.map((task) => task.id)) + 1
    : 1;

  const createdTask = {
    id: taskId,
    title: newTask.title.trim(),
    description: newTask.description.trim(),
    completed: newTask.completed,
    priority: newTask.priority,
    createdAt: new Date().toISOString(),
  };

  tasks.push(createdTask);

  res.status(201).json(createdTask);
});

// PUT: Update a task
app.put('/tasks/:id', (req, res) => {
  const task = getTaskById(req.params.id);

  if (!task) {
    return res.status(404).json({
      message: 'Task not found',
    });
  }

  const updatedData = req.body;

  if (!isValidTaskPayload(updatedData)) {
    return res.status(400).json({
      message: 'Invalid task data',
    });
  }

  const taskIndex = tasks.findIndex(
    (item) => item.id === task.id
  );

  tasks[taskIndex] = {
    ...tasks[taskIndex],
    title: updatedData.title.trim(),
    description: updatedData.description.trim(),
    completed: updatedData.completed,
    priority: updatedData.priority,
  };

  res.status(200).json(tasks[taskIndex]);
});

// DELETE: Remove a task
app.delete('/tasks/:id', (req, res) => {
  const task = getTaskById(req.params.id);

  if (!task) {
    return res.status(404).json({
      message: 'Task not found',
    });
  }

  tasks = tasks.filter((item) => item.id !== task.id);

  res.status(200).json({
    message: 'Task deleted successfully',
  });
});

if (require.main === module) {
  app.listen(port, (err) => {
    if (err) {
      return console.log('Something bad happened', err);
    }

    console.log(`Server is listening on ${port}`);
  });
}

module.exports = app;
