"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function QuizView({ quiz, onComplete, readOnly }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  if (!quiz?.questions?.length) return null;

  const submit = () => {
    setSubmitted(true);
    if (typeof onComplete === 'function') onComplete({ correct: scoreCorrect(), total: quiz.questions.length });
  };

  const scoreCorrect = () => {
    return quiz.questions.reduce((s, q, i) => s + ((answers[i] ?? -1) === q.correct ? 1 : 0), 0);
  };

  return (
    <div className="space-y-4">
      {quiz.questions.map((q, qi) => (
        <div key={qi} className="p-4 rounded-xl border border-pale-gray bg-white/90">
          <div className="font-semibold mb-2">{q.q}</div>
          <div className="space-y-2">
            {q.answers.map((a, ai) => {
              const selected = answers[qi] === ai;
              const correct = submitted && ai === q.correct;
              const wrong = submitted && selected && ai !== q.correct;
              return (
                <button
                  key={ai}
                  disabled={readOnly || submitted}
                  onClick={() => setAnswers({ ...answers, [qi]: ai })}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition ${selected ? 'border-vivid-blue text-vivid-blue' : 'border-gray-200'} ${correct ? 'bg-green-50 border-green-300' : ''} ${wrong ? 'bg-red-50 border-red-300' : ''}`}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {!readOnly && !submitted && (
        <Button onClick={submit} className="bg-vivid-blue hover:bg-deep-blue text-white rounded-full px-6">Submit Quiz</Button>
      )}
      {submitted && (
        <div className="text-sm text-gray-700">Score: {scoreCorrect()} / {quiz.questions.length}</div>
      )}
    </div>
  );
}
