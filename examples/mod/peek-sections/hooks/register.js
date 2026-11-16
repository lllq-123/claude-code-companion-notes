// peek-sections：只读的「偷看」mod。把系统提示词每一节的名字和原文写进调试日志，什么都不改。
//
// 用法（会发一次真的请求，花一点点用量）：新建一个空文件夹，在里面跑
//   claude -p --plugin-dir <这个文件夹> --debug-file ./peek.log "hi"
// 跑完文件夹里会多出 peek.log 和一个叫 latest 的快捷方式（指向 peek.log）。
// 打开 peek.log 搜 PEEK：第一行 PEEK-HEAD 是模型名和一共几节，后面每一节一行。
// "text": 后面那段带双引号的值，可以原样换掉 companion-basics 里 SECTION_ORIGINAL 后面的 ''（它本身就是合法的 JavaScript 字符串）。
//
// peek.log 里有整份系统提示词和你电脑上的路径：取完原文就把 peek.log 和 latest 一起删掉，别发到网上。
// 偷看的时候只挂这一个 mod，别跟 companion-basics 一起挂：一起挂，看到的可能是已经换过称呼的文字。
// 节的清单和原文跟模型、跑法有关：打算用什么模型、怎么跑，就照那样偷看。看完就别再挂了。

export function register(on) {
  on('prompt.compose', async ($, e, next) => {
    const r = await next(e)
    const sections = r && Array.isArray(r.sections) ? r.sections : []
    $.ui.log('PEEK-HEAD ' + JSON.stringify({ model: e.model, traits: e.traits, sections: sections.length }), { to: 'debug' })
    for (const s of sections) {
      const chars = typeof s.text === 'string' ? s.text.length : null
      $.ui.log('PEEK ' + JSON.stringify({ id: s.id, scope: s.scope, chars, text: s.text }), { to: 'debug' })
    }
    return r
  })
}
