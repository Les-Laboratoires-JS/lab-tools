// file deepcode ignore no-any: ensurePath must have Enmap<any, any>

import "dayjs/locale/fr"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import toObject from "dayjs/plugin/toObject"
import Discord from "discord.js"
import * as command from "./command"
import * as database from "./database"

// Snowflakes
export const labs = "507389389098188820"
export const ghom = "352176756922253321"
export const loockeeer = "272676235946098688"
export const validation = "659513985552351261"
export const scientifique = "620641458168397845"
export const presentations = "622383963511717928"
export const approved = "640661715108888595"
export const disapproved = "507420627821527040"
export const staff = "620657235533758494"
export const modo = "620302774638215168"
export const general = "620664805400772621"
export const cobaye = "620640927089688587"
export const publiclogs = "789522053728305250"
export const admin = "620658954195828736"
export const deleteDelay = 1000*10

export const owners = ["272676235946098688", "352176756922253321"]

// Money
export const tax = {
  privateTax: 0.07,
  companyTax: 0.1,
  stocksWallet: 0,
  stocksToPrivateTax: 0.25,
}
export const currency = "Ɠ"
export const royalties = 0.2
export const minmaxgap = 15

export const codeRegex = /^```(?:js)?\s(.+[^\\])```$/is

export function code(text: string, lang = ""): string {
  return "```" + lang + "\n" + text.replace(/```/g, "\\```") + "\n```"
}

export function handleMessage(message: Discord.Message) {
  if(!message.content.includes("🔬")) {
    setTimeout(() => {
      message.delete()
    }, deleteDelay)
  }
  return message;
}

export function getArgument(message: Discord.Message): string | null
export function getArgument(
  message: Discord.Message,
  match: "number"
): number | null
export function getArgument(
  message: Discord.Message,
  match: "rest" | "word" | RegExp | string[]
): string | null
export function getArgument(
  message: Discord.Message,
  match: "rest" | "word" | "number" | RegExp | string[] = "word"
): string | number | null {
  if (match === "word") {
    const key = message.content.split(/\s+/)[0]
    message.content = message.content.replace(key, "").trim()
    return key
  } else if (match === "rest") {
    const key = message.content
    message.content = ""
    return key
  } else if (match === "number") {
    const regex = /^-?[1-9]\d*/
    const result = regex.exec(message.content)
    if (result) {
      message.content = message.content.replace(regex, "").trim()
      return Number(result[0])
    }
  } else if (Array.isArray(match)) {
    for (const key of match) {
      if (message.content.startsWith(key)) {
        message.content = message.content.slice(key.length).trim()
        return key
      }
    }
  } else {
    const result = match.exec(message.content)
    if (result) {
      const key = result[1] ?? result[0]
      match.lastIndex = 0
      message.content.replace(match, "").trim()
      return key
    }
  }
  return null
}

export async function resolveMember(
  message: command.CommandMessage,
  text?: string
): Promise<Discord.GuildMember> {
  if (message.mentions.members && message.mentions.members.size > 0) {
    return message.mentions.members.first() as Discord.GuildMember
  }

  text = text || message.content

  if (text.length < 3) return message.member

  if (/^\d+$/.test(text)) {
    return message.guild.members.fetch(text)
  }

  text = text.toLowerCase()

  const members = await message.guild.members.fetch({ query: text })

  if (members.size > 0) return members.first() as Discord.GuildMember

  return message.member
}

export function isMod(member: Discord.GuildMember) {
  return (
    member.permissions.has("ADMINISTRATOR", true) ||
    member.roles.cache.has(module.exports.modo)
  )
}

export function isAdmin(member: Discord.GuildMember) {
  return member.roles.cache.has(module.exports.admin)
}

export function leaderItem(
  obj: { score: number; id: string },
  i: number,
  arr: { score: number; id: string }[],
  typeName: string
) {
  const maxLen = String(Math.max(...arr.map((el) => el.score))).length
  const position = String(i + 1)
  return `\`# ${position}${position.length === 1 ? " " : ""} | ${String(
    obj.score
  ).padStart(maxLen, " ")} ${typeName}\` - <@${obj.id}>`
}

export function calculateMinMaxDaily(combo: number): number[] {
  const min = 2 * Math.sqrt(100 * combo)
  const max = min + minmaxgap
  return [Math.round(min), Math.round(max)]
}

export function splitChunks<T = any>(array: T[], chunks: number): T[][] {
  return [...Array(Math.ceil(array.length / chunks))].map((_) =>
    array.splice(0, chunks)
  )
}

export async function getTargets(
  message: Discord.Message,
  limit: number = Infinity,
  members: boolean = true,
  companies: boolean = true,
  bank: boolean = true
): Promise<(Discord.GuildMember | string)[]> {
  const targets: (Discord.GuildMember | string)[] = []
  const IDRegex = /\d{18}/
  const mentionRegex = /<@!?\d{18}>/
  if (!members && !companies) return targets
  while (true) {
    const word = getArgument(message, "word")
    if (!word) break
    if (word === "bank" && bank) {
      targets.push("bank")
      continue
    }
    if (word.startsWith("company:") && companies) {
      const company = database.companies.has(word.replace("company:", ""))
      if (company) {
        targets.push(word)
        continue
      }
    }

    if (mentionRegex.test(word) && members) {
      const member = message.mentions.members?.first()
      if (member) {
        targets.push(member)
        message.mentions.users.delete(member.id)
        continue
      }
    }

    if (IDRegex.test(word) && members) {
      const member = await message?.guild?.members.fetch(word)
      if (member) {
        targets.push(member)
        continue
      }
    }

    if (members) {
      const member = (
        await message?.guild?.members?.fetch({ query: word, limit: 1 })
      )?.first()
      if (member) {
        targets.push(member)
        continue
      }
    }
    if (targets.length === limit) return targets
    throw Error("No company/member at " + word)
  }
  return targets
}

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(toObject)
dayjs.locale("fr")
dayjs.utc(1)
dayjs.tz.setDefault("France/Paris")

export { dayjs }
