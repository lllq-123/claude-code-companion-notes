// reminder-allowlist：给 Claude Code 自己塞给模型的提醒做白名单（claude-code-companion-notes 第三篇）
//
// Claude Code 会自己往对话里塞一些话给模型看：今天几号、你的账号邮箱、现在是计划模式……
// 这个示例拿两份名单来管它们：
//   - 名单上的：照常发。
//   - 名单外的（包括 Claude Code 以后升级新加的）：看 MODE。
//       'watch'（只看，默认）：照常发，终端里多一行灰字「只看：会拦下 <类型>」。
//       'block'（拦）：不发，终端里多一行灰字「拦下了 <类型>」。
//   灰字 Claude 读不到。灰字只写类型名、不写内容：有的内容里是你的邮箱，截图时不会漏出去。
//
// 只管 Claude Code 自己写的提醒。你自己设的 hook、别的插件加进来的话，一律照常发。
// mod 还能跑命令、读写文件、联网、调工具，这个示例一样都没用，只用了打灰字（$.ui.log）。
//
// 用法：先用 'watch' 挂几天，看灰字里出现过哪些类型；想留的加进名单，再把 MODE 改成 'block'。
// 名单上每一条是什么、拦了会怎样，见教程第 1 节。想拦哪条，就删掉那一行；想放哪种，就照样加一行。

// ———— 开关 ————
const MODE = 'watch'

// ———— 提醒的放行名单 ————
const SEND_REMINDERS = [
  // 说明文件
  'instructions', // 你的 CLAUDE.md
  'nested_memory', // 子文件夹里的 CLAUDE.md，它去那个文件夹干活时才有
  // 你给它的东西
  'queued_command', // 它正忙的时候你插的话；拦掉的话，这句它收不到
  'file', // 你 @ 的文件；压缩之后，之前读过的文件也是这样再给它一遍
  // 它能用什么
  'skill_listing', // 技能（skill）清单
  'agent_listing_delta', // 子代理（subagent）清单
  'deferred_tools_delta', // 先只报名字、用到才加载的工具，你装的 MCP 工具也算
  'mcp_instructions_delta', // MCP 服务器附带的用法说明
  // 它在哪、是谁、今天几号
  'environment', // 工作文件夹、系统这些环境信息
  'model', // 它是什么模型、知识截止在哪天
  'date', // 今天几号
  'date_change', // 聊着聊着过了零点，日期变了
  'session_context', // 开对话时的 git 状态；用订阅登录时邮箱也在里面，邮箱在下面上下文块那层拦
  'remote_session_change', // 提交代码、开 PR 时怎么署名；不想署名，用官方设置 attribution 关掉更干净
  // 文件
  'edited_text_file', // 它读过或改过的文件，又在外面被改了
  'read_truncation_notice', // 文件太大，只读了一部分
  // 模式：跟权限有关，别拿掉
  'plan_mode', // 计划模式
  'plan_mode_reentry', // 又进了计划模式
  'plan_mode_exit', // 出了计划模式
  'auto_mode', // 自动模式
  'auto_mode_exit', // 出了自动模式
  // 你自己选的输出风格
  'output_style_instructions',
  'output_style',
]

// ———— 第一条消息带的上下文块的放行名单 ————
// 不在这里的会被拦，比如 userEmail（你的账号邮箱，用订阅登录时才有）。
const SEND_CONTEXT = [
  'claudeMd', // 你的 CLAUDE.md
  'currentDate', // 今天几号
]

const BLOCKING = MODE === 'block'

// 你设的 hook、别的插件加的，一律照常发；其余（Claude Code 自己写的）按名单判
const fromHookOrPlugin = (e) => !!e.origin && (e.origin.kind === 'hook' || e.origin.kind === 'plugin')
const shouldSend = (e) => fromHookOrPlugin(e) || SEND_REMINDERS.includes(e.type)
const onContextList = (block) => SEND_CONTEXT.includes(block.name)

export function register(on) {
  // Claude Code 自己塞的提醒：每一条问一次
  on('prompt.attachment', async ($, e, next) => {
    if (shouldSend(e)) return next(e)
    if (BLOCKING) {
      $.ui.log('拦下了 ' + e.type)
      return { text: null }
    }
    $.ui.log('只看：会拦下 ' + e.type)
    return next(e)
  }).catch(($, e, next) => {
    // 兜底：上面出错时，拦模式下名单外的照样不发（这里不打灰字）
    if (next.called || !BLOCKING || shouldSend(e)) return next(e)
    return { text: null }
  })

  // 第一条消息带的上下文块：每个对话问一次
  on('prompt.context', async ($, e, next) => {
    for (const block of e.blocks) {
      if (onContextList(block)) continue
      $.ui.log((BLOCKING ? '拦下了上下文块 ' : '只看：会拦下上下文块 ') + block.name)
    }
    if (!BLOCKING) return next(e)
    return next({ ...e, blocks: e.blocks.filter(onContextList) })
  }).catch(($, e, next) => {
    // 兜底：上面出错时，拦模式下同样只留名单上的块（这里不打灰字）
    if (next.called || !BLOCKING) return next(e)
    const blocks = Array.isArray(e.blocks) ? e.blocks.filter(onContextList) : e.blocks
    return next({ ...e, blocks })
  })
}
