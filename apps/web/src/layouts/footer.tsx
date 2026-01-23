import { Config } from "@web/config/env";

function Footer() {
  return (
    <footer className="h-10 flex justify-center items-center border-t bg-background text-sm text-muted-foreground shrink-0">
      <p>© 2025 {Config.SERVICE_NAME}</p>
    </footer>
  );
}

export default Footer;
