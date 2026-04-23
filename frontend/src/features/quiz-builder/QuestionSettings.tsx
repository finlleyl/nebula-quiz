import type { QuestionType } from "@/features/quizzes/types";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";

interface Props {
  timeLimit: number;
  questionType: QuestionType;
  points: number;
  onTimeLimit: (v: number) => void;
  onQuestionType: (v: QuestionType) => void;
  onPoints: (v: number) => void;
}

export function QuestionSettings({
  timeLimit,
  questionType,
  points,
  onTimeLimit,
  onQuestionType,
  onPoints,
}: Props) {
  const presets = [10, 20, 30, 60] as const;
  return (
    <div className="card space-y-5 p-6">
      <div>
        <p className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-text-secondary">
          Время на ответ
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {presets.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTimeLimit(t)}
              className={`rounded-sm p-[10px_6px] text-center font-mono text-sm font-bold ${t === timeLimit ? "bg-accent text-white" : "bg-bg-muted text-text-primary"}`}
            >
              {t}с
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-text-secondary">
          Тип ответа
        </p>
        <SegmentedControl<QuestionType>
          value={questionType}
          onChange={onQuestionType}
          options={[
            { value: "single", label: "Один ответ" },
            { value: "multiple", label: "Несколько" },
          ]}
          className="w-full"
        />
      </div>

      <div>
        <label className="mb-2.5 block text-[13px] font-bold uppercase tracking-[0.06em] text-text-secondary">
          Баллы
        </label>
        <div className="flex items-center gap-2.5">
          <input
            type="number"
            min={1}
            max={10000}
            value={points}
            onChange={(e) => onPoints(Number(e.target.value))}
            className="input w-32 text-center font-mono font-bold"
          />
          <span className="text-xs text-text-secondary">макс.</span>
        </div>
      </div>
    </div>
  );
}
