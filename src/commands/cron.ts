import * as app from "../app"
import cron from "cron"

import cronTable from "../tables/cron"

const command: app.Command<app.GuildMessage> = {
  name: "cron",
  description: "Manage cron jobs",
  async run(message) {
    return app.sendCommandDetails(message, this, process.env.PREFIX ?? "!")
  },
  subs: [
    {
      name: "start",
      aliases: ["launch", "run", "play"],
      description: "Start a task",
      middlewares: [app.staffOnly],
      positional: [
        {
          name: "name",
          description: "The name of task",
        },
      ],
      async run(message) {
        if (message.args.name) {
          const slug = app.slug("job", message.args.name)

          const currentCron = await cronTable.query
            .select()
            .where("name", message.args.name)
            .first()

          if (!currentCron)
            return message.channel.send("Ce cron n'existe pas...")

          if (
            currentCron.user_id !== message.author.id &&
            message.author.id !== process.env.OWNER
          )
            return message.channel.send("Ce cron ne t'appartient pas!")

          let job = app.cache.get<cron.CronJob>(slug)

          if (!job) {
            const channel = await message.client.channels.fetch(
              currentCron.channel_id
            )
            job = cron.job(currentCron.period, () => {
              if (channel.isText()) channel.send(currentCron.content)
            })
            app.cache.set(slug, job)
          }

          if (job.running)
            return message.channel.send("Le cron est déjà lancé.")

          job.start()

          return message.channel.send(
            `Votre cron "${message.args.name}" s'est correctement lancé.`
          )
        }
      },
    },
    {
      name: "stop",
      aliases: ["exit", "kill"],
      description: "Stop a task",
      middlewares: [app.staffOnly],
      positional: [
        {
          name: "name",
          description: "The name of task",
        },
      ],
      async run(message) {
        if (message.args.name) {
          const slug = app.slug("job", message.args.name)

          const currentCron = await cronTable.query
            .select()
            .where("name", message.args.name)
            .first()

          if (!currentCron)
            return message.channel.send("Ce cron n'existe pas...")

          if (
            currentCron.user_id !== message.author.id &&
            message.author.id !== process.env.OWNER
          )
            return message.channel.send("Ce cron ne t'appartient pas!")

          const job = app.cache.get<cron.CronJob>(slug)

          if (!job) return message.channel.send("Ce cron n'est pas lancé...")

          job.stop()

          return message.channel.send("Ton cron a correctement été stoppé.")
        }
      },
    },
    {
      name: "delete",
      aliases: ["remove", "rm", "del"],
      middlewares: [app.staffOnly],
      description: "Remove a task",
      positional: [
        {
          name: "name",
          description: "The name of task",
        },
      ],
      async run(message) {
        if (message.args.name) {
          const slug = app.slug("job", message.args.name)

          const currentCron = await cronTable.query
            .select()
            .where("name", message.args.name)
            .first()

          if (!currentCron)
            return message.channel.send("Ce cron n'existe pas...")

          if (
            currentCron.user_id !== message.author.id &&
            message.author.id !== process.env.OWNER
          )
            return message.channel.send("Ce cron ne t'appartient pas!")

          const job = app.cache.get<cron.CronJob>(slug)

          job?.stop()

          app.cache.delete(slug)

          await cronTable.query.delete().where("name", message.args.name)

          return message.channel.send("Ton cron a correctement été supprimé.")
        }
      },
    },
    {
      name: "add",
      aliases: ["set", "create", "make"],
      middlewares: [app.staffOnly],
      description: "Add a task",
      positional: [
        {
          name: "name",
          description: "The name of task",
          required: true,
        },
      ],
      args: [
        {
          name: "channel",
          description: "The channel id of task",
          required: true,
        },
        {
          name: "period",
          description: "The period of task",
          required: true,
        },
        {
          name: "content",
          description: "The content of task",
          required: true,
        },
      ],
      async run(message) {
        const slug = app.slug("job", message.args.name)

        let channel: app.Channel
        try {
          channel = await message.client.channels.fetch(message.args.channel)
        } catch (error) {
          return message.channel.send("Le salon ciblé est inexistant.")
        }

        if (!channel.isText())
          return message.channel.send("Le channel ciblé n'est pas textuel...")

        const oldJob = app.cache.get<cron.CronJob>(slug)

        if (oldJob) {
          if (oldJob.running) oldJob.stop()
          app.cache.delete(slug)
        }

        try {
          const job = cron.job(message.args.period, () => {
            if (channel.isText()) channel.send(message.args.content)
          })

          job.start()

          app.cache.set(slug, job)
        } catch (error) {
          return message.channel.send(
            "La `period` renseignée est peut être mauvaise..."
          )
        }

        await cronTable.query
          .insert({
            channel_id: message.args.channelId,
            user_id: message.author.id,
            content: message.args.content,
            period: message.args.period,
            name: message.args.name,
          })
          .onConflict("name")
          .merge()

        return message.channel.send(
          `Ton cron "${message.args.name}" a bien été sauvegardé et lancé !`
        )
      },
    },
    {
      name: "list",
      aliases: ["ls"],
      description: "List tasks",
      async run(message) {
        new app.Paginator(
          app.Paginator.divider(
            Array.from(await cronTable.query.select()),
            10
          ).map((page) => {
            return new app.MessageEmbed()
              .setTitle("Voici une liste des cron")
              .setDescription(
                page
                  .map((cron) => {
                    const job = app.cache.get<cron.CronJob>(
                      app.slug("job", cron.name)
                    )
                    return `\`${app.resizeText(
                      cron.name,
                      6,
                      true
                    )}\` | period: \`${app.resizeText(cron.period, 15)}\` | ${
                      job?.running
                        ? "<a:wait:813551205283790889> Running..."
                        : "🛑 Stopped"
                    }`
                  })
                  .join("\n")
              )
          }),
          message.channel,
          (reaction, user) => {
            return message.author.id === user.id
          }
        )
      },
    },
  ],
}

module.exports = command
