export default function MessagesHome() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-cream px-8 text-center">
      <p className="font-serif text-[28px] italic leading-tight">Pick a chat to start.</p>
      <p className="mt-3 max-w-[320px] text-sm text-muted">
        Chats are between people who follow each other, so you only hear from people you&rsquo;ve chosen to connect with.
      </p>
    </div>
  );
}
