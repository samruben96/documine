import { redirect } from 'next/navigation';

/**
 * Redirect from old /documents/[id] route to new /chat-docs/[id] route
 *
 * Story F2-1: Route restructure for document library
 * - /documents → Document Library (new)
 * - /chat-docs/[id] → Document viewer + chat (moved from /documents/[id])
 *
 * This redirect maintains backward compatibility for:
 * - Existing bookmarks
 * - Shared links
 * - External references
 */
export default async function DocumentRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/chat-docs/${id}`);
}
