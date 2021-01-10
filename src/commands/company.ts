import * as app from "../app"

const command: app.Command = {
  name: "company",
  aliases: ["cny"],
  async run(message) {
    let key = app.getArgument(message, [
        "list",
        "create",
        "remove",
    ])
    
    switch(key) {
        case "create": {
          if(app.companies.find('ownerID', message.author.id)) {
            return message.channel.send('Kestufou t\'as déjà une entreprise !').then(app.handleMessage)
          }
          const companyName = app.getArgument(message)
          if(!companyName) return message.channel.send('Faut renseigner le nom de ton entreprise du con').then(app.handleMessage)
          const description = app.getArgument(message, "rest")
          const company = {
            name: companyName,
            description,
            ownerID: message.author.id
          } as app.Company
          app.companies.set(companyName, company)
          app.money.set(`company:${company.name}`, 0)
          return message.channel.send('Ton entreprise a été crée, jeune entrepreneur !').then(app.handleMessage)
        }
        
        case "remove": {
          const company = app.companies.find('ownerID', message.author.id)
          if(!company) {
            return message.channel.send('Je peux pas supprimer ton entreprise si t\'en a pas...').then(app.handleMessage)
          }
          const m = await message.channel.send('Pour confirmer, envoie `ok`, sinon, envoie `stop`')
          const collector = message.channel.createMessageCollector(m => m.author.id === message.author.id, { time: 60000 })
          let ended = false;
          collector
            .on('collect', m => {
              app.handleMessage(m)
              switch(m.content) {
                case "ok":
                  app.companies.delete(company.name)
                  return message.channel.send('Ok, bye bye ' + company.name).then(app.handleMessage)
                case "stop":
                  collector.stop()
                  return message.channel.send('Opération annulée !').then(app.handleMessage)
              }
            })
            .on('end', (_, reason) => {
              if(reason !== "time" || ended) return;
              ended = true;
              app.handleMessage(m)
              message.channel.send('Trop lent, j\'annule la procédure').then(app.handleMessage)
              
            })
            break;
        }
        case "list": {
          const pages = await Promise.all(app.splitChunks<app.Company>(app.companies.array(), 10).map(async (chunk, i, arr) => {
            const embed = new app.Discord.MessageEmbed()
            embed.setDescription(`Page ${i+1}/${arr.length}`)
            for(const company of chunk) {
              const owner = await message.client.users.fetch(company.ownerID)
              embed.addField(company.name, `${owner.tag} - ${company.description} - ${app.money.ensure(company.name, 0)}${app.currency}`)
            }
            return embed
          }))
          if(pages.length === 0) return message.channel.send(`Aucune entreprise...`).then(app.handleMessage)
          let currentPage = 0;
          const menu = await message.channel.send(pages[currentPage])
          const collector = menu.createReactionCollector((r, user) => user.id === message.author.id)
          await menu.react("◀️")
          await menu.react("▶️")
          await menu.react("🛑")
          collector.on('collect', (reaction) => {
            if(reaction.emoji.toString() === "▶️") {
              if(currentPage+1 !== pages.length) currentPage++
              menu.edit(pages[currentPage])
            }
            if(reaction.emoji.toString() === "◀️") {
              if(currentPage-1 !== -1) currentPage--
              menu.edit(pages[currentPage]) 
            }
            if(reaction.emoji.toString() === "🛑") {
              collector.stop()
              message.channel.send('Arrêt du menu...').then(app.handleMessage)
              app.handleMessage(menu)
            }
          })
          break;
        }
        default:
          const companyName = app.getArgument(message, "word") || app.companies.find('ownerID', message.author.id)?.name
          if(!companyName) return message.channel.send("Vous n'avez pas d'entreprise, essayez de renseigner le nom d'une entreprise !").then(app.handleMessage)
          const company = app.companies.get(companyName)
          if(!company) return message.channel.send(`Aucune entreprise ne répond au nom de ${companyName} :/`).then(app.handleMessage)
          return message.channel.send(`
\`\`\`
Nom: ${companyName}
Owner: ${(await message.client.users.fetch(company.ownerID)).tag}
Description: ${company.description}
Money: ${app.money.ensure(`company:${company.name}`, 0)}${app.currency}
Bilan 24h: WIP (waiting for Ghom's new money system)
\`\`\`
          `).then(app.handleMessage)
    }
  },
}

module.exports = command
