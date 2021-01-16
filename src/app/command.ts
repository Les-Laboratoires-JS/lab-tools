import Discord from "discord.js"
import path from "path"
import yargsParser from "yargs-parser"

export interface Arg {
  name: string
  flag?: boolean
  aliases?: string[] | string
  default?: string | (() => string | Promise<string>)
  required?: boolean
  castValue?:
    | "number"
    | "date"
    | "json"
    | "boolean"
    | "regex"
    | "array"
    | ((value: string) => unknown)
  checkValue?: RegExp | ((value: string) => boolean | Promise<boolean>)
  description?: string
}

export function isCommandMessage(
  message: Discord.Message
): message is CommandMessage {
  return (
    !message.system &&
    !!message.guild &&
    message.channel instanceof Discord.TextChannel
  )
}

export function resolve(
  resolvable: CommandResolvable | undefined
): Command | undefined {
  return typeof resolvable === "function" ? resolvable() : resolvable
}

export type CommandMessage = Discord.Message & {
  channel: Discord.TextChannel
  guild: Discord.Guild
  member: Discord.GuildMember
  args: yargsParser.Arguments & {
    rest: string
  }
}

export type CommandResolvable = Command | (() => Command)

export interface Command {
  name: string
  aliases?: string[]
  loading?: boolean
  coolDown?: number
  description?: string
  longDescription?: string
  examples?: string[]
  guildOwner?: boolean
  botOwner?: boolean
  staffOnly?: boolean
  needMoney?: number
  userPermissions?: Discord.PermissionString[]
  botPermissions?: Discord.PermissionString[]
  args?: Arg[]
  run: (message: CommandMessage) => unknown
  subs?: Command[]
}

export class Commands extends Discord.Collection<string, CommandResolvable> {
  public resolve(key: string): Command | undefined {
    const resolvable = this.find((resolvable) => {
      const command = resolve(resolvable) as Command
      return (
        key === command.name ||
        !!command.aliases?.some((alias) => key === alias)
      )
    })
    return resolve(resolvable)
  }

  public add(resolvable: CommandResolvable) {
    const command = resolve(resolvable) as Command
    this.set(command.name, resolvable)
  }
}

export const commands = new Commands()

export const commandsPath =
  process.env.COMMANDS_PATH ?? path.join(__dirname, "..", "commands")
