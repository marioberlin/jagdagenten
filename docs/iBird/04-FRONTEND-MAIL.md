# iBird Frontend - Mail Module

## Component Hierarchy

```
MailModule/
├── MailSidebar/
│   ├── AccountList.tsx
│   ├── AccountItem.tsx
│   ├── FolderTree.tsx
│   ├── FolderItem.tsx
│   ├── QuickFilters.tsx
│   └── ComposeButton.tsx
├── MailList/
│   ├── MailListHeader.tsx
│   ├── MailListToolbar.tsx
│   ├── MessageList.tsx
│   ├── MessageRow.tsx
│   ├── ThreadGroup.tsx
│   └── MailListEmpty.tsx
├── MailDetail/
│   ├── MessageHeader.tsx
│   ├── MessageBody.tsx
│   ├── AttachmentList.tsx
│   ├── AttachmentItem.tsx
│   ├── ThreadView.tsx
│   └── QuickReplyBar.tsx
├── MailCompose/
│   ├── ComposeModal.tsx
│   ├── RecipientField.tsx
│   ├── SubjectField.tsx
│   ├── RichTextEditor.tsx
│   ├── AttachmentUploader.tsx
│   └── SendOptions.tsx
└── MailSearch/
    ├── SearchBar.tsx
    ├── SearchFilters.tsx
    └── SearchResults.tsx
```

---

## Core Components

### 1. MailModule.tsx

```typescript
// client/src/components/ibird/mail/MailModule.tsx

import { GlassContainer } from '@/components/ui/GlassContainer';
import { useMailStore } from '@/stores/ibird/mailStore';
import { MailSidebar } from './MailSidebar';
import { MailList } from './MailList';
import { MailDetail } from './MailDetail';
import { ComposeModal } from './ComposeModal';

export function MailModule() {
  const {
    selectedMessage,
    isComposeOpen,
    sidebarWidth,
    listWidth
  } = useMailStore();

  return (
    <div className="flex h-full">
      {/* Sidebar - Accounts & Folders */}
      <GlassContainer
        className="flex-shrink-0 border-r border-white/10"
        style={{ width: sidebarWidth }}
      >
        <MailSidebar />
      </GlassContainer>

      {/* Message List */}
      <GlassContainer
        className="flex-shrink-0 border-r border-white/10"
        style={{ width: listWidth }}
      >
        <MailList />
      </GlassContainer>

      {/* Message Detail / Reading Pane */}
      <GlassContainer className="flex-1 min-w-0">
        {selectedMessage ? (
          <MailDetail messageId={selectedMessage} />
        ) : (
          <MailEmptyState />
        )}
      </GlassContainer>

      {/* Compose Modal */}
      {isComposeOpen && <ComposeModal />}
    </div>
  );
}
```

---

### 2. MailSidebar Components

#### AccountList.tsx
```typescript
interface AccountListProps {
  accounts: MailAccount[];
  selectedAccountId: string | null;
  onSelectAccount: (id: string) => void;
}

export function AccountList({ accounts, selectedAccountId, onSelectAccount }: AccountListProps) {
  return (
    <div className="space-y-1 p-2">
      {accounts.map(account => (
        <AccountItem
          key={account.id}
          account={account}
          isSelected={account.id === selectedAccountId}
          onSelect={() => onSelectAccount(account.id)}
        />
      ))}
    </div>
  );
}
```

#### FolderTree.tsx
```typescript
interface FolderTreeProps {
  folders: MailFolder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string) => void;
  onContextMenu: (folder: MailFolder, e: React.MouseEvent) => void;
}

export function FolderTree({ folders, selectedFolderId, onSelectFolder, onContextMenu }: FolderTreeProps) {
  // Build nested structure from flat array
  const rootFolders = folders.filter(f => !f.parentId);

  return (
    <div className="space-y-0.5">
      {rootFolders.map(folder => (
        <FolderItem
          key={folder.id}
          folder={folder}
          allFolders={folders}
          depth={0}
          isSelected={folder.id === selectedFolderId}
          onSelect={onSelectFolder}
          onContextMenu={onContextMenu}
        />
      ))}
    </div>
  );
}
```

