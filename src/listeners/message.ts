import * as app from "../app"

const listener: app.Listener<"message"> = {
  event: "message",
  async call(message) {
    if (!app.isCommandMessage(message)) return

    // delete muted messages
    if (app.globals.ensure("muted", []).includes(message.author.id)) {
      return message.delete()
    }

    // add scores
    app.counters.forEach((counter) => {
      if (counter.type === "match") {
        try {
          const regex = new RegExp(counter.target, "ig")
          const count = [...message.content.matchAll(regex)].length
          const score = app.scores.ensure(message.author.id, {})
          score[counter.name] = (score[counter.name] ?? 0) + count
          app.scores.set(message.author.id, score)
        } catch (error) {}
      }
    })

    // presentations checks
    if (message.channel.id === app.presentations) {
      if (
        message.member.roles.cache.has(app.scientifique) ||
        message.member.roles.cache.has(app.validation)
      )
        return
      await message.member.roles.add(app.validation)
      await message.react(app.approved)
      await message.react(app.disapproved)
      return
    }

    const prefix = app.globals.ensure("prefix", process.env.PREFIX)
    if (app.dayjs().day() === 1 && app.dayjs().month() === 3)
      return message.channel.send("Nope je suis en grève !")
    if (message.content.startsWith(prefix)) {
      message.content = message.content.slice(prefix.length)
    } else {
      return
    }

    const key = message.content.split(/\s+/)[0]
    const cmd = app.commands.resolve(key)

    if (!cmd) {
      const cc = app.customCommands.get(key)
      if (cc) return message.channel.send(cc)
      return
    }

    if (key !== "turn" && !app.cache.ensure("turn", true)) return

    const coolDownId = `${cmd.name}:${message.channel.id}`
    const coolDown = app.coolDowns.ensure(coolDownId, {
      time: 0,
      trigger: false,
    })

    if (cmd.coolDown && coolDown.trigger) {
      if (Date.now() > coolDown.time + cmd.coolDown) {
        app.coolDowns.set(coolDownId, {
          time: 0,
          trigger: false,
        })
      } else {
        return message.channel.send(
          new app.MessageEmbed()
            .setColor("RED")
            .setAuthor(
              `Please wait ${Math.ceil(
                (coolDown.time + cmd.coolDown - Date.now()) / 1000
              )} seconds...`,
              message.client.user?.displayAvatarURL()
            )
        )
      }
    }

    if (cmd.botOwner) {
      if (process.env.OWNER !== message.member.id) {
        return message.channel.send(
          new app.MessageEmbed()
            .setColor("RED")
            .setAuthor(
              "You must be my owner.",
              message.client.user?.displayAvatarURL()
            )
        )
      }
    }

    if (cmd.guildOwner) {
      if (message.guild.owner !== message.member) {
        return message.channel.send(
          new app.MessageEmbed()
            .setColor("RED")
            .setAuthor(
              "You must be the guild owner.",
              message.client.user?.displayAvatarURL()
            )
        )
      }
    }

    if (cmd.modOnly) {
      if (!app.isMod(message.member)) {
        return message.channel.send(
          new app.MessageEmbed()
            .setColor("RED")
            .setAuthor(
              "You must bu a moderator.",
              message.client.user?.displayAvatarURL()
            )
        )
      }
    }

    if (cmd.needMoney) {
      const userMoney = app.money.ensure(message.author.id, {money: 0, history: []}).money
      if (userMoney < cmd.needMoney) {
        return message.channel.send(
          new app.MessageEmbed()
            .setColor("RED")
            .setAuthor(
              `You don't have enough money to do this. You need ${Math.abs(
                userMoney - cmd.needMoney
              )}${app.currency} more.`,
              message.client.user?.displayAvatarURL()
            )
        )
      }
      await app.transaction(message.author.id, ["bank"], cmd.needMoney)
    }

    message.content = message.content.slice(key.length).trim()

    try {
      await cmd.run(message)
    } catch (error) {
      console.error(error)
      message.channel
        .send(
          app.code(
            `Error: ${error.message?.replace(/\x1b\[\d+m/g, "") ?? "unknown"}`,
            "js"
          )
        )
        .catch(console.error)
    }
  },
}

module.exports = listener
