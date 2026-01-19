import { FileContainer } from "@web/features/file/file-container";
import { WebPushTestContainer } from "@web/features/web-push";

function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      <h1 className="text-2xl font-bold">Home Page</h1>

      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        <WebPushTestContainer />
        <FileContainer />
      </div>
    </div>
  );
}

export default HomePage;
