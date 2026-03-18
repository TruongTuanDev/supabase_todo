import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient';

const emptyForm = {
  title: '',
};

function TodoManager() {
  const [todos, setTodos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const totalTodos = todos.length;
  const completedTodos = useMemo(
    () => todos.filter((todo) => todo.is_complete).length,
    [todos]
  );
  const pendingTodos = totalTodos - completedTodos;

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    setLoading(true);
    setErrorMessage('');

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('inserted_at', { ascending: false });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setTodos(data ?? []);
    }

    setLoading(false);
  }

  async function addTodo(event) {
    event.preventDefault();

    const title = form.title.trim();
    if (!title) {
      setErrorMessage('Please enter a task title.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setStatusMessage('');

    const { data, error } = await supabase
      .from('todos')
      .insert([{ title, is_complete: false }])
      .select()
      .single();

    if (error) {
      setErrorMessage(error.message);
    } else {
      setTodos((current) => [data, ...current]);
      setForm(emptyForm);
      setStatusMessage('New task added successfully.');
    }

    setSubmitting(false);
  }

  async function toggleComplete(todo) {
    setBusyId(todo.id);
    setErrorMessage('');
    setStatusMessage('');

    const { data, error } = await supabase
      .from('todos')
      .update({ is_complete: !todo.is_complete })
      .eq('id', todo.id)
      .select()
      .single();

    if (error) {
      setErrorMessage(error.message);
    } else {
      setTodos((current) =>
        current.map((item) => (item.id === todo.id ? data : item))
      );
      setStatusMessage(
        data.is_complete
          ? 'Task marked as completed.'
          : 'Task moved back to active.'
      );
    }

    setBusyId(null);
  }

  function startEditing(todo) {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
    setErrorMessage('');
    setStatusMessage('');
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingTitle('');
  }

  async function saveEdit(todoId) {
    const title = editingTitle.trim();
    if (!title) {
      setErrorMessage('Task title cannot be empty.');
      return;
    }

    setBusyId(todoId);
    setErrorMessage('');
    setStatusMessage('');

    const { data, error } = await supabase
      .from('todos')
      .update({ title })
      .eq('id', todoId)
      .select()
      .single();

    if (error) {
      setErrorMessage(error.message);
    } else {
      setTodos((current) =>
        current.map((item) => (item.id === todoId ? data : item))
      );
      cancelEditing();
      setStatusMessage('Task updated successfully.');
    }

    setBusyId(null);
  }

  async function deleteTodo(todoId) {
    setBusyId(todoId);
    setErrorMessage('');
    setStatusMessage('');

    const { error } = await supabase.from('todos').delete().eq('id', todoId);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setTodos((current) => current.filter((item) => item.id !== todoId));
      if (editingId === todoId) {
        cancelEditing();
      }
      setStatusMessage('Task deleted successfully.');
    }

    setBusyId(null);
  }

  return (
    <main className="dashboard">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">Supabase Admin</span>
          <h1>Todo dashboard</h1>
        </div>

        <div className="stats-grid">
          <article className="stat-card">
            <span className="stat-label">Total tasks</span>
            <strong>{totalTodos}</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">In progress</span>
            <strong>{pendingTodos}</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">Completed</span>
            <strong>{completedTodos}</strong>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Add a new task</h2>
            <p>Create a new item for your shared task list.</p>
          </div>
        </div>

        <form className="todo-form" onSubmit={addTodo}>
          <input
            type="text"
            value={form.title}
            onChange={(event) =>
              setForm({ title: event.target.value })
            }
            placeholder="Example: Review customer records"
            disabled={submitting}
          />
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? 'Saving...' : 'Add task'}
          </button>
        </form>

        {(errorMessage || statusMessage) && (
          <div className={errorMessage ? 'alert error' : 'alert success'}>
            {errorMessage || statusMessage}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Task list</h2>
            <p>Select any row to update its title or completion status.</p>
          </div>
          <button type="button" className="ghost-button" onClick={fetchTodos}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="empty-state">Loading tasks from Supabase...</div>
        ) : todos.length === 0 ? (
          <div className="empty-state">
            No tasks yet. Add your first one above.
          </div>
        ) : (
          <div className="todo-list">
            {todos.map((todo) => {
              const isEditing = editingId === todo.id;
              const isBusy = busyId === todo.id;

              return (
                <article
                  key={todo.id}
                  className={`todo-card ${todo.is_complete ? 'done' : ''}`}
                >
                  <div className="todo-main">
                    <button
                      type="button"
                      className={`toggle-button ${
                        todo.is_complete ? 'checked' : ''
                      }`}
                      onClick={() => toggleComplete(todo)}
                      disabled={isBusy}
                      aria-label={
                        todo.is_complete
                          ? 'Mark as incomplete'
                          : 'Mark as complete'
                      }
                    >
                      {todo.is_complete ? '✓' : ''}
                    </button>

                    <div className="todo-content">
                      {isEditing ? (
                        <input
                          className="edit-input"
                          value={editingTitle}
                          onChange={(event) => setEditingTitle(event.target.value)}
                          disabled={isBusy}
                        />
                      ) : (
                        <>
                          <h3>{todo.title}</h3>
                          <p>
                            {todo.is_complete
                              ? 'Completed'
                              : 'In progress'}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="todo-actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => saveEdit(todo.id)}
                          disabled={isBusy}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={cancelEditing}
                          disabled={isBusy}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => startEditing(todo)}
                          disabled={isBusy}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => deleteTodo(todo.id)}
                          disabled={isBusy}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default TodoManager;
