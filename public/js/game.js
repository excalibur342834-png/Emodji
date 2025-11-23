export class GameEngine {  
    constructor() {  
        this.gameField = null;  
        this.gameObjects = new Map();  
          
        this.emojiCategories = [  
            {  
                title: '😊 Эмоции',  
                emojis: ['😃','😄','😆','😂','😊','😇','🙂','💀','😉','😌','😍','🥰','😘','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','😣','😖','😫','🥺','😢','😭','😤','😠','😡','🤬','🤕','🤢','🥶','😈']  
            },  
            {  
                title: '👍 Жесты',  
                emojis: ['👋','🤚','🖐️','✋','🖖','👌','✌️','🤞','🤟','🤘','🤙','👈','🖕','☝️','👍','👎','👊','✊','🤛','🤝','🙏','✍️','💪','👀','🧠','🦷','🦴','👄']  
            },
            {  
                title: '🤴 Люди',  
                emojis: ['🧑','👧','👨','👩','👶','👵','👴']  
            },  
            {  
                title: '🐶 Животные',  
                emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐒','🐔','🐤','🐣','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🐢','🐍','🦎','🦖','🐙','🦑']  
            },  
            {  
                title: '🍕 Еда',  
                emojis: ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🌽','🥕','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟']  
            },  
            {  
                title: '🚗 Транспорт',  
                emojis: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🚚','🚛','🚜','🏍️','🛵','🚲','🛴','🛹','🛶','⛵','🚤','🛥️','⛴️','✈️','🛩️','🚁','🚟','🚠','🚡','🛰️','🚀','🛸']  
            },  
            {  
                title: '⚽ Спорт и активность',  
                emojis: ['⚽','🏀','🥎','🏐','🏉','🥏','🎿','🏆','🏅','🏸','🎯','🎳','🥊','🥋','🎮','🕹️','🎲']  
            },  
            {  
                title: '➕ Символы',  
                emojis: ['➕','➖','✖️','➗','♾️','💲','💯','✔','❌','❗','❓']  
            },  
            {  
                title: '🔷 Фигуры',  
                emojis: ['🔴','🟠','🟡','🟢','🔵','🟣','🟤','⚫','⚪','🟥','🟧','🟨','🟩','🟦','🟪','🟫','⬛','⬜','🔺','🔶']  
            },  
            {  
                title: '🎵 Музыка и искусство',  
                emojis: ['🎵','🎤','🎧','🎷','🎸','🎹','🎺','🎻','🥁','🎭','🎨','🎬','♠️','♥️','♦️','♣️','🃏','🀄','🖼️','🧵','🧶','👓','🕶️']  
            },  
            {  
                title: '🌍 Природа и погода',  
                emojis: ['🌲','🌳','🌴','🌱','🌿','🍀','🌵','🌾','💐','🌷','🌹','🌺','🌸','🌼','🌻','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔','🌙','🌎','🌍','🌏','🪐','💫','⭐','🌟','✨','⚡','🔥','💥','☄️','☀️','🌤️','⛅','🌥️','☁️','🌦️','🌧️','⛈️','🌩️','🌨️','❄️','☃️','⛄','🌬️','💨','🌪️','🌫️','🌈','☔','☂️','🌊']  
            },  
            {  
                title: '💡 Техника и вещи',  
                emojis: ['⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💸','💵','💴','💶','💷','💰','💳','💎','⚖️','🧰','🔧','🔨','⚒️','🛠️','⛏️','🔩','⚙️','🧱','⛓️','🧲','🔫','💣','🧨','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','⚱️','🏺','🔮','📿','🧿','💈','⚗️','🔭','🔬','🕳️','💊','💉','🩸','🩹','🩺','🌡️','🧹','🧺','🧻','🚽','🚰','🚿','🛁','🛀','🧼','🪒','🧽','🧴','🛎️','🔑','🗝️','🚪','🪑','🛋️','🛏️','🛌','🧸','🖼️','🛍️','🛒','🎁','🎈','🎏','🎀','🎊','🎉','🎎','🏮','🎐','🧧','✉️','📩','📨','📧','💌','📥','📤','📦','🏷️','📪','📫','📬','📭','📮','📯','📜','📃','📄','📑','🧾','📊','📈','📉','🗒️','🗓️','📅','🗑️','📇','🗃️','🗳️','🗄️','📋','📁','📂','🗂️','🗞️','📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🧷','🔗','📎','🖇️','📐','📏','🧮','📌','📍','✂️','🖊️','🖋️','✒️','🖌️','🖍️','📝','✏️','🔍','🔎','🔏','🔐','🔒','🔓']  
            }  
        ];  
    }  
  
    init(fieldElement) { this.gameField = fieldElement; }  
  
    createObject(emoji, x, y, isHost, network = null, existingData = null) {  
        const data = existingData || {  
            id: Date.now() + Math.random(),  
            emoji: emoji,  
            x: x, y: y,  
            size: 50, rotation: 0  
        };  
          
        if (this.gameObjects.has(data.id)) return;  
  
        const el = document.createElement('div');  
        el.className = 'game-object';  
        el.textContent = data.emoji;  
        el.style.left = data.x + 'px';  
        el.style.top = data.y + 'px';  
        el.style.fontSize = data.size + 'px';  
        el.style.transform = `rotate(${data.rotation}deg)`;  
        el.dataset.id = data.id;  
        el.dataset.rotation = data.rotation;  
  
        const handle = document.createElement('div');  
        handle.className = 'rotate-handle';  
        el.appendChild(handle);  
  
        if (isHost) {  
            this.makeDraggable(el, network);  
            this.makeRotatable(el, handle, network);  
            this.makeResizable(el, network);  
        }  
  
        this.gameField.appendChild(el);  
        this.gameObjects.set(data.id, el);  
        this.hidePlaceholder();  
  
        if (isHost && !existingData && network) {  
            network.sendObject(data);  
        }  
    }  
  
    updateObject(data) {  
        const el = this.gameObjects.get(data.id);  
        if (el) {  
            el.style.left = data.x + 'px';  
            el.style.top = data.y + 'px';  
            el.style.fontSize = data.size + 'px';  
            el.style.transform = `rotate(${data.rotation}deg)`;  
            el.dataset.rotation = data.rotation;  
        }  
    }  
  
    removeObject(id) {  
        const el = this.gameObjects.get(id);  
        if (el) {  
            el.remove();  
            this.gameObjects.delete(id);  
            if (this.gameObjects.size === 0) this.showPlaceholder();  
        }  
    }  
  
    clear() {  
        this.gameObjects.forEach(el => el.remove());  
        this.gameObjects.clear();  
        this.showPlaceholder();  
    }  
  
    makeDraggable(el, network) {  
        let isDrag = false, startX, startY;  
        el.addEventListener('mousedown', e => {  
            if (e.target.className === 'rotate-handle') return;  
            isDrag = true;  
            const rect = el.getBoundingClientRect();  
            startX = e.clientX - rect.left;  
            startY = e.clientY - rect.top;  
            el.style.zIndex = 1000;  
        });  
  
        window.addEventListener('mousemove', e => {  
            if (!isDrag) return;  
            const parent = this.gameField.getBoundingClientRect();  
            let x = e.clientX - parent.left - startX;  
            let y = e.clientY - parent.top - startY;  
              
            // Ограничения поля (опционально)  
            // x = Math.max(0, Math.min(x, parent.width - el.offsetWidth));  
            // y = Math.max(0, Math.min(y, parent.height - el.offsetHeight));  
  
            el.style.left = x + 'px';  
            el.style.top = y + 'px';  
        });  
  
        window.addEventListener('mouseup', () => {  
            if (isDrag) {  
                isDrag = false;  
                el.style.zIndex = '';  
                if (network) this.sync(el, network);  
            }  
        });  
    }  
  
    makeRotatable(el, handle, network) {  
        let isRot = false;  
        handle.addEventListener('mousedown', e => {  
            e.stopPropagation(); isRot = true;  
        });  
          
        window.addEventListener('mousemove', e => {  
            if (!isRot) return;  
            const rect = el.getBoundingClientRect();  
            const cx = rect.left + rect.width/2;  
            const cy = rect.top + rect.height/2;  
            const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;  
            el.style.transform = `rotate(${angle}deg)`;  
            el.dataset.rotation = angle;  
        });  
  
        window.addEventListener('mouseup', () => {  
            if (isRot && network) {  
                isRot = false;  
                this.sync(el, network);  
            }  
        });  
    }  
  
    makeResizable(el, network) {  
        el.addEventListener('wheel', e => {  
            e.preventDefault();  
            let size = parseFloat(el.style.fontSize);  
            size += e.deltaY > 0 ? -5 : 5;  
            if (size < 20) size = 20;  
            if (size > 200) size = 200;  
            el.style.fontSize = size + 'px';  
            if (network) this.sync(el, network);  
        }, { passive: false });  
    }  
  
    sync(el, network) {  
        network.updateObject({  
            id: parseFloat(el.dataset.id),  
            emoji: el.childNodes[0].textContent,  
            x: parseFloat(el.style.left),  
            y: parseFloat(el.style.top),  
            size: parseFloat(el.style.fontSize),  
            rotation: parseFloat(el.dataset.rotation || 0)  
        });  
    }  
  
    hidePlaceholder() {  
        const p = this.gameField.querySelector('.field-placeholder');  
        if (p) p.style.display = 'none';  
    }  
    showPlaceholder() {  
        const p = this.gameField.querySelector('.field-placeholder');  
        if (p) p.style.display = 'block';  
    }  
}  
