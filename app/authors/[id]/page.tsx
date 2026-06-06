import AuthorDetailClient from './AuthorDetailClient'

export default async function AuthorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <AuthorDetailClient authorId={id} />
}
