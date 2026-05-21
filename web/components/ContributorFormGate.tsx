"use client";

import { useEffect, useState } from "react";

const PROFILE_DONE_KEY = "cce_contributor_profile_done_v1";

type SubmissionOption = {
  title: string;
  description: string;
  href: string;
  accent: "forest" | "sun";
};

type Props = {
  profileFormUrl: string;
  submissions: SubmissionOption[];
};

const accentClasses = {
  forest: {
    border: "border-forest/30",
    title: "text-forest",
    button: "bg-forest hover:bg-forest/90",
  },
  sun: {
    border: "border-sun/40",
    title: "text-sunDeep",
    button: "bg-sun hover:bg-sunDeep",
  },
};

export default function ContributorFormGate({ profileFormUrl, submissions }: Props) {
  const [profileDone, setProfileDone] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProfileDone(localStorage.getItem(PROFILE_DONE_KEY) === "1");
    setLoaded(true);
  }, []);

  function markProfileDone() {
    localStorage.setItem(PROFILE_DONE_KEY, "1");
    setProfileDone(true);
  }

  function resetProfileDone() {
    localStorage.removeItem(PROFILE_DONE_KEY);
    setProfileDone(false);
  }

  const canSubmit = !profileFormUrl || profileDone;

  return (
    <>
      <section className="bg-white rounded-2xl shadow-warm border border-earth/10 p-5 sm:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink mb-1">提交前確認</h2>
            <p className="text-sm text-ink/75">
              回饋與試教記錄會用 Google 表單收集已驗證 Email。第一次提交時先填一次基本資料，之後同一個 Email 的回饋可由後台自動對照。
            </p>
            {loaded && profileFormUrl && profileDone && (
              <button type="button" onClick={resetProfileDone} className="mt-2 text-xs text-mute underline hover:text-earth">
                這台裝置換人使用
              </button>
            )}
          </div>
          {profileFormUrl ? (
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <a
                href={profileFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center rounded-xl border border-earth/30 px-4 py-2.5 text-sm font-semibold text-earth hover:bg-sand/60 transition"
              >
                第一次提交：填基本資料
              </a>
              <button
                type="button"
                onClick={markProfileDone}
                className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink/90 transition"
              >
                我已填過基本資料
              </button>
            </div>
          ) : (
            <p className="text-xs text-mute shrink-0">基本資料表尚未設定，暫時直接填回饋表單。</p>
          )}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-5 mb-8">
        {submissions.map((item) => {
          const tone = accentClasses[item.accent];
          return (
            <div key={item.title} className={`bg-white rounded-2xl shadow-warm border-2 ${tone.border} p-6 flex flex-col`}>
              <h2 className={`text-xl font-bold ${tone.title} mb-3`}>{item.title}</h2>
              <p className="text-sm text-ink/80 mb-4 flex-1">{item.description}</p>
              {item.href ? (
                canSubmit ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block text-center ${tone.button} text-white font-bold py-3 px-5 rounded-xl transition shadow-warm`}
                  >
                    開始填寫
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="block w-full text-center bg-mute/30 text-mute py-3 px-5 rounded-xl cursor-not-allowed"
                  >
                    先完成基本資料確認
                  </button>
                )
              ) : (
                <span className="block text-center bg-mute/30 text-mute py-3 px-5 rounded-xl">表單尚未設定</span>
              )}
            </div>
          );
        })}
      </section>
    </>
  );
}