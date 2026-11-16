# 交给你的 Claude：帮我装上 companion-basics

用法：先把这个仓库下载到你电脑上（GitHub 页面上 Code → Download ZIP，解压），记住解压到了哪个文件夹。然后把下面这段话发给你的 Claude，把两处尖括号换成你自己的。文件夹的路径不会写的话：Mac 上把那个文件夹拖进终端窗口，就会出现它的完整路径；或者写个大概（比如「下载文件夹里的 claude-code-companion-notes-main」），让 Claude 自己去找。

在终端里，它建文件、跑命令之前可能会弹出权限确认（看你的权限设置），这是正常的。有的套壳里 Claude 没有建文件的权限，那就照[正文](../../notes/02-mod.md#先说结论)自己动手。

```text
请帮我装一个 Claude Code 的 mod，叫 companion-basics。它只做一件事：把 Claude Code 写给你的说明里的 "the user" 换成我的名字。（示例里还有一段换系统提示词的代码，那几个常量空着时什么都不做，这次不用管。）

仓库我已经下载到：<仓库解压后的文件夹>
我的名字：<你希望 Claude 怎么称呼你>

步骤：
1. 把仓库里的 examples/mod/companion-basics 整个文件夹复制到 ~/my-mods/companion-basics（~/my-mods 不存在就新建）。如果 ~/my-mods/companion-basics 已经存在，先停下来问我。
2. 只改 ~/my-mods/companion-basics/hooks/register.js 里的一行：把 MY_NAME = '你的名字' 里的「你的名字」换成我的名字。名字照我上面写的原样填，不要改成昵称；名字里有英文单引号、反斜杠 \ 或者换行的话，先停下来问我。别的一个字都不改，SECTION_NAME、SECTION_ORIGINAL、SECTION_MINE 保持空着。
3. 把改完的 register.js 全文给我看，用人话讲讲每一段在做什么，等我说可以再往下走。
4. 跑 claude plugin validate ~/my-mods/companion-basics，把输出原样给我看。最后一行是 ✔ Validation passed 就算通过，后面跟着 with warnings 也算；警告不用处理，也别为了消掉警告去加文件。最后一行是 ✘ Validation failed，或者命令跑不起来，就停下，别自己改代码。
5. 告诉我以后怎么启动：claude --plugin-dir ~/my-mods/companion-basics。以后每次启动都要带这个参数。

要求：
- 只复制这一个文件夹、只改上面那一行。不要改我的 settings.json、alias、启动脚本或套壳；需要改的，告诉我怎么改，我自己决定。
- 不要给这个 mod 加任何别的功能（跑命令、读写文件、联网都不要）。
- 不要动系统提示词里跟安全、拒绝、权限有关的任何内容。
- 你没法建文件或跑命令的话，就停下，把手动步骤告诉我，我自己来。
- 在 Windows 上，命令里的 ~ 换成完整路径（比如 C:\Users\我的用户名\my-mods\companion-basics）；拿不准就问我。
- 装完以后，要用 claude --plugin-dir ~/my-mods/companion-basics 重新启动 Claude Code，之后新开的对话才用新称呼；现在这个对话不会变。
```
