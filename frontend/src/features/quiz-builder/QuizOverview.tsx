import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

import type { QuestionDTO } from "@/features/quizzes/types";

import { SortableQuestionRow } from "./SortableQuestionRow";

interface Props {
  questions: QuestionDTO[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onReorder: (order: string[]) => void;
  onAdd: () => void;
  canAdd: boolean;
}

export function QuizOverview({
  questions,
  activeId,
  onSelect,
  onReorder,
  onAdd,
  canAdd,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = questions.findIndex((q) => q.id === active.id);
    const newIdx = questions.findIndex((q) => q.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(questions, oldIdx, newIdx);
    onReorder(next.map((q) => q.id));
  };

  return (
    <div className="flex h-full flex-col gap-4 rounded-3xl border border-border-subtle bg-bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-text-primary">
          Quiz Overview
        </h3>
        <span className="rounded-pill bg-bg-elevated px-3 py-1 text-xs text-text-secondary">
          {questions.length} Qs
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={questions.map((q) => q.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
            {questions.map((q, i) => (
              <SortableQuestionRow
                key={q.id}
                question={q}
                index={i}
                active={q.id === activeId}
                onSelect={() => onSelect(q.id)}
              />
            ))}
            {questions.length === 0 ? (
              <p className="py-4 text-center text-sm text-text-muted">
                No questions yet
              </p>
            ) : null}
          </div>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={onAdd}
        disabled={!canAdd}
        className="flex items-center justify-center gap-2 rounded-pill border-2 border-dashed border-border px-4 py-3 text-text-secondary transition-colors hover:border-primary-500 hover:text-primary-400 disabled:cursor-wait disabled:opacity-60"
      >
        <Plus className="size-4" />
        {canAdd ? "Add Question" : "Adding…"}
      </button>
    </div>
  );
}
