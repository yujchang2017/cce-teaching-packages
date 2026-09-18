'use client';
import { useEffect, useState } from 'react';
import { CONSENT_EVENT, consentChoice, setConsent } from '@/lib/track';
import './game-consent.css';

export default function GameConsent() {
  const [choice, setChoice] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const read = () => { setChoice(consentChoice()); setReady(true); };
    read();
    window.addEventListener(CONSENT_EVENT, read);
    window.addEventListener('storage', read);
    return () => { window.removeEventListener(CONSENT_EVENT, read); window.removeEventListener('storage', read); };
  }, []);
  if (!ready) return null;
  function choose(value: boolean) { setConsent(value); setEditing(false); }
  const expanded = choice === null || editing;
  return <aside className="game-consent" aria-label="遊戲使用統計設定">
    <div><strong>遊戲使用統計{choice === null ? '' : choice ? '：已同意' : '：未參與'}</strong>
      {expanded ? <p>同意後會以隨機識別碼記錄遊戲進入、開始、重試、完成與結果摘要，協助改進教材。不傳送姓名或你填寫的文字；不參與也能完整遊玩。</p> : <button type="button" onClick={() => setEditing(true)}>變更設定</button>}
    </div>
    {expanded && <div className="game-consent-actions"><button type="button" onClick={() => choose(false)}>不參與統計</button><button type="button" onClick={() => choose(true)}>同意使用統計</button></div>}
  </aside>;
}
