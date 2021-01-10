import { SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS, S_IFMT } from "constants"
import * as app from "../app"

const command: app.Command = {
  name: "money",
  aliases: ["$"],
  async run(message) {
    let key = app.getArgument(message, [
      "add",
      "gen",
      "create",
      "delete",
      "remove",
      "rm",
      "del",
      "give",
      "send",
      "ladder",
      "top",
      "leaderboard",
      "lead",
    ])

    // todo: ladder, log, target bank

    let amount = 0

    switch (key) {
      case "add":
      case "gen":
      case "create":
        key = "add"
        break
      case "delete":
      case "remove":
      case "rm":
      case "del":
        key = "remove"
        break
      case "give":
      case "send":
        key = "give"
        break
      case "leaderboard":
      case "lead":
      case "top":
      case "ladder":
        key = "ladder"
        break
    }

    if (
      key === "add" ||
      key === "remove" ||
      (key === "give" && message.content.includes("as bank"))
    ) {
      if (message.author.id !== app.ghom) {
        return message.channel.send(
          "C'est Ghom qui gère les sous <:stalin:564536294512918548>"
        )
      }
    }

    switch (key) {
      case "add":
      case "remove":
      case "give":
        amount = app.getArgument(message, "number") ?? 0

        if (amount < 1) {
          return message.channel.send(
            "Le montant est incorrect <:hum:703399199382700114>"
          )
        }
    }

    switch (key) {
      case "ladder": {
        return message.channel.send(
          new app.MessageEmbed()
            .setAuthor(`Leaderboard | ${app.currency}`)
            .setDescription(
              app.money
                .map((account: app.Money, id: string) => ({
                  id,
                  score: account.money,
                }))
                .filter(
                  (el: { id: string; score: number }) =>
                    el.id !== "bank" && !el.id.startsWith("company:")
                )
                .sort(
                  (
                    a: { id: string; score: number },
                    b: { id: string; score: number }
                  ) => b.score - a.score
                )
                .slice(0, 15)
                .map(
                  (
                    el: { id: string; score: number },
                    i: number,
                    arr: { id: string; score: number }[]
                  ) => app.leaderItem(el, i, arr, app.currency)
                )
                .join("\n")
            )
        )
      }

      case "add":
        app.money.math("bank", "+", amount, "money")
        app.money.push("bank", {from: "void", amount, date: Date.now()}, "history")
        return message.channel.send(
          `Ok, ${amount}${app.currency} ont été ajoutés à la banque. <:STONKS:772181235526533150>`
        )
      case "remove":
        app.money.math("bank", "-", amount, "money")
        app.money.push("bank", {from: "void", amount: -amount, date: Date.now()}, "history")
        return message.channel.send(
          `Ok, ${amount}${app.currency} ont été retirés de la banque. <:oui:703398234718208080>`
        )
      case "give": {
        const as = app.getArgument(message, ["as company", "as bank"])
        const targets = await app.getTargets(message).catch((err) => {
          const word = err.message.split(" at ")[1]
          return message.channel.send(
            "Aucune entreprise/membre ne correspond à " + word
          )
        })

        if (targets instanceof app.Discord.Message) return

        if (targets.length === 0)
          return message.channel.send(
            "Tu dois mentionner la ou les personnes / entreprise(s) ciblées  <:jpp:564431015377108992>"
          )
        const bank = as === "as bank"
        const company =
          as === "as company" &&
          app.companies.find("ownerID", message.author.id)
        if (!company && as === "as company")
          return message.channel.send(
            `Tu ne peux pas débiter ton entreprise si tu n'en n'a pas <:notLikeThis:507420569482952704>`
          )

        let taxed
        if (bank) taxed = "bank"
        else if (company) taxed = `company:${company.name}`
        else taxed = message.author.id

        const tax = targets.length * amount

        return app.transaction(
          taxed,
          targets.map((target) =>
            target instanceof app.Discord.GuildMember ? target.id : target
          ),
          amount,
          (missing) => {
            if (missing) {
              return message.channel.send(
                bank
                  ? `La banque ne possède pas assez d'argent. Il manque ${missing}${app.currency}`
                  : company
                  ? `Ton entreprise ${company.name} ne possède pas assez d'argent il manque ${missing}${app.currency}`
                  : `Tu ne possèdes pas assez d'argent <:lul:507420611484712971>\nIl te manque ${missing}${app.currency}`
              )
            } else {
              if (targets.length === 1) {
                return message.channel.send(
                  `${
                    bank ? "La banque a" : company ? "Ton entreprise" : "Tu as"
                  } transféré ${tax}${app.currency} vers le compte de **${
                    targets[0]
                  }**`
                )
              } else {
                return message.channel.send(
                  `${
                    bank ? "La banque a" : company ? "Ton entreprise" : "Tu as"
                  } perdu ${tax}${
                    app.currency
                  } en tout.\nLes membres suivants ont chacun reçus ${amount}${
                    app.currency
                  }.${app.code(
                    targets
                      .map((target) => {
                        return target.toString()
                      })
                      .join("\n")
                  )}`
                )
              }
            }
          }
        )
      }
      default:
        const bank = message.content.includes("as bank")
        const money = app.money.ensure(bank ? "bank" : message.author.id, {money: 0, history: []}).money

        const { combo } = app.daily.ensure(message.author.id, {
          combo: 0,
          last: -1,
        })

        const [dailyMin, dailyMax] = app.calculateMinMaxDaily(combo)

        if (bank) {
          return message.channel.send(
            `Il y a actuellement ${money}${app.currency} en banque.`
          )
        } else {
          return message.channel.send(
            `Vous possédez actuellement ${money}${
              app.currency
            }\nVotre taxe quotidienne s'élève à ${Math.floor(
              money * app.tax.privateTax
            )}${app.currency}\nVous avez cummulé ${combo} daily${
              combo > 1 ? "s" : ""
            }. Vous pouvez toucher entre ${dailyMin}${
              app.currency
            } et ${dailyMax}${app.currency} inclus au prochain daily.`
          )
        }
    }
  },
}

module.exports = command
