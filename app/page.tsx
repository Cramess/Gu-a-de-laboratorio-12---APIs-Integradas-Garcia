'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'

type Book = {
  id: string
  title: string
  genre: string | null
}

type Author = {
  id: string
  name: string
  email: string
  bio: string | null
  nationality: string | null
  birthYear: number | null
  books: Book[]
  _count: {
    books: number
  }
}

const emptyForm = {
  name: '',
  email: '',
  bio: '',
  nationality: '',
  birthYear: '',
}

export default function Home() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const stats = useMemo(() => {
    const totalBooks = authors.reduce(
      (total, author) => total + author._count.books,
      0
    )
    const countries = new Set(
      authors.map((author) => author.nationality).filter(Boolean)
    )

    return {
      totalAuthors: authors.length,
      totalBooks,
      countries: countries.size,
    }
  }, [authors])

  async function loadAuthors() {
    setLoading(true)
    const response = await fetch('/api/authors')
    const data = await response.json()
    setAuthors(data)
    setLoading(false)
  }

  useEffect(() => {
    fetch('/api/authors')
      .then((response) => response.json())
      .then((data) => {
        setAuthors(data)
        setLoading(false)
      })
      .catch(() => {
        setMessage('No se pudieron cargar los autores')
        setLoading(false)
      })
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const payload = {
      ...form,
      birthYear: form.birthYear ? Number(form.birthYear) : null,
    }
    const response = await fetch(
      editingId ? `/api/authors/${editingId}` : '/api/authors',
      {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )
    const data = await response.json()

    if (!response.ok) {
      setMessage(data.error || 'No se pudo guardar el autor')
      return
    }

    setForm(emptyForm)
    setEditingId(null)
    setMessage(editingId ? 'Autor actualizado' : 'Autor creado')
    await loadAuthors()
  }

  function startEdit(author: Author) {
    setEditingId(author.id)
    setForm({
      name: author.name,
      email: author.email,
      bio: author.bio || '',
      nationality: author.nationality || '',
      birthYear: author.birthYear?.toString() || '',
    })
  }

  async function deleteAuthor(id: string) {
    const response = await fetch(`/api/authors/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const data = await response.json()
      setMessage(data.error || 'No se pudo eliminar el autor')
      return
    }

    setMessage('Autor eliminado')
    await loadAuthors()
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">Biblioteca</p>
            <h1 className="text-3xl font-semibold">Panel de autores</h1>
          </div>
          <Link
            href="/books"
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white"
          >
            Buscar libros
          </Link>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Autores</p>
            <p className="text-2xl font-semibold">{stats.totalAuthors}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Libros</p>
            <p className="text-2xl font-semibold">{stats.totalBooks}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Nacionalidades</p>
            <p className="text-2xl font-semibold">{stats.countries}</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-2"
        >
          <h2 className="md:col-span-2 text-lg font-semibold">
            {editingId ? 'Editar autor' : 'Crear autor'}
          </h2>
          <input
            className="h-10 rounded-md border border-slate-300 px-3"
            placeholder="Nombre"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <input
            className="h-10 rounded-md border border-slate-300 px-3"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <input
            className="h-10 rounded-md border border-slate-300 px-3"
            placeholder="Nacionalidad"
            value={form.nationality}
            onChange={(event) =>
              setForm({ ...form, nationality: event.target.value })
            }
          />
          <input
            className="h-10 rounded-md border border-slate-300 px-3"
            placeholder="Año de nacimiento"
            type="number"
            value={form.birthYear}
            onChange={(event) =>
              setForm({ ...form, birthYear: event.target.value })
            }
          />
          <textarea
            className="min-h-24 rounded-md border border-slate-300 px-3 py-2 md:col-span-2"
            placeholder="Biografía"
            value={form.bio}
            onChange={(event) => setForm({ ...form, bio: event.target.value })}
          />
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <button className="h-10 rounded-md bg-teal-700 px-4 text-sm font-medium text-white">
              {editingId ? 'Guardar cambios' : 'Crear autor'}
            </button>
            {editingId && (
              <button
                type="button"
                className="h-10 rounded-md border border-slate-300 px-4 text-sm font-medium"
                onClick={() => {
                  setEditingId(null)
                  setForm(emptyForm)
                }}
              >
                Cancelar
              </button>
            )}
            {message && <p className="self-center text-sm text-slate-600">{message}</p>}
          </div>
        </form>

        <section className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-lg font-semibold">Autores registrados</h2>
          </div>
          {loading ? (
            <p className="p-4 text-slate-500">Cargando autores...</p>
          ) : (
            <div className="grid gap-3 p-4">
              {authors.map((author) => (
                <article
                  key={author.id}
                  className="grid gap-3 rounded-md border border-slate-200 p-4 lg:grid-cols-[1fr_auto]"
                >
                  <div>
                    <h3 className="font-semibold">{author.name}</h3>
                    <p className="text-sm text-slate-600">{author.email}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {author.nationality || 'Sin nacionalidad'} ·{' '}
                      {author._count.books} libros
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="h-9 rounded-md border border-slate-300 px-3 text-sm"
                      onClick={() => startEdit(author)}
                    >
                      Editar
                    </button>
                    <button
                      className="h-9 rounded-md border border-red-200 px-3 text-sm text-red-700"
                      onClick={() => deleteAuthor(author.id)}
                    >
                      Eliminar
                    </button>
                    <Link
                      className="inline-flex h-9 items-center rounded-md bg-slate-900 px-3 text-sm text-white"
                      href={`/authors/${author.id}`}
                    >
                      Ver libros
                    </Link>
                  </div>
                </article>
              ))}
              {!authors.length && (
                <p className="text-sm text-slate-500">Todavía no hay autores.</p>
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}