#### FolderItem.tsx
```typescript
interface FolderItemProps {
  folder: MailFolder;
  allFolders: MailFolder[];
  depth: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onContextMenu: (folder: MailFolder, e: React.MouseEvent) => void;
}

export function FolderItem({
  folder,
  allFolders,
  depth,
  isSelected,
  onSelect,
  onContextMenu
}: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const children = allFolders.filter(f => f.parentId === folder.id);
  const hasChildren = children.length > 0;

  const icon = getFolderIcon(folder.type); // inbox, sent, drafts, trash, spam, custom

  return (
    <div>
      <button
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm',
          'hover:bg-white/10 transition-colors',
          isSelected && 'bg-white/20 text-white',
          !isSelected && 'text-white/70'
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelect(folder.id)}
        onContextMenu={(e) => onContextMenu(folder, e)}
      >
        {hasChildren && (
          <ChevronIcon
            className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-90')}
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          />
        )}
        {!hasChildren && <span className="w-4" />}
        {icon}
        <span className="flex-1 text-left truncate">{folder.name}</span>
        {folder.unreadCount > 0 && (
          <span className="px-1.5 py-0.5 bg-blue-500/30 text-blue-200 text-xs rounded-full">
            {folder.unreadCount}
          </span>
        )}
      </button>

      {hasChildren && isExpanded && (
        <div>
          {children.map(child => (
            <FolderItem
              key={child.id}
              folder={child}
              allFolders={allFolders}
              depth={depth + 1}
              isSelected={child.id === isSelected}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 3. MailList Components

#### MessageList.tsx
```typescript
interface MessageListProps {
  messages: MailMessage[];
  threadView: boolean;
  selectedMessageId: string | null;
  onSelectMessage: (id: string) => void;
  onToggleStar: (id: string) => void;
  onToggleRead: (id: string) => void;
}

export function MessageList({
  messages,
  threadView,
  selectedMessageId,
  onSelectMessage,
  onToggleStar,
  onToggleRead
}: MessageListProps) {
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

  if (threadView) {
    const threads = groupMessagesIntoThreads(messages);
    return (
      <div ref={parentRef} className="h-full overflow-auto">
        {threads.map(thread => (
          <ThreadGroup
            key={thread.id}
            thread={thread}
            selectedMessageId={selectedMessageId}
            onSelectMessage={onSelectMessage}
          />
        ))}
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <MessageRow
            key={messages[virtualRow.index].id}
            message={messages[virtualRow.index]}
            isSelected={messages[virtualRow.index].id === selectedMessageId}
            style={{
              position: 'absolute',
              top: virtualRow.start,
              height: virtualRow.size,
            }}
            onSelect={() => onSelectMessage(messages[virtualRow.index].id)}
            onToggleStar={() => onToggleStar(messages[virtualRow.index].id)}
            onToggleRead={() => onToggleRead(messages[virtualRow.index].id)}
          />
        ))}
      </div>
    </div>
  );
}
```

#### MessageRow.tsx
```typescript
interface MessageRowProps {
  message: MailMessage;
  isSelected: boolean;
  style: React.CSSProperties;
  onSelect: () => void;
  onToggleStar: () => void;
  onToggleRead: () => void;
}

