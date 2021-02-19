import * as app from "../app"

const command: app.CommandResolvable = () => ({
  name: "help",
  aliases: ["h", "usage"],
  botPermissions: ["SEND_MESSAGES"],
  description: "Help menu",
  longDescription: "Display all commands of bot or detail a target command.",
  examples: ["help", ...app.commands.map((cmd, key) => "help " + key)],
  positional: [
    {
      name: "command",
      description: "The target command to detail.",
    },
  ],
  async run(message) {
    const prefix = app.globals.ensure("prefix", process.env.PREFIX)

    if (message.positional.command) {
      const cmd = app.commands.resolve(message.positional.command)

      if (cmd) {
        let pattern = prefix + cmd.name

        if (cmd.positional) {
          for (const positional of cmd.positional) {
            const dft =
              positional.default !== undefined
                ? `="${await app.scrap(positional.default, message)}"`
                : ""
            pattern += positional.required
              ? ` <${positional.name}${dft}>`
              : ` [${positional.name}${dft}]`
          }
        }

        if (cmd.args) {
          for (const arg of cmd.args) {
            if (arg.isFlag) {
              pattern += ` [-${arg.flag ?? `-${arg.name}`}]`
            } else {
              const dft =
                arg.default !== undefined
                  ? `="${app.scrap(arg.default, message)}"`
                  : ""
              pattern += arg.required
                ? ` <${arg.name}${dft}>`
                : ` [${arg.name}${dft}]`
            }
          }
        }

        await message.channel.send(
          new app.MessageEmbed()
            .setColor("BLURPLE")
            .setAuthor(
              `Command: ${cmd.name}`,
              message.client.user?.displayAvatarURL()
            )
            .setTitle(`aliases: ${cmd.aliases?.join(", ") ?? "none"}`)
            .setDescription(
              cmd.longDescription ?? cmd.description ?? "no description"
            )
            .addField("pattern", app.toCodeBlock(pattern))
            .addField(
              "examples:",
              app.toCodeBlock(
                cmd.examples?.map((example) => prefix + example).join("\n") ??
                  "none"
              ),
              false
            )
            .addField(
              "needed permissions:",
              `**Bot**: ${cmd.botPermissions?.join(", ") || "none"}\n` +
                `**User**: ${cmd.userPermissions?.join(", ") || "none"}`,
              true
            )
            .addField(
              "sub commands:",
              cmd.subs
                ?.map(
                  (command) =>
                    `**${command.name}**: ${
                      command.description ?? "no description"
                    }`
                )
                .join("\n") || "none",
              true
            )
        )
      } else {
        await message.channel.send(
          new app.MessageEmbed()
            .setColor("RED")
            .setAuthor(
              `Unknown command "${message.positional.command}"`,
              message.client.user?.displayAvatarURL()
            )
        )
      }
    } else {
      await message.channel.send(
        new app.MessageEmbed()
          .setColor("BLURPLE")
          .setAuthor("Command list", message.client.user?.displayAvatarURL())
          .setDescription(
            app.commands
              .map((resolvable) => {
                const cmd = app.resolve(resolvable) as app.Command
                return `**${prefix}${cmd.name}** - ${
                  cmd.description ?? "no description"
                }`
              })
              .join("\n")
          )
          .setFooter(`${prefix}help <command>`)
      )
    }
  },
  subs: [
    {
      name: "count",
      examples: ["help count"],
      async run(message) {
        return message.channel.send(
          new app.MessageEmbed()
            .setColor("BLURPLE")
            .setAuthor("Command count", message.client.user?.displayAvatarURL())
            .setDescription(
              `There are currently ${
                app.commands.size
              } commands and ${app.commands.reduce<number>(
                (acc, resolvableCommand) => {
                  const command = app.resolve(resolvableCommand)
                  if (command && command.subs) return acc + command.subs.length
                  return acc
                },
                0
              )} sub-commands`
            )
        )
      },
    },
  ],
})

module.exports = command
