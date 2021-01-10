import { URL } from "url"
import * as app from "../app"

const command: app.Command = {
  name: "invite",
  aliases: ["invitation", "bot", "cobaye"],
  async run(message) {
    let here = true,
      bot

    if (message.content.includes("--here")) {
      message.content = message.content.replace("--here", "").trim()
      here = true
    } else if (message.content.includes("--no-here")) {
      message.content = message.content.replace("--no-here", "").trim()
      here = false
    }

    if (message.mentions.members && message.mentions.members.size > 0) {
      bot = (message.mentions.members.first() as app.GuildMember).user
      here = here ?? false
    } else if (/^\d+$/.test(message.content)) {
      bot = await message.client.users.fetch(message.content, false, true)
      here = here ?? true
    }

    if (!bot) {
      return message.channel.send(
        "Tu dois donner un identifiant valide ou mentionner un bot !"
      ).then(app.handleMessage)
    }

    const url = new URL("/oauth2/authorize", "https://discord.com/")

    url.searchParams.append("scope", "bot")
    url.searchParams.append("client_id", bot.id)

    if (here) {
      url.searchParams.append("permissions", "0")
      url.searchParams.append("guild_id", message.guild.id)
    } else {
      url.searchParams.append("permissions", "2146958847")
    }

    await message.channel.send(
      new app.MessageEmbed()
        .setAuthor(
          `Invitez ${bot.username} ${here ? "ici" : ""}`,
          message.guild.iconURL({ dynamic: true }) ?? undefined,
          url.toString()
        )
        .setDescription(
          app.code(
            JSON.stringify(
              Object.fromEntries(url.searchParams.entries()),
              (key, val) => {
                if (
                  /^\d+$/.test(val) &&
                  val.length < 12 &&
                  !val.startsWith("0")
                )
                  return Number(val)
                return val
              },
              2
            ),
            "json"
          )
        )
        .setThumbnail(bot.displayAvatarURL({ dynamic: true }))
        .setURL(url.toString())
    ).then(app.handleMessage)
  },
}

module.exports = command
