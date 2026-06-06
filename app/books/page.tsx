'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'

type Author = {
  id: string
  name: string
}

type Book = {
  id: string
  title: string
  description: string | null
  isbn: string | null
  publishedYear: number | null
  genre: string | null
  pages: number | null
  authorId: string
  author: Author
}

type SearchResponse = {
  data: Book[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

const emptyBookForm = {
  title: '',
  description: '',
  isbn: '',
  publishedYear: '',
  genre: '',
  pages: '',
  authorId: '',
}

export default function BooksPage() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [allBooks, setAllBooks] = useState<Book[]>([])
  const [pagination, setPagination] = useState<SearchResponse['pagination']>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [form, setForm] = useState(emptyBookForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const genres = useMemo(
    () => Array.from(new Set(allBooks.map((book) => book.genre).filter(Boolean))),
    [allBooks]
  )

  async function loadBaseData() {
    const [authorsResponse, booksResponse] = await Promise.all([
      fetch('/api/authors'),
      fetch('/api/books'),
    ])
    const authorsData = await authorsResponse.json()
    const booksData = await booksResponse.json()
    const safeAuthors = Array.isArray(authorsData) ? authorsData : []
    const safeBooks = Array.isArray(booksData) ? booksData : []

    if (!authorsResponse.ok || !booksResponse.ok) {
      setMessage(
        authorsData.error ||
          booksData.error ||
          'No se pudieron cargar los datos iniciales'
      )
    }

    setAuthors(safeAuthors)
    setAllBooks(safeBooks)

    if (!form.authorId && safeAuthors[0]) {
      setForm((current) => ({ ...current, authorId: safeAuthors[0].id }))
    }
  }

  useEffect(() => {
    Promise.all([fetch('/api/authors'), fetch('/api/books')])
      .then(async ([authorsResponse, booksResponse]) => {
        const authorsData = await authorsResponse.json()
        const booksData = await booksResponse.json()
        const safeAuthors = Array.isArray(authorsData) ? authorsData : []
        const safeBooks = Array.isArray(booksData) ? booksData : []

        if (!authorsResponse.ok || !booksResponse.ok) {
          setMessage(
            authorsData.error ||
              booksData.error ||
              'No se pudieron cargar los datos iniciales'
          )
        }

        setAuthors(safeAuthors)
        setAllBooks(safeBooks)

        if (safeAuthors[0]) {
          setForm((current) => ({ ...current, authorId: safeAuthors[0].id }))
        }
      })
      .catch(() => setMessage('No se pudieron cargar los datos iniciales'))
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        order,
      })

      if (search.trim()) params.set('search', search.trim())
      if (genre) params.set('genre', genre)
      if (authorName) params.set('authorName', authorName)

      const response = await fetch(`/api/books/search?${params.toString()}`)
      const data: SearchResponse = await response.json()
      if (!response.ok || !Array.isArray(data.data)) {
        setBooks([])
        setMessage('No se pudo cargar la busqueda de libros')
        setLoading(false)
        return
      }

      setBooks(data.data)
      setPagination(data.pagination)
      setLoading(false)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [search, genre, authorName, sortBy, order, page, pagination.limit])

  function resetToFirstPage() {
    setPage(1)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const payload = {
      ...form,
      publishedYear: form.publishedYear ? Number(form.publishedYear) : null,
      pages: form.pages ? Number(form.pages) : null,
    }

    const response = await fetch(
      editingId ? `/api/books/${editingId}` : '/api/books',
      {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )
    const data = await response.json()

    if (!response.ok) {
      setMessage(data.error || 'No se pudo guardar el libro')
      return
    }

    setForm({ ...emptyBookForm, authorId: authors[0]?.id || '' })
    setEditingId(null)
    setMessage(editingId ? 'Libro actualizado' : 'Libro creado')
    await loadBaseData()
    resetToFirstPage()
  }

  function startEdit(book: Book) {
    setEditingId(book.id)
    setForm({
      title: book.title,
      description: book.description || '',
      isbn: book.isbn || '',
      publishedYear: book.publishedYear?.toString() || '',
      genre: book.genre || '',
      pages: book.pages?.toString() || '',
      authorId: book.authorId,
    })
  }

  async function deleteBook(id: string) {
    const response = await fetch(`/api/books/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const data = await response.json()
      setMessage(data.error || 'No se pudo eliminar el libro')
      return
    }

    setMessage('Libro eliminado')
    await loadBaseData()
    resetToFirstPage()
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="text-sm font-medium text-teal-700">
              Volver al panel
            </Link>
            <h1 className="mt-1 text-3xl font-semibold">Búsqueda de libros</h1>
          </div>
          <p className="text-sm text-slate-600">
            {pagination.total} resultados encontrados
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-3"
        >
          <h2 className="text-lg font-semibold md:col-span-3">
            {editingId ? 'Editar libro' : 'Crear libro'}
          </h2>
          <input
            className="h-10 rounded-md border border-slate-300 px-3"
            placeholder="Título"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
          />
          <select
            className="h-10 rounded-md border border-slate-300 px-3"
            value={form.authorId}
            onChange={(event) =>
              setForm({ ...form, authorId: event.target.value })
            }
            required
          >
            <option value="">Selecciona autor</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </select>
          <input
            className="h-10 rounded-md border border-slate-300 px-3"
            placeholder="Género"
            value={form.genre}
            onChange={(event) => setForm({ ...form, genre: event.target.value })}
          />
          <input
            className="h-10 rounded-md border border-slate-300 px-3"
            placeholder="ISBN"
            value={form.isbn}
            onChange={(event) => setForm({ ...form, isbn: event.target.value })}
          />
          <input
            className="h-10 rounded-md border border-slate-300 px-3"
            placeholder="Año"
            type="number"
            value={form.publishedYear}
            onChange={(event) =>
              setForm({ ...form, publishedYear: event.target.value })
            }
          />
          <input
            className="h-10 rounded-md border border-slate-300 px-3"
            placeholder="Páginas"
            type="number"
            value={form.pages}
            onChange={(event) => setForm({ ...form, pages: event.target.value })}
          />
          <textarea
            className="min-h-24 rounded-md border border-slate-300 px-3 py-2 md:col-span-3"
            placeholder="Descripción"
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />
          <div className="flex flex-wrap gap-2 md:col-span-3">
            <button className="h-10 rounded-md bg-teal-700 px-4 text-sm font-medium text-white">
              {editingId ? 'Guardar cambios' : 'Crear libro'}
            </button>
            {editingId && (
              <button
                type="button"
                className="h-10 rounded-md border border-slate-300 px-4 text-sm"
                onClick={() => {
                  setEditingId(null)
                  setForm({ ...emptyBookForm, authorId: authors[0]?.id || '' })
                }}
              >
                Cancelar
              </button>
            )}
            {message && <p className="self-center text-sm text-slate-600">{message}</p>}
          </div>
        </form>

        <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-5">
          <input
            className="h-10 rounded-md border border-slate-300 px-3 md:col-span-2"
            placeholder="Buscar por título"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              resetToFirstPage()
            }}
          />
          <select
            className="h-10 rounded-md border border-slate-300 px-3"
            value={genre}
            onChange={(event) => {
              setGenre(event.target.value)
              resetToFirstPage()
            }}
          >
            <option value="">Todos los géneros</option>
            {genres.map((item) => (
              <option key={item} value={item || ''}>
                {item}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-slate-300 px-3"
            value={authorName}
            onChange={(event) => {
              setAuthorName(event.target.value)
              resetToFirstPage()
            }}
          >
            <option value="">Todos los autores</option>
            {authors.map((author) => (
              <option key={author.id} value={author.name}>
                {author.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <select
              className="h-10 rounded-md border border-slate-300 px-3"
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value)
                resetToFirstPage()
              }}
            >
              <option value="createdAt">Fecha</option>
              <option value="title">Título</option>
              <option value="publishedYear">Año</option>
            </select>
            <select
              className="h-10 rounded-md border border-slate-300 px-3"
              value={order}
              onChange={(event) => {
                setOrder(event.target.value)
                resetToFirstPage()
              }}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-lg font-semibold">Resultados</h2>
            {loading && <p className="text-sm text-slate-500">Buscando...</p>}
          </div>
          <div className="grid gap-3 p-4">
            {books.map((book) => (
              <article
                key={book.id}
                className="grid gap-3 rounded-md border border-slate-200 p-4 lg:grid-cols-[1fr_auto]"
              >
                <div>
                  <h3 className="font-semibold">{book.title}</h3>
                  <p className="text-sm text-slate-600">{book.author.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {book.genre || 'Sin género'} · {book.publishedYear || 'Sin año'} ·{' '}
                    {book.pages || 0} páginas
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="h-9 rounded-md border border-slate-300 px-3 text-sm"
                    onClick={() => startEdit(book)}
                  >
                    Editar
                  </button>
                  <button
                    className="h-9 rounded-md border border-red-200 px-3 text-sm text-red-700"
                    onClick={() => deleteBook(book.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
            {!loading && !books.length && (
              <p className="text-sm text-slate-500">No se encontraron libros.</p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
            <p className="text-sm text-slate-600">
              Página {pagination.page} de {pagination.totalPages || 1}
            </p>
            <div className="flex gap-2">
              <button
                className="h-9 rounded-md border border-slate-300 px-3 text-sm disabled:opacity-50"
                disabled={!pagination.hasPrev}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Anterior
              </button>
              <button
                className="h-9 rounded-md border border-slate-300 px-3 text-sm disabled:opacity-50"
                disabled={!pagination.hasNext}
                onClick={() => setPage((current) => current + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}
