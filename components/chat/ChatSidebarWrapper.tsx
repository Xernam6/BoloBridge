'use client';

import dynamic from 'next/dynamic';

const ChatSidebar = dynamic(() => import('./ChatSidebar'), {
  ssr: false,
});

export default function ChatSidebarWrapper() {
  return <ChatSidebar />;
}
