import * as app from "../app"

const command: app.Command = {
  name: "invites",
  description: "",
  async run(message) {
    const guildInvites = await message.guild.fetchInvites()

    return new app.Paginator(
      app.Paginator.divider(
        guildInvites.map((invite, key) => {
          const name = (invite.inviter?.tag ?? "inconnu").substring(0, 10)
          const rate = (
            (invite?.uses ?? 0) /
            ((Date.now() - (invite?.createdTimestamp || 0)) /
              1000 /
              60 /
              60 /
              24 /
              7)
          ).toFixed(2)
          const index = guildInvites.keyArray().indexOf(key) + 1
          return `${index}. \`${invite.code}\`, par \`${name}\`, invite \`${rate} / semaine\``
        }),
        10
      ).map((page) => {
        return new app.MessageEmbed()
          .setColor("BLURPLE")
          .setAuthor("Invites list", message.client.user?.displayAvatarURL())
          .setDescription(page.join("\n"))
          .setFooter(`Liste des invites du serveur ${message.guild}`)
      }),
      message.channel,
      (reaction, user) => user.id === message.author.id
    )
  },
}

module.exports = command
