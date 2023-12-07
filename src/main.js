const { Task, TaskManager } = require('./modules/Task');

async function main() {
  const task1 = new Task({
    id: 1,
    name: 'task1',
    handler: () => {
      return new Promise((resolve) => {
        setTimeout(() => resolve('This is task1.' + Math.random()), 3000);
      });
    },
  });

  const task2 = new Task({
    id: 2,
    name: 'task2',
  });

  const task3 = new Task({
    id: 3,
    name: 'task3',
  });

  const task4 = new Task({
    id: 4,
    name: 'task4',
    handler: () => `This is task4.`,
  });

  const tasks = [task1, task2, task3, task4];

  task2.dependOn(task1);
  task2.handler = (input) => {
    return `This is task2. Prev is:「${input[task1.id]}」`;
  };

  task3.dependOn([task2, task4]);
  task3.handler = (input) => {
    return `This is task3. Prev2 is:「${input[task2.id]}」; Prev4 is:「${input[task4.id]}」`;
  };

  const taskManager = new TaskManager(tasks);

  const task5 = new Task({
    id: 5,
    name: 'task5',
  });

  taskManager.addRelation(task5, [task1, task3]);
  task5.handler = (input) => {
    return `This is task5. Prev1 is:「${input[task1.id]}」; Prev3 is:「${input[task3.id]}」`;
  };

  const result = await taskManager.run();

  console.log(result);
}

main();
