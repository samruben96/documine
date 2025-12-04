'use client';

import { useRef, useCallback, useState, useEffect, createContext, useContext, useSyncExternalStore } from 'react';
import { Panel, PanelGroup, PanelResizeHandle, ImperativePanelHandle } from 'react-resizable-panels';
import { PanelRightClose, PanelRightOpen, PanelBottomClose, PanelBottomOpen, Columns2, Rows2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SplitViewProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  className?: string;
}

// ============================================================================
// AC-6.8.17: Chat Panel Dock Position Context
// ============================================================================

type DockPosition = 'right' | 'bottom';

interface ChatDockContextType {
  position: DockPosition;
  isCollapsed: boolean;
  setPosition: (position: DockPosition) => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

const ChatDockContext = createContext<ChatDockContextType | null>(null);

export function useChatDock() {
  const context = useContext(ChatDockContext);
  if (!context) {
    // Return default values if used outside provider
    return {
      position: 'right' as DockPosition,
      isCollapsed: false,
      setPosition: () => {},
      setCollapsed: () => {},
      toggleCollapsed: () => {},
    };
  }
  return context;
}

const DOCK_STORAGE_KEY = 'documine-chat-dock-position';
const COLLAPSED_STORAGE_KEY = 'documine-chat-collapsed';

// SSR-safe check for client-side
const subscribeToNothing = () => () => {};
const getIsClient = () => true;
const getIsServer = () => false;

/**
 * ChatDockProvider - Provides dock position state and persistence
 * AC-6.8.17: Persist position preference in localStorage
 */
export function ChatDockProvider({ children }: { children: React.ReactNode }) {
  // Use useSyncExternalStore for SSR-safe client detection (no setState in useEffect)
  const isClient = useSyncExternalStore(subscribeToNothing, getIsClient, getIsServer);

  const [position, setPositionState] = useState<DockPosition>(() => {
    // Initial state with SSR-safe localStorage read
    if (typeof window === 'undefined') return 'right';
    const saved = localStorage.getItem(DOCK_STORAGE_KEY) as DockPosition | null;
    return saved === 'right' || saved === 'bottom' ? saved : 'right';
  });

  const [isCollapsed, setCollapsedState] = useState(() => {
    // Initial state with SSR-safe localStorage read
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
  });

  const setPosition = useCallback((newPosition: DockPosition) => {
    setPositionState(newPosition);
    localStorage.setItem(DOCK_STORAGE_KEY, newPosition);
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setCollapsedState(collapsed);
    localStorage.setItem(COLLAPSED_STORAGE_KEY, String(collapsed));
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsedState(prev => {
      const newValue = !prev;
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(newValue));
      return newValue;
    });
  }, []);

  return (
    <ChatDockContext.Provider
      value={{
        position: isClient ? position : 'right',
        isCollapsed: isClient ? isCollapsed : false,
        setPosition,
        setCollapsed,
        toggleCollapsed
      }}
    >
      {children}
    </ChatDockContext.Provider>
  );
}

/**
 * ChatDockControls - Toggle buttons for dock position and collapse
 * AC-6.8.17: Toggle button to minimize/expand and change dock position
 */
export function ChatDockControls() {
  const { position, isCollapsed, setPosition, toggleCollapsed } = useChatDock();

  return (
    <div className="flex items-center gap-1">
      {/* Position toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPosition(position === 'right' ? 'bottom' : 'right')}
          >
            {position === 'right' ? (
              <Rows2 className="h-4 w-4" />
            ) : (
              <Columns2 className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {position === 'right' ? 'Dock to bottom' : 'Dock to right'}
        </TooltipContent>
      </Tooltip>

      {/* Collapse toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={toggleCollapsed}
          >
            {position === 'right' ? (
              isCollapsed ? (
                <PanelRightOpen className="h-4 w-4" />
              ) : (
                <PanelRightClose className="h-4 w-4" />
              )
            ) : (
              isCollapsed ? (
                <PanelBottomOpen className="h-4 w-4" />
              ) : (
                <PanelBottomClose className="h-4 w-4" />
              )
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isCollapsed ? 'Expand chat' : 'Collapse chat'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

// ============================================================================

// Sidebar resize handle (similar to chat panel)
function SidebarResizeHandle({
  className,
  onDoubleClick,
}: {
  className?: string;
  onDoubleClick?: () => void;
}) {
  return (
    <PanelResizeHandle
      className={cn(
        'group relative flex w-1 items-center justify-center max-lg:hidden',
        'bg-slate-200 hover:bg-primary/30 active:bg-primary/50',
        'transition-colors duration-150',
        'cursor-col-resize',
        className
      )}
      onDoubleClick={onDoubleClick}
    >
      {/* Visible grip indicator */}
      <div className="z-10 flex h-8 w-2 items-center justify-center rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="h-6 w-0.5 rounded-full bg-primary" />
      </div>
    </PanelResizeHandle>
  );
}

