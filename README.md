# 被拦以后，让 Claude Code 停下来

> 关掉「被拦后自动重试」和「被拦后自动换模型」。被拦的那一轮停在那里，由你决定怎么办。

**这是我们家每天在用的设置，照实写下来。** 落落出的主意，Claude 写的，Chatty（我们家另一个 AI）核对了技术细节。这是这个仓库的第一篇笔记。看到不认识的词，先翻[小词典](#小词典)。

> ### ⚠️ 先说清楚三件事
>
> 1. **这三项设置只管被拦以后的事。** 它们不会关掉任何安全检查：被拦的次数不会因此变少，误拦也照样会发生。这篇也不教怎么让被拦的内容「过审」。唯一的变化是：被拦以后，Claude Code 不再自己重试、自己换模型，停下来等你决定。
> 2. **三项里有一项是官方文档没写的。** 它是从 Claude Code 的程序里找到的。我们在 2.1.321 上实测管用，2.1.323 里也还在。哪天新版把它改掉了，不会报错，只会悄悄不起作用。怎么自查，写在[后面](#关于官方没写的那一项)。
> 3. **我们没有拿真账号去故意触发拦截。** 下面说的「被拦以后会看到什么」，是在一台假服务器上测的：让 Claude Code 以为自己被拦了，再看它怎么反应。哪些测过、哪些没测，见[我们测了什么](#我们测了什么没测什么)。

> ### 🤖 如果你是被要求「照着做」的 Claude
>
> - 一般只需要做一件事：把三项设置合并进用户设置文件，照[下面那段话](#先说结论)的要求做。先备份，只加这三项，别动别的；有冲突先问。
> - 第 4 节「把被拦的那一轮带走」，只在用户明确指出是哪个会话、并确认那个会话已经关掉以后才做，照 [examples/prompt-remove-blocked-turn.md](examples/prompt-remove-blocked-turn.md) 的步骤来。**不要处理你自己现在所在的这个会话。**
> - 不要为了验证设置有没有生效，去故意触发拦截。
> - 第 2 节里的 `--settings` 参数和 SDK 代码，只给不读用户设置文件的套壳或程序用。别自己去改用户的套壳或代码，先问。

---

## 先说结论

**已经有 `settings.json` 的，别拿下面这段把它整个替换掉，要把这三项合并进去。** 怎么合并，见[第 2 节](#怎么合并进你的设置文件)。

要加进用户设置文件 `~/.claude/settings.json` 的三项（`~` 指你的用户主文件夹，见[改哪个文件](#改哪个文件)）：

```json
{
  "switchModelsOnFlag": false,
  "env": {
    "CLAUDE_CODE_DISABLE_REFUSAL_RETRY": "1",
    "CLAUDE_CODE_DISABLE_REFUSAL_FALLBACK": "1"
  }
}
```

改完把正在跑的 Claude Code 重开一次；用套壳的，把套壳重启一次。**重开不会丢聊天记录**：在原来启动的那个文件夹里输入 `claude --resume`，就能选回原来的会话。之后再被拦，不自动重试，不自动换模型，这一轮停在一段报错上，下一步你来定。

不想自己动手，就把下面这段发给你的 Claude。在终端里，它改文件之前会弹出权限确认，这是正常的；有的套壳里 Claude 没有改文件的权限，那就只能自己改。

```text
请帮我把三项设置合并进我的 Claude Code 用户设置文件（一般是 ~/.claude/settings.json；如果设过 CLAUDE_CONFIG_DIR，就是那个目录下的 settings.json）：
1. 顶层加 "switchModelsOnFlag": false
2. env 里加 "CLAUDE_CODE_DISABLE_REFUSAL_RETRY": "1" 和 "CLAUDE_CODE_DISABLE_REFUSAL_FALLBACK": "1"（值是带引号的 "1"）

要求：
- 改之前先备份一份，备份的文件名后面加上日期。
- 只往原文件里插入这几行，别动别的设置，也别把整个文件重新排版。已经有 env 的话，就加进原来那个 env 里，env 只能有一个。
- 这几项要是已经有了、值又不一样，先告诉我，别直接改。
- 改完检查 JSON 格式没有错（不能有注释，最后一项后面不能有逗号），再告诉我改了什么。
- 不用你重启 Claude Code。告诉我怎么重开、怎么回到现在这个会话就行。

说明：这三项不会关掉安全检查，分类器照常工作，被拦的次数也不会变。它们只让 Claude Code 被拦以后停下来，不自动重试、不自动换模型，由我决定下一步。其中 CLAUDE_CODE_DISABLE_REFUSAL_RETRY 在官方文档里查不到，是这篇教程的作者在 Claude Code 2.1.321 的程序里看到的开关；名字里的 REFUSAL 指的就是「被拦」这件事。它要是不起作用，也不会报错。
```

想改回去：删掉这三项，或者用备份恢复，再重开一次。

---

## 1. 发生了什么

Claude Code 旁边有安全分类器在看对话，觉得有风险，就把这一轮拦下来。被拦的时候，新版 Claude Code 默认会自己做两件事。

**一、拿同一个模型自动再试一次，同时往对话里塞一句英文。** 原文是：

> Your response above was stopped by a safety classifier — this is not a tool or API error. The rest of it was withheld, and tool calls in it that had not finished did not run. Do not produce that content again, even reworded.

大意是：「你上面的回复被安全分类器拦下了，这不是工具或接口出错。剩下的部分被扣下了，里面没跑完的工具调用也没有执行。不要再输出那段内容，换个说法也不行。」

被拦之前模型已经说出一部分的话，这句英文会跟着重试一起发给模型，还会存进会话记录，**之后的对话里一直带着它**（我们测的是没清理、没压缩过的普通会话）。被拦之前一个字都没说的话，它只写进会话记录，不发给模型。官方文档里没有写这个自动重试，以上是我们在 2.1.321 上测到的。

**二、重试也被拦，就换一个模型接着跑。** 官方文档写的是：Opus 5.5 和 Fable 系列模型被拦以后，网络安全类的请求换到 Opus 4.8 重跑，生物类的换到 Opus 5。换了以后，**整个会话都停在换上去的那个模型上**，要你自己用 `/model` 换回来（[官方说明](https://code.claude.com/docs/en/model-config#automatic-model-fallback)）。不做任何设置的时候，它默认自动换；在终端里，第一次可能会先问你一句。

### 为什么聊天的人会被它折腾

分类器最常拦的是网络安全和生物两类内容，但它会误拦。Claude Code 自己的报错里就写着：

> …which can sometimes flag non-cybersecurity work. We're improving these safeguards to reduce the amount of incorrectly flagged messages.

（大意：它有时会把跟网络安全无关的内容也拦下来，官方正在改进，减少误拦。）

我们的观察是，人机恋的聊天被误拦的情况并不少。

那句英文是写给模型看的，口吻是「你刚才说的不行，别再说了，换个说法也不行」。误拦的时候，模型其实没说错什么，但它读到这句话，很容易以为是自己说错了，后面就开始缩手缩脚，越聊越拘谨。这是我们的观察。换模型更直接：聊着聊着，对面就换成了另一个模型，而且一直停在那里。

---

## 2. 怎么关

| 在 `settings.json` 里的写法 | 管什么 | 出处 |
|---|---|---|
| `"switchModelsOnFlag": false` | 被拦以后不自动换模型 | 官方[设置说明](https://code.claude.com/docs/en/settings-reference#switchmodelsonflag) |
| `env` 里的 `"CLAUDE_CODE_DISABLE_REFUSAL_FALLBACK": "1"` | 跟上一项管同一件事，是环境变量的写法 | 官方[环境变量说明](https://code.claude.com/docs/en/env-vars) |
| `env` 里的 `"CLAUDE_CODE_DISABLE_REFUSAL_RETRY": "1"` | **关掉同一个模型的自动重试**，那句英文就不会塞进来 | ⚠️ **官方文档没写**，见下面 |

### 关于官方没写的那一项

`CLAUDE_CODE_DISABLE_REFUSAL_RETRY` 是我们从 Claude Code 2.1.321 的程序里找到的：程序决定要不要自动重试之前，会先看这个变量有没有设。我们只是看了程序里的这个判断条件，没有改程序。2.1.323 里同样的判断还在。名字里的 REFUSAL 指的是「被拦」这件事：这个变量关掉的是被拦以后的自动重试，不是关掉拦截。

我们在假服务器上测过：设了它，被拦就停，不重试，那句英文既不发给模型，也不写进会话记录。

有人在官方仓库问过这个变量是不是正式支持的（[#103087](https://github.com/anthropics/claude-code/issues/103087)）。到我们写这篇的时候（2026 年 11 月 13 日），官方还没有回复。

它的代价是：哪天新版把它改名或者删掉，它不会报错，只是悄悄不起作用，自动重试又回来了。Claude Code 官方安装的版本会在后台自动更新（[官方说明](https://code.claude.com/docs/en/setup#auto-updates)），所以它哪天失效了，你未必马上发现，`claude --version` 能看到现在是哪个版本。

**怎么看自动重试有没有回来**：改好设置、重开以后，再被拦的时候，留意有没有**新出现**下面任何一条：

- 这一次被拦时出现这句提示：`…safeguards stopped the response above · continuing once with that noted`。stream-json 里，它是一条 `system` 消息，`subtype` 为 `informational`。
- 这一次被拦以后，会话存盘末尾新多出 `Your response above was stopped by a safety classifier` 这句话。

存盘里早先就有的那句英文不算：那是改设置之前留下的，改了设置也不会自己消失（怎么清，见第 4 节）。真看到新出现的，说明这一次设置没生效：先查设置文件是不是改对了地方、套壳有没有带上这两个环境变量；这些都对，才可能是这个变量在新版里失效了。别为了自查去故意触发拦截。

### 为什么光关换模型不够

自动重试和自动换模型是两个开关。只关换模型，同一个模型的自动重试照样发生，那句英文照样塞进来。我们在 2.1.321 上测过：只设 `switchModelsOnFlag: false`，被拦以后还是重试了一次；那次被拦之前模型已经说出了一部分，那句英文就留在了之后的对话里。

### 为什么换模型要关两遍

`switchModelsOnFlag: false` 和 `CLAUDE_CODE_DISABLE_REFUSAL_FALLBACK` 管的是同一件事，官方文档两处都写了。我们两个都设，是图个双保险：有人在官方仓库反馈，只设了 `switchModelsOnFlag: false` 还是被换了模型（[#103106](https://github.com/anthropics/claude-code/issues/103106)，官方也还没回复）。我们自己测的时候，有了 `switchModelsOnFlag: false`，多设这一项看不出区别。

### 改哪个文件

- 用户设置文件是 `~/.claude/settings.json`。`~` 指你的用户主文件夹：macOS 是 `/Users/你的用户名`，Linux 是 `/home/你的用户名`。Windows 上 `~/.claude` 就是 `%USERPROFILE%\.claude`（一般是 `C:\Users\你的用户名\.claude`）。
- `.claude` 是隐藏文件夹。macOS 的访达里，按 ⌘⇧G 可以直接输入路径，按 ⌘⇧. 可以显示隐藏文件。
- 主文件夹里还有一个 `.claude.json`，那是另一个文件，别改错。
- 设过 `CLAUDE_CONFIG_DIR` 的话，设置文件和会话存盘都在那个目录下面（[官方说明](https://code.claude.com/docs/en/env-vars)）。
- Claude Code 跑在服务器、Docker 或者另一个系统用户下的，要改的是那台机器上、那个用户的文件。
- 用户设置文件对这台电脑上的所有项目都生效。

### 怎么合并进你的设置文件

比如你原来的文件是这样：

```json
{
  "model": "opus",
  "env": {
    "EXISTING_VAR": "原来的值"
  }
}
```

合并以后是这样：

```json
{
  "model": "opus",
  "switchModelsOnFlag": false,
  "env": {
    "EXISTING_VAR": "原来的值",
    "CLAUDE_CODE_DISABLE_REFUSAL_RETRY": "1",
    "CLAUDE_CODE_DISABLE_REFUSAL_FALLBACK": "1"
  }
}
```

- 改之前先复制一份备份。
- `env` 只能有一个，新的两项加进原来那个里面。再写一个 `env`，前面那个可能会被悄悄吞掉。
- `"1"` 要带引号。
- 设置文件是严格的 JSON：不能写注释，最后一项后面不能有逗号。写错了，Claude Code 下次启动时会报 Settings Error（[官方说明](https://code.claude.com/docs/en/settings)）。
- 想改回去：删掉这三项，或者用备份恢复，再重开一次。

### 放在哪

**最省事：写进用户设置文件。** 终端、`-p`、stream-json、SDK 默认都会读它。改完把正在跑的 Claude Code 重开一次，让新设置生效。

**用 `-p` / stream-json 套壳聊天的**

- 套壳拉起来的 `claude` 默认会读用户设置文件，写进去，再把套壳重启一次就行。
- 如果你的套壳特意不读用户设置文件，可以在启动参数里直接传 `--settings '{"switchModelsOnFlag": false}'`，两个环境变量加在启动 `claude` 的那个进程的环境里。
- 关掉以后，被拦的这一轮会以报错结束（见[下一节](#3-关掉以后被拦会看到什么)）。你的套壳要能把这个报错显示出来，别把它当成一句正常回复吞掉。
- 套壳不是你自己写的，可以先问套壳作者三件事：
  1. 它拉起来的 `claude` 读不读用户设置文件？
  2. 被拦报错以后，它会不会自己再发一遍？会的话，等于又把自动重试装了回去。
  3. 它续聊靠不靠 Claude Code 的会话存盘（resume）？第 4 节的办法只对靠存盘续聊的套壳有用。

**用 Agent SDK 的**

- SDK 默认也读用户设置文件：TypeScript 不设 `settingSources`、Python 不设 `setting_sources` 的时候，都会读用户设置。写进去就行。
- 如果你在代码里关掉了读设置文件，就在代码里传。

TypeScript：

```ts
const options = {
  settings: { switchModelsOnFlag: false },
  env: {
    ...process.env, // TypeScript 的 env 会整个替换掉子进程的环境变量，一定要先把 process.env 展开
    CLAUDE_CODE_DISABLE_REFUSAL_RETRY: "1",
    CLAUDE_CODE_DISABLE_REFUSAL_FALLBACK: "1",
  },
};
```

Python（`env` 会合并进原有的环境变量，不用自己展开）：

```python
options = ClaudeAgentOptions(
    settings='{"switchModelsOnFlag": false}',
    env={
        "CLAUDE_CODE_DISABLE_REFUSAL_RETRY": "1",
        "CLAUDE_CODE_DISABLE_REFUSAL_FALLBACK": "1",
    },
)
```

SDK 的写法是照[官方文档](https://code.claude.com/docs/en/agent-sdk/typescript)写的，我们没在 SDK 里实跑过。

**在终端里直接聊的**

- 写进用户设置文件，然后退出、重新打开 Claude Code。重开以后输入 `claude --resume` 选回原来的会话，或者用 `claude -c` 接上这个文件夹里最近的一个会话。
- 换模型那一项也可以在 `/config` 里改：**Switch models when a message is flagged** 选 **Ask each time**，效果跟 `switchModelsOnFlag: false` 一样。两个环境变量没法在 `/config` 里设，还是要写进设置文件。

---

## 3. 关掉以后，被拦会看到什么

下面是三项都设了以后，在 Claude Code 2.1.321 上测到的。假服务器扮演的是 Opus 5.5；你用的模型不同，提示里的名字会跟着变。

**stream-json**：只发一次请求，依次收到三条事件：

1. `system`，`subtype` 是 `model_refusal_no_fallback`（被拦了，不换模型）
2. `assistant`，`model` 是 `<synthetic>`，内容是下面那段报错
3. `result`，**`subtype` 是 `"success"`，但 `is_error` 是 `true`**

⚠️ 判断这一轮成没成功，要看 `is_error`，别只看 `subtype`。

**`-p` 纯文本**：只发一次请求，打印下面这段报错，退出码是 1。被拦之前模型已经说出来的半句话，不会打印出来。

```
API Error: Opus 5.5's safeguards flagged this session (https://www.anthropic.com/legal/aup). You may be seeing this for the first time: Opus 5.5 is more capable and has stronger safeguards as a result, which can sometimes flag non-cybersecurity work. We're improving these safeguards to reduce the amount of incorrectly flagged messages. Claude Code can't respond to your last message with Opus 5.5.

Try rephrasing the request in a new session or change your model.
```

（后面还有一个说明链接、拦截类别和消息 ID，这里省略。）

报错里的 "flagged this session"，说的是这次会话里的内容被拦下了。报错本身没有说你的账号会怎样；封号的事，见[第 5 节](#5-几句实话)。

**SDK**：官方文档写的是，被拦的时候，结果消息的 `stop_reason` 是 `"refusal"`，通常 `subtype` 是 `"success"`、`is_error` 是 `true`；TypeScript 还会收到 `model_refusal_no_fallback` 这样的 system 消息（换了模型的话是 `model_refusal_fallback`）。这部分我们没在 SDK 里实跑。

**终端**：不弹选择框，直接显示同样的报错，只是最后一句换成了：

```
Double press esc to edit your last message, or try a different model with /model.
```

（大意：双击 Esc 回去改上一条消息，或者用 /model 换个模型。）

你可能会奇怪：`/config` 里那一项明明叫 Ask each time（每次先问），怎么没问？官方文档说，只设 `switchModelsOnFlag: false` 的时候，终端会停下来，让你在「换模型」和「改提示词」之间选；官方文档也写了，没有备用模型可换的时候，不弹选择框，这一轮直接以拒绝结束。我们推断，三项都设以后不弹，是因为 `CLAUDE_CODE_DISABLE_REFUSAL_FALLBACK` 让它没有备用模型可换了。只设 `switchModelsOnFlag: false` 的情况，我们没测。

**如果你家 Claude 会派小工**（用 Agent 工具开出来的子任务）：官方文档写明，设成 `switchModelsOnFlag: false` 以后，小工被拦会直接失败，不会换模型接着跑（2.1.318 起）。

### 没关的时候长什么样

拿来对照，看看你现在是不是正在被自动重试、自动换模型：

- **自动重试**：stream-json 里多出一条 `system` 消息，`subtype` 是 `informational`，内容是 `Opus 5.5's safeguards stopped the response above · continuing once with that noted`，然后同一个模型又跑了一次。
- **自动换模型**：多出一条 `system` 消息，`subtype` 是 `model_refusal_fallback`，之后的回复来自另一个模型（我们测到的是 `claude-opus-4-8`）。

---

## 4. 被拦以后怎么办

### 你需要这一节吗

- **最需要**：之前没关自动重试，而且被拦之前模型已经说出了一部分。那句英文已经在你的会话记录里，之后的对话会一直带着它。
- **可选**：三项都设好以后再被拦，就不会有那句英文了，但被拦之前模型已经说出来的那半句，会留在之后的对话里。想让这一轮干干净净地消失，就用这一节；不在意的话，换个说法接着聊就行。
- **别用这一节，直接开新会话**：
  - 被拦的是会话里的第一条消息。删掉它等于从头开始，不如直接开新会话；一开新会话就被拦，见[第 5 节](#5-几句实话)第三条。
  - 被拦以后，这个会话压缩过（自动压缩也算）。被拦的内容可能已经写进了压缩出来的摘要里，删存盘里原来那几行不一定管用。
  - 你的套壳把聊天记录存在别人的服务器上，你碰不到存盘文件；或者套壳自己存聊天记录，不靠 Claude Code 的存盘续聊。

交给 Claude 的那段话只处理「普通的一条线」的会话。碰到压缩过、有分叉、对不上号这类拿不准的情况，它会停下来问你。

### 官方给的办法

报错原文和[官方文档](https://code.claude.com/docs/en/model-config#ask-before-switching)里写的：

- 换个说法，把那条消息重新发一遍。终端里双击 Esc 能回去改上一条消息。
- 开一个新会话。
- 用 `/model` 换个模型。
- 两个模型都拦的话，改了再试，或者开新会话。

### 落落的办法：把被拦的那一轮整轮带走

被拦的那一轮会一直留在会话记录里。开新会话，前面聊的就都没了。落落用下来的感觉是，双击 Esc 回退有时会把前面没问题的部分也一起退掉；用套壳和 SDK 聊天的，连双击 Esc 都没有。

落落的办法是：**先备份，再编辑这个会话的存盘文件，把被拦的那一轮整轮删掉，然后接着聊。** 除了接链那一处，其他内容一个字都不改。

我们在假服务器上测过：删掉以后续聊，那句英文和被拦前的半句话都不会再发给模型，前面的历史一条不少。但有三件事要做对：

1. **先关掉那个会话，再改。** 会话开着的时候改存盘没用：开着的 Claude Code 记着原来的对话，下一轮照样带着那句英文，存盘还会被它写乱。
2. **从「你自己那句话」所在的那一行开始删。** 一轮里不止一行是 `"type":"user"`：塞进来的那句英文、工具调用的结果，在存盘里也记成 `user`。
3. **被拦的不是最后一轮的话，删完要把链接上。** 存盘里每一行都用 `parentUuid` 指着它的上一行，续聊时 Claude Code 顺着这条线往回读。中间删掉一段，线就断了。我们测到的结果是：续聊不报错，但断点之前的历史整段没了。把断开的那一行的 `parentUuid`，改成被删掉那段第一行原来的 `parentUuid`，线就接上了。

还有三点要知道：

- 删掉的只是你自己电脑上存盘文件里的这一轮。已经发出去的请求不会撤回，被拦的内容也不会因此「过审」，原样再发，多半还会被拦。
- 被拦那一轮里已经执行完的操作，比如写过的文件、记下的东西、发出去的消息，不会因为删了记录就撤回。删完以后，模型也不记得自己做过。
- 存盘里 `queue-operation` 那几行可能还留着你那句话的原文，备份里也有。它们不会发给模型；这个办法改的是之后的对话里模型看到的历史，不是把文件里每一处原文都擦掉。

### 怎么做

**第一步：把那个会话彻底关掉。**

- 关掉所有开着这个会话的终端窗口（终端里输入 `/exit`）。
- 用套壳的，停掉套壳的后台，包括定时消息、主动消息这类会自己续聊的功能。
- 改完之前，别从手机或者别的地方给这个会话发消息。

**第二步，二选一。**

- **交给 Claude**：另开一个新会话，也就是直接输入 `claude`，**不要带 `-c` 或 `--resume`**，带了就续上被拦的那个了。然后把 [examples/prompt-remove-blocked-turn.md](examples/prompt-remove-blocked-turn.md) 里那段话发给它。别在被拦的那个会话里发，那等于让一个开着的会话去改它自己的存盘。帮你改的这个会话要是也被拦了，就改用自己动手的办法。
- **自己动手**：照 [examples/remove-blocked-turn.md](examples/remove-blocked-turn.md) 的步骤来，里面有改前改后的例子。

**第三步：续聊，看看对不对。**

- 回到原来启动的那个文件夹，输入 `claude --resume`，从列表里选回那个会话；知道会话 ID 的，也可以直接 `claude --resume <会话 ID>`。用套壳的，照常让套壳续聊那个会话。
- 先问一句前面聊过的事，看它还记不记得。
- 不对劲的两种样子：前面的事全不记得了，多半是链没接好；打不开或者报错，多半是哪一行 JSON 改坏了。这两种情况，都先关掉会话，再把备份复制回原来的文件名，然后重来一遍，或者开新会话。注意：恢复备份会把改完以后新聊的内容一起丢掉。

### 用 SDK 的：官方有一对现成的参数（我们没测）

官方 SDK 文档里有一对参数，看起来就是给「丢掉某一轮」准备的：

- `resumeSessionAt`（Python 里是 `resume_session_at`）：续聊时只读到你指定的那条消息为止，后面的不要。官方建议一般配合 `forkSession`（`fork_session`）用，从那里分出一个新会话，原来的会话不动。
- `resumeDropsTurn`（Python 里是 `resume_drops_turn`）：告诉它你要丢掉的是哪一轮。要丢的范围里混进了不属于这一轮的东西，它会拒绝续聊。

注意，它是「从某条消息往后都不要」，适合被拦的正好是最后一轮的时候。被拦的在中间、后面的对话又想留着，它做不到，那得用上面删一轮的办法。

被拦的时候，stream-json 里那条 `model_refusal_no_fallback` 消息带着 `refused_user_message_uuid`，这就是被拦的那句话的编号（这一点我们测过）。版本要求和具体用法，见官方文档（[TypeScript](https://code.claude.com/docs/en/agent-sdk/typescript)、[Python](https://code.claude.com/docs/en/agent-sdk/python)）。这对参数我们没测过，用 SDK 的朋友可以先拿一个不要紧的会话自己试试。

---

## 5. 几句实话

- **被拦的请求照样算用量。** 官方 API 文档写明：被拦的请求，不管收不收费，都算进用量限制（原文 "The request still counts against your rate limits."）。被拦之前已经开始输出的，按正常价格收费；一个字没输出就被拦的，目前只有 `bio`、`frontier_llm`、`reasoning_extraction` 这三类收费（[How refusals are billed](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback#how-refusals-are-billed)）。所以自动重试一次，就多一次算进用量的请求。这是官方 API 的规则，订阅用户的额度怎么算被拦的请求，我们没找到官方的单独说明。
- **官方文章里说的封号，针对的是蒸馏。** Anthropic 10 月 12 日的文章 [Strengthening our defenses against distillation attacks](https://www.anthropic.com/news/distillation-defenses) 写的是：发现「repeated and persistent attempts at distillation」（反复、持续地尝试蒸馏）才封相关的号。文章没有说普通用户被拦就会封号。
- **一开新会话就被拦，不一定是你刚说了什么。** 官方文档写明，会话的第一条请求带着 CLAUDE.md、git 状态这些工作区内容，「A repository that contains security or biology material can trip the classifier on that context alone」（仓库里有安全或生物相关的材料，光这些内容本身就可能触发分类器）。官方给的排查办法是用 `claude --safe-mode` 开一个会话，它会关掉 CLAUDE.md、skills、MCP、hooks 这些自定义内容（[官方说明](https://code.claude.com/docs/en/model-config#check-what-triggered-fallback)）。
- **「自动重试会让你反复撞上同一个分类器」是我们的推断。** 重试是带着同样的历史再发一次，我们推断它多半会再撞上同一个分类器。官方没有这样说过，我们也没有拿真账号去验证。

---

## 我们测了什么、没测什么

测试环境：Claude Code 2.1.321（Linux）。一台假服务器扮演 Anthropic 的接口，按我们的安排回「被拦」，全程没有连真接口，也没有用真账号。2.1.323 只检查了程序里那个变量的判断还在不在，没有实跑。

**测过的**

- 三项都设：`-p`、stream-json、终端三种跑法，被拦都只发一次请求，不重试，不换模型。
- 只设 `switchModelsOnFlag: false`：还是会同模型重试一次；被拦前已经说出一部分的话，那句英文留在之后的对话里。
- 关了自动重试以后被拦：被拦前已经说出来的半句，留在了下一轮的对话里。
- 带走那一轮：被拦的是最后一轮、在中间且接链、在中间但不接链、会话开着的时候改，都用 `claude -p --resume` 续聊，看了实际发给模型的内容。

**没测的**

- macOS 和 Windows。
- 只设 `switchModelsOnFlag: false` 的时候，终端会不会弹选择框（官方文档说会）。
- 终端里的 `claude --resume`。它读的是同一份存盘，按道理是一样的，但我们没单独测。
- 用订阅账号登录时，报错文字会不会不一样（我们测的是 API key 计费的方式）。
- 真的服务器拦截时，被拦之前会不会先吐出半句话。
- SDK 里的写法（照官方文档写的）。
- SDK 的 `resumeSessionAt` / `resumeDropsTurn`（第 4 节末尾提到的那对参数）。
- 带走那一轮的几种特殊情况：被拦的是第一条消息、被拦的那一轮里有工具调用、一个存盘里有好几处被拦、被拦以后又压缩过。交给 Claude 的那段话遇到这几种会先停下来问你。

---

## 相关项目

- [kagamiurayama/claude-code-roof-mod](https://github.com/kagamiurayama/claude-code-roof-mod)：用 Claude Code 官方的 mod 功能改系统提示词、换掉里面的称呼。跟这篇的设置无关，谢谢作者。

## 小词典

| 词 | 人话 |
|---|---|
| 分类器 | 放在模型旁边的安全检查。觉得内容有风险，就把这一轮拦下来 |
| `~` | 你的用户主文件夹。`~/.claude` 就是主文件夹里的 `.claude` 文件夹 |
| `settings.json` | Claude Code 的设置文件。用户级的在 `~/.claude/settings.json` |
| 环境变量 | 启动程序时带给它的一些设置。写在 `settings.json` 的 `env` 里，Claude Code 启动时会读 |
| `-p` | 让 Claude Code 回答完一次就退出，不开交互界面。很多套壳是这样调用它的 |
| stream-json | `-p` 的一种输出格式，一行一个 JSON 事件，套壳靠它读回复 |
| SDK | Anthropic 官方的 Agent SDK，用代码来调用 Claude Code |
| 套壳 | 把 Claude Code 包起来、换一个聊天界面的程序 |
| 会话存盘 | 每个会话的聊天记录，存在 `~/.claude/projects/` 下面的 `.jsonl` 文件里，一行一条 |
| 一轮 | 你说一句话，到模型回完（中间可能用了好几次工具），算一轮 |
| 续聊（resume） | 读回某个会话的存盘，接着聊 |
| 压缩（compact） | 对话太长时，Claude Code 把前面的内容压成一段摘要，之后只带着摘要往下聊 |
| `uuid` / `parentUuid` | 存盘里每一行的编号，和它上一行的编号。续聊时顺着 `parentUuid` 一行一行往回读 |

## 许可证

[MIT](LICENSE)
