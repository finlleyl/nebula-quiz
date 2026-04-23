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
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <h3 className="text-sm font-bold">Вопросы</h3>
        <span className="chip">{questions.length}</span>
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
          <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-2">
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
              <p className="py-4 text-center text-sm text-text-secondary">
                Вопросов пока нет
              </p>
            ) : null}
          </div>
        </SortableContext>
      </DndContext>

      <div className="p-3">
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          className="flex w-full items-center justify-center gap-2 rounded-sm border-[1.5px] border-dashed border-border-strong bg-transparent p-2.5 text-sm font-semibold text-text-secondary disabled:cursor-wait disabled:opacity-60"
        >
          <Plus className="size-4" />
          {canAdd ? "Добавить вопрос" : "Добавляем…"}
        </button>
      </div>
    </div>
  );
}