// Default sidebar sizes (percentages)
const DEFAULT_SIDEBAR_SIZE = 18; // ~260px at 1440px
const MIN_SIDEBAR_SIZE = 12;     // ~170px at 1440px
const MAX_SIDEBAR_SIZE = 28;     // ~400px at 1440px

/**
 * Split View Layout Component
 *
 * Creates a two-panel layout with sidebar and main content.
 * Implements AC-4.3.7: Split view for document viewer + chat panel.
 * User request: Sidebar is horizontally resizable.
 *
 * Layout structure:
 * - Sidebar (resizable, ~240px default on desktop) - Document list
 * - Main content - Document viewer (future: + chat panel)
 */
export function SplitView({ sidebar, main, className }: SplitViewProps) {
  const isMobile = useIsMobile();
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);
  // Use useSyncExternalStore for SSR-safe client detection (no setState in useEffect)
  const isClient = useSyncExternalStore(subscribeToNothing, getIsClient, getIsServer);

  const handleDoubleClick = useCallback(() => {
    if (sidebarPanelRef.current) {
      sidebarPanelRef.current.resize(DEFAULT_SIDEBAR_SIZE);
    }
  }, []);

  // Mobile/Tablet: Standard flex layout (sidebar handled separately)
  if (isMobile || !isClient) {
    return (
      <div className={cn('flex h-full', className)}>
        {sidebar}
        <main className="flex-1 overflow-hidden lg:ml-0">
          {main}
        </main>
      </div>
    );
  }

  // Desktop: Resizable sidebar
  return (
    <PanelGroup
      direction="horizontal"
      className={cn('h-full', className)}
      autoSaveId="documine-sidebar-view"
    >
      {/* Sidebar Panel - resizable */}
      <Panel
        ref={sidebarPanelRef}
        defaultSize={DEFAULT_SIDEBAR_SIZE}
        minSize={MIN_SIDEBAR_SIZE}
        maxSize={MAX_SIDEBAR_SIZE}
        className="min-w-0 overflow-hidden max-lg:hidden"
      >
        {sidebar}
      </Panel>

      {/* Resize Handle */}
      <SidebarResizeHandle onDoubleClick={handleDoubleClick} />

      {/* Main content area */}
      <Panel
        defaultSize={100 - DEFAULT_SIDEBAR_SIZE}
        minSize={50}
        className="min-w-0 overflow-hidden"
      >
        <main className="h-full overflow-hidden">
          {main}
        </main>
      </Panel>
    </PanelGroup>
  );
}

export interface DocumentChatSplitViewProps {
  documentViewer: React.ReactNode;
  chatPanel: React.ReactNode;
  className?: string;
}

/**
 * Horizontal Resize Handle Component
 *
 * AC-6.8.15: Draggable resize handle between panels (horizontal layout)
 * - Shows on hover with visual feedback
 * - Double-click to reset to default
 */
function HorizontalResizeHandle({
  className,
  onDoubleClick,
}: {
  className?: string;
  onDoubleClick?: () => void;
}) {
  return (
    <PanelResizeHandle
      className={cn(
        'group relative flex w-1.5 items-center justify-center',
        'bg-slate-200 hover:bg-primary/30 active:bg-primary/50',
        'transition-colors duration-150',
        'cursor-col-resize',
        className
      )}
      onDoubleClick={onDoubleClick}
    >
      {/* Visible grip indicator */}
      <div className="z-10 flex h-8 w-3 items-center justify-center rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="h-6 w-0.5 rounded-full bg-primary" />
      </div>
    </PanelResizeHandle>
  );
}

