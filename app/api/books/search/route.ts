import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const sortFields = ['title', 'publishedYear', 'createdAt'] as const
const orders = ['asc', 'desc'] as const

type SortField = (typeof sortFields)[number]
type SortOrder = (typeof orders)[number]

function getPositiveInt(value: string | null, fallback: number, max?: number) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback
  }

  return max ? Math.min(parsed, max) : parsed
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim()
    const genre = searchParams.get('genre')?.trim()
    const authorName = searchParams.get('authorName')?.trim()
    const page = getPositiveInt(searchParams.get('page'), 1)
    const limit = getPositiveInt(searchParams.get('limit'), 10, 50)
    const requestedSortBy = searchParams.get('sortBy') as SortField | null
    const requestedOrder = searchParams.get('order') as SortOrder | null
    const sortBy = requestedSortBy && sortFields.includes(requestedSortBy)
      ? requestedSortBy
      : 'createdAt'
    const order = requestedOrder && orders.includes(requestedOrder)
      ? requestedOrder
      : 'desc'

    const where: Prisma.BookWhereInput = {
      title: search
        ? {
            contains: search,
            mode: 'insensitive',
          }
        : undefined,
      genre: genre || undefined,
      author: authorName
        ? {
            name: {
              contains: authorName,
              mode: 'insensitive',
            },
          }
        : undefined,
    }

    const [data, total] = await prisma.$transaction([
      prisma.book.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          [sortBy]: order,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.book.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Error al buscar libros' },
      { status: 500 }
    )
  }
}
