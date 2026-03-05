const { Server } = require('socket.io');

const adapter = require("./adapter");

const jwt = require('jsonwebtoken');
const secret = process.env.SECRET;
class Messagery {
    /* constructor() {} */
    initSocket(server) {
        this.instantServer = new InstantMessageServer(server, {
            sendAlerts: this.sendAlerts.bind(this) /* TODO: best practices */
        });
    }

    command(command, payload) {
        this.instantServer.sendCommand(command, payload);
    }

    test({ room, event, payload }) {
        this.instantServer.test({ room, event, payload });
    }

    async resetAlerts(room, userId) {
        const resetedAlerts = await adapter.resetAlerts(room, userId);

        if (resetedAlerts.length)
            this.instantServer.sendCommandToUser(userId, 'reset_alert', { alerts: resetedAlerts });
    }

    async removeAlert(watch) {
        let { alerts_to_remove } = await adapter.removeAlerts(watch);

        // enviar um comando de remove_alert, para cada user e enviar o payload com count
        alerts_to_remove.forEach(a => this.instantServer.sendCommandToUser(a.userId, 'remove_alert', { alerts: a.alerts }));
    }

    async refreshNotifications(key) {
        const notifications = await adapter.getNotificationsWatching(key);

        notifications.forEach(({ room, id }) => this.instantServer.sendRefresh(room, id))
    }

    async sendNotification(user, room, notification, watch, alert = true, config) {
        const confirmedNotification = await adapter.addNotification(room, notification, watch, config);

        if (!!confirmedNotification) {
            this.instantServer.sendNotification(room, confirmedNotification);
            if (alert) this.sendAlerts(room, 'regular', watch, confirmedNotification.id, user);
        }
    }

    async getNotificationContent(criteria, target) {
        return await adapter.getNotificationContent(criteria, target);
    }

    async updateNotificationContent(criteria, content, target, update = true) {
        const result = await adapter.updateNotificationContent(criteria, content, target);

        if (!!result) {
            const { room, updatedNotification } = result;

            if (update && !!updatedNotification && !!room) this.instantServer.sendUpdate(room, updatedNotification);
        }
    }

    async sendAlerts(room, type, watch, instantiator_id, sender) {
        room = room.trim(); // protection

        /* who is in the room -> exclude */
        let usersInRoom = await this.instantServer.getUsersInRoom(room);
        let exclude = [sender.id, ...usersInRoom.map(({ id }) => id)];

        let { new_alerts } = await adapter.addAlerts(room, type, watch, instantiator_id, exclude);

        this.instantServer.sendAlerts(room, new_alerts);
    }

    async sendBatchNotifications() {
        const affectedNotifications = await adapter.sendBatchNotifications();

        /* console.log({ affectedNotifications }) */

        for (let n of affectedNotifications) {
            this.instantServer.sendNotification(n.room, n);
            /* TODO if (alert) */ await this.sendAlerts(n.room, 'regular', n.watch, n.id, { id: n.user_id });
        }
    }

    async sendEmails(config) {
        await adapter.sendEmails(config);
    }
}

class InstantMessageServer {
    constructor(server, messagery) {
        this.io = new Server(server, {
            cors: {
                origin: '*',
                methods: ["GET", "POST"]
            }
        });

        console.log('📡 Messagery instantiated');

        this.io.on('connection', (socket) => {
            console.log(`Socket ${socket.id} connected!`);

            socket.on("disconnect", () => console.log(`Socket ${socket.id} disconnected!`));

            socket.on('token', (token) => {
                if (token) {
                    try {
                        const decoded = jwt.verify(token, secret);
                        socket.data.user = decoded;
                    } catch (e) {
                        // console.log('Token error', e.message);
                    }
                } else {
                    socket.data.user = undefined;
                }
            })
            socket.on('enter', (room) => {
                socket.join(room);
            })
            socket.on('leave', (room) => {
                socket.leave(room);
            })
            socket.on('remember', (rooms) => {
                rooms.map(room => socket.join(room));

                console.log(`Client ${socket.id} reconnected - ${rooms.length ? `${rooms.join(',')}` : 'no rooms'}!`);
            })
            socket.on('new_message', async (room, optimistic_message, callback) => {

                const { tool, content } = optimistic_message;

                const notification = {
                    room,
                    content,
                    userId: socket.data.user.id,
                    tool,
                }

                const confirmedNotification = await adapter.addNotification(room, notification);
                socket.to(room).emit('notification', room, confirmedNotification);

                /* alerts */
                messagery.sendAlerts(room, 'regular', ['message'], confirmedNotification.id, socket.data.user);

                if (typeof callback === 'function') callback(confirmedNotification);
            })
        });
    }

    test({ room, event, payload }) {
        if (room) {
            this.io.to(room).emit(event, room, payload);
        } else {
            this.io.emit(event, payload);
        }

        console.log({ room, event, payload })
    }

    sendNotification(room, notification) {
        room = room.trim(); // protection
        this.io.to(room).emit('notification', room, notification);
    }

    sendRefresh(room, id) {
        this.io.to(room).emit('refresh', room, {
            id
        });
    }

    sendUpdate(room, notification) {
        this.io.to(room).emit('update', room, notification);
    }

    sendCommand(command, payload) {
        this.io.emit("command", command, payload);
    }

    async sendCommandToUser(userId, command, payload) {
        let sockets = await this.io.fetchSockets(); /* todos os usuarios conectado */

        let socketToSend = sockets.find(({ data: { user } }) => user.id === userId);
        if (socketToSend) socketToSend.emit("command", command, payload);
    }

    async getUsersInRoom(room) {
        let sockets = await this.io.in(room).fetchSockets(); /* todos os usuarios na sala */

        return sockets.map(({ data: { user } }) => user);
    }

    async sendAlerts(room, alerts) {
        /* 
            send alert command for:
            - people in alerts ( { userId } )
            - connected
            - not in room now?
        */
        let sockets = await this.io.except(room).fetchSockets(); /* socket de usuarios conectados fora da sala em questao */

        // sockets.forEach(({ data: { user }}) => console.log(user))

        sockets
            .filter(({ data: { user } }) => alerts.find(a => a.userId === user.id)) /* sockets de usuarios que estao em alertas */
            .forEach(s => {
                let alert = alerts.find(a => a.userId === s.data.user.id);
                s.emit("command", 'new_alert', { alert: alert['alert'] })
            }) /* para cada socket que esta em alertas */

    }
}

const singletonInstance = new Messagery();
module.exports = singletonInstance;