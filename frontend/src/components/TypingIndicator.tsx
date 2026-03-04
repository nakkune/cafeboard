interface TypingIndicatorProps {
  users: { id: number; nickname: string }[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  let text = '';
  if (users.length === 1) {
    text = `${users[0].nickname} is typing...`;
  } else if (users.length === 2) {
    text = `${users[0].nickname} and ${users[1].nickname} are typing...`;
  } else {
    text = `${users.length} people are typing...`;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
      </div>
      <span>{text}</span>
    </div>
  );
}
