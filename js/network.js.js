// js/network.js
export class NetworkGame {
    constructor() {
        this.socket = null;
        this.roomId = null;
        this.playerId = null;
        this.playerName = 'Игрок';
        this.isConnected = false;
        this.isHost = false;
        this.players = new Map();
        this.messageCallbacks = [];
    }

    async connect(serverUrl, roomId, playerName) {
        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(serverUrl);
                this.roomId = roomId;
                this.playerName = playerName;

                this.socket.onopen = () => {
                    console.log('WebSocket connected');
                    this.isConnected = true;
                    
                    // Отправляем запрос на присоединение к комнате
                    this.send({
                        type: 'join_room',
                        roomId: roomId,
                        playerName: playerName
                    });
                };

                this.socket.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                };

                this.socket.onclose = () => {
                    console.log('WebSocket disconnected');
                    this.isConnected = false;
                    this.handleMessage({
                        type: 'system',
                        message: 'Соединение с сервером потеряно'
                    });
                };

                this.socket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    reject(new Error('Ошибка подключения к серверу'));
                };

                // Таймаут для подключения
                setTimeout(() => {
                    if (!this.isConnected) {
                        reject(new Error('Таймаут подключения'));
                    }
                }, 10000);

            } catch (error) {
                reject(error);
            }
        });
    }

    handleMessage(data) {
        console.log('Received message:', data);

        switch (data.type) {
            case 'room_joined':
                this.playerId = data.playerId;
                this.isHost = data.isHost;
                this.players = new Map(data.players.map(p => [p.id, p]));
                this.messageCallbacks.forEach(callback => callback(data));
                break;

            case 'player_joined':
                this.players.set(data.player.id, data.player);
                this.messageCallbacks.forEach(callback => callback(data));
                break;

            case 'player_left':
                this.players.delete(data.playerId);
                this.messageCallbacks.forEach(callback => callback(data));
                break;

            case 'chat_message':
            case 'correct_answer':
            case 'game_object_created':
            case 'game_object_updated':
            case 'game_object_removed':
                this.messageCallbacks.forEach(callback => callback(data));
                break;

            case 'error':
                console.error('Server error:', data.message);
                break;
        }
    }

    send(data) {
        if (this.isConnected && this.socket) {
            this.socket.send(JSON.stringify(data));
        }
    }

    sendMessage(message) {
        this.send({
            type: 'chat_message',
            message: message,
            playerId: this.playerId,
            playerName: this.playerName,
            timestamp: Date.now()
        });
    }

    sendCorrectAnswer(playerId) {
        this.send({
            type: 'correct_answer',
            playerId: playerId,
            points: 1
        });
    }

    sendGameObjectCreated(object) {
        this.send({
            type: 'game_object_created',
            object: object
        });
    }

    sendGameObjectUpdated(object) {
        this.send({
            type: 'game_object_updated',
            object: object
        });
    }

    sendGameObjectRemoved(objectId) {
        this.send({
            type: 'game_object_removed',
            objectId: objectId
        });
    }

    onMessage(callback) {
        this.messageCallbacks.push(callback);
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
        this.isConnected = false;
    }

    getPlayers() {
        return Array.from(this.players.values());
    }

    updatePlayerScore(playerId, points) {
        const player = this.players.get(playerId);
        if (player) {
            player.score += points;
        }
    }
}