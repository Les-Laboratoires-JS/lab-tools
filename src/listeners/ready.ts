import * as app from "../app"
import { CronJob } from "cron"

const listener: app.Listener<"ready"> = {
  event: "ready",
  once: true,
  async call() {
    const helloChannel = (await this.channels.fetch(
      app.globals.ensure("helloChannel", app.general)
    )) as app.TextChannel

    await helloChannel.send("I'm back ! <a:dancing:576104669516922881>")

    app.globals.delete("helloChannel")

    console.log("New deployment", app.dayjs().format("DD/MM/YYYY hh:mm:ss"))

    const labs = await this.guilds.fetch(app.labs)

    await labs.members.fetch()

    const job = new CronJob(
      "0 0 * * *",
      async () => {
        let totalCompanyTax = 0
        let totalCompaniesTaxed = 0
        let totalPrivateTax = 0
        let totalPrivateTaxed = 0

        for (const [id, account] of app.money.entries()) {
          if (id === "bank") continue
          const tax = id.startsWith("company:")
            ? app.tax.companyTax
            : app.tax.privateTax
          const formattedID = id.startsWith("company:")
            ? id.replace("company:", "")
            : id

          const taxAmount = Math.floor(account.money * app.tax.privateTax)

          if (account.money < taxAmount || taxAmount === 0) continue

          await app.transaction(id, ["bank"], taxAmount)
          if (id.startsWith("company:")) {
            totalCompanyTax += taxAmount
            totalCompaniesTaxed++
          } else {
            totalPrivateTax += taxAmount
            totalPrivateTaxed++
          }
        }
        const toTake = Math.round(
          app.royalties * (totalPrivateTax + totalCompanyTax)
        )
        const admins = labs.members.cache
          .filter((member) => member.roles.cache.has(app.admin))
          .map((member) => member.id)
        await app.transaction(
          "bank",
          admins,
          Math.round(toTake / admins.length)
        )
        const channel = labs.channels.cache.get(
          app.publiclogs
        ) as app.TextChannel
        channel.send(
          `
\`\`\`diff
~ Membres du serveur :
- ${totalPrivateTax}${app.currency}
 = ${totalPrivateTaxed} taxés

~ Entreprises :
- ${totalCompanyTax}${app.currency}
 = ${totalCompaniesTaxed} taxées

~ Royalties admins :
+ ${toTake}${app.currency}
 = ${admins.length} admins
\`\`\`
`
        )
      },
      null,
      true,
      "Europe/Paris"
    )
    job.start()
  },
}

module.exports = listener
