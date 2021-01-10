import * as app from "../app"

const prettify = require("ghom-prettify")
const regex = /^```([a-z-]+)?\s(.+[^\\])```$/is

const command: app.Command = {
  name: "pretty",
  aliases: ["beauty", "prettify", "beautify", "format", "prettier"],
  async run(message) {
    const options: any = {}

    if (message.content.includes("--semi")) {
      options.semi = true
      message.content = message.content.replace("--semi", "").trim()
    }

    const match = regex.exec(message.content)

    if (match) {
      const [, lang, code] = match

      const prettified = await prettify(code, lang, options)

      await message.channel.send(app.code(prettified, lang)).then(app.handleMessage)
    } else {
      await message.channel.send(
        "Commande mal utilisée. Place ton code entre balises pour que je sache quel est son language."
      ).then(app.handleMessage)
    }
  },
}

module.exports = command
