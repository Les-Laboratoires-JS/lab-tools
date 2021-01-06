// file deepcode ignore no-any: ensurePath must have Enmap<any, any>

import "dayjs/locale/fr"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import toObject from "dayjs/plugin/toObject"
import Discord from "discord.js"
import * as app from "../app"

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
export const minmaxgap = 15

export const owners = ["272676235946098688", "352176756922253321"]

// Money
export const tax = 0.05
export const currency = "Ɠ"
export const royalties = 0.1

export const codeRegex = /^```(?:js)?\s(.+[^\\])```$/is

export function getProfile(id: string) {
  return app.profiles.ensure(id, {
    id,
    money: 0,
    scores: {},
    moneyLogs: [],
    daily: {
      combo: 0,
      last: -1,
    },
  })
}

export function setProfile(profile: app.Profile) {
  const last = app.profiles.get(profile.id) as app.Profile

  const moneyDiff = profile.money - last.money

  if (moneyDiff !== 0) {
    profile.moneyLogs.push({
      at: Date.now(),
      diff: moneyDiff,
      state: profile.money,
    })
  }

  app.profiles.set(profile.id, profile)
}

export function resizeText(
  text: string | number,
  size: number,
  before = false
): string {
  text = String(text)
  if (text.length < size) {
    return before
      ? " ".repeat(size - text.length) + text
      : text + " ".repeat(size - text.length)
  } else if (text.length > size) {
    return before ? text.slice(text.length - size, size) : text.slice(0, size)
  } else {
    return text
  }
}

export async function transaction(
  debitedID: string,
  debtorsID: string[] | string,
  amount: number,
  callback?: (missing: number) => unknown
): Promise<boolean> {
  const debited = getProfile(debitedID)

  if (typeof debtorsID === "string") debtorsID = [debtorsID]

  const total = debtorsID.length * amount

  if (debited.money < total) {
    await callback?.(total - debited.money)
    return false
  }

  debited.money -= total

  setProfile(debited)

  debtorsID.forEach((id) => {
    const debtor = getProfile(id)

    debtor.money += amount

    setProfile(debtor)
  })

  await callback?.(0)
  return true
}

export function code(text: string, lang = ""): string {
  return "```" + lang + "\n" + text.replace(/```/g, "\\```") + "\n```"
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
      message.content.replace(regex, "").trim()
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
  message: app.CommandMessage,
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

// Shop
    
export type ShopCategory = "Système monétaire" | "Perks"
    
export interface ShopItem {
  price: number
  name: string
  callback: "mp" | "bite" | "bite"
  quantity: number
  callbackOptions: any
  description: string
  category?: ShopCategory
}
    
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(toObject)
dayjs.locale("fr")
dayjs.utc(1)
dayjs.tz.setDefault("France/Paris")

export { dayjs }
