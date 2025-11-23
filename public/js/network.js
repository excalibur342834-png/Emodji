export class NetworkGame {  
    constructor() {  
        this.socket = null;  
        this.roomId = null;  
        this.players = [];  
    }  
  
    connect() {  
        this.socket = io();  
          
        this.socket.on('connect_error', (err) => console.error(err));  
          
        this.socket.on('chat_message', data => this.callbacks.onChat && this.callbacks.onChat(data));  
        this.socket.on('player_joined', data => this.updatePlayers(data.players));  
        this.socket.on('player_left', data => this.updatePlayers(data.players));  
        this.socket.on('player_scored', data => this.callbacks.onScore && this.callbacks.onScore(data));  
          
        // Игровые события  
        this.socket.on('room_state', data => this.callbacks.onState && this.callbacks.onState(data));  
        this.socket.on('movie_reveal', data => this.callbacks.onMovie && this.callbacks.onMovie(data));  
        this.socket.on('game_started', data => this.callbacks.onStart && this.callbacks.onStart(data));  
          
        // Объекты  
        this.socket.on('game_object_added', d => this.callbacks.onObjAdd && this.callbacks.onObjAdd(d.object));  
        this.socket.on('game_object_removed', d => this.callbacks.onObjRem && this.callbacks.onObjRem(d.objectId));  
        this.socket.on('game_object_updated', d => this.callbacks.onObjUpd && this.callbacks.onObjUpd(d.object));  
        this.socket.on('clear_game_field', () => this.callbacks.onClear && this.callbacks.onClear());  
    }  
  
    setCallbacks(cbs) { this.callbacks = cbs; }  
  
    createRoom(name) {  
        return new Promise((resolve) => {  
            if (!this.socket) this.connect();  
            this.socket.emit('create_room', { playerName: name });  
            this.socket.once('room_created', (data) => {  
                this.roomId = data.roomId;  
                resolve(data);  
            });  
        });  
    }  
  
    joinRoom(roomId, name) {  
        return new Promise((resolve, reject) => {  
            if (!this.socket) this.connect();  
            this.socket.emit('join_room', { roomId, playerName: name });  
              
            const errorHandler = (data) => reject(new Error(data.message));  
            this.socket.once('join_error', errorHandler);  
              
            this.socket.once('room_state', (data) => {  
                this.socket.off('join_error', errorHandler);  
                this.roomId = roomId;  
                resolve(data);  
            });  
        });  
    }  
  
    updatePlayers(list) {  
        this.players = list;  
        if (this.callbacks.onPlayers) this.callbacks.onPlayers(list);  
    }  
  
    getCurrentRoomId() { return this.roomId; }  
  
    // Методы отправки  
    sendMsg(msg) { this.socket?.emit('chat_message', { message: msg }); }  
    sendObject(obj) { this.socket?.emit('game_object_added', { object: obj }); }  
    updateObject(obj) { this.socket?.emit('game_object_updated', { object: obj }); }  
    removeObject(id) { this.socket?.emit('game_object_removed', { objectId: id }); }  
    clearField() { this.socket?.emit('clear_game_field', {}); }  
    newGame() { this.socket?.emit('start_game'); }  
    sendCorrect(pid) { this.socket?.emit('correct_answer', { playerId: pid }); }  
      
    disconnect() {  
        this.socket?.disconnect();  
        this.socket = null;  
        this.roomId = null;  
    }  
}  