export function MessageRow({
  message,
  isSelected,
  style,
  onSelect,
  onToggleStar,
  onToggleRead
}: MessageRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-white/5',
        'hover:bg-white/5 transition-colors',
        isSelected && 'bg-white/10',
        !message.isRead && 'bg-blue-500/5'
      )}
      style={style}
      onClick={onSelect}
    >
      {/* Checkbox for bulk selection */}
      <input
        type="checkbox"
        className="w-4 h-4 rounded border-white/30"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Star */}
      <button
        className={cn(
          'w-5 h-5',
          message.isStarred ? 'text-yellow-400' : 'text-white/30 hover:text-white/50'
        )}
        onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
      >
        <StarIcon />
      </button>

      {/* Sender avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
        {message.from.name?.charAt(0) || message.from.email.charAt(0)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm truncate',
            !message.isRead ? 'font-semibold text-white' : 'text-white/80'
          )}>
            {message.from.name || message.from.email}
          </span>
          {message.hasAttachments && <PaperclipIcon className="w-3 h-3 text-white/50" />}
        </div>
        <div className={cn(
          'text-sm truncate',
          !message.isRead ? 'font-medium text-white/90' : 'text-white/70'
        )}>
          {message.subject}
        </div>
        <div className="text-xs text-white/50 truncate">
          {message.snippet}
        </div>
      </div>

      {/* Labels */}
      <div className="flex gap-1">
        {message.labels?.slice(0, 2).map(label => (
          <span
            key={label.id}
            className="px-1.5 py-0.5 text-xs rounded"
            style={{ backgroundColor: `${label.color}30`, color: label.color }}
          >
            {label.name}
          </span>
        ))}
      </div>

      {/* Date */}
      <span className="text-xs text-white/50 whitespace-nowrap">
        {formatMessageDate(message.receivedAt)}
      </span>
    </div>
  );
}
```

---

### 4. MailDetail Components

#### MessageHeader.tsx
```typescript
interface MessageHeaderProps {
  message: MailMessage;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onMarkSpam: () => void;
}

