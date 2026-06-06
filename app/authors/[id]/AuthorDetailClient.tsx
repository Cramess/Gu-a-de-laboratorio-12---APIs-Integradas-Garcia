'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'

type Book = {
  id: string
  title: string
  description: string | null
  isbn: string | null
  publishedYear: number | null
  genre: string | null
  pages: number | null
}

type Author = {
  id: string
  name: string
  email: string
  bio: string | null
  nationality: string | null
  birthYear: number | null
  books: Book[]
}

type AuthorStats = {
  authorId: string
  authorName: string
  totalBooks: number
  firstBook: { title: string; year: number | null } | null
  latestBook: { title: string; year: number | null } | null
  averagePages: number
  genres: string[]
  longestBook: { title: string; pages: number | null } | null
  shortestBook: { title: string; pages: number | null } | null
}

const emptyBookForm = {
  title: '',
  description: '',
  isbn: '',
  publishedYear: '',
  genre: '',
  pages: '',
}

export default function AuthorDetailClient({ authorId }: { authorId: string }) {
  const [author, setAuthor] = useState<Author | null>(null)
  const [stats, setStats] = useState<AuthorStats | null>(null)
  const [authorForm, setAuthorForm] = useState({
    name: '',
    email: '',
    bio: '',
    nationality: '',
    birthYear: '',
  })
  const [bookForm, setBookForm] = useState(emptyBookForm)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function loadAuthor() {
    setLoading(true)
    const [authorResponse, statsResponse] = await Promise.all([
      fetch(`/api/authors/${authorId}`),
      fetch(`/api/authors/${authorId}/stats`),
    ])
    const authorData = await authorResponse.json()
    const statsData = await statsResponse.json()

    if (!authorResponse.ok || !statsResponse.ok || !authorData.id) {
      setAuthor(null)
      setStats(null)
      setMessage(
        authorData.error ||
          statsData.error ||
          'No se pudo cargar el autor'
      )
      setLoading(false)
      return
    }

    setAuthor(authorData)
    setStats(statsData)
    setAuthorForm({
      name: authorData.name || '',
      email: authorData.email || '',
      bio: authorData.bio || '',
      nationality: authorData.nationality || '',
      birthYear: authorData.birthYear?.toString() || '',
    })
    setLoading(false)
  }

  useEffect(() => {
    Promise.all([
      fetch(`/api/authors/${authorId}`),
      fetch(`/api/authors/${authorId}/stats`),
    ])
      .then(async ([authorResponse, statsResponse]) => {
        const authorData = await authorResponse.json()
        const statsData = await statsResponse.json()

        if (!authorResponse.ok || !statsResponse.ok || !authorData.id) {
          setAuthor(null)
          setStats(null)
          setMessage(
            authorData.error ||
              statsData.error ||
              'No se pudo cargar el autor'
          )
          setLoading(false)
          return
        }

        setAuthor(authorData)
        setStats(statsData)
        setAuthorForm({
          name: authorData.name || '',
          email: authorData.email || '',
          bio: authorData.bio || '',
          nationality: authorData.nationality || '',
          birthYear: authorData.birthYear?.toString() || '',
        })
        setLoading(false)
      })
      .catch(() => {
        setMessage('No se pudo cargar el autor')
        setLoading(false)
      })
  }, [authorId])

  async function updateAuthor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const response = await fetch(`/api/authors/${authorId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...authorForm,
        birthYear: authorForm.birthYear ? Number(authorForm.birthYear) : null,
      }),
    })
    const data = await response.json()

    if (!response.ok) {
      setMessage(data.error || 'No se pudo actualizar el autor')
      return
    }

    setMessage('Autor actualizado')
    await loadAuthor()
  }

  async function createBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const response = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...bookForm,
        authorId,
        publishedYear: bookForm.publishedYear
          ? Number(bookForm.publishedYear)
          : null,
        pages: bookForm.pages ? Number(bookForm.pages) : null,
      }),
    })
    const data = await response.json()

    if (!response.ok) {
      setMessage(data.error || 'No se pudo crear el libro')
      return
    }

    setBookForm(emptyBookForm)
    setMessage('Libro agregado')
    await loadAuthor()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
        <p>Cargando autor...</p>
      </main>
    )
  }

  if (!author || !stats) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
        <p>Autor no encontrado.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="text-sm font-medium text-teal-700">
              Volver al panel
            </Link>
            <h1 className="mt-1 text-3xl font-semibold">{author.name}</h1>
            <p className="text-sm text-slate-600">{author.email}</p>
          </div>
          <Link
            href="/books"
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white"
          >
            Buscar libros
          </Link>
        </header>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Libros</p>
            <p className="text-2xl font-semibold">{stats.totalBooks}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Promedio páginas</p>
            <p className="text-2xl font-semibold">{stats.averagePages}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Primer libro</p>
            <p className="font-semibold">{stats.firstBook?.title || 'Sin datos'}</p>
            <p className="text-sm text-slate-500">{stats.firstBook?.year || ''}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Último libro</p>
            <p className="font-semibold">{stats.latestBook?.title || 'Sin datos'}</p>
            <p className="text-sm text-slate-500">{stats.latestBook?.year || ''}</p>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <form
            onSubmit={updateAuthor}
            className="grid gap-3 rounded-md border border-slate-200 bg-white p-4"
          >
            <h2 className="text-lg font-semibold">Información del autor</h2>
            <input
              className="h-10 rounded-md border border-slate-300 px-3"
              placeholder="Nombre"
              value={authorForm.name}
              onChange={(event) =>
                setAuthorForm({ ...authorForm, name: event.target.value })
              }
              required
            />
            <input
              className="h-10 rounded-md border border-slate-300 px-3"
              placeholder="Email"
              type="email"
              value={authorForm.email}
              onChange={(event) =>
                setAuthorForm({ ...authorForm, email: event.target.value })
              }
              required
            />
            <input
              className="h-10 rounded-md border border-slate-300 px-3"
              placeholder="Nacionalidad"
              value={authorForm.nationality}
              onChange={(event) =>
                setAuthorForm({
                  ...authorForm,
                  nationality: event.target.value,
                })
              }
            />
            <input
              className="h-10 rounded-md border border-slate-300 px-3"
              placeholder="Año de nacimiento"
              type="number"
              value={authorForm.birthYear}
              onChange={(event) =>
                setAuthorForm({ ...authorForm, birthYear: event.target.value })
              }
            />
            <textarea
              className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
              placeholder="Biografía"
              value={authorForm.bio}
              onChange={(event) =>
                setAuthorForm({ ...authorForm, bio: event.target.value })
              }
            />
            <button className="h-10 rounded-md bg-teal-700 px-4 text-sm font-medium text-white">
              Guardar autor
            </button>
          </form>

          <form
            onSubmit={createBook}
            className="grid gap-3 rounded-md border border-slate-200 bg-white p-4"
          >
            <h2 className="text-lg font-semibold">Agregar libro</h2>
            <input
              className="h-10 rounded-md border border-slate-300 px-3"
              placeholder="Título"
              value={bookForm.title}
              onChange={(event) =>
                setBookForm({ ...bookForm, title: event.target.value })
              }
              required
            />
            <input
              className="h-10 rounded-md border border-slate-300 px-3"
              placeholder="Género"
              value={bookForm.genre}
              onChange={(event) =>
                setBookForm({ ...bookForm, genre: event.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className="h-10 rounded-md border border-slate-300 px-3"
                placeholder="Año"
                type="number"
                value={bookForm.publishedYear}
                onChange={(event) =>
                  setBookForm({
                    ...bookForm,
                    publishedYear: event.target.value,
                  })
                }
              />
              <input
                className="h-10 rounded-md border border-slate-300 px-3"
                placeholder="Páginas"
                type="number"
                value={bookForm.pages}
                onChange={(event) =>
                  setBookForm({ ...bookForm, pages: event.target.value })
                }
              />
            </div>
            <input
              className="h-10 rounded-md border border-slate-300 px-3"
              placeholder="ISBN"
              value={bookForm.isbn}
              onChange={(event) =>
                setBookForm({ ...bookForm, isbn: event.target.value })
              }
            />
            <textarea
              className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
              placeholder="Descripción"
              value={bookForm.description}
              onChange={(event) =>
                setBookForm({ ...bookForm, description: event.target.value })
              }
            />
            <button className="h-10 rounded-md bg-slate-950 px-4 text-sm font-medium text-white">
              Agregar libro
            </button>
          </form>
        </section>

        {message && <p className="text-sm text-slate-600">{message}</p>}

        <section className="rounded-md border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Estadísticas</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <p className="text-sm text-slate-600">
              Géneros: {stats.genres.join(', ') || 'Sin géneros'}
            </p>
            <p className="text-sm text-slate-600">
              Más largo: {stats.longestBook?.title || 'Sin datos'}{' '}
              {stats.longestBook ? `(${stats.longestBook.pages} páginas)` : ''}
            </p>
            <p className="text-sm text-slate-600">
              Más corto: {stats.shortestBook?.title || 'Sin datos'}{' '}
              {stats.shortestBook
                ? `(${stats.shortestBook.pages} páginas)`
                : ''}
            </p>
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-lg font-semibold">Libros del autor</h2>
          </div>
          <div className="grid gap-3 p-4">
            {author.books.map((book) => (
              <article
                key={book.id}
                className="rounded-md border border-slate-200 p-4"
              >
                <h3 className="font-semibold">{book.title}</h3>
                <p className="text-sm text-slate-500">
                  {book.genre || 'Sin género'} · {book.publishedYear || 'Sin año'} ·{' '}
                  {book.pages || 0} páginas
                </p>
                {book.description && (
                  <p className="mt-2 text-sm text-slate-600">{book.description}</p>
                )}
              </article>
            ))}
            {!author.books.length && (
              <p className="text-sm text-slate-500">
                Este autor todavía no tiene libros.
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}
