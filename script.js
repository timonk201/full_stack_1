const themeBtn = document.querySelector("#themeBtn");
const greetBtn = document.querySelector("#greetBtn");

themeBtn.addEventListener("click", function () {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        themeBtn.textContent = "Светлая тема";
    } else {
        themeBtn.textContent = "Тёмная тема";
    }
});

greetBtn.addEventListener("click", function () {
    const greeting = document.querySelector("#greetBtn");

    greeting.textContent = "Привет! Рад вас видеть!";
});