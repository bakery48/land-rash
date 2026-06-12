import { useState } from 'react';

const SECTIONS = [
  {
    title: '🎯 ゲームの目的',
    content: (
      <p className="text-sm text-gray-700">
        フェーズ5終了時点で最も多くの<strong>勝利点</strong>を獲得したプレイヤーが勝利。
        同点の場合は<strong>保有領土数</strong>が多い方が勝ち。
      </p>
    ),
  },
  {
    title: '🗺️ ボードサイズ',
    content: (
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-amber-50">
            <th className="border border-amber-200 px-2 py-1 text-left">人数</th>
            <th className="border border-amber-200 px-2 py-1 text-left">グリッド</th>
          </tr>
        </thead>
        <tbody>
          {[['3人', '4×4（16マス）'], ['4〜5人', '5×5（25マス）'], ['6〜8人', '6×6（36マス）']].map(([p, g]) => (
            <tr key={p}>
              <td className="border border-amber-200 px-2 py-1">{p}</td>
              <td className="border border-amber-200 px-2 py-1">{g}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
  },
  {
    title: '💎 リソース',
    content: (
      <table className="w-full text-sm border-collapse">
        <tbody>
          {[
            ['🪵', '木材', '基本領土の獲得'],
            ['🪨', '石材', '高得点領土の獲得'],
            ['🌾', '食料', 'カード効果・目標達成'],
            ['💰', '金貨', 'ワイルド（何にでも使える）'],
          ].map(([icon, name, use]) => (
            <tr key={name}>
              <td className="border border-amber-200 px-2 py-1 text-center">{icon}</td>
              <td className="border border-amber-200 px-2 py-1 font-medium">{name}</td>
              <td className="border border-amber-200 px-2 py-1 text-gray-600">{use}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
  },
  {
    title: '🔄 1ターンの流れ',
    content: (
      <ol className="text-sm text-gray-700 space-y-2 list-none">
        {[
          ['①', 'カードを引く', '山札から1枚引いて手札に加える'],
          ['②', 'リソースを取る', '共通の場から1〜2枚取る（手札上限4枚）'],
          ['③', 'アクションを行う', '下記から1つ選択'],
        ].map(([num, title, desc]) => (
          <li key={num} className="flex gap-2">
            <span className="font-bold text-amber-600 flex-shrink-0">{num}</span>
            <span><strong>{title}</strong>　{desc}</span>
          </li>
        ))}
        <li className="ml-6 mt-1 space-y-1 text-gray-600">
          {[
            '🏴 領土を獲得する — リソースを払ってマスに旗を置く',
            '🃏 手札カードを使う — 効果を発動',
            '🎯 目標カードを達成する — 条件を宣言して得点',
            '⏭️ パス — 何もしない',
          ].map((a) => <p key={a}>{a}</p>)}
        </li>
      </ol>
    ),
  },
  {
    title: '🃏 手札カード',
    content: (
      <table className="w-full text-sm border-collapse">
        <tbody>
          {[
            ['🏴', '領土カード', 'リソース不要で指定マスを即獲得'],
            ['⚔️', '妨害カード', '相手のリソースを1枚捨てさせる'],
            ['⚡', 'ブーストカード', '次のターン、リソースを+1枚余分に取れる'],
            ['🌿', '豊穣カード', '自分のリソースを1枚補充'],
            ['🗡️', '強奪カード', '隣接する相手の領土を1マス奪う'],
          ].map(([icon, name, effect]) => (
            <tr key={name}>
              <td className="border border-amber-200 px-2 py-1 text-center">{icon}</td>
              <td className="border border-amber-200 px-2 py-1 font-medium whitespace-nowrap">{name}</td>
              <td className="border border-amber-200 px-2 py-1 text-gray-600">{effect}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
  },
  {
    title: '🏆 得点',
    content: (
      <table className="w-full text-sm border-collapse">
        <tbody>
          {[
            ['自分の領土 1マス', '1点'],
            ['隣接領土 3連続（縦・横）', '+2点ボーナス'],
            ['隣接領土 4連続以上', '+4点ボーナス'],
            ['目標カード達成（先取り）', '2〜4点'],
            ['フェーズ終了時 最多リソース保有', '+1点（同数は全員）'],
          ].map(([cond, pt]) => (
            <tr key={cond}>
              <td className="border border-amber-200 px-2 py-1 text-gray-700">{cond}</td>
              <td className="border border-amber-200 px-2 py-1 font-bold text-amber-700 whitespace-nowrap">{pt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
  },
  {
    title: '⚡ フェーズイベント',
    content: (
      <table className="w-full text-sm border-collapse">
        <tbody>
          {[
            ['🌿', '豊作', '全員リソース+1枚'],
            ['⚔️', '争奪戦', '次フェーズ1Rのリソース取得が3枚に'],
            ['🌪️', '大嵐', '場のリソースを全てリセット'],
            ['🚢', '交易', '全員が手札を1枚ずつ左隣に渡す'],
            ['🕊️', '平和協定', '次フェーズ中、妨害・強奪カード使用不可'],
          ].map(([icon, name, effect]) => (
            <tr key={name}>
              <td className="border border-amber-200 px-2 py-1 text-center">{icon}</td>
              <td className="border border-amber-200 px-2 py-1 font-medium whitespace-nowrap">{name}</td>
              <td className="border border-amber-200 px-2 py-1 text-gray-600">{effect}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
  },
];

export function RuleBook() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-bold transition-colors border border-amber-300"
        title="ルールブック"
      >
        📖 ルール
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-amber-200">
              <h2 className="text-lg font-bold text-amber-900">📖 ルールブック</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Sidebar */}
              <div className="w-32 flex-shrink-0 border-r border-amber-100 py-2 overflow-y-auto">
                {SECTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSection(i)}
                    className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors leading-snug ${
                      activeSection === i
                        ? 'bg-amber-100 text-amber-900 border-r-2 border-amber-500'
                        : 'text-gray-600 hover:bg-amber-50'
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 p-5 overflow-y-auto">
                <h3 className="font-bold text-amber-900 mb-3 text-base">
                  {SECTIONS[activeSection].title}
                </h3>
                {SECTIONS[activeSection].content}
              </div>
            </div>

            {/* Footer nav */}
            <div className="flex justify-between items-center px-5 py-3 border-t border-amber-100">
              <button
                onClick={() => setActiveSection((i) => Math.max(0, i - 1))}
                disabled={activeSection === 0}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 disabled:opacity-30 hover:bg-amber-100 transition-colors"
              >
                ← 前へ
              </button>
              <span className="text-xs text-gray-400">
                {activeSection + 1} / {SECTIONS.length}
              </span>
              <button
                onClick={() => setActiveSection((i) => Math.min(SECTIONS.length - 1, i + 1))}
                disabled={activeSection === SECTIONS.length - 1}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 disabled:opacity-30 hover:bg-amber-100 transition-colors"
              >
                次へ →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