/**
 * Vertical Resize Handle Component
 *
 * AC-6.8.17: Resize handle for bottom-docked chat panel
 */
function VerticalResizeHandle({
  className,
  onDoubleClick,
}: {
  className?: string;
  onDoubleClick?: () => void;
}) {
  return (
    <PanelResizeHandle
      className={cn(
        'group relative flex h-1.5 items-center justify-center',
        'bg-slate-200 hover:bg-primary/30 active:bg-primary/50',
        'transition-colors duration-150',
        'cursor-row-resize',
        className
      )}
      onDoubleClick={onDoubleClick}
    >
      {/* Visible grip indicator */}
      <div className="z-10 flex w-8 h-3 items-center justify-center rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-6 h-0.5 rounded-full bg-primary" />
      </div>
    </PanelResizeHandle>
  );
}

// Default panel sizes (percentages)
const DEFAULT_DOCUMENT_SIZE_H = 65;
const DEFAULT_CHAT_SIZE_H = 35;
const DEFAULT_DOCUMENT_SIZE_V = 60;
const DEFAULT_CHAT_SIZE_V = 40;

/**
 * Document Chat Split View Component
 *
 * Creates a two-panel layout for document viewer + chat panel.
 * Implements AC-5.1.1: Split-view layout with document and chat side-by-side.
 * Implements AC-6.8.15: Resizable panels with persistence.
 * Implements AC-6.8.17: Dockable chat panel (right/bottom) with collapse.
 *
 * Layout structure:
 * - Document Viewer (min 40% width, flexible)
 * - Chat Panel (min ~300px, max ~600px equivalent in percentages)
 *
 * Responsive behavior:
 * - Desktop/Tablet (>768px): Resizable panels with persistence
 * - Mobile (<768px): Handled by parent with tabbed interface
 *
 * Features:
 * - Drag handles to resize panels
 * - Double-click handle to reset to default
 * - Persists user preference to localStorage
 * - Dockable to right (default) or bottom
 * - Collapsible chat panel
 */

/**
 * Floating restore button when chat panel is collapsed
 * Extracted to module level to prevent recreation on render.
 */
