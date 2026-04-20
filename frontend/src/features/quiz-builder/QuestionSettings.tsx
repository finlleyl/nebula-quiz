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
  return (
    <div className="space-y-6 rounded-[24px] border border-border-subtle bg-bg-card p-6">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
          Time Limit
        </p>
        <SegmentedControl<number>
          value={timeLimit}
          onChange={onTimeLimit}
          options={[
            { value: 10, label: "10s" },
            { value: 20, label: "20s" },
            { value: 30, label: "30s" },
            { value: 60, label: "60s" },
          ]}
        />
      </div>
      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
          Answer Type
        </p>
        <SegmentedControl<QuestionType>
          value={questionType}
          onChange={onQuestionType}
          options={[
            { value: "single", label: "Single Choice" },
            { value: "multiple", label: "Multiple Choice" },
          ]}
        />
      </div>
      <div>
        <label className="mb-3 block text-sm font-semibold uppercase tracking-wider text-text-muted">
          Points
        </label>
        <input
          type="number"
          min={1}
          max={10000}
          value={points}
          onChange={(e) => onPoints(Number(e.target.value))}
          className="w-32 rounded-md border border-border bg-bg-input px-4 py-2 text-text-primary focus:border-primary-500 focus:outline-none"
        />
      </div>
    </div>
  );
}
