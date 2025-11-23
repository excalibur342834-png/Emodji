import { NetworkGame } from './network.js';  
import { GameEngine } from './game.js';  
import { UIManager } from './ui.js';  
  
class App {  
    constructor() {  
        this.net = new NetworkGame();  
        this.game = new GameEngine();  
        this.ui = new UIManager();  
          
        this.isHost = false;  
        this.init();  
    }  
  
    init() {  
        this.game.init(document.getElementById('gameField'));  
        this.ui.initialize(document.getElementById('sectionsContainer'));  
          
        // Настройка сетевых колбэков  
        this.net.setCallbacks({  
            onChat: (d) => this.ui.addChatMessage(d.playerName, d.message, d.isCorrect),  
            onPlayers: (list) => {  
                const me = list.find(p => p.id === this.net.socket.id);  
                if (me) this.isHost = me.isHost;  
                this.ui.updatePlayersList(list, this.isHost, (pid) => this.net.sendCorrect(pid));  
                this.ui.toggleUIForHost(this.isHost);  
            },  
            onScore: (d) => {  
                this.ui.addChatMessage('System', d.message || `+1 балл игроку ${d.playerName}`, true);  
            },  
            onMovie: (m) => {  
                document.getElementById('movieTitle').textContent = m.title;  
                document.getElementById('movieYear').textContent = m.year;  
            },  
            onStart: (d) => {  
                this.ui.addChatMessage('System', d.message, false);  
                this.game.clear();  
            },  
            onObjAdd: (o) => this.game.createObject(null, 0,0, this.isHost, this.net, o),  
            onObjRem: (id) => this.game.removeObject(id),  
            onObjUpd: (o) => this.game.updateObject(o),  
            onClear: () => this.game.clear(),  
            onState: (d) => {  
                if (d.movie) {  
                    document.getElementById('movieTitle').textContent = d.movie.title;  
                    document.getElementById('movieYear').textContent = d.movie.year;  
                }  
                d.gameObjects.forEach(o => this.game.createObject(null,0,0, this.isHost, this.net, o));  
            }  
        });  
  
        // Привязка кнопок UI  
        this.ui.initModal(  
            (name, st) => this.createRoom(name, st),  
            (id, name, st) => this.joinRoom(id, name, st),  
            (name) => this.startSingle(name)  
        );  
  
        this.ui.initChat((msg) => this.net.sendMsg(msg));  
        this.ui.initSections(this.game.emojiCategories);  
  
        // Глобальные кнопки  
        document.getElementById('newMovieBtn').onclick = () => this.net.newGame();  
        document.getElementById('clearFieldBtn').onclick = () => this.net.clearField();  
        document.getElementById('disconnectBtn').onclick = () => this.disconnect();  
          
        // Drag & Drop на поле  
        const field = document.getElementById('gameField');  
        field.addEventListener('dragover', e => e.preventDefault());  
        field.addEventListener('drop', e => {  
            e.preventDefault();  
            const emoji = e.dataTransfer.getData('text/plain');  
            const rect = field.getBoundingClientRect();  
            this.game.createObject(emoji, e.clientX - rect.left, e.clientY - rect.top, this.isHost, this.net);  
        });  
        field.addEventListener('dblclick', e => {  
            const obj = e.target.closest('.game-object');  
            if (obj && this.isHost) {  
                this.net.removeObject(parseFloat(obj.dataset.id));  
                this.game.removeObject(parseFloat(obj.dataset.id));  
            }  
        });  
    }  
  
    async createRoom(name, statusElem) {  
        await this.net.createRoom(name);  
        this.isHost = true;  
        statusElem.textContent = 'Готово!';  
        this.startNetworkGame();  
    }  
  
    async joinRoom(id, name, statusElem) {  
        await this.net.joinRoom(id, name);  
        this.isHost = false;  
        statusElem.textContent = 'Вход...';  
        this.startNetworkGame();  
    }  
  
    startNetworkGame() {  
        this.ui.showScreen('game');  
        // FIXED: Показываем ID комнаты  
        this.ui.updateRoomIdDisplay(this.net.getCurrentRoomId());  
        this.ui.toggleUIForHost(this.isHost);  
        this.ui.toggleChat(true);  
        if (this.isHost) this.net.newGame();  
    }  
  
    startSingle(name) {  
        this.isHost = true;  
        this.ui.showScreen('game');  
        this.ui.updateRoomIdDisplay(null); // Скрываем ID  
        this.ui.toggleUIForHost(true);  
        this.ui.toggleChat(false);  
          
        document.getElementById('movieTitle').textContent = 'Одиночная игра';  
        document.getElementById('movieYear').textContent = '';  
    }  
  
    disconnect() {  
        this.net.disconnect();  
        this.game.clear();  
        this.ui.showScreen('menu');  
    }  
}  
  
document.addEventListener('DOMContentLoaded', () => new App());  
