# 让 Claude Code 叫你的名字：用 mod 换称呼、改系统提示词

> 用 Claude Code 官方的 mod 功能，把它写给模型的那些话里的 "the user" 换成你的名字；系统提示词里你想换的某一节，也能换成你自己的话。

**这是我们家在用的做法，照实写下来。** 落落出的主意，Claude 写的，Chatty（我们家另一个 AI）核对了技术细节。这是这个仓库的第二篇笔记，第一篇在[首页](../README.md)。看到不认识的词，先翻[小词典](#小词典)。

> ### ⚠️ 先说清楚四件事
>
> 1. **mod 能做的远不止改字。** 官方的原话是：mod 是以你的权限运行的代码，能读写你的文件、启动程序、联网，不在沙箱里，只装你信得过的作者写的（[官方说明](https://code.claude.com/docs/en/plugins/mods/overview)）。这篇的示例只改字（另外，填了要换的节时，会往调试日志里写一句换没换上），别的一样没用，代码 80 行，装之前请自己读一遍；看不懂代码，就让你的 Claude 逐段讲给你听。
> 2. **它会变，也可能被关掉。** 官方说 mod 能用的事件和方法会随版本变；Anthropic 也能远程关掉用户装的 mod。被关掉、没挂上、或者新版改了接口的时候，通常不会挡着你继续聊天，只是不起作用：Claude Code 照旧说 "the user"。终端或调试日志里可能会留一句出错原因（[官方排错说明](https://code.claude.com/docs/en/plugins/mods/troubleshoot)）。
> 3. **公司或团队账号可能用不了。** 用 Team / Enterprise 账号登录，或者电脑上有公司下发的托管设置时，Claude Code 会先加载一个官方守卫，用户 mod 里改系统提示词、改提醒的钩子一律不运行（[官方说明](https://code.claude.com/docs/en/plugins/mods/admin)）。没被公司托管的个人账号不受这一条影响。
> 4. **这里不放官方系统提示词的原文，也不教删安全相关的句子。** 你想换的那一节，原文得从你自己电脑上取，[第 4 节](#怎么拿到节名和原文)教怎么取。

> ### 🤖 如果你是被要求「照着做」的 Claude
>
> - 这是 Claude Code 官方的 mod 功能（[官方说明](https://code.claude.com/docs/en/plugins/mods/overview)）。用户要的是一项个性化设置：把说明里的 "the user" 换成用户的名字，规则一条不动。
> - 照 [examples/mod/prompt-install-mod.md](../examples/mod/prompt-install-mod.md) 的步骤来：只把示例 mod 复制到用户指定的文件夹，只改 `MY_NAME`。名字用用户亲口给的，原样填；用户没给就问，别自己挑昵称。换节不在那份步骤里，用户想换节，请用户照第 4 节自己来。
> - 用户只给了链接、没下载仓库：先请用户下载 ZIP 解压；或者征得用户同意，clone 到用户指定的文件夹。不要凭网页摘要或记忆手写代码。
> - 改完、跑 `claude plugin validate` 之前，把 `register.js` 全文给用户看，用人话讲每一段在做什么，等用户确认。
> - 不改用户的 `settings.json`、alias、启动脚本或套壳。要改的地方，告诉用户怎么改，由用户自己决定。
> - 不给 mod 加任何别的功能（跑命令、读写文件、联网）。系统提示词里跟安全、拒绝、权限有关的句子，不删也不改。

---

## 先说结论

1. **下载、复制**：在仓库的 GitHub 页面点 Code → Download ZIP，解压。把里面的 [`examples/mod/companion-basics`](../examples/mod/companion-basics) 整个文件夹复制到 `~/my-mods/companion-basics`（`~` 指你的用户主文件夹，Mac 上是 `/Users/你的用户名`；后面的命令都按这个位置写）。文件夹里有一个看不见的 `.claude-plugin`：名字以点开头的文件夹默认是隐藏的，所以要整个文件夹一起复制，别一个个文件抄。复制完，`~/my-mods/companion-basics` 里面直接就是 `hooks` 和 `.claude-plugin`，中间没有多套一层。
2. **改名字**：用文本编辑器打开 `hooks/register.js`（右键 → 打开方式 → 文本编辑 / 记事本；别双击）。找到 `const MY_NAME = '你的名字'`，只改两个单引号中间的字：比如想让 Claude 叫你「阿星」，就改成 `const MY_NAME = '阿星'`。两边的英文单引号别动，也别被输入法换成中文引号；名字里要是有英文单引号或反斜杠，分别写成 `\'` 和 `\\`。别的先不动，保存。
3. **自查**：打开终端，复制粘贴 `claude plugin validate ~/my-mods/companion-basics`。最后一行是 `✔ Validation passed` 就对了，一般后面还跟着 `with warnings`。中间列的几条提示不用管：⚠ 那几条是没写作者、没图标；✘ 那一块（缺 README、缺 LICENSE）是往官方插件目录提交时才要求的，输出里也写明了不影响结果。没通过的话，先查三样：文件夹是不是多套了一层；`.claude-plugin` 有没有漏；名字两边的引号是不是被换成了中文引号。
4. **启动时挂上**：`claude --plugin-dir ~/my-mods/companion-basics`。以后每次启动都要带这个参数，不带就是没挂上，也不会报错；想省事，见[第 6 节](#6-用--pstream-json-和-sdk-的)的环境变量。用 `-p`、stream-json 的套壳，在它启动 Claude Code 的命令里加同样的参数；改不了命令的，也见第 6 节。

Windows 我们没测：命令里的 `~` 可能要换成完整路径，比如 `C:\Users\你的用户名\my-mods\companion-basics`。

**怎么确认真挂上了**：

- 终端里：Claude Code 开着的时候，在 `register.js` 最末尾加一个空行再保存，屏幕上会冒出一行 `companion-basics: reloaded (3 hooks: …)`。
- stream-json：开头那条 `init` 事件的 `plugins` 列表里有 `companion-basics`。

换上的名字，你在聊天界面上看不到：改的是 Claude Code 发给模型的说明，不是你看到的字。

改的是**新开的对话**：已经开着的对话、`--resume` 回去的对话，系统提示词和工具说明还是原来记下的那份，要等那个对话下次压缩以后才换，见[第 5 节](#5-改完什么时候生效)。

不想自己动手，就把 [examples/mod/prompt-install-mod.md](../examples/mod/prompt-install-mod.md) 里那段话发给你的 Claude。

想撤掉：用 `--plugin-dir` 挂的，启动时不加就行；用环境变量挂的，删掉那一项。然后新开一个对话：这个 mod 不改你的任何文件，新对话里就是原样；原来开着的对话、`--resume` 回去的对话，还沿用已经记下的那份，要等压缩以后才变回来。（在终端里挂过以后，mod 文件夹里多出一个 `tsconfig.json` 是正常的，见[第 2 节](#2-最小的-mod-长什么样)。）

---

## 1. mod 是什么，能改什么

官方的定义：mod 是一种插件，用来改 Claude Code 的样子和行为；它是一段 JavaScript / TypeScript，某件事发生时 Claude Code 就调用它（[官方说明](https://code.claude.com/docs/en/plugins/mods/overview)）。Claude Code 2.1.287 起有这个功能。

mod 能做的事很多，这篇只用其中「改发给模型的字」的几个钩子：

| 钩子 | 管什么 | 这篇用没用 |
|---|---|---|
| `prompt.compose` | 系统提示词的全部节，按发送顺序排好 | 用：换称呼、换一节 |
| `prompt.section` | 系统提示词的某一节，一节问一次 | 没用，`prompt.compose` 一次就能拿到全部 |
| `tool.describe` | 每个工具的说明 | 用：换称呼 |
| `prompt.attachment` | Claude Code 自己塞给模型的提醒 | 用：两种清单里换称呼 |
| `prompt.context` | 第一条消息带的上下文 | 没用 |

为什么要换称呼：Claude Code 写给模型的说明里，管你叫 "the user"（用户）。工具说明、技能清单、系统提示词里到处都是。我们的观察是，在拿 Claude Code 聊天、相处的场景里，这个称呼一直在提醒模型「对面是一位用户」。换成你的名字，它读到的就是你。

改不了的：你发的消息、你 @ 的文件、`CLAUDE.md`（这些本来就是你写的，想改自己改）；工具的参数说明（mod 拿不到）；官方还写明，mod 改不了权限确认框里显示的内容。

---

## 2. 最小的 mod 长什么样

三个文件（另外还有一个 `.gitignore`，给用 git 管文件的人准备的，可以不管）：

```text
companion-basics/
├── .claude-plugin/
│   └── plugin.json      名字、版本、一句说明
└── hooks/
    ├── hooks.json       告诉 Claude Code 去加载哪个文件
    └── register.js      真正干活的代码
```

`plugin.json`：

```json
{
  "name": "companion-basics",
  "version": "1.0.0",
  "description": "示例：把 Claude Code 写给模型的话里的 the user 换成你的名字，并可替换系统提示词里的一节"
}
```

名字别用 `claude-` 开头，官方的检查会当成冒充官方、直接判不通过。

`hooks/hooks.json` 只有一行：

```json
{"modules": ["./register.js"]}
```

`hooks/register.js` 导出一个 `register(on)` 函数，在里面用 `on('钩子名', 处理函数)` 登记要管的事。全文见 [`examples/mod/companion-basics/hooks/register.js`](../examples/mod/companion-basics/hooks/register.js)，第 3、4 节逐段讲。

**挂上去**：`claude --plugin-dir <文件夹>`。挂几个就写几次 `--plugin-dir`。用 `--plugin-dir` 挂上的文件夹，Claude Code 会盯着，你改了文件它自己重新加载（官方说明，我们在终端里也看到了）。

**先自查**：`claude plugin validate <文件夹>`。它不跑你的代码、不开会话，只照 Claude Code 加载时的方式读一遍。正常的话会列出两行：`hooks: prompt.compose, tool.describe, prompt.attachment`，和 `calls: $.ui.log`；最后一行是 `✔ Validation passed with warnings`（警告是什么，见[「先说结论」](#先说结论)第 3 步）。`calls:` 那行列的是这个 mod 要 Claude Code 替它做的事，比如读文件、联网；这个示例只要 `$.ui.log`，就是往调试日志里写一句换没换上。装别人写的 mod 之前，先看这一行（[官方说明](https://code.claude.com/docs/en/plugins/mods/overview)）。钩子名写错会直接报出来：比如把 `prompt.compose` 写成 `prompt.compse`，它会说 `"prompt.compse" is not an event`，最后一行变成 `✘ Validation failed`。

在终端里挂 mod 时，Claude Code 会往 mod 文件夹里写一份类型声明（`.claude-plugin/types/` 和一个 `tsconfig.json`），给写代码时的编辑器提示用，不影响运行；`-p` 和 validate 不写。示例里的 `.gitignore` 已经把这两样排除掉了。

---

## 3. 换称呼

`register.js` 开头这几行：

```js
const MY_NAME = '你的名字'
const THE_USER = /\b[Tt]he user\b(?!-)/g
const swapUser = (text) => text.replace(THE_USER, () => MY_NAME)
```

- 替换内容写成函数 `() => MY_NAME`：名字里就算有 `$` 这类符号，也照原样换进去。

- 只换 `the user` / `The user` 这个词组。`users`（复数泛指）、单独的 `user`（比如 user message 这种术语）、`the user-invocable` 这种连字符词都不换。
- 换三处：
  1. **系统提示词**：每一节都过一遍（`prompt.compose`）。
  2. **工具说明**：Claude Code 自带的工具和 MCP 工具都经过 `tool.describe`。
  3. **两种清单**：技能（skill）清单、子代理（subagent）清单（`skill_listing`、`agent_listing_delta`）。只认 Claude Code 自己写的（`origin.kind === 'engine'`）。
- 别的提醒一律不碰。有的提醒里夹着你 @ 的文件内容、git 记录，那是数据，改了会出错。

我们在测试环境里数过（Opus 5.5，`-p`）：系统提示词里 10 处 the user 换了 9 处，剩下那处就是 `the user-invocable`，故意不换；工具说明里 28 处全换了；技能清单、子代理清单里的也换了。你发的消息、@ 的文件、别的提醒、环境信息那段，一个字没动。除了称呼，系统提示词跟不挂 mod 时逐字一样。

---

## 4. 改系统提示词里的一节

系统提示词分成好几节，每节有个名字。我们在测试环境里（Opus 5.5，`-p`）看到 9 节：`lean_body`、`pronouns`、`action_caution`、`session_guidance`、`memory`、`env_info_simple`、`context_management`、`act_dont_rederive`、`original_games`。节的清单跟模型和跑法有关，以你自己偷看到的为准。

### 「原文对上才换」

示例里换一节要填三个常量：

```js
const SECTION_NAME = ''      // 那一节的名字
const SECTION_ORIGINAL = ''  // 那一节现在的原文，一字不差，换行也算
const SECTION_MINE = ''      // 换成什么；写成 null 就是删掉这一节
```

节的名字和原文怎么拿，见下面[「怎么拿到节名和原文」](#怎么拿到节名和原文)。`SECTION_MINE` 是你自己的话，写在两个英文单引号中间；话里要用英文单引号（比如 don't）就写成 `don\'t`，要换行就写 `\n`。

为什么要填原文：Claude Code 升级时，官方常常会改系统提示词。示例只在原文一字不差的时候才换，对不上就原样发出去，不报错。这样官方改了那一节，你的旧版本不会把新内容盖掉；代价是升级以后那一节会变回原样，要你重新取一次原文。变没变，照下面[「换上没有，怎么确认」](#换上没有怎么确认)跑一次就知道。

我们测了这几种情况：原文一字不差，那一节换成了填的话（填进去的话里的 the user 也会换成你的名字）；原文改错一个字，那一节原样发出（称呼照换）；`SECTION_MINE` 写成 `null`，那一节就没了。

### 怎么拿到节名和原文

用仓库里另一个示例 [`peek-sections`](../examples/mod/peek-sections)。它只读、什么都不改，把每一节的名字和原文写进调试日志。像上面那样把它整个复制到 `~/my-mods/peek-sections`，然后新建一个空文件夹，在终端里进到这个文件夹，跑：

```bash
claude -p --plugin-dir ~/my-mods/peek-sections --debug-file ./peek.log "hi"
```

平时用哪个模型，就再加上 `--model <那个模型>`：节的清单和原文跟模型有关。

跑完，文件夹里会多出两样：`peek.log`，和一个叫 `latest` 的快捷方式（指向 `peek.log`）。用文本编辑器打开 `peek.log`，搜 `PEEK`。第一行是 `PEEK-HEAD`，记着模型名和一共几节；后面每节一行，样子是：

```text
<时间> [DEBUG] [peek-sections] $.ui.log (to debug): PEEK {"id":"…","scope":"…","chars":…,"text":"…"}
```

- `"id"` 后面引号里的字就是节的名字，填进 `SECTION_NAME`：比如看到 `"id":"session_guidance"`，就写 `const SECTION_NAME = 'session_guidance'`。
- `"text":` 后面那段，从紧跟着的那个双引号开始，选到这一行最后那个 `}` 前面，两头的双引号都要。复制下来，把 `SECTION_ORIGINAL =` 后面那对空引号 `''` 整个换掉。它本身就是合法的 JavaScript 字符串，换行显示成 `\n`，不用改。我们在测试环境里就是这样原样复制、贴回去的，那一节一字不差对上、换成功了。

几件要注意的：

- 这会发一次真的请求，花一点点用量。
- `peek.log` 里有整份系统提示词和你电脑上的路径（带着用户名）；用订阅账号登录时里面会不会还有登录信息，我们没测。取完原文，就把 `peek.log` 和 `latest` 一起删掉，别发到网上，也别提交进 git。
- 偷看时只挂 `peek-sections` 一个，别和 `companion-basics` 一起挂，不然看到的可能是已经换过称呼的文字。
- 打算在终端里用还是在 `-p` 里用，就照那样偷看。同一个模型，终端里能换的 the user 比 `-p` 多一处，所以我们推断两种跑法下的节不完全一样。在终端里偷看我们没试过，按道理是 `claude --plugin-dir ~/my-mods/peek-sections --debug-file ./peek.log`，随便说一句话，再退出。

### 换上没有，怎么确认

填好三个常量、保存以后，照偷看那样再跑一次，这回只挂 `companion-basics`，同样在一个空文件夹里。**模型和跑法要跟偷看时一样**：偷看时加了 `--model …`，这里也加同一个；条件一变，日志说的就是另一套条件下的结果，可能报「对不上」或「没找到」。用 `-p` 是这样：

```bash
claude -p --plugin-dir ~/my-mods/companion-basics --debug-file ./check.log "hi"
```

平时在终端里用、原文也是在终端里偷看的，就在终端里确认（我们没测）：`claude --plugin-dir ~/my-mods/companion-basics --debug-file ./check.log`，随便说一句话，再退出。

打开 `check.log`，搜「换节」。示例拼系统提示词的时候会写下一句：

| 看到的 | 意思 |
|---|---|
| `换节：换上了 <节名>` | 换成功了 |
| `换节：<节名> 原文对不上，没换` | `SECTION_ORIGINAL` 跟现在的原文不是一字不差（忘了贴、还空着，也是这句）。升级以后官方改了这一节，也会是这句。回去重新偷看一次 |
| `换节：删掉了 <节名>` | `SECTION_MINE` 写的是 `null`，这一节删掉了 |
| `换节：SECTION_MINE 还空着，没换` | 你自己的话还没填 |
| `换节：没找到叫 <节名> 的节，没换` | 节名写错了，或者这个模型、这种跑法下没有这一节 |

一句都没有，就是 `SECTION_NAME` 还空着，或者 mod 没挂上。跟偷看一样：这会发一次真的请求；看完把 `check.log` 和 `latest` 一起删掉。

### 换哪一节

- **别动跟安全、拒绝、权限有关的内容。** 这些是官方给模型定的底线，这篇不教删，也不建议改。比如 `original_games` 讲的是版权边界，属于拒绝类的规矩，别动。
- 第一次试，挑一节短的、跟安全无关的。比如我们测试时用的 `session_guidance`：它讲的是你输入 `/技能名` 时怎么调用技能，在我们的测试里只有 163 个字符。
- 带路径的节（`memory`、`env_info_simple`）别挑：换个文件夹启动，原文就变了，永远对不上。
- 换掉一节，模型就看不到那一节原来讲的事了。比如换掉 `session_guidance`，它原来讲的「输入 `/技能名` 时怎么调用技能」，模型就读不到了。试完不想要了，把三个常量清空成 `''`，新开的对话里就换回原样（原来开着的对话要等压缩以后，见第 5 节）。
- 想加一段自己的话，不一定要换掉官方的节：Claude Code 自带 `--append-system-prompt`，可以在系统提示词后面加话，不用写 mod。

### 用自带系统提示词的套壳

我们用 `-p` 测了这几种：

- `--system-prompt "…"` 或 `--system-prompt-file <文件>`：默认的系统提示词正文换成了你给的那段（Claude Code 还会附上几句自己的身份和运行信息），`prompt.compose` 根本不触发，换节、系统提示词里的换称呼都不起作用。那段本来就是你自己写的，想怎么称呼直接写进去。工具说明和两种清单照样会换。
- `--append-system-prompt "…"`：官方那几节照常，照常能换；你追加的那句接在最后，不属于任何一节，不会被换。

---

## 5. 改完什么时候生效

以下按我们测的 2.1.321、默认设置说。

- **系统提示词和已经加载的工具说明，按对话算。** 官方写明：一个对话的系统提示词在它第一次请求时生成并记下来，之后每次请求都用记下的那份，`--resume`、`--continue` 回来也一样，直到压缩为止（[官方说明](https://code.claude.com/docs/en/cli-reference)）。mod 改出来的节和工具说明也一样：开着的对话要等新对话或压缩才看得到（[官方说明](https://code.claude.com/docs/en/plugins/mods/reference)）。我们在终端里实测：改了 `MY_NAME` 保存，下一句话里系统提示词和工具说明没变；输入 `/clear` 开新对话以后才换成新名字。
- **两种清单不一样，改了马上变。** 同一次实测里，保存以后的下一句话，技能清单和子代理清单就换成了新名字，连对话历史里那份也跟着变了。按道理，那个对话的提示缓存会从那里开始重来一次（推断）。所以改名字，最好挑没有长对话开着的时候。
- **缓存**：官方提供了一个让开着的对话立刻用上新的系统提示词的写法（`breakPromptCache`），代价是那一轮的提示缓存从头来，更慢也更贵。示例没用它。示例每次的输出都一样，平时不会自己弄断缓存。
- **升级 Claude Code 以后**（`claude --version` 能看现在是哪一版）：先跑一次 `claude plugin validate`；换过节的，再照第 4 节[「换上没有，怎么确认」](#换上没有怎么确认)跑一次，看那一节还对不对得上。官方也说，文档和你电脑上 Claude Code 生成的类型声明对不上时，以后者为准。

---

## 6. 用 `-p`、stream-json 和 SDK 的

官方写明，mod 在 `claude -p` 和 Agent SDK 下照样运行，只是不画界面（[官方说明](https://code.claude.com/docs/en/plugins/mods/overview)）。

- **能改启动命令的套壳**：在它调用 Claude Code 的命令里加 `--plugin-dir <文件夹>`。`-p` 和 stream-json 我们都测过。
- **改不了启动命令的**：用环境变量 `CLAUDE_CODE_PLUGIN_DIRS`（环境变量就是程序启动时从外面带进去的设置）。它要填绝对路径，也就是从头写全的路径，比如 `/Users/你的用户名/my-mods/companion-basics`，别用 `~`；几个文件夹用 `:` 隔开（Windows 用 `;`）。可以设在启动 Claude Code 的环境里，也可以写进 `~/.claude/settings.json` 的 `env` 里（[官方说明](https://code.claude.com/docs/en/plugins/mods/reference)）。settings.json 里已经有 `env` 的（比如照第一篇设过），把这一项加进原来那个 `env`，别再写第二个 `env`。我们测过只设环境变量、不加 `--plugin-dir`，照样挂上；写进 settings.json 这条是照官方文档写的，我们没测。
- **确认挂上了**：stream-json 开头那条 `init` 事件里，`plugins` 列表会有一项 `"name":"companion-basics"`。
- **套壳自带系统提示词的**：见[第 4 节最后](#用自带系统提示词的套壳)。
- **SDK**：官方写法是在 `options` 里加 `plugins: [{ type: "local", path: "<文件夹>" }]`（[官方说明](https://code.claude.com/docs/en/agent-sdk/plugins)）。SDK 我们没测。

---

## 我们测了什么、没测什么

测试环境：Claude Code 2.1.321（Linux），模型 Opus 5.5。一台假服务器扮演 Anthropic 的接口，Claude Code 发出去的每个请求我们都存下来逐字比对。全程没有连真接口，也没有用真账号。

**测过的**

- 四种挂法都生效：`-p`、stream-json、环境变量 `CLAUDE_CODE_PLUGIN_DIRS`、交互终端。
- 换称呼：系统提示词、工具说明、两种清单换了；你的消息、@ 的文件、别的提醒、环境信息那段没动。除了称呼，系统提示词跟不挂 mod 时逐字一样。
- 换一节的三种情况：原文一字不差、改错一个字、写成 `null`。
- 换节以后看调试日志：换上了、原文对不上、删掉了、还空着、节名写错，五种提示各测一次，每次正好一句。
- 名字里带 `$` 这类符号：照原样换进去。
- 自带系统提示词（`--system-prompt`、`--system-prompt-file`）和追加（`--append-system-prompt`）各一次。
- 终端里改 mod 保存：会自动重新加载；系统提示词和工具说明要 `/clear` 开新对话才变，两种清单下一句就变。
- `claude plugin validate`：正常和钩子名写错各一次。
- 偷看原文：`--debug-file` 拿到每一节的全文，原样贴回 `SECTION_ORIGINAL` 能一字不差对上（用仓库里的两个示例原样测的）。

**没测的**

- macOS 和 Windows。
- 别的模型：节的名字和原文可能不一样，以你偷看到的为准。
- 在交互终端里偷看原文、确认换上没有。
- 换称呼以后，模型的回复会不会不一样：我们只核对了发出去的字，没测回复。
- 写进 `~/.claude/settings.json` 的 `env` 来挂 mod（我们只测了直接设环境变量）。
- VS Code 插件、桌面版里的 Claude Code 怎么挂。
- 用订阅账号登录时，调试日志（`peek.log`、`check.log`）里有没有登录信息。
- SDK 里挂 mod（照官方文档写的）。
- `breakPromptCache`。
- 真的服务器上，提示缓存会不会因为改了称呼多断一次（假服务器测不到缓存）。
- 用订阅账号登录时有没有不同（我们测的是 API key 的方式）。
- Team / Enterprise 账号下守卫挡住钩子的样子（照官方文档写的）。

---

## 相关项目

- [kagamiurayama/claude-code-roof-mod](https://github.com/kagamiurayama/claude-code-roof-mod)：同样用官方 mod 改系统提示词、换称呼，还能关掉 todo 提醒，比这篇的示例做得多。谢谢作者。
- [官方 mod 文档](https://code.claude.com/docs/en/plugins/mods/overview)：钩子的完整说明、怎么写测试、怎么排查都在这里。

## 小词典

| 词 | 人话 |
|---|---|
| mod | Claude Code 官方的一种插件，一段 JavaScript，能在 Claude Code 做某件事的时候插手改它 |
| 钩子 | mod 用来插手的那个「时机」，比如「拼系统提示词的时候」「给工具写说明的时候」 |
| 系统提示词 | Claude Code 每次请求都放在最前面、告诉模型「你是谁、该怎么做」的一大段话，分成好几节 |
| 节（section） | 系统提示词里的一段，每段有个名字 |
| 提醒 | Claude Code 自己塞进对话里给模型看的话，比如技能清单、待办提醒 |
| 工具说明 | 告诉模型每个工具（读文件、跑命令……）是干什么、怎么用的说明文字 |
| MCP | 给 Claude Code 接上外部工具的一种标准；接上的工具也有工具说明 |
| 子代理（subagent） | Claude Code 可以派出去单独办一件事的帮手；能派哪些，列在子代理清单里 |
| `--plugin-dir` | 启动 Claude Code 时带的参数，告诉它从哪个文件夹加载 mod |
| 挂上 | 启动 Claude Code 时让它加载某个 mod，比如加 `--plugin-dir` |
| 环境变量 | 程序启动时从外面带进去的设置，比如 `CLAUDE_CODE_PLUGIN_DIRS` |
| `claude plugin validate` | 官方的自查命令，不开会话就能看出 mod 有没有写错 |
| 调试日志 | Claude Code 记下的运行细节，加 `--debug-file <文件>` 启动就会写进那个文件 |
| 缓存 | 每次请求里不变的开头部分，服务器会记住、下次不用重算。开头一变就得重来一次，那一轮更慢、更贵 |
| `-p` | 让 Claude Code 回答完一次就退出，不开交互界面。很多套壳是这样调用它的 |
| stream-json | `-p` 的一种输出格式，一行一个 JSON 事件，套壳靠它读回复 |
| SDK | Anthropic 官方的 Agent SDK，用代码来调用 Claude Code |
| 套壳 | 把 Claude Code 包起来、换一个聊天界面的程序 |
| 压缩（compact） | 对话太长时，Claude Code 把前面的内容压成一段摘要，之后只带着摘要往下聊 |

## 许可证

[MIT](../LICENSE)
