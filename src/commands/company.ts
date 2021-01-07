import * as app from "../app"

const command: app.Command = {
  name: "company",
  aliases: ["cny"],
  async run(message) {
    let key = app.getArgument(message, [
        "list",
        "create",
        "remove",
        "join"
    ])
    
    switch(key) {
        case "create": {
          if(app.companies.find('ownerID', message.author.id)) {
            return message.channel.send('Kestufou t\'as déjà une entreprise !')
          }
          console.log(app.companies)
          const companyName = app.getArgument(message)
          if(!companyName) return message.channel.send('Faut renseigner le nom de ton entreprise du con')
          const description = app.getArgument(message, "rest")
          const company = {
            name: companyName,
            description,
            ownerID: message.author.id,
            money: 0,
          } as app.Company
          app.companies.set(companyName, company)
          return message.channel.send('Ton entreprise a été crée, jeune entrepreneur !')
        }

        case "remove": {
          const company = app.companies.find('ownerID', message.author.id)
          if(!company) {
            return message.channel.send('Je peux pas supprimer ton entreprise si t\'en a pas...')
          }
          message.channel.send('Pour confirmer, envoie `ok`, sinon, envoie `stop`')
          const collector = message.channel.createMessageCollector(m => m.author.id === message.author.id, { time: 60000 })
          collector
            .on('collect', m => {
              switch(m.content) {
                case "ok":
                  app.companies.delete(company.name)
                  return message.channel.send('Ok, bye bye ' + company.name)
                case "stop":
                  collector.stop()
                  return message.channel.send('Opération annulée !')
              }
            })
            .on('end', (_, reason) => 
              reason === "time" && message.channel.send('Trop lent, j\'annule la procédure')
            )
            break;
        }
        case "list": {
          const pages = await Promise.all(app.splitChunks<app.Company>(app.companies.array(), 10).map(async (chunk, i, arr) => {
            const embed = new app.Discord.MessageEmbed()
            embed.setDescription(`Page ${i+1}/${arr.length}`)
            for(const company of chunk) {
              const owner = await message.client.users.fetch(company.ownerID)
              embed.addField(company.name, `${owner.tag} - ${company.description}`)
            }
            return embed
          }))
          if(pages.length === 0) return message.channel.send(`Aucune entreprise...`)
          let currentPage = 0;
          const menu = await message.channel.send(pages[currentPage])
          const collector = menu.createReactionCollector((r, user) => user.id === message.author.id)
          await menu.react("◀️")
          await menu.react("▶️")
          await menu.react("🛑")
          collector.on('collect', (reaction) => {
            if(reaction.emoji.name === "arrow_forward") {
              if(currentPage+1 !== pages.length) currentPage++
              menu.edit(pages[currentPage])
            }
            if(reaction.emoji.name === "arrow_backward") {
              if(currentPage-1 !== -1) currentPage--
              menu.edit(pages[currentPage]) 
            }
            if(reaction.emoji.name === "octagonal_sign") {
              collector.stop()
              message.channel.send('Arrêt du menu...')
            }
          })
        }
        default:
            return message.channel.send(`Not yet implemented`)
    }
  },
}

module.exports = command
