import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const author = await prisma.author.findUnique({
      where: { id },
      include: {
        books: true,
      },
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }

    const booksWithYear = author.books.filter(
      (book) => book.publishedYear !== null
    )
    const firstBook = [...booksWithYear].sort(
      (a, b) => Number(a.publishedYear) - Number(b.publishedYear)
    )[0]
    const latestBook = [...booksWithYear].sort(
      (a, b) => Number(b.publishedYear) - Number(a.publishedYear)
    )[0]
    const booksWithPages = author.books.filter((book) => book.pages !== null)
    const longestBook = [...booksWithPages].sort(
      (a, b) => Number(b.pages) - Number(a.pages)
    )[0]
    const shortestBook = [...booksWithPages].sort(
      (a, b) => Number(a.pages) - Number(b.pages)
    )[0]
    const totalPages = booksWithPages.reduce(
      (sum, book) => sum + Number(book.pages),
      0
    )

    return NextResponse.json({
      authorId: author.id,
      authorName: author.name,
      totalBooks: author.books.length,
      firstBook: firstBook
        ? {
            title: firstBook.title,
            year: firstBook.publishedYear,
          }
        : null,
      latestBook: latestBook
        ? {
            title: latestBook.title,
            year: latestBook.publishedYear,
          }
        : null,
      averagePages: booksWithPages.length
        ? Math.round(totalPages / booksWithPages.length)
        : 0,
      genres: Array.from(
        new Set(author.books.map((book) => book.genre).filter(Boolean))
      ),
      longestBook: longestBook
        ? {
            title: longestBook.title,
            pages: longestBook.pages,
          }
        : null,
      shortestBook: shortestBook
        ? {
            title: shortestBook.title,
            pages: shortestBook.pages,
          }
        : null,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Error al obtener estadisticas del autor' },
      { status: 500 }
    )
  }
}
