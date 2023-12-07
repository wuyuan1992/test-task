const { formatListToMap } = require('../utils/format');

class Task {
	constructor({ id, name, handler, options }) {
		this.id = id;
		this.name = name;
		this.handler = handler;

		this.dependencies = [];
		this.output = null;

		this.options = Object.assign({ logger: console.log, shouldLog: false }, options);
	}

	async run() {
		this.log(`[Task ${this.name}] start ------`);

		const input = this.getInput();
		this.log(`[Task ${this.name}] input:`, input);

		const output = await this.handler?.(input);
		this.log(`[Task ${this.name}] output:`, output);

		this.output = output;
	}

	log(...args) {
		if (this.options?.shouldLog) {
			this.options?.logger(...args);
		}
	}

	getInput() {
		return this.dependencies.reduce((map, dep) => {
			return Object.assign(map, { [dep.id]: dep.output });
		}, {});
	}

	dependOn(deps) {
		if (!Array.isArray(deps)) {
			if (!(deps instanceof Task)) throw new Error('invalid deps');
			deps = [deps];
		}

		const map = formatListToMap(this.dependencies);

		for (const dep of deps) {
			if (map[dep.id]) continue;

			map[dep.id] = dep;
			this.dependencies.push(dep);
		}
	}

	isDependOn(dep) {
		return this.dependencies.includes(dep);
	}
}

class TaskManager {
	constructor(tasks) {
		if (!this.validateTasks(tasks)) {
			throw new Error('Invalid relation');
		}

		this.tasks = tasks;
	}

	async run() {
		const queue = this.initializeQueue(this.tasks);

		for (const taskGroup of queue) {
			try {
				await Promise.all(taskGroup.map((task) => task.run()));
			} catch (err) {
				console.log('Group error', err, taskGroup);
				break;
			}
		}

		return this.getOutput(queue);
	}

	getOutput(queue) {
		if (!queue?.length) return null;
		return queue[queue.length - 1].reduce((map, dep) => Object.assign(map, { [dep.id]: dep.output }), {});
	}

	addRelation(target, deps) {
		const tasks = this.tasks.slice();
		const taskMap = formatListToMap(tasks);

		if (!(target instanceof Task) || !Array.isArray(deps) || deps.includes(target)) {
			throw new Error('invalid relation tot add');
		}

		if (!taskMap[target.id]) {
			tasks.push(target);
		}

		for (const dep of deps) {
			if (taskMap[dep.id]) continue;

			taskMap[dep.id] = dep;
			tasks.push(dep);
		}

		if (!this.validateTasks(tasks)) {
			throw new Error('Invalid relation');
		}

		this.tasks = tasks;
		target.dependOn(deps);
	}

	initializeQueue(tasks) {
		const result = [];
		let remainingTasks = tasks.slice();

		while (remainingTasks.length > 0) {
			const { executableTasks, remainingTasks: rest } = this.splitExecutableTasks(remainingTasks);
			if (!executableTasks?.length) break;

			result.push(executableTasks);
			remainingTasks = rest;
		}

		return result;
	}

	splitExecutableTasks(tasks) {
		const executableTasks = [];
		const remainingTasks = [];

		const taskMap = formatListToMap(tasks);

		for (const task of tasks) {
			const noDeps = Boolean(!task.dependencies?.length);
			if (noDeps) {
				executableTasks.push(task);
				continue;
			}

			const allDepsResolvedBefore = task.dependencies.every((dep) => !taskMap[dep.id]);
			if (allDepsResolvedBefore) {
				executableTasks.push(task);
				continue;
			}

			remainingTasks.push(task);
		}

		return { executableTasks, remainingTasks };
	}

	validateTasks(tasks) {
		// TODO
		return true;
	}

	showGraph() {
		// TODO
	}
}

module.exports = {
	Task,
	TaskManager,
};
