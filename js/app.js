import { NetworkGame } from './network.js';
import { GameLogic } from './game.js';
import { EMOJI_CATEGORIES } from './emojis.js';

class EmojinariumApp {
    constructor() {
        this.network = new NetworkGame();
        this.gameLogic = new GameLogic();
        this.gameMode = 'single';
        this.isHost = false;
        
        this.initModal();
    }

    initModal() {
        const modal = document.getElementById('modeModal');
        const modeBtns = document.querySelectorAll('.mode-btn');
        const serverSettings = document.getElementById('serverSettings');
        const startBtn = document.getElementById('startBtn');
        const statusElement = document.getElementById('networkStatus');

        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.gameMode = btn.dataset.mode;
                
                if (this.gameMode === 'network') {
                    serverSettings.classList.add('active');
                } else {
                    serverSettings.classList.remove('active');
                }
            });
        });

        startBtn.addEventListener('click', async () => {
            if (this.gameMode === 'network') {
                const serverUrl = document.getElementById('serverUrl').value;
                const playerName = document.getElementById('playerName').value;
                const roomId = document.getElementById('roomId').value;

                if (!serverUrl || !roomId) {
                    statusElement.textContent = 'Заполните все поля!';
                    statusElement.className = 'status-message status-error';
                    return;
                }

                statusElement.textContent = 'Подключаемся...';
                statusElement.className = 'status-message status-waiting';

                try {
                    const result = await this.network.connect(serverUrl, roomId, playerName);
                    
                    if (result.success) {
                        this.isHost = result.isHost;
                        this.startNetworkGame();
                    }
                } catch (error) {
                    statusElement.textContent = 'Ошибка подключения: ' + error.message;
                    statusElement.className = 'status-message status-error';
                }
            } else {
                this.startSingleGame();
            }
        });
    }

    async startSingleGame() {
        document.getElementById('modeModal').style.display = 'none';
        document.getElementById('gameHeader').style.display = 'block';
        document.getElementById('gameContainer').style.display = 'flex';
        document.getElementById('instructions').classList.add('active');
        
        await this.gameLogic.init(EMOJI_CATEGORIES, false);
        this.gameLogic.showInstructions(`
            <p>🎯 <strong>Создайте сцену из фильма используя эмодзи!</strong></p>
            <p>✨ Нажмите на категорию чтобы открыть эмодзи • 🖱️ Перетаскивайте эмодзи на поле • 🔄 Перемещайте эмодзи мышью</p>
            <p>🔍 Колесико мыши на эмодзи - изменение размера • ⟳ Зажмите и тяните ручку вращения для поворота • ❌ Двойной клик удаляет эмодзи</p>
            <p>📚 В каждой игре доступны 20 случайных эмодзи из каждой категории • ESC - закрыть открытую секцию</p>
            <p>🎬 Фильмы загружаются из топов Кинопоиска</p>
        `);
    }

    async startNetworkGame() {
        document.getElementById('modeModal').style.display = 'none';
        document.getElementById('gameHeader').style.display = 'block';
        document.getElementById('gameContainer').style.display = 'flex';
        document.getElementById('instructions').classList.add('active');
        
        if (this.isHost) {
            this.gameLogic.init(EMOJI_CATEGORIES, true);
            this.gameLogic.showInstructions(`
                <p>🎯 <strong>Вы - создатель игры! Составьте сцену из фильма используя эмодзи!</strong></p>
                <p>✨ Другие игроки будут угадывать фильм по вашей сцене</p>
                <p>💬 В чате вы можете отмечать правильные ответы кнопкой "✓"</p>
                <p>🎬 Фильмы загружаются из топов Кинопоиска</p>
            `);
        } else {
            this.gameLogic.init([], false);
            this.gameLogic.showInstructions(`
                <p>🎯 <strong>Угадайте фильм по сцене из эмодзи!</strong></p>
                <p>👀 Создатель игры составляет сцену - следите за поле</p>
                <p>💬 Напишите ваш вариант ответа в чат</p>
                <p>🏆 Получайте баллы за правильные ответы!</p>
            `);
        }
        
        this.initNetworkListeners();
    }

    initNetworkListeners() {
        this.network.onMessage((data) => {
            switch (data.type) {
                case 'chat_message':
                    this.gameLogic.addChatMessage(data.playerName, data.message, false);
                    break;
                    
                case 'correct_answer':
                    this.gameLogic.updatePlayerScore(data.playerId, data.points);
                    break;
                    
                case 'player_joined':
                    this.gameLogic.addChatMessage('Система', `🎮 ${data.playerName} присоединился к игре`, true);
                    this.gameLogic.updatePlayersList(this.network.getPlayers());
                    break;
                    
                case 'player_left':
                    this.gameLogic.addChatMessage('Система', `🚪 ${data.playerName} покинул игру`, true);
                    this.gameLogic.updatePlayersList(this.network.getPlayers());
                    break;
                    
                case 'game_object_created':
                    if (!this.isHost) {
                        this.gameLogic.createRemoteObject(data.object);
                    }
                    break;
                    
                case 'game_object_updated':
                    if (!this.isHost) {
                        this.gameLogic.updateRemoteObject(data.object);
                    }
                    break;
                    
                case 'game_object_removed':
                    if (!this.isHost) {
                        this.gameLogic.removeRemoteObject(data.objectId);
                    }
                    break;
            }
        });
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    new EmojinariumApp();
});
