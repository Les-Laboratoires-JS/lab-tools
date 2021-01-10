import * as app from "../app"

const command: app.Command = {
  name: "company",
  aliases: ["cny"],
  async run(message) {
    let key = app.getArgument(message, ["list", "create", "remove"])

    switch (key) {
      case "create": {
        if (app.companies.find("ownerID", message.author.id)) {
          return message.channel.send("Kestufou t'as déjà une entreprise !")
        }
        const companyName = app.getArgument(message)
        if (!companyName)
          return message.channel.send(
            "Faut renseigner le nom de ton entreprise du con"
          )
        const description = app.getArgument(message, "rest")
        const company = {
          name: companyName,
          description,
          ownerID: message.author.id,
        } as app.Company
        app.companies.set(companyName, company)
        app.transaction(message.author.id, [`company:${company.name}`], 0)
        return message.channel.send(
          "Ton entreprise a été crée, jeune entrepreneur !"
        )
      }

      case "remove": {
        const company = app.companies.find("ownerID", message.author.id)
        if (!company) {
          return message.channel.send(
            "Je peux pas supprimer ton entreprise si t'en a pas..."
          )
        }
        message.channel.send(
          "Pour confirmer, envoie `ok`, sinon, envoie `stop`"
        )
        const collector = message.channel.createMessageCollector(
          (m) => m.author.id === message.author.id,
          { time: 60000 }
        )
        collector
          .on("collect", (m) => {
            switch (m.content) {
              case "ok":
                app.transaction(
                  `company:${company.name}`,
                  [message.author.id],
                  app.money.ensure(`company:${company.name}`, {history: [], money: 0}).money
                )
                app.companies.delete(company.name)
                return message.channel.send("Ok, bye bye " + company.name)
              case "stop":
                collector.stop()
                return message.channel.send("Opération annulée !")
            }
          })
          .on(
            "end",
            (_, reason) =>
              reason === "time" &&
              message.channel.send("Trop lent, j'annule la procédure")
          )
        break
      }
      case "list": {
        const companies = app.companies.array().sort((a, b) => {
          return (
            app.money.ensure(`company:${b.name}`, {history: [], money: 0}).money
            -
            app.money.ensure(`company:${a.name}`, {history: [], money: 0}).money

          )
        })
        const pages = await Promise.all(
          app
            .splitChunks<app.Company>(companies, 5)
            .map(async (chunk, i, arr) => {
              const embed = new app.Discord.MessageEmbed()
              embed.setDescription(`Page ${i + 1}/${arr.length}`)
              for (const company of chunk) {
                const owner = await message.client.users.fetch(company.ownerID)
                embed.addField(
                  company.name,
                  `${owner.tag} - ${
                    company.description || "Pas de description"
                  } - ${app.money.ensure(`company:${company.name}`, {history: [], money: 0}).money}${
                    app.currency
                  }`
                )
              }
              return embed
            })
        )
        if (pages.length === 0)
          return message.channel.send(`Aucune entreprise...`)
        let currentPage = 0
        const menu = await message.channel.send(pages[currentPage])
        const collector = menu.createReactionCollector(
          (r, user) => user.id === message.author.id
        )
        await menu.react("◀️")
        await menu.react("▶️")
        await menu.react("🛑")
        collector.on("collect", (reaction) => {
          if (reaction.emoji.toString() === "▶️") {
            if (currentPage + 1 !== pages.length) currentPage++
            menu.edit(pages[currentPage])
          }
          if (reaction.emoji.toString() === "◀️") {
            if (currentPage - 1 !== -1) currentPage--
            menu.edit(pages[currentPage])
          }
          if (reaction.emoji.toString() === "🛑") {
            collector.stop()
            message.channel.send("Arrêt du menu...")
          }
        })
        break
      }
      default:
        const companyName =
          app.getArgument(message, "word") ||
          app.companies.find("ownerID", message.author.id)?.name
        if (!companyName)
          return message.channel.send(
            "Vous n'avez pas d'entreprise, essayez de renseigner le nom d'une entreprise !"
          )
        const company = app.companies.get(companyName)
        if (!company)
          return message.channel.send(
            `Aucune entreprise ne répond au nom de ${companyName} :/`
          )
        const account = app.money.ensure(`company:${company.name}`, {history: [], money: 0})
        
        let totalPlus: number = 0;
        let totalMinus: number = 0;
        account.history
          .filter(entry => {
            return (Date.now() - entry.date)  < 86400000
          })
          .forEach((el) => {
            if(el.amount >= 0) {
              totalPlus += el.amount
            } else {
              totalMinus += el.amount
            }
          })
        
        return message.channel.send(`
\`\`\`diff
Nom: ${companyName}
Owner: ${(await message.client.users.fetch(company.ownerID)).tag}
Description: ${company.description}
Money: ${account.money}${app.currency}
Bilan 24h: 
+ ${totalPlus}
- ${totalMinus}
 = ${totalPlus + totalMinus}
\`\`\`
          `)
    }
  },
}

module.exports = command
