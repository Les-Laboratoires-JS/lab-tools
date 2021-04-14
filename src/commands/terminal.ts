import * as app from "../app"
import cp from "child_process"

const command: app.Command = {
  name: "terminal",
  aliases: ["term", "cmd", "command", "exec", ">", "process", "shell"],
  description: "Run shell command from Discord",
  botOwnerOnly: true,
  coolDown: 5000,
  rest: {
    name: "cmd",
    description: "The cmd to run",
    required: true,
  },
  async run(message) {
    const toEdit = await message.channel.send("The process is running...")
    let content: string

    cp.exec(message.rest, { cwd: process.cwd() }, (err, stdout, stderr) => {
      const embed = new app.MessageEmbed()
        .setTitle(
          err ? "\\❌ An error has occurred." : "\\✔ Successfully executed."
        )
        .setDescription(
          app.CODE.stringify({
            content:
              (err ? err.stack ?? err.message ?? stderr : stdout).slice(
                0,
                2000
              ) || "No log",
          })
        )

      toEdit.edit(content).catch(() => {
        message.channel.send(content).catch()
      })
    })
  },
}

module.exports = command
