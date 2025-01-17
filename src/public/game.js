const old = document.getElementById("old");
const current = document.getElementById("current");
const next = document.getElementById("next");

const [room, connection] = [window.room, window.connection];

delete window.connection;
delete window.room;

const popup = document.getElementById("popup");

const notifications = document.querySelector(".notification-container");

let username = localStorage.getItem("username");

const Sounds = {
    whoosh: new Audio("assets/audio/whoosh.mp3"),
    wheel_spin: new Audio("assets/audio/wheel_spin.mp3"),
}

const scriptsRun = [];
const callbacks = [];

function notify(title, message, duration = 2500, classes = []) {
    const notification = document.createElement("notification");
    notification.innerHTML = `
    <h3 id="title">${title}</h3>
    <p id="message">${message}</p>
`;

    notifications.appendChild(notification);

    classes.forEach(klass => notification.classList.add(klass));

    setTimeout(() => {
        notification.classList.add("expired");

        setTimeout(_ => {
            notification.remove();
        }, 1000);
    }, duration);
}

function playSound(sound, playbackRate = 1, volume = 1) {
    const audio = sound.cloneNode();
    audio.mozPreservesPitch = false;
    audio.playbackRate = playbackRate;
    audio.volume = volume;
    audio.play();
}

async function getScreen(screen) {
    return fetch("screens/" + screen + ".html").then((res) => res.text());
}

function pushHTML(screen) {
    old.innerHTML = current.innerHTML;
    current.innerHTML = next.innerHTML;
    next.innerHTML = screen;

    next.style.transitionDuration = "0s";
    next.classList.add("opaque")

    /* get SCRIPT tag from next screen and eval */
    const script = next.querySelector("script");

    if (script && (!scriptsRun.includes(script.innerHTML) || script.getAttribute("runonce") == null)) {
        scriptsRun.push(script.innerHTML);
        eval(script.innerHTML);
    }

    // Can't play audio without permission (e.g mouse input) and first screen has no JS and forces user to click
    if (scriptsRun.length) playSound(Sounds.whoosh, 1.2 + Math.random() * 0.4, 0.5 + Math.random() * 0.3);

    setTimeout(() => {
        next.style.transitionDuration = ".5s";
        next.classList.remove("opaque")
    }, 50);
}

async function pushScreen(screen) {
    if (screen) {
        pushHTML(await getScreen(screen));
    }
}

async function init() {
    while (!window.connected) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!username) {
        pushScreen("first");
    } else {
        pushScreen("options");
        connection.socket.send(username);
    }
}

function showPopup() {
    popup.style.zIndex = "auto";
    popup.style.height = "auto";
    popup.style.padding = "25px 0";
}

function hidePopup() {
    popup.style.height = popup.offsetHeight - 50 + "px";

    setTimeout(() => {
        popup.style.padding = "0";
        popup.style.height = "0";
    }, 300)
}

function gameReady(state, callback) {
    connection.send("game.ready", state);

    function cb() {
        callback();
        connection.events.remove("game.ready." + state, cb);
    }

    connection.events.on("game.ready." + state, cb);
}

init();
window.Sounds = Sounds;