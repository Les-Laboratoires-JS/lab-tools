import * as app from "../app"

const command: app.Command = {
  name: "toggle",
  coolDown: 60000,
  userPermissions: ["MANAGE_CHANNELS"],
  async run(message) {
    const { channel } = message
    const { name } = channel

    if (name.includes("help-room")) {
      if (name.endsWith("⛔")) {
        await channel.setName(name.replace("⛔", ""))
        message.channel.send(`Le salon a été marqué comme non occupé !`).then(app.handleMessage)
      } else {
        await channel.setName(name + "⛔")
        message.channel.send(`Le salon a bien été marqué comme occupé !`).then(app.handleMessage)
      }
    } else {
      message.channel.send(
        `Gneuh... Cette commande ne fonctionne que dans les salons d'aide !`
      ).then(app.handleMessage)
    }
  },
}

module.exports = command
