export function createWidget() {
    const container = document.createElement("div");
    container.id = "todo-widget";
    container.className = "widget glass";
    container.style.overflowY = "scroll";

    container.innerHTML = `
        <div class="close-btn">&#x2715;</div>
        <div class="drag-btn"><img src="../assets/other/drag.png"></div>
        <div>
            <h2 class="todo-title">To-Do List</h2>
            <form class="todo-form">
                <input type="text" placeholder="Add a task..." class="todo-input" />
                <button type="submit" class="add-btn">+</button>
            </form>
            <ul class="todo-list"></ul>
        </div>
    `;

    const form = container.querySelector(".todo-form");
    const input = container.querySelector(".todo-input");
    const list = container.querySelector(".todo-list");

    let tasks = loadTasks();
    renderTasks();

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text) {
            tasks.push({ id: Date.now(), text, done: false });
            saveTasks();
            renderTasks();
            input.value = "";
        }
    });

    function renderTasks() {
        list.innerHTML = "";
        tasks.forEach(task => {
            const li = document.createElement("li");
            li.className = "todo-item";
            li.innerHTML = `
                <input type="checkbox" ${task.done ? "checked" : ""} data-id="${task.id}">
                <span style="width: 100%;" class="task-text ${task.done ? "done" : ""}">${task.text}</span>
                <button class="delete-btn" data-id="${task.id}">🗑️</button>
            `;
            list.appendChild(li);
        });
    }

    list.addEventListener("click", (e) => {
        const id = Number(e.target.dataset.id);
        if (e.target.matches("input[type='checkbox']")) {
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.done = e.target.checked;
                saveTasks();
                renderTasks();
            }
        } else if (e.target.matches(".delete-btn")) {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
        }
    });

    function loadTasks() {
        try {
            const data = localStorage.getItem("todo-tasks");
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    function saveTasks() {
        localStorage.setItem("todo-tasks", JSON.stringify(tasks));
    }

    return container;
}
