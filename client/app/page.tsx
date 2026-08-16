import FileUploadComponent from "./components/file-upload";
import ChatComponent from "./components/chat";

export default function Home() {
  return (
    <div className="flex h-full flex-col md:flex-row">
      <aside className="shrink-0 border-b bg-muted/30 p-4 md:h-full md:w-80 md:overflow-y-auto md:border-r md:border-b-0">
        <FileUploadComponent />
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ChatComponent />
      </section>
    </div>
  );
}
