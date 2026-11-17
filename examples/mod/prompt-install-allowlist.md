# 交给你的 Claude：帮我装上 reminder-allowlist

用法：先把这个仓库下载到你电脑上（GitHub 页面上 Code → Download ZIP，解压），记住解压到了哪个文件夹。然后把下面这段话发给你的 Claude，把尖括号换成你自己的。文件夹的路径不会写的话：Mac 上把那个文件夹拖进终端窗口，就会出现它的完整路径；或者写个大概（比如「下载文件夹里的 claude-code-companion-notes-main」），让 Claude 自己去找。

在终端里，它建文件、跑命令之前可能会弹出权限确认（看你的权限设置），这是正常的。有的套壳里 Claude 没有建文件的权限，那就照[正文](../../notes/03-allowlist.md#先说结论)自己动手。

```text
请帮我装一个 Claude Code 的 mod，叫 reminder-allowlist。它给 Claude Code 自己塞进对话的提醒做白名单：名单上的照常发，名单外的先只在终端里打一行灰字告诉我（默认「只看」，什么都不拦）。说明书是仓库里的 notes/03-allowlist.md，我问到这个 mod 的事，你先读它再回答。

仓库我已经下载到：<仓库解压后的文件夹>
（上面要是还是尖括号，先问我仓库在哪。）

步骤：
1. 跑 claude --version 看版本。比 2.1.287 旧就停下告诉我（mod 是那一版以后才有的）；不是 2.1.321 也可以装，但要告诉我教程只在 2.1.321 上测过。
2. 把仓库里的 examples/mod/reminder-allowlist 整个文件夹复制到 ~/my-mods/reminder-allowlist（~/my-mods 不存在就新建）。里面有个以点开头的隐藏文件夹 .claude-plugin，要整个文件夹一起复制，别一个个文件挑；复制完用 ls -a 看它在不在。如果 ~/my-mods/reminder-allowlist 已经存在，先停下来问我。
3. 一个字都不改：MODE 保持 'watch'，两份名单保持原样。
4. 把 ~/my-mods/reminder-allowlist/hooks/register.js 全文给我看，用人话讲讲每一段在做什么，等我说可以再往下走。
5. 跑 claude plugin validate ~/my-mods/reminder-allowlist，把输出原样给我看。最后一行是 ✔ Validation passed 就算通过，后面跟着 with warnings 也算。中间带 ⚠ 或 ✘ 的几行（没写作者、没图标、缺 README、缺 LICENSE）是往官方插件目录提交时才要求的，不用处理，也别为了消掉它们去加文件。正常还会列出两行：hooks: prompt.attachment, prompt.context 和 calls: $.ui.log。hooks 那行要正好是这两个钩子，calls 那行只能有 $.ui.log（先后顺序不要紧）；哪一行没有、少了或者多出别的，就算最后一行是通过，也停下来把输出给我看。最后一行是 ✘ Validation failed，或者命令跑不起来，也停下。这几种情况都别自己改代码。
6. 最后告诉我这几件事：
   - 以后怎么启动：claude --plugin-dir ~/my-mods/reminder-allowlist，每次启动、续聊都要带。我已经挂了第二篇的 companion-basics 的话，两个都写上：claude --plugin-dir ~/my-mods/companion-basics --plugin-dir ~/my-mods/reminder-allowlist。
   - 我用套壳的话怎么挂：在它启动 Claude Code 的命令里加同样的参数；改不了命令的，设环境变量 CLAUDE_CODE_PLUGIN_DIRS，写绝对路径，几个文件夹用 : 隔开（Windows 用 ;），已经挂了别的要一起写上。
   - 现在是「只看」，什么都没拦。
   - 怎么确认挂上了：订阅账号登录的，重启后发第一句话，那句话上面会多一行「只看：会拦下上下文块 userEmail」；用 API key 的，多半一行灰字都没有，这是正常的，Claude Code 开着时在 register.js 末尾加个空行保存，看到 reloaded 那一行就说明挂上了；用 stream-json 的，看开头 init 事件的 plugins。
   - 怎么撤：启动时不加 --plugin-dir；用环境变量挂的，删掉那一项。

要求：
- 只复制这一个文件夹，不改里面的任何字。不要改我的 settings.json、alias、启动脚本或套壳；需要改的，告诉我怎么改，我自己决定。
- 不要给这个 mod 加任何别的功能（跑命令、读写文件、联网都不要）。
- 不要自己启动 Claude Code（包括 claude -p）去试，validate 通过就够了。
- 以后我让你改名单或者切到 'block' 时：名单里跟权限、安全有关的类型（plan_mode、plan_mode_reentry、plan_mode_exit、auto_mode、auto_mode_exit）不要拿掉，我坚持要拿掉的话，先提醒我：拿掉以后你就不知道自己在什么模式里了。切之前先问我只看那几天见过哪些灰字，名字或内容跟模式、权限、安全有关的，先加进名单。切完提醒我：已经发出去的邮箱还在原来的对话里，要 /clear 或者开新对话。
- 你没法建文件或跑命令的话，就停下，把手动步骤告诉我，我自己来。
- 在 Windows 上，命令里的 ~ 换成完整路径（比如 C:\Users\我的用户名\my-mods\reminder-allowlist）；拿不准就问我。
- 装完以后，要用 claude --plugin-dir ~/my-mods/reminder-allowlist 重新启动 Claude Code 才会挂上；现在这个对话不会变。
```
