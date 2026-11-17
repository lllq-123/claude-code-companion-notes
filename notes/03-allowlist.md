# 只放你点过头的提醒进来：用 mod 给 Claude Code 的提醒做白名单

> Claude Code 会自己往对话里塞一些话给模型看：今天几号、你的账号邮箱、现在是计划模式……用官方的 mod 功能定一份名单：名单上的照常发；名单外的（包括 Claude Code 以后升级新加的），先只打一行灰字给你看，你看过几天、切到「拦」以后才不发。

**我们家自己用的也是名单放行，这篇的示例是照官方版重新写、重新测的。** 落落出的主意，Claude 写的，Chatty（我们家另一个 AI）核对了技术细节。这是这个仓库的第三篇笔记：第一篇在[首页](../README.md)，第二篇在[这里](02-mod.md)。看到不认识的词，先翻[小词典](#小词典)。

mod 是什么、怎么挂上、怎么自查，第二篇讲过，这篇不从头讲；没看过的，先看[第二篇](02-mod.md)的「先说结论」和第 1、2 节。

> ### ⚠️ 先说清楚五件事
>
> 1. **mod 能做的远不止这些。** 官方的原话是：mod 是以你的权限运行的代码，能读写你的文件、启动程序、联网，不在沙箱里，只装你信得过的作者写的（[官方说明](https://code.claude.com/docs/en/plugins/mods/overview)）。这篇的示例只做两件事：不发某条提醒，和在终端里打一行灰字。代码 98 行，一大半是名单和说明，装之前请自己读一遍；看不懂，就让你的 Claude 逐段讲给你听。
> 2. **别把它当保险：你绝对不想发出去的东西，它保证不了。** mod 没挂上、被 Anthropic 远程关掉、或者新版改了接口的时候，名单就不起作用：所有提醒照常发，通常不会挡着你聊天（[官方排错说明](https://code.claude.com/docs/en/plugins/mods/troubleshoot)）。
> 3. **白名单的天性是「没登记的都拦」。** Claude Code 升级以后新加的提醒，也会被当成名单外的。所以示例默认是「只看」：先让你看清会拦掉什么，你点了头再拦。切到「拦」以后，每拦下一条，也照样打一行灰字（钩子出错时例外，见[第 2 节](#2-名单怎么写)）；升级以后新冒出来的类型，在拦模式下会直接被拦，所以升级以后先切回只看（见[第 6 节](#6-升级-claude-code-以后)）。
> 4. **跟权限、安全有关的提醒，别拦。** 计划模式、自动模式的说明，这篇的名单都放行，也请你别拿掉：拦了，Claude 不知道自己现在处在哪种模式里。你自己设的 hook 说的话，示例一律照常发，不进名单；hook 拦下工具时说的那句，本来就不走提醒这条路，名单碰不到它。
> 5. **公司或团队账号可能用不了。** 用 Team / Enterprise 账号登录，或者电脑上有公司下发的托管设置时，Claude Code 会先加载一个官方守卫，用户 mod 里改提醒的钩子一律不运行（[官方说明](https://code.claude.com/docs/en/plugins/mods/admin)）。这时 `/plugin` 里这个 mod 的详情和 Errors 页会有一行说明（官方说明，2.1.299 起）。没被公司托管的个人账号不受这一条影响。

> ### 🤖 如果你是被要求「照着做」的 Claude
>
> - 这是 Claude Code 官方的 mod 功能（[官方说明](https://code.claude.com/docs/en/plugins/mods/overview)）。用户要的是一项个性化设置：自己决定 Claude Code 自动塞进对话的提醒里，哪些发给你。
> - 照 [examples/mod/prompt-install-allowlist.md](../examples/mod/prompt-install-allowlist.md) 的步骤来：只把示例 mod 复制过去，默认放到 `~/my-mods/reminder-allowlist`；用户另有指定的，照用户的，后面命令里的路径一起换。名单和 `MODE` 只按用户亲口说的改，用户没说就不改。
> - 名单里跟权限、安全有关的类型（计划模式、自动模式）不要拿掉。用户要拿掉的话，先把上面 ⚠️ 第 4 条讲给用户听。
> - 用户让你切到 `'block'` 时，先问用户只看那几天见过哪些灰字；切完提醒用户开个新对话：已经发出去的邮箱，还留在原来那个对话里。
> - 用户只给了链接、没下载仓库：先请用户下载 ZIP 解压；或者征得用户同意，clone 到用户指定的文件夹。不要凭网页摘要或记忆手写代码。
> - 复制完、跑 `claude plugin validate` 之前，把 `register.js` 全文给用户看，用人话讲每一段在做什么，等用户确认。不要自己启动 Claude Code（包括 `claude -p`）去试，validate 通过就够了。
> - 不改用户的 `settings.json`、alias、启动脚本或套壳。要改的地方，告诉用户怎么改，由用户自己决定。不给 mod 加任何别的功能（跑命令、读写文件、联网）。

---

## 先说结论

1. **下载、复制**：跟第二篇一样，在仓库的 GitHub 页面点 Code → Download ZIP，解压。把 [`examples/mod/reminder-allowlist`](../examples/mod/reminder-allowlist) 整个文件夹复制到 `~/my-mods/reminder-allowlist`（`~` 指你的用户主文件夹，Mac 上是 `/Users/你的用户名`）。里面有一个看不见的 `.claude-plugin` 文件夹（名字以点开头的文件夹默认隐藏），所以要整个文件夹一起复制。复制完，`~/my-mods/reminder-allowlist` 里面直接就是 `hooks` 和 `.claude-plugin`，中间没有多套一层。
2. **先什么都别改**：示例默认是「只看」，装上以后一样都不拦。名单上每一条是什么、为什么这么定，见[第 1 节](#1-claude-code-会往对话里塞哪些话)；想改，看几天再改。
3. **自查**：`claude plugin validate ~/my-mods/reminder-allowlist`。最后一行是 `✔ Validation passed`，后面跟着 `with warnings` 也算通过。中间那几行 ⚠ 和 ✘（没写作者、没图标、缺 README、缺 LICENSE）是往官方插件目录提交时才要求的，输出里也写明了不影响结果。正常的话还会列出两行：`hooks: prompt.attachment, prompt.context` 和 `calls: $.ui.log`，后一行就是说它只用了打灰字这一样。就算最后一行是通过，这两行对不上也不行：没有 `hooks` 那行，mod 其实没起作用（[官方排错说明](https://code.claude.com/docs/en/plugins/mods/troubleshoot)里写了这种情况，问题出在 `hooks/hooks.json`）；钩子少了一个，或者 `calls` 里多出别的，也不对。碰到这几种，别自己改代码，从下载的仓库里重新复制一遍再查。没通过的话，照第二篇「先说结论」第 3 步那三样查。
4. **启动时挂上**：`claude --plugin-dir ~/my-mods/reminder-allowlist`。每次启动都要带，续聊（`--resume`）也一样；不带就是没挂上，也不会报错。已经挂了第二篇的 `companion-basics`，两个都写上：`claude --plugin-dir ~/my-mods/companion-basics --plugin-dir ~/my-mods/reminder-allowlist`。用 `-p`、stream-json、SDK 的，见[第 7 节](#7-用--pstream-json-和-sdk-的)。Windows 我们没测：命令里的 `~` 可能要换成完整路径，比如 `C:\Users\你的用户名\my-mods\reminder-allowlist`。
5. **看几天**：照常聊天。名单外的东西出现时，终端里会多一行灰字。这时候什么都还没拦，Claude 照常收到。
   - 用订阅账号登录的：发第一句话时，那句话上面会多一行 `● reminder-allowlist: 只看：会拦下上下文块 userEmail`。那是你的账号邮箱，示例默认拦它。
   - 用 API key 登录的：多半一行灰字都没有，这是正常的，因为每个新对话都有的那几种都在名单上。对你来说，它主要是替以后升级新加的提醒把关。想确认真挂上了，看下面。
6. **定名单**：用文本编辑器打开 `~/my-mods/reminder-allowlist/hooks/register.js`（右键 → 打开方式 → 文本编辑 / 记事本；别双击）。改的是 my-mods 里这份，不是下载文件夹里那份。看到的类型，对照第 1 节的表决定留不留：灰字里带「上下文块」四个字的，加进 `SEND_CONTEXT`；不带的，加进 `SEND_REMINDERS`，照样加一行就行。名单上原有的想拦，删掉那一行。改完保存，再跑一次第 3 步的自查。
7. **切到「拦」**：还是这个文件，把 `const MODE = 'watch'` 改成 `const MODE = 'block'`，保存，再跑一次自查。之后名单外的东西不再发给 Claude，灰字变成「拦下了 xxx」。终端里开着的 Claude Code 会自己重新加载，下一句就生效。
8. **切完开个新对话**：邮箱是在对话的第一条消息里发的，已经发出去的收不回来：开着的这个对话、以后续聊回去的旧对话，都还带着它。终端里在 Claude Code 的输入框里打 `/clear`；套壳里开一个新对话。细节见[第 4 节](#4-切到拦以后)。

**怎么确认真挂上了**：

- 终端里：Claude Code 开着的时候，在 `register.js` 最末尾加一个空行再保存，屏幕上会冒出一行 `● reminder-allowlist: reloaded (2 hooks: prompt.attachment, prompt.context)`。
- stream-json：开头那条 `init` 事件的 `plugins` 列表里有 `reminder-allowlist`。
- 官方文档还写了一种：在 Claude Code 里输入 `/plugin`，标签下面那行 `mod active` 里会列出它的名字（这一条我们没测）。

想撤掉：用 `--plugin-dir` 挂的，启动时不加就行；用环境变量挂的，删掉那一项。这个 mod 不改你的任何文件。只想先不拦，把 `MODE` 改回 `'watch'` 就又变回只看。

不想自己动手，就把 [examples/mod/prompt-install-allowlist.md](../examples/mod/prompt-install-allowlist.md) 里那段话发给你的 Claude。

---

## 1. Claude Code 会往对话里塞哪些话

**一句话**：示例放行下面这些，只拦三样：你的账号邮箱（`userEmail`）、两种待办清单的提醒，再加上所有没登记的。第一次装什么都不用改；下面的表是给你以后想改、或者灰字里冒出一个名字时查的，按 Ctrl+F（Mac 上 ⌘F）搜那个名字就行。

我们在测试环境里（Claude Code 2.1.321，一台假服务器扮演 Anthropic 的接口）把各种情况挨个跑了一遍，记下 Claude Code 自己塞给模型的每一条话。它们分两种：

- **提醒**：一条一条塞进对话里，每条有个类型名。mod 的 `prompt.attachment` 钩子管它们。
- **上下文块**：每个对话的第一条消息前面附的几块。mod 的 `prompt.context` 钩子管它们。

下面的「示例默认」只是我们的推荐。每一条都写了拦了会怎样，你自己决定。

### 每个新对话都会有的提醒（9 种）

| 类型名 | 是什么 | 示例默认 | 拦了会怎样 |
|---|---|---|---|
| `instructions` | 你的 CLAUDE.md | 放 | 它读不到你写的 CLAUDE.md |
| `environment` | 工作文件夹、是不是 git 仓库、系统、shell | 放 | 它不知道自己在哪个文件夹干活 |
| `model` | 它是什么模型、知识截止在哪天；续聊时换了模型，会再来一条 | 放 | 它不知道自己是什么模型 |
| `skill_listing` | 技能（skill）清单 | 放 | 它不知道有哪些技能可以用 |
| `agent_listing_delta` | 子代理（subagent）清单 | 放 | 它不知道能派哪些子代理 |
| `deferred_tools_delta` | 先只报名字、用到才加载的工具；你装的 MCP 工具也算在里面 | 放 | 这些工具它可能想不起来用 |
| `date` | 今天几号 | 放 | 它不知道今天几号。想拦，见下面[「想拦日期」](#想拦日期) |
| `session_context` | 开对话时的 git 状态（当前分支、最近几次提交）。用订阅账号登录时，你的账号邮箱也在这一条里 | 放；邮箱在上下文块那一层拦掉 | 拦掉整条，git 状态也跟着没了 |
| `remote_session_change` | 提交代码、开 PR 时怎么署名：让它在提交说明末尾加上 `Co-Authored-By: Claude …` | 放 | 它收不到署名的说明。不想署名，用官方设置关掉更干净，见下面[「不想让它在提交里署名」](#不想让它在提交里署名) |

我们测试时，交互终端开在自动模式里（没改过权限模式的话，2.1.321 的终端默认就是自动模式），所以终端里每个新对话还会多一条 `auto_mode`（见下一张表）。

### 某些情况下才有的提醒

| 类型名 | 什么时候有 | 示例默认 | 拦了会怎样 |
|---|---|---|---|
| `queued_command` | 它正忙的时候，你又插了一句 | 放 | **这句话到不了它那里**，你这边却显示发出去了 |
| `file` | 你在消息里 @ 了一个文件；或者压缩之后，把之前读过的文件再给它一遍 | 放 | @ 文件不带内容；压缩之后它不记得读过什么 |
| `nested_memory` | 它去一个有自己 CLAUDE.md 的子文件夹里干活 | 放 | 它不知道那个文件夹的规矩 |
| `edited_text_file` | 它读过或改过的文件，又在外面被改了 | 放 | 它不知道文件被改过，可能按旧内容接着改 |
| `read_truncation_notice` | 文件太大，只读了一部分（测试里没碰到；我们在自己平时用的终端里见过） | 放 | 它不知道自己只看到了一部分 |
| `mcp_instructions_delta` | 你装的 MCP 服务器附带了用法说明 | 放 | 那段用法说明到不了它那里 |
| `plan_mode`、`plan_mode_exit` | 进了、出了计划模式 | 放，**别拿掉** | 它不知道自己在计划模式里 |
| `plan_mode_reentry` | 又进了计划模式（测试里没碰到） | 放，**别拿掉** | 它不知道自己又回到了计划模式里 |
| `auto_mode` | 开着自动模式（我们测试时交互终端默认就是） | 放，**别拿掉** | 它不知道自己在自动模式里 |
| `auto_mode_exit` | 出了自动模式（测试里没碰到） | 放，**别拿掉** | 它不知道自动模式已经关了 |
| `date_change` | 聊着聊着过了零点（测试里没碰到） | 放 | 它不知道日期变了。想拦日期，见下面[「想拦日期」](#想拦日期) |
| `output_style_instructions`、`output_style` | 你在设置里选了输出风格 | 放 | 你选的风格不起作用 |

### 示例默认不放的

| 类型名 | 是什么 | 为什么不放 |
|---|---|---|
| `todo_reminder`、`task_reminder` | 提醒它把要做的事列成待办清单 | 聊天时用不上。我们的测试里没碰到：`-p` 下默认就没有待办工具，交互终端里没测 |
| 上下文块 `userEmail` | 你的账号邮箱，用订阅账号登录才有（用 API key 时我们一次都没见到） | 跟聊天无关。想放，把 `'userEmail'` 加进 `SEND_CONTEXT` |
| 别的所有没登记的 | Claude Code 以后新加的，或者我们没碰到的 | 白名单的本意：没见过的先别放，让你看见了再定 |

### 不进名单判断的

你自己设的 hook 说的话（`hook_success`、`hook_additional_context` 这些），和别的插件加进来的话，示例一律照常发。它们本来就是你自己装、自己写的，想改就去改它们。

### 第一条消息带的上下文块，跟提醒是什么关系

我们见到的上下文块有三块：`claudeMd`（你的 CLAUDE.md）、`currentDate`（今天几号）、`userEmail`（账号邮箱，订阅登录才有）。示例放前两块。

表里有两个「你的 CLAUDE.md」、两个「今天几号」，邮箱又说装在 `session_context` 那条提醒里，看着有点绕。我们在测试里看到的是这样：

- 邮箱：`userEmail` 这一块的内容，最后是跟 git 状态一起装进 `session_context` 那条提醒发出去的。在上下文块这一层拦掉它，`session_context` 里就只剩 git 状态。
- CLAUDE.md：`claudeMd` 这一块跟 `instructions` 提醒，两处记下来的长度和开头都一样，我们推断是同一份 CLAUDE.md；只拦其中一个会怎样，我们没试。
- 日期：Claude Code 另外发一条 `date` 提醒，见下面[「想拦日期」](#想拦日期)。

所以想拦邮箱，在上下文块这一层删 `userEmail` 就行；拦整条 `session_context` 的话，git 状态会跟着一起没。git 状态本身不是上下文块。

### 想拦日期

删掉 `SEND_REMINDERS` 里 `'date'` 那一行就够了：我们测了新对话、续聊、压缩以后三种情况，日期都没了。上下文块里的 `currentDate` 删不删，发出去的内容都一样（Claude Code 另外发日期，官方类型声明里也这么写），删了只是多一行灰字。过零点时的 `date_change` 我们测不到，想拦得彻底，就把它也删掉。

### 不想让它在提交里署名

拦掉 `remote_session_change` 能让它收不到署名说明，但更干净的办法是官方设置 `attribution`（[官方说明](https://code.claude.com/docs/en/settings-reference#attribution)）：在 `~/.claude/settings.json` 里写 `"attribution": {"commit": "", "pr": ""}`，提交和 PR 里就都不署名了。我们测了：设了以后，这条提醒整条不来了。settings.json 里已经有别的设置的，把这一项加进去，别把整个文件换掉。

官方还有一种更短的写法 `"attribution": false`，我们也测了，效果一样。但它要 2.1.281 以上：更早的版本读到它，会把整个 settings.json 跳过不读，你在里面设的别的东西也跟着不起作用。你的 settings.json 有可能被旧版本读到（比如同步到了别的电脑上），就用前一种写法。（官方说明里还有一项 `sessionUrl`，管的是网页版和远程控制会话往提交和 PR 描述里加的会话链接，终端里用不上。）

---

## 2. 名单怎么写

全文见 [`examples/mod/reminder-allowlist/hooks/register.js`](../examples/mod/reminder-allowlist/hooks/register.js)。挑要紧的几段讲。

**开关**：

```js
const MODE = 'watch'
```

`'watch'` 是只看，`'block'` 是拦。只改两个单引号中间的词，两边的英文单引号别动，也别被输入法换成中文引号。

**两份名单**：

```js
const SEND_REMINDERS = [
  'instructions', // 你的 CLAUDE.md
  // …（中间省略）
]
const SEND_CONTEXT = [
  'claudeMd', // 你的 CLAUDE.md
  'currentDate', // 今天几号
]
```

一行一个类型名，两边是英文单引号，后面跟一个英文逗号；`//` 后面是说明，给人看的。想放一种新的，照样加一行，比如 `'some_new_type',`。名单上原有的想拦，删掉那一行，或者在行首加 `//`。灰字里带「上下文块」四个字的，名字加进 `SEND_CONTEXT`；不带的，加进 `SEND_REMINDERS`。

**只管 Claude Code 自己写的**：

```js
const fromHookOrPlugin = (e) => !!e.origin && (e.origin.kind === 'hook' || e.origin.kind === 'plugin')
```

Claude Code 给每条提醒都标了是谁写的：它自己、你设的 hook、别的插件（官方类型声明里的原话是 the engine, a settings hook, or a plugin's chain context）。示例只拿名单去判第一种。

**灰字**：

```js
$.ui.log('拦下了 ' + e.type)
```

官方说明：这是对话记录里一行灰色的字，Claude 读不到（[官方说明](https://code.claude.com/docs/en/plugins/mods/api)）。示例只写类型名、不写内容：有的提醒里是你的邮箱，截图发出去也不会漏。

**钩子出错时，照样按名单拦**：

官方说明：钩子出错（抛错、超时、返回的东西不对）的时候，没写 `.catch` 的钩子会被跳过（[官方说明](https://code.claude.com/docs/en/plugins/mods/events#handle-a-hook-that-fails)）。对白名单来说，跳过就等于这一条照常发出去。所以示例给两个钩子都加了 `.catch` 兜底：拦模式下，名单外的照样不发；只看模式下照常发。兜底的时候不打灰字。我们用 `-p` 试过，故意让两个钩子一进来就出错：拦模式下名单外的照样拦住了，名单上的照常发；输出里什么都不显示，只在调试日志里记一行 `hook failed closed: reminder-allowlist: … its .catch answered`。交互终端里出错时屏幕上显示什么，我们没测。兜底也不是打包票：`.catch` 自己再出错、或者超时，这个钩子还是会被跳过，那一条照常发出去，所以前面 ⚠️ 第 2 条说别把它当保险。

**问几遍，答案都一样**：

示例只看类型名和名单，不看时间，也不记之前问过什么，所以同一条提醒问几遍，答案都一样。这件事要紧，是因为关掉 Claude Code 再续聊（`--resume`）时，历史里的提醒会被重新问一遍（官方类型声明这么写，我们测试时也看到了）。答案要是变了，历史就变了样，从那里往后的提示缓存可能就用不上了，那一轮可能更慢、更费额度（推断，见[第 4 节](#4-切到拦以后)）。

---

## 3. 先只看几天

只看模式下，Claude 照常收到所有东西，你只是多看到几行灰字。

- **终端里**：`● reminder-allowlist: 只看：会拦下 date` 这样一行。上下文块的那行出现在你那句话上面，提醒的那行在下面。同一个对话里，每条提醒只问一次，所以同一条不会每句话都冒；关掉 Claude Code 再续聊、或者 mod 重新加载以后，历史里的会重新问一遍，灰字也会再出一次。有的提醒每一轮都会新来一条（比如输出风格的 `output_style`），这种要是不在名单上，灰字就每轮出一次。
- **stream-json**：是一条事件，`{"type":"system","subtype":"ui_log","plugin":"reminder-allowlist","text":"只看：会拦下 date",…}`。套壳要显示的话，认 `subtype` 是 `ui_log` 的就行。
- **`-p`**：屏幕上没有灰字。启动时加 `--debug-file ./check.log`，灰字会写进这个调试日志（官方类型声明：每行灰字同时也进调试日志），样子是 `… [DEBUG] [reminder-allowlist] $.ui.log: 只看：会拦下 date`。调试日志里记了很多运行细节，还有你电脑上的路径，看完连同旁边的 `latest` 一起删，别发到网上。

看到一个表里没有的类型，怎么办：

- 名字或内容跟模式、权限、安全有关的（比如名字里带 `mode`、`permission`），放。
- 拿不准的，可以趁只看模式问问你的 Claude：这时候它照常收到了那条提醒，你问它「刚才 Claude Code 有没有给你塞什么系统提醒，讲的是什么」，它能告诉你大概内容。它说不清，就照下一条：先放。
- 还是拿不准，就先放。多放一条，最多是它多看到一段话；拦错一条，可能让某个功能悄悄不灵了。

---

## 4. 切到「拦」以后

- **什么时候生效**：终端里改完保存，屏幕上会出一行 `● reminder-allowlist: reloaded (2 hooks: prompt.attachment, prompt.context)`，从下一句起生效。mod 重新加载时，历史里的提醒会重新过一遍名单，所以日期这类提醒，连历史里的那条也一起拿掉了。用 `-p` 的，从下一次启动（包括续聊）起生效。
- **已经发出去的邮箱，还留在那段对话里**：邮箱装在对话第一条消息的 `session_context` 里。这条提醒在名单上（它还带着 git 状态），重新过名单时照样放行，里面的邮箱也就跟着留下了。所以切到拦以后，开着的这个对话、以后续聊回去的旧对话，发给 Claude 的历史里都还带着邮箱；要在 Claude Code 的输入框里打 `/clear`，或者开新对话，才没有（我们测的：切换后的下一句邮箱还在，`/clear` 以后没了；用 `-p` 续聊旧对话，邮箱也还在）。套壳里一直续着同一段长对话的，那段对话里的邮箱会一直在，想去掉只能开新对话。这里说的「历史」，是每次发给 Claude 的那份对话，不是你电脑上的会话存盘。
- **缓存可能断一次**：只看那几天，历史里要是有名单外的提醒（给它们打过灰字的那些），切换以后它们从「照常发」变成「不发」，下一次请求从那条提醒的位置起就跟上次不一样了，提示缓存从那里开始重来，那一轮更慢、更贵。我们测的是把 `date` 删出名单再切：请求从开头那条日期起就变了。真服务器上的缓存我们量不了，这一条是推断。历史里没有名单外的提醒的（比如只看那几天只出过邮箱那一行灰字），切换不会让历史变样（推断）。以后改名单也是一样的道理，挑没有长对话开着的时候改。
- **怎么确认在拦**：灰字从「只看：会拦下 xxx」变成「拦下了 xxx」。用订阅账号登录的，每个新对话发第一句话时会看到一行「拦下了上下文块 userEmail」。用 API key 的，多半什么都看不到，因为没有要拦的东西。
- **被拦的提醒，你电脑上的会话存盘里照样留着原文**，只是不发给 Claude（官方类型声明原话：the transcript keeps the engine's record）。

---

## 5. 管不到的

下面这些不走提醒这条路，名单碰不到，拦模式下也照常到 Claude 那里（我们测试时看到的）：

- **hook 拦下工具时说的话**：直接写进那个工具的结果里。安全相关的反馈本来就该一直送得到，这样正好。
- **压缩（compact）时 Claude Code 加的那段指令**，和压缩后的摘要。
- **后台跑的子代理跑完时的通知**：它是一条消息，不是提醒（后台跑的命令我们没测，推断也一样）。
- **系统提示词和工具说明**：那是第二篇讲的 `prompt.compose`、`tool.describe`，这篇不管。
- **只记一笔、没有字的那种**：比如你设的 hook 出了错、但没拦工具的时候，Claude Code 只在你电脑上的会话存盘里记一行，本来就不发给模型，也不经过钩子。
- 还有前面说过的：**mod 没挂上、被远程关掉的时候，什么都照常发。**

---

## 6. 升级 Claude Code 以后

我们测的是 2.1.321。提醒的类型名是 Claude Code 自己起的，官方类型声明里的原话是「Builds add and retire kinds」：每个版本会新加、会去掉。Claude Code 默认会自己升级（官方设置里有关掉自动升级的开关），你不一定知道它升了；在终端里跑 `claude --version`，能看到现在是哪一版。

切到「拦」以后，升级新加的类型会直接被拦，你只会看到一行「拦下了 xxx」。看到没见过的，多半就是升级新加的：照第 3 节判断，拿不准就先加进名单。所以升级以后：

1. 先跑一次 `claude plugin validate ~/my-mods/reminder-allowlist`，看 mod 还能不能正常加载。
2. 把 `MODE` 改回 `'watch'` 看几天，有新类型冒出来就照第 3 节定，定完再切回 `'block'`。

用纯 `-p`、或者套壳不显示 `ui_log` 的，屏幕上看不到灰字，被拦了什么你不会知道。升级以后至少加 `--debug-file` 跑一次，看看调试日志里有没有新冒出来的类型：照上面第 2 步切回了只看的，找「只看：会拦下 xxx」；还在拦模式的，找「拦下了 xxx」。

---

## 7. 用 `-p`、stream-json 和 SDK 的

- **挂法**跟[第二篇第 6 节](02-mod.md#6-用--pstream-json-和-sdk-的)一样：在启动命令里加 `--plugin-dir`，或者设环境变量 `CLAUDE_CODE_PLUGIN_DIRS`（绝对路径）。已经用这个环境变量挂了 `companion-basics` 的，把这个文件夹接在后面，用 `:` 隔开（Windows 用 `;`），别把原来那项顶掉。SDK 在 `options` 里加 `plugins`。`--plugin-dir` 和环境变量我们都测了，stream-json 开头那条 `init` 事件的 `plugins` 里会有 `reminder-allowlist`。
- **看灰字**：stream-json 里是 `ui_log` 事件；纯 `-p` 加 `--debug-file`。原样见[第 3 节](#3-先只看几天)。
- **套壳自带系统提示词（`--system-prompt-file`）的**：照样管用。我们测的：这种跑法下两个钩子照常触发，邮箱拦住了；把 `'date'` 删出名单的话，日期也拦得住。这种跑法下本来就没有 git 状态那一段，所以拦掉邮箱以后，`session_context` 整条都没了。
- **SDK**：照官方文档写的，我们没测。

---

## 我们测了什么、没测什么

测试环境：Claude Code 2.1.321（Linux），模型 Opus 5.5。一台假服务器扮演 Anthropic 的接口，Claude Code 发出去的每个请求我们都存下来，逐字比对；比对前先去掉每次都会变的东西（测试文件夹的路径、会话号、计费信息里随机生成的字段）。全程没有连真接口，也没有用真账号。

**测过的**

- Claude Code 会塞哪些提醒：`-p`、stream-json、交互终端三种跑法下开新对话；@ 文件、子文件夹的 CLAUDE.md、干活时插话、设置里的 hook（直接打印和 JSON 两种写法、拦下工具、不拦的出错）、计划模式、自动模式、文件被外面改了、手动压缩、续聊换模型、读 3000 行的文件、子代理、MCP、输出风格。用 API key 和订阅账号两种登录方式各跑过（订阅登录是用假的登录信息在假服务器上模拟的）。
- `claude plugin validate`：通过（带警告），列出两个钩子和 `calls: $.ui.log`。
- 只看模式：发出去的请求跟不挂 mod 时逐字一样。灰字在终端、stream-json、调试日志三处都看得到，请求里一处都没有。
- 拦模式：邮箱拦住了，git 状态、日期、CLAUDE.md、每个新对话都有的那几种都在；只删 `'date'` 就能拦住日期；你自己的 hook 说的话、计划模式和自动模式的说明照常发；子代理的请求里名单也管。
- 钩子出错：两个钩子一进来就抛错，拦模式下照名单兜住了（用 `-p` 测的）。
- 续聊：拦模式下同一段历史续聊两次，请求逐字一样；从只看切到拦以后续聊，历史里被拦的那条（我们测的是日期）从请求里拿掉了，请求从那里起变了；邮箱还留在历史里。
- 交互终端里改开关：保存就重新加载，下一句生效；邮箱要 `/clear` 以后才没。
- 跟 `companion-basics` 一起挂：两边都起作用，谁先挂结果都一样。
- 环境变量 `CLAUDE_CODE_PLUGIN_DIRS` 挂法、自带系统提示词（`--system-prompt-file`）的跑法。
- 官方设置 `attribution`：两种写法都让提交署名那条提醒不来了。

**没测的**

- macOS 和 Windows。
- 别的模型、别的版本：提醒的种类可能不一样，以你自己看到的灰字为准。
- `todo_reminder`、`task_reminder`、`read_truncation_notice`、`plan_mode_reentry`、`auto_mode_exit`、`date_change`：我们的测试里没碰到。
- 交互终端里只测了开新对话、干活时插话、计划模式、改开关这几样；hook、压缩、MCP、输出风格、子代理只在 `-p` / stream-json 里测过。
- 真服务器上，切换模式、改名单让提示缓存断的那一次（假服务器测不到缓存）。
- 拦掉以后，模型的回复会不会不一样：我们只核对了发出去的字。
- 写进 `~/.claude/settings.json` 的 `env` 来挂 mod；VS Code 插件、桌面版；SDK。
- Team / Enterprise 账号下守卫挡住钩子的样子（照官方文档写的）。
- 终端里那行字是不是灰色：抓屏不带颜色，「灰色」是照官方说明写的。
- 交互终端里钩子出错时屏幕上显示什么；`/plugin` 里那行 `mod active`（照官方文档写的）。

---

## 相关项目

- [官方 mod 文档](https://code.claude.com/docs/en/plugins/mods/overview)：钩子的完整说明、怎么写测试、怎么排查都在这里。
- 第二篇的[相关项目](02-mod.md#相关项目)里提到的 roof-mod，也能关掉待办提醒。

## 小词典

| 词 | 人话 |
|---|---|
| 白名单 | 只放名单上的，名单外的一律不放。反过来的叫黑名单：只拦名单上的，名单外的一律放 |
| 提醒 | Claude Code 自己塞进对话里给模型看的一段话，每段有个类型名，比如 `date` |
| 上下文块 | 每个对话第一条消息前面附的几块信息，比如 CLAUDE.md、今天几号 |
| 灰字 | mod 用 `$.ui.log` 在终端里打的一行字，只给你看，Claude 读不到 |
| 只看 / 拦 | 示例的两档：只看是照常发、打灰字告诉你；拦是不发、也打灰字告诉你 |
| 订阅登录 / API key | 用 Claude 的订阅账号登录，或者用 API 密钥。用订阅登录时，Claude Code 会把你的账号邮箱也告诉模型 |
| 计划模式 / 自动模式 | Claude Code 的两种权限模式：计划模式只让它出主意、不许动手改东西；自动模式让它少问你、自己往下做 |
| 输出风格 | Claude Code 设置里能选的回答风格 |
| git 状态 | 你所在文件夹如果是 git 仓库，当前在哪个分支、最近几次提交 |
| 续聊 | 关掉 Claude Code 以后，用 `--resume` / `--continue` 回到原来的对话 |
| `~` | 你的用户主文件夹。Mac 上是 `/Users/你的用户名`，Linux 上是 `/home/你的用户名` |
| `/clear` | 在 Claude Code 的输入框里打，清空当前对话、开一个新的 |
| hook | 你自己在 settings.json 里设的、到某个时机就跑一下的命令。跟 mod 的「钩子」英文是同一个词：这篇里「hook」指你设的那种，「钩子」指 mod 的。没设过 hook 的可以跳过 |
| 技能（skill） | Claude Code 里打包好的一套做事说明，用到的时候才读进来 |
| 官方类型声明 | 在终端里挂过 mod 以后，Claude Code 在 mod 文件夹的 `.claude-plugin/types/` 里生成的几份文件，写着每个钩子能拿到什么、能怎么回。这篇引的几句英文原话出自这里 |

其余的词（mod、钩子、MCP、子代理、环境变量、`--plugin-dir`、`claude plugin validate`、调试日志、缓存、`-p`、stream-json、SDK、套壳、压缩）见[第二篇的小词典](02-mod.md#小词典)；「会话存盘」见[首页的小词典](../README.md#小词典)。

## 许可证

[MIT](../LICENSE)
