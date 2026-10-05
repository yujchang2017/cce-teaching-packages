'use client';
import type {ReactNode} from 'react';

/** 「這是什麼？」小說明：不改名詞，只在旁邊補一兩句白話。 */
export const HELP={
  cells:{term:'熱格／涼格',text:'地上每一格是一小段路。橘色是很熱的「熱格」，綠色是有樹蔭、比較涼的「涼格」。'},
  energy:{term:'體力',text:'每個人出門時有 10 點體力。走進熱格扣 1 點，走進涼格加 1 點，最多 10 點；扣到 0 就走不動了。'},
  threshold:{term:'32°C 分界',text:'在這個遊戲裡，32°C 以上算熱格，低於 32°C 算涼格。這是遊戲規則，不是醫學標準。'},
  cooling:{term:'降溫範圍',text:'一棵樹會讓附近兩格內的路降溫 6°C（35°C 變 29°C）。兩棵樹的範圍重疊，不會更涼。'},
  sites:{term:'植樹點 A–F',text:'地圖上白色方塊 A 到 F 是可以種樹的地方。道路和原本的老樹位置不能種。'},
  prediction:{term:'預測',text:'按開始之前，先猜猜結果會怎樣。猜錯沒關係，拿猜的和真的結果比一比，才是重點。'},
} as const;

export function Explain({item}:{item:keyof typeof HELP}){
  const h=HELP[item];
  return <details className="gg-what"><summary><span aria-hidden="true">？</span>{h.term}是什麼？</summary><p>{h.text}</p></details>;
}

/** 第一次進來的操作示範：點白色植樹點 → 按「種在這裡」。不攔截點擊，第一次互動後由父層關閉。 */
export function PlantDemo({intro}:{intro:boolean}):ReactNode{
  return <div className="gg-demo" role="note" aria-label="操作示範">
    <div className="gg-demo-card">
      <b>{intro?'怎麼玩？看一次就會':'這樣種樹'}</b>
      <div className="gg-demo-stage" aria-hidden="true">
        <span className="gg-demo-road r1"/><span className="gg-demo-road r2"/>
        <span className="gg-demo-spot">A<i className="gg-demo-tree"/></span>
        <span className="gg-demo-btn">種在這裡</span>
        <span className="gg-demo-ripple p1"/><span className="gg-demo-ripple p2"/>
        <svg className="gg-demo-finger" viewBox="0 0 24 30" width="34" height="42"><path d="M9 2.5a2.2 2.2 0 0 1 4.4 0V13l1-.2a2.1 2.1 0 0 1 2.5 1.6l.2-.1a2.1 2.1 0 0 1 2.7 1.5 2.1 2.1 0 0 1 2.7 1.8l.2 4.4c.2 3.6-2.5 6.6-6.1 6.6h-3.3c-2 0-3.8-1-4.9-2.6L3 19.5a2.2 2.2 0 0 1 3.4-2.7L9 19.3z" fill="#fff" stroke="#3b2a1f" strokeWidth="1.6" strokeLinejoin="round"/></svg>
      </div>
      <ol><li><span>1</span>點白色的 A–F 植樹點</li><li><span>2</span>按下方「種在這裡」</li></ol>
      {intro&&<p>先按下方按鈕，看看不種樹時會怎樣；再換你種樹。</p>}
      <small>點畫面任何地方就開始</small>
    </div>
  </div>;
}
