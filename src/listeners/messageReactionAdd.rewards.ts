import * as app from "../app"

const listener: app.Listener<"messageReactionAdd"> = {
  event: "messageReactionAdd",
  async run(reaction, user) {
    if (user.id === reaction.client.user?.id) return

    if (!app.isNormalMessage(reaction.message)) return
    if (!app.isGuildMessage(reaction.message)) return

    const config = await app.getConfig(reaction.message.guild)

    if (
      !config ||
      !config.reward_emoji_id ||
      !config.reward_channel_id ||
      !config.project_channel_id
    )
      return

    const { message, client } = reaction
    const { channel, guild, member } = message

    if (config.project_channel_id !== channel.id) return
    if (config.reward_emoji_id !== reaction.emoji.id) return

    if (reaction.users.cache.size === 5)
      await member.send(
        new app.MessageEmbed()
          .setAuthor(
            "Les Laboratoires JS",
            guild.iconURL({ dynamic: true }) ?? undefined
          )
          .setTitle(`Votre projet a été très aprécié !`)
          .setDescription(
            `Vous pouvez dès maintenant présenter votre projet dans <#${config.reward_channel_id}> en vous addressant à un membre du staff. Le projet visé est le suivant : [Lien vers le projet présenté](${message.url})`
          )
      )

    return app.sendLog(
      guild,
      `${member} can be **rewarded**! ${(
        client.emojis.resolve(config.reward_emoji_id)?.toString() ?? ""
      ).repeat(5)}`,
      config
    )
  },
}

module.exports = listener
