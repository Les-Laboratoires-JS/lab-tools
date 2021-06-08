// file deepcode ignore no-any: ensurePath must have Enmap<any, any>

import "dayjs/locale/fr"
import dayjs from "dayjs"
import prettier from "prettier"
import { join } from "path"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import toObject from "dayjs/plugin/toObject"
import Discord from "discord.js"
import * as app from "../app"
import fetch from "node-fetch"
import * as url from "url"

// Snowflakes
export const validation = "659513985552351261"
export const logChannel = "622817980853780503"
export const justAMember = "620641458168397845"
export const presentations = "622383963511717928"
export const approved = "827275120128294932"
export const disapproved = "827275869135437824"
export const staff = "810947385911803964"
export const general = "620664805400772621"
export const cobaye = "620640927089688587"
export const emoteOnly = "811720508239380561"
export const gameChannel = "833685867502764092"
export const ghom = "352176756922253321"
export const minMaxGap = 15
export const memesChannelID = "623018940662022163"

export const jsCodeBlockRegex = /^```(?:js)?\s(.+[^\\])```$/is
export const codeBlockRegex = /^```([a-z-]+)?\s(.+[^\\])```$/is

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
    return text.slice(0, size)
  } else {
    return text
  }
}

/**
 * inject the code in the code block and return code block
 */
export function toCodeBlock(code: string, lang: string = ""): string {
  return "```" + lang + "\n" + code + "\n```"
}

/**
 * extract the code from code block and return code
 */
export function fromCodeBlock(codeBlock: string): null | string {
  const match = codeBlockRegex.exec(codeBlock)
  if (match) return match[1]
  return null
}

export function formatJSCode(code: string, options?: prettier.Options): string {
  return prettier.format(code, {
    semi: false,
    ...(options ?? {}),
  })
}

export interface Code {
  lang?: string
  content: string
}

export const CODE = {
  pattern: /^```(\S+)?\s(.+[^\\])```$/is,
  /**
   * extract the code from code block and return code
   */
  parse(raw: string): Code | undefined {
    const match = this.pattern.exec(raw)
    if (!match) return
    return {
      lang: match[1],
      content: match[2],
    }
  },
  /**
   * inject the code in the code block and return code block
   */
  stringify({ lang, content }: Code): string {
    return "```" + (lang ?? "") + "\n" + content + "\n```"
  },
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

export function isStaff(member: Discord.GuildMember) {
  return (
    member.permissions.has("ADMINISTRATOR", true) ||
    member.roles.cache.has(staff)
  )
}

export function isAdmin(member: Discord.GuildMember) {
  return member.roles.cache.has(module.exports.admin)
}

export function scrap<T, A extends any[] = any[]>(
  item: T | ((...args: A) => T),
  ...args: A
): T {
  // @ts-ignore
  return typeof item === "function" ? item(...args) : item
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
  const max = min + minMaxGap
  return [Math.round(min), Math.round(max)]
}

export function rootPath(...path: string[]): string {
  return join(process.cwd(), ...path)
}

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(toObject)
dayjs.locale("fr")
dayjs.utc(1)
dayjs.tz.setDefault("France/Paris")

export { dayjs }

/**
 * Simple cache for manage temporary values
 */
export const cache = new (class {
  private data: { [key: string]: any } = {}

  get<T>(key: string): T | undefined {
    return this.data[key]
  }

  set(key: string, value: any) {
    this.data[key] = value
  }

  ensure<T>(key: string, defaultValue: T): T {
    let value = this.get<T>(key)
    if (value === undefined) {
      value = defaultValue
      this.set(key, value)
    }
    return value
  }

  delete(key: string) {
    delete this.data[key]
  }
})()

export let gameStarted = false

export async function startGame(client: app.Client) {
  if (gameStarted) return

  gameStarted = true

  const channel = client.channels.cache.get(gameChannel)
  const number = Math.random() * 99999999999999999999999999999

  if (!channel || !channel.isText()) return

  await channel.send(
    "**Trouvez le bon nombre !**\n<:btn_minus:827275974390579250> C'est moins\n<:btn_plus:827275935262048296> C'est plus\nBonne chance !"
  )

  function listenGame(message: app.Message): unknown {
    if (message.channel !== channel) return client.once("message", listenGame)
    if (message.system || message.author.bot)
      return client.once("message", listenGame)

    if (message.content === "stop" && message.author.id === ghom) {
      gameStarted = false
      return message.channel.send("Partie annulée.")
    }

    const test = Number(message.content)

    if (Number.isNaN(test)) return client.once("message", listenGame)

    if (number < test) message.react("827275974390579250")
    else if (number > test) message.react("827275935262048296")
    else {
      const score = app.score.ensure(message.author.id, 0)
      message.channel.send(
        `**Le grand gagnant est ${message.author} !**\nIl gagne 1 point. (score: ${score} + 1)`
      )
      app.score.inc(message.author.id)
      gameStarted = false
      return
    }

    return client.once("message", listenGame)
  }

  client.once("message", listenGame)
}

// Returns true if repost
export async function checkRedditImage(redditURL: string): Promise<boolean> {
  const postId = redditURL.split('/')[4]
  const options = {
    filter: true,
    url: redditURL,
    postId,
    same_sub: true,
    filter_author: true,
    only_older: false,
    include_crossposts: false,
    meme_filter: false,
    target_match_percent: 90,
    filter_dead_matches: false,
    target_days_old: 0
  }
  return fetch("https://api.repostsleuth.com/image" + url.format({query: options}))
    .then(res=>res.json())
    .then(body=>body.matches.length >= 1)
}