function CollapsedChatButton({
  position,
  onRestore,
}: {
  position: DockPosition;
  onRestore: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="default"
          size="icon"
          onClick={onRestore}
          className={cn(
            'fixed z-50 shadow-lg',
            position === 'bottom'
              ? 'bottom-4 right-4'
              : 'right-4 top-1/2 -translate-y-1/2'
          )}
          aria-label="Open chat panel"
        >
          {position === 'right' ? (
            <PanelRightOpen className="h-5 w-5" />
          ) : (
            <PanelBottomOpen className="h-5 w-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={position === 'right' ? 'left' : 'top'}>
        Open chat panel
      </TooltipContent>
    </Tooltip>
  );
}

export function DocumentChatSplitView({
  documentViewer,
  chatPanel,
  className,
}: DocumentChatSplitViewProps) {
  const isMobile = useIsMobile();
  const { position, isCollapsed, setCollapsed } = useChatDock();
  const chatPanelRef = useRef<ImperativePanelHandle>(null);
  // Use useSyncExternalStore for SSR-safe client detection (no setState in useEffect)
  const isClient = useSyncExternalStore(subscribeToNothing, getIsClient, getIsServer);

  // Double-click handler to reset to default sizes
  const handleDoubleClickH = useCallback(() => {
    if (chatPanelRef.current) {
      chatPanelRef.current.resize(DEFAULT_CHAT_SIZE_H);
    }
  }, []);

  const handleDoubleClickV = useCallback(() => {
    if (chatPanelRef.current) {
      chatPanelRef.current.resize(DEFAULT_CHAT_SIZE_V);
    }
  }, []);

  // Mobile: Single column (tabbed interface handled by parent)
  if (isMobile) {
    return (
      <div className={cn('h-full flex flex-col', className)}>
        <div className="flex-1 min-h-0 overflow-hidden">{documentViewer}</div>
      </div>
    );
  }

  // Desktop/Tablet: Resizable panels
  // Only render after client mount to avoid hydration mismatch
  if (!isClient) {
    return (
      <div className={cn('h-full flex', className)}>
        <div className="flex-1 min-w-0 overflow-hidden">{documentViewer}</div>
        <div className="w-[360px] min-w-0 overflow-hidden border-l border-slate-200">
          {chatPanel}
        </div>
      </div>
    );
  }

  // AC-6.8.17: Bottom dock layout
  if (position === 'bottom') {
    return (
      <>
        <PanelGroup
          direction="vertical"
          className={cn('h-full', className)}
          autoSaveId="documine-split-view-vertical"
        >
          {/* Document Viewer Panel - grows to fill space */}
          <Panel
            defaultSize={isCollapsed ? 100 : DEFAULT_DOCUMENT_SIZE_V}
            minSize={30}
            className="min-h-0 overflow-hidden"
          >
            {documentViewer}
          </Panel>

          {!isCollapsed && (
            <>
              {/* Vertical Resize Handle */}
              <VerticalResizeHandle onDoubleClick={handleDoubleClickV} />

              {/* Chat Panel - bottom docked */}
              <Panel
                ref={chatPanelRef}
                defaultSize={DEFAULT_CHAT_SIZE_V}
                minSize={20}
                maxSize={60}
                className="min-h-0 overflow-hidden border-t border-slate-200"
              >
                {chatPanel}
              </Panel>
            </>
          )}
        </PanelGroup>
        {/* Floating restore button when collapsed */}
        {isCollapsed && <CollapsedChatButton position={position} onRestore={() => setCollapsed(false)} />}
      </>
    );
  }

  // Default: Right dock layout (horizontal)
  return (
    <>
      <PanelGroup
        direction="horizontal"
        className={cn('h-full', className)}
        autoSaveId="documine-split-view"
      >
        {/* Document Viewer Panel - min 40%, grows to fill space */}
        <Panel
          defaultSize={isCollapsed ? 100 : DEFAULT_DOCUMENT_SIZE_H}
          minSize={40}
          className="min-w-0 overflow-hidden"
        >
          {documentViewer}
        </Panel>

        {!isCollapsed && (
          <>
            {/* Resize Handle - AC-6.8.15 */}
            <HorizontalResizeHandle onDoubleClick={handleDoubleClickH} />

            {/* Chat Panel - min ~20% (~300px at 1440px), max ~45% (~600px) */}
            <Panel
              ref={chatPanelRef}
              defaultSize={DEFAULT_CHAT_SIZE_H}
              minSize={20}
              maxSize={45}
              className="min-w-0 overflow-hidden border-l border-slate-200"
            >
              {chatPanel}
            </Panel>
          </>
        )}
      </PanelGroup>
      {/* Floating restore button when collapsed */}
      {isCollapsed && <CollapsedChatButton position={position} onRestore={() => setCollapsed(false)} />}
    </>
  );
}

/**
 * Document View Placeholder Component
 *
 * Placeholder for the document viewer panel.
 * Will be replaced with actual viewer in Epic 5.
 */
export function DocumentViewPlaceholder() {
  return (
    <div className="h-full flex items-center justify-center bg-slate-50 text-slate-500">
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="mt-4 text-sm">Select a document to view</p>
      </div>
    </div>
  );
}

/**
 * Chat Panel Placeholder Component
 *
 * Placeholder for the chat panel.
 * Will be implemented in Epic 5.
 */
export function ChatPanelPlaceholder() {
  return (
    <div className="h-full flex items-center justify-center bg-white border-l border-slate-200 text-slate-500">
      <div className="text-center px-4">
        <svg
          className="mx-auto h-12 w-12 text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="mt-4 text-sm">Chat with your document</p>
        <p className="mt-1 text-xs text-slate-400">Select a document to start chatting</p>
      </div>
    </div>
  );
}
