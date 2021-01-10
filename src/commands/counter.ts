import * as app from "../app"

const command: app.Command = {
  name: "counter",
  aliases: ["count", "score", "point", "pt", "c", "sc"],
  async run(message) {
    if (message.content.startsWith("list")) {
      if (message.content.includes("--debug")) {
        await message.channel.send(
          JSON.stringify(Array.from(app.scores.entries())).slice(0, 1999)
        ).then(app.handleMessage)
      }

      const lines = await Promise.all(
        app.counters.map(async (counter) => {
          return `**${counter.name}** - [${counter.type}] - \`${counter.target}\``
        })
      )

      return message.channel.send(lines.join("\n")).then(app.handleMessage)
    } else if (message.content.startsWith("add")) {
      if (message.guild.ownerID !== message.author.id) {
        return message.channel.send("Raté, ya que Ghom qui peut faire ça !").then(app.handleMessage)
      }

      message.content = message.content.replace("add", "").trim()

      const [name, type, target] = message.content.split(/\s+/)

      if (!name || (type !== "match" && type !== "react") || !target) {
        return message.channel.send(
          "Raté, ça s'utilise comme ça:\n`!counter add [name] match|react [pattern|emoji]`"
        ).then(app.handleMessage)
      }

      app.counters.set(name, { name, type, target })

      return message.channel.send(`Le compteur de ${name} a bien été ajouté.`).then(app.handleMessage)
    } else if (message.content.startsWith("remove")) {
      const [, name] = message.content.split(/\s+/)

      if (!name) return message.channel.send("Il manque le nom du compteur...").then(app.handleMessage)

      if (!app.counters.has(name))
        return message.channel.send(`Le compteur de ${name} n'existe pas.`).then(app.handleMessage)

      app.counters.delete(name)

      app.scores.forEach((score, id) => {
        delete score[name]
        app.scores.set(id, score)
      })

      return message.channel.send(
        `Ok le compteur de ${name} a bien été supprimé.`
      ).then(app.handleMessage)
    } else if (message.content.startsWith("me")) {
      const score = app.scores.ensure(message.author.id, {})
      return message.channel.send(
        new app.MessageEmbed()
          .setTitle(`Scores | ${message.author.tag}`)
          .setDescription(
            app.code(JSON.stringify(score, null, 2).replace(/"/g, ""), "js")
          )
          .addField(
            "total",
            `**${eval(Object.values(score).join(" + "))}** points.`
          )
      )
    } else if (app.counters.has(message.content)) {
      const counter = app.counters.get(message.content) as app.Counter

      const leaderboard = app.scores
        .filter(
          (score) =>
            score.hasOwnProperty(counter.name) && score[counter.name] > 0
        )
        .map((score, id) => ({ score: score[counter.name], id }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 15)
        .map((el, i, arr) => app.leaderItem(el, i, arr, "pts"))
        .join("\n")

      return message.channel.send(
        new app.MessageEmbed()
          .setAuthor(`Leaderboard | ${message.content}`)
          .setDescription(leaderboard)
      ).then(app.handleMessage)
    } else if (message.mentions.members && message.mentions.members.size > 0) {
      const target = message.mentions.members.first() as app.GuildMember
      const score = app.scores.ensure(target.id, {})
      return message.channel.send(
        new app.MessageEmbed()
          .setTitle(`Scores | ${target.user.tag}`)
          .setDescription(
            app.code(JSON.stringify(score, null, 2).replace(/"/g, ""), "js")
          )
          .addField(
            "total",
            `**${eval(Object.values(score).join(" + ")) || 0}** points.`
          )
      ).then(app.handleMessage)
    } else {
      return message.channel.send(
        new app.MessageEmbed().setAuthor(`Leaderboard | Total`).setDescription(
          app.scores
            .map((score, id) => ({
              id,
              score: eval(Object.values(score).join(" + ")),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 15)
            .map((el, i, arr) => app.leaderItem(el, i, arr, "pts"))
            .join("\n")
        )
      ).then(app.handleMessage)
    }
  },
}

module.exports = command
