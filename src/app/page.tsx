"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type SubmitEvent } from "react";
import {
  addTodo,
  getServerSnapshot,
  getSnapshot,
  insertTodoAt,
  removeTodo,
  subscribe,
  toggleTodo,
  type Todo,
} from "./todo-store";

const UNDO_DURATION = 5000;

export default function Home() {
  const todos = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [input, setInput] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{
    todo: Todo;
    index: number;
  } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  function handleAdd(e: SubmitEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    addTodo(text);
    setInput("");
  }

  function handleDelete(id: string) {
    const index = todos.findIndex((todo) => todo.id === id);
    if (index === -1) return;
    const todo = todos[index];
    removeTodo(id);
    setPendingDelete({ todo, index });

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setPendingDelete(null);
    }, UNDO_DURATION);
  }

  function handleUndo() {
    if (!pendingDelete) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    insertTodoAt(pendingDelete.todo, pendingDelete.index);
    setPendingDelete(null);
  }

  const remaining = todos.filter((t) => !t.completed).length;

  return (
    <div className="flex flex-1 flex-col items-center bg-white px-6 py-12 dark:bg-black sm:py-20">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            ToDo リスト
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {todos.length === 0
              ? "タスクを追加して始めましょう"
              : `残り ${remaining} 件 / 全 ${todos.length} 件`}
          </p>
        </header>

        <form onSubmit={handleAdd} className="flex gap-2">
          <label htmlFor="new-todo" className="sr-only">
            新しいタスク
          </label>
          <input
            id="new-todo"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="タスクを入力..."
            className="h-11 flex-1 rounded-lg border border-black/[.12] bg-white px-4 text-base text-zinc-950 outline-none transition-colors focus:border-zinc-950 dark:border-white/[.18] dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-50"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="h-11 shrink-0 rounded-lg bg-foreground px-5 text-sm font-medium text-background transition-colors enabled:hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-40 dark:enabled:hover:bg-[#ccc]"
          >
            追加
          </button>
        </form>

        {todos.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-black/[.12] py-12 text-center dark:border-white/[.18]">
            <p className="text-base text-zinc-500 dark:text-zinc-400">
              タスクはまだありません
            </p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              上の入力欄から追加してみましょう
            </p>
          </div>
        )}

        {todos.length > 0 && (
          <ul className="flex flex-col gap-2">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-3 rounded-lg border border-black/[.08] bg-white px-4 py-3 dark:border-white/[.1] dark:bg-zinc-900"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  aria-label={`${todo.text} を完了にする`}
                  className="h-5 w-5 shrink-0 cursor-pointer accent-zinc-950 dark:accent-zinc-50"
                />
                <span
                  className={`flex-1 break-words text-base ${
                    todo.completed
                      ? "text-zinc-400 line-through dark:text-zinc-600"
                      : "text-zinc-950 dark:text-zinc-50"
                  }`}
                >
                  {todo.text}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(todo.id)}
                  aria-label={`${todo.text} を削除する`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pendingDelete && (
        <div className="fixed inset-x-0 bottom-6 flex justify-center px-6">
          <div className="flex items-center gap-4 rounded-full bg-zinc-950 px-5 py-3 text-sm text-zinc-50 shadow-lg dark:bg-zinc-100 dark:text-zinc-950">
            <span>「{pendingDelete.todo.text}」を削除しました</span>
            <button
              type="button"
              onClick={handleUndo}
              className="font-semibold underline underline-offset-2 hover:no-underline"
            >
              元に戻す
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
