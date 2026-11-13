# 自己动手，把被拦的那一轮带走

为什么要这样做、什么时候别用，在 [README 第 4 节](../README.md#4-被拦以后怎么办)。想交给 Claude 来做，用 [prompt-remove-blocked-turn.md](prompt-remove-blocked-turn.md) 里那段话，它会多做几道检查。这里是自己动手的步骤，和一个改前改后的例子。

这个办法只适合「普通的一条线」的会话。下面任何一步对不上，就别删了，用备份恢复，开个新会话更省心。

> ⚠️ 存盘里是你们的全部聊天记录，`settings.json` 里也可能有你的密钥。求助的时候，别把这些文件整个发给不认识的人，也别贴到网上。

## 步骤

1. **把那个会话彻底关掉。** 关掉所有开着它的终端窗口（终端里输入 `/exit`）；用套壳的，停掉套壳的后台，包括定时消息、主动消息；改完之前，别从手机或者别的地方给它发消息。开着改没用，还会把存盘写乱。
2. **找到存盘文件。** 在 `~/.claude/projects/` 下面；设过 `CLAUDE_CONFIG_DIR` 的话，在那个目录下的 `projects/` 里。每个子文件夹对应一个启动 Claude Code 的文件夹，名字是把路径里的 `/` 等符号换成 `-`：比如在 `/home/me/chat` 里启动的会话，存在 `~/.claude/projects/-home-me-chat/` 里。一个会话一个文件，文件名是 `<会话 ID>.jsonl`；只看这一层，再往下的子文件夹（比如 `subagents/`）里的不算。用 stream-json 的套壳，第一条 `system` 事件（`subtype` 为 `init`）里有 `session_id`。实在对不上，就找最近改过、里面有 `"stop_reason":"refusal"` 的文件，打开看一眼里面你最后说的话，确认是它。
3. **备份。** 复制一份，备份的文件名**不要以 `.jsonl` 结尾**，不然 Claude Code 可能把它当成另一个会话。比如在终端里先进到那个文件夹，再输入 `cp <会话 ID>.jsonl <会话 ID>.jsonl.bak-1113`。用访达或资源管理器复制的话，记得把复制出来的文件改成这样的名字。已经有的备份别覆盖。
4. **先看看能不能删。** 用能按行号操作的编辑器打开（比如 VS Code），**关掉自动换行**，免得一条记录看成好几行、删掉半行就坏了。搜一下 `compact`：搜到 `compact_boundary` 或 `isCompactSummary`，说明这个会话压缩过，别删了。
5. **找到被拦的那条回复。** 搜 `"stop_reason":"refusal"`。真正被拦的那一行，`"type"` 是 `"assistant"`，`"stop_reason":"refusal"` 是这一行自己的字段。你们聊天的文字里要是出现过这串字，存盘里它前面会带反斜杠（`\"`），那种不算。
6. **往上找你自己那句话。** 那一行是 `"type":"user"`，`"role":"user"`，内容是你打的字，不带 `"isMeta":true`，也不是 `tool_result`。记下这一行的 `parentUuid`。如果它是 `null`，说明被拦的就是这个会话的第一条消息：别删了，直接开新会话。
7. **定范围，删之前先核一遍。** 要删的是：从你那句话那一行开始，到你下一句话那一行之前；后面没有你说的话了，就到文件末尾。`"type":"queue-operation"` 的行留着，别删。把要删的这几行里出现的每一个 `"uuid"` 记下来，在文件里逐个搜一下：除了要删的这几行自己，只允许你下一句话那一行的 `parentUuid` 指着它。别的地方也出现的话，说明这个会话不是一条线，别删了。
8. **删，然后接链。** 按行号整行删掉。后面还有内容的话，把你下一句话那一行的 `parentUuid` 的值，换成第 6 步记下的值。只换引号里的那串字，别的不动。
9. **续聊之前先检查，这一步不能省。** 下面三项都核完，才能续聊：
   - 每一行都还是合法的 JSON；
   - 跟备份逐行比，差别只有你删掉的那几行，加上最多一处改过的 `parentUuid`；
   - 顺着 `parentUuid` 从最后一条往回走，改后的链正好等于改前的链去掉你删掉的那一段。

   后两项手动很难核：开一个新会话，把备份和改好的文件都告诉 Claude，请它照[那段话](prompt-remove-blocked-turn.md)的第 8 步核一遍。下面两个搜索可以先自己快速看一眼，但代替不了上面三项：搜第 8 步换上的那个值，文件里要有一行的 `"uuid"` 正好是它；逐个搜第 7 步记下的那几个 uuid，文件里一处都不该再出现。

   哪一项不对，就把备份复制回原来的文件名：`cp <会话 ID>.jsonl.bak-1113 <会话 ID>.jsonl`。
10. **续聊。** 回到原来启动的那个文件夹，输入 `claude --resume` 选回这个会话，先问一句前面聊过的事，看它还记不记得。不对劲，就先关掉会话，再用备份恢复。恢复会把改完以后新聊的内容一起丢掉。

## 例子

下面是一份存盘的示意。只留了关键的字段，uuid 也缩短了，真实的每一行都要长得多。这是没关自动重试时被拦的样子：被拦的是中间那一轮，后面你又说了一句话。

```
第 28 行  "type":"assistant"  "uuid":"aaaa"  "parentUuid":"9999"                          ← 上一轮的回复
第 29 行  "type":"queue-operation"                                                       ← 留着
第 30 行  "type":"queue-operation"                                                       ← 留着
第 31 行  "type":"user"       "uuid":"bbbb"  "parentUuid":"aaaa"   你说的话                ← 从这里开始删
第 32 行  （这一轮的其他记录，没有 uuid，不在链上）
第 33 行  "type":"assistant"  "uuid":"cccc"  "parentUuid":"bbbb"   "stop_reason":"refusal" ← 被拦的回复
第 34 行  "type":"system"     "uuid":"dddd"  "parentUuid":"cccc"   …continuing once with that noted
第 35 行  "type":"user"       "uuid":"eeee"  "parentUuid":"dddd"   "isMeta":true  Your response above was stopped…  ← 塞进来的那句英文
第 36 行  （这一轮的其他记录，没有 uuid，不在链上）
第 37 行  "type":"assistant"  "uuid":"ffff"  "parentUuid":"eeee"                          ← 重试出来的回复
第 38–40 行  （这一轮的其他记录，没有 uuid，不在链上）                                     ← 删到这里为止
第 41 行  "type":"queue-operation"                                                       ← 留着
第 42 行  "type":"queue-operation"                                                       ← 留着
第 43 行  "type":"user"       "uuid":"gggg"  "parentUuid":"ffff"   你的下一句话            ← 留着，但要接链
```

改法：

- 删掉第 31–40 行。删之前核一遍：`bbbb`、`cccc`、`dddd`、`eeee`、`ffff` 这几个，除了第 31–40 行自己，只在第 43 行的 `parentUuid` 里出现。
- 第 43 行的 `"parentUuid":"ffff"` 改成 `"parentUuid":"aaaa"`，也就是第 31 行原来的 `parentUuid`。`ffff` 那一行已经删了，不改的话，续聊时从第 43 行往前就找不到上一条，前面的历史会整段读不到。
- 改完先快速看一眼：文件里有 `"uuid":"aaaa"` 这一行（第 28 行）；`bbbb` 到 `ffff` 一个都搜不到了。然后按第 9 步把三项核完，再续聊。

被拦的是最后一轮的话，从第 31 行删到文件末尾就行（中间要是有 `queue-operation` 的行，留着），不用接链。

关了自动重试以后再被拦，这一轮会短很多：你那句话、一条 `system`（`subtype` 为 `model_refusal_no_fallback`）、一条报错（带 `"stop_reason":"refusal"`）。删法一样。

## 注意

- 存盘的格式是 Claude Code 内部用的，官方没有承诺不变。我们测的是 2.1.321 的存盘。
- 被拦以后，这个会话要是压缩过（自动压缩也算），被拦的内容可能已经写进了压缩出来的摘要里，删掉存盘里原来那几行不一定管用。这种情况我们没测，开个新会话更省心。
- 被拦那一轮里已经执行完的操作，比如写过的文件、记下的东西、发出去的消息，不会因为删了记录就撤回。删完以后，模型也不记得自己做过。
- `queue-operation` 那几行里可能还留着你那句话的原文，备份里也有。它们不会发给模型；这个办法改的是之后的对话里模型看到的历史，不是把文件里每一处原文都擦掉。
