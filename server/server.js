// server/server.js
const WebSocket = require('ws');
const http = require('http');
const url = require('url');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const rooms = new Map();

class GameRoom {
    constructor(id) {
        this.id = id;
        this.players = new Map();
        this.host = null;
        this.gameObjects = new Map();
    }

    addPlayer(player) {
        this.players.set(player.id, player);
        
        if (!this.host) {
            this.host = player.id;
            player.isHost = true;
        }
        
        // Рассылаем информацию о новом игроке всем участникам
        this.broadcast({
            type: 'player_joined',
            player: player
        }, player.id);
        
        // Отправляем новому игроку текущее состояние комнаты
        player.socket.send(JSON.stringify({
            type: 'room_joined',
            playerId: player.id,
            isHost: player.isHost,
            players: Array.from(this.players.values()).map(p => ({
                id: p.id,
                name: p.name,
                score: p.score,
                isHost: p.isHost
            }))
        }));
    }

    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            this.players.delete(playerId);
            
            // Если хост вышел, назначаем нового
            if (playerId === this.host && this.players.size > 0) {
                const newHost = this.players.values().next().value;
                newHost.isHost = true;
                this.host = newHost.id;
            }
            
            this.broadcast({
                type: 'player_left',
                playerId: playerId
            });
        }
    }

    broadcast(message, excludePlayerId = null) {
        this.players.forEach((player) => {
            if (player.id !== excludePlayerId && player.socket.readyState === WebSocket.OPEN) {
                player.socket.send(JSON.stringify(message));
            }
        });
    }

    handleMessage(playerId, message) {
        const player = this.players.get(playerId);
        if (!player) return;

        switch (message.type) {
            case 'chat_message':
                this.broadcast({
                    type: 'chat_message',
                    playerId: playerId,
                    playerName: player.name,
                    message: message.message,
                    timestamp: message.timestamp
                });
                break;

            case 'correct_answer':
                if (playerId === this.host) {
                    this.broadcast({
                        type: 'correct_answer',
                        playerId: message.playerId,
                        points: message.points
                    });
                }
                break;

            case 'game_object_created':
            case 'game_object_updated':
            case 'game_object_removed':
                if (playerId === this.host) {
                    this.broadcast(message, playerId);
                }
                break;
        }
    }
}

wss.on('connection', (ws, req) => {
    const parameters = url.parse(req.url, true);
    const roomId = parameters.query.roomId;
    const playerName = parameters.query.playerName;

    if (!roomId || !playerName) {
        ws.close(1008, 'Missing roomId or playerName');
        return;
    }

    // Создаем или получаем комнату
    if (!rooms.has(roomId)) {
        rooms.set(roomId, new GameRoom(roomId));
    }
    const room = rooms.get(roomId);

    const player = {
        id: generatePlayerId(),
        name: playerName,
        score: 0,
        isHost: false,
        socket: ws
    };

    room.addPlayer(player);

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            room.handleMessage(player.id, message);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        room.removePlayer(player.id);
        
        // Если комната пустая, удаляем её
        if (room.players.size === 0) {
            rooms.delete(roomId);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        room.removePlayer(player.id);
    });
});

function generatePlayerId() {
    return 'player_' + Math.random().toString(36).substr(2, 9);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server available at ws://localhost:${PORT}`);
});

// Очистка пустых комнат каждые 5 минут
setInterval(() => {
    for (const [roomId, room] of rooms.entries()) {
        if (room.players.size === 0) {
            rooms.delete(roomId);
        }
    }
}, 300000);
