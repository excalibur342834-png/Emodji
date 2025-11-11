import { NetworkGame } from './network.js';
import { GameEngine } from './game.js';
import { UIManager } from './ui.js';

class EmojinariumGame {
    // ... конструктор и инициализация ...

    // Обновленные методы создания/присоединения
    async createRoom(playerName, statusElement) {
        const result = await this.network.createRoom(playerName);
        
        if (result.success) {
            this.isHost = true;
            this.gameMode = 'network';
            
            this.uiManager.showRoomCreated(result.roomId, statusElement);
            localStorage.setItem('lastRoomId', result.roomId);
            
            setTimeout(() => {
                this.startNetworkGame();
            }, 2000);
        }
    }

    async joinRoom(roomId, playerName, statusElement) {
        const result = await this.network.joinRoom(roomId, playerName);
        
        if (result.success) {
            this.isHost = false;
            this.gameMode = 'network';
            
            statusElement.textContent = 'Успешно присоединились!';
            statusElement.className = 'status-message status-connected';
            localStorage.setItem('lastRoomId', roomId);
            
            setTimeout(() => {
                this.startNetworkGame();
            }, 1000);
        }
    }

    startNetworkGame() {
        this.uiManager.showScreen('game');
        
        // Показываем кнопки управления только хосту
        this.uiManager.initGameControls(
            this.generateNewMovie.bind(this),
            this.clearGameField.bind(this),
            this.disconnectGame.bind(this),
            this.isHost // ← передаем является ли игрок хостом
        );
        
        if (this.isHost) {
            this.uiManager.toggleEmojiMenu(true);
            this.uiManager.toggleChat(true);
            this.generateNewMovie();
            this.uiManager.initSections(this.gameEngine.emojiCategories, this);
        } else {
            this.uiManager.toggleEmojiMenu(false);
            this.uiManager.toggleChat(true);
            this.uiManager.toggleMovieDisplay(false);
            this.createPlayerPlaceholder();
        }
        
        this.initNetworkListeners();
        this.updatePlayersList();
    }

    // ... остальные методы без изменений ...
}