export function MessageHeader({
  message,
  onReply,
  onReplyAll,
  onForward,
  onDelete,
  onArchive,
  onMarkSpam
}: MessageHeaderProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="p-4 border-b border-white/10">
      {/* Subject */}
      <h1 className="text-xl font-semibold text-white mb-4">{message.subject}</h1>

      {/* Sender info */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
          {message.from.name?.charAt(0) || message.from.email.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{message.from.name}</span>
            <span className="text-sm text-white/50">&lt;{message.from.email}&gt;</span>
          </div>

          <button
            className="text-sm text-white/50 hover:text-white/70"
            onClick={() => setShowDetails(!showDetails)}
          >
            to {message.to.map(t => t.name || t.email).join(', ')}
            {showDetails ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>

          {showDetails && (
            <div className="mt-2 text-sm text-white/60 space-y-1">
              <div>From: {message.from.email}</div>
              <div>To: {message.to.map(t => t.email).join(', ')}</div>
              {message.cc?.length > 0 && (
                <div>Cc: {message.cc.map(c => c.email).join(', ')}</div>
              )}
              <div>Date: {formatFullDate(message.receivedAt)}</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <IconButton icon={<ReplyIcon />} tooltip="Reply" onClick={onReply} />
          <IconButton icon={<ReplyAllIcon />} tooltip="Reply All" onClick={onReplyAll} />
          <IconButton icon={<ForwardIcon />} tooltip="Forward" onClick={onForward} />
          <IconButton icon={<ArchiveIcon />} tooltip="Archive" onClick={onArchive} />
          <IconButton icon={<TrashIcon />} tooltip="Delete" onClick={onDelete} />
          <DropdownMenu>
            <DropdownItem onClick={onMarkSpam}>Mark as spam</DropdownItem>
            <DropdownItem onClick={() => {}}>Add label</DropdownItem>
            <DropdownItem onClick={() => {}}>Move to folder</DropdownItem>
            <DropdownItem onClick={() => {}}>Print</DropdownItem>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
```

#### MessageBody.tsx
```typescript
interface MessageBodyProps {
  message: MailMessage;
  showImages: boolean;
  onShowImages: () => void;
}

export function MessageBody({ message, showImages, onShowImages }: MessageBodyProps) {
  const hasBlockedImages = message.bodyHtml?.includes('src=') && !showImages;

  return (
    <div className="flex-1 overflow-auto p-4">
      {/* Remote images warning */}
      {hasBlockedImages && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3">
          <ImageOffIcon className="w-5 h-5 text-yellow-400" />
          <span className="text-sm text-yellow-200">
            Images are hidden for privacy.
          </span>
          <button
            className="text-sm text-yellow-400 hover:underline"
            onClick={onShowImages}
          >
            Show images
          </button>
        </div>
      )}

      {/* Message content */}
      {message.bodyHtml ? (
        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{
            __html: showImages
              ? message.bodyHtml
              : sanitizeHtml(message.bodyHtml, { blockImages: true })
          }}
        />
      ) : (
        <pre className="whitespace-pre-wrap text-white/80 font-sans">
          {message.bodyText}
        </pre>
      )}
    </div>
  );
}
```

---

### 5. ComposeModal Components

#### ComposeModal.tsx
```typescript
export function ComposeModal() {
  const {
    composeDraft,
    closeCompose,
    updateDraft,
    sendMessage,
    saveDraft,
    isSending
  } = useMailStore();

  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={cn(
        'fixed z-50 bg-gray-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl',
        isFullscreen
          ? 'inset-4'
          : isMinimized
            ? 'bottom-0 right-4 w-80 h-12'
            : 'bottom-4 right-4 w-[600px] h-[500px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="font-medium text-white">
          {composeDraft.replyTo ? 'Reply' : composeDraft.forwardFrom ? 'Forward' : 'New Message'}
        </span>
        <div className="flex items-center gap-1">
          <IconButton icon={<MinusIcon />} onClick={() => setIsMinimized(!isMinimized)} />
          <IconButton icon={<ExpandIcon />} onClick={() => setIsFullscreen(!isFullscreen)} />
          <IconButton icon={<XIcon />} onClick={closeCompose} />
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Recipients */}
          <div className="px-4 py-2 border-b border-white/5">
            <RecipientField
              label="To"
              value={composeDraft.to}
              onChange={(to) => updateDraft({ to })}
            />
            <RecipientField
              label="Cc"
              value={composeDraft.cc}
              onChange={(cc) => updateDraft({ cc })}
              collapsible
            />
            <RecipientField
              label="Bcc"
              value={composeDraft.bcc}
              onChange={(bcc) => updateDraft({ bcc })}
              collapsible
            />
          </div>

          {/* Subject */}
          <div className="px-4 py-2 border-b border-white/5">
            <input
              type="text"
              placeholder="Subject"
              value={composeDraft.subject}
              onChange={(e) => updateDraft({ subject: e.target.value })}
              className="w-full bg-transparent text-white placeholder-white/40 outline-none"
            />
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden">
            <RichTextEditor
              value={composeDraft.bodyHtml}
              onChange={(bodyHtml) => updateDraft({ bodyHtml })}
            />
          </div>

          {/* Attachments */}
          {composeDraft.attachments?.length > 0 && (
            <div className="px-4 py-2 border-t border-white/5">
              <AttachmentList
                attachments={composeDraft.attachments}
                onRemove={(id) => updateDraft({
                  attachments: composeDraft.attachments.filter(a => a.id !== id)
                })}
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <div className="flex items-center gap-2">
              <AttachmentUploader
                onUpload={(files) => updateDraft({
                  attachments: [...(composeDraft.attachments || []), ...files]
                })}
              />
              <IconButton icon={<LinkIcon />} tooltip="Insert link" />
              <IconButton icon={<EmojiIcon />} tooltip="Insert emoji" />
            </div>

            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 text-sm text-white/70 hover:text-white"
                onClick={saveDraft}
              >
                Save draft
              </button>
              <button
                className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2"
                onClick={sendMessage}
                disabled={isSending}
              >
                {isSending ? <Spinner className="w-4 h-4" /> : <SendIcon className="w-4 h-4" />}
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
```

#### RecipientField.tsx
```typescript
interface RecipientFieldProps {
  label: string;
  value: EmailAddress[];
  onChange: (value: EmailAddress[]) => void;
  collapsible?: boolean;
}

export function RecipientField({ label, value, onChange, collapsible }: RecipientFieldProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsible || value.length > 0);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Contact[]>([]);

  // Fetch contact suggestions as user types
  useEffect(() => {
    if (inputValue.length >= 2) {
      searchContacts(inputValue).then(setSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [inputValue]);

  const addRecipient = (contact: Contact | string) => {
    const newRecipient = typeof contact === 'string'
      ? { email: contact }
      : { email: contact.email, name: contact.name };

    if (!value.find(v => v.email === newRecipient.email)) {
      onChange([...value, newRecipient]);
    }
    setInputValue('');
    setSuggestions([]);
  };

  const removeRecipient = (email: string) => {
    onChange(value.filter(v => v.email !== email));
  };

  if (collapsible && !isExpanded) {
    return (
      <button
        className="text-sm text-white/50 hover:text-white/70"
        onClick={() => setIsExpanded(true)}
      >
        + {label}
      </button>
    );
  }

  return (
    <div className="flex items-start gap-2 py-1">
      <span className="text-sm text-white/50 w-8">{label}:</span>
      <div className="flex-1 flex flex-wrap items-center gap-1">
        {value.map((recipient) => (
          <span
            key={recipient.email}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full text-sm"
          >
            {recipient.name || recipient.email}
            <button
              className="w-4 h-4 hover:bg-white/20 rounded-full"
              onClick={() => removeRecipient(recipient.email)}
            >
              <XIcon className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputValue.includes('@')) {
              addRecipient(inputValue);
            }
          }}
          placeholder={value.length === 0 ? 'Add recipients...' : ''}
          className="flex-1 min-w-[120px] bg-transparent text-white text-sm outline-none"
        />
      </div>

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute mt-8 w-64 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-10">
          {suggestions.map((contact) => (
            <button
              key={contact.id}
              className="w-full px-3 py-2 text-left hover:bg-white/10 text-sm"
              onClick={() => addRecipient(contact)}
            >
              <div className="text-white">{contact.name}</div>
              <div className="text-white/50">{contact.email}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Utility Functions

```typescript
// client/src/utils/ibird/mail.ts

export function getFolderIcon(type: FolderType): ReactNode {
  const icons: Record<FolderType, ReactNode> = {
    inbox: <InboxIcon className="w-4 h-4" />,
    sent: <SendIcon className="w-4 h-4" />,
    drafts: <FileIcon className="w-4 h-4" />,
    trash: <TrashIcon className="w-4 h-4" />,
    spam: <AlertIcon className="w-4 h-4" />,
    archive: <ArchiveIcon className="w-4 h-4" />,
    custom: <FolderIcon className="w-4 h-4" />,
  };
  return icons[type] || icons.custom;
}

export function formatMessageDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return format(date, 'h:mm a'); // "3:45 PM"
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return format(date, 'EEE'); // "Mon"
  } else if (date.getFullYear() === now.getFullYear()) {
    return format(date, 'MMM d'); // "Jan 15"
  } else {
    return format(date, 'MM/dd/yy'); // "01/15/24"
  }
}

export function groupMessagesIntoThreads(messages: MailMessage[]): Thread[] {
  const threadMap = new Map<string, MailMessage[]>();

  for (const msg of messages) {
    const threadId = msg.threadId || msg.id;
    if (!threadMap.has(threadId)) {
      threadMap.set(threadId, []);
    }
    threadMap.get(threadId)!.push(msg);
  }

  return Array.from(threadMap.entries()).map(([id, msgs]) => ({
    id,
    messages: msgs.sort((a, b) =>
      new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
    ),
    subject: msgs[0].subject,
    latestDate: msgs[msgs.length - 1].receivedAt,
    unreadCount: msgs.filter(m => !m.isRead).length,
  }));
}

export function sanitizeHtml(html: string, options: { blockImages?: boolean }): string {
  // Use DOMPurify or similar library
  let sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li', 'blockquote', 'img', 'table', 'tr', 'td', 'th'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'style'],
  });

  if (options.blockImages) {
    sanitized = sanitized.replace(/<img[^>]+>/gi, '[Image blocked]');
  }

  return sanitized;
}
```

---

## Next Document

Continue to [05-FRONTEND-CALENDAR.md](./05-FRONTEND-CALENDAR.md) for Calendar module components.
