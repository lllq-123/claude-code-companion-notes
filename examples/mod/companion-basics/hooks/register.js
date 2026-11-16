// companion-basics：一个最小的 Claude Code mod 示例（claude-code-companion-notes 第二篇）
//
// 它只做两件事：
//   1. 换称呼：Claude Code 自己写给模型的话里，"the user" 换成你的名字。
//   2. 换一节：系统提示词里你指定的那一节，原文一字不差才换成你写的；对不上就原样发出去。
//
// 动的只有 Claude Code 自己写给模型的话。你的消息、@ 进来的文件、CLAUDE.md、hook 加进来的内容，都原样不动。
// mod 还能跑命令、读写文件、联网、调工具，这个示例一样都没用；只在填了要换的节时，往调试日志里写一句换没换上。
//
// 用之前改下面的常量：
//   MY_NAME 换成你希望 Claude 怎么称呼你；
//   SECTION_NAME / SECTION_ORIGINAL / SECTION_MINE 不想换节就留空，换节那部分什么都不做。

// ———— 1. 换称呼 ————
const MY_NAME = '你的名字'

// 两头的 \b 让 users、username 这种词不受影响；(?!-) 让 the user-facing 这种带连字符的词也不受影响。
const THE_USER = /\b[Tt]he user\b(?!-)/g
// 替换内容写成函数：名字里就算有 $ 这类符号，也照原样换进去。
const swapUser = (text) => text.replace(THE_USER, () => MY_NAME)

// 引擎提醒里只换这两种：技能清单、子代理（subagent）清单。
// 别的提醒不碰：有的里面夹着你的文件内容或 git 记录，那是数据，不该改。
const SWAP_ATTACHMENTS = ['skill_listing', 'agent_listing_delta']

// ———— 2. 换一节 ————
// 节名和原文怎么拿到，见教程第 4 节「怎么拿到节名和原文」。原文要一字不差，换行也算。
// 想删掉这一节，就把 SECTION_MINE 写成 null。
// 换上没有，会往调试日志里写一句以「换节：」开头的话；怎么看，也在教程第 4 节。
const SECTION_NAME = ''
const SECTION_ORIGINAL = ''
const SECTION_MINE = ''

export function register(on) {
  // 系统提示词：每一节都过一遍。先看要不要换节，再换称呼。
  on('prompt.compose', async ($, e, next) => {
    const r = await next(e)
    if (!r || !Array.isArray(r.sections)) return r
    const note = (msg) => $.ui.log('换节：' + msg, { to: 'debug' })
    const sections = []
    let found = false
    for (const s of r.sections) {
      let text = s.text
      if (SECTION_NAME && s.id === SECTION_NAME) {
        found = true
        if (text !== SECTION_ORIGINAL) {
          note(SECTION_NAME + ' 原文对不上，没换')
        } else if (SECTION_MINE === null) {
          note('删掉了 ' + SECTION_NAME)
          continue
        } else if (SECTION_MINE === '') {
          note('SECTION_MINE 还空着，没换')
        } else {
          note('换上了 ' + SECTION_NAME)
          text = SECTION_MINE
        }
      }
      sections.push(typeof text === 'string' ? { ...s, text: swapUser(text) } : s)
    }
    if (SECTION_NAME && !found) note('没找到叫 ' + SECTION_NAME + ' 的节，没换')
    return { ...r, sections }
  })

  // 工具说明（Claude Code 自带的和 MCP 的都经过这里）
  on('tool.describe', async ($, e, next) => {
    const r = await next(e)
    if (!r || typeof r.description !== 'string') return r
    const description = swapUser(r.description)
    return description === r.description ? r : { ...r, description }
  })

  // 引擎自己发的提醒：只认 Claude Code 自己写的，只换上面那两种
  on('prompt.attachment', async ($, e, next) => {
    if (e.origin && e.origin.kind === 'engine' && SWAP_ATTACHMENTS.includes(e.type) && typeof e.text === 'string') {
      const text = swapUser(e.text)
      if (text !== e.text) return next({ ...e, text })
    }
    return next(e)
  })
}
