const { Server } = require('socket.io')

const IoListener = require('../socketListeners/IoListener.js')

class Socket {
    listen(httpServer){
        this.io = new Server(httpServer, {
            cors: {origin: 'http://localhost:3000'}
        })
    }

    configListeners(){
        const listener = new IoListener(this.io)
        listener.startListening()

    }
}


module.exports = new Socket()
