export type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

const STORAGE_KEY = "todo-app:todos";

const EMPTY_TODOS: Todo[] = [];

let todos: Todo[] = EMPTY_TODOS;
let hydrated = false;
const listeners = new Set<() => void>();

function readFromStorage(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Todo[]) : [];
  } catch {
    return [];
  }
}

function persistAndNotify(next: Todo[]) {
  todos = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// クライアントでのみ呼ばれる。初回アクセス時に localStorage から読み込む。
export function getSnapshot(): Todo[] {
  if (!hydrated) {
    todos = readFromStorage();
    hydrated = true;
  }
  return todos;
}

// サーバーレンダリング時とハイドレーション中に使われる既定値。
// 毎回同じ参照を返す必要があるため、新しい配列を作らずキャッシュ済みの定数を返す。
export function getServerSnapshot(): Todo[] {
  return EMPTY_TODOS;
}

export function addTodo(text: string) {
  persistAndNotify([{ id: crypto.randomUUID(), text, completed: false }, ...todos]);
}

export function toggleTodo(id: string) {
  persistAndNotify(
    todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
  );
}

export function removeTodo(id: string) {
  persistAndNotify(todos.filter((todo) => todo.id !== id));
}

export function insertTodoAt(todo: Todo, index: number) {
  const next = [...todos];
  next.splice(index, 0, todo);
  persistAndNotify(next);
}
