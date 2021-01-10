import discordEval from "discord-eval.ts"
import * as app from "../app"

const command: app.Command = {
  name: "snippet",
  aliases: [
    "snip",
    "snippets",
    "record",
    "rec",
    "call",
    "!",
    "fn",
    "function",
    "functions",
  ],
  async run(message) {
    const key = app.getArgument(message)

    switch (key) {
      case "add":
      case "set": {
        if (process.env.OWNER !== message.author.id)
          return message.channel.send("Seul l'owner du bot peut faire ça :p").then(app.handleMessage)
        const name = app.getArgument(message)

        if (!name) {
          return message.channel.send(
            "Il manque un peu le nom du snippet là quand même"
          ).then(app.handleMessage)
        }

        const match = app.codeRegex.exec(message.content)
        const code = match ? match[1] : message.content

        if (!code.trim()) {
          return message.channel.send(
            "Ton snippet est vide <:what:657667833509052444>"
          ).then(app.handleMessage)
        }

        app.snippets.set(name, code)

        return message.channel.send(
          "Ok le snippet est enregistré." + app.code(code, "js")
        ).then(app.handleMessage)
      }
      case "remove":
      case "rm":
      case "delete":
      case "del": {
        if (process.env.OWNER !== message.author.id)
          return message.channel.send("Seul l'owner du bot peut faire ça :p").then(app.handleMessage)
        const name = app.getArgument(message)

        if (!name)
          return message.channel.send(
            "Il manque un peu le nom du snippet là quand même"
          ).then(app.handleMessage)

        if (!app.snippets.has(name)) {
          return message.channel.send("Snippet inexistant.").then(app.handleMessage)
        }

        app.snippets.delete(name)

        return message.channel.send("Ok le snippet est effacé.").then(app.handleMessage)
      }
      case "list": {
        return message.channel.send(app.snippets.keyArray().join(", ")).then(app.handleMessage)
      }
      case "display":
      case "view":
      case "show": {
        const name = app.getArgument(message)

        if (!name)
          return message.channel.send(
            "Il manque un peu le nom du snippet là quand même"
          ).then(app.handleMessage)

        if (!app.snippets.has(name)) {
          return message.channel.send("Snippet inexistant.").then(app.handleMessage)
        }

        return message.channel.send(
          `Code du snippet \`${name}\`: ${app.code(
            app.snippets.get(name) as string,
            "js"
          )}`
        ).then(app.handleMessage)
      }
      default: {
        if (!app.isAdmin(message.member))
          return message.channel.send(
            "Seuls les admins peuvent exécuter les snippets 👀"
          ).then(app.handleMessage)
        if (!key) {
          return message.channel.send("bite").then(app.handleMessage)
        } else {
          const snippet = app.snippets.get(key)
          if (snippet) {
            return discordEval(snippet, message, snippet.includes("@muted"))
          } else {
            return message.channel.send("Snippet inexistant.").then(app.handleMessage)
          }
        }
      }
    }
  },
}

module.exports = command
